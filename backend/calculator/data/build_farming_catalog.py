import json
import os

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = BASE_DIR
FRONTEND_DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', '..', '..', 'frontend', 'src', 'data'))
os.makedirs(FRONTEND_DATA_DIR, exist_ok=True)

with open(os.path.join(DATA_DIR, 'items.json'), 'r', encoding='utf-8') as f:
    items_raw = json.load(f)['items']

with open(os.path.join(DATA_DIR, 'formatted_items.json'), 'r', encoding='utf-8') as f:
    formatted_data = json.load(f)

uname_to_name = {}
for it in formatted_data:
    uname = it.get('UniqueName')
    names = it.get('LocalizedNames')
    if uname and names and 'EN-US' in names:
        uname_to_name[uname] = names['EN-US']

farmable_by_id = {it.get('@uniquename'): it for it in items_raw.get('farmableitem', [])}

# Island City Biome Production Bonuses (+10% Yield) from Albion Wild Blood Update
CITY_BIOME_BONUSES = {
    'Lymhurst': {'crops': ['T1_CARROT', 'T8_PUMPKIN'], 'herbs': ['T4_BURDOCK'], 'animals': ['T5_FARM_GOOSE_GROWN']},
    'Bridgewatch': {'crops': ['T2_BEAN', 'T7_CORN'], 'herbs': ['T5_TEASEL'], 'animals': ['T4_FARM_GOAT_GROWN']},
    'Martlock': {'crops': ['T3_WHEAT', 'T6_POTATO'], 'herbs': ['T6_FOXGLOVE'], 'animals': ['T8_FARM_COW_GROWN']},
    'Thetford': {'crops': ['T5_CABBAGE'], 'herbs': ['T2_AGARIC', 'T7_MULLEIN'], 'animals': ['T7_FARM_PIG_GROWN']},
    'Fort Sterling': {'crops': ['T4_TURNIP'], 'herbs': ['T8_YARROW'], 'animals': ['T3_FARM_CHICKEN_GROWN', 'T6_FARM_SHEEP_GROWN']},
    'Caerleon': {'crops': [], 'herbs': ['T3_COMFREY'], 'animals': []},
}

def get_bonus_city(item_id):
    for city, perks in CITY_BIOME_BONUSES.items():
        if item_id in perks['crops'] or item_id in perks['herbs'] or item_id in perks['animals']:
            return city
    return None

catalog = []

# 1. Crops
crop_defs = [
    ('T1_CARROT', 'T1_FARM_CARROT_SEED', 1),
    ('T2_BEAN', 'T2_FARM_BEAN_SEED', 2),
    ('T3_WHEAT', 'T3_FARM_WHEAT_SEED', 3),
    ('T4_TURNIP', 'T4_FARM_TURNIP_SEED', 4),
    ('T5_CABBAGE', 'T5_FARM_CABBAGE_SEED', 5),
    ('T6_POTATO', 'T6_FARM_POTATO_SEED', 6),
    ('T7_CORN', 'T7_FARM_CORN_SEED', 7),
    ('T8_PUMPKIN', 'T8_FARM_PUMPKIN_SEED', 8),
]

for crop_id, seed_id, tier in crop_defs:
    s_xml = farmable_by_id.get(seed_id, {})
    harvest = s_xml.get('harvest', {})
    seed_info = harvest.get('seed', {})
    craft_req = s_xml.get('craftingrequirements', {})
    
    base_seed_chance = float(seed_info.get('@chance', '0.0'))
    bonus_seed_chance = float(s_xml.get('@activefarmbonus', '0.0'))
    base_focus = int(s_xml.get('@activefarmfocuscost', '1000'))
    vendor_seed_silver = int(craft_req.get('@silver', '2000'))
    
    catalog.append({
        'id': crop_id,
        'uniqueName': crop_id,
        'name': uname_to_name.get(crop_id, crop_id),
        'tier': tier,
        'category': 'crop',
        'subcategory': 'farming',
        'plotType': 'Farm',
        'seedId': seed_id,
        'seedName': uname_to_name.get(seed_id, seed_id),
        'vendorSeedPrice': vendor_seed_silver,
        'baseSeedChance': base_seed_chance,
        'bonusSeedChance': bonus_seed_chance,
        'baseYield': 9.0,
        'baseFocus': base_focus,
        'bonusCity': get_bonus_city(crop_id),
        'icon': f"{crop_id}.png",
        'seedIcon': f"{seed_id}.png"
    })

# 2. Herbs
herb_defs = [
    ('T2_AGARIC', 'T2_FARM_AGARIC_SEED', 2),
    ('T3_COMFREY', 'T3_FARM_COMFREY_SEED', 3),
    ('T4_BURDOCK', 'T4_FARM_BURDOCK_SEED', 4),
    ('T5_TEASEL', 'T5_FARM_TEASEL_SEED', 5),
    ('T6_FOXGLOVE', 'T6_FARM_FOXGLOVE_SEED', 6),
    ('T7_MULLEIN', 'T7_FARM_MULLEIN_SEED', 7),
    ('T8_YARROW', 'T8_FARM_YARROW_SEED', 8),
]

