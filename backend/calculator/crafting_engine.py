import math
from .crafting_constants import (
    CRAFTABLE_ITEMS,
    CITY_CRAFTING_BONUSES,
    CRAFTING_FAME_PER_RESOURCE,
    JOURNAL_FAME_REQUIRED,
    ARTIFACT_BASE_ITEM_VALUE,
)
from .constants import (
    TAX_PREMIUM,
    TAX_NON_PREMIUM,
    ORDER_SETUP_FEE,
)

def get_craftable_item(item_id: str):
    for item in CRAFTABLE_ITEMS:
        if item['id'] == item_id:
            return item
    return CRAFTABLE_ITEMS[0]


def get_artifact_qty(item_def: dict, tier: int = 4) -> int:
    if not item_def.get('is_artifact'):
        return 0
    t = int(tier)
    if item_def.get('id') == 'capeitem_avalon':
        avalon_map = {4: 15, 5: 25, 6: 45, 7: 75, 8: 150}
        return avalon_map.get(t, 15)
    if item_def.get('is_faction_cape') or item_def.get('isFactionCape'):
        heart_map = {4: 1, 5: 1, 6: 3, 7: 5, 8: 10}
        return heart_map.get(t, 1)
    if item_def.get('is_royal') or item_def.get('isRoyal'):
        sigil_type = item_def.get('sigil_type') or item_def.get('sigilType', 'head_shoes')
        if sigil_type == 'armor':
            armor_map = {4: 4, 5: 8, 6: 16, 7: 16, 8: 16}
            return armor_map.get(t, 4)
        else:
            hs_map = {4: 2, 5: 4, 6: 8, 7: 8, 8: 8}
            return hs_map.get(t, 2)
    return 1


def calculate_crafting_rrr(item_def: dict, city: str, use_focus: bool = False, daily_bonus_pct: float = 0.0) -> float:
    """
    Calculates Resource Return Rate for item crafting.
    Royal base bonus: 18% (0.18)
    Crafting specialty bonus: +15% (0.15) if city matches item subcategory or bonus_city
    Focus bonus: +59% (0.59)
    """
    if item_def.get('is_no_return') or item_def.get('isNoReturn') or item_def.get('is_royal') or item_def.get('isRoyal'):
        return 0.0

    is_island = city.lower() == 'island'
    base_bonus = 0.0 if is_island else 0.18
    
    # Check city crafting specialty
    bonus_city = item_def.get('bonus_city') or item_def.get('bonusCity')
    city_bonuses = CITY_CRAFTING_BONUSES.get(city, [])
    has_city_specialty = bool(bonus_city and (
        item_def.get('subcategory') in city_bonuses or 
        city.lower() == str(bonus_city).lower()
    ))
    specialty_bonus = 0.15 if has_city_specialty else 0.0
    
    daily_bonus = (daily_bonus_pct or 0.0) / 100.0
    focus_bonus = 0.59 if use_focus else 0.0
    
    total_bonus = base_bonus + specialty_bonus + daily_bonus + focus_bonus
    return round(total_bonus / (1.0 + total_bonus), 6) if total_bonus > 0 else 0.0


def calculate_crafting_focus(mat_count: int, tier: int, enchantment: int, mastery: int = 0, spec: int = 0) -> int:
    """
    Calculates focus cost per craft in Albion Online.
    Base Focus per resource = 10 * (1.75 ^ (tier - 1 + enchantment))
    (At T4.0: 53.59375 per resource -> 8 mats = 429, 16 mats = 858, 24 mats = 1286, 32 mats = 1715)
    Mastery (1-100): +30 eff/lvl
    Item Spec (1-120): +280 eff/lvl (+250 item-specific + 30 shared category bonus)
    """
    if tier <= 2 or mat_count <= 0:
        return 0
    base_cost = mat_count * 10.0 * (1.75 ** (tier - 1 + enchantment))
    
    m = max(0, min(100, int(mastery or 0)))
    s = max(0, min(120, int(spec or 0)))
    efficiency = (m * 30) + (s * 280)
    
    actual_focus = base_cost * (0.5 ** (efficiency / 10000.0))
    return max(1, math.floor(actual_focus + 0.5))


