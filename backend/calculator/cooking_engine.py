import json
import math
import os
from typing import Dict, Any, Optional

BASE_DIR = os.path.dirname(__file__)
CATALOG_PATH = os.path.join(BASE_DIR, 'data', 'generated_food_catalog.json')

_FOOD_CATALOG: Optional[Dict[str, Any]] = None

def load_food_catalog() -> Dict[str, Any]:
    global _FOOD_CATALOG
    if _FOOD_CATALOG is None:
        with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
            items_list = json.load(f)
            _FOOD_CATALOG = {item['id']: item for item in items_list}
    return _FOOD_CATALOG


def get_food_item(item_id: str) -> Dict[str, Any]:
    catalog = load_food_catalog()
    if item_id not in catalog:
        raise ValueError(f"Food item '{item_id}' not found in food catalog.")
    return catalog[item_id]


def calculate_cooking_rrr(
    item_def: Dict[str, Any],
    city: str = 'Caerleon',
    use_focus: bool = False,
    daily_bonus_pct: float = 0.0
) -> float:
    """
    Calculates the Resource Return Rate (RRR) for food crafting.
    - Base island return: 0.0%
    - Base royal city return: 18.0%
    - Caerleon specialty bonus for Cooking: +15.0%
    - Daily bonus: +daily_bonus_pct%
    - Focus bonus: +59.0%
    Formula: total_bonus / (1.0 + total_bonus)
    """
    if not city:
        city = 'Caerleon'
        
    is_island = city.lower() == 'island'
    base_bonus = 0.0 if is_island else 0.18

    # Caerleon is the dedicated royal city for food crafting & butchery
    bonus_city = item_def.get('bonusCity', 'Caerleon')
    has_specialty = bool(bonus_city and city.lower() == str(bonus_city).lower() and not is_island)
    specialty_bonus = 0.15 if has_specialty else 0.0

    daily_bonus = (daily_bonus_pct or 0.0) / 100.0
    focus_bonus = 0.59 if use_focus else 0.0

    total_bonus = base_bonus + specialty_bonus + daily_bonus + focus_bonus
    return round(total_bonus / (1.0 + total_bonus), 6) if total_bonus > 0 else 0.0


def calculate_cooking_focus(base_focus: int, mastery: int = 0, spec: int = 0) -> int:
    """
    Calculates focus cost per craft batch.
    Chef Mastery (1-100): +30 efficiency/level
    Chef Specialization (1-100): +250 efficiency/level
    Formula: base_focus * (0.5 ** (efficiency / 10000.0))
    """
    if not base_focus or base_focus <= 0:
        return 0
    m = max(0, min(100, int(mastery or 0)))
    s = max(0, min(100, int(spec or 0)))
    efficiency = (m * 30) + (s * 250)
    actual_focus = base_focus * (0.5 ** (efficiency / 10000.0))
    return max(1, math.floor(actual_focus))


