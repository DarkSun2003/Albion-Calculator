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
 * Client-side calculation engine for Farming & Agriculture (offline fallback).
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
  animalAction = 'produce',
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
  const totalFocusNeeded = useFocus ? focusPerSpot * totalSpots : 0;

  // Island Biome +10% bonus
  const bonusCity = itemDef.bonusCity;
  const hasCityBonus = Boolean(bonusCity && city && city.toLowerCase() === bonusCity.toLowerCase());
  const yieldMultiplier = hasCityBonus ? 1.10 : 1.0;

  const taxRate = (hasPremium ? 0.04 : 0.08) + (isSellOrder ? 0.025 : 0.0);
  const category = itemDef.category || 'crop';

  if (category === 'crop' || category === 'herb') {
    const cropPrice = parseFloat(marketPrices[itemDef.id]) || 350;
    const seedPrice = parseFloat(marketPrices[itemDef.seedId]) || itemDef.vendorSeedPrice || 2000;

    const baseYieldPerSpot = hasPremium ? (itemDef.baseYield || 9.0) : ((itemDef.baseYield || 9.0) * 0.5);
    const totalYield = Math.round(totalSpots * baseYieldPerSpot * yieldMultiplier * 10) / 10;

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

    const unwateredSeedExp = Math.round(totalSpots * (1.0 - baseSeedRate) * seedPrice);
    const unwateredNet = Math.round((cropRevenue * (1.0 - taxRate)) - unwateredSeedExp);
    const silverPerFocus = totalFocusNeeded > 0 ? Math.round(((netProfit - unwateredNet) / totalFocusNeeded) * 100) / 100 : 0;

    return {
      item: itemDef,
      plots: safePlots,
      totalSpots,
      city,
      hasCityBonus,
      bonusCity,
      hasPremium,
      useFocus,
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
        marketTax,
        netProfit,
        profitMarginPct: profitMargin,
        profitPerPlot,
      }
    };
  } else if (category === 'animal') {
    const babyPrice = parseFloat(marketPrices[itemDef.babyId]) || itemDef.vendorBabyPrice || 5000;
    const prodPrice = itemDef.productId ? (parseFloat(marketPrices[itemDef.productId]) || 300) : 0;
    const meatPrice = itemDef.meatId ? (parseFloat(marketPrices[itemDef.meatId]) || 180) : 0;

    const feedUnitPrice = parseFloat(marketPrices[itemDef.favoriteFood || 'T3_WHEAT']) || 350;
    const feedPerSpot = useFavoriteFood ? 5 : 10;
    const totalFeedUnits = totalSpots * feedPerSpot;
    const feedExpense = Math.round(totalFeedUnits * feedUnitPrice);

    const baseOffspring = itemDef.baseOffspringChance || 0.6;
    const bonusOffspring = itemDef.bonusOffspringChance || 0.8;
    const effectiveOffspring = useFocus ? (baseOffspring + bonusOffspring) : baseOffspring;

    const totalOffspring = Math.round(totalSpots * effectiveOffspring * 100) / 100;
    const babiesToBuy = totalOffspring >= totalSpots ? 0 : Math.round((totalSpots - totalOffspring) * 100) / 100;
    const surplusBabies = totalOffspring >= totalSpots ? Math.round((totalOffspring - totalSpots) * 100) / 100 : 0;
    const babyExpense = Math.round(babiesToBuy * babyPrice);

    let activeAction = animalAction;
    let totalOutput = 0;
    let outputRevenue = 0;
    let outputName = '';
    let outputIcon = '';

    if (activeAction === 'slaughter' || !itemDef.productId) {
      activeAction = 'slaughter';
      const meatYieldPerSpot = itemDef.meatYield || 18;
      totalOutput = Math.round(totalSpots * meatYieldPerSpot * yieldMultiplier * 10) / 10;
      outputRevenue = Math.round(totalOutput * meatPrice);
      outputName = itemDef.meatName || 'Raw Meat';
      outputIcon = itemDef.meatIcon;
    } else {
      activeAction = 'produce';
      const dailyYieldPerSpot = itemDef.productYieldPerDay || 9.5;
      totalOutput = Math.round(totalSpots * dailyYieldPerSpot * yieldMultiplier * 10) / 10;
      outputRevenue = Math.round(totalOutput * prodPrice);
      outputName = itemDef.productName || 'Eggs / Milk';
      outputIcon = itemDef.productIcon;
    }

    const surplusBabyRevenue = Math.round(surplusBabies * babyPrice);
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
      }
    };
  } else {
    // Mounts
    const babyPrice = parseFloat(marketPrices[itemDef.babyId]) || 25000;
    const mountPrice = parseFloat(marketPrices[itemDef.mountId]) || 45000;
    const feedExpense = Math.round(totalSpots * 10 * (parseFloat(marketPrices['T3_WHEAT']) || 350));

    const baseOffspring = itemDef.baseOffspringChance || 0.0;
    const bonusOffspring = itemDef.bonusOffspringChance || 0.0;
    const effectiveOffspring = useFocus ? (baseOffspring + bonusOffspring) : baseOffspring;

    const totalOffspring = Math.round(totalSpots * effectiveOffspring * 100) / 100;
    const babiesToBuy = Math.round(Math.max(0, totalSpots - totalOffspring) * 100) / 100;
    const surplusBabies = Math.round(Math.max(0, totalOffspring - totalSpots) * 100) / 100;
    const babyExpense = Math.round(babiesToBuy * babyPrice);

    const mountRevenue = Math.round(totalSpots * mountPrice);
    const surplusBabyRev = Math.round(surplusBabies * babyPrice);
    const grossRevenue = mountRevenue + surplusBabyRev;

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
      hasCityBonus: false,
      bonusCity: null,
      hasPremium,
      useFocus,
      focus: {
        focusPerSpot,
        totalFocusNeeded,
        silverPerFocus,
      },
      yield: {
        totalMounts: totalSpots,
        offspringReturned: totalOffspring,
        babiesToBuy,
        surplusBabies,
      },
      finances: {
        mountRevenue,
        surplusBabyRevenue: surplusBabyRev,
        grossRevenue,
        babyExpense,
        feedExpense,
        marketTax,
        netProfit,
        profitMarginPct: profitMargin,
        profitPerPlot,
      }
    };
  }
}
