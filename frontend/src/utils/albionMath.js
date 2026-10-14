export const RESOURCES = {
  wood: {
    id: 'wood',
    name: 'Wood / Planks',
    rawName: 'Wood',
    refinedName: 'Plank',
    rawPrefix: 'T{tier}_WOOD',
    refinedPrefix: 'T{tier}_PLANKS',
    bonusCity: 'Fort Sterling',
    maxEnchantment: 4,
    icon: '🪵',
  },
  ore: {
    id: 'ore',
    name: 'Ore / Metal Bars',
    rawName: 'Ore',
    refinedName: 'Metal Bar',
    rawPrefix: 'T{tier}_ORE',
    refinedPrefix: 'T{tier}_METALBAR',
    bonusCity: 'Thetford',
    maxEnchantment: 4,
    icon: '⛏️',
  },
  hide: {
    id: 'hide',
    name: 'Hide / Leather',
    rawName: 'Hide',
    refinedName: 'Leather',
    rawPrefix: 'T{tier}_HIDE',
    refinedPrefix: 'T{tier}_LEATHER',
    bonusCity: 'Martlock',
    maxEnchantment: 4,
    icon: '🐺',
  },
  fiber: {
    id: 'fiber',
    name: 'Fiber / Cloth',
    rawName: 'Fiber',
    refinedName: 'Cloth',
    rawPrefix: 'T{tier}_FIBER',
    refinedPrefix: 'T{tier}_CLOTH',
    bonusCity: 'Lymhurst',
    maxEnchantment: 4,
    icon: '🌾',
  },
  stone: {
    id: 'stone',
    name: 'Stone / Blocks',
    rawName: 'Stone Rock',
    refinedName: 'Stone Block',
    rawPrefix: 'T{tier}_ROCK',
    refinedPrefix: 'T{tier}_STONEBLOCK',
    bonusCity: 'Bridgewatch',
    maxEnchantment: 3, // Capped at .3; Pristine .4 does NOT exist for stone
    isStone: true,
    icon: '🪨',
  },
};

export function getItemIdentifier(resourceType, tier, enchantment = 0, isRefined = false) {
  const res = RESOURCES[resourceType?.toLowerCase()];
  if (!res) return '';
  const prefixTemplate = isRefined ? res.refinedPrefix : res.rawPrefix;
  const baseId = prefixTemplate.replace('{tier}', tier);
  
  if (isRefined && res.isStone) {
    return baseId; // Refined stone blocks are always standard flat
  }
  if (enchantment > 0 && tier >= 4) {
    const maxEnch = res.maxEnchantment || 4;
    const safeEnch = Math.min(enchantment, maxEnch);
    return `${baseId}_LEVEL${safeEnch}@${safeEnch}`;
  }
  return baseId;
}

export function getItemCdnUrl(itemId) {
  if (!itemId) return 'https://render.albiononline.com/v1/item/T4_MAIN_SWORD.png';
  let clean = String(itemId).trim().replace(/^.*[\\\/]/, '').replace(/\.png$/i, '');
  clean = clean.replace(/_LEVEL([1-4])_([1-4])$/i, '_LEVEL$1@$2');
  return `https://render.albiononline.com/v1/item/${clean}.png`;
}

export function getItemIconPath(itemId) {
  if (!itemId) return null;
  const safeName = itemId.replace(/@/g, '_');
  return `/items/${safeName}.png`;
}

export const CITIES = [
  { name: 'Martlock', bonusRes: 'hide', isRoyal: true },
  { name: 'Fort Sterling', bonusRes: 'wood', isRoyal: true },
  { name: 'Thetford', bonusRes: 'ore', isRoyal: true },
  { name: 'Lymhurst', bonusRes: 'fiber', isRoyal: true },
  { name: 'Bridgewatch', bonusRes: 'stone', isRoyal: true },
  { name: 'Caerleon', bonusRes: null, isRoyal: true },
  { name: 'Brecilien', bonusRes: null, isRoyal: true },
  { name: 'Island', bonusRes: null, isRoyal: false },
];

export const RAW_PER_TIER = {
  2: 1,
  3: 2,
  4: 2,
  5: 3,
  6: 4,
  7: 5,
  8: 5,
};

export const BASE_FOCUS_COST = {
  2: 0,
  3: 31,
  4: 54,
  5: 94,
  6: 164,
  7: 287,
  8: 503,
};

