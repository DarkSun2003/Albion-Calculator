import json
import os
import requests
from math import ceil

BASE_DIR = os.path.dirname(__file__)
CATALOG_PATH = os.path.join(BASE_DIR, 'data', 'generated_catalog.json')

with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
    RAW_CATALOG = json.load(f)

# Filter for Black Market eligible equipment
ELIGIBLE_ITEMS = [
    it for it in RAW_CATALOG
    if 'tool' not in it.get('category', '')
    and 'furniture' not in it.get('category', '')
    and 'bed' not in it['id']
    and 'chest' not in it['id']
    and 'table' not in it['id']
]

ITEMS_MAP = {it['id']: it for it in ELIGIBLE_ITEMS}

def get_blackmarket_catalog():
    categories = [
        {'id': 'all', 'label': 'All Equipment'},
        {'id': 'warrior', 'label': 'Warrior (Forgemaster)'},
        {'id': 'hunter', 'label': 'Hunter (Bowyer)'},
        {'id': 'mage', 'label': 'Mage (Arcanist)'},
        {'id': 'accessories', 'label': 'Bags & Capes'},
        {'id': 'gathering', 'label': 'Gathering Garb'},
    ]
    return {
        'items': ELIGIBLE_ITEMS,
        'categories': categories,
        'tiers': [4, 5, 6, 7, 8],
        'enchantments': [0, 1, 2, 3, 4],
    }

def format_aodp_id(template, tier, enchantment=0):
    base_id = template.replace('{tier}', str(tier))
    if enchantment > 0 and tier >= 4:
        return f"{base_id}@{enchantment}"
    return base_id

from .constants import AODP_SERVERS, ITEM_QUALITIES

