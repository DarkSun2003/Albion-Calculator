import FARMING_ITEMS_DATA from '../data/farmingItems.json';

export const FARMING_ITEMS = FARMING_ITEMS_DATA;

export const FARMING_CATEGORIES = [
  { id: 'all', label: 'All Agriculture', icon: 'Sparkles', desc: 'Overview of all farm plots' },
  { id: 'crop', label: 'Crops & Fields', icon: 'Wheat', desc: 'Vegetables & grains on farm plots' },
  { id: 'herb', label: 'Herb Gardens', icon: 'Leaf', desc: 'Alchemical herbs on garden plots' },
  { id: 'animal', label: 'Livestock Pastures', icon: 'Egg', desc: 'Farm animals for milk, eggs & meat' },
  { id: 'mount', label: 'Mount Kennels', icon: 'Horse', desc: 'Foals, cubs & pups raised into mounts' },
];

export const ISLAND_BONUSES = {
  Martlock: {
    crops: ['Wheat (T3)', 'Potato (T6)'],
    herbs: ['Elusive Foxglove (T6)'],
    animals: ['Cow / Beef / Milk (T8)'],
    color: 'text-sky-400 bg-sky-950/30 border-sky-600/40'
  },
  Lymhurst: {
    crops: ['Carrot (T1)', 'Pumpkin (T8)'],
    herbs: ['Crenellated Burdock (T4)'],
    animals: ['Goose / Goose Meat / Eggs (T5)'],
    color: 'text-emerald-400 bg-emerald-950/30 border-emerald-600/40'
  },
  Thetford: {
    crops: ['Cabbage (T5)'],
    herbs: ['Arcane Agaric (T2)', 'Firetouched Mullein (T7)'],
    animals: ['Pig / Pork (T7)'],
    color: 'text-purple-400 bg-purple-950/30 border-purple-600/40'
  },
  FortSterling: {
    crops: ['Turnip (T4)'],
    herbs: ['Ghoul Yarrow (T8)'],
    animals: ['Chicken / Eggs (T3)', 'Sheep / Mutton / Milk (T6)'],
    color: 'text-slate-200 bg-slate-800/40 border-slate-500/40'
  },
  Bridgewatch: {
    crops: ['Bean (T2)', 'Corn (T7)'],
    herbs: ['Dragon Teasel (T5)'],
    animals: ['Goat / Goat Meat / Milk (T4)'],
    color: 'text-amber-400 bg-amber-950/30 border-amber-600/40'
  },
  Caerleon: {
    crops: [],
    herbs: ['Brightleaf Comfrey (T3)'],
    animals: [],
    color: 'text-red-400 bg-red-950/30 border-red-600/40'
  },
  Brecilien: {
    crops: [],
    herbs: [],
    animals: [],
    color: 'text-teal-400 bg-teal-950/30 border-teal-600/40'
  }
};

/**
 * Authoritative default baseline market prices across all Albion Online agricultural commodities.
 * Used when real-time AODP prices are pending or unavailable, eliminating 0s and fallback discrepancies.
 */
