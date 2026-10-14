import os
import json
import urllib.request
import concurrent.futures
import time

BASE_DIR = os.path.dirname(__file__)
FRONTEND_ITEMS_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', '..', '..', 'frontend', 'public', 'items'))
os.makedirs(FRONTEND_ITEMS_DIR, exist_ok=True)

with open(os.path.join(BASE_DIR, 'items.json'), 'r', encoding='utf-8') as f:
    items_data = json.load(f)['items']

meals = [x for x in items_data['consumableitem'] if 'MEAL' in x.get('@uniquename', '')]

to_fetch = set()

# Meals and enchantments
for m in meals:
    uname = m.get('@uniquename')
    to_fetch.add(uname)
    enchant = m.get('enchantments')
    if enchant and isinstance(enchant, dict):
        elist = enchant.get('enchantment', [])
        if isinstance(elist, dict):
            elist = [elist]
        for e in elist:
            e_level = e.get('@enchantmentlevel', '1')
            to_fetch.add(f"{uname}@{e_level}")
            
    # Base ingredients
    craft = m.get('craftingrequirements', {})
    res_list = craft.get('craftresource', [])
    if isinstance(res_list, dict):
        res_list = [res_list]
    for r in res_list:
        to_fetch.add(r.get('@uniquename'))

# Add known intermediate and agricultural items
extra_items = [
    'QUESTITEM_TOKEN_AVALON', 'T1_FISHCHOPS', 'T1_SEAWEED',
    'T1_FISHSAUCE_LEVEL1', 'T1_FISHSAUCE_LEVEL2', 'T1_FISHSAUCE_LEVEL3',
    'T1_CARROT', 'T2_BEAN', 'T3_WHEAT', 'T4_TURNIP', 'T5_CABBAGE', 'T6_POTATO', 'T7_CORN', 'T8_PUMPKIN',
    'T2_AGARIC', 'T3_COMFREY', 'T4_BURDOCK', 'T5_TEASEL', 'T6_FOXGLOVE', 'T7_MULLEIN', 'T8_YARROW',
    'T3_EGG', 'T5_EGG', 'T4_MILK', 'T6_MILK', 'T8_MILK',
    'T4_BUTTER', 'T6_BUTTER', 'T8_BUTTER', 'T3_FLOUR', 'T4_BREAD',
    'T3_MEAT', 'T4_MEAT', 'T5_MEAT', 'T6_MEAT', 'T7_MEAT', 'T8_MEAT',
    'T8_FARM_DRAKE_BABY',
    'T3_FARM_CHICKEN_GROWN', 'T4_FARM_GOAT_GROWN', 'T5_FARM_GOOSE_GROWN',
    'T6_FARM_SHEEP_GROWN', 'T7_FARM_PIG_GROWN', 'T8_FARM_COW_GROWN'
]
for x in extra_items:
    to_fetch.add(x)

missing = []
for name in sorted(to_fetch):
    dest = os.path.join(FRONTEND_ITEMS_DIR, f"{name}.png")
    if not os.path.exists(dest) or os.path.getsize(dest) == 0:
        missing.append(name)

print(f"Total target icons: {len(to_fetch)}")
print(f"Missing to download: {len(missing)}")

def download_item(name):
    url = f"https://render.albiononline.com/v1/item/{name}.png"
    dest = os.path.join(FRONTEND_ITEMS_DIR, f"{name}.png")
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = resp.read()
                if len(data) > 500:  # Valid image response
                    with open(dest, 'wb') as out_f:
                        out_f.write(data)
                    return (name, True, len(data))
        except Exception as e:
            time.sleep(0.5 * (attempt + 1))
    return (name, False, 0)

if missing:
    success_count = 0
    fail_list = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as executor:
        futures = {executor.submit(download_item, name): name for name in missing}
        for future in concurrent.futures.as_completed(futures):
            name, ok, size = future.result()
            if ok:
                success_count += 1
            else:
                fail_list.append(name)
    print(f"Downloaded: {success_count} / {len(missing)}")
    if fail_list:
        print("Failed:", fail_list)
else:
    print("All food icons are already downloaded locally!")
