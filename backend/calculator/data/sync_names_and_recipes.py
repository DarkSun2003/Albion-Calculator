import urllib.request
import os
import json
import re

dest_formatted = 'backend/calculator/data/formatted_items.json'
if not os.path.exists(dest_formatted) or os.path.getsize(dest_formatted) < 1000000:
    print('Downloading formatted_items.json (24 MB)...')
    urllib.request.urlretrieve('https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json', dest_formatted)
    print('Download of formatted_items.json complete!')
else:
    print('formatted_items.json already present:', os.path.getsize(dest_formatted), 'bytes')

with open(dest_formatted, 'r', encoding='utf-8') as f:
    formatted_data = json.load(f)

uname_to_name = {}
for item in formatted_data:
    uname = item.get('UniqueName')
    names = item.get('LocalizedNames')
    if uname and names and 'EN-US' in names:
        uname_to_name[uname] = names['EN-US']

print(f'Indexed {len(uname_to_name)} localized item names!')

# Sample check
print('T4_2H_INFERNOSTAFF_MORGANA name:', uname_to_name.get('T4_2H_INFERNOSTAFF_MORGANA'))
print('T4_2H_FIRESTAFF_HELL name:', uname_to_name.get('T4_2H_FIRESTAFF_HELL'))
print('T4_MAIN_FIRESTAFF_KEEPER name:', uname_to_name.get('T4_MAIN_FIRESTAFF_KEEPER'))
print('T4_2H_FIRE_RINGPAIR_AVALON name:', uname_to_name.get('T4_2H_FIRE_RINGPAIR_AVALON'))
print('T4_ARMOR_LEATHER_DRAGON name:', uname_to_name.get('T4_ARMOR_LEATHER_DRAGON'))
print('T4_CAPE name:', uname_to_name.get('T4_CAPE'))
print('T4_BAG name:', uname_to_name.get('T4_BAG'))
