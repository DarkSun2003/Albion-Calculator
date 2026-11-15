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
    generalist_trophies = max(0, min(5, int(params.get('generalist_trophies', 0))))

    # Albion Online Happiness & Yield formula:
    # - Matching bed + table = 100% yield (100 * tier happiness)
    # - Higher-tier house (+beds/table) on lower-tier journal grants +100 happiness (+50% yield -> 150% max)
    # - Same-tier house: Profession trophy = +10 happiness (+5.0% yield), Generalist trophy = +5 happiness (+2.5% yield)
    # - Elder (T8) journal in Elder (T8) Player House caps at 142.5% (no T9 furniture; 7 prof + 3 generalist max)
    if not has_bed or not has_table:
        happiness_pct = 50.0
    elif house_tier > tier:
        happiness_pct = 150.0
    else:
        trophy_bonus = (trophies_count * 5.0) + (generalist_trophies * 2.5)
        raw_happiness = 100.0 + trophy_bonus
        max_cap = 142.5 if (tier == 8 and house_tier == 8) else 150.0
        happiness_pct = min(raw_happiness, max_cap)

    yield_multiplier = happiness_pct / 100.0

    # Journals market pricing
    full_jid = item_def['fullJournalId']
    empty_jid = item_def['emptyJournalId']

    full_jprice = float(market_prices.get(full_jid, 25000))
    empty_jprice = float(market_prices.get(empty_jid, 5000))

    journal_expense = round(laborer_count * full_jprice, 2)
    empty_journal_revenue = round(laborer_count * empty_jprice, 2)

    # Material returns (with T4+ enchanted rarity split 94.45% .0 / 5% .1 / 0.5% .2 / 0.05% .3)
    returned_materials = []
    total_material_revenue = 0.0
    taxable_material_revenue = 0.0

    for ret in item_def.get('returns', []):
        mat_item = ret['item']
        mat_name = ret['name']
        mat_icon = ret['icon']
        base_amt = ret['amount']

        units_per_laborer = round(base_amt * yield_multiplier, 2)
        total_units = round(units_per_laborer * laborer_count, 2)

        is_enchantable_return = (
            tier >= 4
            and mat_item != 'SILVER'
            and 'ROCK' not in mat_item
            and 'FISH' not in mat_item
        )

        if mat_item == 'SILVER':
            unit_price = 1.0
            mat_rev = round(total_units, 2)
            rarity_breakdown = None
        else:
            p0 = float(market_prices.get(mat_item, 500))
            if is_enchantable_return:
                p1 = float(market_prices.get(f"{mat_item}_LEVEL1@1") or market_prices.get(f"{mat_item}@1") or p0)
                p2 = float(market_prices.get(f"{mat_item}_LEVEL2@2") or market_prices.get(f"{mat_item}@2") or p0)
                p3 = float(market_prices.get(f"{mat_item}_LEVEL3@3") or market_prices.get(f"{mat_item}@3") or p0)
                unit_price = round((0.9445 * p0) + (0.05 * p1) + (0.005 * p2) + (0.0005 * p3), 2)
                rarity_breakdown = {
                    'flat': {'pct': 94.45, 'units': round(total_units * 0.9445, 2), 'price': p0},
                    'e1': {'pct': 5.0, 'units': round(total_units * 0.05, 2), 'price': p1},
                    'e2': {'pct': 0.5, 'units': round(total_units * 0.005, 2), 'price': p2},
                    'e3': {'pct': 0.05, 'units': round(total_units * 0.0005, 2), 'price': p3},
                }
            else:
                unit_price = p0
                rarity_breakdown = None
            mat_rev = round(total_units * unit_price, 2)
            taxable_material_revenue += mat_rev

        total_material_revenue += mat_rev
        returned_materials.append({
            'item': mat_item,
            'name': mat_name,
            'icon': mat_icon,
            'unitPrice': unit_price,
            'unitsPerLaborer': units_per_laborer,
            'totalUnits': total_units,
            'revenue': mat_rev,
            'hasEnchantedSplit': is_enchantable_return,
            'rarityBreakdown': rarity_breakdown,
        })

    gross_revenue = round(total_material_revenue + empty_journal_revenue, 2)

    # Market Tax (only applies to sold materials & empty journals — raw Silver returns are untaxed!)
    tax_rate = (0.04 if has_premium else 0.08) + (0.025 if is_sell_order else 0.0)
    taxable_gross_revenue = taxable_material_revenue + empty_journal_revenue
    market_tax = round(taxable_gross_revenue * tax_rate, 2)

    net_profit = round(gross_revenue - market_tax - journal_expense, 2)
    profit_per_laborer = round(net_profit / laborer_count, 2)
    profit_margin = round((net_profit / gross_revenue) * 100.0, 2) if gross_revenue > 0 else 0.0

    # Houses needed (T2: 1 laborer, T3-T4: 2 laborers, T5-T8: 3 laborers)
    laborers_per_house = 3 if house_tier >= 5 else (2 if house_tier >= 3 else 1)
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
            'generalistTrophies': generalist_trophies,
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
