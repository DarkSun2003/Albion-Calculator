import math
from .constants import (
    RESOURCES,
    CITY_PRODUCTION_BONUSES,
    RAW_PER_TIER,
    BASE_FOCUS_COST,
    ENCHANTMENT_FOCUS_MULTIPLIER,
    BASE_ITEM_VALUES,
    TAX_PREMIUM,
    TAX_NON_PREMIUM,
    ORDER_SETUP_FEE,
    STONE_ENCHANTMENT_YIELD,
)

def calculate_return_rate(resource_type: str, city: str, use_focus: bool = False, daily_bonus_pct: float = 0.0) -> float:
    """
    Calculates Resource Return Rate (RRR) based on production bonuses.
    Formula: RRR = Bonus / (1.0 + Bonus)
    """
    is_island = city.lower() == 'island' or CITY_PRODUCTION_BONUSES.get(city, {}).get('is_island', False)
    
    # Base production bonus: 0 on island, 18% (0.18) in Royal cities
    base_bonus = 0.0 if is_island else 0.18
    
    # City specialty bonus (+40% if city matches resource)
    city_bonus = CITY_PRODUCTION_BONUSES.get(city, {}).get(resource_type.lower(), 0.0)
    
    # Daily event bonus (e.g. 10% or 20%)
    daily_bonus = (daily_bonus_pct or 0.0) / 100.0
    
    # Focus bonus (+59%)
    focus_bonus = 0.59 if use_focus else 0.0
    
    total_bonus = base_bonus + city_bonus + daily_bonus + focus_bonus
    
    rrr = total_bonus / (1.0 + total_bonus) if total_bonus > 0 else 0.0
    return round(rrr, 6)


def calculate_focus_efficiency(mastery: int, spec_levels: dict, current_tier: int) -> int:
    """
    Calculates total focus efficiency points for a specific tier.
    - Mastery (1-100) gives +30 efficiency to all tiers.
    - Spec for current tier gives +250 efficiency per level.
    - Spec for other 4 tiers gives +30 efficiency per level.
    """
    mastery = max(0, min(100, int(mastery or 0)))
    total_eff = mastery * 30
    
    for t in [4, 5, 6, 7, 8]:
        level = max(0, min(100, int(spec_levels.get(t, 0) or spec_levels.get(str(t), 0) or 0)))
        if t == current_tier:
            total_eff += level * 250
        else:
            total_eff += level * 30
            
    return total_eff


def calculate_focus_cost(resource_type: str, tier: int, enchantment: int, mastery: int = 0, spec_levels: dict = None) -> int:
    """
    Calculates focus cost per single refined item unit.
    Formula: Actual Focus = Base Focus * (0.5 ^ (Efficiency / 10000))
    """
    if tier < 3:
        return 0
    if spec_levels is None:
        spec_levels = {}
        
    base_cost = BASE_FOCUS_COST.get(tier, 54)
    multiplier = ENCHANTMENT_FOCUS_MULTIPLIER.get(enchantment, 1.0)
    base_focus = base_cost * multiplier
    
    efficiency = calculate_focus_efficiency(mastery, spec_levels, tier)
    
    actual_focus = base_focus * (0.5 ** (efficiency / 10000.0))
    return max(1, math.floor(actual_focus))


def calculate_station_fee(tier: int, enchantment: int, station_tax_per_100: float, quantity: int) -> float:
    """
    Calculates the silver fee charged by the crafting/refining station.
    Formula: ItemValue * 0.1125 * (Station Tax / 100) * Quantity
    """
    tier_vals = BASE_ITEM_VALUES.get(tier, {})
    item_val = tier_vals.get(enchantment, tier_vals.get(0, 14))
    
    nutrition = item_val * 0.1125
    fee_per_unit = nutrition * ((station_tax_per_100 or 0.0) / 100.0)
    return round(fee_per_unit * quantity, 2)


