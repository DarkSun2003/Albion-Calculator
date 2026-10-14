import json
import os

BASE_DIR = os.path.dirname(__file__)
CATALOG_PATH = os.path.join(BASE_DIR, 'data', 'generated_laborer_catalog.json')

with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
    RAW_CATALOG = json.load(f)

LABORERS_LIST = RAW_CATALOG.get('laborers', [])
PROFESSIONS_LIST = RAW_CATALOG.get('professions', [])
HOUSE_TIERS_LIST = RAW_CATALOG.get('houseTiers', [])

LABORERS_MAP = {it['id']: it for it in LABORERS_LIST}

def get_laborer_catalog():
    return {
        'laborers': LABORERS_LIST,
        'professions': PROFESSIONS_LIST,
        'houseTiers': HOUSE_TIERS_LIST,
    }

def calculate_laborers(params):
    """
    Authoritative calculation engine for Albion Online Laborers, Journals & Houses.
    """
    laborer_id = params.get('laborer_id', 'blacksmith_t5')
    item_def = LABORERS_MAP.get(laborer_id)
    if not item_def:
        item_def = LABORERS_LIST[0]
        laborer_id = item_def['id']

    tier = item_def['tier']
    house_tier = max(2, min(8, int(params.get('house_tier', max(tier, 5)))))
    laborer_count = max(1, int(params.get('laborer_count', 3)))

    has_premium = bool(params.get('has_premium', True))
    is_sell_order = bool(params.get('is_sell_order', True))
    market_prices = params.get('market_prices', {})

    # Furniture & Happiness parameters
    has_bed = bool(params.get('has_bed', True))
    has_table = bool(params.get('has_table', True))
    trophies_count = max(0, min(7, int(params.get('trophies_count', 3))))

    # Base Happiness calculation
    # Standard: matching bed + table = 100%
    # +10% per higher house tier
    # +5% per general trophy tier up to house tier
    if not has_bed or not has_table:
        happiness_pct = 50.0
    else:
        tier_diff = house_tier - tier
        tier_bonus = max(0, tier_diff * 10.0)
        trophy_bonus = trophies_count * 5.0
        # Optimal matching with trophies hits 150%
        raw_happiness = 100.0 + tier_bonus + trophy_bonus
        if tier == 8 and house_tier == 8:
            happiness_pct = min(142.5 + (trophies_count * 1.5), 150.0)
        else:
            happiness_pct = min(raw_happiness, 150.0)

    yield_multiplier = happiness_pct / 100.0

    # Journals market pricing
    full_jid = item_def['fullJournalId']
    empty_jid = item_def['emptyJournalId']

    full_jprice = float(market_prices.get(full_jid, 25000))
    empty_jprice = float(market_prices.get(empty_jid, 5000))

    journal_expense = round(laborer_count * full_jprice, 2)
    empty_journal_revenue = round(laborer_count * empty_jprice, 2)

    # Material returns
    returned_materials = []
    total_material_revenue = 0.0

    for ret in item_def.get('returns', []):
        mat_item = ret['item']
        mat_name = ret['name']
        mat_icon = ret['icon']
        base_amt = ret['amount']

        units_per_laborer = round(base_amt * yield_multiplier, 2)
        total_units = round(units_per_laborer * laborer_count, 1)

        if mat_item == 'SILVER':
            unit_price = 1.0
            mat_rev = round(total_units, 2)
        else:
            unit_price = float(market_prices.get(mat_item, 500))
            mat_rev = round(total_units * unit_price, 2)

        total_material_revenue += mat_rev
        returned_materials.append({
            'item': mat_item,
            'name': mat_name,
            'icon': mat_icon,
            'unitPrice': unit_price,
            'unitsPerLaborer': units_per_laborer,
            'totalUnits': total_units,
            'revenue': mat_rev,
        })

    gross_revenue = round(total_material_revenue + empty_journal_revenue, 2)

    # Market Tax (applied to sold materials & sold empty journals)
    tax_rate = (0.04 if has_premium else 0.08) + (0.025 if is_sell_order else 0.0)
    market_tax = round(gross_revenue * tax_rate, 2)

    net_profit = round(gross_revenue - market_tax - journal_expense, 2)
    profit_per_laborer = round(net_profit / laborer_count, 2)
    profit_margin = round((net_profit / gross_revenue) * 100.0, 2) if gross_revenue > 0 else 0.0

    # Houses needed
    laborers_per_house = 3 if house_tier >= 4 else (2 if house_tier == 3 else 1)
    houses_needed = -(-laborer_count // laborers_per_house) # ceiling division

    return {
        'laborer': item_def,
        'laborerCount': laborer_count,
        'houseTier': house_tier,
        'housesNeeded': houses_needed,
        'laborersPerHouse': laborers_per_house,
        'happiness': {
            'happinessPct': round(happiness_pct, 1),
            'yieldMultiplier': round(yield_multiplier, 3),
            'hasBed': has_bed,
            'hasTable': has_table,
            'trophiesCount': trophies_count,
        },
        'materials': returned_materials,
        'finances': {
            'materialRevenue': round(total_material_revenue, 2),
            'emptyJournalRevenue': empty_journal_revenue,
            'grossRevenue': gross_revenue,
            'journalExpense': journal_expense,
            'marketTax': market_tax,
            'netProfit': net_profit,
            'profitPerLaborer': profit_per_laborer,
            'profitMarginPct': profit_margin,
            'monthlyProjectedNet': round(net_profit * 30, 2),
        }
    }