def scan_blackmarket(params):
    """
    Scans live AODP market prices across Royal Cities and Black Market to uncover arbitrage spreads with quality awareness.
    """
    server = params.get('server', 'europe')
    tier = int(params.get('tier', 5))
    enchantment = int(params.get('enchantment', 0))
    category = params.get('category', 'all')
    min_profit = float(params.get('min_profit', 0))
    min_margin = float(params.get('min_margin', 0))
    sort_by = params.get('sort_by', 'profit') # 'profit', 'margin', 'density', 'cost'
    limit = max(1, min(100, int(params.get('limit', 50))))
    
    # Optional target quality filter (1=Normal, 2=Good, 3=Outstanding, 4=Excellent, 5=Masterpiece)
    target_quality = params.get('quality')
    if target_quality not in [None, '', 'all']:
        try:
            target_quality = int(target_quality)
        except (ValueError, TypeError):
            target_quality = None
    else:
        target_quality = None

    # Filter target catalog items
    targets = []
    for it in ELIGIBLE_ITEMS:
        if category != 'all' and it.get('category') != category:
            continue
        if tier < it.get('minTier', 4) or tier > it.get('maxTier', 8):
            continue
        if enchantment > 0 and not it.get('allowEnchantment', True):
            continue
        targets.append(it)

    if not targets:
        return {'results': [], 'totalScanned': 0}

    # Build AODP identifiers
    item_id_map = {}
    aodp_ids = []
    for it in targets:
        full_aodp_id = format_aodp_id(it['template'], tier, enchantment)
        item_id_map[full_aodp_id] = it
        aodp_ids.append(full_aodp_id)

    # Chunk requests to AODP if > 50 items
    chunk_size = 60
    price_records = []
    locations = "Black Market,Caerleon,Martlock,Lymhurst,Fort Sterling,Thetford,Bridgewatch"

    server_key = str(server).lower()
    base_api = AODP_SERVERS.get(server_key, AODP_SERVERS['europe'])

    for i in range(0, min(len(aodp_ids), 120), chunk_size):
        chunk = aodp_ids[i:i + chunk_size]
        url = f"{base_api}{','.join(chunk)}.json?locations={locations}"
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                price_records.extend(resp.json())
        except Exception:
            pass

    # Index prices by item_id, city, and quality:
    # prices_by_quality[item_id][city][quality] = { 'sell_min': X, 'buy_max': Y }
    prices_by_quality = {}
    for r in price_records:
        iid = r.get('item_id')
        city = r.get('city')
        if not iid or not city:
            continue
        qual = int(r.get('quality', 1))
        sell_min = r.get('sell_price_min', 0)
        buy_max = r.get('buy_price_max', 0)

        # Discard invalid year 1 dates
        s_date = r.get('sell_price_min_date')
        if s_date and (s_date.startswith('0001') or s_date.startswith('1970')):
            sell_min = 0

        if iid not in prices_by_quality:
            prices_by_quality[iid] = {}
        if city not in prices_by_quality[iid]:
            prices_by_quality[iid][city] = {}

        existing = prices_by_quality[iid][city].get(qual, {'sell_min': 0, 'buy_max': 0})
        if sell_min > 0 and (existing['sell_min'] == 0 or sell_min < existing['sell_min']):
            existing['sell_min'] = sell_min
        if buy_max > existing['buy_max']:
            existing['buy_max'] = buy_max
        prices_by_quality[iid][city][qual] = existing

    # Compute arbitrage spreads for each item across eligible qualities
    results = []
    royal_cities = ['Martlock', 'Lymhurst', 'Fort Sterling', 'Thetford', 'Bridgewatch', 'Caerleon']
    qualities_to_eval = [target_quality] if target_quality in [1, 2, 3, 4, 5] else [1, 2, 3, 4, 5]

    for aodp_id, it in item_id_map.items():
        item_cities = prices_by_quality.get(aodp_id, {})
        
        # Base item craft costs
        base_item_val = it.get('baseItemValue', 100)
        primary_qty = it.get('primaryQty', 16)
        secondary_qty = it.get('secondaryQty', 8)
        mat_tier_mult = (2 ** (tier - 4)) * (2 ** enchantment)
        est_primary_cost = primary_qty * 350 * mat_tier_mult * 0.75 # 24.8% RRR
        est_secondary_cost = secondary_qty * 350 * mat_tier_mult * 0.75
        base_craft_cost_est = round(est_primary_cost + est_secondary_cost + (base_item_val * 2))

        # Evaluate across requested qualities
        best_item_opportunity = None

        for q in qualities_to_eval:
            bm_data = item_cities.get('Black Market', {}).get(q, {'sell_min': 0, 'buy_max': 0})
            bm_buy_max = bm_data['buy_max']
            bm_sell_min = bm_data['sell_min']

            # Find best Royal City buy price for this quality
            royal_best_price = 0
            royal_best_city = 'Martlock'

            for rc in royal_cities:
                q_rec = item_cities.get(rc, {}).get(q)
                if q_rec and q_rec.get('sell_min', 0) > 0:
                    s_price = q_rec['sell_min']
                    if royal_best_price == 0 or s_price < royal_best_price:
                        royal_best_price = s_price
                        royal_best_city = rc

            # Craft cost scale for higher qualities
            quality_craft_mult = 1.0 if q <= 2 else (1.3 if q == 3 else (1.8 if q == 4 else 3.5))
            craft_cost_est = round(base_craft_cost_est * quality_craft_mult)

            # Effective acquisition cost: prefer actual Royal city market price, fallback to craft cost
            effective_cost = royal_best_price if royal_best_price > 0 else craft_cost_est
            acquisition_method = f"Buy in {royal_best_city}" if royal_best_price > 0 else f"Craft in {it.get('bonusCity', 'Royal City')}"

            # Standard market tax (4% premium + 2.5% sell order or direct sell)
            tax_multiplier = 0.935

            # Instant Sell to Black Market Buy Order
            instant_payout = round(bm_buy_max * tax_multiplier) if bm_buy_max > 0 else 0
            instant_profit = round(instant_payout - effective_cost) if instant_payout > 0 else 0
            instant_margin = round((instant_profit / effective_cost) * 100, 1) if (instant_payout > 0 and effective_cost > 0) else 0

            # Listed Sell Order on Black Market
            listed_payout = round(bm_sell_min * tax_multiplier) if bm_sell_min > 0 else 0
            listed_profit = round(listed_payout - effective_cost) if listed_payout > 0 else 0
            listed_margin = round((listed_profit / effective_cost) * 100, 1) if (listed_payout > 0 and effective_cost > 0) else 0

            # Best profit between instant and listed
            best_profit = max(instant_profit, listed_profit)
            best_margin = instant_margin if instant_profit >= listed_profit else listed_margin
            best_mode = 'Instant Buy Order' if instant_profit >= listed_profit and instant_profit > 0 else ('Listed Order' if listed_profit > 0 else 'None')

            # Filter criteria
            if best_profit < min_profit or best_margin < min_margin:
                continue

            # Cargo weight & density
            unit_weight = round(float(primary_qty + secondary_qty) * 0.15, 2)
            silver_per_kg = round(best_profit / unit_weight) if unit_weight > 0 and best_profit > 0 else 0

            qual_meta = ITEM_QUALITIES.get(q, {'name': 'Normal', 'color': 'slate', 'label': f'Quality {q}'})

            opp = {
                'id': it['id'],
                'aodpId': aodp_id,
                'name': it['name'],
                'tier': tier,
                'enchantment': enchantment,
                'quality': q,
                'qualityName': qual_meta['name'],
                'qualityLabel': qual_meta['label'],
                'qualityColor': qual_meta['color'],
                'category': it.get('category'),
                'subcategory': it.get('subcategory'),
                'icon': f"{it['template'].replace('{tier}', str(tier))}.png",
                'weightKg': unit_weight,
                'bonusCity': it.get('bonusCity'),
                'acquisition': {
                    'method': acquisition_method,
                    'city': royal_best_city if royal_best_price > 0 else it.get('bonusCity'),
                    'cost': effective_cost,
                    'quality': q,
                    'qualityName': qual_meta['name'],
                    'isMarketListing': royal_best_price > 0,
                },
                'blackMarket': {
                    'buyOrderMax': bm_buy_max,
                    'sellOrderMin': bm_sell_min,
                    'quality': q,
                    'qualityName': qual_meta['name'],
                    'instantPayout': instant_payout,
                    'listedPayout': listed_payout,
                },
                'spread': {
                    'instantProfit': instant_profit,
                    'instantMarginPct': instant_margin,
                    'listedProfit': listed_profit,
                    'listedMarginPct': listed_margin,
                    'bestProfit': best_profit,
                    'bestMarginPct': best_margin,
                    'bestMode': best_mode,
                    'silverPerKg': silver_per_kg,
                }
            }

            if not best_item_opportunity or best_profit > best_item_opportunity['spread']['bestProfit']:
                best_item_opportunity = opp

        if best_item_opportunity:
            results.append(best_item_opportunity)

    # Sort results
    if sort_by == 'margin':
        results.sort(key=lambda x: x['spread']['bestMarginPct'], reverse=True)
    elif sort_by == 'density':
        results.sort(key=lambda x: x['spread']['silverPerKg'], reverse=True)
    elif sort_by == 'cost':
        results.sort(key=lambda x: x['acquisition']['cost'])
    else: # profit
        results.sort(key=lambda x: x['spread']['bestProfit'], reverse=True)

    return {
        'results': results[:limit],
        'totalScanned': len(targets),
        'server': server,
        'tier': tier,
        'enchantment': enchantment,
    }

