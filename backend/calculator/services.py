import requests
import time
from datetime import datetime, timedelta, timezone as dt_timezone
from email.utils import parsedate_to_datetime
from django.utils import timezone
from .constants import RESOURCES, AODP_SERVERS

# In-memory fast L1 cache: key = f"{server}:{item_id}:{city}:{quality}", value = (timestamp, data)
PRICE_CACHE = {}
CACHE_TTL = 180  # 3 minutes L1 cache

# Offset between remote internet UTC clock (from AODP HTTP Date header) and local PC clock
INTERNET_CLOCK_OFFSET_SECONDS = 0.0


def sync_internet_clock(response=None):
    """
    Calibrates our UTC clock against the remote HTTP response 'Date' header from AODP/Cloudflare.
    Ensures that even if the user's Windows PC system date/clock is skewed by days or months,
    all price ages ('12 mins ago', '2 hrs ago') and 48h freshness filters remain 100% accurate.
    """
    global INTERNET_CLOCK_OFFSET_SECONDS
    if response is not None:
        try:
            date_hdr = response.headers.get('Date')
            if date_hdr:
                remote_dt = parsedate_to_datetime(date_hdr)
                if remote_dt.tzinfo is None:
                    remote_dt = remote_dt.replace(tzinfo=dt_timezone.utc)
                else:
                    remote_dt = remote_dt.astimezone(dt_timezone.utc)
                local_dt = datetime.now(dt_timezone.utc)
                INTERNET_CLOCK_OFFSET_SECONDS = (remote_dt - local_dt).total_seconds()
        except Exception:
            pass


def get_true_utc_now() -> datetime:
    """
    Returns true internet UTC time, corrected for any local PC system clock offset.
    """
    return datetime.now(dt_timezone.utc) + timedelta(seconds=INTERNET_CLOCK_OFFSET_SECONDS)


AODP_HISTORY_SERVERS = {
    'europe': 'https://europe.albion-online-data.com/api/v2/stats/history/',
    'west': 'https://west.albion-online-data.com/api/v2/stats/history/',
    'americas': 'https://west.albion-online-data.com/api/v2/stats/history/',
    'east': 'https://east.albion-online-data.com/api/v2/stats/history/',
    'asia': 'https://east.albion-online-data.com/api/v2/stats/history/',
}


def get_item_identifier(resource_type: str, tier: int, enchantment: int = 0, is_refined: bool = False) -> str:
    """
    Constructs the exact Albion item ID string.
    Example:
      T4 Hide flat -> T4_HIDE
      T4 Hide .1 -> T4_HIDE_LEVEL1@1
      T5 Leather .2 -> T5_LEATHER_LEVEL2@2
      T4 Stone Block -> T4_STONEBLOCK
    """
    res_info = RESOURCES.get(resource_type.lower())
    if not res_info:
        return ""

    prefix_template = res_info['refined_prefix'] if is_refined else res_info['raw_prefix']
    base_id = prefix_template.format(tier=tier)

    if is_refined and res_info.get('is_stone'):
        return base_id  # Refined stone blocks are always standard (no enchanted ID)

    if enchantment > 0 and res_info.get('max_enchantment', 4) > 0:
        return f"{base_id}_LEVEL{enchantment}@{enchantment}"
    return base_id


def parse_aodp_date(date_str: str):
    """
    Parses an AODP UTC ISO timestamp string and returns (clean_date_str, age_in_hours).
    Returns (None, 999999.0) if invalid or default year 0001/1970.
    Uses get_true_utc_now() so local PC clock skew never distorts price age.
    """
    if not date_str or not isinstance(date_str, str):
        return None, 999999.0
    if date_str.startswith('0001') or date_str.startswith('1970'):
        return None, 999999.0
    try:
        clean = date_str.rstrip('Z').split('.')[0]
        dt = datetime.fromisoformat(clean).replace(tzinfo=dt_timezone.utc)
        now = get_true_utc_now()
        age_hours = max(0.0, (now - dt).total_seconds() / 3600.0)
        return date_str, round(age_hours, 2)
    except Exception:
        return date_str, 999.0