export const ENCHANTMENT_FOCUS_MULTIPLIER = {
  0: 1.0,
  1: 1.75,
  2: 3.06,
  3: 5.36,
  4: 9.38,
};

export const STONE_ENCHANTMENT_YIELD = {
  0: 1,
  1: 2,
  2: 4,
  3: 8,
};

export const BASE_ITEM_VALUES = {
  2: { 0: 2 },
  3: { 0: 6 },
  4: { 0: 14, 1: 30, 2: 62, 3: 126, 4: 254 },
  5: { 0: 30, 1: 62, 2: 126, 3: 254, 4: 510 },
  6: { 0: 62, 1: 126, 2: 254, 3: 510, 4: 1022 },
  7: { 0: 126, 1: 254, 2: 510, 3: 1022, 4: 2046 },
  8: { 0: 254, 1: 510, 2: 1022, 3: 2046, 4: 4094 },
};

export function calculateReturnRate(resourceType, city, useFocus = false, dailyBonusPct = 0) {
  const isIsland = city.toLowerCase() === 'island';
  const baseBonus = isIsland ? 0.0 : 0.18;
  
  const cityObj = CITIES.find(c => c.name.toLowerCase() === city.toLowerCase());
  const hasCitySpecialty = cityObj?.bonusRes === resourceType;
  const specialtyBonus = hasCitySpecialty ? 0.40 : 0.0;
  
  const dailyBonus = (dailyBonusPct || 0) / 100.0;
  const focusBonus = useFocus ? 0.59 : 0.0;
  
  const totalBonus = baseBonus + specialtyBonus + dailyBonus + focusBonus;
  return totalBonus > 0 ? totalBonus / (1.0 + totalBonus) : 0.0;
}

export function calculateFocusCost(resourceType, tier, enchantment, mastery = 0, specLevels = {}) {
  if (tier < 3) return 0;
  
  const baseCost = BASE_FOCUS_COST[tier] || 54;
  const multiplier = ENCHANTMENT_FOCUS_MULTIPLIER[enchantment] || 1.0;
  const baseFocus = baseCost * multiplier;
  
  // Efficiency
  const m = Math.max(0, Math.min(100, Number(mastery) || 0));
  let efficiency = m * 30;
  
  [4, 5, 6, 7, 8].forEach(t => {
    const spec = Math.max(0, Math.min(100, Number(specLevels[t]) || 0));
    if (t === tier) {
      efficiency += spec * 250;
    } else {
      efficiency += spec * 30;
    }
  });
  
  const actualFocus = baseFocus * Math.pow(0.5, efficiency / 10000.0);
  return Math.max(1, Math.floor(actualFocus));
}

export function calculateStationFee(tier, enchantment, stationTaxPer100 = 0, quantity = 1) {
  const tierVals = BASE_ITEM_VALUES[tier] || {};
  const itemVal = tierVals[enchantment] ?? tierVals[0] ?? 14;
  const nutrition = itemVal * 0.1125;
  const feePerUnit = nutrition * ((stationTaxPer100 || 0) / 100.0);
  return feePerUnit * quantity;
}