def calculate_haul(params):
    """
    Computes total investment, payout, cargo weight, and transport risk for a Black Market haul.
    """
    haul_items = params.get('items', [])
    if not haul_items:
        return {'items': [], 'totalCost': 0, 'totalPayout': 0, 'totalNetProfit': 0, 'totalWeightKg': 0}

    total_cost = 0
    total_payout = 0
    total_weight = 0
    analyzed_items = []

    for entry in haul_items:
        aodp_id = entry.get('aodpId')
        qty = max(1, int(entry.get('quantity', 1)))
        cost_per_unit = float(entry.get('cost', 10000))
        payout_per_unit = float(entry.get('payout', 25000))
        weight_per_unit = float(entry.get('weightKg', 2.0))

        sub_cost = round(cost_per_unit * qty)
        sub_payout = round(payout_per_unit * qty)
        sub_profit = sub_payout - sub_cost
        sub_weight = round(weight_per_unit * qty, 1)

        total_cost += sub_cost
        total_payout += sub_payout
        total_weight += sub_weight

        analyzed_items.append({
            'aodpId': aodp_id,
            'name': entry.get('name', aodp_id),
            'icon': entry.get('icon', f"{aodp_id.split('@')[0]}.png"),
            'quantity': qty,
            'costPerUnit': cost_per_unit,
            'payoutPerUnit': payout_per_unit,
            'subtotalCost': sub_cost,
            'subtotalPayout': sub_payout,
            'netProfit': sub_profit,
            'subtotalWeightKg': sub_weight,
        })

    total_net = total_payout - total_cost
    overall_margin = round((total_net / total_cost) * 100, 1) if total_cost > 0 else 0

    # Recommended Mount based on Total Weight
    if total_weight <= 150:
        recommended_mount = "T4 Riding Horse / Swiftclaw (Fast, High Mobility)"
        danger_risk = "Low Risk (Escape Agile)"
    elif total_weight <= 600:
        recommended_mount = "T5 Transport Ox / Spectral Direboar (Moderate Capacity)"
        danger_risk = "Moderate Risk (Decent Armor & HP)"
    elif total_weight <= 1800:
        recommended_mount = "T7 Transport Ox / Grizzly Bear (Heavy Armor & CC Resist)"
        danger_risk = "Elevated Risk (Requires Scouting & Escape Route)"
    else:
        recommended_mount = "T8 Transport Mammoth / Guild Caravan"
        danger_risk = "High Danger (Escort Team Recommended for Red Zone)"

    return {
        'items': analyzed_items,
        'totalCost': total_cost,
        'totalPayout': total_payout,
        'totalNetProfit': total_net,
        'overallMarginPct': overall_margin,
        'totalWeightKg': round(total_weight, 1),
        'recommendedMount': recommended_mount,
        'dangerRisk': danger_risk,
    }