def calculate_refining(
    resource_type: str,
    tier: int,
    enchantment: int,
    quantity: int,
    raw_price: float,
    prev_refined_price: float,
    refined_sell_price: float,
    city: str,
    use_focus: bool = False,
    daily_bonus_pct: float = 0.0,
    station_tax_per_100: float = 0.0,
    has_premium: bool = True,
    is_sell_order: bool = True,
    mastery_level: int = 0,
    spec_levels: dict = None,
) -> dict:
    """
    Comprehensive Albion Online refining calculation.
    """
    if spec_levels is None:
        spec_levels = {}
        
    quantity = max(1, int(quantity or 1))
    tier = int(tier)
    enchantment = int(enchantment)
    
    # 1. Return rates
    rrr_current = calculate_return_rate(resource_type, city, use_focus, daily_bonus_pct)
    rrr_without_focus = calculate_return_rate(resource_type, city, False, daily_bonus_pct)
    
    # 2. Raw & previous tier inputs required
    raw_per_craft = RAW_PER_TIER.get(tier, 2)
    prev_refined_per_craft = 1 if tier > 2 else 0
    
    # Gross materials needed upfront
    total_raw_gross = quantity * raw_per_craft
    total_prev_refined_gross = quantity * prev_refined_per_craft
    
    initial_capital_materials = (total_raw_gross * raw_price) + (total_prev_refined_gross * prev_refined_price)
    
    # Net materials consumed taking RRR returns into account
    total_raw_consumed = total_raw_gross * (1.0 - rrr_current)
    total_prev_consumed = total_prev_refined_gross * (1.0 - rrr_current)
    
    total_raw_returned = total_raw_gross * rrr_current
    total_prev_returned = total_prev_refined_gross * rrr_current
    
    net_material_cost = (total_raw_consumed * raw_price) + (total_prev_consumed * prev_refined_price)
    
    # 3. Station nutrition fee
    station_fee = calculate_station_fee(tier, enchantment, station_tax_per_100, quantity)
    
    # 4. Output yield & Market Revenue
    output_yield_multiplier = STONE_ENCHANTMENT_YIELD.get(enchantment, 1) if resource_type.lower() == 'stone' else 1
    output_quantity = quantity * output_yield_multiplier

    # Total actual cost of the batch
    total_net_cost = net_material_cost + station_fee
    cost_per_refined_unit = total_net_cost / output_quantity if output_quantity > 0 else 0
    
    gross_revenue = output_quantity * refined_sell_price
    tax_rate = TAX_PREMIUM if has_premium else TAX_NON_PREMIUM
    setup_fee_rate = ORDER_SETUP_FEE if is_sell_order else 0.0
    total_tax_rate = tax_rate + setup_fee_rate
    
    market_taxes = gross_revenue * total_tax_rate
    net_revenue = gross_revenue - market_taxes
    
    # 5. Profit & Margins
    net_profit = net_revenue - total_net_cost
    profit_per_unit = net_profit / output_quantity if output_quantity > 0 else 0
    profit_margin_pct = (net_profit / total_net_cost * 100.0) if total_net_cost > 0 else 0.0
    
    # 6. Focus Calculations & Silver per Focus
    focus_per_unit = calculate_focus_cost(resource_type, tier, enchantment, mastery_level, spec_levels)
    total_focus_needed = focus_per_unit * quantity if use_focus else 0
    
    # Calculate profit without focus to find Focus Value
    cost_without_focus = (
        (total_raw_gross * (1.0 - rrr_without_focus) * raw_price) +
        (total_prev_refined_gross * (1.0 - rrr_without_focus) * prev_refined_price) +
        station_fee
    )
    profit_without_focus = net_revenue - cost_without_focus
    
    silver_per_focus = 0.0
    if use_focus and total_focus_needed > 0:
        focus_added_value = net_profit - profit_without_focus
        silver_per_focus = round(focus_added_value / total_focus_needed, 2)
        
    # Opportunity cost / bonus city comparison
    bonus_city = RESOURCES.get(resource_type.lower(), {}).get('bonus_city', 'Martlock')
    is_bonus_city = city.lower() == bonus_city.lower()
    opportunity_cost = None
    if not is_bonus_city:
        rrr_bonus_city = calculate_return_rate(resource_type, bonus_city, use_focus, daily_bonus_pct)
        cost_in_bonus_city = (
            (total_raw_gross * (1.0 - rrr_bonus_city) * raw_price) +
            (total_prev_refined_gross * (1.0 - rrr_bonus_city) * prev_refined_price) +
            station_fee
        )
        profit_in_bonus_city = net_revenue - cost_in_bonus_city
        profit_diff = profit_in_bonus_city - net_profit
        opportunity_cost = {
            'bonus_city': bonus_city,
            'bonusCity': bonus_city,
            'bonus_city_rrr': round(rrr_bonus_city * 100.0, 2),
            'bonusCityRrr': rrr_bonus_city,
            'extra_profit': round(profit_diff, 2),
            'extraProfit': round(profit_diff, 2),
        }

    return {
        'resource_type': resource_type,
        'resourceType': resource_type,
        'tier': tier,
        'enchantment': enchantment,
        'quantity': quantity,
        'output_quantity': output_quantity,
        'outputQuantity': output_quantity,
        'city': city,
        'is_bonus_city': is_bonus_city,
        'isBonusCity': is_bonus_city,
        'opportunity_cost': opportunity_cost,
        'opportunityCost': opportunity_cost,
        'use_focus': use_focus,
        'useFocus': use_focus,
        'return_rate_pct': round(rrr_current * 100.0, 2),
        'returnRatePct': round(rrr_current * 100.0, 2),
        'return_rate_without_focus_pct': round(rrr_without_focus * 100.0, 2),
        'returnRateNoFocusPct': round(rrr_without_focus * 100.0, 2),
        'focus_per_unit': focus_per_unit,
        'focusPerUnit': focus_per_unit,
        'total_focus_needed': total_focus_needed,
        'totalFocusNeeded': total_focus_needed,
        'silver_per_focus': silver_per_focus,
        'silverPerFocus': silver_per_focus,
        
        # Materials Breakdown
        'materials': {
            'raw_needed_gross': total_raw_gross,
            'rawNeededGross': total_raw_gross,
            'rawGross': total_raw_gross,
            'raw_consumed_net': round(total_raw_consumed, 1),
            'rawConsumed': round(total_raw_consumed, 1),
            'raw_returned': round(total_raw_returned, 1),
            'rawReturned': round(total_raw_returned, 1),
            'raw_unit_price': raw_price,
            'rawPrice': raw_price,
            'prev_refined_needed_gross': total_prev_refined_gross,
            'prevRefinedNeededGross': total_prev_refined_gross,
            'prevRefinedGross': total_prev_refined_gross,
            'prev_refined_consumed_net': round(total_prev_consumed, 1),
            'prevRefinedConsumed': round(total_prev_consumed, 1),
            'prev_refined_returned': round(total_prev_returned, 1),
            'prevRefinedReturned': round(total_prev_returned, 1),
            'prev_refined_unit_price': prev_refined_price,
            'prevRefinedPrice': prev_refined_price,
        },
        
        # Financial Breakdown
        'financials': {
            'initial_capital_materials': round(initial_capital_materials, 2),
            'initialCapital': round(initial_capital_materials, 2),
            'station_fee': round(station_fee, 2),
            'stationFee': round(station_fee, 2),
            'net_material_cost': round(net_material_cost, 2),
            'netMaterialCost': round(net_material_cost, 2),
            'total_net_cost': round(total_net_cost, 2),
            'totalCost': round(total_net_cost, 2),
            'cost_per_refined_unit': round(cost_per_refined_unit, 2),
            'costPerUnit': round(cost_per_refined_unit, 2),
            'gross_revenue': round(gross_revenue, 2),
            'grossRevenue': round(gross_revenue, 2),
            'market_taxes': round(market_taxes, 2),
            'marketTaxes': round(market_taxes, 2),
            'net_revenue': round(net_revenue, 2),
            'netRevenue': round(net_revenue, 2),
            'net_profit': round(net_profit, 2),
            'netProfit': round(net_profit, 2),
            'profit_without_focus': round(profit_without_focus, 2),
            'profitNoFocus': round(profit_without_focus, 2),
            'profit_per_unit': round(profit_per_unit, 2),
            'profitPerUnit': round(profit_per_unit, 2),
            'profit_margin_pct': round(profit_margin_pct, 2),
            'marginPct': round(profit_margin_pct, 2),
        }
    }
