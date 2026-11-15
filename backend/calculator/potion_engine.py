import json
import math
import os
from typing import Dict, Any, Optional
from .constants import compute_total_rrr

BASE_DIR = os.path.dirname(__file__)
CATALOG_PATH = os.path.join(BASE_DIR, 'data', 'generated_potion_catalog.json')

_POTION_CATALOG: Optional[Dict[str, Any]] = None

def load_potion_catalog() -> Dict[str, Any]:
    global _POTION_CATALOG
    if _POTION_CATALOG is None:
        with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
            items_list = json.load(f)
            _POTION_CATALOG = {item['id']: item for item in items_list}
    return _POTION_CATALOG


def get_potion_item(item_id: str) -> Dict[str, Any]:
    catalog = load_potion_catalog()
    if item_id not in catalog:
        raise ValueError(f"Potion item '{item_id}' not found in potion catalog.")
    return catalog[item_id]


def calculate_potion_rrr(
    item_def: Dict[str, Any],
    city: str = 'Brecilien',
    use_focus: bool = False,
    daily_bonus_pct: float = 0.0,
    location_mode: str = 'city',
    ho_power_level: int = 1,
    ho_zone_quality: int = 1,
    ho_has_specialty: bool = False,
    ho_custom_bonus_pct: float = None,
) -> float:
    """
    Calculates the Resource Return Rate (RRR) for potion brewing / alchemy (City, Island, or Hideout).
    """
    if not city:
        city = 'Brecilien'

    is_island = city.lower() == 'island'
    base_bonus = 0.0 if is_island else 0.18

    bonus_city = item_def.get('bonusCity', 'Brecilien')
    has_specialty = bool(bonus_city and city.lower() == str(bonus_city).lower() and not is_island)
    specialty_bonus = 0.15 if has_specialty else 0.0

    return compute_total_rrr(
        base_city_bonus=base_bonus,
        city_specialty_bonus=specialty_bonus,
        daily_bonus_pct=daily_bonus_pct,
        use_focus=use_focus,
        location_mode=location_mode,
        ho_power_level=ho_power_level,
        ho_zone_quality=ho_zone_quality,
        ho_has_specialty=ho_has_specialty,
        ho_custom_bonus_pct=ho_custom_bonus_pct,
        specialty_mode='potion',
    )


def calculate_potion_focus(base_focus: int, mastery: int = 0, spec: int = 0, other_spec_avg: int = 0, is_rare: bool = False) -> int:
    """
    Calculates focus cost per craft batch using Dragonfire Update (16-node Alchemist tree).
    - Alchemist Mastery (1-100): +30 efficiency/level (3,000 max)
    - Target Potion Specialization (1-100): +250 unique/level + own mutual (+22.5 simple/Bootlegger, +11.25 rare/Lifeward)
    - Other 15 Potion Specializations (1-100): +22.5/lvl each for simple+Bootlegger (8 nodes), +11.25/lvl for rare+Lifeward (8 nodes)
      -> Total max mutual efficiency across all 16 nodes = (8*22.5 + 8*11.25)*100 = 27,000
      -> Total max efficiency (1600/1600) = 3,000 + 25,000 + 27,000 = 55,000 (~2.21% of base focus).
    Formula: base_focus * (0.5 ** (efficiency / 10000.0))
    """
    if not base_focus or base_focus <= 0:
        return 0
    m = max(0, min(100, int(mastery or 0)))
    s = max(0, min(100, int(spec or 0)))
    oth = max(0, min(100, int(other_spec_avg or 0)))
    own_mutual = 11.25 if is_rare else 22.5
    other_mutual_sum = 270.0 - own_mutual
    efficiency = (m * 30.0) + (s * (250.0 + own_mutual)) + (oth * other_mutual_sum)
    actual_focus = base_focus * (0.5 ** (efficiency / 10000.0))
    return max(1, math.floor(actual_focus + 0.5))