def fetch_aodp_history_averages(item_ids: list, server: str = 'europe', locations: list = None, qualities: str = '1') -> dict:
    """
    Queries AODP's /api/v2/stats/history/ endpoint (time-scale=24) to get real completed
    trade averages and volume over the last 24-48 hours.
    Returns dict mapping f"{item_id}:{city}:{quality}" -> {'avg_price_24h': int, 'daily_volume': int}
    """
    if not item_ids:
        return {}

    server_key = str(server).lower()
    base_history_url = AODP_HISTORY_SERVERS.get(server_key, AODP_HISTORY_SERVERS['europe'])
    items_query = ",".join(item_ids[:50])
    params = {'time-scale': 24}
    if locations:
        params['locations'] = ",".join(locations)
    if qualities:
        params['qualities'] = str(qualities)

    url = f"{base_history_url}{items_query}.json"
    history_map = {}

    try:
        resp = requests.get(url, params=params, timeout=5)
        sync_internet_clock(resp)
        if resp.status_code == 200:
            records = resp.json()
            for rec in records:
                iid = rec.get('item_id')
                city = rec.get('location') or rec.get('city')
                qual = int(rec.get('quality', 1) or 1)
                data_points = rec.get('data', [])
                if not iid or not city or not data_points:
                    continue

                # Take the last 2 data buckets (most recent 24-48h of actual completed trades)
                recent_points = data_points[-2:]
                total_vol = sum(int(p.get('item_count', 0)) for p in recent_points)
                if total_vol > 0:
                    weighted_sum = sum(float(p.get('avg_price', 0)) * int(p.get('item_count', 0)) for p in recent_points)
                    avg_price = round(weighted_sum / total_vol)
                    daily_vol = round(total_vol / len(recent_points))
                    key = f"{iid}:{city}:{qual}"
                    history_map[key] = {
                        'avg_price_24h': avg_price,
                        'daily_volume': daily_vol,
                    }
    except Exception as e:
        print(f"AODP History API note: {e}")

    return history_map


def _save_to_db(server_key: str, parsed: dict, quality: int = 1):
    """
    Persists verified price data into SQLite (local) or PostgreSQL (Railway).
    Never raises an exception if migrations haven't been run yet.
    """
    try:
        from .models import MarketPriceSnapshot
        MarketPriceSnapshot.objects.update_or_create(
            server=server_key,
            item_id=parsed['item_id'],
            city=parsed['city'],
            quality=quality,
            defaults={
                'sell_price_min': parsed.get('sell_price_min', 0),
                'buy_price_max': parsed.get('buy_price_max', 0),
                'avg_price_24h': parsed.get('avg_price_24h', 0),
                'daily_volume': parsed.get('daily_volume', 0),
                'source': parsed.get('source', 'aodp_live'),
                'aodp_updated_at': parsed.get('updated_at'),
                'recorded_at': timezone.now(),
            }
        )
    except Exception:
        pass


def _load_from_db(server_key: str, item_id: str, city: str, quality: int = 1):
    """
    Loads the last known verified price from SQLite (local) or PostgreSQL (Railway)
    when AODP is unreachable or has no active listing.
    """
    try:
        from .models import MarketPriceSnapshot
        snap = MarketPriceSnapshot.objects.filter(
            server=server_key,
            item_id=item_id,
            city=city,
            quality=quality,
        ).first()
        if snap and (snap.sell_price_min > 0 or snap.avg_price_24h > 0):
            effective_sell = snap.sell_price_min if snap.sell_price_min > 0 else snap.avg_price_24h
            return {
                'item_id': item_id,
                'city': city,
                'quality': quality,
                'sell_price_min': effective_sell,
                'buy_price_max': snap.buy_price_max,
                'buy_max': snap.buy_price_max,
                'avg_price_24h': snap.avg_price_24h,
                'daily_volume': snap.daily_volume,
                'updated_at': snap.aodp_updated_at or snap.recorded_at.isoformat(),
                'source': f"db_{snap.source}",
                'age_hours': round((timezone.now() - snap.recorded_at).total_seconds() / 3600.0, 2),
            }
    except Exception:
        pass
    return None


