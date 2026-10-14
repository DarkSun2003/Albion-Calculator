import json
from collections import defaultdict

with open('backend/calculator/data/items.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

items_dict = data['items']

categories = defaultdict(list)
all_craftables = []

item_types = ['weapon', 'transformationweapon', 'equipmentitem']

for itype in item_types:
    item_list = items_dict.get(itype, [])
    if isinstance(item_list, dict):
        item_list = [item_list]
    for item in item_list:
        uname = item.get('@uniquename', '')
        # Only tiers 2 to 8
        tier = int(item.get('@tier', 1))
        if tier < 2 or tier > 8:
            continue
        
        req = item.get('craftingrequirements')
        if not req:
            continue
        
        # normalize crafting requirements
        if isinstance(req, list):
            req = req[0]
        
        craft_resources = req.get('craftresource', [])
        if isinstance(craft_resources, dict):
            craft_resources = [craft_resources]
        
        shop_cat = item.get('@shopcategory', 'other')
        shop_sub = item.get('@shopsubcategory1', 'other')
        
        # Find if any resource is an artifact
        artifacts = []
        regular_mats = []
        for r in craft_resources:
            rname = r.get('@uniquename', '')
            rcount = int(r.get('@count', 1))
            if 'ARTEFACT' in rname or 'TOKEN' in rname or 'SHARD' in rname or 'REMNANT' in rname or 'CREST' in rname:
                artifacts.append((rname, rcount))
            else:
                regular_mats.append((rname, rcount))
        
        all_craftables.append({
            'uniquename': uname,
            'tier': tier,
            'category': shop_cat,
            'subcategory': shop_sub,
            'item_type': itype,
            'regular_mats': regular_mats,
            'artifacts': artifacts,
            'focus': req.get('@craftingfocus', 0),
            'itemvalue': item.get('@itemvalue', 0)
        })

print(f"Total craftable gear items found (T2-T8): {len(all_craftables)}")

# Group by (shopcategory, shopsubcategory1)
subcat_summary = defaultdict(set)
for c in all_craftables:
    # get base identifier (strip T{tier}_)
    base_id = '_'.join(c['uniquename'].split('_')[1:])
    subcat_summary[(c['category'], c['subcategory'])].add(base_id)

print("\n--- Summary of Craftable Categories & Base Item Templates ---")
for (cat, sub), items in sorted(subcat_summary.items()):
    sample = list(items)[:3]
    print(f"[{cat} -> {sub}]: {len(items)} base item templates. Examples: {sample}")
