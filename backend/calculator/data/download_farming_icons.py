import os
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_DIR = os.path.dirname(__file__)
PUBLIC_ITEMS_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', '..', '..', 'frontend', 'public', 'items'))
os.makedirs(PUBLIC_ITEMS_DIR, exist_ok=True)

crop_seeds = [
    'T1_FARM_CARROT_SEED', 'T2_FARM_BEAN_SEED', 'T3_FARM_WHEAT_SEED', 'T4_FARM_TURNIP_SEED',
    'T5_FARM_CABBAGE_SEED', 'T6_FARM_POTATO_SEED', 'T7_FARM_CORN_SEED', 'T8_FARM_PUMPKIN_SEED'
]
crops = [
    'T1_CARROT', 'T2_BEAN', 'T3_WHEAT', 'T4_TURNIP',
    'T5_CABBAGE', 'T6_POTATO', 'T7_CORN', 'T8_PUMPKIN'
]
herb_seeds = [
    'T2_FARM_AGARIC_SEED', 'T3_FARM_COMFREY_SEED', 'T4_FARM_BURDOCK_SEED',
    'T5_FARM_TEASEL_SEED', 'T6_FARM_FOXGLOVE_SEED', 'T7_FARM_MULLEIN_SEED', 'T8_FARM_YARROW_SEED'
]
herbs = [
    'T2_AGARIC', 'T3_COMFREY', 'T4_BURDOCK',
    'T5_TEASEL', 'T6_FOXGLOVE', 'T7_MULLEIN', 'T8_YARROW'
]
animals_baby = [
    'T3_FARM_CHICKEN_BABY', 'T4_FARM_GOAT_BABY', 'T5_FARM_GOOSE_BABY',
    'T6_FARM_SHEEP_BABY', 'T7_FARM_PIG_BABY', 'T8_FARM_COW_BABY',
    'T3_FARM_HORSE_BABY', 'T4_FARM_HORSE_BABY', 'T5_FARM_HORSE_BABY', 'T6_FARM_HORSE_BABY', 'T7_FARM_HORSE_BABY', 'T8_FARM_HORSE_BABY',
    'T3_FARM_OX_BABY', 'T4_FARM_OX_BABY', 'T5_FARM_OX_BABY', 'T6_FARM_OX_BABY', 'T7_FARM_OX_BABY', 'T8_FARM_OX_BABY',
    'T5_FARM_COUGAR_BABY', 'T6_FARM_DIREWOLF_BABY', 'T7_FARM_DIREBOAR_BABY', 'T8_FARM_DIREBEAR_BABY',
    'T7_FARM_SWAMPDRAGON_BABY', 'T8_FARM_MAMMOTH_BABY', 'T4_FARM_GIANTSTAG_BABY', 'T6_FARM_GIANTSTAG_MOOSE_BABY'
]
animals_grown = [
    'T3_FARM_CHICKEN_GROWN', 'T4_FARM_GOAT_GROWN', 'T5_FARM_GOOSE_GROWN',
    'T6_FARM_SHEEP_GROWN', 'T7_FARM_PIG_GROWN', 'T8_FARM_COW_GROWN',
    'T3_FARM_HORSE_GROWN', 'T4_FARM_HORSE_GROWN', 'T5_FARM_HORSE_GROWN', 'T6_FARM_HORSE_GROWN', 'T7_FARM_HORSE_GROWN', 'T8_FARM_HORSE_GROWN',
    'T3_FARM_OX_GROWN', 'T4_FARM_OX_GROWN', 'T5_FARM_OX_GROWN', 'T6_FARM_OX_GROWN', 'T7_FARM_OX_GROWN', 'T8_FARM_OX_GROWN',
    'T5_FARM_COUGAR_GROWN', 'T6_FARM_DIREWOLF_GROWN', 'T7_FARM_DIREBOAR_GROWN', 'T8_FARM_DIREBEAR_GROWN',
    'T7_FARM_SWAMPDRAGON_GROWN', 'T8_FARM_MAMMOTH_GROWN', 'T4_FARM_GIANTSTAG_GROWN', 'T6_FARM_GIANTSTAG_MOOSE_GROWN'
]
mounts = [
    'T3_MOUNT_HORSE', 'T4_MOUNT_HORSE', 'T5_MOUNT_HORSE', 'T6_MOUNT_HORSE', 'T7_MOUNT_HORSE', 'T8_MOUNT_HORSE',
    'T3_MOUNT_OX', 'T4_MOUNT_OX', 'T5_MOUNT_OX', 'T6_MOUNT_OX', 'T7_MOUNT_OX', 'T8_MOUNT_OX',
    'T5_MOUNT_COUGAR', 'T6_MOUNT_DIREWOLF', 'T7_MOUNT_DIREBOAR', 'T8_MOUNT_DIREBEAR',
    'T7_MOUNT_SWAMPDRAGON', 'T8_MOUNT_MAMMOTH_TRANSPORT', 'T4_MOUNT_GIANTSTAG', 'T6_MOUNT_GIANTSTAG_MOOSE'
]
products = [
    'T3_EGG', 'T5_EGG', 'T4_MILK', 'T6_MILK', 'T8_MILK',
    'T3_MEAT', 'T4_MEAT', 'T5_MEAT', 'T6_MEAT', 'T7_MEAT', 'T8_MEAT'
]

targets = list(dict.fromkeys(crop_seeds + crops + herb_seeds + herbs + animals_baby + animals_grown + mounts + products))

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

print(f"Checking & downloading {len(targets)} farming game assets...")
success_count = 0
fail_count = 0

with ThreadPoolExecutor(max_workers=10) as executor:
    futures = {executor.submit(download_item, item_id): item_id for item_id in targets}
    for future in as_completed(futures):
        item_id, success, msg = future.result()
        if success:
            success_count += 1
        else:
            fail_count += 1
            print(f"Failed {item_id}: {msg}")

print(f"Finished! Success: {success_count}, Failed: {fail_count}")
