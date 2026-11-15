import json
import re
from collections import OrderedDict

import os

BASE_DIR = os.path.dirname(__file__)

with open(os.path.join(BASE_DIR, 'items.json'), 'r', encoding='utf-8') as f:
    raw_data = json.load(f)

with open(os.path.join(BASE_DIR, 'formatted_items.json'), 'r', encoding='utf-8') as f:
    formatted_data = json.load(f)

uname_to_name = {}
for item in formatted_data:
    uname = item.get('UniqueName')
    names = item.get('LocalizedNames')
    if uname and names and 'EN-US' in names:
        uname_to_name[uname] = names['EN-US']

def clean_item_name(full_name):
    if not full_name:
        return 'Unknown'
    prefixes = ["Novice's ", "Journeyman's ", "Adept's ", "Expert's ", "Master's ", "Grandmaster's ", "Elder's ", "Beginner's "]
    for p in prefixes:
        if full_name.startswith(p):
            return full_name[len(p):].strip()
    return full_name.strip()

MAT_MAP = {
    'WOOD': ('Wood', 'T{tier}_WOOD'),
    'PLANKS': ('Planks', 'T{tier}_PLANKS'),
    'ORE': ('Ore', 'T{tier}_ORE'),
    'METALBAR': ('Metal Bar', 'T{tier}_METALBAR'),
    'HIDE': ('Hide', 'T{tier}_HIDE'),
    'LEATHER': ('Leather', 'T{tier}_LEATHER'),
    'FIBER': ('Fiber', 'T{tier}_FIBER'),
    'CLOTH': ('Cloth', 'T{tier}_CLOTH'),
    'ROCK': ('Stone Rock', 'T{tier}_ROCK'),
    'STONEBLOCK': ('Stone Block', 'T{tier}_STONEBLOCK'),
}

def parse_material(mat_uname):
    for k, (name, icon_tmpl) in MAT_MAP.items():
        if k in mat_uname:
            return name, icon_tmpl
    return mat_uname, mat_uname

def detect_artifact_type(art_uname):
    u = art_uname.upper()
    if 'SKILLBOOK' in u:
        return 'Tome of Insight'
    if 'AVALON' in u:
        return 'Avalonian'
    if 'CRYSTAL' in u:
        return 'Crystal'
    if 'DRAGON' in u:
        return 'Dragon'
    if any(x in u for x in ['SHAPESHIFTER', 'TRACKING', 'ROOT', 'HELLSPAWN', 'BLOODMOON', 'PRIMAL']):
        return 'Tracking'
    if 'HELL' in u:
        return 'Soul'
    if 'UNDEAD' in u or 'KEEPER' in u or 'MORGANA' in u:
        return 'Relic'
    return 'Rune'


ARTIFACT_KEYWORDS = ('ARTEFACT', 'CREST', 'REMNANT', 'TOKEN', 'HEART', 'AVALON', 'SKILLBOOK')


def is_artifact_ingredient(rname):
    u = rname.upper()
    return any(k in u for k in ARTIFACT_KEYWORDS)


def is_extra_ingredient(rname):
    return 'ALCHEMY' in rname.upper()

