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
    2: 7.5,
    3: 15.0,
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
        it['fame_per_unit'] = round(mat_count * 22.5, 1)
        it['famePerUnit'] = it['fame_per_unit']
        it['base_item_value'] = mat_count * 16
        it['baseItemValue'] = it['base_item_value']
        it['base_focus'] = round(mat_count * 53.59375)
        it['baseFocus'] = it['base_focus']

        it['min_tier'] = it.get('minTier', it.get('min_tier', 4))
        it['max_tier'] = it.get('maxTier', it.get('max_tier', 8))
        it['allow_enchantment'] = it.get('allowEnchantment', it.get('allow_enchantment', True))
        it['is_faction_cape'] = it.get('isFactionCape', it.get('is_faction_cape', False))
        it['is_royal'] = it.get('isRoyal', it.get('is_royal', False))
        it['sigil_type'] = it.get('sigilType', it.get('sigil_type', 'head_shoes'))
        it['is_no_return'] = it.get('isNoReturn', it.get('is_no_return', False))
    return items

CRAFTABLE_ITEMS = _load_catalog()
