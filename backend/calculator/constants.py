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

# Base focus cost at 0 specialization for 1 craft operation
BASE_FOCUS_COST = {
    2: 18,
    3: 31,
    4: 54,
    5: 94,
    6: 164,
    7: 287,
    8: 503,
}

# Enchantment focus multiplier (applies to non-stone refined goods; Stone .1/.2/.3 retain flat tier base focus per craft)
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
    2: {0: 4},
    3: {0: 8},
    4: {0: 16, 1: 32, 2: 64, 3: 128, 4: 256},
    5: {0: 32, 1: 64, 2: 128, 3: 256, 4: 512},
    6: {0: 64, 1: 128, 2: 256, 3: 512, 4: 1024},
    7: {0: 128, 1: 256, 2: 512, 3: 1024, 4: 2048},
    8: {0: 256, 1: 512, 2: 1024, 3: 2048, 4: 4096},
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

# Black Zone Hideout (HO) & Roads Production Bonus Constants
# General Hideout Power Level Bonus (Levels 1-9)
HO_POWER_GENERAL_BONUS = {
    1: 0.0,
    2: 6.0,
    3: 11.0,
    4: 15.0,
    5: 18.0,
    6: 20.0,
    7: 22.0,
    8: 24.0,
    9: 26.0,
}

# Outlands Zone Quality Bonus (Quality 1-6): 1% + 5% per step
HO_ZONE_QUALITY_BONUS = {
    1: 1.0,
    2: 6.0,
    3: 11.0,
    4: 16.0,
    5: 21.0,
    6: 26.0,
}


def calculate_hideout_bonus_pct(
    power_level: int = 1,
    zone_quality: int = 1,
    has_specialty: bool = False,
    custom_bonus_pct: float = None,
    specialty_mode: str = 'crafting',
) -> float:
    """
    Computes exact official Albion Hideout Local Production Bonus (%):
    - Refining: Outlands HO/Rest is flat +15%; Roads HO is +10% (use custom_bonus_pct=10)
      or +20% with Roads resource specialty (has_specialty=True). Power/Quality don't apply.
    - Food & Potions: General Power Level only (0-26%); Caerleon/Brecilien +15% & Zone Quality don't apply.
    - Gear Crafting (non-specialized): General Power Level ONLY (0-26%), 0% Zone Quality.
    - Gear Crafting (specialized): General (0-26%) + Zone Quality (1-26%, Roads=Q1) +
      Specialist ((lvl - 1) * 3.75%, up to 30%), max 82% at Lvl 9 Q6.
    """
    if custom_bonus_pct is not None and custom_bonus_pct != '':
        return max(0.0, float(custom_bonus_pct))
    if specialty_mode == 'refining':
        return 20.0 if has_specialty else 15.0
    lvl = max(1, min(9, int(power_level or 1)))
    general = HO_POWER_GENERAL_BONUS.get(lvl, 0.0)
    if specialty_mode in ('food', 'potion') or not has_specialty:
        return round(general, 4)
    qual = max(1, min(6, int(zone_quality or 1)))
    zone_bonus = HO_ZONE_QUALITY_BONUS.get(qual, 1.0)
    spec_bonus = (lvl - 1) * 3.75
    return round(general + zone_bonus + spec_bonus, 4)


def compute_total_rrr(
    base_city_bonus: float,
    city_specialty_bonus: float,
    daily_bonus_pct: float = 0.0,
    use_focus: bool = False,
    location_mode: str = 'city',
    ho_power_level: int = 1,
    ho_zone_quality: int = 1,
    ho_has_specialty: bool = False,
    ho_custom_bonus_pct: float = None,
    specialty_mode: str = 'crafting',
) -> float:
    """Computes Resource Return Rate (RRR = total_bonus / (1 + total_bonus)) for City or Hideout."""
    if str(location_mode or 'city').lower() == 'hideout':
        station_bonus = calculate_hideout_bonus_pct(
            power_level=ho_power_level,
            zone_quality=ho_zone_quality,
            has_specialty=ho_has_specialty,
            custom_bonus_pct=ho_custom_bonus_pct,
            specialty_mode=specialty_mode,
        ) / 100.0
    else:
        station_bonus = base_city_bonus + city_specialty_bonus
    daily_bonus = (daily_bonus_pct or 0.0) / 100.0
    focus_bonus = 0.59 if use_focus else 0.0
    total_bonus = station_bonus + daily_bonus + focus_bonus
    return round(total_bonus / (1.0 + total_bonus), 6) if total_bonus > 0 else 0.0


def parse_hideout_params(data: dict) -> dict:
    """Extracts normalized Hideout location parameters from an API request body."""
    raw_custom = data.get('ho_custom_bonus_pct', None)
    custom_val = float(raw_custom) if raw_custom not in (None, '') else None
    return {
        'location_mode': str(data.get('location_mode', 'city') or 'city').lower(),
        'ho_power_level': int(data.get('ho_power_level', 1) or 1),
        'ho_zone_quality': int(data.get('ho_zone_quality', 1) or 1),
        'ho_has_specialty': bool(data.get('ho_has_specialty', False)),
        'ho_custom_bonus_pct': custom_val,
    }

