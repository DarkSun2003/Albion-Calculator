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
        'returns': [('T{tier}_METALBAR', 0.70), ('T{tier}_PLANKS', 0.20), ('T{tier}_CLOTH', 0.10)],
        'icon': 'T4_JOURNAL_WARRIOR_FULL.png',
    },
    {
        'id': 'fletcher',
        'name': 'Fletcher (Hunter)',
        'type': 'crafting',
        'code': 'HUNTER',
        'desc': 'Consumes Fletcher journals from crafting Bows, Spears, Daggers, Torches, and Leather Armor.',
        'returns': [('T{tier}_LEATHER', 0.4545), ('T{tier}_PLANKS', 0.2727), ('T{tier}_METALBAR', 0.2727)],
        'icon': 'T4_JOURNAL_HUNTER_FULL.png',
    },
    {
        'id': 'imbuer',
        'name': 'Imbuer (Mage)',
        'type': 'crafting',
        'code': 'MAGE',
        'desc': 'Consumes Imbuer journals from crafting Fire, Holy, Frost, Arcane staffs, Tomes, and Cloth Armor.',
        'returns': [('T{tier}_CLOTH', 0.50), ('T{tier}_PLANKS', 0.40), ('T{tier}_METALBAR', 0.10)],
        'icon': 'T4_JOURNAL_MAGE_FULL.png',
    },
    {
        'id': 'tinker',
        'name': 'Tinker (Toolmaker)',
        'type': 'crafting',
        'code': 'TOOLMAKER',
        'desc': 'Consumes Tinker journals from crafting Tools, Capes, Bags, and Furniture.',
        'returns': [('T{tier}_PLANKS', 0.4444), ('T{tier}_METALBAR', 0.2222), ('T{tier}_CLOTH', 0.2222), ('T{tier}_LEATHER', 0.1111)],
        'icon': 'T4_JOURNAL_TOOLMAKER_FULL.png',
    },
    {
        'id': 'lumberjack',
        'name': 'Lumberjack (Woodcutter)',
        'type': 'gathering',
        'code': 'WOOD',
        'desc': 'Consumes Lumberjack journals from chopping trees in Forest and Steppe biomes (returns 100% raw logs).',
        'returns': [('T{tier}_WOOD', 1.0)],
        'icon': 'T4_JOURNAL_WOOD_FULL.png',
    },
    {
        'id': 'stonecutter',
        'name': 'Stonecutter',
        'type': 'gathering',
        'code': 'STONE',
        'desc': 'Consumes Stonecutter journals from quarrying rocks in Highland and Swamp biomes (returns 100% raw stone).',
        'returns': [('T{tier}_ROCK', 1.0)],
        'icon': 'T4_JOURNAL_STONE_FULL.png',
    },
    {
        'id': 'prospector',
        'name': 'Prospector (Miner)',
        'type': 'gathering',
        'code': 'ORE',
        'desc': 'Consumes Prospector journals from mining ore veins in Mountain and Highland biomes (returns 100% raw ore).',
        'returns': [('T{tier}_ORE', 1.0)],
        'icon': 'T4_JOURNAL_ORE_FULL.png',
    },
    {
        'id': 'cropper',
        'name': 'Cropper (Harvester)',
        'type': 'gathering',
        'code': 'FIBER',
        'desc': 'Consumes Cropper journals from gathering fiber plants in Swamp and Forest biomes (returns 100% raw fiber).',
        'returns': [('T{tier}_FIBER', 1.0)],
        'icon': 'T4_JOURNAL_FIBER_FULL.png',
    },
    {
        'id': 'gamekeeper',
        'name': 'Gamekeeper (Skinner)',
        'type': 'gathering',
        'code': 'HIDE',
        'desc': 'Consumes Gamekeeper journals from skinning beasts in Steppe and Swamp biomes (returns 100% raw hide).',
        'returns': [('T{tier}_HIDE', 1.0)],
        'icon': 'T4_JOURNAL_HIDE_FULL.png',
    },
    {
        'id': 'fisherman',
        'name': 'Fisherman',
        'type': 'gathering',
        'code': 'FISHING',
        'desc': 'Consumes Fisherman journals from catching fish in rivers, lakes, and oceans.',
        'returns': [('T{tier}_FISH_FRESHWATER_ALL_COMMON', 0.5), ('T{tier}_FISH_SALTWATER_ALL_COMMON', 0.5)],
        'icon': 'T4_JOURNAL_FISHING_FULL.png',
    },
    {
        'id': 'mercenary',
        'name': 'Mercenary',
        'type': 'mercenary',
        'code': 'MERCENARY',
        'desc': 'Consumes Mercenary journals filled by slaying open-world mobs and dungeon bosses (returns raw untaxed Silver).',
        'returns': [('SILVER', 1.0)],
        'icon': 'T4_JOURNAL_MERCENARY_FULL.png',
    },
]

