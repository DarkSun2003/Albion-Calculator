import json

with open('calculator/data/items.json', 'r', encoding='utf-8') as f:
    items_raw = json.load(f)['items']

with open('calculator/data/formatted_items.json', 'r', encoding='utf-8') as f:
    fdata = json.load(f)
u2n = {i.get('UniqueName'): (i.get('LocalizedNames') or {}).get('EN-US') for i in fdata}

found = set()
for cat, elements in items_raw.items():
    if isinstance(elements, dict):
        elements = [elements]
    if isinstance(elements, list):
        for it in elements:
            uname = it.get('@uniquename', '')
            craft_list = it.get('craftingrequirements', [])
            if isinstance(craft_list, dict):
                craft_list = [craft_list]
            elif not isinstance(craft_list, list):
                craft_list = []
            for craft in craft_list:
                res = craft.get('craftresource', [])
                if isinstance(res, dict):
                    res = [res]
                for r in res:
                    runame = r.get('@uniquename', '')
                    if 'DRAGON' in runame:
                        found.add((uname, u2n.get(uname, uname), runame, u2n.get(runame, runame)))

for uname, name, runame, rname in sorted(found):
    print(f"{uname} ({name}) -> uses {runame} ({rname})")