RULES = {
    # Warrior's Forge
    'swords': {'category': 'warrior', 'bonusCity': 'Lymhurst', 'journal': ('Blacksmith Journal', 'T{tier}_JOURNAL_WARRIOR')},
    'axes': {'category': 'warrior', 'bonusCity': 'Martlock', 'journal': ('Blacksmith Journal', 'T{tier}_JOURNAL_WARRIOR')},
    'maces': {'category': 'warrior', 'bonusCity': 'Thetford', 'journal': ('Blacksmith Journal', 'T{tier}_JOURNAL_WARRIOR')},
    'hammers': {'category': 'warrior', 'bonusCity': 'Fort Sterling', 'journal': ('Blacksmith Journal', 'T{tier}_JOURNAL_WARRIOR')},
    'crossbows': {'category': 'warrior', 'bonusCity': 'Bridgewatch', 'journal': ('Blacksmith Journal', 'T{tier}_JOURNAL_WARRIOR')},
    'wargloves': {'category': 'warrior', 'bonusCity': 'Caerleon', 'journal': ('Blacksmith Journal', 'T{tier}_JOURNAL_WARRIOR')},
    'shields': {'category': 'warrior', 'bonusCity': 'Martlock', 'journal': ('Blacksmith Journal', 'T{tier}_JOURNAL_WARRIOR')},
    'plate_armor': {'category': 'warrior', 'bonusCity': 'Bridgewatch', 'journal': ('Blacksmith Journal', 'T{tier}_JOURNAL_WARRIOR')},
    'plate_helmets': {'category': 'warrior', 'bonusCity': 'Fort Sterling', 'journal': ('Blacksmith Journal', 'T{tier}_JOURNAL_WARRIOR')},
    'plate_shoes': {'category': 'warrior', 'bonusCity': 'Martlock', 'journal': ('Blacksmith Journal', 'T{tier}_JOURNAL_WARRIOR')},

    # Hunter's Lodge
    'bows': {'category': 'hunter', 'bonusCity': 'Lymhurst', 'journal': ('Fletcher Journal', 'T{tier}_JOURNAL_HUNTER')},
    'spears': {'category': 'hunter', 'bonusCity': 'Fort Sterling', 'journal': ('Fletcher Journal', 'T{tier}_JOURNAL_HUNTER')},
    'nature_staves': {'category': 'hunter', 'bonusCity': 'Thetford', 'journal': ('Fletcher Journal', 'T{tier}_JOURNAL_HUNTER')},
    'daggers': {'category': 'hunter', 'bonusCity': 'Bridgewatch', 'journal': ('Fletcher Journal', 'T{tier}_JOURNAL_HUNTER')},
    'quarterstaffs': {'category': 'hunter', 'bonusCity': 'Martlock', 'journal': ('Fletcher Journal', 'T{tier}_JOURNAL_HUNTER')},
    'shapeshifter': {'category': 'hunter', 'bonusCity': 'Caerleon', 'journal': ('Fletcher Journal', 'T{tier}_JOURNAL_HUNTER')},
    'torches': {'category': 'hunter', 'bonusCity': 'Martlock', 'journal': ('Fletcher Journal', 'T{tier}_JOURNAL_HUNTER')},
    'leather_armor': {'category': 'hunter', 'bonusCity': 'Thetford', 'journal': ('Fletcher Journal', 'T{tier}_JOURNAL_HUNTER')},
    'leather_helmets': {'category': 'hunter', 'bonusCity': 'Lymhurst', 'journal': ('Fletcher Journal', 'T{tier}_JOURNAL_HUNTER')},
    'leather_shoes': {'category': 'hunter', 'bonusCity': 'Lymhurst', 'journal': ('Fletcher Journal', 'T{tier}_JOURNAL_HUNTER')},

    # Mage's Tower
    'fire_staves': {'category': 'mage', 'bonusCity': 'Thetford', 'journal': ('Imbuer Journal', 'T{tier}_JOURNAL_MAGE')},
    'holy_staves': {'category': 'mage', 'bonusCity': 'Fort Sterling', 'journal': ('Imbuer Journal', 'T{tier}_JOURNAL_MAGE')},
    'arcane_staves': {'category': 'mage', 'bonusCity': 'Lymhurst', 'journal': ('Imbuer Journal', 'T{tier}_JOURNAL_MAGE')},
    'frost_staves': {'category': 'mage', 'bonusCity': 'Martlock', 'journal': ('Imbuer Journal', 'T{tier}_JOURNAL_MAGE')},
    'cursed_staves': {'category': 'mage', 'bonusCity': 'Bridgewatch', 'journal': ('Imbuer Journal', 'T{tier}_JOURNAL_MAGE')},
    'tomes': {'category': 'mage', 'bonusCity': 'Martlock', 'journal': ('Imbuer Journal', 'T{tier}_JOURNAL_MAGE')},
    'cloth_armor': {'category': 'mage', 'bonusCity': 'Fort Sterling', 'journal': ('Imbuer Journal', 'T{tier}_JOURNAL_MAGE')},
    'cloth_helmets': {'category': 'mage', 'bonusCity': 'Thetford', 'journal': ('Imbuer Journal', 'T{tier}_JOURNAL_MAGE')},
    'cloth_shoes': {'category': 'mage', 'bonusCity': 'Bridgewatch', 'journal': ('Imbuer Journal', 'T{tier}_JOURNAL_MAGE')},

    # Accessories & Tools
    'bags': {'category': 'accessories', 'bonusCity': 'Brecilien', 'journal': ('Tinker Journal', 'T{tier}_JOURNAL_TOOLMAKER')},
    'capes': {'category': 'accessories', 'bonusCity': 'Brecilien', 'journal': ('Tinker Journal', 'T{tier}_JOURNAL_TOOLMAKER')},
    'tools': {'category': 'tools', 'bonusCity': 'Caerleon', 'journal': ('Tinker Journal', 'T{tier}_JOURNAL_TOOLMAKER')},
    'gathering_gear': {'category': 'gathering', 'bonusCity': 'Caerleon', 'journal': ('Tinker Journal', 'T{tier}_JOURNAL_TOOLMAKER')},

    # Furniture & Siege Banners have NO city bonus anywhere in Albion Online (bonusCity = None)
    'furniture': {'category': 'accessories', 'bonusCity': None, 'journal': ('Tinker Journal', 'T{tier}_JOURNAL_TOOLMAKER')},
    'siege_banners': {'category': 'accessories', 'bonusCity': None, 'journal': ('Tinker Journal', 'T{tier}_JOURNAL_TOOLMAKER')},
}