for herb_id, seed_id, tier in herb_defs:
    s_xml = farmable_by_id.get(seed_id, {})
    harvest = s_xml.get('harvest', {})
    seed_info = harvest.get('seed', {})
    craft_req = s_xml.get('craftingrequirements', {})
    
    base_seed_chance = float(seed_info.get('@chance', '0.0'))
    bonus_seed_chance = float(s_xml.get('@activefarmbonus', '0.0'))
    base_focus = int(s_xml.get('@activefarmfocuscost', '1000'))
    vendor_seed_silver = int(craft_req.get('@silver', '3000'))
    
    catalog.append({
        'id': herb_id,
        'uniqueName': herb_id,
        'name': uname_to_name.get(herb_id, herb_id),
        'tier': tier,
        'category': 'herb',
        'subcategory': 'herbgarden',
        'plotType': 'Herb Garden',
        'seedId': seed_id,
        'seedName': uname_to_name.get(seed_id, seed_id),
        'vendorSeedPrice': vendor_seed_silver,
        'baseSeedChance': base_seed_chance,
        'bonusSeedChance': bonus_seed_chance,
        'baseYield': 9.0,
        'baseFocus': base_focus,
        'bonusCity': get_bonus_city(herb_id),
        'icon': f"{herb_id}.png",
        'seedIcon': f"{seed_id}.png"
    })

# 3. Livestock Pasture Animals
animal_defs = [
    ('T3_FARM_CHICKEN_BABY', 'T3_FARM_CHICKEN_GROWN', 3, 'T3_EGG', 'T3_MEAT', 'T3_WHEAT'),
    ('T4_FARM_GOAT_BABY', 'T4_FARM_GOAT_GROWN', 4, 'T4_MILK', 'T4_MEAT', 'T4_TURNIP'),
    ('T5_FARM_GOOSE_BABY', 'T5_FARM_GOOSE_GROWN', 5, 'T5_EGG', 'T5_MEAT', 'T5_CABBAGE'),
    ('T6_FARM_SHEEP_BABY', 'T6_FARM_SHEEP_GROWN', 6, 'T6_MILK', 'T6_MEAT', 'T6_POTATO'),
    ('T7_FARM_PIG_BABY', 'T7_FARM_PIG_GROWN', 7, None, 'T7_MEAT', 'T7_CORN'),
    ('T8_FARM_COW_BABY', 'T8_FARM_COW_GROWN', 8, 'T8_MILK', 'T8_MEAT', 'T8_PUMPKIN'),
]

for baby_id, grown_id, tier, prod_id, meat_id, fav_food in animal_defs:
    b_xml = farmable_by_id.get(baby_id, {})
    grown_info = b_xml.get('grownitem', {})
    offspring_info = grown_info.get('offspring', {})
    craft_req = b_xml.get('craftingrequirements', {})
    
    base_offspring = float(offspring_info.get('@chance', '0.6'))
    bonus_offspring = float(b_xml.get('@activefarmbonus', '0.8'))
    base_focus = int(b_xml.get('@activefarmfocuscost', '1000'))
    vendor_baby_silver = int(craft_req.get('@silver', '5000'))
    
    catalog.append({
        'id': grown_id,
        'uniqueName': grown_id,
        'name': uname_to_name.get(grown_id, grown_id),
        'tier': tier,
        'category': 'animal',
        'subcategory': 'pasture',
        'plotType': 'Pasture',
        'babyId': baby_id,
        'babyName': uname_to_name.get(baby_id, baby_id),
        'vendorBabyPrice': vendor_baby_silver,
        'baseOffspringChance': base_offspring,
        'bonusOffspringChance': bonus_offspring,
        'baseFocus': base_focus,
        'favoriteFood': fav_food,
        'favoriteFoodName': uname_to_name.get(fav_food, fav_food),
        'feedAmountPerDay': 10,
        'productId': prod_id,
        'productName': uname_to_name.get(prod_id, prod_id) if prod_id else None,
        'productYieldPerDay': 9.5 if prod_id else 0,
        'meatId': meat_id,
        'meatName': uname_to_name.get(meat_id, meat_id),
        'meatYield': 18,
        'bonusCity': get_bonus_city(grown_id),
        'icon': f"{grown_id}.png",
        'babyIcon': f"{baby_id}.png",
        'productIcon': f"{prod_id}.png" if prod_id else None,
        'meatIcon': f"{meat_id}.png"
    })