def save_user_price_override(server: str, item_id: str, city: str, sell_price: int, buy_price: int = 0, quality: int = 1) -> dict:
    """
    Allows a player running locally (or on the web) to save an exact in-game market price
    directly into SQLite / PostgreSQL and L1 cache.
    """
    server_key = str(server).lower()
    now_iso = datetime.now(dt_timezone.utc).isoformat()
    parsed = {
        'item_id': item_id,
        'city': city,
        'quality': int(quality),
        'sell_price_min': int(sell_price),
        'buy_price_max': int(buy_price),
        'buy_max': int(buy_price),
        'avg_price_24h': int(sell_price),
        'daily_volume': 0,
        'updated_at': now_iso,
        'age_hours': 0.0,
        'source': 'user_override',
    }
    cache_key = f"{server_key}:{item_id}:{city}:{quality}"
    PRICE_CACHE[cache_key] = (time.time(), parsed)
    _save_to_db(server_key, parsed, quality=int(quality))
    return parsed


def fetch_aodp_prices(item_ids: list, server: str = 'europe', locations: list = None, qualities: str = '1', include_history: bool = True) -> dict:
    """
    Fetches real-time price data from Albion Online Data Project API with:
      1. Strict quality filtering (defaults to qualities='1' for resources, consumables, crops, journals)
      2. Timestamp freshness scoring (never lets a days-old price overwrite a fresh price)
      3. 24-Hour traded average & volume cross-check (/stats/history/) to sanitize manipulator outliers
      4. Dual SQLite / PostgreSQL database persistence & fallback
    """
    if not item_ids:
        return {}

    server_key = str(server).lower()
    base_url = AODP_SERVERS.get(server_key, AODP_SERVERS['europe'])

    target_locations = locations or ['Martlock', 'Thetford', 'Fort Sterling', 'Lymhurst', 'Bridgewatch', 'Caerleon']
    cached_results = {}
    current_time = time.time()

    # 1. Check L1 in-memory cache first
    all_cached = True
    for item_id in item_ids:
        for loc in target_locations:
            cache_key = f"{server_key}:{item_id}:{loc}:{qualities}"
            if cache_key in PRICE_CACHE:
                cached_time, data = PRICE_CACHE[cache_key]
                if current_time - cached_time < CACHE_TTL:
                    cached_results[f"{item_id}:{loc}"] = data
                    continue
            all_cached = False

    if all_cached and len(cached_results) >= len(item_ids) * len(target_locations):
        return cached_results

    # 2. Query AODP Spot Prices with explicit qualities filter
    items_query = ",".join(item_ids)
    params = {}
    if locations:
        params['locations'] = ",".join(locations)
    if qualities:
        params['qualities'] = str(qualities)

    url = f"{base_url}{items_query}.json"

    # 3. Query 24h Traded History in parallel/sequence for outlier protection
    history_map = {}
    if include_history:
        history_map = fetch_aodp_history_averages(
            item_ids=item_ids,
            server=server_key,
            locations=target_locations,
            qualities=qualities,
        )

    allowed_qualities = {int(q.strip()) for q in str(qualities).split(',') if q.strip().isdigit()} or {1}

    try:
        response = requests.get(url, params=params, timeout=6)
        sync_internet_clock(response)
        if response.status_code == 200:
            records = response.json()
            for rec in records:
                iid = rec.get('item_id')
                city = rec.get('city')
                if not iid or not city:
                    continue

                try:
                    qual = int(rec.get('quality', 1) or 1)
                except (ValueError, TypeError):
                    qual = 1

                # Enforce strict quality match so phantom quality slots never pollute prices
                if qual not in allowed_qualities:
                    continue

                sell_min = int(rec.get('sell_price_min', 0) or 0)
                buy_max = int(rec.get('buy_price_max', 0) or 0)

                sell_date, sell_age_hours = parse_aodp_date(rec.get('sell_price_min_date'))
                buy_date, buy_age_hours = parse_aodp_date(rec.get('buy_price_max_date'))

                # Discard prices with invalid year-0001 timestamps
                if not sell_date:
                    sell_min = 0
                if not buy_date or buy_age_hours > 48.0:
                    # Buy orders older than 48 hours are almost certainly filled or expired
                    buy_max = 0

                # Cross-check with 24h Traded History
                hist = history_map.get(f"{iid}:{city}:{qual}", {})
                avg_24h = hist.get('avg_price_24h', 0)
                daily_vol = hist.get('daily_volume', 0)
                source = 'aodp_live'
                is_outlier = False

                if avg_24h > 0:
                    if sell_min == 0 or sell_age_hours > 24.0:
                        # Spot price is missing or >24h old; use verified 24h traded average
                        sell_min = avg_24h
                        source = 'aodp_24h_avg'
                    elif sell_min > avg_24h * 3.0 or sell_min < avg_24h * 0.25:
                        # Manipulator spike or troll listing (>300% or <25% of real traded average)
                        is_outlier = True
                        sell_min = avg_24h
                        source = 'aodp_outlier_sanitized'

                dict_key = f"{iid}:{city}"
                cache_key = f"{server_key}:{iid}:{city}:{qualities}"

                existing = cached_results.get(dict_key)
                if not existing:
                    parsed = {
                        'item_id': iid,
                        'city': city,
                        'quality': qual,
                        'sell_price_min': sell_min,
                        'buy_price_max': buy_max,
                        'buy_max': buy_max,
                        'avg_price_24h': avg_24h,
                        'daily_volume': daily_vol,
                        'updated_at': sell_date or buy_date,
                        'age_hours': sell_age_hours if sell_date else buy_age_hours,
                        'source': source,
                        'is_outlier': is_outlier,
                    }
                    PRICE_CACHE[cache_key] = (current_time, parsed)
                    cached_results[dict_key] = parsed
                    if sell_min > 0 or buy_max > 0:
                        _save_to_db(server_key, parsed, quality=qual)
                else:
                    # Smart freshness-aware merge:
                    # Never let a stale listing (>6h older) overwrite a fresh listing!
                    existing_age = existing.get('age_hours', 999999.0)
                    if sell_min > 0:
                        is_much_fresher = (sell_age_hours + 3.0) < existing_age
                        is_similar_age_and_cheaper = (
                            abs(sell_age_hours - existing_age) <= 3.0
                            and (existing['sell_price_min'] == 0 or sell_min < existing['sell_price_min'])
                        )
                        if existing['sell_price_min'] == 0 or is_much_fresher or is_similar_age_and_cheaper:
                            existing['sell_price_min'] = sell_min
                            if sell_date:
                                existing['updated_at'] = sell_date
                                existing['age_hours'] = sell_age_hours
                            existing['source'] = source

                    if buy_max > existing.get('buy_price_max', 0):
                        existing['buy_price_max'] = buy_max
                        existing['buy_max'] = buy_max

                    if avg_24h > 0 and existing.get('avg_price_24h', 0) == 0:
                        existing['avg_price_24h'] = avg_24h
                        existing['daily_volume'] = daily_vol

                    PRICE_CACHE[cache_key] = (current_time, existing)
                    if existing['sell_price_min'] > 0 or existing['buy_price_max'] > 0:
                        _save_to_db(server_key, existing, quality=qual)
    except Exception as e:
        print(f"AODP API error: {e}")

    # 4. Cross-check with our shared Database (SQLite/PostgreSQL) & 24h History:
    #    If 1 user on our site scanned a fresher price into our DB, serve that fresher DB price to everyone!
    for item_id in item_ids:
        for loc in target_locations:
            dict_key = f"{item_id}:{loc}"
            rec = cached_results.get(dict_key)
            db_snap = _load_from_db(server_key, item_id, loc, quality=1)

            if db_snap and db_snap.get('sell_price_min', 0) > 0:
                if not rec or rec.get('sell_price_min', 0) == 0:
                    cached_results[dict_key] = db_snap
                    rec = db_snap
                elif db_snap.get('age_hours', 999999.0) + 0.1 < rec.get('age_hours', 999999.0):
                    # Our site's database has a fresher scan from a site user than AODP's current cache
                    cached_results[dict_key] = db_snap
                    rec = db_snap

            if not rec or rec.get('sell_price_min', 0) == 0:
                hist = history_map.get(f"{item_id}:{loc}:1", {})
                if hist.get('avg_price_24h', 0) > 0:
                    fallback = {
                        'item_id': item_id,
                        'city': loc,
                        'quality': 1,
                        'sell_price_min': hist['avg_price_24h'],
                        'buy_price_max': rec.get('buy_price_max', 0) if rec else 0,
                        'buy_max': rec.get('buy_max', 0) if rec else 0,
                        'avg_price_24h': hist['avg_price_24h'],
                        'daily_volume': hist.get('daily_volume', 0),
                        'updated_at': datetime.now(dt_timezone.utc).isoformat(),
                        'age_hours': 1.0,
                        'source': 'aodp_24h_avg',
                        'is_outlier': False,
                    }
                    cached_results[dict_key] = fallback
                    _save_to_db(server_key, fallback, quality=1)

    return cached_results