def calculate_cooking(
    item_id: str,
    enchantment: int = 0,
    batches: int = 1,
    ingredient_prices: Optional[Dict[str, float]] = None,
    item_sell_price: float = 0.0,
    city: str = 'Caerleon',
    use_focus: bool = False,
    daily_bonus_pct: float = 0.0,
    station_tax_per_100: float = 500.0,
    has_premium: bool = True,
    is_sell_order: bool = True,
    mastery_level: int = 0,
    spec_level: int = 0,
) -> Dict[str, Any]:
    """
    Calculates complete cooking financials, batch yields, ingredient refunds, and focus costs.
    """
    item_def = get_food_item(item_id)
    batch_count = max(1, int(batches or 1))
    ench = max(0, min(int(item_def.get('maxEnchantment', 0)), int(enchantment or 0)))
    prices = ingredient_prices or {}

    # 1. Resource Return Rate (RRR)
    rrr_current = calculate_cooking_rrr(item_def, city, use_focus, daily_bonus_pct)
    rrr_no_focus = calculate_cooking_rrr(item_def, city, False, daily_bonus_pct)

    # 2. Build active ingredients list (Base ingredients + Fish Sauce if enchanted)
    active_ingredients = []
    for ing in item_def.get('ingredients', []):
        active_ingredients.append({
            'uniqueName': ing['uniqueName'],
            'name': ing['name'],
            'countPerBatch': ing['count'],
            'noRefund': bool(ing.get('noRefund', False)),
            'icon': ing.get('icon', f"{ing['uniqueName']}.png")
        })

    # If enchanted, add fish sauce
    sauce_info = None
    if ench > 0:
        ench_data = item_def.get('enchantments', {}).get(str(ench))
        if ench_data and ench_data.get('sauce'):
            sauce_info = ench_data['sauce']
            active_ingredients.append({
                'uniqueName': sauce_info['uniqueName'],
                'name': sauce_info['name'],
                'countPerBatch': sauce_info['count'],
                'noRefund': False,  # Fish sauce is refunded by RRR in Albion Online cooking
                'icon': sauce_info.get('icon', f"{sauce_info['uniqueName']}.png")
            })

    # 3. Calculate materials consumption, gross costs, and refunds
    breakdown = []
    upfront_materials_cost = 0.0
    net_materials_cost = 0.0

    for ing in active_ingredients:
        uname = ing['uniqueName']
        unit_price = float(prices.get(uname, 0.0))
        gross_needed = ing['countPerBatch'] * batch_count
        
        # In cooking, Avalonian energy is not refunded (noRefund = True)
        is_refundable = not ing['noRefund']
        ing_rrr = rrr_current if is_refundable else 0.0
        
        returned = gross_needed * ing_rrr
        net_consumed = gross_needed - returned
        
        gross_cost = gross_needed * unit_price
        net_cost = net_consumed * unit_price
        
        upfront_materials_cost += gross_cost
        net_materials_cost += net_cost

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

    # 4. Station fee (Nutrition tax)
    # Albion cook stations charge: nutrition * (station_tax_per_100 / 100.0) per craft batch
    nutrition_per_batch = float(item_def.get('nutrition', 0.0) or 0.0)
    station_tax_rate = float(station_tax_per_100 or 0.0) / 100.0
    station_fee = nutrition_per_batch * station_tax_rate * batch_count

    # 5. Focus Cost
    base_focus = item_def.get('baseFocus', 0)
    if ench > 0:
        ench_data = item_def.get('enchantments', {}).get(str(ench))
        if ench_data and 'focus' in ench_data:
            base_focus = ench_data['focus']
            
    focus_per_batch = calculate_cooking_focus(base_focus, mastery_level, spec_level)
    total_focus_used = focus_per_batch * batch_count if use_focus else 0

    # 6. Production & Financials
    amount_per_batch = item_def.get('amountCrafted', 1)
    total_units_produced = amount_per_batch * batch_count

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
        # Calculate profit without focus to find pure focus value delta
        profit_no_focus = calculate_cooking(
            item_id=item_id,
            enchantment=ench,
            batches=batch_count,
            ingredient_prices=prices,
            item_sell_price=item_sell_price,
            city=city,
            use_focus=False,
            daily_bonus_pct=daily_bonus_pct,
            station_tax_per_100=station_tax_per_100,
            has_premium=has_premium,
            is_sell_order=is_sell_order,
            mastery_level=mastery_level,
            spec_level=spec_level
        )['financials']['netProfit']
        focus_profit_delta = net_profit - profit_no_focus
        silver_per_focus = round(focus_profit_delta / total_focus_used, 2)

    return {
        'item': {
            'id': item_def['id'],
            'uniqueName': item_def['uniqueName'],
            'name': item_def['name'],
            'tier': item_def['tier'],
            'enchantment': ench,
            'subcategory': item_def['subcategory'],
            'isAvalonian': item_def.get('isAvalonian', False),
            'isDragon': item_def.get('isDragon', False),
            'isFishMeal': item_def.get('isFishMeal', False),
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
            'hasCitySpecialty': bool(item_def.get('bonusCity', 'Caerleon').lower() == city.lower() and city.lower() != 'island'),
            'city': city,
            'bonusCity': item_def.get('bonusCity', 'Caerleon'),
        },
        'focus': {
            'useFocus': use_focus,
            'baseFocus': base_focus,
            'focusPerBatch': focus_per_batch,
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
