"""
Albion Online Core Constants for Refining, Crafting, and Economy.
"""

RESOURCES = {
    'wood': {
        'name': 'Wood / Planks',
        'raw_name': 'Wood',
        'refined_name': 'Plank',
        'raw_prefix': 'T{tier}_WOOD',
        'refined_prefix': 'T{tier}_PLANKS',
        'bonus_city': 'Fort Sterling',
    },
    'ore': {
        'name': 'Ore / Metal Bars',
        'raw_name': 'Ore',
        'refined_name': 'Metal Bar',
        'raw_prefix': 'T{tier}_ORE',
        'refined_prefix': 'T{tier}_METALBAR',
        'bonus_city': 'Thetford',
    },
    'hide': {
        'name': 'Hide / Leather',
        'raw_name': 'Hide',
        'refined_name': 'Leather',
        'raw_prefix': 'T{tier}_HIDE',
        'refined_prefix': 'T{tier}_LEATHER',
        'bonus_city': 'Martlock',
    },
    'fiber': {
        'name': 'Fiber / Cloth',
        'raw_name': 'Fiber',
        'refined_name': 'Cloth',
        'raw_prefix': 'T{tier}_FIBER',
        'refined_prefix': 'T{tier}_CLOTH',
        'bonus_city': 'Lymhurst',
    },
    'stone': {
        'name': 'Stone / Blocks',
        'raw_name': 'Stone',
        'refined_name': 'Stone Block',
        'raw_prefix': 'T{tier}_ROCK',
        'refined_prefix': 'T{tier}_STONEBLOCK',
        'bonus_city': 'Bridgewatch',
        'max_enchantment': 3, # Stone caps at .3 (Exceptional); Pristine .4 does NOT exist for stone
        'is_stone': True,
    },
}

# Stone refining multiplier: refining .1 gives 2x blocks, .2 gives 4x, .3 gives 8x
STONE_ENCHANTMENT_YIELD = {
    0: 1,
    1: 2,
    2: 4,
    3: 8,
}

# Production bonus constants
# Return Rate = Bonus / (1 + Bonus)
# Royal base bonus: 18% (0.18)
# City specialty bonus: +40% (0.40) -> Total 58% (0.58) -> 36.71% RRR
# Focus bonus: +59% (0.59) -> In bonus city: 58% + 59% = 117% (1.17) -> 53.91% RRR
CITY_PRODUCTION_BONUSES = {
    'Fort Sterling': {'wood': 0.40},
    'Thetford': {'ore': 0.40},
    'Martlock': {'hide': 0.40},
    'Lymhurst': {'fiber': 0.40},
    'Bridgewatch': {'stone': 0.40},
    'Caerleon': {},
    'Brecilien': {},
    'Island': {'is_island': True},
}

CITIES = [
    'Martlock',
    'Fort Sterling',
    'Thetford',
    'Lymhurst',
    'Bridgewatch',
    'Caerleon',
    'Brecilien',
    'Island',
]

# Raw count required per tier to craft 1 refined item
# (T3 requires 2 raw T3 + 1 refined T2, etc.)
RAW_PER_TIER = {
    2: 1,
    3: 2,
    4: 2,
    5: 3,
    6: 4,
    7: 5,
    8: 5,
}

# Base focus cost at 0 specialization for 1 refined item (.0 flat)
BASE_FOCUS_COST = {
    2: 0,
    3: 31,
    4: 54,
    5: 94,
    6: 164,
    7: 287,
    8: 503,
}

# Enchantment focus multiplier
ENCHANTMENT_FOCUS_MULTIPLIER = {
    0: 1.0,
    1: 1.75,
    2: 3.06,
    3: 5.36,
    4: 9.38,
}

# Item Value per tier and enchantment (used to calculate Station Nutrition fee)
# Base nutrition formula: Nutrition = ItemValue * 0.1125
# Station Fee = Nutrition * (Station Fee per 100 Nutrition / 100)
BASE_ITEM_VALUES = {
    2: {0: 2},
    3: {0: 6},
    4: {0: 14, 1: 30, 2: 62, 3: 126, 4: 254},
    5: {0: 30, 1: 62, 2: 126, 3: 254, 4: 510},
    6: {0: 62, 1: 126, 2: 254, 3: 510, 4: 1022},
    7: {0: 126, 1: 254, 2: 510, 3: 1022, 4: 2046},
    8: {0: 254, 1: 510, 2: 1022, 3: 2046, 4: 4094},
}

# Market tax rates
TAX_PREMIUM = 0.04       # 4% sales tax
TAX_NON_PREMIUM = 0.08   # 8% sales tax
ORDER_SETUP_FEE = 0.025  # 2.5% market setup fee (for sell orders)

# Servers supported by Albion Online Data Project
AODP_SERVERS = {
    'americas': 'https://west.albion-online-data.com/api/v2/stats/prices/',
    'west': 'https://west.albion-online-data.com/api/v2/stats/prices/',
    'europe': 'https://europe.albion-online-data.com/api/v2/stats/prices/',
    'asia': 'https://east.albion-online-data.com/api/v2/stats/prices/',
    'east': 'https://east.albion-online-data.com/api/v2/stats/prices/',
}

ITEM_QUALITIES = {
    1: {'id': 1, 'name': 'Normal', 'label': 'Normal (Q1)', 'color': 'slate'},
    2: {'id': 2, 'name': 'Good', 'label': 'Good (Q2)', 'color': 'emerald'},
    3: {'id': 3, 'name': 'Outstanding', 'label': 'Outstanding (Q3)', 'color': 'sky'},
    4: {'id': 4, 'name': 'Excellent', 'label': 'Excellent (Q4)', 'color': 'purple'},
    5: {'id': 5, 'name': 'Masterpiece', 'label': 'Masterpiece (Q5)', 'color': 'amber'},
}

