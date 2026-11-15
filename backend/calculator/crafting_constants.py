"""
Albion Online Crafting Recipes, Item Categories, and City Crafting Bonuses.
All gear crafting strictly uses refined materials (Metal Bars, Planks, Leather, Cloth).
Artifact gear requires 1 Artifact component (which is never refunded by RRR).
Loads dynamically from generated_catalog.json (301 complete gear items).
"""
import json
import os

CATALOG_PATH = os.path.join(os.path.dirname(__file__), 'data', 'generated_catalog.json')

CRAFTING_CATEGORIES = {
    'accessories': {
        'name': 'Accessories & Furniture',
        'station': 'Toolmaker',
        'icon': '🎒',
    },
    'tools': {
        'name': 'Gathering Tools',
        'station': 'Toolmaker',
        'icon': '⛏️',
    },
    'gathering': {
        'name': 'Gathering Gear',
        'station': 'Toolmaker',
        'icon': '🥾',
    },
    'warrior': {
        'name': "Warrior's Forge",
        'station': "Warrior's Forge",
        'icon': '⚔️',
    },
    'hunter': {
        'name': "Hunter's Lodge",
        'station': "Hunter's Lodge",
        'icon': '🏹',
    },
    'mage': {
        'name': "Mage's Tower",
        'station': "Mage's Tower",
        'icon': '🔮',
    },
    'mounts': {
        'name': 'Saddler & War Mounts',
        'station': 'Saddler / Energy Manipulator',
        'icon': '🐎',
    },
}

# City Crafting Bonuses (+15% production bonus to specific item types)
CITY_CRAFTING_BONUSES = {
    'Thetford': ['maces', 'nature_staves', 'fire_staves', 'cloth_helmets', 'leather_armor'],
    'Fort Sterling': ['hammers', 'spears', 'holy_staves', 'plate_helmets', 'cloth_armor'],
    'Lymhurst': ['swords', 'bows', 'arcane_staves', 'leather_helmets', 'leather_shoes'],
    'Bridgewatch': ['crossbows', 'daggers', 'cursed_staves', 'plate_armor', 'cloth_shoes'],
    'Martlock': ['axes', 'quarterstaffs', 'frost_staves', 'plate_shoes', 'shields', 'tomes', 'torches'],
    'Caerleon': ['tools', 'gathering_gear', 'wargloves', 'shapeshifter', 'food'],
    'Brecilien': ['bags', 'capes', 'potions'],
}

# Base crafting fame earned per 1 refined resource at each tier (.0 flat)
# Enchanted materials multiply fame by 2 ** enchantment (.1 = 2x, .2 = 4x, .3 = 8x, .4 = 16x)
CRAFTING_FAME_PER_RESOURCE = {
    2: 1.5,
    3: 7.5,
    4: 22.5,
    5: 90.0,
    6: 270.0,
    7: 645.0,
    8: 1395.0,
}

# Fame required to fill a crafting journal by tier (Crafting Journals start at Tier 4)
JOURNAL_FAME_REQUIRED = {
    2: 900,
    3: 1800,
    4: 3600,
    5: 7200,
    6: 14400,
    7: 28380,
    8: 58590,
}

# Additional Item Value added by artifacts at Tier 4 baseline (scales by 2 ** (tier - 4))
ARTIFACT_BASE_ITEM_VALUE = {
    'Rune': 64,
    'Soul': 192,
    'Relic': 448,
    'Tracking': 448,
    'Avalonian': 960,
    'Crystal': 960,
    'Dragon': 448,
}


