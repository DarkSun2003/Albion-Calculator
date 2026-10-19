import json
import os
from math import pow

BASE_DIR = os.path.dirname(__file__)
CATALOG_PATH = os.path.join(BASE_DIR, 'data', 'generated_farming_catalog.json')

with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
    FARMING_CATALOG = json.load(f)

FARMING_ITEMS_MAP = {it['id']: it for it in FARMING_CATALOG}

DEFAULT_FARMING_PRICES = {
    # Crops & Seeds
    'T1_CARROT': 280,
    'T1_FARM_CARROT_SEED': 2000,
    'T2_BEAN': 310,
    'T2_FARM_BEAN_SEED': 3000,
    'T3_WHEAT': 350,
    'T3_FARM_WHEAT_SEED': 5000,
    'T4_TURNIP': 420,
    'T4_FARM_TURNIP_SEED': 7500,
    'T5_CABBAGE': 520,
    'T5_FARM_CABBAGE_SEED': 10000,
    'T6_POTATO': 650,
    'T6_FARM_POTATO_SEED': 15000,
    'T7_CORN': 780,
    'T7_FARM_CORN_SEED': 22500,
    'T8_PUMPKIN': 950,
    'T8_FARM_PUMPKIN_SEED': 30000,

    # Herbs & Seeds
    'T2_AGARIC': 320,
    'T2_FARM_AGARIC_SEED': 3000,
    'T3_COMFREY': 360,
    'T3_FARM_COMFREY_SEED': 5000,
    'T4_BURDOCK': 430,
    'T4_FARM_BURDOCK_SEED': 7500,
    'T5_TEASEL': 530,
    'T5_FARM_TEASEL_SEED': 10000,
    'T6_FOXGLOVE': 660,
    'T6_FARM_FOXGLOVE_SEED': 15000,
    'T7_MULLEIN': 790,
    'T7_FARM_MULLEIN_SEED': 22500,
    'T8_YARROW': 980,
    'T8_FARM_YARROW_SEED': 30000,

    # Animal Produce
    'T3_EGG': 310,
    'T4_MILK': 420,
    'T5_EGG': 540,
    'T6_MILK': 680,
    'T8_MILK': 850,

    # Raw Meat
    'T3_MEAT': 190,
    'T4_MEAT': 260,
    'T5_MEAT': 340,
    'T6_MEAT': 440,
    'T7_MEAT': 560,
    'T8_MEAT': 750,

    # Baby Animals
    'T3_FARM_CHICKEN_BABY': 5000,
    'T4_FARM_GOAT_BABY': 7500,
    'T5_FARM_GOOSE_BABY': 10000,
    'T6_FARM_SHEEP_BABY': 15000,
    'T7_FARM_PIG_BABY': 22500,
    'T8_FARM_COW_BABY': 45000,

    # Grown Pasture Animals
    'T3_FARM_CHICKEN_GROWN': 6500,
    'T4_FARM_GOAT_GROWN': 10000,
    'T5_FARM_GOOSE_GROWN': 14000,
    'T6_FARM_SHEEP_GROWN': 21000,
    'T7_FARM_PIG_GROWN': 30000,
    'T8_FARM_COW_GROWN': 48000,

    # Mount Babies
    'T3_FARM_HORSE_BABY': 25000,
    'T4_FARM_HORSE_BABY': 75000,
    'T5_FARM_HORSE_BABY': 225000,
    'T6_FARM_HORSE_BABY': 675000,
    'T7_FARM_HORSE_BABY': 2025000,
    'T8_FARM_HORSE_BABY': 6075000,
    'T3_FARM_OX_BABY': 25000,
    'T4_FARM_OX_BABY': 75000,
    'T5_FARM_OX_BABY': 225000,
    'T6_FARM_OX_BABY': 675000,
    'T7_FARM_OX_BABY': 2025000,
    'T8_FARM_OX_BABY': 6075000,
    'T4_FARM_GIANTSTAG_BABY': 65000,
    'T5_FARM_COUGAR_BABY': 110000,
    'T6_FARM_DIREWOLF_BABY': 310000,
    'T6_FARM_GIANTSTAG_MOOSE_BABY': 450000,
    'T7_FARM_DIREBOAR_BABY': 950000,
    'T7_FARM_SWAMPDRAGON_BABY': 1200000,
    'T8_FARM_DIREBEAR_BABY': 2800000,
    'T8_FARM_MAMMOTH_BABY': 95000000,
    'T8_FARM_RABBIT_EASTER_BABY': 18000000,
    'T8_FARM_RABBIT_EASTER_DARK_BABY': 25000000,
    'T8_FARM_RABBIT_EASTER_BABY_DARK': 25000000,
    'T8_FARM_DRAKE_BABY': 35000000,
    'T5_FARM_BEAR_BABY': 140000,
    'T5_FARM_DIREBEAR_FW_FORTSTERLING_BABY': 140000,
    'T8_FARM_BEAR_ELITE_BABY': 3500000,
    'T8_FARM_DIREBEAR_FW_FORTSTERLING_BABY': 3500000,
    'T5_FARM_BOAR_BABY': 140000,
    'T5_FARM_DIREBOAR_FW_LYMHURST_BABY': 140000,
    'T8_FARM_BOAR_ELITE_BABY': 3500000,
    'T8_FARM_DIREBOAR_FW_LYMHURST_BABY': 3500000,
    'T5_FARM_RAM_BABY': 140000,
    'T5_FARM_RAM_FW_MARTLOCK_BABY': 140000,
    'T8_FARM_RAM_ELITE_BABY': 3500000,
    'T8_FARM_RAM_FW_MARTLOCK_BABY': 3500000,
    'T5_FARM_MOABIRD_BABY': 140000,
    'T5_FARM_MOABIRD_FW_BRIDGEWATCH_BABY': 140000,
    'T8_FARM_MOABIRD_ELITE_BABY': 3500000,
    'T8_FARM_MOABIRD_FW_BRIDGEWATCH_BABY': 3500000,
    'T5_FARM_SALAMANDER_BABY': 140000,
    'T5_FARM_SWAMPDRAGON_FW_THETFORD_BABY': 140000,
    'T8_FARM_SALAMANDER_ELITE_BABY': 3500000,
    'T8_FARM_SWAMPDRAGON_FW_THETFORD_BABY': 3500000,
    'T5_FARM_WOLF_BABY': 140000,
    'T5_FARM_GREYWOLF_FW_CAERLEON_BABY': 140000,
    'T8_FARM_WOLF_ELITE_BABY': 3500000,
    'T8_FARM_GREYWOLF_FW_CAERLEON_BABY': 3500000,

    # Grown Mount Animals
    'T3_FARM_HORSE_GROWN': 28000,
    'T4_FARM_HORSE_GROWN': 82000,
    'T5_FARM_HORSE_GROWN': 245000,
    'T6_FARM_HORSE_GROWN': 730000,
    'T7_FARM_HORSE_GROWN': 2180000,
    'T8_FARM_HORSE_GROWN': 6450000,
    'T3_FARM_OX_GROWN': 28000,
    'T4_FARM_OX_GROWN': 82000,
    'T5_FARM_OX_GROWN': 245000,
    'T6_FARM_OX_GROWN': 730000,
    'T7_FARM_OX_GROWN': 2180000,
    'T8_FARM_OX_GROWN': 6450000,
    'T4_FARM_GIANTSTAG_GROWN': 85000,
    'T5_FARM_COUGAR_GROWN': 150000,
    'T6_FARM_DIREWOLF_GROWN': 380000,
    'T6_FARM_GIANTSTAG_MOOSE_GROWN': 520000,
    'T7_FARM_DIREBOAR_GROWN': 1100000,
    'T7_FARM_SWAMPDRAGON_GROWN': 1400000,
    'T8_FARM_DIREBEAR_GROWN': 3200000,
    'T8_FARM_MAMMOTH_GROWN': 105000000,
    'T8_FARM_RABBIT_EASTER_GROWN': 22000000,
    'T8_FARM_RABBIT_EASTER_DARK_GROWN': 30000000,
    'T8_FARM_RABBIT_EASTER_GROWN_DARK': 30000000,
    'T8_FARM_DRAKE_GROWN': 42000000,
    'T5_FARM_BEAR_GROWN': 180000,
    'T5_FARM_DIREBEAR_FW_FORTSTERLING_GROWN': 180000,
    'T8_FARM_BEAR_ELITE_GROWN': 4200000,
    'T8_FARM_DIREBEAR_FW_FORTSTERLING_GROWN': 4200000,
    'T5_FARM_BOAR_GROWN': 180000,
    'T5_FARM_DIREBOAR_FW_LYMHURST_GROWN': 180000,
    'T8_FARM_BOAR_ELITE_GROWN': 4200000,
    'T8_FARM_DIREBOAR_FW_LYMHURST_GROWN': 4200000,
    'T5_FARM_RAM_GROWN': 180000,
    'T5_FARM_RAM_FW_MARTLOCK_GROWN': 180000,
    'T8_FARM_RAM_ELITE_GROWN': 4200000,
    'T8_FARM_RAM_FW_MARTLOCK_GROWN': 4200000,
    'T5_FARM_MOABIRD_GROWN': 180000,
    'T5_FARM_MOABIRD_FW_BRIDGEWATCH_GROWN': 180000,
    'T8_FARM_MOABIRD_ELITE_GROWN': 4200000,
    'T8_FARM_MOABIRD_FW_BRIDGEWATCH_GROWN': 4200000,
    'T5_FARM_SALAMANDER_GROWN': 180000,
    'T5_FARM_SWAMPDRAGON_FW_THETFORD_GROWN': 180000,
    'T8_FARM_SALAMANDER_ELITE_GROWN': 4200000,
    'T8_FARM_SWAMPDRAGON_FW_THETFORD_GROWN': 4200000,
    'T5_FARM_WOLF_GROWN': 180000,
    'T5_FARM_GREYWOLF_FW_CAERLEON_GROWN': 180000,
    'T8_FARM_WOLF_ELITE_GROWN': 4200000,
    'T8_FARM_GREYWOLF_FW_CAERLEON_GROWN': 4200000,

    # Saddled Mounts
    'T3_MOUNT_HORSE': 36000,
    'T4_MOUNT_HORSE': 98000,
    'T5_MOUNT_HORSE': 280000,
    'T6_MOUNT_HORSE': 820000,
    'T7_MOUNT_HORSE': 2400000,
    'T8_MOUNT_HORSE': 7200000,
    'T3_MOUNT_OX': 36000,
    'T4_MOUNT_OX': 98000,
    'T5_MOUNT_OX': 280000,
    'T6_MOUNT_OX': 820000,
    'T7_MOUNT_OX': 2400000,
    'T8_MOUNT_OX': 7200000,
    'T4_MOUNT_GIANTSTAG': 110000,
    'T5_MOUNT_COUGAR_KEEPER': 180000,
    'T6_MOUNT_DIREWOLF': 450000,
    'T6_MOUNT_GIANTSTAG_MOOSE': 650000,
    'T7_MOUNT_DIREBOAR': 1350000,
    'T7_MOUNT_SWAMPDRAGON': 1700000,
    'T8_MOUNT_DIREBEAR': 3900000,
    'T8_MOUNT_MAMMOTH_TRANSPORT': 125000000,
    'T8_MOUNT_RABBIT_EASTER': 28000000,
    'T8_MOUNT_RABBIT_EASTER_DARK': 38000000,
    'T8_MOUNT_DRAKE': 55000000,
    'T8_MOUNT_DRAKE_FIRE': 55000000,
    'T5_MOUNT_ARMORED_BEAR_FORTSTERLING': 240000,
    'T5_MOUNT_DIREBEAR_FW_FORTSTERLING': 240000,
    'T8_MOUNT_ARMORED_BEAR_FORTSTERLING_ELITE': 5500000,
    'T8_MOUNT_DIREBEAR_FW_FORTSTERLING_ELITE': 5500000,
    'T5_MOUNT_ARMORED_BOAR_LYMHURST': 240000,
    'T5_MOUNT_DIREBOAR_FW_LYMHURST': 240000,
    'T8_MOUNT_ARMORED_BOAR_LYMHURST_ELITE': 5500000,
    'T8_MOUNT_DIREBOAR_FW_LYMHURST_ELITE': 5500000,
    'T5_MOUNT_ARMORED_RAM_MARTLOCK': 240000,
    'T5_MOUNT_RAM_FW_MARTLOCK': 240000,
    'T8_MOUNT_ARMORED_RAM_MARTLOCK_ELITE': 5500000,
    'T8_MOUNT_RAM_FW_MARTLOCK_ELITE': 5500000,
    'T5_MOUNT_ARMORED_MOABIRD_BRIDGEWATCH': 240000,
    'T5_MOUNT_MOABIRD_FW_BRIDGEWATCH': 240000,
    'T8_MOUNT_ARMORED_MOABIRD_BRIDGEWATCH_ELITE': 5500000,
    'T8_MOUNT_MOABIRD_FW_BRIDGEWATCH_ELITE': 5500000,
    'T5_MOUNT_ARMORED_SALAMANDER_THETFORD': 240000,
    'T5_MOUNT_SWAMPDRAGON_FW_THETFORD': 240000,
    'T8_MOUNT_ARMORED_SALAMANDER_THETFORD_ELITE': 5500000,
    'T8_MOUNT_SWAMPDRAGON_FW_THETFORD_ELITE': 5500000,
    'T5_MOUNT_ARMORED_WOLF_CAERLEON': 240000,
    'T5_MOUNT_GREYWOLF_FW_CAERLEON': 240000,
    'T8_MOUNT_ARMORED_WOLF_CAERLEON_ELITE': 5500000,
    'T8_MOUNT_GREYWOLF_FW_CAERLEON_ELITE': 5500000,

    # Saddling Materials
    'T3_LEATHER': 420,
    'T4_LEATHER': 850,
    'T5_LEATHER': 1750,
    'T6_LEATHER': 4200,
    'T7_LEATHER': 11000,
    'T8_LEATHER': 29000,
    'T3_PLANKS': 380,
    'T4_PLANKS': 800,
    'T5_PLANKS': 1650,
    'T6_PLANKS': 3900,
    'T7_PLANKS': 10500,
    'T8_PLANKS': 27000,
}