def calculate_crafting(
    item_id: str,
    tier: int,
    enchantment: int,
    quantity: int,
    primary_mat_price: float,
    secondary_mat_price: float,
    artifact_price: float = 0.0,
    item_sell_price: float = 0.0,
    city: str = 'Lymhurst',
    use_focus: bool = False,
    daily_bonus_pct: float = 0.0,
    station_tax_per_100: float = 500.0,
    has_premium: bool = True,
    is_sell_order: bool = True,
    include_journals: bool = False,
    empty_journal_price: float = 0.0,
    full_journal_price: float = 0.0,
    mastery_level: int = 0,
    spec_level: int = 0,
) -> dict:
    """
    Calculates complete crafting financials, RRR refunds, and journal returns.
    """
    item_def = get_craftable_item(item_id)
    qty = max(1, int(quantity or 1))
    t = int(tier)
    ench = int(enchantment)

    is_transmutation = bool(item_def.get('is_no_return') or item_def.get('isNoReturn') or item_def.get('is_royal') or item_def.get('isRoyal'))
    mat_count = (item_def.get('primary_qty') or 0) + (item_def.get('secondary_qty') or 0)

    # 1. Return rates
    rrr_current = calculate_crafting_rrr(item_def, city, use_focus, daily_bonus_pct)
    rrr_no_focus = calculate_crafting_rrr(item_def, city, False, daily_bonus_pct)

    # 2. Material requirements
    primary_needed_gross = qty * item_def['primary_qty']
    primary_consumed_net = primary_needed_gross * (1.0 - rrr_current)
    primary_returned = primary_needed_gross * rrr_current

    secondary_needed_gross = qty * (item_def.get('secondary_qty') or 0)
    secondary_consumed_net = secondary_needed_gross * (1.0 - rrr_current)
    secondary_returned = secondary_needed_gross * rrr_current

    # Artifact handling (RRR does NOT refund artifacts in Albion Online)
    has_artifact = bool(item_def.get('is_artifact'))
    art_count = get_artifact_qty(item_def, t)
    artifact_gross_cost = (qty * art_count * float(artifact_price or 0.0)) if has_artifact else 0.0

    upfront_materials_cost = (primary_needed_gross * primary_mat_price) + (secondary_needed_gross * secondary_mat_price) + artifact_gross_cost
    net_materials_cost = (primary_consumed_net * primary_mat_price) + (secondary_consumed_net * secondary_mat_price) + artifact_gross_cost

    # 3. Station nutrition tax (Tier 2 and transmutations have 0 station fee in Albion Online)
    if t <= 2 or is_transmutation:
        station_fee = 0.0
    else:
        resource_iv = (mat_count * 16) * (2 ** (t - 4 + ench))
        art_type = item_def.get('artifact_type') or item_def.get('artifactType', '')
        artifact_iv = (ARTIFACT_BASE_ITEM_VALUE.get(art_type, 0) * (2 ** (t - 4))) if (has_artifact and t >= 4) else 0
        total_iv = resource_iv + artifact_iv
        nutrition = total_iv * 0.1125
        station_fee = nutrition * ((station_tax_per_100 or 0.0) / 100.0) * qty

    # 4. Journals logic (In Albion Online, crafting journals start at Tier 4)
    journal_profit = 0.0
    journals_filled = 0.0
    if include_journals and t >= 4 and (item_def.get('journal_name') or item_def.get('journalName')) and not is_transmutation:
        fame_per_res = CRAFTING_FAME_PER_RESOURCE.get(t, 22.5)
        fame_per_unit = mat_count * fame_per_res * (2 ** ench)
        total_fame = fame_per_unit * qty
        fame_req = JOURNAL_FAME_REQUIRED.get(t, 3600)
        journals_filled = round(total_fame / fame_req, 2)
        journal_unit_profit = max(0.0, full_journal_price - empty_journal_price)
        journal_profit = round(journals_filled * journal_unit_profit, 2)

    # 5. Financials
    total_cost = net_materials_cost + station_fee
    gross_revenue = qty * item_sell_price
    tax_rate = TAX_PREMIUM if has_premium else TAX_NON_PREMIUM
    setup_fee = ORDER_SETUP_FEE if is_sell_order else 0.0
    market_taxes = gross_revenue * (tax_rate + setup_fee)
    net_revenue = gross_revenue - market_taxes + journal_profit

    net_profit = net_revenue - total_cost
    margin_pct = (net_profit / total_cost * 100.0) if total_cost > 0 else 0.0
    profit_per_unit = net_profit / qty if qty > 0 else 0.0

    # 6. Focus scaling
    focus_per_unit = 0 if is_transmutation else calculate_crafting_focus(mat_count, t, ench, mastery_level, spec_level)
    total_focus = focus_per_unit * qty if use_focus else 0

    # Profit without focus
    primary_consumed_no_focus = primary_needed_gross * (1.0 - rrr_no_focus)
    secondary_consumed_no_focus = secondary_needed_gross * (1.0 - rrr_no_focus)
    cost_no_focus = (primary_consumed_no_focus * primary_mat_price) + (secondary_consumed_no_focus * secondary_mat_price) + artifact_gross_cost + station_fee
    profit_no_focus = net_revenue - cost_no_focus

    silver_per_focus = 0.0
    if use_focus and total_focus > 0:
        focus_value = net_profit - profit_no_focus
        silver_per_focus = round(focus_value / total_focus, 2)

    return {
        'item': item_def,
        'tier': t,
        'enchantment': ench,
        'quantity': qty,
        'city': city,
        'use_focus': use_focus,
        'useFocus': use_focus,
        'return_rate_pct': round(rrr_current * 100.0, 2),
        'returnRatePct': round(rrr_current * 100.0, 2),
        'focus_per_unit': focus_per_unit,
        'focusPerUnit': focus_per_unit,
        'total_focus_needed': total_focus,
        'totalFocusNeeded': total_focus,
        'silver_per_focus': silver_per_focus,
        'silverPerFocus': silver_per_focus,
        'materials': {
            'primary_gross': primary_needed_gross,
            'primaryGross': primary_needed_gross,
            'primary_consumed': round(primary_consumed_net, 1),
            'primaryConsumed': round(primary_consumed_net, 1),
            'primary_returned': round(primary_returned, 1),
            'primaryReturned': round(primary_returned, 1),
            'secondary_gross': secondary_needed_gross,
            'secondaryGross': secondary_needed_gross,
            'secondary_consumed': round(secondary_consumed_net, 1),
            'secondaryConsumed': round(secondary_consumed_net, 1),
            'secondary_returned': round(secondary_returned, 1),
            'secondaryReturned': round(secondary_returned, 1),
            'has_artifact': has_artifact,
            'hasArtifact': has_artifact,
            'artifact_gross_cost': round(artifact_gross_cost, 2),
            'artifactGrossCost': round(artifact_gross_cost, 2),
        },
        'journals': {
            'included': include_journals,
            'filled_count': journals_filled,
            'journalsFilled': journals_filled,
            'journal_profit': journal_profit,
            'journalProfit': journal_profit,
        },
        'financials': {
            'upfront_materials_cost': round(upfront_materials_cost, 2),
            'upfrontMaterials': round(upfront_materials_cost, 2),
            'station_fee': round(station_fee, 2),
            'stationFee': round(station_fee, 2),
            'total_cost': round(total_cost, 2),
            'totalCost': round(total_cost, 2),
            'gross_revenue': round(gross_revenue, 2),
            'grossRevenue': round(gross_revenue, 2),
            'market_taxes': round(market_taxes, 2),
            'marketTaxes': round(market_taxes, 2),
            'net_revenue': round(net_revenue, 2),
            'netRevenue': round(net_revenue, 2),
            'net_profit': round(net_profit, 2),
            'netProfit': round(net_profit, 2),
            'profit_per_unit': round(profit_per_unit, 2),
            'profitPerUnit': round(profit_per_unit, 2),
            'margin_pct': round(margin_pct, 2),
            'marginPct': round(margin_pct, 2),
        }
    }