def get_crafting_spec_rates(item_def: dict):
    """
    Returns (mastery_fce, own_fce, mutual_fce, mastery_q, own_q, mutual_q) per Destiny Board level (0-100).
    Mutual FCE / Quality apply to `other_spec_avg` (averaged across mutual peer nodes in the same tree).
    """
    cat = (item_def.get('category') or '').lower()
    sub = (item_def.get('subcategory') or '').lower()
    item_id = (item_def.get('id') or '').lower()
    is_art = bool(item_def.get('is_artifact') or item_def.get('isArtifact'))

    if cat == 'mounts' or sub in ('furniture', 'siege_banners'):
        return (0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
    if sub == 'tools':
        if item_id in ('2h_tool_siegehammer', '2h_tool_siegehammer_avalon'):
            return (30.0, 370.0, 0.0, 0.75, 9.05, 0.0)
        return (0.0, 310.0, 90.0, 0.0, 7.5, 2.25)
    if sub == 'gathering_gear':
        return (60.0, 280.0, 60.0, 1.5, 6.75, 1.5)
    if sub == 'capes':
        return (30.0, 370.0, 0.0, 0.75, 9.0, 0.0)
    if sub == 'bags':
        if item_id == 'bag_insight':
            return (30.0, 340.0, 0.0, 0.75, 8.25, 0.0)
        return (30.0, 340.0, 30.0, 0.75, 8.3, 0.75)
    if sub in ('shields', 'tomes', 'torches'):
        if not is_art:
            return (30.0, 340.0, 60.0, 0.75, 8.3, 1.5)
        return (30.0, 265.0, 135.0, 0.75, 6.375, 3.425)
    if sub in ('leather_armor', 'leather_helmets', 'leather_shoes'):
        if not is_art or '_fey' in item_id:
            return (30.0, 280.0, 165.0, 0.75, 6.75, 4.125)
        return (30.0, 262.5, 182.5, 0.75, 6.3125, 4.5625)
    if sub in (
        'plate_armor', 'plate_helmets', 'plate_shoes',
        'cloth_armor', 'cloth_helmets', 'cloth_shoes',
    ):
        if not is_art or '_fey' in item_id:
            return (30.0, 280.0, 165.0, 0.75, 6.75, 4.125)
        return (30.0, 265.0, 180.0, 0.75, 6.375, 4.5)
    # Standard weapons
    if not is_art:
        return (30.0, 280.0, 120.0, 0.75, 6.75, 3.0)
    return (30.0, 265.0, 135.0, 0.75, 6.375, 3.375)


def _load_catalog():
    if not os.path.exists(CATALOG_PATH):
        return []
    with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
        items = json.load(f)
    for it in items:
        # Guarantee both snake_case and camelCase accessibility
        it['primary_qty'] = it.get('primaryQty', it.get('primary_qty', 0))
        it['secondary_qty'] = it.get('secondaryQty', it.get('secondary_qty', 0))
        it['primary_mat_name'] = it.get('primaryMatName', it.get('primary_mat_name', ''))
        it['secondary_mat_name'] = it.get('secondaryMatName', it.get('secondary_mat_name', ''))
        it['primary_mat_icon'] = it.get('primaryMatIcon', it.get('primary_mat_icon', ''))
        it['secondary_mat_icon'] = it.get('secondaryMatIcon', it.get('secondary_mat_icon', ''))
        it['bonus_city'] = it.get('bonusCity', it.get('bonus_city', ''))
        it['is_artifact'] = it.get('isArtifact', it.get('is_artifact', False))
        it['artifact_type'] = it.get('artifactType', it.get('artifact_type', ''))
        it['artifact_name'] = it.get('artifactName', it.get('artifact_name', ''))
        it['artifact_template'] = it.get('artifactTemplate', it.get('artifact_template', ''))
        it['journal_name'] = it.get('journalName', it.get('journal_name', ''))
        it['journal_template'] = it.get('journalTemplate', it.get('journal_template', ''))

        mat_count = (it['primary_qty'] or 0) + (it['secondary_qty'] or 0)
        fame_val = it.get('famePerUnit', it.get('fame_per_unit'))
        it['fame_per_unit'] = round(mat_count * 22.5, 1) if fame_val is None else fame_val
        it['famePerUnit'] = it['fame_per_unit']

        iv_val = it.get('baseItemValue', it.get('base_item_value'))
        it['base_item_value'] = (mat_count * 16) if iv_val is None else iv_val
        it['baseItemValue'] = it['base_item_value']

        focus_by_tier = it.get('focusByTier', it.get('focus_by_tier')) or {}
        it['focus_by_tier'] = focus_by_tier
        it['focusByTier'] = focus_by_tier

        focus_val = it.get('baseFocus', it.get('base_focus'))
        it['base_focus'] = round(mat_count * 53.59375) if focus_val is None else focus_val
        it['baseFocus'] = it['base_focus']

        it['destiny_factor'] = float(it.get('destinyFactor', it.get('destiny_factor')) or 1.0)
        it['destinyFactor'] = it['destiny_factor']

        it['artifact_item_value'] = float(it.get('artifactItemValue', it.get('artifact_item_value')) or 0.0)
        it['artifactItemValue'] = it['artifact_item_value']
        it['artifact_item_value_by_tier'] = it.get('artifactItemValueByTier', it.get('artifact_item_value_by_tier')) or {}
        it['artifactItemValueByTier'] = it['artifact_item_value_by_tier']

        it['primary_no_return'] = bool(it.get('primaryNoReturn', it.get('primary_no_return', False)))
        it['primaryNoReturn'] = it['primary_no_return']
        it['secondary_no_return'] = bool(it.get('secondaryNoReturn', it.get('secondary_no_return', False)))
        it['secondaryNoReturn'] = it['secondary_no_return']
        art_no_ret = it.get('artifactNoReturn', it.get('artifact_no_return', True))
        it['artifact_no_return'] = True if art_no_ret is None else bool(art_no_ret)
        it['artifactNoReturn'] = it['artifact_no_return']

        it['min_tier'] = it.get('minTier', it.get('min_tier', 4))
        it['max_tier'] = it.get('maxTier', it.get('max_tier', 8))
        it['allow_enchantment'] = it.get('allowEnchantment', it.get('allow_enchantment', True))
        it['is_faction_cape'] = it.get('isFactionCape', it.get('is_faction_cape', False))
        it['is_royal'] = it.get('isRoyal', it.get('is_royal', False))
        it['sigil_type'] = it.get('sigilType', it.get('sigil_type', 'head_shoes'))
        it['is_no_return'] = it.get('isNoReturn', it.get('is_no_return', False))
        it['artifact_qty'] = it.get('artifactQty', it.get('artifact_qty'))
        it['artifactQty'] = it['artifact_qty']
        it['primary_qty_by_tier'] = it.get('primaryQtyByTier', it.get('primary_qty_by_tier')) or {}
        it['primaryQtyByTier'] = it['primary_qty_by_tier']
        it['secondary_qty_by_tier'] = it.get('secondaryQtyByTier', it.get('secondary_qty_by_tier')) or {}
        it['secondaryQtyByTier'] = it['secondary_qty_by_tier']

        raw_extras = it.get('extraMaterials', it.get('extra_materials')) or []
        norm_extras = []
        for idx, ex in enumerate(raw_extras):
            ex_id = ex.get('id') or f'extra_{idx}'
            no_ret = bool(ex.get('noReturn', ex.get('no_return', False)))
            is_ref = bool(ex.get('isRefinedResource', ex.get('is_refined_resource', not no_ret)))
            entry = {
                'id': ex_id,
                'name': ex.get('name', ex_id),
                'template': ex.get('template', ''),
                'qty': int(ex.get('qty') or 0),
                'noReturn': no_ret,
                'no_return': no_ret,
                'isRefinedResource': is_ref,
                'is_refined_resource': is_ref,
            }
            if ex.get('byTier') or ex.get('by_tier'):
                entry['byTier'] = ex.get('byTier', ex.get('by_tier'))
                entry['by_tier'] = entry['byTier']
            norm_extras.append(entry)
        it['extra_materials'] = norm_extras
        it['extraMaterials'] = norm_extras
    return items


def _resolve_tier_qty(by_tier: dict, default_qty: int, tier: int) -> int:
    t = int(tier)
    if by_tier:
        val = by_tier.get(str(t), by_tier.get(t))
        if val is not None:
            return int(val)
    return int(default_qty or 0)


def get_primary_qty(item_def: dict, tier: int) -> int:
    """Return tier-specific primary material quantity (e.g. T2 vs T3+ Bag)."""
    return _resolve_tier_qty(
        item_def.get('primary_qty_by_tier') or item_def.get('primaryQtyByTier'),
        item_def.get('primary_qty', item_def.get('primaryQty', 0)),
        tier,
    )


def get_secondary_qty(item_def: dict, tier: int) -> int:
    """Return tier-specific secondary material quantity (e.g. T2 vs T3+ Bag)."""
    return _resolve_tier_qty(
        item_def.get('secondary_qty_by_tier') or item_def.get('secondaryQtyByTier'),
        item_def.get('secondary_qty', item_def.get('secondaryQty', 0)),
        tier,
    )


def resolve_extra_materials(item_def: dict, tier: int) -> list:
    """Return tier-resolved extra material slots (4th/5th crafting ingredients)."""
    t = int(tier)
    extras = item_def.get('extra_materials') or item_def.get('extraMaterials') or []
    resolved = []
    for idx, ex in enumerate(extras):
        ex_id = ex.get('id') or f'extra_{idx}'
        by_tier = ex.get('by_tier') or ex.get('byTier') or {}
        tier_spec = by_tier.get(str(t), by_tier.get(t)) if by_tier else None
        raw_tmpl = (tier_spec.get('template') if tier_spec else None) or ex.get('template', '')
        tmpl = raw_tmpl.replace('{tier}', str(t)) if '{tier}' in raw_tmpl else raw_tmpl
        name = (tier_spec.get('name') if tier_spec else None) or ex.get('name', ex_id)
        qty = int((tier_spec.get('qty') if tier_spec and 'qty' in tier_spec else ex.get('qty')) or 0)
        if qty <= 0 or not tmpl:
            continue
        no_ret = bool((tier_spec.get('noReturn', tier_spec.get('no_return')) if tier_spec and ('noReturn' in tier_spec or 'no_return' in tier_spec) else ex.get('no_return', ex.get('noReturn', False))))
        is_ref = bool(ex.get('is_refined_resource', ex.get('isRefinedResource', not no_ret)))
        resolved.append({
            'id': ex_id,
            'name': name,
            'template': tmpl,
            'qty': qty,
            'no_return': no_ret,
            'noReturn': no_ret,
            'is_refined_resource': is_ref,
            'isRefinedResource': is_ref,
        })
    return resolved


CRAFTABLE_ITEMS = _load_catalog()
