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

meals = [x for x in items_raw['consumableitem'] if 'MEAL' in x.get('@uniquename', '')]

def get_subcat(uname):
    u = uname.upper()
    if 'DRAKE_EGG' in u or 'DRAGONAREA' in u:
        return 'dragon'
    if 'SOUP' in u:
        return 'soups'
    if 'SALAD' in u or 'SEAWEED' in u:
        return 'salads'
    if 'PIE' in u:
        return 'pies'
    if 'OMELETTE' in u:
        return 'omelettes'
    if 'STEW' in u:
        return 'stews'
    if 'SANDWICH' in u:
        return 'sandwiches'
    if 'ROAST' in u or 'GRILLEDFISH' in u:
        return 'roasts'
    return 'other'

catalog = []

# Process all 57 meals
for m in sorted(meals, key=lambda x: (int(x.get('@tier', '1')), x.get('@uniquename', ''))):
    uname = m.get('@uniquename')
    tier = int(m.get('@tier', '1'))
    name = uname_to_name.get(uname, uname)
    nutrition = float(m.get('@nutrition', '0') or '0')
    subcat = get_subcat(uname)
    
    craft = m.get('craftingrequirements', {})
    amount_crafted = int(craft.get('@amountcrafted', '1'))
    base_focus = int(craft.get('@craftingfocus', '0') or '0')
    
    res_list = craft.get('craftresource', [])
    if isinstance(res_list, dict):
        res_list = [res_list]
        
    ingredients = []
    for r in res_list:
        runame = r.get('@uniquename')
        rcount = int(r.get('@count', '1'))
        rname = uname_to_name.get(runame, runame)
        no_refund = (r.get('@maxreturnamount') == '0')
        ingredients.append({
            'uniqueName': runame,
            'name': rname,
            'count': rcount,
            'noRefund': no_refund,
            'icon': f"{runame}.png"
        })
        
    # Enchantments
    enchantments = {}
    ench_block = m.get('enchantments')
    if ench_block and isinstance(ench_block, dict):
        elists = ench_block.get('enchantment', [])
        if isinstance(elists, dict):
            elists = [elists]
        for e in elists:
            elevel = int(e.get('@enchantmentlevel', '1'))
            ecraft = e.get('craftingrequirements', {})
            efocus = int(ecraft.get('@craftingfocus', '0') or '0')
            eres_list = ecraft.get('craftresource', [])
            if isinstance(eres_list, dict):
                eres_list = [eres_list]
            
            sauce_info = None
            for er in eres_list:
                eruname = er.get('@uniquename')
                if 'FISHSAUCE' in eruname:
                    sauce_info = {
                        'uniqueName': eruname,
                        'name': uname_to_name.get(eruname, eruname),
                        'count': int(er.get('@count', '0')),
                        'icon': f"{eruname}.png"
                    }
                    break
            
            enchantments[str(elevel)] = {
                'focus': efocus,
                'sauce': sauce_info
            }
            
    is_avalon = 'AVALON' in uname.upper()
    is_dragon = 'DRAGON' in uname.upper() or 'DRAKE' in uname.upper()
    is_fish = '_FISH' in uname.upper() or 'GRILLED' in uname.upper()
    
    item_entry = {
        'id': uname,
        'uniqueName': uname,
        'name': name,
        'tier': tier,
        'category': 'food',
        'subcategory': subcat,
        'isAvalonian': is_avalon,
        'isDragon': is_dragon,
        'isFishMeal': is_fish,
        'isIntermediate': False,
        'amountCrafted': amount_crafted,
        'nutrition': nutrition,
        'baseFocus': base_focus,
        'ingredients': ingredients,
        'enchantments': enchantments,
        'maxEnchantment': len(enchantments),
        'icon': f"{uname}.png",
        'bonusCity': 'Caerleon'
    }
    catalog.append(item_entry)