export const DEFAULT_FARMING_PRICES = {
  // Crops & Seeds
  T1_CARROT: 280,
  T1_FARM_CARROT_SEED: 2000,
  T2_BEAN: 310,
  T2_FARM_BEAN_SEED: 3000,
  T3_WHEAT: 350,
  T3_FARM_WHEAT_SEED: 5000,
  T4_TURNIP: 420,
  T4_FARM_TURNIP_SEED: 7500,
  T5_CABBAGE: 520,
  T5_FARM_CABBAGE_SEED: 10000,
  T6_POTATO: 650,
  T6_FARM_POTATO_SEED: 15000,
  T7_CORN: 780,
  T7_FARM_CORN_SEED: 22500,
  T8_PUMPKIN: 950,
  T8_FARM_PUMPKIN_SEED: 30000,

  // Herbs & Seeds
  T2_AGARIC: 320,
  T2_FARM_AGARIC_SEED: 3000,
  T3_COMFREY: 360,
  T3_FARM_COMFREY_SEED: 5000,
  T4_BURDOCK: 430,
  T4_FARM_BURDOCK_SEED: 7500,
  T5_TEASEL: 530,
  T5_FARM_TEASEL_SEED: 10000,
  T6_FOXGLOVE: 660,
  T6_FARM_FOXGLOVE_SEED: 15000,
  T7_MULLEIN: 790,
  T7_FARM_MULLEIN_SEED: 22500,
  T8_YARROW: 980,
  T8_FARM_YARROW_SEED: 30000,

  // Animal Produce (Eggs & Milk)
  T3_EGG: 310,
  T4_MILK: 420,
  T5_EGG: 540,
  T6_MILK: 680,
  T8_MILK: 850,

  // Raw Meat
  T3_MEAT: 190,
  T4_MEAT: 260,
  T5_MEAT: 340,
  T6_MEAT: 440,
  T7_MEAT: 560,
  T8_MEAT: 750,

  // Baby Animals
  T3_FARM_CHICKEN_BABY: 5000,
  T4_FARM_GOAT_BABY: 7500,
  T5_FARM_GOOSE_BABY: 10000,
  T6_FARM_SHEEP_BABY: 15000,
  T7_FARM_PIG_BABY: 22500,
  T8_FARM_COW_BABY: 45000,

  // Grown Pasture Animals
  T3_FARM_CHICKEN_GROWN: 6500,
  T4_FARM_GOAT_GROWN: 10000,
  T5_FARM_GOOSE_GROWN: 14000,
  T6_FARM_SHEEP_GROWN: 21000,
  T7_FARM_PIG_GROWN: 30000,
  T8_FARM_COW_GROWN: 48000,

  // Mount Babies
  T3_FARM_HORSE_BABY: 25000,
  T4_FARM_HORSE_BABY: 75000,
  T5_FARM_HORSE_BABY: 225000,
  T6_FARM_HORSE_BABY: 675000,
  T7_FARM_HORSE_BABY: 2025000,
  T8_FARM_HORSE_BABY: 6075000,
  T3_FARM_OX_BABY: 25000,
  T4_FARM_OX_BABY: 75000,
  T5_FARM_OX_BABY: 225000,
  T6_FARM_OX_BABY: 675000,
  T7_FARM_OX_BABY: 2025000,
  T8_FARM_OX_BABY: 6075000,
  T4_FARM_GIANTSTAG_BABY: 65000,
  T5_FARM_COUGAR_BABY: 110000,
  T6_FARM_DIREWOLF_BABY: 310000,
  T6_FARM_GIANTSTAG_MOOSE_BABY: 450000,
  T7_FARM_DIREBOAR_BABY: 950000,
  T7_FARM_SWAMPDRAGON_BABY: 1200000,
  T8_FARM_DIREBEAR_BABY: 2800000,
  T8_FARM_MAMMOTH_BABY: 95000000,
  T8_FARM_RABBIT_EASTER_BABY: 18000000,
  T8_FARM_RABBIT_EASTER_DARK_BABY: 25000000,
  T8_FARM_RABBIT_EASTER_BABY_DARK: 25000000,
  T8_FARM_DRAKE_BABY: 35000000,
  T5_FARM_BEAR_BABY: 140000,
  T5_FARM_DIREBEAR_FW_FORTSTERLING_BABY: 140000,
  T8_FARM_BEAR_ELITE_BABY: 3500000,
  T8_FARM_DIREBEAR_FW_FORTSTERLING_BABY: 3500000,
  T5_FARM_BOAR_BABY: 140000,
  T5_FARM_DIREBOAR_FW_LYMHURST_BABY: 140000,
  T8_FARM_BOAR_ELITE_BABY: 3500000,
  T8_FARM_DIREBOAR_FW_LYMHURST_BABY: 3500000,
  T5_FARM_RAM_BABY: 140000,
  T5_FARM_RAM_FW_MARTLOCK_BABY: 140000,
  T8_FARM_RAM_ELITE_BABY: 3500000,
  T8_FARM_RAM_FW_MARTLOCK_BABY: 3500000,
  T5_FARM_MOABIRD_BABY: 140000,
  T5_FARM_MOABIRD_FW_BRIDGEWATCH_BABY: 140000,
  T8_FARM_MOABIRD_ELITE_BABY: 3500000,
  T8_FARM_MOABIRD_FW_BRIDGEWATCH_BABY: 3500000,
  T5_FARM_SALAMANDER_BABY: 140000,
  T5_FARM_SWAMPDRAGON_FW_THETFORD_BABY: 140000,
  T8_FARM_SALAMANDER_ELITE_BABY: 3500000,
  T8_FARM_SWAMPDRAGON_FW_THETFORD_BABY: 3500000,
  T5_FARM_WOLF_BABY: 140000,
  T5_FARM_GREYWOLF_FW_CAERLEON_BABY: 140000,
  T8_FARM_WOLF_ELITE_BABY: 3500000,
  T8_FARM_GREYWOLF_FW_CAERLEON_BABY: 3500000,

  // Grown Mount Animals (Before Saddling)
  T3_FARM_HORSE_GROWN: 28000,
  T4_FARM_HORSE_GROWN: 82000,
  T5_FARM_HORSE_GROWN: 245000,
  T6_FARM_HORSE_GROWN: 730000,
  T7_FARM_HORSE_GROWN: 2180000,
  T8_FARM_HORSE_GROWN: 6450000,
  T3_FARM_OX_GROWN: 28000,
  T4_FARM_OX_GROWN: 82000,
  T5_FARM_OX_GROWN: 245000,
  T6_FARM_OX_GROWN: 730000,
  T7_FARM_OX_GROWN: 2180000,
  T8_FARM_OX_GROWN: 6450000,
  T4_FARM_GIANTSTAG_GROWN: 85000,
  T5_FARM_COUGAR_GROWN: 150000,
  T6_FARM_DIREWOLF_GROWN: 380000,
  T6_FARM_GIANTSTAG_MOOSE_GROWN: 520000,
  T7_FARM_DIREBOAR_GROWN: 1100000,
  T7_FARM_SWAMPDRAGON_GROWN: 1400000,
  T8_FARM_DIREBEAR_GROWN: 3200000,
  T8_FARM_MAMMOTH_GROWN: 105000000,
  T8_FARM_RABBIT_EASTER_GROWN: 22000000,
  T8_FARM_RABBIT_EASTER_DARK_GROWN: 30000000,
  T8_FARM_RABBIT_EASTER_GROWN_DARK: 30000000,
  T8_FARM_DRAKE_GROWN: 42000000,
  T5_FARM_BEAR_GROWN: 180000,
  T5_FARM_DIREBEAR_FW_FORTSTERLING_GROWN: 180000,
  T8_FARM_BEAR_ELITE_GROWN: 4200000,
  T8_FARM_DIREBEAR_FW_FORTSTERLING_GROWN: 4200000,
  T5_FARM_BOAR_GROWN: 180000,
  T5_FARM_DIREBOAR_FW_LYMHURST_GROWN: 180000,
  T8_FARM_BOAR_ELITE_GROWN: 4200000,
  T8_FARM_DIREBOAR_FW_LYMHURST_GROWN: 4200000,
  T5_FARM_RAM_GROWN: 180000,
  T5_FARM_RAM_FW_MARTLOCK_GROWN: 180000,
  T8_FARM_RAM_ELITE_GROWN: 4200000,
  T8_FARM_RAM_FW_MARTLOCK_GROWN: 4200000,
  T5_FARM_MOABIRD_GROWN: 180000,
  T5_FARM_MOABIRD_FW_BRIDGEWATCH_GROWN: 180000,
  T8_FARM_MOABIRD_ELITE_GROWN: 4200000,
  T8_FARM_MOABIRD_FW_BRIDGEWATCH_GROWN: 4200000,
  T5_FARM_SALAMANDER_GROWN: 180000,
  T5_FARM_SWAMPDRAGON_FW_THETFORD_GROWN: 180000,
  T8_FARM_SALAMANDER_ELITE_GROWN: 4200000,
  T8_FARM_SWAMPDRAGON_FW_THETFORD_GROWN: 4200000,
  T5_FARM_WOLF_GROWN: 180000,
  T5_FARM_GREYWOLF_FW_CAERLEON_GROWN: 180000,
  T8_FARM_WOLF_ELITE_GROWN: 4200000,
  T8_FARM_GREYWOLF_FW_CAERLEON_GROWN: 4200000,

  // Saddled Mounts
  T3_MOUNT_HORSE: 36000,
  T4_MOUNT_HORSE: 98000,
  T5_MOUNT_HORSE: 280000,
  T6_MOUNT_HORSE: 820000,
  T7_MOUNT_HORSE: 2400000,
  T8_MOUNT_HORSE: 7200000,
  T3_MOUNT_OX: 36000,
  T4_MOUNT_OX: 98000,
  T5_MOUNT_OX: 280000,
  T6_MOUNT_OX: 820000,
  T7_MOUNT_OX: 2400000,
  T8_MOUNT_OX: 7200000,
  T4_MOUNT_GIANTSTAG: 110000,
  T5_MOUNT_COUGAR_KEEPER: 180000,
  T6_MOUNT_DIREWOLF: 450000,
  T6_MOUNT_GIANTSTAG_MOOSE: 650000,
  T7_MOUNT_DIREBOAR: 1350000,
  T7_MOUNT_SWAMPDRAGON: 1700000,
  T8_MOUNT_DIREBEAR: 3900000,
  T8_MOUNT_MAMMOTH_TRANSPORT: 125000000,
  T8_MOUNT_RABBIT_EASTER: 28000000,
  T8_MOUNT_RABBIT_EASTER_DARK: 38000000,
  T8_MOUNT_DRAKE: 55000000,
  T8_MOUNT_DRAKE_FIRE: 55000000,
  T5_MOUNT_ARMORED_BEAR_FORTSTERLING: 240000,
  T5_MOUNT_DIREBEAR_FW_FORTSTERLING: 240000,
  T8_MOUNT_ARMORED_BEAR_FORTSTERLING_ELITE: 5500000,
  T8_MOUNT_DIREBEAR_FW_FORTSTERLING_ELITE: 5500000,
  T5_MOUNT_ARMORED_BOAR_LYMHURST: 240000,
  T5_MOUNT_DIREBOAR_FW_LYMHURST: 240000,
  T8_MOUNT_ARMORED_BOAR_LYMHURST_ELITE: 5500000,
  T8_MOUNT_DIREBOAR_FW_LYMHURST_ELITE: 5500000,
  T5_MOUNT_ARMORED_RAM_MARTLOCK: 240000,
  T5_MOUNT_RAM_FW_MARTLOCK: 240000,
  T8_MOUNT_ARMORED_RAM_MARTLOCK_ELITE: 5500000,
  T8_MOUNT_RAM_FW_MARTLOCK_ELITE: 5500000,
  T5_MOUNT_ARMORED_MOABIRD_BRIDGEWATCH: 240000,
  T5_MOUNT_MOABIRD_FW_BRIDGEWATCH: 240000,
  T8_MOUNT_ARMORED_MOABIRD_BRIDGEWATCH_ELITE: 5500000,
  T8_MOUNT_MOABIRD_FW_BRIDGEWATCH_ELITE: 5500000,
  T5_MOUNT_ARMORED_SALAMANDER_THETFORD: 240000,
  T5_MOUNT_SWAMPDRAGON_FW_THETFORD: 240000,
  T8_MOUNT_ARMORED_SALAMANDER_THETFORD_ELITE: 5500000,
  T8_MOUNT_SWAMPDRAGON_FW_THETFORD_ELITE: 5500000,
  T5_MOUNT_ARMORED_WOLF_CAERLEON: 240000,
  T5_MOUNT_GREYWOLF_FW_CAERLEON: 240000,
  T8_MOUNT_ARMORED_WOLF_CAERLEON_ELITE: 5500000,
  T8_MOUNT_GREYWOLF_FW_CAERLEON_ELITE: 5500000,

  // Saddling Raw Materials
  T3_LEATHER: 420,
  T4_LEATHER: 850,
  T5_LEATHER: 1750,
  T6_LEATHER: 4200,
  T7_LEATHER: 11000,
  T8_LEATHER: 29000,
  T3_PLANKS: 380,
  T4_PLANKS: 800,
  T5_PLANKS: 1650,
  T6_PLANKS: 3900,
  T7_PLANKS: 10500,
  T8_PLANKS: 27000,
};

