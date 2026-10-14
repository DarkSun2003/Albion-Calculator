import json

dest = 'backend/calculator/data/items.json'

with open(dest, 'r', encoding='utf-8') as f:
    data = json.load(f)

items_dict = data['items']
print("Keys in data['items']:")
for k in items_dict.keys():
    val = items_dict[k]
    count = len(val) if isinstance(val, list) else (1 if isinstance(val, dict) else type(val).__name__)
    print(f"  {k}: count={count}")

# Let's inspect a sample weapon
weapons = items_dict.get('weapon', [])
if isinstance(weapons, list) and weapons:
    print("\nSample weapon [0]:")
    sample = weapons[0]
    for k in sample:
        if k != 'craftingrequirements':
            print(f"  {k}: {sample[k]}")
        else:
            print(f"  craftingrequirements: {sample[k]}")

# Let's inspect sample equipmentitem
eqs = items_dict.get('equipmentitem', [])
if isinstance(eqs, list) and eqs:
    print("\nSample equipmentitem [0]:")
    sample = eqs[0]
    for k in list(sample.keys())[:10]:
        print(f"  {k}: {sample[k]}")