export function computeRefining({
  resourceType = 'hide',
  tier = 4,
  enchantment = 0,
  quantity = 100,
  rawPrice = 0,
  prevRefinedPrice = 0,
  refinedSellPrice = 0,
  city = 'Martlock',
  useFocus = false,
  dailyBonusPct = 0,
  stationTaxPer100 = 500,
  hasPremium = true,
  isSellOrder = true,
  masteryLevel = 0,
  specLevels = {},
}) {
  const qty = Math.max(1, Number(quantity) || 1);
  const t = Number(tier);
  const ench = Math.min(resourceType === 'stone' ? 3 : 4, Number(enchantment));
  
  // Return rates
  const rrrCurrent = calculateReturnRate(resourceType, city, useFocus, dailyBonusPct);
  const rrrNoFocus = calculateReturnRate(resourceType, city, false, dailyBonusPct);
  
  // Raw and previous tier inputs
  const rawPerCraft = RAW_PER_TIER[t] || 2;
  const prevRefinedPerCraft = t > 2 ? 1 : 0;
  
  const rawGross = qty * rawPerCraft;
  const prevRefinedGross = qty * prevRefinedPerCraft;
  
  const initialCapital = (rawGross * rawPrice) + (prevRefinedGross * prevRefinedPrice);
  
  // Returns applied to BOTH raw and lower-tier refined
  const rawConsumed = rawGross * (1.0 - rrrCurrent);
  const prevConsumed = prevRefinedGross * (1.0 - rrrCurrent);
  const rawReturned = rawGross * rrrCurrent;
  const prevReturned = prevRefinedGross * rrrCurrent;
  
  const netMaterialCost = (rawConsumed * rawPrice) + (prevConsumed * prevRefinedPrice);
  const stationFee = calculateStationFee(t, ench, stationTaxPer100, qty);
  const totalCost = netMaterialCost + stationFee;
  
  // Stone yield multiplier
  const isStone = resourceType === 'stone';
  const stoneMultiplier = isStone ? (STONE_ENCHANTMENT_YIELD[ench] || 1) : 1;
  const outputQuantity = qty * stoneMultiplier;
  
  // Market Revenue
  const grossRevenue = outputQuantity * refinedSellPrice;
  const taxRate = hasPremium ? 0.04 : 0.08;
  const setupFee = isSellOrder ? 0.025 : 0.0;
  const totalFeeRate = taxRate + setupFee;
  const marketTaxes = grossRevenue * totalFeeRate;
  const netRevenue = grossRevenue - marketTaxes;
  
  // Profit
  const netProfit = netRevenue - totalCost;
  const costPerUnit = outputQuantity > 0 ? totalCost / outputQuantity : 0;
  const profitPerUnit = outputQuantity > 0 ? netProfit / outputQuantity : 0;
  const marginPct = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  
  // Focus
  const focusPerUnit = calculateFocusCost(resourceType, t, ench, masteryLevel, specLevels);
  const totalFocus = useFocus ? focusPerUnit * qty : 0;
  
  // Profit without focus
  const costNoFocus = (rawGross * (1.0 - rrrNoFocus) * rawPrice) +
                      (prevRefinedGross * (1.0 - rrrNoFocus) * prevRefinedPrice) +
                      stationFee;
  const profitNoFocus = netRevenue - costNoFocus;
  const silverPerFocus = (useFocus && totalFocus > 0) ? (netProfit - profitNoFocus) / totalFocus : 0;
  
  // Bonus city comparison (Opportunity Cost)
  const bonusCity = RESOURCES[resourceType]?.bonusCity || 'Martlock';
  const isBonusCity = city.toLowerCase() === bonusCity.toLowerCase();
  let opportunityCost = null;
  if (!isBonusCity) {
    const rrrBonusCity = calculateReturnRate(resourceType, bonusCity, useFocus, dailyBonusPct);
    const costInBonusCity = (rawGross * (1.0 - rrrBonusCity) * rawPrice) +
                            (prevRefinedGross * (1.0 - rrrBonusCity) * prevRefinedPrice) +
                            stationFee;
    const profitInBonusCity = netRevenue - costInBonusCity;
    const profitDiff = profitInBonusCity - netProfit;
    opportunityCost = {
      bonusCity,
      bonusCityRrr: rrrBonusCity,
      extraProfit: profitDiff,
    };
  }
  
  return {
    resourceType,
    tier: t,
    enchantment: ench,
    quantity: qty,
    outputQuantity,
    city,
    isBonusCity,
    opportunityCost,
    useFocus,
    returnRatePct: Number((rrrCurrent * 100).toFixed(2)),
    returnRateNoFocusPct: Number((rrrNoFocus * 100).toFixed(2)),
    focusPerUnit,
    totalFocusNeeded: totalFocus,
    silverPerFocus: Number(silverPerFocus.toFixed(2)),
    materials: {
      rawGross,
      rawConsumed: Number(rawConsumed.toFixed(1)),
      rawReturned: Number(rawReturned.toFixed(1)),
      rawPrice,
      prevRefinedGross,
      prevRefinedConsumed: Number(prevConsumed.toFixed(1)),
      prevRefinedReturned: Number(prevReturned.toFixed(1)),
      prevRefinedPrice,
    },
    financials: {
      initialCapital: Math.round(initialCapital),
      stationFee: Math.round(stationFee),
      netMaterialCost: Math.round(netMaterialCost),
      totalCost: Math.round(totalCost),
      costPerUnit: Math.round(costPerUnit),
      grossRevenue: Math.round(grossRevenue),
      marketTaxes: Math.round(marketTaxes),
      netRevenue: Math.round(netRevenue),
      netProfit: Math.round(netProfit),
      profitNoFocus: Math.round(profitNoFocus),
      profitPerUnit: Math.round(profitPerUnit),
      marginPct: Number(marginPct.toFixed(2)),
    }
  };
}