/**
 * Resolves safe unit price with strict fallback to default baseline prices.
 */
export function getFarmingPrice(marketPrices, itemId, fallback = 350) {
  if (!itemId) return fallback;
  const userPrice = marketPrices && marketPrices[itemId];
  if (userPrice !== undefined && userPrice !== null && !isNaN(parseFloat(userPrice)) && parseFloat(userPrice) > 0) {
    return parseFloat(userPrice);
  }
  if (DEFAULT_FARMING_PRICES[itemId] !== undefined) {
    return DEFAULT_FARMING_PRICES[itemId];
  }
  return fallback;
}

/**
 * Client-side calculation engine for Farming & Agriculture.
 * Correctly accounts for Albion Online mechanics:
 * 1. Crops & Herbs: Premium doubles harvest (9 vs 4.5 avg), Biome city adds +10%, seeds return unwatered vs watered.
 * 2. Pasture Dairy/Egg Harvesting: ZERO baby repurchases! Recurring daily feed costs -> daily milk/eggs.
 * 3. Pasture Breeding & Slaughter: Baby purchase -> growth -> offspring nurture -> butcher for meat OR sell grown adult.
 * 4. Mount Kennels: Growth cycles scale by tier (T3: 22h, T4: 44h, T5: 66h, T6: 88h, T7: 110h, T8: 132h with Premium).
 *    Supports selling Grown Animals or Saddling them with refined leather/planks.
 */
