import json
from collections import Counter

with open('backend/calculator/data/generated_catalog.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

print(f'Total items: {len(items)}')
cat_counts = Counter(i['category'] for i in items)
sub_counts = Counter(f"{i['category']} -> {i['subcategory']}" for i in items)

print('\nCategories:')
for c, cnt in cat_counts.items():
    print(f'  {c}: {cnt}')

print('\nSubcategories breakdown:')
for s, cnt in sorted(sub_counts.items()):
    print(f'  {s}: {cnt}')

# Sample fire staves:
print('\nFire staves:')
for i in items:
    if i['subcategory'] == 'fire_staves':
        print(f"  {i['id']}: {i['name']} ({i['template']}) - isArtifact={i['isArtifact']} {i.get('artifactType')} {i.get('artifactName')}")

# Sample bags & capes:
print('\nBags & Capes (First 8):')
for i in [x for x in items if x['category'] == 'accessories'][:8]:
    print(f"  {i['id']}: {i['name']} - bonusCity={i['bonusCity']}")
