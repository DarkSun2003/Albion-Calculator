import math
from .crafting_constants import (
    CRAFTABLE_ITEMS,
    CITY_CRAFTING_BONUSES,
    CRAFTING_FAME_PER_RESOURCE,
    JOURNAL_FAME_REQUIRED,
    ARTIFACT_BASE_ITEM_VALUE,
    get_crafting_spec_rates,
    get_primary_qty,
    get_secondary_qty,
    resolve_extra_materials,
)
from .constants import (
    TAX_PREMIUM,
    TAX_NON_PREMIUM,
    ORDER_SETUP_FEE,
    compute_total_rrr,
)

def get_craftable_item(item_id: str):
    for item in CRAFTABLE_ITEMS:
        if item['id'] == item_id:
            return item
    return CRAFTABLE_ITEMS[0]


def get_artifact_qty(item_def: dict, tier: int = 4) -> int:
    if not item_def.get('is_artifact') and not item_def.get('isArtifact'):
        return 0
    t = int(tier)
    custom_qty = item_def.get('artifact_qty')
    if custom_qty is None:
        custom_qty = item_def.get('artifactQty')
    if custom_qty is not None:
        if isinstance(custom_qty, dict):
            return int(custom_qty.get(t, custom_qty.get(str(t), 1)))
        return int(custom_qty)
    if item_def.get('id') == 'capeitem_avalon':
        avalon_map = {4: 15, 5: 15, 6: 45, 7: 75, 8: 150}
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


def is_crafting_bonus_city(item_def: dict, city: str, location_mode: str = 'city') -> bool:
    """Returns True when crafting in the item's Royal/Brecilien bonus city (never in Hideouts)."""
    if str(location_mode or 'city').lower() == 'hideout':
        return False
    bonus_city = item_def.get('bonus_city') or item_def.get('bonusCity')
    city_bonuses = CITY_CRAFTING_BONUSES.get(city, [])
    return bool(bonus_city and (
        item_def.get('subcategory') in city_bonuses or
        city.lower() == str(bonus_city).lower()
    ))


def calculate_crafting_rrr(
    item_def: dict,
    city: str,
    use_focus: bool = False,
    daily_bonus_pct: float = 0.0,
    location_mode: str = 'city',
    ho_power_level: int = 1,
    ho_zone_quality: int = 1,
    ho_has_specialty: bool = False,
    ho_custom_bonus_pct: float = None,
) -> float:
    """
    Calculates Resource Return Rate for item crafting in Royal Cities, Islands, or Black Zone Hideouts.
    """
    if item_def.get('is_no_return') or item_def.get('isNoReturn') or item_def.get('is_royal') or item_def.get('isRoyal'):
        return 0.0

    is_island = city.lower() == 'island'
    base_bonus = 0.0 if is_island else 0.18

    has_city_specialty = is_crafting_bonus_city(item_def, city, 'city')
    specialty_bonus = 0.15 if has_city_specialty else 0.0

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
        specialty_mode='crafting',
    )


