import json
import os
from math import pow

BASE_DIR = os.path.dirname(__file__)
CATALOG_PATH = os.path.join(BASE_DIR, 'data', 'generated_farming_catalog.json')

with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
    FARMING_CATALOG = json.load(f)

FARMING_ITEMS_MAP = {it['id']: it for it in FARMING_CATALOG}

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

    # Animal action: 'produce' (eggs/milk) or 'slaughter' (meat)
    animal_action = params.get('animal_action', 'produce')
    use_favorite_food = bool(params.get('use_favorite_food', True))

    # Market prices
    market_prices = params.get('market_prices', {})

    category = item_def.get('category', 'crop')

    # Focus reduction formula (exponential decay)
    # At 100 Mastery (5000 pts) and 100 Spec (25000 pts) = 30000 pts -> 0.5^3 = 0.125 -> 125 focus
    efficiency_points = (mastery_level * 50) + (spec_level * 250)
    focus_per_spot = round(item_def.get('baseFocus', 1000) * pow(0.5, efficiency_points / 10000.0))
    total_focus_needed = (focus_per_spot * total_spots) if use_focus else 0

    # Biome Island Bonus: +10% Yield if current city matches item's bonusCity
    bonus_city = item_def.get('bonusCity')
    has_city_bonus = bool(bonus_city and city.lower() == bonus_city.lower())
    city_yield_multiplier = 1.10 if has_city_bonus else 1.0

    # Market tax calculation
    tax_rate = (0.04 if has_premium else 0.08) + (0.025 if is_sell_order else 0.0)

    # 1. Crops & Herbs
    if category in ['crop', 'herb']:
        crop_sell_price = float(market_prices.get(item_id, 350))
        seed_id = item_def.get('seedId')
        seed_price = float(market_prices.get(seed_id, item_def.get('vendorSeedPrice', 2000)))

        # Average yield per spot: 9 with premium, 4.5 without
        base_yield_per_spot = item_def.get('baseYield', 9.0) if has_premium else (item_def.get('baseYield', 9.0) * 0.5)
        total_yield = round(total_spots * base_yield_per_spot * city_yield_multiplier, 1)

        # Seed Return calculation
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

        # Baseline unwatered for Silver/Focus calculation
        unwatered_seed_exp = round(total_spots * (1.0 - base_seed_rate) * seed_price, 2)
        unwatered_net = round((crop_revenue * (1.0 - tax_rate)) - unwatered_seed_exp, 2)
        silver_per_focus = round((net_profit - unwatered_net) / total_focus_needed, 2) if total_focus_needed > 0 else 0.0

        return {
            'item': item_def,
            'plots': plots,
            'totalSpots': total_spots,
            'city': city,
            'hasCityBonus': has_city_bonus,
            'bonusCity': bonus_city,
            'hasPremium': has_premium,
            'useFocus': use_focus,
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
                'marketTax': market_tax,
                'netProfit': net_profit,
                'profitMarginPct': profit_margin,
                'profitPerPlot': profit_per_plot,
            }
        }

    # 2. Livestock Pasture Animals
    elif category == 'animal':
        baby_id = item_def.get('babyId')
        baby_price = float(market_prices.get(baby_id, item_def.get('vendorBabyPrice', 5000)))
        prod_id = item_def.get('productId')
        prod_price = float(market_prices.get(prod_id, 300)) if prod_id else 0
        meat_id = item_def.get('meatId')
        meat_price = float(market_prices.get(meat_id, 180)) if meat_id else 0

        # Feed cost (10 standard crops or 5 favorite crops)
        fav_food_id = item_def.get('favoriteFood', 'T3_WHEAT')
        feed_unit_price = float(market_prices.get(fav_food_id, 350))
        feed_per_spot = 5 if use_favorite_food else 10
        total_feed_units = total_spots * feed_per_spot
        feed_expense = round(total_feed_units * feed_unit_price, 2)

        # Offspring return with/without focus
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

        # Primary output: Eggs/Milk or Slaughter Meat
        if animal_action == 'slaughter' or not prod_id:
            active_action = 'slaughter'
            meat_yield_per_spot = item_def.get('meatYield', 18)
            total_output = round(total_spots * meat_yield_per_spot * city_yield_multiplier, 1)
            output_revenue = round(total_output * meat_price, 2)
            output_name = item_def.get('meatName', 'Raw Meat')
            output_icon = item_def.get('meatIcon')
        else:
            active_action = 'produce'
            daily_prod_yield = item_def.get('productYieldPerDay', 9.5)
            total_output = round(total_spots * daily_prod_yield * city_yield_multiplier, 1)
            output_revenue = round(total_output * prod_price, 2)
            output_name = item_def.get('productName', 'Animal Product')
            output_icon = item_def.get('productIcon')

        surplus_baby_revenue = round(surplus_babies * baby_price, 2)
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
            }
        }

    # 3. Mount Breeding
    else:
        baby_id = item_def.get('babyId')
        baby_price = float(market_prices.get(baby_id, 25000))
        mount_id = item_def.get('mountId')
        mount_price = float(market_prices.get(mount_id, 45000))

        # Feed cost
        feed_expense = round(total_spots * 10 * float(market_prices.get('T3_WHEAT', 350)), 2)

        # Offspring return
        base_offspring = item_def.get('baseOffspringChance', 0.0)
        bonus_offspring = item_def.get('bonusOffspringChance', 0.0)
        effective_offspring = (base_offspring + bonus_offspring) if use_focus else base_offspring
        offspring_returned = round(total_spots * effective_offspring, 2)

        babies_to_buy = round(max(0, total_spots - offspring_returned), 2)
        surplus_babies = round(max(0, offspring_returned - total_spots), 2)
        baby_expense = round(babies_to_buy * baby_price, 2)

        mount_revenue = round(total_spots * mount_price, 2)
        surplus_baby_rev = round(surplus_babies * baby_price, 2)
        gross_revenue = round(mount_revenue + surplus_baby_rev, 2)

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
            'hasCityBonus': False,
            'bonusCity': None,
            'hasPremium': has_premium,
            'useFocus': use_focus,
            'focus': {
                'focusPerSpot': focus_per_spot,
                'totalFocusNeeded': total_focus_needed,
                'silverPerFocus': silver_per_focus,
            },
            'yield': {
                'totalMounts': total_spots,
                'offspringReturned': offspring_returned,
                'babiesToBuy': babies_to_buy,
                'surplusBabies': surplus_babies,
            },
            'finances': {
                'mountRevenue': mount_revenue,
                'surplusBabyRevenue': surplus_baby_rev,
                'grossRevenue': gross_revenue,
                'babyExpense': baby_expense,
                'feedExpense': feed_expense,
                'marketTax': market_tax,
                'netProfit': net_profit,
                'profitMarginPct': profit_margin,
                'profitPerPlot': profit_per_plot,
            }
        }
