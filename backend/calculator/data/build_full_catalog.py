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

RULES = {
    # Warrior's Forge
    'swords': {'category': 'warrior', 'bonusCity': 'Lymhurst', 'journal': ('Blacksmith Journal', 'T{tier}_JOURNAL_WARRIOR')},
    'axes': {'category': 'warrior', 'bonusCity': 'Martlock', 'journal': ('Blacksmith Journal', 'T{tier}_JOURNAL_WARRIOR')},
    'maces': {'category': 'warrior', 'bonusCity': 'Thetford', 'journal': ('Blacksmith Journal', 'T{tier}_JOURNAL_WARRIOR')},
    'hammers': {'category': 'warrior', 'bonusCity': 'Fort Sterling', 'journal': ('Blacksmith Journal', 'T{tier}_JOURNAL_WARRIOR')},
    'crossbows': {'category': 'warrior', 'bonusCity': 'Bridgewatch', 'journal': ('Blacksmith Journal', 'T{tier}_JOURNAL_WARRIOR')},
    'wargloves': {'category': 'warrior', 'bonusCity': 'Caerleon', 'journal': ('Blacksmith Journal', 'T{tier}_JOURNAL_WARRIOR')},
    'shields': {'category': 'warrior', 'bonusCity': 'Fort Sterling', 'journal': ('Blacksmith Journal', 'T{tier}_JOURNAL_WARRIOR')},
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
    'torches': {'category': 'hunter', 'bonusCity': 'Lymhurst', 'journal': ('Fletcher Journal', 'T{tier}_JOURNAL_HUNTER')},
    'leather_armor': {'category': 'hunter', 'bonusCity': 'Thetford', 'journal': ('Fletcher Journal', 'T{tier}_JOURNAL_HUNTER')},
    'leather_helmets': {'category': 'hunter', 'bonusCity': 'Lymhurst', 'journal': ('Fletcher Journal', 'T{tier}_JOURNAL_HUNTER')},
    'leather_shoes': {'category': 'hunter', 'bonusCity': 'Lymhurst', 'journal': ('Fletcher Journal', 'T{tier}_JOURNAL_HUNTER')},

    # Mage's Tower
    'fire_staves': {'category': 'mage', 'bonusCity': 'Thetford', 'journal': ('Imbuer Journal', 'T{tier}_JOURNAL_MAGE')},
    'holy_staves': {'category': 'mage', 'bonusCity': 'Fort Sterling', 'journal': ('Imbuer Journal', 'T{tier}_JOURNAL_MAGE')},
    'arcane_staves': {'category': 'mage', 'bonusCity': 'Lymhurst', 'journal': ('Imbuer Journal', 'T{tier}_JOURNAL_MAGE')},
    'frost_staves': {'category': 'mage', 'bonusCity': 'Martlock', 'journal': ('Imbuer Journal', 'T{tier}_JOURNAL_MAGE')},
    'cursed_staves': {'category': 'mage', 'bonusCity': 'Bridgewatch', 'journal': ('Imbuer Journal', 'T{tier}_JOURNAL_MAGE')},
    'tomes': {'category': 'mage', 'bonusCity': 'Fort Sterling', 'journal': ('Imbuer Journal', 'T{tier}_JOURNAL_MAGE')},
    'cloth_armor': {'category': 'mage', 'bonusCity': 'Fort Sterling', 'journal': ('Imbuer Journal', 'T{tier}_JOURNAL_MAGE')},
    'cloth_helmets': {'category': 'mage', 'bonusCity': 'Martlock', 'journal': ('Imbuer Journal', 'T{tier}_JOURNAL_MAGE')},
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
        'baseItemName': 'Cleric Robe',
        'baseItemIcon': 'T{tier}_ARMOR_CLOTH_SET2',
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
        'baseItemName': 'Hunter Shoes',
        'baseItemIcon': 'T{tier}_SHOES_LEATHER_SET2',
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

    # Check if this is a Faction Cape
    if slug in FACTION_CAPE_SPECS:
        fspec = FACTION_CAPE_SPECS[slug]
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
            'isFactionCape': True,
            'isNoReturn': True, # 0% RRR refund in Albion Online
            'journalName': rule['journal'][0],
            'journalTemplate': rule['journal'][1],
            'famePerUnit': 0,
            'baseItemValue': base_iv,
            'baseFocus': 0, # Faction cape crafting does not consume focus
        })
        continue

    # Check if this is a Royal Equipment item
    if slug in ROYAL_SPECS:
        rspec = ROYAL_SPECS[slug]
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
            'isRoyal': True,
            'sigilType': rspec['sigilType'],
            'isNoReturn': True,
            'journalName': rspec['journal'][0],
            'journalTemplate': rspec['journal'][1],
            'famePerUnit': 0,
            'baseItemValue': base_iv,
            'baseFocus': 0,
        })
        continue

    # Regular craftable gear
    regular_mats = []
    artifact_res = None
    for r in sample_res:
        rname = r.get('@uniquename', '')
        rcount = int(r.get('@count', 1))
        if any(x in rname for x in ['ARTEFACT', 'CREST', 'REMNANT', 'TOKEN', 'HEART', 'AVALON']):
            artifact_res = (rname, rcount)
        else:
            mat_name, icon_tmpl = parse_material(rname)
            regular_mats.append((mat_name, rcount, icon_tmpl))

    if not regular_mats:
        continue

    primary_name, primary_qty, primary_icon = regular_mats[0]
    secondary_name, secondary_qty, secondary_icon = (regular_mats[1][0], regular_mats[1][1], regular_mats[1][2]) if len(regular_mats) > 1 else (None, 0, None)

    is_artifact = artifact_res is not None
    art_type = None
    art_name = None
    art_tmpl = None
    if is_artifact:
        art_uname = artifact_res[0]
        art_type = detect_artifact_type(art_uname)
        art_parts = art_uname.split('_')
        art_tmpl = 'T{tier}_' + '_'.join(art_parts[1:])
        clean_art = art_tmpl.replace("T{tier}_", "")
        art_loc = uname_to_name.get(art_uname) or uname_to_name.get(f'T4_{clean_art}')
        art_name = clean_item_name(art_loc) if art_loc else f"{clean_name} Artifact"

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
        'primaryMatIcon': primary_icon,
        'secondaryMatName': secondary_name,
        'secondaryQty': secondary_qty,
        'secondaryMatIcon': secondary_icon,
        'bonusCity': rule['bonusCity'],
        'isArtifact': is_artifact,
        'artifactType': art_type,
        'artifactName': art_name,
        'artifactTemplate': art_tmpl,
        'journalName': rule['journal'][0],
        'journalTemplate': rule['journal'][1],
        'famePerUnit': base_fame,
        'baseItemValue': base_iv,
        'baseFocus': base_focus,
    })

print(f"Successfully generated catalog with {len(catalog)} unique craftable items!")

out_backend = os.path.join(BASE_DIR, 'generated_catalog.json')
out_frontend = os.path.abspath(os.path.join(BASE_DIR, '..', '..', '..', 'frontend', 'src', 'data', 'craftableItems.json'))

with open(out_backend, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, indent=2)

with open(out_frontend, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, indent=2)

print("Saved to both backend and frontend catalog files!")