SUBCAT_MAP = {
    'sword': 'swords',
    'axe': 'axes',
    'mace': 'maces',
    'hammer': 'hammers',
    'crossbow': 'crossbows',
    'knuckles': 'wargloves',
    'shieldtype': 'shields',
    'plate_armor': 'plate_armor',
    'plate_helmet': 'plate_helmets',
    'plate_shoes': 'plate_shoes',

    'bow': 'bows',
    'spear': 'spears',
    'naturestaff': 'nature_staves',
    'dagger': 'daggers',
    'quarterstaff': 'quarterstaffs',
    'shapeshifterstaff': 'shapeshifter',
    'torchtype': 'torches',
    'leather_armor': 'leather_armor',
    'leather_helmet': 'leather_helmets',
    'leather_shoes': 'leather_shoes',

    'firestaff': 'fire_staves',
    'holystaff': 'holy_staves',
    'arcanestaff': 'arcane_staves',
    'froststaff': 'frost_staves',
    'cursestaff': 'cursed_staves',
    'booktype': 'tomes',
    'cloth_armor': 'cloth_armor',
    'cloth_helmet': 'cloth_helmets',
    'cloth_shoes': 'cloth_shoes',

    'bags': 'bags',
    'satchels': 'bags',
    'accessoires_capes_capes': 'capes',
    'accessoires_capes_brecilien': 'capes',
    'accessoires_capes_bridgewatch': 'capes',
    'accessoires_capes_caerleon': 'capes',
    'accessoires_capes_fortsterling': 'capes',
    'accessoires_capes_lymhurst': 'capes',
    'accessoires_capes_martlock': 'capes',
    'accessoires_capes_thetford': 'capes',
    'accessoires_capes_heretic': 'capes',
    'accessoires_capes_undead': 'capes',
    'accessoires_capes_keeper': 'capes',
    'accessoires_capes_morgana': 'capes',
    'accessoires_capes_demon': 'capes',
    'accessoires_capes_avalon': 'capes',
}

FACTION_CAPE_SPECS = {
    'capeitem_fw_bridgewatch': {
        'crestName': 'Bridgewatch Crest',
        'crestTemplate': 'T{tier}_CAPEITEM_FW_BRIDGEWATCH_BP',
        'heartName': 'Beastheart',
        'heartTemplate': 'T1_FACTION_STEPPE_TOKEN_1',
    },
    'capeitem_fw_fortsterling': {
        'crestName': 'Fort Sterling Crest',
        'crestTemplate': 'T{tier}_CAPEITEM_FW_FORTSTERLING_BP',
        'heartName': 'Mountainheart',
        'heartTemplate': 'T1_FACTION_MOUNTAIN_TOKEN_1',
    },
    'capeitem_fw_lymhurst': {
        'crestName': 'Lymhurst Crest',
        'crestTemplate': 'T{tier}_CAPEITEM_FW_LYMHURST_BP',
        'heartName': 'Treeheart',
        'heartTemplate': 'T1_FACTION_FOREST_TOKEN_1',
    },
    'capeitem_fw_martlock': {
        'crestName': 'Martlock Crest',
        'crestTemplate': 'T{tier}_CAPEITEM_FW_MARTLOCK_BP',
        'heartName': 'Rockheart',
        'heartTemplate': 'T1_FACTION_HIGHLAND_TOKEN_1',
    },
    'capeitem_fw_thetford': {
        'crestName': 'Thetford Crest',
        'crestTemplate': 'T{tier}_CAPEITEM_FW_THETFORD_BP',
        'heartName': 'Vineheart',
        'heartTemplate': 'T1_FACTION_SWAMP_TOKEN_1',
    },
    'capeitem_fw_caerleon': {
        'crestName': 'Caerleon Crest',
        'crestTemplate': 'T{tier}_CAPEITEM_FW_CAERLEON_BP',
        'heartName': 'Shadowheart',
        'heartTemplate': 'T1_FACTION_CAERLEON_TOKEN_1',
    },
    'capeitem_fw_brecilien': {
        'crestName': 'Brecilien Crest',
        'crestTemplate': 'T{tier}_CAPEITEM_FW_BRECILIEN_BP',
        'heartName': 'Faerie Fire',
        'heartTemplate': 'QUESTITEM_TOKEN_MISTS',
    },
    'capeitem_avalon': {
        'crestName': 'Avalonian Crest',
        'crestTemplate': 'T{tier}_CAPEITEM_AVALON_BP',
        'heartName': 'Avalonian Energy',
        'heartTemplate': 'QUESTITEM_TOKEN_AVALON',
    },
    'capeitem_smuggler': {
        'crestName': 'Smuggler Crest',
        'crestTemplate': 'T{tier}_CAPEITEM_SMUGGLER_BP',
        'heartName': 'Shadowheart',
        'heartTemplate': 'T1_FACTION_CAERLEON_TOKEN_1',
    },
    'capeitem_heretic': {
        'crestName': 'Heretic Crest',
        'crestTemplate': 'T{tier}_CAPEITEM_HERETIC_BP',
        'heartName': 'Treeheart',
        'heartTemplate': 'T1_FACTION_FOREST_TOKEN_1',
    },
    'capeitem_undead': {
        'crestName': 'Undead Crest',
        'crestTemplate': 'T{tier}_CAPEITEM_UNDEAD_BP',
        'heartName': 'Mountainheart',
        'heartTemplate': 'T1_FACTION_MOUNTAIN_TOKEN_1',
    },
    'capeitem_keeper': {
        'crestName': 'Keeper Crest',
        'crestTemplate': 'T{tier}_CAPEITEM_KEEPER_BP',
        'heartName': 'Rockheart',
        'heartTemplate': 'T1_FACTION_HIGHLAND_TOKEN_1',
    },
    'capeitem_morgana': {
        'crestName': 'Morgana Crest',
        'crestTemplate': 'T{tier}_CAPEITEM_MORGANA_BP',
        'heartName': 'Vineheart',
        'heartTemplate': 'T1_FACTION_SWAMP_TOKEN_1',
    },
    'capeitem_demon': {
        'crestName': 'Demon Crest',
        'crestTemplate': 'T{tier}_CAPEITEM_DEMON_BP',
        'heartName': 'Beastheart',
        'heartTemplate': 'T1_FACTION_STEPPE_TOKEN_1',
    },
}