# 4. Mount Breeding & Rare Animals
mount_defs = [
    ('T3_FARM_HORSE_BABY', 'T3_FARM_HORSE_GROWN', 'T3_MOUNT_HORSE', 3, 'horse'),
    ('T4_FARM_HORSE_BABY', 'T4_FARM_HORSE_GROWN', 'T4_MOUNT_HORSE', 4, 'horse'),
    ('T5_FARM_HORSE_BABY', 'T5_FARM_HORSE_GROWN', 'T5_MOUNT_HORSE', 5, 'horse'),
    ('T6_FARM_HORSE_BABY', 'T6_FARM_HORSE_GROWN', 'T6_MOUNT_HORSE', 6, 'horse'),
    ('T7_FARM_HORSE_BABY', 'T7_FARM_HORSE_GROWN', 'T7_MOUNT_HORSE', 7, 'horse'),
    ('T8_FARM_HORSE_BABY', 'T8_FARM_HORSE_GROWN', 'T8_MOUNT_HORSE', 8, 'horse'),
    ('T3_FARM_OX_BABY', 'T3_FARM_OX_GROWN', 'T3_MOUNT_OX', 3, 'ox'),
    ('T4_FARM_OX_BABY', 'T4_FARM_OX_GROWN', 'T4_MOUNT_OX', 4, 'ox'),
    ('T5_FARM_OX_BABY', 'T5_FARM_OX_GROWN', 'T5_MOUNT_OX', 5, 'ox'),
    ('T6_FARM_OX_BABY', 'T6_FARM_OX_GROWN', 'T6_MOUNT_OX', 6, 'ox'),
    ('T7_FARM_OX_BABY', 'T7_FARM_OX_GROWN', 'T7_MOUNT_OX', 7, 'ox'),
    ('T8_FARM_OX_BABY', 'T8_FARM_OX_GROWN', 'T8_MOUNT_OX', 8, 'ox'),
    ('T4_FARM_GIANTSTAG_BABY', 'T4_FARM_GIANTSTAG_GROWN', 'T4_MOUNT_GIANTSTAG', 4, 'rare'),
    ('T5_FARM_COUGAR_BABY', 'T5_FARM_COUGAR_GROWN', 'T5_MOUNT_COUGAR_KEEPER', 5, 'rare'),
    ('T6_FARM_DIREWOLF_BABY', 'T6_FARM_DIREWOLF_GROWN', 'T6_MOUNT_DIREWOLF', 6, 'rare'),
    ('T6_FARM_GIANTSTAG_MOOSE_BABY', 'T6_FARM_GIANTSTAG_MOOSE_GROWN', 'T6_MOUNT_GIANTSTAG_MOOSE', 6, 'rare'),
    ('T7_FARM_DIREBOAR_BABY', 'T7_FARM_DIREBOAR_GROWN', 'T7_MOUNT_DIREBOAR', 7, 'rare'),
    ('T7_FARM_SWAMPDRAGON_BABY', 'T7_FARM_SWAMPDRAGON_GROWN', 'T7_MOUNT_SWAMPDRAGON', 7, 'rare'),
    ('T8_FARM_DIREBEAR_BABY', 'T8_FARM_DIREBEAR_GROWN', 'T8_MOUNT_DIREBEAR', 8, 'rare'),
    ('T8_FARM_MAMMOTH_BABY', 'T8_FARM_MAMMOTH_GROWN', 'T8_MOUNT_MAMMOTH_TRANSPORT', 8, 'rare'),
]

for baby_id, grown_id, mount_id, tier, mtype in mount_defs:
    b_xml = farmable_by_id.get(baby_id, {})
    grown_info = b_xml.get('grownitem', {})
    offspring_info = grown_info.get('offspring', {})
    craft_req = b_xml.get('craftingrequirements', {})
    
    base_offspring = float(offspring_info.get('@chance', '0.0'))
    bonus_offspring = float(b_xml.get('@activefarmbonus', '0.0'))
    base_focus = int(b_xml.get('@activefarmfocuscost', '1000'))
    vendor_baby_silver = int(craft_req.get('@silver', '0') or 0)
    
    catalog.append({
        'id': grown_id,
        'uniqueName': grown_id,
        'name': uname_to_name.get(grown_id, grown_id),
        'tier': tier,
        'category': 'mount',
        'subcategory': mtype,
        'plotType': 'Kennel / Pasture',
        'babyId': baby_id,
        'babyName': uname_to_name.get(baby_id, baby_id),
        'mountId': mount_id,
        'mountName': uname_to_name.get(mount_id, mount_id),
        'vendorBabyPrice': vendor_baby_silver,
        'baseOffspringChance': base_offspring,
        'bonusOffspringChance': bonus_offspring,
        'baseFocus': base_focus,
        'feedAmountPerDay': 10,
        'bonusCity': None,
        'icon': f"{grown_id}.png",
        'babyIcon': f"{baby_id}.png",
        'mountIcon': f"{mount_id}.png"
    })

# Save output
backend_target = os.path.join(DATA_DIR, 'generated_farming_catalog.json')
frontend_target = os.path.join(FRONTEND_DATA_DIR, 'farmingItems.json')

with open(backend_target, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, indent=2)

with open(frontend_target, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, indent=2)

print(f"Successfully generated farming catalog with {len(catalog)} items!")
print(f"Backend saved: {backend_target}")
print(f"Frontend saved: {frontend_target}")
