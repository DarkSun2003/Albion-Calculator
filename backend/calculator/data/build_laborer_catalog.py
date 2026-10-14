import json
import os

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = BASE_DIR
FRONTEND_DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', '..', '..', 'frontend', 'src', 'data'))
os.makedirs(FRONTEND_DATA_DIR, exist_ok=True)

with open(os.path.join(DATA_DIR, 'formatted_items.json'), 'r', encoding='utf-8') as f:
    formatted_data = json.load(f)

uname_to_name = {}
for it in formatted_data:
    uname = it.get('UniqueName')
    names = it.get('LocalizedNames')
    if uname and names and 'EN-US' in names:
        uname_to_name[uname] = names['EN-US']

PROFESSIONS = [
    {
        'id': 'blacksmith',
        'name': 'Blacksmith (Warrior)',
        'type': 'crafting',
        'code': 'WARRIOR',
        'desc': 'Consumes Blacksmith journals from crafting Swords, Axes, Maces, Shields, and Plate Armor.',
        'returns': [('T{tier}_METALBAR', 0.6), ('T{tier}_PLANKS', 0.4)],
        'icon': 'T4_JOURNAL_WARRIOR_FULL.png',
    },
    {
        'id': 'fletcher',
        'name': 'Fletcher (Hunter)',
        'type': 'crafting',
        'code': 'HUNTER',
        'desc': 'Consumes Fletcher journals from crafting Bows, Spears, Daggers, Torches, and Leather Armor.',
        'returns': [('T{tier}_LEATHER', 0.6), ('T{tier}_PLANKS', 0.4)],
        'icon': 'T4_JOURNAL_HUNTER_FULL.png',
    },
    {
        'id': 'imbuer',
        'name': 'Imbuer (Mage)',
        'type': 'crafting',
        'code': 'MAGE',
        'desc': 'Consumes Imbuer journals from crafting Fire, Holy, Frost, Arcane staffs, Tomes, and Cloth Armor.',
        'returns': [('T{tier}_CLOTH', 0.6), ('T{tier}_METALBAR', 0.4)],
        'icon': 'T4_JOURNAL_MAGE_FULL.png',
    },
    {
        'id': 'tinker',
        'name': 'Tinker (Toolmaker)',
        'type': 'crafting',
        'code': 'TOOLMAKER',
        'desc': 'Consumes Tinker journals from crafting Tools, Capes, Bags, and Furniture.',
        'returns': [('T{tier}_PLANKS', 0.35), ('T{tier}_METALBAR', 0.35), ('T{tier}_CLOTH', 0.3)],
        'icon': 'T4_JOURNAL_TOOLMAKER_FULL.png',
    },
    {
        'id': 'lumberjack',
        'name': 'Lumberjack (Woodcutter)',
        'type': 'gathering',
        'code': 'WOOD',
        'desc': 'Consumes Lumberjack journals from chopping trees in Forest and Steppe biomes.',
        'returns': [('T{tier}_WOOD', 0.75), ('T{tier}_PLANKS', 0.25)],
        'icon': 'T4_JOURNAL_WOOD_FULL.png',
    },
    {
        'id': 'stonecutter',
        'name': 'Stonecutter',
        'type': 'gathering',
        'code': 'STONE',
        'desc': 'Consumes Stonecutter journals from quarrying rocks in Highland and Swamp biomes.',
        'returns': [('T{tier}_ROCK', 0.75), ('T{tier}_STONEBLOCK', 0.25)],
        'icon': 'T4_JOURNAL_STONE_FULL.png',
    },
    {
        'id': 'prospector',
        'name': 'Prospector (Miner)',
        'type': 'gathering',
        'code': 'ORE',
        'desc': 'Consumes Prospector journals from mining ore veins in Mountain and Highland biomes.',
        'returns': [('T{tier}_ORE', 0.75), ('T{tier}_METALBAR', 0.25)],
        'icon': 'T4_JOURNAL_ORE_FULL.png',
    },
    {
        'id': 'cropper',
        'name': 'Cropper (Harvester)',
        'type': 'gathering',
        'code': 'FIBER',
        'desc': 'Consumes Cropper journals from gathering fiber plants in Swamp and Forest biomes.',
        'returns': [('T{tier}_FIBER', 0.75), ('T{tier}_CLOTH', 0.25)],
        'icon': 'T4_JOURNAL_FIBER_FULL.png',
    },
    {
        'id': 'gamekeeper',
        'name': 'Gamekeeper (Skinner)',
        'type': 'gathering',
        'code': 'HIDE',
        'desc': 'Consumes Gamekeeper journals from skinning beasts in Steppe and Swamp biomes.',
        'returns': [('T{tier}_HIDE', 0.75), ('T{tier}_LEATHER', 0.25)],
        'icon': 'T4_JOURNAL_HIDE_FULL.png',
    },
    {
        'id': 'fisherman',
        'name': 'Fisherman',
        'type': 'gathering',
        'code': 'FISHING',
        'desc': 'Consumes Fisherman journals from catching fish in rivers, lakes, and oceans.',
        'returns': [('T{tier}_FISH_FRESHWATER', 0.5), ('T{tier}_FISH_SALTWATER', 0.5)],
        'icon': 'T4_JOURNAL_FISHING_FULL.png',
    },
    {
        'id': 'mercenary',
        'name': 'Mercenary',
        'type': 'mercenary',
        'code': 'MERCENARY',
        'desc': 'Consumes Mercenary journals filled by slaying open-world mobs and dungeon bosses.',
        'returns': [('SILVER', 1.0)],
        'icon': 'T4_JOURNAL_MERCENARY_FULL.png',
    },
]

