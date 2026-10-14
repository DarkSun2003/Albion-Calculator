import requests
import time
from .constants import RESOURCES, AODP_SERVERS

# In-memory price cache: key = f"{server}:{item_id}:{city}", value = (timestamp, data)
PRICE_CACHE = {}
CACHE_TTL = 180  # Cache for 3 minutes

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


def fetch_aodp_prices(item_ids: list, server: str = 'europe', locations: list = None) -> dict:
    """
    Fetches real-time price data from Albion Online Data Project API.
    Returns a dict mapping (item_id, city) -> {'sell_price_min': X, 'buy_price_max': Y, 'updated_at': ...}
    """
    server_key = server.lower()
    base_url = AODP_SERVERS.get(server_key, AODP_SERVERS['europe'])
    
    items_query = ",".join(item_ids)
    params = {}
    if locations:
        params['locations'] = ",".join(locations)
        
    url = f"{base_url}{items_query}.json"
    
    # Check cache first
    cached_results = {}
    missing_items = []
    current_time = time.time()
    
    target_locations = locations or ['Martlock', 'Thetford', 'Fort Sterling', 'Lymhurst', 'Bridgewatch', 'Caerleon']

    for item_id in item_ids:
        for loc in target_locations:
            cache_key = f"{server_key}:{item_id}:{loc}"
            if cache_key in PRICE_CACHE:
                cached_time, data = PRICE_CACHE[cache_key]
                if current_time - cached_time < CACHE_TTL:
                    cached_results[f"{item_id}:{loc}"] = data
                    continue
            missing_items.append(item_id)
            
    # If all found in cache, return immediately
    if len(cached_results) >= len(item_ids) * len(target_locations):
        return cached_results
        
    try:
        response = requests.get(url, params=params, timeout=6)
        if response.status_code == 200:
            records = response.json()
            for rec in records:
                iid = rec.get('item_id')
                city = rec.get('city')
                if not iid or not city:
                    continue

                sell_min = rec.get('sell_price_min', 0)
                buy_max = rec.get('buy_price_max', 0)
                updated_at = rec.get('sell_price_min_date')

                # Discard invalid default dates from year 1
                if updated_at and (updated_at.startswith('0001') or updated_at.startswith('1970')):
                    updated_at = None

                dict_key = f"{iid}:{city}"
                cache_key = f"{server_key}:{iid}:{city}"

                existing = cached_results.get(dict_key)
                if not existing:
                    parsed = {
                        'item_id': iid,
                        'city': city,
                        'sell_price_min': sell_min,
                        'buy_max': buy_max,
                        'updated_at': updated_at,
                    }
                    PRICE_CACHE[cache_key] = (current_time, parsed)
                    cached_results[dict_key] = parsed
                else:
                    # Only replace sell price if incoming is positive and (existing was 0 or incoming is lower)
                    if sell_min > 0 and (existing['sell_price_min'] == 0 or sell_min < existing['sell_price_min']):
                        existing['sell_price_min'] = sell_min
                        if updated_at:
                            existing['updated_at'] = updated_at
                    # Keep the higher buy order
                    if buy_max > existing.get('buy_max', 0):
                        existing['buy_max'] = buy_max
                    PRICE_CACHE[cache_key] = (current_time, existing)
    except Exception as e:
        print(f"AODP API error: {e}")
        
    return cached_results
