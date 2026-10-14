import json
import os
import urllib.request
import concurrent.futures

with open('backend/calculator/data/generated_catalog.json', 'r', encoding='utf-8') as f:
    catalog = json.load(f)

to_download = []
for item in catalog:
    tmpl = item['template']
    min_t = item.get('minTier', 4)
    # Check item icons from min_t to 8
    for t in range(min_t, 9):
        name = tmpl.replace('{tier}', str(t))
        dest = f'frontend/public/items/{name}.png'
        if not os.path.exists(dest):
            to_download.append(name)
    
    # Check artifact icons
    if item.get('isArtifact') and item.get('artifactTemplate'):
        art_tmpl = item['artifactTemplate']
        for t in range(max(4, min_t), 9):
            art_name = art_tmpl.replace('{tier}', str(t))
            dest = f'frontend/public/items/{art_name}.png'
            if not os.path.exists(dest):
                to_download.append(art_name)

# Remove duplicates
to_download = list(set(to_download))
print(f"Total missing icons to fetch: {len(to_download)}")

def fetch_icon(name):
    url = f'https://render.albiononline.com/v1/item/{name}.png'
    dest = f'frontend/public/items/{name}.png'
    try:
        urllib.request.urlretrieve(url, dest)
        return True
    except Exception:
        return False

if to_download:
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as executor:
        results = list(executor.map(fetch_icon, to_download))
    print(f"Downloaded: {sum(results)} / {len(to_download)}")
else:
    print("All icons already downloaded locally!")