def calculate_potions(
    item_id: str,
    enchantment: int = 0,
    batches: int = 1,
    ingredient_prices: Optional[Dict[str, float]] = None,
    item_sell_price: float = 0.0,
    city: str = 'Brecilien',
    use_focus: bool = False,
    daily_bonus_pct: float = 0.0,
    station_tax_per_100: float = 500.0,
    has_premium: bool = True,
    is_sell_order: bool = True,
    mastery_level: int = 0,
    spec_level: int = 0,
    other_spec_avg: int = 0,
    location_mode: str = 'city',
    ho_power_level: int = 1,
    ho_zone_quality: int = 1,
    ho_has_specialty: bool = False,
    ho_custom_bonus_pct: float = None,
) -> Dict[str, Any]:
    """
    Calculates complete alchemy financials, batch yields, ingredient refunds, and focus costs.
    """
    item_def = get_potion_item(item_id)
    batch_count = max(1, int(batches or 1))
    ench = max(0, min(int(item_def.get('maxEnchantment', 0)), int(enchantment or 0)))
    prices = ingredient_prices or {}

    # 1. Resource Return Rate (RRR)
    rrr_current = calculate_potion_rrr(
        item_def, city, use_focus, daily_bonus_pct,
        location_mode, ho_power_level, ho_zone_quality, ho_has_specialty, ho_custom_bonus_pct,
    )
    rrr_no_focus = calculate_potion_rrr(
        item_def, city, False, daily_bonus_pct,
        location_mode, ho_power_level, ho_zone_quality, ho_has_specialty, ho_custom_bonus_pct,
    )

    # 2. Build active ingredients list (Base ingredients + Arcane Extract if enchanted)
    active_ingredients = []
    for ing in item_def.get('ingredients', []):
        active_ingredients.append({
            'uniqueName': ing['uniqueName'],
            'name': ing['name'],
            'countPerBatch': ing['count'],
            'noRefund': bool(ing.get('noRefund', False)),
            'icon': ing.get('icon', f"{ing['uniqueName']}.png")
        })

    # If enchanted, add Arcane Extract
    extract_info = None
    if ench > 0:
        ench_data = item_def.get('enchantments', {}).get(str(ench))
        if ench_data and ench_data.get('extract'):
            extract_info = ench_data['extract']
            active_ingredients.append({
                'uniqueName': extract_info['uniqueName'],
                'name': extract_info['name'],
                'countPerBatch': extract_info['count'],
                'noRefund': False,  # Arcane extracts are refunded by RRR in potion crafting
                'icon': extract_info.get('icon', f"{extract_info['uniqueName']}.png")
            })

    # 3. Calculate materials consumption, gross costs, and refunds
    breakdown = []
    upfront_materials_cost = 0.0
    net_materials_cost = 0.0
    net_materials_cost_no_focus = 0.0

    for ing in active_ingredients:
        uname = ing['uniqueName']
        unit_price = float(prices.get(uname, 0.0))
        gross_needed = ing['countPerBatch'] * batch_count
        
        is_refundable = not ing['noRefund']
        ing_rrr = rrr_current if is_refundable else 0.0
        ing_rrr_no_focus = rrr_no_focus if is_refundable else 0.0
        
        returned = gross_needed * ing_rrr
        net_consumed = gross_needed - returned
        
        gross_cost = gross_needed * unit_price
        net_cost = net_consumed * unit_price
        net_cost_no_focus = (gross_needed - (gross_needed * ing_rrr_no_focus)) * unit_price
        
        upfront_materials_cost += gross_cost
        net_materials_cost += net_cost
        net_materials_cost_no_focus += net_cost_no_focus

        breakdown.append({
            'uniqueName': uname,
            'name': ing['name'],
            'icon': ing['icon'],
            'unitPrice': unit_price,
            'countPerBatch': ing['countPerBatch'],
            'grossNeeded': gross_needed,
            'returned': round(returned, 2),
            'netConsumed': round(net_consumed, 2),
            'grossCost': round(gross_cost, 2),
            'netCost': round(net_cost, 2),
            'isRefundable': is_refundable,
        })

    # 4. Station fee (Alchemist Lab Nutrition tax — Tier <= 2 exempt in Albion Online)
    item_tier = int(item_def.get('tier', 1) or 1)
    nutrition_per_batch = float(item_def.get('nutrition', 0.0) or 0.0)
    station_tax_rate = float(station_tax_per_100 or 0.0) / 100.0
    station_fee = 0.0 if item_tier <= 2 else (nutrition_per_batch * station_tax_rate * batch_count)

    # 5. Production & Focus Cost
    amount_per_batch = item_def.get('amountCrafted', 5)
    total_units_produced = amount_per_batch * batch_count

    base_focus = item_def.get('baseFocus', 0)
    if ench > 0:
        ench_data = item_def.get('enchantments', {}).get(str(ench))
        if ench_data and 'focus' in ench_data:
            base_focus = ench_data['focus']
            
    focus_per_batch = calculate_potion_focus(
        base_focus,
        mastery_level,
        spec_level,
        other_spec_avg,
        is_rare=bool(item_def.get('isRare', False)),
    )
    total_focus_used = focus_per_batch * batch_count if use_focus else 0
    focus_per_unit = round(focus_per_batch / max(1, amount_per_batch), 2) if amount_per_batch > 0 else focus_per_batch

    # 6. Financials

    gross_revenue = total_units_produced * float(item_sell_price or 0.0)
    market_tax_rate = 0.04 if has_premium else 0.08
    setup_fee_rate = 0.025 if is_sell_order else 0.0
    total_market_tax = gross_revenue * (market_tax_rate + setup_fee_rate)
    net_revenue = gross_revenue - total_market_tax

    total_cost = net_materials_cost + station_fee
    net_profit = net_revenue - total_cost

    profit_margin_pct = (net_profit / total_cost * 100.0) if total_cost > 0 else 0.0
    profit_per_batch = net_profit / batch_count
    profit_per_unit = net_profit / total_units_produced if total_units_produced > 0 else 0.0

    # Silver Per Focus (SPF) calculation
    silver_per_focus = 0.0
    if use_focus and total_focus_used > 0:
        focus_profit_delta = net_materials_cost_no_focus - net_materials_cost
        silver_per_focus = round(focus_profit_delta / total_focus_used, 2)

    is_hideout = str(location_mode or 'city').lower() == 'hideout'

    return {
        'item': {
            'id': item_def['id'],
            'uniqueName': item_def['uniqueName'],
            'name': item_def['name'],
            'tier': item_def['tier'],
            'enchantment': ench,
            'subcategory': item_def['subcategory'],
            'isRare': item_def.get('isRare', False),
            'isIntermediate': item_def.get('isIntermediate', False),
            'amountCrafted': amount_per_batch,
            'icon': f"{item_def['uniqueName']}@{ench}.png" if ench > 0 else f"{item_def['uniqueName']}.png",
        },
        'batch': {
            'batchCount': batch_count,
            'unitsPerBatch': amount_per_batch,
            'totalUnitsProduced': total_units_produced,
        },
        'rates': {
            'rrrCurrent': rrr_current,
            'rrrCurrentPct': round(rrr_current * 100, 2),
            'rrrNoFocus': rrr_no_focus,
            'rrrNoFocusPct': round(rrr_no_focus * 100, 2),
            'hasCitySpecialty': bool(item_def.get('bonusCity', 'Brecilien').lower() == city.lower() and city.lower() != 'island' and not is_hideout),
            'city': city,
            'bonusCity': item_def.get('bonusCity', 'Brecilien'),
            'locationMode': 'hideout' if is_hideout else 'city',
        },
        'focus': {
            'useFocus': use_focus,
            'baseFocus': base_focus,
            'focusPerBatch': focus_per_batch,
            'focusPerUnit': focus_per_unit,
            'totalFocusUsed': total_focus_used,
            'silverPerFocus': silver_per_focus,
        },
        'materials': {
            'upfrontCost': round(upfront_materials_cost, 2),
            'netCost': round(net_materials_cost, 2),
            'breakdown': breakdown,
        },
        'fees': {
            'nutritionPerBatch': nutrition_per_batch,
            'totalNutrition': nutrition_per_batch * batch_count,
            'stationFee': round(station_fee, 2),
        },
        'financials': {
            'grossRevenue': round(gross_revenue, 2),
            'marketTaxes': round(total_market_tax, 2),
            'netRevenue': round(net_revenue, 2),
            'totalCost': round(total_cost, 2),
            'netProfit': round(net_profit, 2),
            'profitPerBatch': round(profit_per_batch, 2),
            'profitPerUnit': round(profit_per_unit, 2),
            'profitMarginPct': round(profit_margin_pct, 2),
        }
    }
