import os
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_DIR = os.path.dirname(__file__)
PUBLIC_ITEMS_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', '..', '..', 'frontend', 'public', 'items'))
os.makedirs(PUBLIC_ITEMS_DIR, exist_ok=True)

professions = ['WOOD', 'STONE', 'ORE', 'FIBER', 'HIDE', 'WARRIOR', 'HUNTER', 'MAGE', 'TOOLMAKER', 'MERCENARY', 'FISHING']
targets = []

for p in professions:
    for t in range(2, 9):
        targets.append(f'T{t}_JOURNAL_{p}_EMPTY')
        targets.append(f'T{t}_JOURNAL_{p}_FULL')
        targets.append(f'T{t}_JOURNAL_{p}')

for t in range(2, 9):
    targets.append(f'T{t}_FURNITUREITEM_BED')
    targets.append(f'T{t}_FURNITUREITEM_TABLE')
    targets.append(f'T{t}_FURNITUREITEM_TROPHY_GENERAL')

targets = list(dict.fromkeys(targets))

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
})

def download_item(item_id):
    out_path = os.path.join(PUBLIC_ITEMS_DIR, f"{item_id}.png")
    if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
        return (item_id, True, 'cached')
    
    url = f"https://render.albiononline.com/v1/item/{item_id}.png?size=217"
    for attempt in range(3):
        try:
            resp = session.get(url, timeout=12)
            if resp.status_code == 200 and len(resp.content) > 1000:
                with open(out_path, 'wb') as f:
                    f.write(resp.content)
                return (item_id, True, 'downloaded')
            elif resp.status_code == 404:
                return (item_id, False, '404 not found')
        except Exception as e:
            if attempt == 2:
                return (item_id, False, str(e))
            time.sleep(1)
    return (item_id, False, 'unknown error')

print(f"Checking & downloading {len(targets)} laborer & journal assets...")
success_count = 0
fail_count = 0

with ThreadPoolExecutor(max_workers=12) as executor:
    futures = {executor.submit(download_item, item_id): item_id for item_id in targets}
    for future in as_completed(futures):
        item_id, success, msg = future.result()
        if success:
            success_count += 1
        else:
            fail_count += 1
            print(f"Failed {item_id}: {msg}")

print(f"Finished! Success: {success_count}, Failed: {fail_count}")
