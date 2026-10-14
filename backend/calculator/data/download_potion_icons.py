import os
import json
import urllib.request
import concurrent.futures
import time

BASE_DIR = os.path.dirname(__file__)
FRONTEND_ITEMS_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', '..', '..', 'frontend', 'public', 'items'))
os.makedirs(FRONTEND_ITEMS_DIR, exist_ok=True)

with open(os.path.join(BASE_DIR, 'items.json'), 'r', encoding='utf-8') as f:
    items_raw = json.load(f)['items']['consumableitem']

potions = [x for x in items_raw if ('POTION' in x.get('@uniquename', '') or x.get('@shopsubcategory1') == 'potion') and 'PROTOTYPE' not in x.get('@uniquename', '')]

to_fetch = set()

for p in potions:
    uname = p.get('@uniquename')
    to_fetch.add(uname)
    enchant = p.get('enchantments')
    if enchant and isinstance(enchant, dict):
        elist = enchant.get('enchantment', [])
        if isinstance(elist, dict):
            elist = [elist]
        for e in elist:
            elevel = e.get('@enchantmentlevel', '1')
            to_fetch.add(f"{uname}@{elevel}")

    craft = p.get('craftingrequirements', {})
    if isinstance(craft, dict):
        res = craft.get('craftresource', [])
        if isinstance(res, dict):
            res = [res]
        for r in res:
            to_fetch.add(r.get('@uniquename'))

# Add distillery items and arcane essence
extras = [
    'T1_ALCHEMY_COMMON',
    'T1_ALCHEMY_EXTRACT_LEVEL1', 'T1_ALCHEMY_EXTRACT_LEVEL2', 'T1_ALCHEMY_EXTRACT_LEVEL3',
    'T6_ALCOHOL', 'T7_ALCOHOL', 'T8_ALCOHOL'
]
for x in extras:
    to_fetch.add(x)

missing = []
for name in sorted(to_fetch):
    dest = os.path.join(FRONTEND_ITEMS_DIR, f"{name}.png")
    if not os.path.exists(dest) or os.path.getsize(dest) == 0:
        missing.append(name)

print(f"Total target potion icons: {len(to_fetch)}")
print(f"Missing to download: {len(missing)}")

def download_item(name):
    url = f"https://render.albiononline.com/v1/item/{name}.png"
    dest = os.path.join(FRONTEND_ITEMS_DIR, f"{name}.png")
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = resp.read()
                if len(data) > 500:
                    with open(dest, 'wb') as out_f:
                        out_f.write(data)
                    return (name, True, len(data))
        except Exception:
            time.sleep(0.5 * (attempt + 1))
    return (name, False, 0)

if missing:
    success_count = 0
    fail_list = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=14) as executor:
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
    print("All potion icons already exist locally!")