export function computeFarming({
  itemId,
  city = 'Martlock',
  plots = 1,
  useFocus = false,
  hasPremium = true,
  isSellOrder = true,
  masteryLevel = 0,
  specLevel = 0,
  animalAction = 'produce', // 'produce' (milk/eggs), 'slaughter' (meat), or 'sell_grown' (adult animal)
  mountAction = 'grown', // 'grown' (sell grown animal) or 'saddled' (saddled riding mount)
  useFavoriteFood = true,
  marketPrices = {},
}) {
  const itemDef = FARMING_ITEMS.find((it) => it.id === itemId) || FARMING_ITEMS[0];
  const safePlots = Math.max(1, parseInt(plots) || 1);
  const totalSpots = safePlots * 9;

  const mLevel = Math.min(100, Math.max(0, parseInt(masteryLevel) || 0));
  const sLevel = Math.min(100, Math.max(0, parseInt(specLevel) || 0));

  // Focus formula: 50 pts/mastery + 250 pts/spec (125 focus at 100/100)
  const efficiencyPoints = (mLevel * 50) + (sLevel * 250);
  const focusPerSpot = Math.round((itemDef.baseFocus || 1000) * Math.pow(0.5, efficiencyPoints / 10000.0));
  const category = itemDef.category || 'crop';

  // Biome +10% bonus for favored local island city
  const bonusCity = itemDef.bonusCity;
  const hasCityBonus = Boolean(bonusCity && city && city.toLowerCase() === bonusCity.toLowerCase());
  const yieldMultiplier = hasCityBonus ? 1.10 : 1.0;

  const taxRate = (hasPremium ? 0.04 : 0.08) + (isSellOrder ? 0.025 : 0.0);

  // ==========================================
  // 1. CROPS & HERBS
  // ==========================================
  if (category === 'crop' || category === 'herb') {
    const totalFocusNeeded = useFocus ? focusPerSpot * totalSpots : 0;
    const cropPrice = getFarmingPrice(marketPrices, itemDef.id, 350);
    const seedPrice = getFarmingPrice(marketPrices, itemDef.seedId, itemDef.vendorSeedPrice || 2000);

    // Yield: Premium doubles base yield (9.0 avg with Premium, 4.5 without). Biome bonus adds +10%.
    const baseYieldPerSpot = hasPremium ? (itemDef.baseYield || 9.0) : ((itemDef.baseYield || 9.0) * 0.5);
    const totalYield = Math.round(totalSpots * baseYieldPerSpot * yieldMultiplier * 10) / 10;

    // Seed Return Chance (Independent of Premium status)
    const baseSeedRate = itemDef.baseSeedChance || 0.0;
    const bonusSeedRate = itemDef.bonusSeedChance || 0.0;
    const effectiveSeedRate = useFocus ? (baseSeedRate + bonusSeedRate) : baseSeedRate;

    const totalSeedsReturned = Math.round(totalSpots * effectiveSeedRate * 100) / 100;
    const seedsToBuy = totalSeedsReturned >= totalSpots ? 0 : Math.round((totalSpots - totalSeedsReturned) * 100) / 100;
    const surplusSeeds = totalSeedsReturned >= totalSpots ? Math.round((totalSeedsReturned - totalSpots) * 100) / 100 : 0;

    const seedExpense = Math.round(seedsToBuy * seedPrice);
    const cropRevenue = Math.round(totalYield * cropPrice);
    const surplusSeedRevenue = Math.round(surplusSeeds * seedPrice);
    const grossRevenue = cropRevenue + surplusSeedRevenue;

    const marketTax = Math.round(grossRevenue * taxRate);
    const netProfit = grossRevenue - marketTax - seedExpense;
    const profitMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 10000) / 100 : 0;
    const profitPerPlot = Math.round((netProfit / safePlots) * 100) / 100;

    // Silver per Focus: value of bonus seeds returned from watering
    const bonusSeeds = totalSpots * bonusSeedRate;
    const silverPerFocus = totalFocusNeeded > 0 ? Math.round(((bonusSeeds * seedPrice) / totalFocusNeeded) * 100) / 100 : 0;

    return {
      item: itemDef,
      plots: safePlots,
      totalSpots,
      city,
      hasCityBonus,
      bonusCity,
      hasPremium,
      useFocus,
      cycleDays: 1,
      growthHours: hasPremium ? 22 : 44,
      focus: {
        focusPerSpot,
        totalFocusNeeded,
        silverPerFocus,
      },
      yield: {
        totalYield,
        yieldPerSpot: Math.round((totalYield / totalSpots) * 100) / 100,
        seedsReturned: totalSeedsReturned,
        seedsToBuy,
        surplusSeeds,
      },
      finances: {
        cropRevenue,
        surplusSeedRevenue,
        grossRevenue,
        seedExpense,
        feedExpense: 0,
        marketTax,
        netProfit,
        profitMarginPct: profitMargin,
        profitPerPlot,
        dailyProfit: netProfit,
      }
    };
  }

  // ==========================================
  // 2. LIVESTOCK PASTURES
  // ==========================================
  else if (category === 'animal') {
    const babyPrice = getFarmingPrice(marketPrices, itemDef.babyId, itemDef.vendorBabyPrice || 5000);
    const prodPrice = itemDef.productId ? getFarmingPrice(marketPrices, itemDef.productId, 310) : 0;
    const meatPrice = itemDef.meatId ? getFarmingPrice(marketPrices, itemDef.meatId, 190) : 0;
    const grownPrice = getFarmingPrice(marketPrices, itemDef.id, DEFAULT_FARMING_PRICES[itemDef.id] || 10000);

    const favFoodId = itemDef.favoriteFood || 'T3_WHEAT';
    const feedUnitPrice = getFarmingPrice(marketPrices, favFoodId, 350);

    // Food per day: 10 regular crops or 5 favorite crops
    const feedPerSpot = useFavoriteFood ? 5 : 10;
    const totalFeedUnits = totalSpots * feedPerSpot;
    const feedExpense = Math.round(totalFeedUnits * feedUnitPrice);

    // Pigs do not produce milk/eggs; force slaughter or sell_grown
    const canProduce = Boolean(itemDef.productId);
    const activeAction = (!canProduce && animalAction === 'produce') ? 'slaughter' : animalAction;

    // MODE A: Daily Produce (Milk / Eggs)
    // Adult animals are permanent fixtures in the pasture! They do NOT get rebought every day.
    if (activeAction === 'produce') {
      const dailyYieldPerSpot = hasPremium ? (itemDef.productYieldPerDay || 9.5) : ((itemDef.productYieldPerDay || 9.5) * 0.5);
      const totalOutput = Math.round(totalSpots * dailyYieldPerSpot * yieldMultiplier * 10) / 10;
      const outputRevenue = Math.round(totalOutput * prodPrice);

      const grossRevenue = outputRevenue;
      const marketTax = Math.round(grossRevenue * taxRate);
      const netProfit = grossRevenue - marketTax - feedExpense;
      const profitMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 10000) / 100 : 0;
      const profitPerPlot = Math.round((netProfit / safePlots) * 100) / 100;

      return {
        item: itemDef,
        plots: safePlots,
        totalSpots,
        city,
        hasCityBonus,
        bonusCity,
        hasPremium,
        useFocus: false, // Focus is for young growth nurture, not milking adults
        animalAction: 'produce',
        cycleDays: 1,
        growthHours: hasPremium ? 22 : 44,
        focus: {
          focusPerSpot: 0,
          totalFocusNeeded: 0,
          silverPerFocus: 0,
        },
        yield: {
          outputName: itemDef.productName || 'Produce',
          outputIcon: itemDef.productIcon,
          totalOutput,
          feedUnits: totalFeedUnits,
          offspringReturned: 0,
          babiesToBuy: 0,
          surplusBabies: 0,
        },
        finances: {
          outputRevenue,
          surplusBabyRevenue: 0,
          grossRevenue,
          babyExpense: 0, // No baby cost for daily milking!
          feedExpense,
          marketTax,
          netProfit,
          profitMarginPct: profitMargin,
          profitPerPlot,
          dailyProfit: netProfit,
        }
      };
    }

    // MODE B: Breeding & Growth (Slaughter for Meat or Sell Grown Adults)
    const totalFocusNeeded = useFocus ? focusPerSpot * totalSpots : 0;
    const baseOffspring = itemDef.baseOffspringChance || 0.6;
    const bonusOffspring = itemDef.bonusOffspringChance || 0.8;
    const effectiveOffspring = useFocus ? (baseOffspring + bonusOffspring) : baseOffspring;

    const totalOffspring = Math.round(totalSpots * effectiveOffspring * 100) / 100;
    const babiesToBuy = totalOffspring >= totalSpots ? 0 : Math.round((totalSpots - totalOffspring) * 100) / 100;
    const surplusBabies = totalOffspring >= totalSpots ? Math.round((totalOffspring - totalSpots) * 100) / 100 : 0;
    const babyExpense = Math.round(babiesToBuy * babyPrice);
    const surplusBabyRevenue = Math.round(surplusBabies * babyPrice);

    let totalOutput = 0;
    let outputRevenue = 0;
    let outputName = '';
    let outputIcon = '';

    if (activeAction === 'sell_grown') {
      totalOutput = totalSpots;
      outputRevenue = Math.round(totalSpots * grownPrice);
      outputName = itemDef.name;
      outputIcon = itemDef.icon;
    } else {
      // Slaughter
      const meatYieldPerSpot = itemDef.meatYield || 18;
      totalOutput = Math.round(totalSpots * meatYieldPerSpot * yieldMultiplier * 10) / 10;
      outputRevenue = Math.round(totalOutput * meatPrice);
      outputName = itemDef.meatName || 'Raw Meat';
      outputIcon = itemDef.meatIcon;
    }

    const grossRevenue = outputRevenue + surplusBabyRevenue;
    const marketTax = Math.round(grossRevenue * taxRate);
    const totalExpenses = babyExpense + feedExpense;
    const netProfit = grossRevenue - marketTax - totalExpenses;
    const profitMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 10000) / 100 : 0;
    const profitPerPlot = Math.round((netProfit / safePlots) * 100) / 100;

    const silverPerFocus = totalFocusNeeded > 0 ? Math.round(((bonusOffspring * totalSpots * babyPrice) / totalFocusNeeded) * 100) / 100 : 0;

    return {
      item: itemDef,
      plots: safePlots,
      totalSpots,
      city,
      hasCityBonus,
      bonusCity,
      hasPremium,
      useFocus,
      animalAction: activeAction,
      cycleDays: 1,
      growthHours: hasPremium ? 22 : 44,
      focus: {
        focusPerSpot,
        totalFocusNeeded,
        silverPerFocus,
      },
      yield: {
        outputName,
        outputIcon,
        totalOutput,
        feedUnits: totalFeedUnits,
        offspringReturned: totalOffspring,
        babiesToBuy,
        surplusBabies,
      },
      finances: {
        outputRevenue,
        surplusBabyRevenue,
        grossRevenue,
        babyExpense,
        feedExpense,
        marketTax,
        netProfit,
        profitMarginPct: profitMargin,
        profitPerPlot,
        dailyProfit: netProfit,
      }
    };
  }

  // ==========================================
  // 3. MOUNT KENNELS
  // ==========================================
  else {
    const tier = itemDef.tier || 3;
    // Growth duration: T3 = 1 Albion day (22h with premium), T4 = 2 days (44h), T5 = 3 days (66h), T6 = 4 days, T7 = 5 days, T8 = 6 days
    const cycleDays = Math.max(1, tier - 2);
    const growthHours = cycleDays * (hasPremium ? 22 : 44);

    const totalFocusNeeded = useFocus ? focusPerSpot * totalSpots : 0;
    const babyPrice = getFarmingPrice(marketPrices, itemDef.babyId, DEFAULT_FARMING_PRICES[itemDef.babyId] || 25000);
    const grownPrice = getFarmingPrice(marketPrices, itemDef.id, DEFAULT_FARMING_PRICES[itemDef.id] || 30000);
    const mountPrice = getFarmingPrice(marketPrices, itemDef.mountId, DEFAULT_FARMING_PRICES[itemDef.mountId] || 45000);

    // Diet: Carnivores eat Raw Meat (T3_MEAT); Herbivores eat crops (T3_WHEAT)
    const isCarnivore = Boolean(
      itemDef.diet === 'meat' ||
      itemDef.id.includes('COUGAR') ||
      itemDef.id.includes('DIREWOLF') ||
      itemDef.id.includes('DIREBEAR') ||
      itemDef.id.includes('DRAKE') ||
      itemDef.id.includes('WOLF') ||
      itemDef.id.includes('BEAR') ||
      itemDef.id.includes('SALAMANDER')
    );
    const feedFoodId = isCarnivore ? 'T3_MEAT' : 'T3_WHEAT';
    const feedUnitPrice = getFarmingPrice(marketPrices, feedFoodId, isCarnivore ? 190 : 350);

    // Total feed: 10 units per spot per day across the full cycle
    const feedPerSpot = 10 * cycleDays;
    const totalFeedUnits = totalSpots * feedPerSpot;
    const feedExpense = Math.round(totalFeedUnits * feedUnitPrice);

    // Offspring Return Rate
    const baseOffspring = itemDef.baseOffspringChance || 0.0;
    const bonusOffspring = itemDef.bonusOffspringChance || 0.0;
    const effectiveOffspring = useFocus ? (baseOffspring + bonusOffspring) : baseOffspring;

    const totalOffspring = Math.round(totalSpots * effectiveOffspring * 100) / 100;
    const babiesToBuy = Math.round(Math.max(0, totalSpots - totalOffspring) * 100) / 100;
    const surplusBabies = Math.round(Math.max(0, totalOffspring - totalSpots) * 100) / 100;
    const babyExpense = Math.round(babiesToBuy * babyPrice);
    const surplusBabyRevenue = Math.round(surplusBabies * babyPrice);

    // Saddling materials if saddled mode selected
    let saddlingExpense = 0;
    let outputRevenue = 0;
    let outputName = itemDef.name;
    let outputIcon = itemDef.icon;

    if (mountAction === 'saddled' && itemDef.mountId) {
      // 20 refined materials (Planks for Ox, Leather for horses and beasts)
      const isOx = Boolean(itemDef.subcategory === 'ox' || itemDef.id.includes('OX'));
      const materialId = isOx ? `T${tier}_PLANKS` : `T${tier}_LEATHER`;
      const materialPrice = getFarmingPrice(marketPrices, materialId, DEFAULT_FARMING_PRICES[materialId] || 850);
      saddlingExpense = Math.round(totalSpots * 20 * materialPrice);

      outputRevenue = Math.round(totalSpots * mountPrice);
      outputName = itemDef.mountName || 'Saddled Mount';
      outputIcon = itemDef.mountIcon;
    } else {
      // Sell Grown Animal
      outputRevenue = Math.round(totalSpots * grownPrice);
      outputName = itemDef.name;
      outputIcon = itemDef.icon;
    }

    const grossRevenue = outputRevenue + surplusBabyRevenue;
    const marketTax = Math.round(grossRevenue * taxRate);
    const totalExpenses = babyExpense + feedExpense + saddlingExpense;
    const cycleNetProfit = grossRevenue - marketTax - totalExpenses;
    const profitMargin = grossRevenue > 0 ? Math.round((cycleNetProfit / grossRevenue) * 10000) / 100 : 0;
    const profitPerPlot = Math.round((cycleNetProfit / safePlots) * 100) / 100;
    const dailyProfit = Math.round(cycleNetProfit / cycleDays);

    const silverPerFocus = totalFocusNeeded > 0 ? Math.round(((bonusOffspring * totalSpots * babyPrice) / totalFocusNeeded) * 100) / 100 : 0;

    return {
      item: itemDef,
      plots: safePlots,
      totalSpots,
      city,
      hasCityBonus: false,
      bonusCity: null,
      hasPremium,
      useFocus,
      mountAction,
      cycleDays,
      growthHours,
      focus: {
        focusPerSpot,
        totalFocusNeeded,
        silverPerFocus,
      },
      yield: {
        outputName,
        outputIcon,
        totalOutput: totalSpots,
        totalMounts: totalSpots,
        feedUnits: totalFeedUnits,
        feedFoodName: isCarnivore ? 'Raw Meat' : 'Wheat/Crops',
        offspringReturned: totalOffspring,
        babiesToBuy,
        surplusBabies,
      },
      finances: {
        outputRevenue,
        mountRevenue: outputRevenue,
        surplusBabyRevenue,
        grossRevenue,
        babyExpense,
        feedExpense,
        saddlingExpense,
        marketTax,
        netProfit: cycleNetProfit,
        profitMarginPct: profitMargin,
        profitPerPlot,
        dailyProfit,
      }
    };
  }
}
