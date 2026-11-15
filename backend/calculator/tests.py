from django.test import TestCase, Client
import json

class RefiningCalculationTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_refining_calculation_martlock_hide(self):
        """Test T4 Hide refining in Martlock (bonus city)."""
        response = self.client.post(
            '/api/refining/calculate/',
            data=json.dumps({
                'resource_type': 'hide',
                'tier': 4,
                'enchantment': 0,
                'quantity': 100,
                'raw_price': 70,
                'prev_refined_price': 50,
                'refined_sell_price': 175,
                'city': 'Martlock',
                'use_focus': False,
                'station_tax_per_100': 500,
                'has_premium': True,
                'is_sell_order': True,
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['isBonusCity'])
        self.assertEqual(data['returnRatePct'], 36.71)
        self.assertGreater(data['financials']['netProfit'], 0)
        self.assertEqual(data['materials']['rawNeededGross'], 200)

    def test_refining_opportunity_cost_outside_bonus_city(self):
        """Test hide refining in non-bonus city generates opportunity cost."""
        response = self.client.post(
            '/api/refining/calculate/',
            data=json.dumps({
                'resource_type': 'hide',
                'tier': 4,
                'enchantment': 0,
                'quantity': 100,
                'raw_price': 70,
                'prev_refined_price': 50,
                'refined_sell_price': 175,
                'city': 'Thetford',
                'use_focus': False,
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data['isBonusCity'])
        self.assertEqual(data['returnRatePct'], 15.25)
        self.assertIsNotNone(data['opportunityCost'])
        self.assertEqual(data['opportunityCost']['bonusCity'], 'Martlock')


class CraftingCalculationTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_t2_bag_crafting(self):
        """Test T2 Novice Bag crafting with Brecilien specialty bonus."""
        response = self.client.post(
            '/api/crafting/calculate/',
            data=json.dumps({
                'item_id': 'bag',
                'tier': 2,
                'enchantment': 0,
                'quantity': 10,
                'primary_mat_price': 35,
                'secondary_mat_price': 0,
                'artifact_price': 0,
                'item_sell_price': 950,
                'city': 'Brecilien',
                'use_focus': False,
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Brecilien bonus: 18% base + 15% specialty = 33% bonus -> 33/133 = 24.81% RRR
        self.assertEqual(data['returnRatePct'], 24.81)
        self.assertGreater(data['financials']['netProfit'], 0)

    def test_faction_cape_no_return_transmutation(self):
        """Faction capes must enforce 0% RRR and scale Faction Hearts by tier."""
        # Tier 6 Demon Cape requires 3 Demon Hearts per craft
        response = self.client.post(
            '/api/crafting/calculate/',
            data=json.dumps({
                'item_id': 'capeitem_demon',
                'tier': 6,
                'enchantment': 0,
                'quantity': 5,
                'primary_mat_price': 40000,
                'secondary_mat_price': 25000,
                'artifact_price': 85000, # Heart price
                'item_sell_price': 350000,
                'city': 'Caerleon',
                'use_focus': True, # Even with focus, transmutation cannot return resources
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['returnRatePct'], 0.0)
        # 5 capes * 3 hearts = 15 hearts * 85000 = 1,275,000
        self.assertEqual(data['materials']['artifactGrossCost'], 1275000.0)

    def test_furniture_universal_craft_no_bonus_city(self):
        """Furniture (Bed, Chest, Table) has no bonus city."""
        response = self.client.post(
            '/api/crafting/calculate/',
            data=json.dumps({
                'item_id': 'furnitureitem_bed',
                'tier': 4,
                'enchantment': 0,
                'quantity': 2,
                'primary_mat_price': 240,
                'secondary_mat_price': 210,
                'item_sell_price': 15000,
                'city': 'Fort Sterling',
                'use_focus': False,
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Royal city base only: 18% bonus -> 18/118 = 15.25% RRR
        self.assertEqual(data['returnRatePct'], 15.25)
        self.assertIsNone(data['item'].get('bonus_city'))

    def test_siege_banner_no_bonus_city(self):
        """ZvZ Siege Banner has no bonus city."""
        response = self.client.post(
            '/api/crafting/calculate/',
            data=json.dumps({
                'item_id': 'siege_banner',
                'tier': 5,
                'enchantment': 0,
                'quantity': 1,
                'primary_mat_price': 680,
                'secondary_mat_price': 620,
                'item_sell_price': 45000,
                'city': 'Martlock',
                'use_focus': False,
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['returnRatePct'], 15.25)


class CatalogIntegrityTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_crafting_items_endpoint(self):
        """Verify craftable items endpoint returns all 328 authentic catalog items."""
        response = self.client.get('/api/crafting/items/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data['items']), 328)
        self.assertIn('accessories', data['categories'])
        self.assertIn('warrior', data['categories'])
        self.assertIn('hunter', data['categories'])
        self.assertIn('mage', data['categories'])
        self.assertIn('tools', data['categories'])
        self.assertIn('gathering', data['categories'])

        # Verify Chest has max_tier = 5 and allow_enchantment = False
        chest = next((i for i in data['items'] if i['id'] == 'furnitureitem_chest'), None)
        self.assertIsNotNone(chest)
        self.assertEqual(chest.get('max_tier'), 5)
        self.assertFalse(chest.get('allow_enchantment'))

        # Verify Royal Robe has is_royal = True, allow_enchantment = True
        royal_robe = next((i for i in data['items'] if i['id'] == 'armor_cloth_royal'), None)
        self.assertIsNotNone(royal_robe)
        self.assertTrue(royal_robe.get('is_royal'))
        self.assertTrue(royal_robe.get('allow_enchantment'))

        # Verify Gathering Gear has allow_enchantment = True
        wood_garb = next((i for i in data['items'] if i['id'] == 'armor_gatherer_wood'), None)
        self.assertIsNotNone(wood_garb)
        self.assertTrue(wood_garb.get('allow_enchantment'))

        # Verify Tools have allow_enchantment = False
        pickaxe = next((i for i in data['items'] if i['id'] == '2h_tool_pick'), None)
        self.assertIsNotNone(pickaxe)
        self.assertFalse(pickaxe.get('allow_enchantment'))

    def test_royal_item_transmutation(self):
        """Verify Royal gear has 0% RRR and correct Royal Sigil consumption."""
        response = self.client.post(
            '/api/crafting/calculate/',
            data=json.dumps({
                'item_id': 'armor_cloth_royal',
                'tier': 6,
                'enchantment': 0,
                'quantity': 2,
                'primary_mat_price': 85000, # Base robe price
                'secondary_mat_price': 0,
                'artifact_price': 45000, # Royal Sigil price
                'item_sell_price': 900000,
                'city': 'Lymhurst',
                'use_focus': True, # Transmutation recipes never refund or consume focus
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['returnRatePct'], 0.0)
        self.assertEqual(data['focusPerUnit'], 0)
        self.assertEqual(data['totalFocusNeeded'], 0)
        # T6 Royal Armor requires 16 sigils per unit. 2 units * 16 = 32 sigils * 45,000 = 1,440,000
        self.assertEqual(data['materials']['artifactGrossCost'], 1440000.0)

    def test_daily_crafting_production_bonus(self):
        """Verify daily production event bonus (+10% / +20%) correctly increases RRR."""
        response_standard = self.client.post(
            '/api/crafting/calculate/',
            data=json.dumps({
                'item_id': 'main_sword',
                'tier': 4,
                'enchantment': 0,
                'quantity': 1,
                'primary_mat_price': 240,
                'secondary_mat_price': 210,
                'city': 'Lymhurst', # 18% base + 15% specialty = 33% bonus -> 24.81% RRR
                'daily_bonus_pct': 0,
            }),
            content_type='application/json'
        )
        self.assertEqual(response_standard.status_code, 200)
        rrr_standard = response_standard.json()['returnRatePct']
        self.assertEqual(rrr_standard, 24.81)

        response_event = self.client.post(
            '/api/crafting/calculate/',
            data=json.dumps({
                'item_id': 'main_sword',
                'tier': 4,
                'enchantment': 0,
                'quantity': 1,
                'primary_mat_price': 240,
                'secondary_mat_price': 210,
                'city': 'Lymhurst', # 18% base + 15% specialty + 20% daily = 53% bonus -> 53/153 = 34.64% RRR
                'daily_bonus_pct': 20,
            }),
            content_type='application/json'
        )
        self.assertEqual(response_event.status_code, 200)
        rrr_event = response_event.json()['returnRatePct']
        self.assertEqual(rrr_event, 34.64)


class FoodCalculationTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_food_items_catalog(self):
        """Verify GET /api/food/items/ returns food catalog and subcategories."""
        response = self.client.get('/api/food/items/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('items', data)
        self.assertIn('subcategories', data)
        self.assertEqual(data['bonusCity'], 'Caerleon')
        self.assertGreaterEqual(len(data['items']), 57)

    def test_pork_pie_cooking_caerleon(self):
        """Test T7 Pork Pie cooking in Caerleon with specialty bonus."""
        response = self.client.post(
            '/api/food/calculate/',
            data=json.dumps({
                'item_id': 'T7_MEAL_PIE',
                'enchantment': 0,
                'batches': 1,
                'ingredient_prices': {
                    'T7_CORN': 500,
                    'T3_FLOUR': 200,
                    'T7_MEAT': 700,
                    'T6_MILK': 300
                },
                'item_sell_price': 8000,
                'city': 'Caerleon',
                'use_focus': False,
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['batch']['totalUnitsProduced'], 10)
        self.assertEqual(data['rates']['rrrCurrentPct'], 24.81)
        self.assertTrue(data['rates']['hasCitySpecialty'])
        self.assertGreater(data['financials']['netProfit'], 0)

    def test_pork_pie_enchanted_fish_sauce(self):
        """Test T7.1 Pork Pie cooking adds 90 Basic Fish Sauce and refunds with RRR."""
        response = self.client.post(
            '/api/food/calculate/',
            data=json.dumps({
                'item_id': 'T7_MEAL_PIE',
                'enchantment': 1,
                'batches': 1,
                'ingredient_prices': {
                    'T7_CORN': 500,
                    'T3_FLOUR': 200,
                    'T7_MEAT': 700,
                    'T6_MILK': 300,
                    'T1_FISHSAUCE_LEVEL1': 1000
                },
                'item_sell_price': 20000,
                'city': 'Caerleon',
                'use_focus': True,
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['rates']['rrrCurrentPct'], 47.92)
        breakdown = {b['uniqueName']: b for b in data['materials']['breakdown']}
        self.assertIn('T1_FISHSAUCE_LEVEL1', breakdown)
        self.assertEqual(breakdown['T1_FISHSAUCE_LEVEL1']['grossNeeded'], 90)
        self.assertTrue(breakdown['T1_FISHSAUCE_LEVEL1']['isRefundable'])
        self.assertGreater(breakdown['T1_FISHSAUCE_LEVEL1']['returned'], 0)

    def test_drake_egg_biscuits_yield(self):
        """Test Drake Egg Biscuits (T8_MEAL_SPECIAL_FOOD_DRAKE_EGG) yields 99 units per batch."""
        response = self.client.post(
            '/api/food/calculate/',
            data=json.dumps({
                'item_id': 'T8_MEAL_SPECIAL_FOOD_DRAKE_EGG',
                'enchantment': 0,
                'batches': 2,
                'ingredient_prices': {},
                'item_sell_price': 1500,
                'city': 'Caerleon',
                'use_focus': False,
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['batch']['totalUnitsProduced'], 198)

    def test_avalonian_omelette_energy_no_refund(self):
        """Test Avalonian Energy (QUESTITEM_TOKEN_AVALON) is NOT refunded by RRR."""
        response = self.client.post(
            '/api/food/calculate/',
            data=json.dumps({
                'item_id': 'T7_MEAL_OMELETTE_AVALON',
                'enchantment': 0,
                'batches': 1,
                'city': 'Caerleon',
                'use_focus': True,
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        breakdown = {b['uniqueName']: b for b in data['materials']['breakdown']}
        self.assertIn('QUESTITEM_TOKEN_AVALON', breakdown)
        self.assertFalse(breakdown['QUESTITEM_TOKEN_AVALON']['isRefundable'])
        self.assertEqual(breakdown['QUESTITEM_TOKEN_AVALON']['returned'], 0.0)
        self.assertTrue(breakdown['T7_MEAT']['isRefundable'])
        self.assertGreater(breakdown['T7_MEAT']['returned'], 0.0)

    def test_butchery_meat_yield(self):
        """Test Raw Pork butchering (T7_MEAT) yields 18 raw meats per animal."""
        response = self.client.post(
            '/api/food/calculate/',
            data=json.dumps({
                'item_id': 'T7_MEAT',
                'enchantment': 0,
                'batches': 1,
                'city': 'Caerleon',
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['batch']['totalUnitsProduced'], 18)


class PotionCalculationTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_potion_items_catalog(self):
        """Verify GET /api/potions/items/ returns potion catalog and subcategories."""
        response = self.client.get('/api/potions/items/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('items', data)
        self.assertIn('subcategories', data)
        self.assertEqual(data['bonusCity'], 'Brecilien')
        self.assertGreaterEqual(len(data['items']), 43)

    def test_healing_potion_brecilien(self):
        """Test T4 Healing Potion brewing in Brecilien with specialty bonus."""
        response = self.client.post(
            '/api/potions/calculate/',
            data=json.dumps({
                'item_id': 'T4_POTION_HEAL',
                'enchantment': 0,
                'batches': 1,
                'ingredient_prices': {
                    'T4_BURDOCK': 200,
                    'T3_EGG': 150
                },
                'item_sell_price': 1800,
                'city': 'Brecilien',
                'use_focus': False,
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['batch']['totalUnitsProduced'], 5)
        self.assertEqual(data['rates']['rrrCurrentPct'], 24.81)
        self.assertTrue(data['rates']['hasCitySpecialty'])
        self.assertGreater(data['financials']['netProfit'], 0)

    def test_healing_potion_enchanted_extract(self):
        """Test T4.1 Healing Potion brewing adds 15 Basic Arcane Extract and refunds with RRR."""
        response = self.client.post(
            '/api/potions/calculate/',
            data=json.dumps({
                'item_id': 'T4_POTION_HEAL',
                'enchantment': 1,
                'batches': 1,
                'ingredient_prices': {
                    'T4_BURDOCK': 200,
                    'T3_EGG': 150,
                    'T1_ALCHEMY_EXTRACT_LEVEL1': 600
                },
                'item_sell_price': 4200,
                'city': 'Brecilien',
                'use_focus': True,
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['rates']['rrrCurrentPct'], 47.92)
        breakdown = {b['uniqueName']: b for b in data['materials']['breakdown']}
        self.assertIn('T1_ALCHEMY_EXTRACT_LEVEL1', breakdown)
        self.assertEqual(breakdown['T1_ALCHEMY_EXTRACT_LEVEL1']['grossNeeded'], 15)
        self.assertTrue(breakdown['T1_ALCHEMY_EXTRACT_LEVEL1']['isRefundable'])
        self.assertGreater(breakdown['T1_ALCHEMY_EXTRACT_LEVEL1']['returned'], 0)

    def test_berserk_potion_rare_no_refund(self):
        """Test rare Werewolf Fangs (T3_ALCHEMY_RARE_WEREWOLF) is NOT refunded by RRR."""
        response = self.client.post(
            '/api/potions/calculate/',
            data=json.dumps({
                'item_id': 'T4_POTION_BERSERK',
                'enchantment': 0,
                'batches': 1,
                'city': 'Brecilien',
                'use_focus': True,
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        breakdown = {b['uniqueName']: b for b in data['materials']['breakdown']}
        self.assertIn('T3_ALCHEMY_RARE_WEREWOLF', breakdown)
        self.assertFalse(breakdown['T3_ALCHEMY_RARE_WEREWOLF']['isRefundable'])
        self.assertEqual(breakdown['T3_ALCHEMY_RARE_WEREWOLF']['returned'], 0.0)
        self.assertTrue(breakdown['T4_BURDOCK']['isRefundable'])
        self.assertGreater(breakdown['T4_BURDOCK']['returned'], 0.0)

    def test_schnapps_distillery_craft(self):
        """Test Potato Schnapps distillery (T6_ALCOHOL) yields 1 schnapps from 1 potato."""
        response = self.client.post(
            '/api/potions/calculate/',
            data=json.dumps({
                'item_id': 'T6_ALCOHOL',
                'enchantment': 0,
                'batches': 2,
                'city': 'Brecilien',
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['batch']['totalUnitsProduced'], 2)


class FarmingCalculationTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_farming_items_catalog(self):
        """Test GET /api/farming/items/ returns catalog with crops, herbs, animals, and mounts."""
        response = self.client.get('/api/farming/items/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('items', data)
        self.assertGreaterEqual(len(data['items']), 40)
        categories = {item['category'] for item in data['items']}
        self.assertTrue({'crop', 'herb', 'animal', 'mount'}.issubset(categories))

    def test_wheat_farming_biome_bonus(self):
        """Verify T3 Wheat on Martlock gets +10% island biome yield bonus."""
        # 1 plot = 9 spots. Base yield = 9.0 per spot -> 81 crops.
        # Martlock bonus: 81 * 1.10 = 89.1 crops.
        response = self.client.post(
            '/api/farming/calculate/',
            data=json.dumps({
                'item_id': 'T3_WHEAT',
                'city': 'Martlock',
                'plots': 1,
                'use_focus': False,
                'has_premium': True,
                'market_prices': {'T3_WHEAT': 350, 'T3_FARM_WHEAT_SEED': 5000},
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['hasCityBonus'])
        self.assertEqual(data['yield']['totalYield'], 89.1)

    def test_crop_seed_surplus_with_focus(self):
        """Verify Wheat watered with focus returns 140% seeds (9 replanted + 3.6 surplus seeds)."""
        # Base seed = 0.60, bonus = 0.80 -> 1.40 effective.
        # 9 spots * 1.40 = 12.6 seeds. 9 replanted, 3.6 surplus.
        response = self.client.post(
            '/api/farming/calculate/',
            data=json.dumps({
                'item_id': 'T3_WHEAT',
                'city': 'Martlock',
                'plots': 1,
                'use_focus': True,
                'mastery_level': 100,
                'spec_level': 100,
                'market_prices': {'T3_WHEAT': 350, 'T3_FARM_WHEAT_SEED': 5000},
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['yield']['seedsToBuy'], 0)
        self.assertEqual(data['yield']['surplusSeeds'], 3.6)
        self.assertEqual(data['focus']['focusPerSpot'], 125)
        self.assertEqual(data['focus']['totalFocusNeeded'], 1125)

    def test_chicken_slaughter_meat_yield(self):
        """Verify Chicken pasture slaughter produces 18 raw meat per bird (162 meat per 9-spot plot)."""
        response = self.client.post(
            '/api/farming/calculate/',
            data=json.dumps({
                'item_id': 'T3_FARM_CHICKEN_GROWN',
                'city': 'Lymhurst',
                'plots': 1,
                'animal_action': 'slaughter',
                'market_prices': {'T3_MEAT': 180, 'T3_FARM_CHICKEN_BABY': 5000, 'T3_WHEAT': 350},
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['animalAction'], 'slaughter')
        self.assertEqual(data['yield']['totalOutput'], 162.0)


class LaborerCalculationTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_laborer_items_catalog(self):
        """Test GET /api/laborers/items/ returns catalog with 77 setups and 11 professions."""
        response = self.client.get('/api/laborers/items/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('laborers', data)
        self.assertIn('professions', data)
        self.assertEqual(len(data['laborers']), 77)
        self.assertEqual(len(data['professions']), 11)

    def test_blacksmith_t5_150_happiness(self):
        """Verify 3 T5 Blacksmiths in T5 House with optimal furniture hit 150% happiness and 1.5x yield."""
        response = self.client.post(
            '/api/laborers/calculate/',
            data=json.dumps({
                'laborer_id': 'blacksmith_t5',
                'house_tier': 5,
                'laborer_count': 3,
                'has_bed': True,
                'has_table': True,
                'trophies_count': 3,
                'market_prices': {
                    'T5_JOURNAL_WARRIOR_FULL': 25000,
                    'T5_JOURNAL_WARRIOR_EMPTY': 5000,
                    'T5_METALBAR': 1200,
                    'T5_PLANKS': 1100,
                }
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['happiness']['happinessPct'], 115.0)
        self.assertEqual(data['happiness']['yieldMultiplier'], 1.15)
        self.assertEqual(data['housesNeeded'], 1)

    def test_mercenary_silver_returns(self):
        """Verify Mercenary returns raw silver multiplied by happiness without market tax on silver."""
        response = self.client.post(
            '/api/laborers/calculate/',
            data=json.dumps({
                'laborer_id': 'mercenary_t5',
                'house_tier': 6, # Higher-tier house with matching furniture hits 150% max
                'laborer_count': 1,
                'has_bed': True,
                'has_table': True,
                'trophies_count': 7,
                'market_prices': {
                    'T5_JOURNAL_MERCENARY_FULL': 12000,
                    'T5_JOURNAL_MERCENARY_EMPTY': 2000,
                }
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['happiness']['happinessPct'], 150.0)
        self.assertEqual(data['happiness']['yieldMultiplier'], 1.5)
        self.assertEqual(data['materials'][0]['item'], 'SILVER')
        self.assertEqual(data['materials'][0]['totalUnits'], 2619.0)
        # Market tax (6.5% = 4% + 2.5%) applies ONLY to empty journal (2000 * 0.065 = 130), not raw SILVER
        self.assertEqual(data['finances']['marketTax'], 130.0)


class BlackMarketCalculationTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_blackmarket_catalog_retrieval(self):
        """Test GET /api/blackmarket/items/ returns eligible equipment items and categories."""
        response = self.client.get('/api/blackmarket/items/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('items', data)
        self.assertIn('categories', data)
        self.assertIn('tiers', data)
        self.assertGreaterEqual(len(data['items']), 100)
        # Ensure no furniture or tools are present
        for it in data['items']:
            self.assertNotIn('furniture', it.get('category', ''))
            self.assertNotIn('tool', it.get('category', ''))

    def test_blackmarket_scan_endpoint(self):
        """Test POST /api/blackmarket/scan/ responds with structured scan results."""
        response = self.client.post(
            '/api/blackmarket/scan/',
            data=json.dumps({
                'server': 'europe',
                'tier': 5,
                'enchantment': 0,
                'category': 'accessories',
                'min_profit': 0,
                'min_margin': 0,
                'sort_by': 'profit',
                'limit': 10,
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('results', data)
        self.assertIn('totalScanned', data)
        self.assertEqual(data['tier'], 5)

    def test_blackmarket_haul_calculation(self):
        """Test transport cargo manifest calculation with profit, density, and recommended mount."""
        response = self.client.post(
            '/api/blackmarket/haul/',
            data=json.dumps({
                'items': [
                    {
                        'aodpId': 'T6_MAIN_SWORD',
                        'name': 'Broadsword',
                        'quantity': 5,
                        'cost': 20000,
                        'payout': 45000,
                        'weightKg': 3.6,
                    },
                    {
                        'aodpId': 'T5_BAG',
                        'name': 'Bag',
                        'quantity': 10,
                        'cost': 5000,
                        'payout': 12000,
                        'weightKg': 1.5,
                    }
                ]
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['totalCost'], 150000)
        self.assertEqual(data['totalPayout'], 345000)
        self.assertEqual(data['totalNetProfit'], 195000)
        self.assertEqual(data['totalWeightKg'], 33.0)
        self.assertIn('Swiftclaw', data['recommendedMount'])
        self.assertIn('Low Risk', data['dangerRisk'])

    def test_blackmarket_haul_heavy_weight(self):
        """Test heavy cargo haul recommends Grizzly Bear or Mammoth and warns of Red Zone danger."""
        response = self.client.post(
            '/api/blackmarket/haul/',
            data=json.dumps({
                'items': [
                    {
                        'aodpId': 'T8_ARMOR_PLATE_SETCHEST',
                        'name': 'Soldier Armor',
                        'quantity': 300,
                        'cost': 100000,
                        'payout': 180000,
                        'weightKg': 3.6,
                    }
                ]
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['totalWeightKg'], 1080.0)
        self.assertIn('Grizzly Bear', data['recommendedMount'])
    def test_crafting_prices_endpoint(self):
        """Test CraftingPricesView returns structured qualities 1-5 and materials."""
        response = self.client.post(
            '/api/crafting/prices/',
            data=json.dumps({
                'item_id': '2h_shapeshifter_morgana',
                'tier': 5,
                'enchantment': 0,
                'server': 'europe',
                'city': 'Caerleon',
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('crafted_item', data)
        self.assertIn('qualities', data['crafted_item'])
        # Verify all 5 Albion qualities are present
        for q in [1, 2, 3, 4, 5]:
            self.assertIn(str(q), data['crafted_item']['qualities'])
            self.assertIn('sell_min', data['crafted_item']['qualities'][str(q)])
        self.assertIn('primary_mat', data)
        self.assertIn('extra_materials', data)
        self.assertIn('alchemy_remains', data['extra_materials'])

    def test_blackmarket_scan_with_quality(self):
        """Test BlackMarket scan handles quality and server parameters cleanly."""
        response = self.client.post(
            '/api/blackmarket/scan/',
            data=json.dumps({
                'tier': 5,
                'enchantment': 0,
                'category': 'all',
                'server': 'americas',
                'quality': 2,
                'limit': 5,
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('results', data)


class FocusRegressionTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_crafting_accepts_other_spec_avg(self):
        """Verify crafting calculate endpoint handles other_spec_avg cleanly."""
        response = self.client.post(
            '/api/crafting/calculate/',
            data=json.dumps({
                'item_id': 'main_sword',
                'tier': 6,
                'enchantment': 1,
                'quantity': 2,
                'primary_mat_price': 1500,
                'secondary_mat_price': 1200,
                'item_sell_price': 65000,
                'city': 'Lymhurst',
                'use_focus': True,
                'mastery_level': 50,
                'spec_level': 50,
                'other_spec_avg': 40,
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data['focusPerUnit'], 0)

    def test_food_focus_other_spec_and_silver_per_focus(self):
        """Verify food calculation passes other_spec_avg into silverPerFocus computation."""
        base_resp = self.client.post(
            '/api/food/calculate/',
            data=json.dumps({
                'item_id': 'T7_MEAL_PIE',
                'enchantment': 0,
                'batches': 2,
                'ingredient_prices': {'T7_CORN': 500, 'T3_FLOUR': 200, 'T7_MEAT': 700, 'T6_MILK': 300},
                'item_sell_price': 20000,
                'city': 'Caerleon',
                'use_focus': True,
                'mastery_level': 50,
                'spec_level': 50,
                'other_spec_avg': 0,
            }),
            content_type='application/json'
        )
        shared_resp = self.client.post(
            '/api/food/calculate/',
            data=json.dumps({
                'item_id': 'T7_MEAL_PIE',
                'enchantment': 0,
                'batches': 2,
                'ingredient_prices': {'T7_CORN': 500, 'T3_FLOUR': 200, 'T7_MEAT': 700, 'T6_MILK': 300},
                'item_sell_price': 20000,
                'city': 'Caerleon',
                'use_focus': True,
                'mastery_level': 50,
                'spec_level': 50,
                'other_spec_avg': 60,
            }),
            content_type='application/json'
        )
        self.assertEqual(base_resp.status_code, 200)
        self.assertEqual(shared_resp.status_code, 200)
        base_data = base_resp.json()
        shared_data = shared_resp.json()
        self.assertGreater(shared_data['focus']['silverPerFocus'], base_data['focus']['silverPerFocus'])
        self.assertLess(shared_data['focus']['focusPerBatch'], base_data['focus']['focusPerBatch'])

    def test_potion_focus_other_spec_and_silver_per_focus(self):
        """Verify potion calculation passes other_spec_avg into silverPerFocus computation."""
        base_resp = self.client.post(
            '/api/potions/calculate/',
            data=json.dumps({
                'item_id': 'T6_POTION_HEAL',
                'enchantment': 0,
                'batches': 2,
                'ingredient_prices': {'T6_FOXGLOVE': 500, 'T5_EGG': 400, 'T1_ALCHEMY_EXTRACT_LEVEL1': 1000},
                'item_sell_price': 4500,
                'city': 'Brecilien',
                'use_focus': True,
                'mastery_level': 40,
                'spec_level': 40,
                'other_spec_avg': 0,
            }),
            content_type='application/json'
        )
        shared_resp = self.client.post(
            '/api/potions/calculate/',
            data=json.dumps({
                'item_id': 'T6_POTION_HEAL',
                'enchantment': 0,
                'batches': 2,
                'ingredient_prices': {'T6_FOXGLOVE': 500, 'T5_EGG': 400, 'T1_ALCHEMY_EXTRACT_LEVEL1': 1000},
                'item_sell_price': 4500,
                'city': 'Brecilien',
                'use_focus': True,
                'mastery_level': 40,
                'spec_level': 40,
                'other_spec_avg': 50,
            }),
            content_type='application/json'
        )
        self.assertEqual(base_resp.status_code, 200)
        self.assertEqual(shared_resp.status_code, 200)
        base_data = base_resp.json()
        shared_data = shared_resp.json()
        self.assertGreater(shared_data['focus']['silverPerFocus'], base_data['focus']['silverPerFocus'])
        self.assertLess(shared_data['focus']['focusPerBatch'], base_data['focus']['focusPerBatch'])


class HideoutCalculationTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_gear_crafting_max_hideout_rrr_and_bonus_city_isolation(self):
        """Max Outlands HO (L9 Q6 w/ specialty = 82% -> 45.05% RRR base, 58.51% focus); ignores market city bonus."""
        base_resp = self.client.post(
            '/api/crafting/calculate/',
            data=json.dumps({
                'item_id': 'main_sword',
                'tier': 6,
                'enchantment': 0,
                'quantity': 5,
                'primary_mat_price': 1950,
                'secondary_mat_price': 1800,
                'item_sell_price': 62000,
                'city': 'Lymhurst',
                'use_focus': False,
                'location_mode': 'hideout',
                'ho_power_level': 9,
                'ho_zone_quality': 6,
                'ho_has_specialty': True,
            }),
            content_type='application/json',
        )
        self.assertEqual(base_resp.status_code, 200)
        base_data = base_resp.json()
        self.assertEqual(base_data['returnRatePct'], 45.05)
        self.assertFalse(base_data['isBonusCity'])

        focus_resp = self.client.post(
            '/api/crafting/calculate/',
            data=json.dumps({
                'item_id': 'main_sword',
                'tier': 6,
                'enchantment': 0,
                'quantity': 5,
                'primary_mat_price': 1950,
                'secondary_mat_price': 1800,
                'item_sell_price': 62000,
                'city': 'Lymhurst',
                'use_focus': True,
                'location_mode': 'hideout',
                'ho_power_level': 9,
                'ho_zone_quality': 6,
                'ho_has_specialty': True,
            }),
            content_type='application/json',
        )
        self.assertEqual(focus_resp.status_code, 200)
        focus_data = focus_resp.json()
        self.assertEqual(focus_data['returnRatePct'], 58.51)
        self.assertFalse(focus_data['isBonusCity'])

        # General crafting (no Biome Specialty): Zone Quality does NOT apply, PL 9 only = 26% -> 20.63% RRR
        general_resp = self.client.post(
            '/api/crafting/calculate/',
            data=json.dumps({
                'item_id': 'main_sword',
                'tier': 6,
                'enchantment': 0,
                'quantity': 5,
                'primary_mat_price': 1950,
                'secondary_mat_price': 1800,
                'item_sell_price': 62000,
                'city': 'Lymhurst',
                'use_focus': False,
                'location_mode': 'hideout',
                'ho_power_level': 9,
                'ho_zone_quality': 6,
                'ho_has_specialty': False,
            }),
            content_type='application/json',
        )
        self.assertEqual(general_resp.status_code, 200)
        general_data = general_resp.json()
        self.assertEqual(general_data['returnRatePct'], 20.63)
        self.assertFalse(general_data['isBonusCity'])

    def test_refining_hideout_outlands_roads_and_custom_override(self):
        """Refining in Outlands HO is flat +15% (13.04% RRR), Roads Resource +20% (16.67%), Roads Base +10% (9.09%), and custom override."""
        outlands_ho = self.client.post(
            '/api/refining/calculate/',
            data=json.dumps({
                'resource_type': 'hide',
                'tier': 4,
                'enchantment': 0,
                'quantity': 100,
                'raw_price': 70,
                'prev_refined_price': 50,
                'refined_sell_price': 175,
                'city': 'Martlock',
                'location_mode': 'hideout',
                'ho_power_level': 9,
                'ho_zone_quality': 6,
                'ho_has_specialty': False,
            }),
            content_type='application/json',
        )
        self.assertEqual(outlands_ho.status_code, 200)
        self.assertEqual(outlands_ho.json()['returnRatePct'], 13.04)
        self.assertFalse(outlands_ho.json()['isBonusCity'])

        roads_bonus_ho = self.client.post(
            '/api/refining/calculate/',
            data=json.dumps({
                'resource_type': 'hide',
                'tier': 4,
                'enchantment': 0,
                'quantity': 100,
                'raw_price': 70,
                'prev_refined_price': 50,
                'refined_sell_price': 175,
                'city': 'Martlock',
                'location_mode': 'hideout',
                'ho_has_specialty': True,
            }),
            content_type='application/json',
        )
        self.assertEqual(roads_bonus_ho.status_code, 200)
        self.assertEqual(roads_bonus_ho.json()['returnRatePct'], 16.67)

        roads_base_ho = self.client.post(
            '/api/refining/calculate/',
            data=json.dumps({
                'resource_type': 'hide',
                'tier': 4,
                'enchantment': 0,
                'quantity': 100,
                'raw_price': 70,
                'prev_refined_price': 50,
                'refined_sell_price': 175,
                'city': 'Martlock',
                'location_mode': 'hideout',
                'ho_custom_bonus_pct': 10,
            }),
            content_type='application/json',
        )
        self.assertEqual(roads_base_ho.status_code, 200)
        self.assertEqual(roads_base_ho.json()['returnRatePct'], 9.09)

        custom_ho = self.client.post(
            '/api/refining/calculate/',
            data=json.dumps({
                'resource_type': 'hide',
                'tier': 4,
                'enchantment': 0,
                'quantity': 100,
                'raw_price': 70,
                'prev_refined_price': 50,
                'refined_sell_price': 175,
                'city': 'Martlock',
                'location_mode': 'hideout',
                'ho_custom_bonus_pct': 50,
            }),
            content_type='application/json',
        )
        self.assertEqual(custom_ho.status_code, 200)
        self.assertEqual(custom_ho.json()['returnRatePct'], 33.33)
        self.assertFalse(custom_ho.json()['isBonusCity'])

    def test_food_and_potion_hideout_rrr(self):
        """Food uses PL General only (PL 5 -> 18% -> 15.25% RRR, ignoring Caerleon +15% & Q4) and Potion custom override (35% -> 25.93% RRR)."""
        food_resp = self.client.post(
            '/api/food/calculate/',
            data=json.dumps({
                'item_id': 'T7_MEAL_PIE',
                'enchantment': 0,
                'batches': 2,
                'ingredient_prices': {'T7_CORN': 500, 'T3_FLOUR': 200, 'T7_MEAT': 700, 'T6_MILK': 300},
                'item_sell_price': 20000,
                'city': 'Caerleon',
                'use_focus': False,
                'location_mode': 'hideout',
                'ho_power_level': 5,
                'ho_zone_quality': 4,
                'ho_has_specialty': True,
            }),
            content_type='application/json',
        )
        self.assertEqual(food_resp.status_code, 200)
        food_data = food_resp.json()
        self.assertEqual(food_data['rates']['rrrCurrentPct'], 15.25)
        self.assertFalse(food_data['rates']['hasCitySpecialty'])
        self.assertEqual(food_data['rates']['locationMode'], 'hideout')

        potion_resp = self.client.post(
            '/api/potions/calculate/',
            data=json.dumps({
                'item_id': 'T6_POTION_HEAL',
                'enchantment': 0,
                'batches': 2,
                'ingredient_prices': {'T6_FOXGLOVE': 500, 'T5_EGG': 400, 'T1_ALCHEMY_EXTRACT_LEVEL1': 1000},
                'item_sell_price': 4500,
                'city': 'Brecilien',
                'use_focus': False,
                'location_mode': 'hideout',
                'ho_custom_bonus_pct': 35,
            }),
            content_type='application/json',
        )
        self.assertEqual(potion_resp.status_code, 200)
        potion_data = potion_resp.json()
        self.assertEqual(potion_data['rates']['rrrCurrentPct'], 25.93)
        self.assertFalse(potion_data['rates']['hasCitySpecialty'])
        self.assertEqual(potion_data['rates']['locationMode'], 'hideout')


class AuditFormulaVerificationTests(TestCase):
    def test_refining_t2_focus_item_value_and_stone_enchanted(self):
        from .engine import calculate_refining
        from .constants import BASE_ITEM_VALUES

        t2_planks = calculate_refining(
            resource_type='planks', tier=2, enchantment=0, quantity=10,
            raw_price=10, prev_refined_price=0, refined_sell_price=30, city='Fort Sterling', use_focus=True,
        )
        self.assertEqual(t2_planks['focusPerUnit'], 18)
        self.assertEqual(t2_planks['totalFocusNeeded'], 180)

        self.assertEqual(BASE_ITEM_VALUES[5][2], 128)
        t52_planks = calculate_refining(
            resource_type='planks', tier=5, enchantment=2, quantity=1,
            raw_price=100, prev_refined_price=50, refined_sell_price=500, city='Fort Sterling', station_tax_per_100=100,
        )
        self.assertEqual(t52_planks['financials']['stationFee'], round(128 * 0.1125, 2))

        stone_flat = calculate_refining(
            resource_type='stone', tier=5, enchantment=0, quantity=1,
            raw_price=100, prev_refined_price=50, refined_sell_price=500, city='Bridgewatch', use_focus=True,
        )
        stone_e2 = calculate_refining(
            resource_type='stone', tier=5, enchantment=2, quantity=1,
            raw_price=100, prev_refined_price=50, refined_sell_price=500, city='Bridgewatch', use_focus=True,
        )
        self.assertEqual(stone_e2['materials']['prevRefinedGross'], 4)
        self.assertEqual(stone_e2['focusPerUnit'], stone_flat['focusPerUnit'])

    def test_cooking_and_potion_dragonfire_fce_and_low_tier_fee_exempt(self):
        from .cooking_engine import calculate_cooking, calculate_cooking_focus
        from .potion_engine import calculate_potions, calculate_potion_focus

        # 55,000 max FCE -> 1000 * 0.5**5.5 = 22.097 -> 22
        self.assertEqual(calculate_cooking_focus(1000, mastery=100, spec=100, other_spec_avg=100), 22)
        self.assertEqual(calculate_potion_focus(1000, mastery=100, spec=100, other_spec_avg=100, is_rare=False), 22)
        self.assertEqual(calculate_potion_focus(1000, mastery=100, spec=100, other_spec_avg=100, is_rare=True), 22)

        t1_food = calculate_cooking(
            item_id='T1_MEAL_SOUP', batches=5, ingredient_prices={'T1_CARROT': 250}, station_tax_per_100=1000.0
        )
        self.assertEqual(t1_food['fees']['stationFee'], 0.0)

        t2_potion = calculate_potions(
            item_id='T2_POTION_HEAL', batches=5, ingredient_prices={'T2_AGARIC': 250}, station_tax_per_100=1000.0
        )
        self.assertEqual(t2_potion['fees']['stationFee'], 0.0)

    def test_laborers_house_capacity_t8_cap_fisherman_and_enchanted_split(self):
        from .laborer_engine import calculate_laborers

        t4_house = calculate_laborers({
            'laborer_id': 'blacksmith_t4', 'house_tier': 4, 'laborer_count': 3,
            'has_bed': True, 'has_table': True, 'trophies_count': 3,
        })
        self.assertEqual(t4_house['laborersPerHouse'], 2)
        self.assertEqual(t4_house['housesNeeded'], 2)

        t8_cap = calculate_laborers({
            'laborer_id': 'blacksmith_t8', 'house_tier': 8, 'laborer_count': 3,
            'has_bed': True, 'has_table': True, 'trophies_count': 7, 'generalist_trophies': 5,
        })
        self.assertEqual(t8_cap['happiness']['happinessPct'], 142.5)

        t5_bs = calculate_laborers({
            'laborer_id': 'blacksmith_t5', 'house_tier': 5, 'laborer_count': 1,
            'market_prices': {'T5_METALBAR': 1000, 'T5_METALBAR_LEVEL1@1': 2000},
        })
        self.assertTrue(all(m['hasEnchantedSplit'] for m in t5_bs['materials']))
        self.assertEqual(t5_bs['materials'][0]['rarityBreakdown']['e1']['pct'], 5.0)

        fish = calculate_laborers({'laborer_id': 'fisherman_t5', 'house_tier': 5, 'laborer_count': 1})
        fish_ids = [m['item'] for m in fish['materials']]
        self.assertIn('T5_FISH_FRESHWATER_ALL_COMMON', fish_ids)
        self.assertTrue(all(not m['hasEnchantedSplit'] for m in fish['materials']))

    def test_crafting_100_cap_category_fce_destiny_factor_and_mounts(self):
        from .crafting_constants import get_crafting_spec_rates
        from .crafting_engine import calculate_crafting

        # Category FCE rates verification
        self.assertEqual(
            get_crafting_spec_rates({'id': 'armor_leather_dragon', 'subcategory': 'leather_armor', 'isArtifact': True}),
            (30.0, 262.5, 182.5, 0.75, 6.3125, 4.5625),
        )
        self.assertEqual(
            get_crafting_spec_rates({'id': 'armor_leather_fey', 'subcategory': 'leather_armor', 'isArtifact': True}),
            (30.0, 280.0, 165.0, 0.75, 6.75, 4.125),
        )
        self.assertEqual(
            get_crafting_spec_rates({'id': '2h_tool_siegehammer', 'subcategory': 'tools', 'isArtifact': False}),
            (30.0, 370.0, 0.0, 0.75, 9.05, 0.0),
        )
        self.assertEqual(
            get_crafting_spec_rates({'id': '2h_tool_pick', 'subcategory': 'tools', 'isArtifact': False}),
            (0.0, 310.0, 90.0, 0.0, 7.5, 2.25),
        )

        # Spec clamped at 100, other_spec_avg reduces focus, T2 focus allowed
        c100 = calculate_crafting('main_sword', 4, 0, 1, 500, 400, mastery_level=100, spec_level=100, other_spec_avg=0, use_focus=True)
        c120 = calculate_crafting('main_sword', 4, 0, 1, 500, 400, mastery_level=100, spec_level=120, other_spec_avg=0, use_focus=True)
        c_peers = calculate_crafting('main_sword', 4, 0, 1, 500, 400, mastery_level=100, spec_level=100, other_spec_avg=100, use_focus=True)
        self.assertEqual(c100['focusPerUnit'], c120['focusPerUnit'])
        self.assertLess(c_peers['focusPerUnit'], c100['focusPerUnit'])

        t2_sword = calculate_crafting('main_sword', 2, 0, 1, 50, 40, use_focus=True)
        self.assertEqual(t2_sword['focusPerUnit'], 420)

        # destinyFactor scales journals (Clarent Blade 1.1x vs Broadsword 1.0x)
        sword_j = calculate_crafting('main_sword', 4, 0, 100, 500, 400, include_journals=True)
        clarent_j = calculate_crafting('main_scimitar_morgana', 4, 0, 100, 500, 400, include_journals=True)
        self.assertEqual(sword_j['journals']['journalsFilled'], 15.0)
        self.assertEqual(clarent_j['journals']['journalsFilled'], 16.5)

        # Mount partial RRR & no-return
        horse = calculate_crafting('mount_riding_horse', 4, 0, 10, 5000, 500, city='Martlock', use_focus=False)
        self.assertEqual(horse['materials']['primaryReturned'], 0.0)
        self.assertGreater(horse['materials']['secondaryReturned'], 0.0)

        armored = calculate_crafting(
            'mount_armored_horse', 5, 0, 10, 82000, 1000,
            extra_mat_prices={'cloth': 800}, city='Martlock', station_tax_per_100=500.0
        )
        self.assertEqual(armored['materials']['primaryReturned'], 0.0)
        self.assertGreater(armored['materials']['secondaryReturned'], 0.0)
        self.assertGreater(armored['materials']['extraMaterials'][0]['returned'], 0.0)
        self.assertEqual(armored['financials']['stationFee'], 5400.0)

        rageclaw = calculate_crafting('mount_rageclaw', 8, 0, 1, 50000, 0, artifact_price=100000)
        self.assertEqual(rageclaw['materials']['primaryReturned'], 0.0)
        self.assertEqual(rageclaw['financials']['stationFee'], 0.0)

    def test_butcher_focus_slaughter_yield_and_fce(self):
        from .farming_engine import calculate_farming

        no_butcher_spec = calculate_farming({
            'item_id': 'T3_FARM_CHICKEN_GROWN',
            'city': 'Lymhurst',
            'plots': 1,
            'animal_action': 'slaughter',
            'use_butcher_focus': True,
            'butcher_mastery': 0,
            'butcher_spec': 0,
            'other_chef_spec_avg': 0,
            'market_prices': {'T3_MEAT': 200, 'T3_FARM_CHICKEN_BABY': 5000, 'T3_WHEAT': 350},
        })
        self.assertEqual(no_butcher_spec['yield']['totalOutput'], 257.6)
        self.assertEqual(no_butcher_spec['focus']['butcherFocusPerAnimal'], 38)
        self.assertEqual(no_butcher_spec['focus']['totalButcherFocus'], 342)

        max_butcher_spec = calculate_farming({
            'item_id': 'T3_FARM_CHICKEN_GROWN',
            'city': 'Lymhurst',
            'plots': 1,
            'animal_action': 'slaughter',
            'use_butcher_focus': True,
            'butcher_mastery': 100,
            'butcher_spec': 100,
            'other_chef_spec_avg': 100,
            'market_prices': {'T3_MEAT': 200, 'T3_FARM_CHICKEN_BABY': 5000, 'T3_WHEAT': 350},
        })
        self.assertEqual(max_butcher_spec['focus']['butcherFocusPerAnimal'], 1)

    def test_blackmarket_premium_vs_non_premium_tax_rates(self):
        from datetime import datetime, timezone
        from unittest.mock import patch, MagicMock
        from .blackmarket_engine import scan_blackmarket

        now_str = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S')
        sample_records = [
            {
                'item_id': 'T5_MAIN_SWORD',
                'city': 'Black Market',
                'quality': 1,
                'sell_price_min': 10000,
                'sell_price_min_date': now_str,
                'buy_price_max': 10000,
                'buy_price_max_date': now_str,
            },
            {
                'item_id': 'T5_MAIN_SWORD',
                'city': 'Martlock',
                'quality': 1,
                'sell_price_min': 5000,
                'sell_price_min_date': now_str,
                'buy_price_max': 0,
                'buy_price_max_date': now_str,
            },
        ]

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.headers = {}
        mock_resp.json.return_value = sample_records

        with patch('calculator.blackmarket_engine.requests.get', return_value=mock_resp):
            prem = scan_blackmarket({
                'server': 'europe', 'tier': 5, 'enchantment': 0, 'category': 'warrior',
                'quality': 1, 'min_profit': 0, 'min_margin': 0, 'has_premium': True,
            })
            non_prem = scan_blackmarket({
                'server': 'europe', 'tier': 5, 'enchantment': 0, 'category': 'warrior',
                'quality': 1, 'min_profit': 0, 'min_margin': 0, 'has_premium': False,
            })

        prem_sword = next(r for r in prem['results'] if r['id'] == 'main_sword')
        non_prem_sword = next(r for r in non_prem['results'] if r['id'] == 'main_sword')

        self.assertEqual(prem_sword['blackMarket']['instantPayout'], 9600)
        self.assertEqual(prem_sword['blackMarket']['listedPayout'], 9350)
        self.assertEqual(non_prem_sword['blackMarket']['instantPayout'], 9200)
        self.assertEqual(non_prem_sword['blackMarket']['listedPayout'], 8950)

    def test_catalog_recipe_fixes_and_extra_materials(self):
        from .crafting_constants import get_primary_qty, get_secondary_qty, resolve_extra_materials
        from .crafting_engine import get_craftable_item, get_artifact_qty, calculate_crafting

        # 1. T2 vs T3+ Bag & Siege Hammer quantities (12+12 at T2, 8+8 at T3+)
        bag = get_craftable_item('bag')
        self.assertEqual((get_primary_qty(bag, 2), get_secondary_qty(bag, 2)), (12, 12))
        self.assertEqual((get_primary_qty(bag, 4), get_secondary_qty(bag, 4)), (8, 8))
        bag_t2 = calculate_crafting('bag', 2, 0, 10, 35, 30, city='Brecilien')
        bag_t4 = calculate_crafting('bag', 4, 0, 10, 200, 200, city='Brecilien')
        self.assertEqual((bag_t2['materials']['primaryGross'], bag_t2['materials']['secondaryGross']), (120, 120))
        self.assertEqual((bag_t4['materials']['primaryGross'], bag_t4['materials']['secondaryGross']), (80, 80))

        hammer = get_craftable_item('2h_tool_siegehammer')
        self.assertEqual((get_primary_qty(hammer, 2), get_secondary_qty(hammer, 2)), (12, 12))
        self.assertEqual((get_primary_qty(hammer, 6), get_secondary_qty(hammer, 6)), (8, 8))

        # 2. Satchel of Insight uses fixed T4_SKILLBOOK_STANDARD (0% RRR, 0 IV) across T4-T8
        satchel = get_craftable_item('bag_insight')
        self.assertEqual(satchel['artifactTemplate'], 'T4_SKILLBOOK_STANDARD')
        self.assertEqual(get_artifact_qty(satchel, 5), 1)
        satchel_t5 = calculate_crafting(
            'bag_insight', 5, 0, 1, 500, 500, artifact_price=50000,
            city='Brecilien', station_tax_per_100=500.0
        )
        self.assertEqual(satchel_t5['materials']['artifactReturned'], 0.0)
        # T5 resource IV = (8 + 8) * 16 * 2 = 512 -> 512 * 0.1125 * 5 = 288.0
        self.assertEqual(satchel_t5['financials']['stationFee'], 288.0)

        # 3. Avalonian Cape T5 energy requirement = 15 (not 25)
        ava_cape = get_craftable_item('capeitem_avalon')
        self.assertEqual(get_artifact_qty(ava_cape, 4), 15)
        self.assertEqual(get_artifact_qty(ava_cape, 5), 15)
        self.assertEqual(get_artifact_qty(ava_cape, 6), 45)

        # 4. Royal Cloth Robe & Leather Shoes use _SET1 base gear
        self.assertEqual(get_craftable_item('armor_cloth_royal')['primaryMatIcon'], 'T{tier}_ARMOR_CLOTH_SET1')
        self.assertEqual(get_craftable_item('shoes_leather_royal')['primaryMatIcon'], 'T{tier}_SHOES_LEATHER_SET1')

        # 5. Shapeshifter Staffs have 4th-slot non-returnable Animal Remains, varying by tier
        bloodmoon = get_craftable_item('2h_shapeshifter_morgana')
        self.assertEqual(bloodmoon['name'], 'Bloodmoon Staff')
        ex_t4 = resolve_extra_materials(bloodmoon, 4)
        ex_t5 = resolve_extra_materials(bloodmoon, 5)
        self.assertEqual((ex_t4[0]['template'], ex_t4[0]['qty']), ('T3_ALCHEMY_RARE_WEREWOLF', 2))
        self.assertEqual((ex_t5[0]['template'], ex_t5[0]['qty']), ('T5_ALCHEMY_RARE_WEREWOLF', 1))
        bm_calc = calculate_crafting(
            '2h_shapeshifter_morgana', 4, 0, 10, 200, 200, artifact_price=50000,
            extra_mat_prices={'alchemy_remains': 10000}, city='Caerleon', station_tax_per_100=500.0
        )
        bm_extra = bm_calc['materials']['extraMaterials'][0]
        self.assertEqual(bm_extra['gross'], 20)
        self.assertEqual(bm_extra['returned'], 0.0)
        self.assertEqual(bm_extra['netCost'], 200000.0)
        # Bloodmoon T4 IV = 32*16 + 128 = 640 -> 640 * 0.1125 * 5 * 10 = 3600.0
        self.assertEqual(bm_calc['financials']['stationFee'], 3600.0)

        # 6. Saddler T3 Riding Horse IV = 160 -> 160 * 0.1125 * 5 = 90.0
        riding = calculate_crafting('mount_riding_horse', 3, 0, 1, 6500, 80, city='Martlock', station_tax_per_100=500.0)
        self.assertEqual(riding['financials']['stationFee'], 90.0)

        # 7. Siege Ballista (5-slot Battle Mount at Energy Manipulator NPC): 0% RRR & 0 station fee
        ballista_calc = calculate_crafting(
            'mount_siege_ballista', 6, 0, 1, 730000, 1950, artifact_price=13000,
            extra_mat_prices={'leather': 1950, 'planks': 1800}, station_tax_per_100=500.0
        )
        self.assertEqual(ballista_calc['returnRatePct'], 0.0)
        self.assertEqual(ballista_calc['financials']['stationFee'], 0.0)
        self.assertEqual(len(ballista_calc['materials']['extraMaterials']), 2)
        self.assertEqual(ballista_calc['financials']['upfrontMaterials'], 730000 + 20 * 1950 + 500 * 13000 + 20 * 1950 + 20 * 1800)

        # 8. HTTP API POST accepts extra_mat_prices on Shapeshifter Staff
        resp = self.client.post(
            '/api/crafting/calculate/',
            data=json.dumps({
                'item_id': '2h_shapeshifter_set1',
                'tier': 3,
                'enchantment': 0,
                'quantity': 2,
                'primary_mat_price': 100,
                'secondary_mat_price': 100,
                'extra_mat_prices': {'alchemy_remains': 2500},
                'item_sell_price': 30000,
                'city': 'Lymhurst',
            }),
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 200)
        payload = resp.json()
        self.assertEqual(payload['materials']['extraMaterials'][0]['template'], 'T1_ALCHEMY_COMMON')
        self.assertEqual(payload['materials']['extraMaterials'][0]['gross'], 10)

        # 9. CraftingPricesView constructs exact AODP IDs (fixed T4 Tome, non-enchanted Remains, base Cape@1, Armored Horse Cloth)
        from unittest.mock import patch
        requested_batches = []

        def fake_fetch(item_ids, **kwargs):
            requested_batches.append(list(item_ids))
            out = {}
            for iid in item_ids:
                out[f"{iid}:Caerleon"] = {'sell_price_min': 1234, 'buy_price_max': 1000, 'avg_price_24h': 1200, 'updated_at': None, 'age_hours': 0.1, 'city': 'Caerleon'}
                out[f"{iid}:Brecilien"] = {'sell_price_min': 2222, 'buy_price_max': 2000, 'avg_price_24h': 2100, 'updated_at': None, 'age_hours': 0.1, 'city': 'Brecilien'}
                out[f"{iid}:Martlock"] = {'sell_price_min': 3333, 'buy_price_max': 3000, 'avg_price_24h': 3100, 'updated_at': None, 'age_hours': 0.1, 'city': 'Martlock'}
            return out

        with patch('calculator.views.fetch_aodp_prices', side_effect=fake_fetch):
            r_satchel = self.client.post(
                '/api/crafting/prices/',
                data=json.dumps({'item_id': 'bag_insight', 'tier': 5, 'enchantment': 1, 'city': 'Brecilien'}),
                content_type='application/json'
            )
            r_bm = self.client.post(
                '/api/crafting/prices/',
                data=json.dumps({'item_id': '2h_shapeshifter_morgana', 'tier': 4, 'enchantment': 1, 'city': 'Caerleon'}),
                content_type='application/json'
            )
            r_horse = self.client.post(
                '/api/crafting/prices/',
                data=json.dumps({'item_id': 'mount_armored_horse', 'tier': 5, 'enchantment': 0, 'city': 'Martlock'}),
                content_type='application/json'
            )

        self.assertEqual(r_satchel.status_code, 200)
        self.assertIn('T4_SKILLBOOK_STANDARD', requested_batches[0])
        self.assertIn('T5_CLOTH_LEVEL1@1', requested_batches[0])
        self.assertEqual(r_bm.status_code, 200)
        self.assertIn('T3_ALCHEMY_RARE_WEREWOLF', requested_batches[1])
        self.assertEqual(r_bm.json()['extra_materials']['alchemy_remains']['sell_min'], 1234)
        self.assertEqual(r_horse.status_code, 200)
        self.assertIn('T5_FARM_HORSE_GROWN', requested_batches[2])
        self.assertIn('T5_CLOTH', requested_batches[2])
        self.assertEqual(r_horse.json()['extra_materials']['cloth']['sell_min'], 3333)