def calculate_crafting_focus(
    mat_count: int,
    tier: int,
    enchantment: int,
    mastery: int = 0,
    spec: int = 0,
    other_spec_avg: int = 0,
    item_def: dict = None,
) -> int:
    """
    Calculates focus cost per craft in Albion Online using exact Destiny Board FCE rates per category.
    Focus Cost Efficiency halves focus cost every 10,000 FCE.
    """
    if tier < 2:
        return 0

    focus_by_tier = {}
    if item_def:
        focus_by_tier = item_def.get('focus_by_tier') or item_def.get('focusByTier') or {}

    base_t = focus_by_tier.get(str(tier), focus_by_tier.get(tier))
    if base_t is not None and float(base_t) > 0:
        base_cost = float(base_t) * (1.75 ** enchantment)
    else:
        if mat_count <= 0:
            return 0
        base_cost = mat_count * 10.0 * (1.75 ** (tier - 1 + enchantment))

    m = max(0, min(100, int(mastery or 0)))
    s = max(0, min(100, int(spec or 0)))
    o = max(0, min(100, int(other_spec_avg or 0)))

    if item_def:
        m_rate, s_rate, o_rate, _, _, _ = get_crafting_spec_rates(item_def)
    else:
        m_rate, s_rate, o_rate = (30.0, 280.0, 120.0)

    efficiency = (m * m_rate) + (s * s_rate) + (o * o_rate)
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
    other_spec_avg: int = 0,
    location_mode: str = 'city',
    ho_power_level: int = 1,
    ho_zone_quality: int = 1,
    ho_has_specialty: bool = False,
    ho_custom_bonus_pct: float = None,
    extra_mat_prices: dict = None,
) -> dict:
    """
    Calculates complete crafting financials, RRR refunds, and journal returns.
    """
    item_def = get_craftable_item(item_id)
    qty = max(1, int(quantity or 1))
    t = int(tier)
    ench = int(enchantment)

    is_transmutation = bool(item_def.get('is_no_return') or item_def.get('isNoReturn') or item_def.get('is_royal') or item_def.get('isRoyal'))
    p_qty = get_primary_qty(item_def, t)
    s_qty = get_secondary_qty(item_def, t)
    extras = resolve_extra_materials(item_def, t)

    # 1. Return rates
    rrr_current = calculate_crafting_rrr(
        item_def, city, use_focus, daily_bonus_pct,
        location_mode, ho_power_level, ho_zone_quality, ho_has_specialty, ho_custom_bonus_pct,
    )
    rrr_no_focus = calculate_crafting_rrr(
        item_def, city, False, daily_bonus_pct,
        location_mode, ho_power_level, ho_zone_quality, ho_has_specialty, ho_custom_bonus_pct,
    )

    # 2. Material requirements (respect per-slot @maxreturnamount="0" such as grown mounts/artifacts/remains)
    primary_no_ret = is_transmutation or bool(item_def.get('primary_no_return') or item_def.get('primaryNoReturn'))
    secondary_no_ret = is_transmutation or bool(item_def.get('secondary_no_return') or item_def.get('secondaryNoReturn'))
    art_no_ret = is_transmutation or bool(item_def.get('artifact_no_return', item_def.get('artifactNoReturn', True)))

    primary_needed_gross = qty * p_qty
    primary_rrr = 0.0 if primary_no_ret else rrr_current
    primary_consumed_net = primary_needed_gross * (1.0 - primary_rrr)
    primary_returned = primary_needed_gross * primary_rrr

    secondary_needed_gross = qty * s_qty
    secondary_rrr = 0.0 if secondary_no_ret else rrr_current
    secondary_consumed_net = secondary_needed_gross * (1.0 - secondary_rrr)
    secondary_returned = secondary_needed_gross * secondary_rrr

    # Artifact handling (artifacts have RRR=0 unless explicitly returnable)
    has_artifact = bool(item_def.get('is_artifact'))
    art_count = get_artifact_qty(item_def, t)
    artifact_needed_gross = (qty * art_count) if has_artifact else 0
    artifact_rrr = 0.0 if (not has_artifact or art_no_ret) else rrr_current
    artifact_consumed_net = artifact_needed_gross * (1.0 - artifact_rrr)
    artifact_returned = artifact_needed_gross * artifact_rrr
    artifact_gross_cost = artifact_needed_gross * float(artifact_price or 0.0)
    artifact_net_cost = artifact_consumed_net * float(artifact_price or 0.0)

    # Extra 4th/5th material slots (e.g. Animal Remains on Shapeshifter Staves, Cloth on Armored Horse, Leather/Planks on Siege Ballista)
    extra_prices = extra_mat_prices or {}
    extra_materials_out = []
    extra_gross_total_cost = 0.0
    extra_net_total_cost = 0.0
    extra_nf_total_cost = 0.0
    for ex in extras:
        ex_price = float(extra_prices.get(ex['id'], extra_prices.get(ex['template'], 0.0)) or 0.0)
        ex_no_ret = is_transmutation or bool(ex.get('no_return', False))
        ex_gross = qty * ex['qty']
        ex_rrr = 0.0 if ex_no_ret else rrr_current
        ex_consumed = ex_gross * (1.0 - ex_rrr)
        ex_returned = ex_gross * ex_rrr
        ex_gross_cost = ex_gross * ex_price
        ex_net_cost = ex_consumed * ex_price
        ex_rrr_nf = 0.0 if ex_no_ret else rrr_no_focus
        ex_consumed_nf = ex_gross * (1.0 - ex_rrr_nf)
        extra_gross_total_cost += ex_gross_cost
        extra_net_total_cost += ex_net_cost
        extra_nf_total_cost += ex_consumed_nf * ex_price
        extra_materials_out.append({
            'id': ex['id'],
            'name': ex['name'],
            'template': ex['template'],
            'qty_per_unit': ex['qty'],
            'qtyPerUnit': ex['qty'],
            'no_return': ex_no_ret,
            'noReturn': ex_no_ret,
            'is_refined_resource': bool(ex.get('is_refined_resource', not ex_no_ret)),
            'isRefinedResource': bool(ex.get('is_refined_resource', not ex_no_ret)),
            'unit_price': round(ex_price, 2),
            'unitPrice': round(ex_price, 2),
            'gross': ex_gross,
            'consumed': round(ex_consumed, 1),
            'returned': round(ex_returned, 1),
            'gross_cost': round(ex_gross_cost, 2),
            'grossCost': round(ex_gross_cost, 2),
            'net_cost': round(ex_net_cost, 2),
            'netCost': round(ex_net_cost, 2),
        })

    upfront_materials_cost = (primary_needed_gross * primary_mat_price) + (secondary_needed_gross * secondary_mat_price) + artifact_gross_cost + extra_gross_total_cost
    net_materials_cost = (primary_consumed_net * primary_mat_price) + (secondary_consumed_net * secondary_mat_price) + artifact_net_cost + extra_net_total_cost

    # Refined resources only contribute to Item Value & Craft Fame (grown mounts & remains contribute 0 IV / 0 fame)
    refined_iv_mat_count = (
        (0 if primary_no_ret else p_qty)
        + (0 if secondary_no_ret else s_qty)
        + sum(ex['qty'] for ex in extras if ex.get('is_refined_resource', True))
    )

    # 3. Station nutrition tax (Tier 2 and transmutations have 0 station fee in Albion Online)
    if t <= 2 or is_transmutation:
        station_fee = 0.0
    else:
        resource_iv = (refined_iv_mat_count * 16) * (2 ** (t - 4 + ench))
        art_type = item_def.get('artifact_type') or item_def.get('artifactType', '')
        art_iv_by_tier = item_def.get('artifact_item_value_by_tier') or item_def.get('artifactItemValueByTier') or {}
        if has_artifact and t >= 4:
            if str(t) in art_iv_by_tier or t in art_iv_by_tier:
                artifact_iv = float(art_iv_by_tier.get(str(t), art_iv_by_tier.get(t, 0.0)))
            elif float(item_def.get('artifact_item_value') or item_def.get('artifactItemValue') or 0.0) > 0:
                artifact_iv = float(item_def.get('artifact_item_value') or item_def.get('artifactItemValue') or 0.0) * (2 ** (t - 4))
            else:
                artifact_iv = ARTIFACT_BASE_ITEM_VALUE.get(art_type, 0) * (2 ** (t - 4))
        else:
            artifact_iv = 0.0
        total_iv = resource_iv + artifact_iv
        nutrition = total_iv * 0.1125
        station_fee = nutrition * ((station_tax_per_100 or 0.0) / 100.0) * qty

    # 4. Journals logic (In Albion Online, crafting journals start at Tier 4; scaled by destinyCraftFameFactor)
    journal_profit = 0.0
    journals_filled = 0.0
    destiny_factor = float(item_def.get('destiny_factor') or item_def.get('destinyFactor') or 1.0)
    if include_journals and t >= 4 and (item_def.get('journal_name') or item_def.get('journalName')) and not is_transmutation:
        fame_per_res = CRAFTING_FAME_PER_RESOURCE.get(t, 22.5)
        fame_per_unit = refined_iv_mat_count * fame_per_res * (2 ** ench) * destiny_factor
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
    focus_per_unit = 0 if is_transmutation else calculate_crafting_focus(
        refined_iv_mat_count, t, ench, mastery_level, spec_level, other_spec_avg, item_def
    )
    total_focus = focus_per_unit * qty if use_focus else 0

    # Profit without focus
    primary_rrr_nf = 0.0 if primary_no_ret else rrr_no_focus
    secondary_rrr_nf = 0.0 if secondary_no_ret else rrr_no_focus
    artifact_rrr_nf = 0.0 if (not has_artifact or art_no_ret) else rrr_no_focus
    primary_consumed_no_focus = primary_needed_gross * (1.0 - primary_rrr_nf)
    secondary_consumed_no_focus = secondary_needed_gross * (1.0 - secondary_rrr_nf)
    artifact_consumed_no_focus = artifact_needed_gross * (1.0 - artifact_rrr_nf)
    cost_no_focus = (
        (primary_consumed_no_focus * primary_mat_price)
        + (secondary_consumed_no_focus * secondary_mat_price)
        + (artifact_consumed_no_focus * float(artifact_price or 0.0))
        + extra_nf_total_cost
        + station_fee
    )
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
        'locationMode': location_mode,
        'isBonusCity': is_crafting_bonus_city(item_def, city, location_mode),
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
            'primary_qty_per_unit': p_qty,
            'primaryQtyPerUnit': p_qty,
            'primary_gross': primary_needed_gross,
            'primaryGross': primary_needed_gross,
            'primary_consumed': round(primary_consumed_net, 1),
            'primaryConsumed': round(primary_consumed_net, 1),
            'primary_returned': round(primary_returned, 1),
            'primaryReturned': round(primary_returned, 1),
            'secondary_qty_per_unit': s_qty,
            'secondaryQtyPerUnit': s_qty,
            'secondary_gross': secondary_needed_gross,
            'secondaryGross': secondary_needed_gross,
            'secondary_consumed': round(secondary_consumed_net, 1),
            'secondaryConsumed': round(secondary_consumed_net, 1),
            'secondary_returned': round(secondary_returned, 1),
            'secondaryReturned': round(secondary_returned, 1),
            'has_artifact': has_artifact,
            'hasArtifact': has_artifact,
            'artifact_gross': artifact_needed_gross,
            'artifactGross': artifact_needed_gross,
            'artifact_consumed': round(artifact_consumed_net, 1),
            'artifactConsumed': round(artifact_consumed_net, 1),
            'artifact_returned': round(artifact_returned, 1),
            'artifactReturned': round(artifact_returned, 1),
            'artifact_gross_cost': round(artifact_gross_cost, 2),
            'artifactGrossCost': round(artifact_gross_cost, 2),
            'extra_materials': extra_materials_out,
            'extraMaterials': extra_materials_out,
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
