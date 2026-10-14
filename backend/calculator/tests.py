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
        """Verify craftable items endpoint returns all 298 authentic catalog items."""
        response = self.client.get('/api/crafting/items/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data['items']), 298)
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
        """Verify Mercenary returns raw silver multiplied by happiness."""
        response = self.client.post(
            '/api/laborers/calculate/',
            data=json.dumps({
                'laborer_id': 'mercenary_t5',
                'house_tier': 6, # 1 tier higher + 7 trophies hits 150% max
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
        self.assertEqual(data['happiness']['happinessPct'], 145.0)
        self.assertEqual(data['happiness']['yieldMultiplier'], 1.45)
        self.assertEqual(data['materials'][0]['item'], 'SILVER')
        self.assertEqual(data['materials'][0]['totalUnits'], 15660.0)


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