# Process Pantry / Butchery intermediates
intermediate_specs = [
    {'id': 'T3_MEAT', 'tier': 3, 'subcat': 'butchery', 'bonusCity': 'Caerleon'},
    {'id': 'T4_MEAT', 'tier': 4, 'subcat': 'butchery', 'bonusCity': 'Caerleon'},
    {'id': 'T5_MEAT', 'tier': 5, 'subcat': 'butchery', 'bonusCity': 'Caerleon'},
    {'id': 'T6_MEAT', 'tier': 6, 'subcat': 'butchery', 'bonusCity': 'Caerleon'},
    {'id': 'T7_MEAT', 'tier': 7, 'subcat': 'butchery', 'bonusCity': 'Caerleon'},
    {'id': 'T8_MEAT', 'tier': 8, 'subcat': 'butchery', 'bonusCity': 'Caerleon'},
    {'id': 'T3_FLOUR', 'tier': 3, 'subcat': 'pantry', 'bonusCity': 'Caerleon'},
    {'id': 'T4_BREAD', 'tier': 4, 'subcat': 'pantry', 'bonusCity': 'Caerleon'},
    {'id': 'T4_BUTTER', 'tier': 4, 'subcat': 'pantry', 'bonusCity': 'Caerleon'},
    {'id': 'T6_BUTTER', 'tier': 6, 'subcat': 'pantry', 'bonusCity': 'Caerleon'},
    {'id': 'T8_BUTTER', 'tier': 8, 'subcat': 'pantry', 'bonusCity': 'Caerleon'},
    {'id': 'T1_FISHSAUCE_LEVEL1', 'tier': 1, 'subcat': 'pantry', 'bonusCity': 'Caerleon'},
    {'id': 'T1_FISHSAUCE_LEVEL2', 'tier': 1, 'subcat': 'pantry', 'bonusCity': 'Caerleon'},
    {'id': 'T1_FISHSAUCE_LEVEL3', 'tier': 1, 'subcat': 'pantry', 'bonusCity': 'Caerleon'},
]

found_items = {}
for cat, items in items_raw.items():
    if not isinstance(items, list):
        items = [items]
    for it in items:
        if isinstance(it, dict) and it.get('@uniquename'):
            found_items[it.get('@uniquename')] = it

for spec in intermediate_specs:
    uname = spec['id']
    it = found_items.get(uname)
    if not it:
        continue
    name = uname_to_name.get(uname, uname)
    craft = it.get('craftingrequirements', {})
    amount_crafted = int(craft.get('@amountcrafted', '1'))
    base_focus = int(craft.get('@craftingfocus', '0') or '0')
    nutrition = float(it.get('@nutrition', '0') or '0')
    
    res = craft.get('craftresource', [])
    if isinstance(res, dict):
        res = [res]
    ingredients = []
    for r in res:
        runame = r.get('@uniquename')
        rcount = int(r.get('@count', '1'))
        rname = uname_to_name.get(runame, runame)
        no_refund = (r.get('@maxreturnamount') == '0')
        ingredients.append({
            'uniqueName': runame,
            'name': rname,
            'count': rcount,
            'noRefund': no_refund,
            'icon': f"{runame}.png"
        })
        
    catalog.append({
        'id': uname,
        'uniqueName': uname,
        'name': name,
        'tier': spec['tier'],
        'category': 'food',
        'subcategory': spec['subcat'],
        'isAvalonian': False,
        'isDragon': False,
        'isFishMeal': False,
        'isIntermediate': True,
        'amountCrafted': amount_crafted,
        'nutrition': nutrition,
        'baseFocus': base_focus,
        'ingredients': ingredients,
        'enchantments': {},
        'maxEnchantment': 0,
        'icon': f"{uname}.png",
        'bonusCity': spec['bonusCity']
    })

# Save backend generated catalog
backend_out = os.path.join(DATA_DIR, 'generated_food_catalog.json')
with open(backend_out, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, indent=2)

# Save frontend data catalog
frontend_out = os.path.join(FRONTEND_DATA_DIR, 'foodItems.json')
with open(frontend_out, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, indent=2)

print(f"Successfully generated food catalog with {len(catalog)} items!")
print(f"Backend saved: {backend_out}")
print(f"Frontend saved: {frontend_out}")