# Base returns at 100% Happiness per tier
BASE_YIELDS = {
    'crafting': {2: 7.2, 3: 8.0, 4: 11.5, 5: 14.4, 6: 17.6, 7: 20.8, 8: 24.0},
    'gathering': {2: 24.0, 3: 32.0, 4: 48.0, 5: 64.0, 6: 80.0, 7: 96.0, 8: 112.0},
    'mercenary': {2: 1000, 3: 2500, 4: 5500, 5: 10800, 6: 20000, 7: 36000, 8: 65000},
}

FAME_REQUIREMENTS = {
    'crafting': {2: 300, 3: 600, 4: 1200, 5: 2400, 6: 4800, 7: 9600, 8: 19200},
    'gathering': {2: 200, 3: 450, 4: 900, 5: 1800, 6: 3600, 7: 7200, 8: 14400},
    'mercenary': {2: 500, 3: 1200, 4: 2500, 5: 5000, 6: 10000, 7: 20000, 8: 40000},
}

HOUSE_TIERS = [
    {'tier': 2, 'name': "Novice's House", 'laborers': 1, 'beds': 1, 'tables': 1, 'blocks': 30, 'planks': 30},
    {'tier': 3, 'name': "Journeyman's House", 'laborers': 2, 'beds': 2, 'tables': 1, 'blocks': 60, 'planks': 60},
    {'tier': 4, 'name': "Adept's House", 'laborers': 3, 'beds': 3, 'tables': 1, 'blocks': 180, 'planks': 180},
    {'tier': 5, 'name': "Expert's House", 'laborers': 3, 'beds': 3, 'tables': 1, 'blocks': 360, 'planks': 360},
    {'tier': 6, 'name': "Master's House", 'laborers': 3, 'beds': 3, 'tables': 1, 'blocks': 720, 'planks': 720},
    {'tier': 7, 'name': "Grandmaster's House", 'laborers': 3, 'beds': 3, 'tables': 1, 'blocks': 1440, 'planks': 1440},
    {'tier': 8, 'name': "Elder's House", 'laborers': 3, 'beds': 3, 'tables': 1, 'blocks': 2880, 'planks': 2880},
]

catalog = []

for prof in PROFESSIONS:
    p_id = prof['id']
    p_type = prof['type']
    p_code = prof['code']
    
    for tier in range(2, 9):
        full_id = f"T{tier}_JOURNAL_{p_code}_FULL"
        empty_id = f"T{tier}_JOURNAL_{p_code}_EMPTY"
        
        full_name = uname_to_name.get(full_id, f"T{tier} {prof['name']} Journal (Full)")
        empty_name = uname_to_name.get(empty_id, f"T{tier} {prof['name']} Journal (Empty)")
        
        base_yield = BASE_YIELDS[p_type][tier]
        fame_req = FAME_REQUIREMENTS[p_type][tier]
        
        returns_list = []
        for template, weight in prof['returns']:
            if template == 'SILVER':
                returns_list.append({
                    'item': 'SILVER',
                    'name': 'Silver',
                    'icon': 'silver.png',
                    'weight': 1.0,
                    'amount': base_yield
                })
            else:
                mat_id = template.replace('{tier}', str(tier))
                # For stone blocks, always flat T{tier}_STONEBLOCK
                returns_list.append({
                    'item': mat_id,
                    'name': uname_to_name.get(mat_id, mat_id),
                    'icon': f"{mat_id}.png",
                    'weight': weight,
                    'amount': round(base_yield * weight, 1)
                })
                
        catalog.append({
            'id': f"{p_id}_t{tier}",
            'professionId': p_id,
            'professionName': prof['name'],
            'type': p_type,
            'code': p_code,
            'tier': tier,
            'fullJournalId': full_id,
            'fullJournalName': full_name,
            'emptyJournalId': empty_id,
            'emptyJournalName': empty_name,
            'fameRequired': fame_req,
            'baseYield100': base_yield,
            'maxYield150': round(base_yield * 1.5, 1),
            'returns': returns_list,
            'fullIcon': f"{full_id}.png",
            'emptyIcon': f"{empty_id}.png",
            'desc': prof['desc']
        })

backend_target = os.path.join(DATA_DIR, 'generated_laborer_catalog.json')
frontend_target = os.path.join(FRONTEND_DATA_DIR, 'laborerItems.json')

with open(backend_target, 'w', encoding='utf-8') as f:
    json.dump({
        'laborers': catalog,
        'professions': PROFESSIONS,
        'houseTiers': HOUSE_TIERS
    }, f, indent=2)

with open(frontend_target, 'w', encoding='utf-8') as f:
    json.dump({
        'laborers': catalog,
        'professions': PROFESSIONS,
        'houseTiers': HOUSE_TIERS
    }, f, indent=2)

print(f"Successfully generated laborer catalog with {len(catalog)} journal setups!")
print(f"Backend saved: {backend_target}")
print(f"Frontend saved: {frontend_target}")