# Royal equipment transmutation specifications (0% RRR, 0 Focus cost)
ROYAL_SPECS = {
    'head_cloth_royal': {
        'name': 'Royal Cowl',
        'category': 'mage',
        'subcategory': 'cloth_helmets',
        'template': 'T{tier}_HEAD_CLOTH_ROYAL',
        'baseItemName': 'Scholar Cowl',
        'baseItemIcon': 'T{tier}_HEAD_CLOTH_SET1',
        'sigilType': 'head_shoes',
        'journal': ('Imbuer Journal', 'T{tier}_JOURNAL_MAGE'),
    },
    'armor_cloth_royal': {
        'name': 'Royal Robe',
        'category': 'mage',
        'subcategory': 'cloth_armor',
        'template': 'T{tier}_ARMOR_CLOTH_ROYAL',
        'baseItemName': 'Scholar Robe',
        'baseItemIcon': 'T{tier}_ARMOR_CLOTH_SET1',
        'sigilType': 'armor',
        'journal': ('Imbuer Journal', 'T{tier}_JOURNAL_MAGE'),
    },
    'shoes_cloth_royal': {
        'name': 'Royal Sandals',
        'category': 'mage',
        'subcategory': 'cloth_shoes',
        'template': 'T{tier}_SHOES_CLOTH_ROYAL',
        'baseItemName': 'Scholar Sandals',
        'baseItemIcon': 'T{tier}_SHOES_CLOTH_SET1',
        'sigilType': 'head_shoes',
        'journal': ('Imbuer Journal', 'T{tier}_JOURNAL_MAGE'),
    },
    'head_leather_royal': {
        'name': 'Royal Hood',
        'category': 'hunter',
        'subcategory': 'leather_helmets',
        'template': 'T{tier}_HEAD_LEATHER_ROYAL',
        'baseItemName': 'Mercenary Hood',
        'baseItemIcon': 'T{tier}_HEAD_LEATHER_SET1',
        'sigilType': 'head_shoes',
        'journal': ('Fletcher Journal', 'T{tier}_JOURNAL_HUNTER'),
    },
    'armor_leather_royal': {
        'name': 'Royal Jacket',
        'category': 'hunter',
        'subcategory': 'leather_armor',
        'template': 'T{tier}_ARMOR_LEATHER_ROYAL',
        'baseItemName': 'Mercenary Jacket',
        'baseItemIcon': 'T{tier}_ARMOR_LEATHER_SET1',
        'sigilType': 'armor',
        'journal': ('Fletcher Journal', 'T{tier}_JOURNAL_HUNTER'),
    },
    'shoes_leather_royal': {
        'name': 'Royal Shoes',
        'category': 'hunter',
        'subcategory': 'leather_shoes',
        'template': 'T{tier}_SHOES_LEATHER_ROYAL',
        'baseItemName': 'Mercenary Shoes',
        'baseItemIcon': 'T{tier}_SHOES_LEATHER_SET1',
        'sigilType': 'head_shoes',
        'journal': ('Fletcher Journal', 'T{tier}_JOURNAL_HUNTER'),
    },
    'head_plate_royal': {
        'name': 'Royal Helmet',
        'category': 'warrior',
        'subcategory': 'plate_helmets',
        'template': 'T{tier}_HEAD_PLATE_ROYAL',
        'baseItemName': 'Soldier Helmet',
        'baseItemIcon': 'T{tier}_HEAD_PLATE_SET1',
        'sigilType': 'head_shoes',
        'journal': ('Blacksmith Journal', 'T{tier}_JOURNAL_WARRIOR'),
    },
    'armor_plate_royal': {
        'name': 'Royal Armor',
        'category': 'warrior',
        'subcategory': 'plate_armor',
        'template': 'T{tier}_ARMOR_PLATE_ROYAL',
        'baseItemName': 'Soldier Armor',
        'baseItemIcon': 'T{tier}_ARMOR_PLATE_SET1',
        'sigilType': 'armor',
        'journal': ('Blacksmith Journal', 'T{tier}_JOURNAL_WARRIOR'),
    },
    'shoes_plate_royal': {
        'name': 'Royal Boots',
        'category': 'warrior',
        'subcategory': 'plate_shoes',
        'template': 'T{tier}_SHOES_PLATE_ROYAL',
        'baseItemName': 'Soldier Boots',
        'baseItemIcon': 'T{tier}_SHOES_PLATE_SET1',
        'sigilType': 'head_shoes',
        'journal': ('Blacksmith Journal', 'T{tier}_JOURNAL_WARRIOR'),
    },
}

