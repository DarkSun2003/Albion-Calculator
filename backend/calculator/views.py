from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .constants import (
    RESOURCES,
    CITIES,
    CITY_PRODUCTION_BONUSES,
    RAW_PER_TIER,
    BASE_FOCUS_COST,
    AODP_SERVERS,
)
from .engine import calculate_refining, calculate_return_rate, calculate_focus_cost
from .services import (
    get_item_identifier,
    fetch_aodp_prices,
    parse_aodp_date,
    fetch_aodp_history_averages,
    save_user_price_override,
    sync_internet_clock,
    get_true_utc_now,
)

class RefiningConstantsView(APIView):
    """
    Returns static configuration for the refining calculator.
    """
    def get(self, request):
        return Response({
            'resources': RESOURCES,
            'cities': CITIES,
            'city_bonuses': CITY_PRODUCTION_BONUSES,
            'raw_per_tier': RAW_PER_TIER,
            'base_focus_costs': BASE_FOCUS_COST,
            'tiers': [4, 5, 6, 7, 8],
            'all_tiers': [3, 4, 5, 6, 7, 8],
            'enchantments': [0, 1, 2, 3, 4],
            'servers': list(AODP_SERVERS.keys()),
        })


class RefiningCalculateView(APIView):
    """
    Computes refining profits, return rates, focus costs, and material breakdown.
    """
    def post(self, request):
        data = request.data
        try:
            resource_type = data.get('resource_type', 'hide')
            tier = int(data.get('tier', 4))
            enchantment = int(data.get('enchantment', 0))
            quantity = int(data.get('quantity', 100))
            raw_price = float(data.get('raw_price', 0))
            prev_refined_price = float(data.get('prev_refined_price', 0))
            refined_sell_price = float(data.get('refined_sell_price', 0))
            city = data.get('city', 'Martlock')
            use_focus = bool(data.get('use_focus', False))
            daily_bonus_pct = float(data.get('daily_bonus_pct', 0.0))
            station_tax_per_100 = float(data.get('station_tax_per_100', 500.0))
            has_premium = bool(data.get('has_premium', True))
            is_sell_order = bool(data.get('is_sell_order', True))
            mastery_level = int(data.get('mastery_level', 0))
            spec_levels = data.get('spec_levels', {})

            result = calculate_refining(
                resource_type=resource_type,
                tier=tier,
                enchantment=enchantment,
                quantity=quantity,
                raw_price=raw_price,
                prev_refined_price=prev_refined_price,
                refined_sell_price=refined_sell_price,
                city=city,
                use_focus=use_focus,
                daily_bonus_pct=daily_bonus_pct,
                station_tax_per_100=station_tax_per_100,
                has_premium=has_premium,
                is_sell_order=is_sell_order,
                mastery_level=mastery_level,
                spec_levels=spec_levels,
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class RefiningPricesView(APIView):
    """
    Fetches real-time AODP market prices for the raw, previous-tier, and refined materials.
    """
    def post(self, request):
        data = request.data
        resource_type = data.get('resource_type', 'hide')
        tier = int(data.get('tier', 4))
        enchantment = int(data.get('enchantment', 0))
        server = data.get('server', 'europe')
        selected_city = data.get('city', 'Martlock')

        raw_id = get_item_identifier(resource_type, tier, enchantment, is_refined=False)
        refined_id = get_item_identifier(resource_type, tier, enchantment, is_refined=True)
        prev_refined_id = get_item_identifier(resource_type, tier - 1, 0, is_refined=True) if tier > 2 else ""

        items_to_fetch = [i for i in [raw_id, refined_id, prev_refined_id] if i]
        price_data = fetch_aodp_prices(items_to_fetch, server=server)

        # Helper to get the best price record
        def extract_prices(item_id):
            if not item_id:
                return {'sell_min': 0, 'buy_max': 0, 'city': selected_city, 'age_hours': None}
            city_key = f"{item_id}:{selected_city}"
            record = price_data.get(city_key)
            if record and record.get('sell_price_min', 0) > 0:
                return {
                    'item_id': item_id,
                    'sell_min': record.get('sell_price_min', 0),
                    'buy_max': record.get('buy_price_max', 0),
                    'updated_at': record.get('updated_at'),
                    'age_hours': record.get('age_hours'),
                    'source': record.get('source', 'aodp_live'),
                    'city': selected_city,
                }
            # Fallback to any royal city if not found or 0 in selected city
            for key, rec in price_data.items():
                if key.startswith(f"{item_id}:") and rec.get('sell_price_min', 0) > 0:
                    return {
                        'item_id': item_id,
                        'sell_min': rec.get('sell_price_min', 0),
                        'buy_max': rec.get('buy_price_max', 0),
                        'updated_at': rec.get('updated_at'),
                        'age_hours': rec.get('age_hours'),
                        'source': rec.get('source', 'aodp_live'),
                        'city': rec.get('city'),
                    }
            if record:
                return {
                    'item_id': item_id,
                    'sell_min': record.get('sell_price_min', 0),
                    'buy_max': record.get('buy_price_max', 0),
                    'updated_at': record.get('updated_at'),
                    'age_hours': record.get('age_hours'),
                    'source': record.get('source', 'aodp_live'),
                    'city': selected_city,
                }
            return {'item_id': item_id, 'sell_min': 0, 'buy_max': 0, 'city': selected_city, 'age_hours': None}

        royal_cities = ['Martlock', 'Thetford', 'Fort Sterling', 'Lymhurst', 'Bridgewatch', 'Caerleon']
        cities_data = {}
        for c in royal_cities:
            raw_rec = price_data.get(f"{raw_id}:{c}")
            refined_rec = price_data.get(f"{refined_id}:{c}")
            prev_rec = price_data.get(f"{prev_refined_id}:{c}")
            cities_data[c] = {
                'raw_sell_min': raw_rec.get('sell_price_min', 0) if raw_rec else 0,
                'raw_buy_max': raw_rec.get('buy_price_max', 0) if raw_rec else 0,
                'raw_updated_at': raw_rec.get('updated_at') if raw_rec else None,
                'raw_age_hours': raw_rec.get('age_hours') if raw_rec else None,
                'refined_sell_min': refined_rec.get('sell_price_min', 0) if refined_rec else 0,
                'refined_buy_max': refined_rec.get('buy_price_max', 0) if refined_rec else 0,
                'refined_updated_at': refined_rec.get('updated_at') if refined_rec else None,
                'refined_age_hours': refined_rec.get('age_hours') if refined_rec else None,
                'prev_refined_sell_min': prev_rec.get('sell_price_min', 0) if prev_rec else 0,
                'prev_refined_updated_at': prev_rec.get('updated_at') if prev_rec else None,
                'prev_refined_age_hours': prev_rec.get('age_hours') if prev_rec else None,
            }

        return Response({
            'raw': extract_prices(raw_id),
            'refined': extract_prices(refined_id),
            'prev_refined': extract_prices(prev_refined_id),
            'raw_id': raw_id,
            'refined_id': refined_id,
            'prev_refined_id': prev_refined_id,
            'cities': cities_data,
            'server': server,
            'city': selected_city,
            'server_utc_now': get_true_utc_now().isoformat(),
        })


class CraftingItemsView(APIView):
    """
    Returns available craftable items, categories, and city bonuses.
    """
    def get(self, request):
        from .crafting_constants import CRAFTABLE_ITEMS, CRAFTING_CATEGORIES, CITY_CRAFTING_BONUSES
        return Response({
            'categories': CRAFTING_CATEGORIES,
            'items': CRAFTABLE_ITEMS,
            'city_bonuses': CITY_CRAFTING_BONUSES,
            'tiers': [2, 3, 4, 5, 6, 7, 8],
            'enchantments': [0, 1, 2, 3, 4],
        })


class CraftingCalculateView(APIView):
    """
    Calculates item crafting profitability, materials required, and journal returns.
    """
    def post(self, request):
        from .crafting_engine import calculate_crafting
        data = request.data
        try:
            result = calculate_crafting(
                item_id=data.get('item_id', 'main_sword'),
                tier=int(data.get('tier', 4)),
                enchantment=int(data.get('enchantment', 0)),
                quantity=int(data.get('quantity', 1)),
                primary_mat_price=float(data.get('primary_mat_price', 0)),
                secondary_mat_price=float(data.get('secondary_mat_price', 0)),
                artifact_price=float(data.get('artifact_price', 0)),
                item_sell_price=float(data.get('item_sell_price', 0)),
                city=data.get('city', 'Lymhurst'),
                use_focus=bool(data.get('use_focus', False)),
                daily_bonus_pct=float(data.get('daily_bonus_pct', 0.0)),
                station_tax_per_100=float(data.get('station_tax_per_100', 500.0)),
                has_premium=bool(data.get('has_premium', True)),
                is_sell_order=bool(data.get('is_sell_order', True)),
                include_journals=bool(data.get('include_journals', True)),
                empty_journal_price=float(data.get('empty_journal_price', 0)),
                full_journal_price=float(data.get('full_journal_price', 0)),
                mastery_level=int(data.get('mastery_level', 0)),
                spec_level=int(data.get('spec_level', 0)),
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CraftingPricesView(APIView):
    """
    Fetches real-time AODP market prices for the crafted equipment item across all 5 qualities,
    plus primary materials, secondary materials, artifacts, and journals.
    """
    def post(self, request):
        import requests
        data = request.data
        item_id = data.get('item_id', 'bag')
        tier = int(data.get('tier', 4))
        enchantment = int(data.get('enchantment', 0))
        server = data.get('server', 'europe')
        selected_city = data.get('city', 'Lymhurst')

        from .crafting_engine import get_craftable_item
        item_def = get_craftable_item(item_id)
        if not item_def:
            return Response({'error': f"Item {item_id} not found"}, status=status.HTTP_404_NOT_FOUND)

        # Build AODP Item ID for the crafted item
        base_item_id = item_def['template'].replace('{tier}', str(tier))
        crafted_aodp_id = f"{base_item_id}@{enchantment}" if enchantment > 0 and tier >= 4 else base_item_id

        # Build Material IDs
        primary_mat_id = item_def.get('primaryMatIcon', '').replace('{tier}', str(tier))
        if enchantment > 0 and 'STONE' not in primary_mat_id and primary_mat_id:
            primary_mat_id = f"{primary_mat_id}_LEVEL{enchantment}@{enchantment}"

        secondary_mat_id = None
        if item_def.get('secondaryMatIcon'):
            sec_id = item_def['secondaryMatIcon'].replace('{tier}', str(tier))
            if enchantment > 0 and 'STONE' not in sec_id:
                secondary_mat_id = f"{sec_id}_LEVEL{enchantment}@{enchantment}"
            else:
                secondary_mat_id = sec_id

        artifact_id = None
        if item_def.get('isArtifact') and item_def.get('artifactTemplate'):
            artifact_id = item_def['artifactTemplate'].replace('{tier}', str(tier))

        journal_empty_id = None
        journal_full_id = None
        if tier >= 4 and item_def.get('journalTemplate'):
            journal_empty_id = item_def['journalTemplate'].replace('{tier}', str(tier))
            journal_full_id = f"{journal_empty_id}_FULL"

        # 1. Fetch verified material, artifact & journal prices using strict qualities='1' + 24h history
        mat_ids = [m for m in [primary_mat_id, secondary_mat_id, artifact_id, journal_empty_id, journal_full_id] if m]
        mat_price_data = fetch_aodp_prices(mat_ids, server=server, qualities='1', include_history=True)

        def get_mat_price(mat_id):
            if not mat_id:
                return {'sell_min': 0, 'updated_at': None, 'age_hours': None, 'city': selected_city}
            rec = mat_price_data.get(f"{mat_id}:{selected_city}")
            if rec and rec.get('sell_price_min', 0) > 0:
                return {
                    'sell_min': rec['sell_price_min'],
                    'buy_max': rec.get('buy_price_max', 0),
                    'avg_price_24h': rec.get('avg_price_24h', 0),
                    'updated_at': rec.get('updated_at'),
                    'age_hours': rec.get('age_hours'),
                    'city': selected_city,
                    'source': rec.get('source', 'aodp_live'),
                }
            for key, fallback_rec in mat_price_data.items():
                if key.startswith(f"{mat_id}:") and fallback_rec.get('sell_price_min', 0) > 0:
                    return {
                        'sell_min': fallback_rec['sell_price_min'],
                        'buy_max': fallback_rec.get('buy_price_max', 0),
                        'avg_price_24h': fallback_rec.get('avg_price_24h', 0),
                        'updated_at': fallback_rec.get('updated_at'),
                        'age_hours': fallback_rec.get('age_hours'),
                        'city': fallback_rec.get('city', selected_city),
                        'source': fallback_rec.get('source', 'aodp_live'),
                    }
            return {'sell_min': 0, 'updated_at': None, 'age_hours': None, 'city': selected_city}

        # 2. Fetch crafted equipment prices across all 5 qualities + 24h history cross-check
        loc_list = ['Black Market', 'Caerleon', 'Martlock', 'Lymhurst', 'Fort Sterling', 'Thetford', 'Bridgewatch']
        locations = ",".join(loc_list)
        server_key = str(server).lower()
        base_api = AODP_SERVERS.get(server_key, AODP_SERVERS['europe'])
        url = f"{base_api}{crafted_aodp_id}.json?locations={locations}&qualities=1,2,3,4,5"

        records = []
        try:
            resp = requests.get(url, timeout=7)
            sync_internet_clock(resp)
            if resp.status_code == 200:
                records = resp.json()
        except Exception as e:
            print(f"Crafting prices fetch error: {e}")

        gear_history = fetch_aodp_history_averages(
            item_ids=[crafted_aodp_id],
            server=server_key,
            locations=loc_list,
            qualities='1,2,3,4,5',
        )

        qualities_dict = {
            1: {'id': 1, 'name': 'Normal', 'label': 'Normal (Q1)', 'sell_min': 0, 'buy_max': 0, 'avg_price_24h': 0, 'daily_volume': 0, 'updated_at': None, 'age_hours': 999999.0, 'city': selected_city},
            2: {'id': 2, 'name': 'Good', 'label': 'Good (Q2)', 'sell_min': 0, 'buy_max': 0, 'avg_price_24h': 0, 'daily_volume': 0, 'updated_at': None, 'age_hours': 999999.0, 'city': selected_city},
            3: {'id': 3, 'name': 'Outstanding', 'label': 'Outstanding (Q3)', 'sell_min': 0, 'buy_max': 0, 'avg_price_24h': 0, 'daily_volume': 0, 'updated_at': None, 'age_hours': 999999.0, 'city': selected_city},
            4: {'id': 4, 'name': 'Excellent', 'label': 'Excellent (Q4)', 'sell_min': 0, 'buy_max': 0, 'avg_price_24h': 0, 'daily_volume': 0, 'updated_at': None, 'age_hours': 999999.0, 'city': selected_city},
            5: {'id': 5, 'name': 'Masterpiece', 'label': 'Masterpiece (Q5)', 'sell_min': 0, 'buy_max': 0, 'avg_price_24h': 0, 'daily_volume': 0, 'updated_at': None, 'age_hours': 999999.0, 'city': selected_city},
        }

        # First pass: selected city with freshness & 24h history outlier protection
        for r in records:
            if r.get('item_id') == crafted_aodp_id and r.get('city') == selected_city:
                try:
                    q = int(r.get('quality', 1))
                except (ValueError, TypeError):
                    q = 1
                if q not in qualities_dict:
                    continue

                sell_min = int(r.get('sell_price_min', 0) or 0)
                buy_max = int(r.get('buy_price_max', 0) or 0)
                u_date, age_h = parse_aodp_date(r.get('sell_price_min_date'))
                b_date, b_age_h = parse_aodp_date(r.get('buy_price_max_date'))
                if not u_date:
                    sell_min = 0
                if not b_date or b_age_h > 48.0:
                    buy_max = 0

                hist = gear_history.get(f"{crafted_aodp_id}:{selected_city}:{q}", {})
                avg_24h = hist.get('avg_price_24h', 0)
                vol_24h = hist.get('daily_volume', 0)

                if avg_24h > 0:
                    qualities_dict[q]['avg_price_24h'] = avg_24h
                    qualities_dict[q]['daily_volume'] = vol_24h
                    if sell_min == 0 or age_h > 24.0 or sell_min > avg_24h * 3.0 or sell_min < avg_24h * 0.25:
                        sell_min = avg_24h

                if sell_min > 0:
                    existing_age = qualities_dict[q]['age_hours']
                    is_fresher = (age_h + 3.0) < existing_age
                    is_similar_and_cheaper = abs(age_h - existing_age) <= 3.0 and (qualities_dict[q]['sell_min'] == 0 or sell_min < qualities_dict[q]['sell_min'])
                    if qualities_dict[q]['sell_min'] == 0 or is_fresher or is_similar_and_cheaper:
                        qualities_dict[q]['sell_min'] = sell_min
                        qualities_dict[q]['updated_at'] = u_date
                        qualities_dict[q]['age_hours'] = age_h
                        qualities_dict[q]['city'] = selected_city

                if buy_max > qualities_dict[q]['buy_max']:
                    qualities_dict[q]['buy_max'] = buy_max

        # Second pass: fallback to any Royal City or Black Market for qualities still missing
        for r in records:
            if r.get('item_id') == crafted_aodp_id:
                try:
                    q = int(r.get('quality', 1))
                except (ValueError, TypeError):
                    q = 1
                if q not in qualities_dict:
                    continue
                sell_min = int(r.get('sell_price_min', 0) or 0)
                u_date, age_h = parse_aodp_date(r.get('sell_price_min_date'))
                if not u_date or age_h > 48.0:
                    sell_min = 0

                if qualities_dict[q]['sell_min'] == 0 and sell_min > 0:
                    qualities_dict[q]['sell_min'] = sell_min
                    qualities_dict[q]['updated_at'] = u_date
                    qualities_dict[q]['age_hours'] = age_h
                    qualities_dict[q]['city'] = r.get('city')
                if qualities_dict[q]['buy_max'] == 0 and r.get('buy_price_max', 0) > 0:
                    b_date, b_age_h = parse_aodp_date(r.get('buy_price_max_date'))
                    if b_date and b_age_h <= 48.0:
                        qualities_dict[q]['buy_max'] = int(r.get('buy_price_max', 0))

        # Choose default quality with an active price (prefer Normal Q1 or Good Q2)
        default_q = 1 if qualities_dict[1]['sell_min'] > 0 else (2 if qualities_dict[2]['sell_min'] > 0 else 1)
        for cand_q in [1, 2, 3, 4, 5]:
            if qualities_dict[cand_q]['sell_min'] > 0:
                default_q = cand_q
                break

        return Response({
            'crafted_item': {
                'id': crafted_aodp_id,
                'qualities': qualities_dict,
                'default_quality': default_q,
                'sell_min': qualities_dict[default_q]['sell_min'],
                'avg_price_24h': qualities_dict[default_q]['avg_price_24h'],
                'updated_at': qualities_dict[default_q]['updated_at'],
                'age_hours': qualities_dict[default_q]['age_hours'],
                'city': qualities_dict[default_q]['city'],
            },
            'primary_mat': get_mat_price(primary_mat_id),
            'secondary_mat': get_mat_price(secondary_mat_id) if secondary_mat_id else None,
            'artifact': get_mat_price(artifact_id) if artifact_id else None,
            'journal_empty': get_mat_price(journal_empty_id) if journal_empty_id else None,
            'journal_full': get_mat_price(journal_full_id) if journal_full_id else None,
            'server': server,
            'city': selected_city,
            'server_utc_now': get_true_utc_now().isoformat(),
        })


class FoodItemsView(APIView):
    """
    Returns available cooking food items, subcategories, and Caerleon city bonus info.
    """
    def get(self, request):
        from .cooking_engine import load_food_catalog
        catalog = load_food_catalog()
        subcategories = [
            {'id': 'all', 'label': 'All Feasts'},
            {'id': 'soups', 'label': 'Soups'},
            {'id': 'salads', 'label': 'Salads'},
            {'id': 'pies', 'label': 'Pies'},
            {'id': 'omelettes', 'label': 'Omelettes'},
            {'id': 'stews', 'label': 'Stews'},
            {'id': 'sandwiches', 'label': 'Sandwiches'},
            {'id': 'roasts', 'label': 'Roasts'},
            {'id': 'dragon', 'label': 'Dragon Dishes'},
            {'id': 'pantry', 'label': 'Pantry & Milling'},
            {'id': 'butchery', 'label': 'Butchery'},
        ]
        return Response({
            'items': list(catalog.values()),
            'subcategories': subcategories,
            'bonusCity': 'Caerleon',
            'cities': CITIES,
            'tiers': [1, 2, 3, 4, 5, 6, 7, 8],
            'enchantments': [0, 1, 2, 3],
        })


class FoodCalculateView(APIView):
    """
    Calculates food cooking profitability, batch yields, fish sauce additions, and focus costs.
    """
    def post(self, request):
        from .cooking_engine import calculate_cooking
        data = request.data
        try:
            result = calculate_cooking(
                item_id=data.get('item_id', 'T7_MEAL_PIE'),
                enchantment=int(data.get('enchantment', 0)),
                batches=int(data.get('batches', 1)),
                ingredient_prices=data.get('ingredient_prices', {}),
                item_sell_price=float(data.get('item_sell_price', 0)),
                city=data.get('city', 'Caerleon'),
                use_focus=bool(data.get('use_focus', False)),
                daily_bonus_pct=float(data.get('daily_bonus_pct', 0.0)),
                station_tax_per_100=float(data.get('station_tax_per_100', 500.0)),
                has_premium=bool(data.get('has_premium', True)),
                is_sell_order=bool(data.get('is_sell_order', True)),
                mastery_level=int(data.get('mastery_level', 0)),
                spec_level=int(data.get('spec_level', 0)),
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class FoodPricesView(APIView):
    """
    Fetches real-time AODP market prices for the food item and all its ingredients.
    """
    def post(self, request):
        data = request.data
        item_id = data.get('item_id')
        enchantment = int(data.get('enchantment', 0))
        ingredient_ids = data.get('ingredient_ids', [])
        server = data.get('server', 'europe')
        selected_city = data.get('city', 'Caerleon')

        if not item_id:
            return Response({'error': 'item_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        target_food_id = f"{item_id}@{enchantment}" if enchantment > 0 else item_id
        items_to_fetch = [target_food_id] + list(ingredient_ids)

        price_data = fetch_aodp_prices(items_to_fetch, server=server, locations=[selected_city])

        def extract_prices(iid):
            city_key = f"{iid}:{selected_city}"
            record = price_data.get(city_key)
            if record:
                return {
                    'item_id': iid,
                    'sell_min': record.get('sell_price_min', 0),
                    'buy_max': record.get('buy_price_max', 0),
                    'updated_at': record.get('updated_at'),
                    'age_hours': record.get('age_hours'),
                    'city': selected_city,
                }
            for key, rec in price_data.items():
                if key.startswith(f"{iid}:") and rec.get('sell_price_min', 0) > 0:
                    return {
                        'item_id': iid,
                        'sell_min': rec.get('sell_price_min', 0),
                        'buy_max': rec.get('buy_price_max', 0),
                        'updated_at': rec.get('updated_at'),
                        'age_hours': rec.get('age_hours'),
                        'city': rec.get('city'),
                    }
            return {'item_id': iid, 'sell_min': 0, 'buy_max': 0, 'city': selected_city}

        ingredients_res = {ing_id: extract_prices(ing_id) for ing_id in ingredient_ids}
        food_res = extract_prices(target_food_id)

        return Response({
            'food': food_res,
            'ingredients': ingredients_res,
            'server': server,
            'city': selected_city,
            'server_utc_now': get_true_utc_now().isoformat(),
        })


class PotionItemsView(APIView):
    """
    Returns available alchemy potions, subcategories, and Brecilien city bonus info.
    """
    def get(self, request):
        from .potion_engine import load_potion_catalog
        catalog = load_potion_catalog()
        subcategories = [
            {'id': 'all', 'label': 'All Elixirs'},
            {'id': 'healing', 'label': 'Healing'},
            {'id': 'energy', 'label': 'Energy'},
            {'id': 'defense', 'label': 'Defense & Resistance'},
            {'id': 'combat', 'label': 'Combat (Berserk/Gigantify)'},
            {'id': 'debuff', 'label': 'Offensive (Poison/Acid/Hellfire)'},
            {'id': 'utility', 'label': 'Utility & CC'},
            {'id': 'gathering', 'label': 'Gathering'},
            {'id': 'distillery', 'label': 'Distillery & Extracts'},
        ]
        return Response({
            'items': list(catalog.values()),
            'subcategories': subcategories,
            'bonusCity': 'Brecilien',
            'cities': CITIES,
            'tiers': [1, 2, 3, 4, 5, 6, 7, 8],
            'enchantments': [0, 1, 2, 3],
        })


class PotionCalculateView(APIView):
    """
    Calculates potion alchemy profitability, batch yields, arcane extract infusions, and focus costs.
    """
    def post(self, request):
        from .potion_engine import calculate_potions
        data = request.data
        try:
            result = calculate_potions(
                item_id=data.get('item_id', 'T4_POTION_HEAL'),
                enchantment=int(data.get('enchantment', 0)),
                batches=int(data.get('batches', 1)),
                ingredient_prices=data.get('ingredient_prices', {}),
                item_sell_price=float(data.get('item_sell_price', 0)),
                city=data.get('city', 'Brecilien'),
                use_focus=bool(data.get('use_focus', False)),
                daily_bonus_pct=float(data.get('daily_bonus_pct', 0.0)),
                station_tax_per_100=float(data.get('station_tax_per_100', 500.0)),
                has_premium=bool(data.get('has_premium', True)),
                is_sell_order=bool(data.get('is_sell_order', True)),
                mastery_level=int(data.get('mastery_level', 0)),
                spec_level=int(data.get('spec_level', 0)),
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PotionPricesView(APIView):
    """
    Fetches real-time AODP market prices for the potion and all its ingredients.
    """
    def post(self, request):
        data = request.data
        item_id = data.get('item_id')
        enchantment = int(data.get('enchantment', 0))
        ingredient_ids = data.get('ingredient_ids', [])
        server = data.get('server', 'europe')
        selected_city = data.get('city', 'Brecilien')

        if not item_id:
            return Response({'error': 'item_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        target_potion_id = f"{item_id}@{enchantment}" if enchantment > 0 else item_id
        items_to_fetch = [target_potion_id] + list(ingredient_ids)

        price_data = fetch_aodp_prices(items_to_fetch, server=server, locations=[selected_city])

        def extract_prices(iid):
            city_key = f"{iid}:{selected_city}"
            record = price_data.get(city_key)
            if record:
                return {
                    'item_id': iid,
                    'sell_min': record.get('sell_price_min', 0),
                    'buy_max': record.get('buy_price_max', 0),
                    'updated_at': record.get('updated_at'),
                    'age_hours': record.get('age_hours'),
                    'city': selected_city,
                }
            for key, rec in price_data.items():
                if key.startswith(f"{iid}:") and rec.get('sell_price_min', 0) > 0:
                    return {
                        'item_id': iid,
                        'sell_min': rec.get('sell_price_min', 0),
                        'buy_max': rec.get('buy_price_max', 0),
                        'updated_at': rec.get('updated_at'),
                        'age_hours': rec.get('age_hours'),
                        'city': rec.get('city'),
                    }
            return {'item_id': iid, 'sell_min': 0, 'buy_max': 0, 'city': selected_city}

        ingredients_res = {ing_id: extract_prices(ing_id) for ing_id in ingredient_ids}
        potion_res = extract_prices(target_potion_id)

        return Response({
            'potion': potion_res,
            'ingredients': ingredients_res,
            'server': server,
            'city': selected_city,
            'server_utc_now': get_true_utc_now().isoformat(),
        })


class FarmingItemsView(APIView):
    """
    Returns the full catalog of crops, herbs, livestock animals, and mounts for Farming & Agriculture.
    """
    def get(self, request):
        from .farming_engine import get_farming_catalog
        catalog = get_farming_catalog()
        categories = [
            {'id': 'all', 'label': 'All Farming'},
            {'id': 'crop', 'label': 'Crops & Fields'},
            {'id': 'herb', 'label': 'Herb Gardens'},
            {'id': 'animal', 'label': 'Livestock Pastures'},
            {'id': 'mount', 'label': 'Mount Raising & Kennels'},
        ]
        return Response({
            'items': catalog,
            'categories': categories,
            'cities': CITIES,
            'tiers': [1, 2, 3, 4, 5, 6, 7, 8],
        })


class FarmingCalculateView(APIView):
    """
    Authoritative Django calculation for Farming yields, seed returns, nutrition feed costs, and profits.
    """
    def post(self, request):
        from .farming_engine import calculate_farming
        data = request.data
        try:
            result = calculate_farming(data)
            return Response(result)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class FarmingPricesView(APIView):
    """
    Fetches real-time market prices for crops, seeds, babies, meats, and products.
    """
    def post(self, request):
        data = request.data
        item_id = data.get('item_id')
        related_ids = data.get('related_ids', [])
        server = data.get('server', 'europe')
        selected_city = data.get('city', 'Martlock')

        if not item_id:
            return Response({'error': 'item_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        items_to_fetch = list(dict.fromkeys([item_id] + list(related_ids)))
        price_data = fetch_aodp_prices(items_to_fetch, server=server, locations=[selected_city])

        def extract_prices(iid):
            city_key = f"{iid}:{selected_city}"
            record = price_data.get(city_key)
            if record:
                return {
                    'item_id': iid,
                    'sell_min': record.get('sell_price_min', 0),
                    'buy_max': record.get('buy_price_max', 0),
                    'updated_at': record.get('updated_at'),
                    'age_hours': record.get('age_hours'),
                    'city': selected_city,
                }
            for key, rec in price_data.items():
                if key.startswith(f"{iid}:") and rec.get('sell_price_min', 0) > 0:
                    return {
                        'item_id': iid,
                        'sell_min': rec.get('sell_price_min', 0),
                        'buy_max': rec.get('buy_price_max', 0),
                        'updated_at': rec.get('updated_at'),
                        'age_hours': rec.get('age_hours'),
                        'city': rec.get('city'),
                    }
            return {'item_id': iid, 'sell_min': 0, 'buy_max': 0, 'city': selected_city}

        results = {iid: extract_prices(iid) for iid in items_to_fetch}

        return Response({
            'prices': results,
            'server': server,
            'city': selected_city,
            'server_utc_now': get_true_utc_now().isoformat(),
        })


class LaborerItemsView(APIView):
    """
    Returns the complete catalog of 11 laborer professions, journals (T2-T8), and house specifications.
    """
    def get(self, request):
        from .laborer_engine import get_laborer_catalog
        return Response(get_laborer_catalog())


class LaborerCalculateView(APIView):
    """
    Computes laborer journal returns, furniture happiness scaling, and net silver profit.
    """
    def post(self, request):
        from .laborer_engine import calculate_laborers
        data = request.data
        try:
            result = calculate_laborers(data)
            return Response(result)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LaborerPricesView(APIView):
    """
    Fetches real-time market prices for full journals, empty journals, and returned materials.
    """
    def post(self, request):
        data = request.data
        full_journal_id = data.get('full_journal_id')
        empty_journal_id = data.get('empty_journal_id')
        material_ids = data.get('material_ids', [])
        server = data.get('server', 'europe')
        selected_city = data.get('city', 'Martlock')

        items_to_fetch = [iid for iid in [full_journal_id, empty_journal_id] + list(material_ids) if iid and iid != 'SILVER']
        price_data = fetch_aodp_prices(items_to_fetch, server=server, locations=[selected_city])

        def extract_prices(iid):
            city_key = f"{iid}:{selected_city}"
            record = price_data.get(city_key)
            if record:
                return {
                    'item_id': iid,
                    'sell_min': record.get('sell_price_min', 0),
                    'buy_max': record.get('buy_price_max', 0),
                    'updated_at': record.get('updated_at'),
                    'age_hours': record.get('age_hours'),
                    'city': selected_city,
                }
            for key, rec in price_data.items():
                if key.startswith(f"{iid}:") and rec.get('sell_price_min', 0) > 0:
                    return {
                        'item_id': iid,
                        'sell_min': rec.get('sell_price_min', 0),
                        'buy_max': rec.get('buy_price_max', 0),
                        'updated_at': rec.get('updated_at'),
                        'age_hours': rec.get('age_hours'),
                        'city': rec.get('city'),
                    }
            return {'item_id': iid, 'sell_min': 0, 'buy_max': 0, 'city': selected_city}

        results = {iid: extract_prices(iid) for iid in items_to_fetch}

        return Response({
            'prices': results,
            'server': server,
            'city': selected_city,
            'server_utc_now': get_true_utc_now().isoformat(),
        })


class BlackMarketItemsView(APIView):
    """
    Returns available Black Market eligible equipment catalog, categories, tiers, and enchantments.
    """
    def get(self, request):
        from .blackmarket_engine import get_blackmarket_catalog
        try:
            catalog = get_blackmarket_catalog()
            return Response(catalog)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BlackMarketScanView(APIView):
    """
    Scans live AODP prices across Royal Cities vs Black Market to discover flip and craft-to-order arbitrage.
    """
    def post(self, request):
        from .blackmarket_engine import scan_blackmarket
        data = request.data
        try:
            result = scan_blackmarket(data)
            return Response(result)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BlackMarketHaulView(APIView):
    """
    Calculates transport cargo manifest, total investment, payout, weight, density, and recommended mount.
    """
    def post(self, request):
        from .blackmarket_engine import calculate_haul
        data = request.data
        try:
            result = calculate_haul(data)
            return Response(result)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