def get_farming_price(market_prices, item_id, fallback=350):
    if not item_id:
        return fallback
    user_val = market_prices.get(item_id)
    if user_val is not None:
        try:
            val = float(user_val)
            if val > 0:
                return val
        except (ValueError, TypeError):
            pass
    return DEFAULT_FARMING_PRICES.get(item_id, fallback)

def get_farming_catalog():
    return FARMING_CATALOG

def calculate_farming(params):
    """
    Authoritative calculation engine for Farming & Agriculture in Albion Online.
    """
    item_id = params.get('item_id')
    item_def = FARMING_ITEMS_MAP.get(item_id)
    if not item_def:
        item_def = FARMING_CATALOG[0]
        item_id = item_def['id']

    city = params.get('city', 'Martlock')
    plots = max(1, int(params.get('plots', 1)))
    spots_per_plot = 9
    total_spots = plots * spots_per_plot

    use_focus = bool(params.get('use_focus', False))
    has_premium = bool(params.get('has_premium', True))
    is_sell_order = bool(params.get('is_sell_order', True))

    mastery_level = min(100, max(0, int(params.get('mastery_level', 0))))
    spec_level = min(100, max(0, int(params.get('spec_level', 0))))

    # Animal actions: 'produce' (eggs/milk), 'slaughter' (meat), or 'sell_grown'
    animal_action = params.get('animal_action', 'produce')
    # Mount action: 'grown' (sell grown animal) or 'saddled' (saddled riding horse/ox)
    mount_action = params.get('mount_action', 'grown')
    use_favorite_food = bool(params.get('use_favorite_food', True))

    # Market prices
    market_prices = params.get('market_prices', {})

    category = item_def.get('category', 'crop')

    # Focus reduction formula (exponential decay)
    efficiency_points = (mastery_level * 50) + (spec_level * 250)
    focus_per_spot = round(item_def.get('baseFocus', 1000) * pow(0.5, efficiency_points / 10000.0))

    # Biome Island Bonus: +10% Yield if current city matches item's bonusCity
    bonus_city = item_def.get('bonusCity')
    has_city_bonus = bool(bonus_city and city.lower() == bonus_city.lower())
    city_yield_multiplier = 1.10 if has_city_bonus else 1.0

    # Market tax calculation
    tax_rate = (0.04 if has_premium else 0.08) + (0.025 if is_sell_order else 0.0)

    # 1. Crops & Herbs
    if category in ['crop', 'herb']:
        total_focus_needed = (focus_per_spot * total_spots) if use_focus else 0
        crop_sell_price = get_farming_price(market_prices, item_id, 350)
        seed_id = item_def.get('seedId')
        seed_price = get_farming_price(market_prices, seed_id, item_def.get('vendorSeedPrice', 2000))

        # Average yield per spot: 9 with premium, 4.5 without
        base_yield_per_spot = item_def.get('baseYield', 9.0) if has_premium else (item_def.get('baseYield', 9.0) * 0.5)
        total_yield = round(total_spots * base_yield_per_spot * city_yield_multiplier, 1)

        # Seed Return calculation (Independent of Premium)
        base_seed_rate = item_def.get('baseSeedChance', 0.0)
        bonus_seed_rate = item_def.get('bonusSeedChance', 0.0)
        effective_seed_rate = (base_seed_rate + bonus_seed_rate) if use_focus else base_seed_rate

        total_seeds_returned = round(total_spots * effective_seed_rate, 2)
        
        if total_seeds_returned >= total_spots:
            seeds_to_buy = 0
            surplus_seeds = round(total_seeds_returned - total_spots, 2)
        else:
            seeds_to_buy = round(total_spots - total_seeds_returned, 2)
            surplus_seeds = 0

        seed_expense = round(seeds_to_buy * seed_price, 2)
        crop_revenue = round(total_yield * crop_sell_price, 2)
        surplus_seed_revenue = round(surplus_seeds * seed_price, 2)
        gross_revenue = round(crop_revenue + surplus_seed_revenue, 2)

        market_tax = round(gross_revenue * tax_rate, 2)
        net_profit = round(gross_revenue - market_tax - seed_expense, 2)

        profit_margin = round((net_profit / gross_revenue) * 100.0, 2) if gross_revenue > 0 else 0.0
        profit_per_plot = round(net_profit / plots, 2)

        bonus_seeds = total_spots * bonus_seed_rate
        silver_per_focus = round((bonus_seeds * seed_price) / total_focus_needed, 2) if total_focus_needed > 0 else 0.0

        return {
            'item': item_def,
            'plots': plots,
            'totalSpots': total_spots,
            'city': city,
            'hasCityBonus': has_city_bonus,
            'bonusCity': bonus_city,
            'hasPremium': has_premium,
            'useFocus': use_focus,
            'cycleDays': 1,
            'growthHours': 22 if has_premium else 44,
            'focus': {
                'focusPerSpot': focus_per_spot,
                'totalFocusNeeded': total_focus_needed,
                'silverPerFocus': silver_per_focus,
            },
            'yield': {
                'totalYield': total_yield,
                'yieldPerSpot': round(total_yield / total_spots, 2),
                'seedsReturned': total_seeds_returned,
                'seedsToBuy': seeds_to_buy,
                'surplusSeeds': surplus_seeds,
            },
            'finances': {
                'cropRevenue': crop_revenue,
                'surplusSeedRevenue': surplus_seed_revenue,
                'grossRevenue': gross_revenue,
                'seedExpense': seed_expense,
                'feedExpense': 0,
                'marketTax': market_tax,
                'netProfit': net_profit,
                'profitMarginPct': profit_margin,
                'profitPerPlot': profit_per_plot,
                'dailyProfit': net_profit,
            }
        }

    # 2. Livestock Pasture Animals
    elif category == 'animal':
        baby_id = item_def.get('babyId')
        baby_price = get_farming_price(market_prices, baby_id, item_def.get('vendorBabyPrice', 5000))
        prod_id = item_def.get('productId')
        prod_price = get_farming_price(market_prices, prod_id, 310) if prod_id else 0
        meat_id = item_def.get('meatId')
        meat_price = get_farming_price(market_prices, meat_id, 190) if meat_id else 0
        grown_price = get_farming_price(market_prices, item_def.get('id'), DEFAULT_FARMING_PRICES.get(item_def.get('id'), 10000))

        # Feed cost (10 standard crops or 5 favorite crops per day)
        fav_food_id = item_def.get('favoriteFood', 'T3_WHEAT')
        feed_unit_price = get_farming_price(market_prices, fav_food_id, 350)
        feed_per_spot = 5 if use_favorite_food else 10
        total_feed_units = total_spots * feed_per_spot
        feed_expense = round(total_feed_units * feed_unit_price, 2)

        can_produce = bool(prod_id)
        active_action = 'slaughter' if (not can_produce and animal_action == 'produce') else animal_action

        # MODE A: Daily Produce (Milk / Eggs)
        # Adult animals are permanent! They are not rebought daily.
        if active_action == 'produce':
            daily_prod_yield = item_def.get('productYieldPerDay', 9.5) if has_premium else (item_def.get('productYieldPerDay', 9.5) * 0.5)
            total_output = round(total_spots * daily_prod_yield * city_yield_multiplier, 1)
            output_revenue = round(total_output * prod_price, 2)

            gross_revenue = output_revenue
            market_tax = round(gross_revenue * tax_rate, 2)
            net_profit = round(gross_revenue - market_tax - feed_expense, 2)

            profit_margin = round((net_profit / gross_revenue) * 100.0, 2) if gross_revenue > 0 else 0.0
            profit_per_plot = round(net_profit / plots, 2)

            return {
                'item': item_def,
                'plots': plots,
                'totalSpots': total_spots,
                'city': city,
                'hasCityBonus': has_city_bonus,
                'bonusCity': bonus_city,
                'hasPremium': has_premium,
                'useFocus': False,
                'animalAction': 'produce',
                'cycleDays': 1,
                'growthHours': 22 if has_premium else 44,
                'focus': {
                    'focusPerSpot': 0,
                    'totalFocusNeeded': 0,
                    'silverPerFocus': 0.0,
                },
                'yield': {
                    'outputName': item_def.get('productName', 'Animal Produce'),
                    'outputIcon': item_def.get('productIcon'),
                    'totalOutput': total_output,
                    'feedUnits': total_feed_units,
                    'offspringReturned': 0,
                    'babiesToBuy': 0,
                    'surplusBabies': 0,
                },
                'finances': {
                    'outputRevenue': output_revenue,
                    'surplusBabyRevenue': 0,
                    'grossRevenue': gross_revenue,
                    'babyExpense': 0,
                    'feedExpense': feed_expense,
                    'marketTax': market_tax,
                    'netProfit': net_profit,
                    'profitMarginPct': profit_margin,
                    'profitPerPlot': profit_per_plot,
                    'dailyProfit': net_profit,
                }
            }

        # MODE B: Breeding & Growth (Slaughter for Meat or Sell Grown Adult)
        total_focus_needed = (focus_per_spot * total_spots) if use_focus else 0
        base_offspring = item_def.get('baseOffspringChance', 0.6)
        bonus_offspring = item_def.get('bonusOffspringChance', 0.8)
        effective_offspring_rate = (base_offspring + bonus_offspring) if use_focus else base_offspring

        total_offspring_returned = round(total_spots * effective_offspring_rate, 2)
        if total_offspring_returned >= total_spots:
            babies_to_buy = 0
            surplus_babies = round(total_offspring_returned - total_spots, 2)
        else:
            babies_to_buy = round(total_spots - total_offspring_returned, 2)
            surplus_babies = 0

        baby_expense = round(babies_to_buy * baby_price, 2)
        surplus_baby_revenue = round(surplus_babies * baby_price, 2)

        if active_action == 'sell_grown':
            total_output = total_spots
            output_revenue = round(total_spots * grown_price, 2)
            output_name = item_def.get('name')
            output_icon = item_def.get('icon')
        else:
            meat_yield_per_spot = item_def.get('meatYield', 18)
            total_output = round(total_spots * meat_yield_per_spot * city_yield_multiplier, 1)
            output_revenue = round(total_output * meat_price, 2)
            output_name = item_def.get('meatName', 'Raw Meat')
            output_icon = item_def.get('meatIcon')

        gross_revenue = round(output_revenue + surplus_baby_revenue, 2)
        market_tax = round(gross_revenue * tax_rate, 2)
        total_expenses = round(baby_expense + feed_expense, 2)
        net_profit = round(gross_revenue - market_tax - total_expenses, 2)

        profit_margin = round((net_profit / gross_revenue) * 100.0, 2) if gross_revenue > 0 else 0.0
        profit_per_plot = round(net_profit / plots, 2)

        silver_per_focus = round((bonus_offspring * total_spots * baby_price) / total_focus_needed, 2) if total_focus_needed > 0 else 0.0

        return {
            'item': item_def,
            'plots': plots,
            'totalSpots': total_spots,
            'city': city,
            'hasCityBonus': has_city_bonus,
            'bonusCity': bonus_city,
            'hasPremium': has_premium,
            'useFocus': use_focus,
            'animalAction': active_action,
            'cycleDays': 1,
            'growthHours': 22 if has_premium else 44,
            'focus': {
                'focusPerSpot': focus_per_spot,
                'totalFocusNeeded': total_focus_needed,
                'silverPerFocus': silver_per_focus,
            },
            'yield': {
                'outputName': output_name,
                'outputIcon': output_icon,
                'totalOutput': total_output,
                'feedUnits': total_feed_units,
                'offspringReturned': total_offspring_returned,
                'babiesToBuy': babies_to_buy,
                'surplusBabies': surplus_babies,
            },
            'finances': {
                'outputRevenue': output_revenue,
                'surplusBabyRevenue': surplus_baby_revenue,
                'grossRevenue': gross_revenue,
                'babyExpense': baby_expense,
                'feedExpense': feed_expense,
                'marketTax': market_tax,
                'netProfit': net_profit,
                'profitMarginPct': profit_margin,
                'profitPerPlot': profit_per_plot,
                'dailyProfit': net_profit,
            }
        }

    # 3. Mount Kennels
    else:
        tier = item_def.get('tier', 3)
        # Cycle days: T3=1, T4=2, T5=3, T6=4, T7=5, T8=6 Albion days
        cycle_days = max(1, tier - 2)
        growth_hours = cycle_days * (22 if has_premium else 44)

        total_focus_needed = (focus_per_spot * total_spots) if use_focus else 0
        baby_id = item_def.get('babyId')
        baby_price = get_farming_price(market_prices, baby_id, DEFAULT_FARMING_PRICES.get(baby_id, 25000))
        grown_price = get_farming_price(market_prices, item_def.get('id'), DEFAULT_FARMING_PRICES.get(item_def.get('id'), 30000))
        mount_id = item_def.get('mountId')
        mount_price = get_farming_price(market_prices, mount_id, DEFAULT_FARMING_PRICES.get(mount_id, 45000))

        # Diet: Carnivores eat Raw Meat (T3_MEAT); Herbivores eat crops (T3_WHEAT)
        is_carnivore = (
            item_def.get('diet') == 'meat' or
            any(k in item_def.get('id', '') for k in ['COUGAR', 'DIREWOLF', 'DIREBEAR', 'DRAKE', 'WOLF', 'BEAR', 'SALAMANDER'])
        )
        feed_food_id = 'T3_MEAT' if is_carnivore else 'T3_WHEAT'
        feed_unit_price = get_farming_price(market_prices, feed_food_id, 190 if is_carnivore else 350)

        # Feed consumption: 10 units per spot per day across the full cycle
        feed_per_spot = 10 * cycle_days
        total_feed_units = total_spots * feed_per_spot
        feed_expense = round(total_feed_units * feed_unit_price, 2)

        # Offspring return
        base_offspring = item_def.get('baseOffspringChance', 0.0)
        bonus_offspring = item_def.get('bonusOffspringChance', 0.0)
        effective_offspring = (base_offspring + bonus_offspring) if use_focus else base_offspring
        offspring_returned = round(total_spots * effective_offspring, 2)

        babies_to_buy = round(max(0, total_spots - offspring_returned), 2)
        surplus_babies = round(max(0, offspring_returned - total_spots), 2)
        baby_expense = round(babies_to_buy * baby_price, 2)
        surplus_baby_revenue = round(surplus_babies * baby_price, 2)

        saddling_expense = 0
        if mount_action == 'saddled' and mount_id:
            is_ox = ('OX' in item_def.get('id', ''))
            mat_id = f"T{tier}_PLANKS" if is_ox else f"T{tier}_LEATHER"
            mat_price = get_farming_price(market_prices, mat_id, DEFAULT_FARMING_PRICES.get(mat_id, 850))
            saddling_expense = round(total_spots * 20 * mat_price, 2)

            output_revenue = round(total_spots * mount_price, 2)
            output_name = item_def.get('mountName', 'Saddled Mount')
            output_icon = item_def.get('mountIcon')
        else:
            output_revenue = round(total_spots * grown_price, 2)
            output_name = item_def.get('name')
            output_icon = item_def.get('icon')

        gross_revenue = round(output_revenue + surplus_baby_revenue, 2)
        market_tax = round(gross_revenue * tax_rate, 2)
        total_expenses = round(baby_expense + feed_expense + saddling_expense, 2)
        cycle_net_profit = round(gross_revenue - market_tax - total_expenses, 2)

        profit_margin = round((cycle_net_profit / gross_revenue) * 100.0, 2) if gross_revenue > 0 else 0.0
        profit_per_plot = round(cycle_net_profit / plots, 2)
        daily_profit = round(cycle_net_profit / cycle_days, 2)

        silver_per_focus = round((bonus_offspring * total_spots * baby_price) / total_focus_needed, 2) if total_focus_needed > 0 else 0.0

        return {
            'item': item_def,
            'plots': plots,
            'totalSpots': total_spots,
            'city': city,
            'hasCityBonus': False,
            'bonusCity': None,
            'hasPremium': has_premium,
            'useFocus': use_focus,
            'mountAction': mount_action,
            'cycleDays': cycle_days,
            'growthHours': growth_hours,
            'focus': {
                'focusPerSpot': focus_per_spot,
                'totalFocusNeeded': total_focus_needed,
                'silverPerFocus': silver_per_focus,
            },
            'yield': {
                'outputName': output_name,
                'outputIcon': output_icon,
                'totalOutput': total_spots,
                'totalMounts': total_spots,
                'feedUnits': total_feed_units,
                'feedFoodName': 'Raw Meat' if is_carnivore else 'Wheat/Crops',
                'offspringReturned': offspring_returned,
                'babiesToBuy': babies_to_buy,
                'surplusBabies': surplus_babies,
            },
            'finances': {
                'outputRevenue': output_revenue,
                'mountRevenue': output_revenue,
                'surplusBabyRevenue': surplus_baby_revenue,
                'grossRevenue': gross_revenue,
                'babyExpense': baby_expense,
                'feedExpense': feed_expense,
                'saddlingExpense': saddling_expense,
                'marketTax': market_tax,
                'netProfit': cycle_net_profit,
                'profitMarginPct': profit_margin,
                'profitPerPlot': profit_per_plot,
                'dailyProfit': daily_profit,
            }
        }