# Exact base returns at 100% Happiness per tier (from live items.json)
BASE_YIELDS = {
    'crafting': {2: 38.0, 3: 24.0, 4: 16.0, 5: 8.0, 6: 5.3333, 7: 4.4, 8: 4.2},
    'gathering': {2: 38.0, 3: 60.0, 4: 48.0, 5: 32.0, 6: 32.0, 7: 38.4, 8: 38.4},
    'fishing': {2: 10.6, 3: 9.976, 4: 13.9112, 5: 17.0301, 6: 20.0528, 7: 22.3876, 8: 25.119},
    'mercenary': {2: 371, 3: 660, 4: 1123, 5: 1746, 6: 2690, 7: 4202, 8: 6584},
}

FAME_REQUIREMENTS = {
    'crafting': {2: 900, 3: 1800, 4: 3600, 5: 7200, 6: 14400, 7: 28380, 8: 58590},
    'gathering': {2: 450, 3: 900, 4: 1800, 5: 3600, 6: 7200, 7: 14400, 8: 28800},
    'fishing': {2: 720, 3: 1360, 4: 2223, 5: 3680, 6: 4880, 7: 6640, 8: 8320},
    'mercenary': {2: 1412, 3: 2171, 4: 3264, 5: 4368, 6: 5856, 7: 7968, 8: 10800},
}

HOUSE_TIERS = [
    {'tier': 2, 'name': "Novice's House", 'laborers': 1, 'beds': 1, 'tables': 1, 'furnitureSlots': 3, 'blocks': 30, 'planks': 30},
    {'tier': 3, 'name': "Journeyman's House", 'laborers': 2, 'beds': 2, 'tables': 1, 'furnitureSlots': 6, 'blocks': 60, 'planks': 60},
    {'tier': 4, 'name': "Adept's House", 'laborers': 2, 'beds': 2, 'tables': 1, 'furnitureSlots': 10, 'blocks': 180, 'planks': 180},
    {'tier': 5, 'name': "Expert's House", 'laborers': 3, 'beds': 3, 'tables': 1, 'furnitureSlots': 14, 'blocks': 360, 'planks': 360},
    {'tier': 6, 'name': "Master's House", 'laborers': 3, 'beds': 3, 'tables': 1, 'furnitureSlots': 14, 'blocks': 720, 'planks': 720},
    {'tier': 7, 'name': "Grandmaster's House", 'laborers': 3, 'beds': 3, 'tables': 1, 'furnitureSlots': 14, 'blocks': 1440, 'planks': 1440},
    {'tier': 8, 'name': "Elder's House", 'laborers': 3, 'beds': 3, 'tables': 1, 'furnitureSlots': 14, 'blocks': 2880, 'planks': 2880},
]

catalog = []

for prof in PROFESSIONS:
    p_id = prof['id']
    p_type = prof['type']
    p_code = prof['code']
    yield_key = 'fishing' if p_id == 'fisherman' else p_type
    
    for tier in range(2, 9):
        full_id = f"T{tier}_JOURNAL_{p_code}_FULL"
        empty_id = f"T{tier}_JOURNAL_{p_code}_EMPTY"
        
        full_name = uname_to_name.get(full_id, f"T{tier} {prof['name']} Journal (Full)")
        empty_name = uname_to_name.get(empty_id, f"T{tier} {prof['name']} Journal (Empty)")
        
        base_yield = BASE_YIELDS[yield_key][tier]
        fame_req = FAME_REQUIREMENTS[yield_key][tier]
        
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
                returns_list.append({
                    'item': mat_id,
                    'name': uname_to_name.get(mat_id, mat_id),
                    'icon': f"{mat_id}.png",
                    'weight': weight,
                    'amount': round(base_yield * weight, 2)
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
