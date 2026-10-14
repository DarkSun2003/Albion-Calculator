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

potions = [
    x for x in items_raw['consumableitem']
    if ('POTION' in x.get('@uniquename', '') or x.get('@shopsubcategory1') == 'potion')
    and 'PROTOTYPE' not in x.get('@uniquename', '')
]

def get_potion_subcat(uname):
    u = uname.upper()
    if 'HEAL' in u:
        return 'healing'
    if 'ENERGY' in u:
        return 'energy'
    if 'LIFEWARD' in u:
        return 'dragon'
    if 'STONESKIN' in u:
        return 'defense'
    if 'REVIVE' in u or 'BERSERK' in u:
        return 'combat'
    if 'COOLDOWN' in u or 'ACID' in u or 'LAVA' in u:
        return 'debuff'
    if 'SLOWFIELD' in u or 'TORNADO' in u or 'MOB_RESET' in u or 'CLEANSE' in u:
        return 'utility'
    if 'GATHER' in u:
        return 'gathering'
    return 'utility'

catalog = []

for p in sorted(potions, key=lambda x: (int(x.get('@tier', '1')), x.get('@uniquename', ''))):
    uname = p.get('@uniquename')
    tier = int(p.get('@tier', '1'))
    name = uname_to_name.get(uname, uname)
    subcat = get_potion_subcat(uname)
    
    craft = p.get('craftingrequirements', {})
    amount_crafted = int(craft.get('@amountcrafted', '5'))
    base_focus = int(craft.get('@craftingfocus', '0') or '0')
    
    # Nutrition calculation fallback: ~18 * 2^(tier - 2)
    nutrition = float(p.get('@nutrition', '0') or (18 * (2 ** (tier - 2))))
    
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
        
    # Enchantments (.1, .2, .3 using Arcane Extract)
    enchantments = {}
    ench_block = p.get('enchantments')
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
                
            extract_info = None
            for er in eres_list:
                eruname = er.get('@uniquename')
                if 'EXTRACT' in eruname:
                    extract_info = {
                        'uniqueName': eruname,
                        'name': uname_to_name.get(eruname, eruname),
                        'count': int(er.get('@count', '0')),
                        'icon': f"{eruname}.png"
                    }
                    break
                    
            enchantments[str(elevel)] = {
                'focus': efocus,
                'extract': extract_info
            }
            
    is_rare = any('ALCHEMY_RARE' in ing['uniqueName'] for ing in ingredients)
    
    catalog.append({
        'id': uname,
        'uniqueName': uname,
        'name': name,
        'tier': tier,
        'category': 'potion',
        'subcategory': subcat,
        'isRare': is_rare,
        'isIntermediate': False,
        'amountCrafted': amount_crafted,
        'nutrition': nutrition,
        'baseFocus': base_focus,
        'ingredients': ingredients,
        'enchantments': enchantments,
        'maxEnchantment': len(enchantments),
        'icon': f"{uname}.png",
        'bonusCity': 'Brecilien'
    })

# Add Distillery & Arcane Extracts
distillery_specs = [
    {'id': 'T6_ALCOHOL', 'tier': 6, 'name': 'Potato Schnapps', 'subcat': 'distillery', 'ing': 'T6_POTATO', 'count': 1, 'yield': 1, 'focus': 38},
    {'id': 'T7_ALCOHOL', 'tier': 7, 'name': 'Corn Hooch', 'subcat': 'distillery', 'ing': 'T7_CORN', 'count': 1, 'yield': 1, 'focus': 38},
    {'id': 'T8_ALCOHOL', 'tier': 8, 'name': 'Pumpkin Moonshine', 'subcat': 'distillery', 'ing': 'T8_PUMPKIN', 'count': 1, 'yield': 1, 'focus': 38},
    {'id': 'T1_ALCHEMY_EXTRACT_LEVEL1', 'tier': 1, 'name': 'Basic Arcane Extract', 'subcat': 'distillery', 'ing': 'T1_ALCHEMY_COMMON', 'count': 1, 'yield': 1, 'focus': 0},
    {'id': 'T1_ALCHEMY_EXTRACT_LEVEL2', 'tier': 1, 'name': 'Refined Arcane Extract', 'subcat': 'distillery', 'ing': 'T1_ALCHEMY_COMMON', 'count': 3, 'yield': 1, 'focus': 0},
    {'id': 'T1_ALCHEMY_EXTRACT_LEVEL3', 'tier': 1, 'name': 'Pure Arcane Extract', 'subcat': 'distillery', 'ing': 'T1_ALCHEMY_COMMON', 'count': 9, 'yield': 1, 'focus': 0},
]

for d in distillery_specs:
    ing_name = uname_to_name.get(d['ing'], d['ing'])
    catalog.append({
        'id': d['id'],
        'uniqueName': d['id'],
        'name': d['name'],
        'tier': d['tier'],
        'category': 'potion',
        'subcategory': d['subcat'],
        'isRare': False,
        'isIntermediate': True,
        'amountCrafted': d['yield'],
        'nutrition': 18 * (2 ** max(0, d['tier'] - 2)),
        'baseFocus': d['focus'],
        'ingredients': [{
            'uniqueName': d['ing'],
            'name': ing_name,
            'count': d['count'],
            'noRefund': False,
            'icon': f"{d['ing']}.png"
        }],
        'enchantments': {},
        'maxEnchantment': 0,
        'icon': f"{d['id']}.png",
        'bonusCity': 'Brecilien'
    })

# Save backend catalog
backend_out = os.path.join(DATA_DIR, 'generated_potion_catalog.json')
with open(backend_out, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, indent=2)

# Save frontend data catalog
frontend_out = os.path.join(FRONTEND_DATA_DIR, 'potionItems.json')
with open(frontend_out, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, indent=2)

print(f"Successfully generated potion catalog with {len(catalog)} items!")
print(f"Backend saved: {backend_out}")
print(f"Frontend saved: {frontend_out}")