items_dict = raw_data['items']
by_uid = {}
for _lst in items_dict.values():
    if isinstance(_lst, list):
        for _obj in _lst:
            if isinstance(_obj, dict) and _obj.get('@uniquename') and _obj['@uniquename'] not in by_uid:
                by_uid[_obj['@uniquename']] = _obj
    elif isinstance(_lst, dict) and _lst.get('@uniquename') and _lst['@uniquename'] not in by_uid:
        by_uid[_lst['@uniquename']] = _lst

all_items = []
for itype in ['weapon', 'transformationweapon', 'equipmentitem', 'siegebanner', 'trackingitem', 'furnitureitem']:
    lst = items_dict.get(itype, [])
    if isinstance(lst, dict):
        lst = [lst]
    all_items.extend(lst)

template_groups = OrderedDict()

for item in all_items:
    uname = item.get('@uniquename', '')
    tier_str = item.get('@tier', '1')
    try:
        tier = int(tier_str)
    except:
        continue
    if tier < 2 or tier > 8:
        continue

    # Filter out vanity, internal, arena, quest, event, prototype, and obsolete items
    if any(x in uname for x in [
        'VANITY', 'INTERNAL', 'ARENA', 'TUTORIAL', 'TEST', 'DEBUG', 'PVP', 
        'ROYAL_BANNER', 'FOUNDER', 'EASTER', 'XMAS', 'TELLAFRIEND', 'ANNIVERSARY',
        'PROTOTYPE', 'IRONGAUNTLETS' # Obsolete Black Hands
    ]):
        continue

    # Get crafting requirements
    req = item.get('craftingrequirements')
    if not req:
        continue
    if isinstance(req, list):
        req = req[0]
    
    craft_resources = req.get('craftresource', [])
    if isinstance(craft_resources, dict):
        craft_resources = [craft_resources]
    if not craft_resources:
        continue

    # Subcategory mapping
    shop_sub = item.get('@shopsubcategory1', '')
    
    if 'TOOL' in uname:
        subcat = 'tools'
    elif 'GATHERER' in uname:
        subcat = 'gathering_gear'
    elif 'SIEGE_BANNER' in uname:
        subcat = 'siege_banners'
    elif any(k in uname for k in ['_BED', '_CHEST', '_TABLE', '_REPAIRKIT']):
        subcat = 'furniture'
    elif shop_sub in SUBCAT_MAP:
        subcat = SUBCAT_MAP[shop_sub]
    else:
        continue

    rule = RULES.get(subcat)
    if not rule:
        continue

    # Create base template name
    parts = uname.split('_')
    base_template = 'T{tier}_' + '_'.join(parts[1:])
    
    if base_template not in template_groups:
        template_groups[base_template] = []
    template_groups[base_template].append((tier, item, req, craft_resources, subcat))

print(f"Aggregated {len(template_groups)} valid craftable base templates!")

catalog = []
seen_ids = set()

for base_template, tier_data in template_groups.items():
    tier_data.sort(key=lambda x: x[0])
    min_tier, sample_item, sample_req, sample_res, subcat = tier_data[0]
    max_tier = tier_data[-1][0]
    sample_uname = sample_item.get('@uniquename')
    
    slug = '_'.join(base_template.replace('T{tier}_', '').lower().split('_'))
    if slug in seen_ids or 'prototype' in slug:
        continue
    seen_ids.add(slug)

    clean_base = base_template.replace("T{tier}_", "")
    full_loc_name = uname_to_name.get(sample_uname) or uname_to_name.get(f'T4_{clean_base}') or slug.replace('_', ' ').title()
    clean_name = clean_item_name(full_loc_name)

    # Name overrides & maxTier limits
    custom_max_tier = max_tier
    if base_template == 'T{tier}_FURNITUREITEM_BED':
        clean_name = 'Bed'
        custom_max_tier = 8
    elif base_template == 'T{tier}_FURNITUREITEM_CHEST':
        clean_name = 'Chest'
        custom_max_tier = 5 # Chests in Albion Online only exist at T2, T3, T4, T5!
    elif base_template == 'T{tier}_FURNITUREITEM_TABLE':
        clean_name = 'Table'
        custom_max_tier = 8
    elif base_template == 'T{tier}_FURNITUREITEM_REPAIRKIT':
        clean_name = 'Repair Kit'
        custom_max_tier = 8
    elif base_template == 'T{tier}_SIEGE_BANNER':
        clean_name = 'Siege Banner'
        custom_max_tier = 8
    elif base_template == 'T{tier}_2H_TOOL_TRACKING':
        clean_name = 'Tracking Toolkit'
        custom_max_tier = 8
    elif base_template == 'T{tier}_2H_KNUCKLES_HELL':
        clean_name = 'Hellfire Hands'

    rule = RULES[subcat]
    base_iv = float(sample_item.get('@itemvalue') or 120)
    base_fame = float(sample_item.get('@craftingfame') or 270)
    base_focus = float(sample_req.get('@craftingfocus') or 105)

    focus_by_tier = {}
    max_fame_factor = 1.0
    for t_i, it_i, req_i, _, _ in tier_data:
        cf = req_i.get('@craftingfocus') if isinstance(req_i, dict) else None
        if cf is not None:
            focus_by_tier[str(t_i)] = round(float(cf))
        ff = it_i.get('@destinyandjournalcraftfamefactor')
        if ff is not None:
            max_fame_factor = max(max_fame_factor, float(ff))
    destiny_factor = round(max_fame_factor, 2)

    # Check if this is a Faction Cape
    if slug in FACTION_CAPE_SPECS:
        fspec = FACTION_CAPE_SPECS[slug]
        cape_art_qty = {'4': 15, '5': 15, '6': 45, '7': 75, '8': 150} if slug == 'capeitem_avalon' else {'4': 1, '5': 1, '6': 3, '7': 5, '8': 10}
        catalog.append({
            'id': slug,
            'name': clean_name,
            'category': rule['category'],
            'subcategory': subcat,
            'template': base_template,
            'minTier': 4,
            'maxTier': 8,
            'allowEnchantment': True,
            'primaryMatName': 'Cape',
            'primaryQty': 1,
            'primaryMatIcon': 'T{tier}_CAPE',
            'secondaryMatName': fspec['crestName'],
            'secondaryQty': 1,
            'secondaryMatIcon': fspec['crestTemplate'],
            'bonusCity': None, # In Albion Online, Faction Capes are @maxreturnamount: 0 (no city bonus)
            'isArtifact': True,
            'artifactType': 'Faction Heart',
            'artifactName': fspec['heartName'],
            'artifactTemplate': fspec['heartTemplate'],
            'artifactQty': cape_art_qty,
            'isFactionCape': True,
            'isNoReturn': True, # 0% RRR refund in Albion Online
            'journalName': rule['journal'][0],
            'journalTemplate': rule['journal'][1],
            'famePerUnit': 0,
            'destinyFactor': 1.0,
            'baseItemValue': base_iv,
            'artifactItemValue': 0,
            'artifactItemValueByTier': {},
            'baseFocus': 0, # Faction cape crafting does not consume focus
            'focusByTier': {},
        })
        continue

    # Check if this is a Royal Equipment item
    if slug in ROYAL_SPECS:
        rspec = ROYAL_SPECS[slug]
        royal_sigil_qty = {'4': 4, '5': 8, '6': 16, '7': 16, '8': 16} if rspec['sigilType'] == 'armor' else {'4': 2, '5': 4, '6': 8, '7': 8, '8': 8}
        catalog.append({
            'id': slug,
            'name': rspec['name'],
            'category': rspec['category'],
            'subcategory': rspec['subcategory'],
            'template': rspec['template'],
            'minTier': 4,
            'maxTier': 8,
            'allowEnchantment': True,
            'primaryMatName': rspec['baseItemName'],
            'primaryQty': 1,
            'primaryMatIcon': rspec['baseItemIcon'],
            'secondaryMatName': None,
            'secondaryQty': 0,
            'secondaryMatIcon': None,
            'bonusCity': None, # Royal transmutations have 0% return rate and 0 focus
            'isArtifact': True,
            'artifactType': 'Royal Sigil',
            'artifactName': 'Royal Sigil',
            'artifactTemplate': 'QUESTITEM_TOKEN_ROYAL_T{tier}',
            'artifactQty': royal_sigil_qty,
            'isRoyal': True,
            'sigilType': rspec['sigilType'],
            'isNoReturn': True,
            'journalName': rspec['journal'][0],
            'journalTemplate': rspec['journal'][1],
            'famePerUnit': 0,
            'destinyFactor': 1.0,
            'baseItemValue': base_iv,
            'artifactItemValue': 0,
            'artifactItemValueByTier': {},
            'baseFocus': 0,
            'focusByTier': {},
        })
        continue

    # Regular craftable gear (parse primary, secondary, artifact, and any 3rd/4th extra slots across all tiers)
    regular_mats = []
    artifact_res = None
    for r in sample_res:
        rname = r.get('@uniquename', '')
        rcount = int(r.get('@count', 1))
        if is_artifact_ingredient(rname):
            artifact_res = (rname, rcount)
        elif not is_extra_ingredient(rname):
            mat_name, icon_tmpl = parse_material(rname)
            regular_mats.append((mat_name, rcount, icon_tmpl, r.get('@maxreturnamount') == '0'))

    if not regular_mats:
        continue

    # Detect tier-varying quantities on primary/secondary slots (e.g., T2 vs T3-T8 Bag & Siege Hammer)
    prim_qty_by_tier = {}
    sec_qty_by_tier = {}
    extra_slots_by_idx = {}

    for t_i, _, _, res_i, _ in tier_data:
        tier_reg = []
        tier_extras = []
        for r_i in res_i:
            ru = r_i.get('@uniquename', '')
            rc = int(r_i.get('@count', 1))
            no_ret = (r_i.get('@maxreturnamount') == '0')
            if is_artifact_ingredient(ru):
                continue
            elif is_extra_ingredient(ru):
                tier_extras.append((ru, rc, no_ret))
            else:
                mat_name_i, icon_tmpl_i = parse_material(ru)
                tier_reg.append((mat_name_i, rc, icon_tmpl_i, no_ret))
        if tier_reg:
            prim_qty_by_tier[str(t_i)] = tier_reg[0][1]
            if len(tier_reg) > 1:
                sec_qty_by_tier[str(t_i)] = tier_reg[1][1]
            if len(tier_reg) > 2:
                for extra_r in tier_reg[2:]:
                    tier_extras.append((extra_r[2], extra_r[1], extra_r[3]))
        for ex_idx, (ex_u, ex_c, ex_noret) in enumerate(tier_extras):
            bucket = extra_slots_by_idx.setdefault(ex_idx, {})
            bucket[str(t_i)] = (ex_u, ex_c, ex_noret)

    primary_name, primary_qty, primary_icon, primary_no_return = regular_mats[0]
    default_t_key = '4' if '4' in prim_qty_by_tier else str(max_tier)
    if prim_qty_by_tier and len(set(prim_qty_by_tier.values())) > 1:
        primary_qty = prim_qty_by_tier.get(default_t_key, primary_qty)
    else:
        prim_qty_by_tier = None

    if len(regular_mats) > 1:
        secondary_name, secondary_qty, secondary_icon, secondary_no_return = regular_mats[1]
        if sec_qty_by_tier and len(set(sec_qty_by_tier.values())) > 1:
            secondary_qty = sec_qty_by_tier.get(default_t_key, secondary_qty)
        else:
            sec_qty_by_tier = None
    else:
        secondary_name, secondary_qty, secondary_icon, secondary_no_return = (None, 0, None, False)
        sec_qty_by_tier = None

    extra_materials = []
    for ex_idx in sorted(extra_slots_by_idx.keys()):
        tmap = extra_slots_by_idx[ex_idx]
        ref_t = '4' if '4' in tmap else sorted(tmap.keys(), key=int)[0]
        ref_u, ref_c, ref_noret = tmap[ref_t]
        ref_name = uname_to_name.get(ref_u, ref_u)
        slot_id = 'alchemy_remains' if 'ALCHEMY' in ref_u.upper() else f'extra_{ex_idx + 1}'
        by_tier_payload = {}
        for t_str, (eu, ec, enr) in sorted(tmap.items(), key=lambda kv: int(kv[0])):
            by_tier_payload[t_str] = {
                'template': eu,
                'name': uname_to_name.get(eu, eu),
                'qty': ec,
                'noReturn': enr,
            }
        extra_materials.append({
            'id': slot_id,
            'name': ref_name,
            'template': ref_u,
            'qty': ref_c,
            'noReturn': ref_noret,
            'isRefinedResource': not ref_noret and ('ALCHEMY' not in ref_u.upper()),
            'byTier': by_tier_payload,
        })

    is_artifact = artifact_res is not None
    art_type = None
    art_name = None
    art_tmpl = None
    art_qty_field = None
    art_no_return = True
    art_iv_t4 = 0.0
    art_iv_by_tier = {}
    if is_artifact:
        art_uname = artifact_res[0]
        art_type = detect_artifact_type(art_uname)

        art_unames_by_tier = {}
        art_qty_by_tier = {}
        for t_i, _, _, res_i, _ in tier_data:
            for r_i in res_i:
                ru = r_i.get('@uniquename', '')
                if is_artifact_ingredient(ru):
                    rc = int(r_i.get('@count', 1))
                    art_unames_by_tier[str(t_i)] = ru
                    art_qty_by_tier[str(t_i)] = rc
                    if r_i.get('@maxreturnamount') not in (None, '0'):
                        art_no_return = False
                    art_obj = by_uid.get(ru) or {}
                    r_iv = float(art_obj.get('@itemvalue') or 0)
                    if r_iv > 0:
                        art_iv_by_tier[str(t_i)] = r_iv * rc

        distinct_art_names = set(art_unames_by_tier.values())
        art_parts = art_uname.split('_')
        # Keep literal fixed item ID when every tier consumes the exact same ID (e.g. T4_SKILLBOOK_STANDARD)
        is_fixed_tier_art = len(distinct_art_names) == 1 and len(tier_data) > 1
        if (not is_fixed_tier_art) and art_uname.startswith('T') and '_' in art_uname and art_parts[0][1:].isdigit():
            art_tmpl = 'T{tier}_' + '_'.join(art_parts[1:])
        else:
            art_tmpl = art_uname

        clean_art = art_tmpl.replace("T{tier}_", "")
        art_loc = uname_to_name.get(art_uname) or uname_to_name.get(f'T4_{clean_art}')
        art_name = (art_loc if is_fixed_tier_art else clean_item_name(art_loc)) if art_loc else f"{clean_name} Artifact"

        if art_qty_by_tier:
            uniq_q = set(art_qty_by_tier.values())
            if len(uniq_q) > 1:
                art_qty_field = art_qty_by_tier
            elif next(iter(uniq_q)) != 1:
                art_qty_field = next(iter(uniq_q))
        if '4' in art_iv_by_tier:
            art_iv_t4 = art_iv_by_tier['4']
        else:
            t4_obj = by_uid.get(f'T4_{clean_art}') or by_uid.get(art_uname) or {}
            art_iv_t4 = float(t4_obj.get('@itemvalue') or 0) * int(artifact_res[1] or 1)

    # Enchantment eligibility rule:
    # Gathering Tools (pickaxes, axes, etc.), Furniture (beds, tables, chests),
    # and Siege Banners do NOT have enchantments (.0 Flat only).
    # Gathering gear, regular gear, faction capes, and royal gear CAN be enchanted (.0 to .4)!
    allow_enchantment = True
    if subcat in ['tools', 'furniture', 'siege_banners']:
        allow_enchantment = False

    catalog.append({
        'id': slug,
        'name': clean_name,
        'category': rule['category'],
        'subcategory': subcat,
        'template': base_template,
        'minTier': min_tier,
        'maxTier': custom_max_tier,
        'allowEnchantment': allow_enchantment,
        'primaryMatName': primary_name,
        'primaryQty': primary_qty,
        **({'primaryQtyByTier': prim_qty_by_tier} if prim_qty_by_tier else {}),
        'primaryMatIcon': primary_icon,
        'primaryNoReturn': primary_no_return,
        'secondaryMatName': secondary_name,
        'secondaryQty': secondary_qty,
        **({'secondaryQtyByTier': sec_qty_by_tier} if sec_qty_by_tier else {}),
        'secondaryMatIcon': secondary_icon,
        'secondaryNoReturn': secondary_no_return,
        'bonusCity': rule['bonusCity'],
        'isArtifact': is_artifact,
        'artifactType': art_type,
        'artifactName': art_name,
        'artifactTemplate': art_tmpl,
        **({'artifactQty': art_qty_field} if art_qty_field is not None else {}),
        **({'artifactNoReturn': art_no_return} if is_artifact else {}),
        'artifactItemValue': art_iv_t4,
        'artifactItemValueByTier': art_iv_by_tier,
        **({'extraMaterials': extra_materials} if extra_materials else {}),
        'journalName': rule['journal'][0],
        'journalTemplate': rule['journal'][1],
        'famePerUnit': base_fame,
        'destinyFactor': destiny_factor,
        'baseItemValue': base_iv,
        'baseFocus': focus_by_tier.get(str(min_tier), base_focus),
        'focusByTier': focus_by_tier,
    })

print(f"Successfully generated catalog with {len(catalog)} unique craftable items!")

out_backend = os.path.join(BASE_DIR, 'generated_catalog.json')
out_frontend = os.path.abspath(os.path.join(BASE_DIR, '..', '..', '..', 'frontend', 'src', 'data', 'craftableItems.json'))

with open(out_backend, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, indent=2)

with open(out_frontend, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, indent=2)

print("Saved to both backend and frontend catalog files!")
