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

export function calculateFocusCost(resourceType, tier, enchantment, masteryOrSpec = 0, specLevelsArg = {}) {
  if (tier < 3) return 0;
  
  const baseCost = BASE_FOCUS_COST[tier] || 54;
  const multiplier = ENCHANTMENT_FOCUS_MULTIPLIER[enchantment] || 1.0;
  const baseFocus = baseCost * multiplier;
  
  // In Albion Online, refining has NO central mastery tree (no 'Mastery Level 1-100').
  // It features 5 independent tier nodes (T4 Adept to T8 Elder) totaling 500/500 spec:
  // - Active tier spec grants +280 eff/lvl (+250 specific tier + 30 cross-tier shared)
  // - The other 4 tier specs grant +30 eff/lvl each (cross-tier shared)
  // Max efficiency at 500/500 = 28,000 + 12,000 = 40,000 efficiency points.
  const specs = (masteryOrSpec && typeof masteryOrSpec === 'object') ? masteryOrSpec : (specLevelsArg || {});
  let efficiency = 0;
  
  [4, 5, 6, 7, 8].forEach(t => {
    const spec = Math.max(0, Math.min(100, Number(specs[t]) || 0));
    if (t === tier) {
      efficiency += spec * 280;
    } else {
      efficiency += spec * 30;
    }
  });
  
  const actualFocus = baseFocus * Math.pow(0.5, efficiency / 10000.0);
  return Math.max(1, Math.floor(actualFocus + 0.5));
}

export function calculateStationFee(tier, enchantment, stationTaxPer100 = 0, quantity = 1) {
  if (Number(tier) <= 2) return 0;
  const tierVals = BASE_ITEM_VALUES[tier] || {};
  const itemVal = tierVals[enchantment] ?? tierVals[0] ?? 14;
  const nutrition = itemVal * 0.1125;
  const feePerUnit = nutrition * ((stationTaxPer100 || 0) / 100.0);
  return feePerUnit * quantity;
}

/**
 * Simulates pass-by-pass refining at a station starting from a player's on-hand Raw Material stack
 * (e.g., "I have 5,000 T4 Hide — tell me how much T3 Leather I need and how much T4 Leather I will get").
 */
export function simulateRefiningFromMaterials({
  resourceType = 'hide',
  tier = 4,
  enchantment = 0,
  rawHave = 0,
  prevRefinedHave = 0,
  constrainByPrevRefined = false,
  city = 'Martlock',
  useFocus = false,
  dailyBonusPct = 0,
}) {
  const t = Number(tier);
  const ench = Math.min(resourceType === 'stone' ? 3 : 4, Number(enchantment));
  const rawPerCraft = RAW_PER_TIER[t] || 2;
  const prevPerCraft = t > 2 ? 1 : 0;
  const rrr = calculateReturnRate(resourceType, city, useFocus, dailyBonusPct);
  const isStone = resourceType === 'stone';
  const stoneMultiplier = isStone ? (STONE_ENCHANTMENT_YIELD[ench] || 1) : 1;

  let remRaw = Math.max(0, Math.floor(Number(rawHave) || 0));
  let remPrev = Math.max(0, Math.floor(Number(prevRefinedHave) || 0));

  let pass1Crafts = 0;
  let totalCrafts = 0;
  let prevTotalNeeded = 0;
  let simPrevBag = 0;
  const passes = [];

  let passIndex = 0;
  while (remRaw >= rawPerCraft && passIndex < 50) {
    let craftsInPass = Math.floor(remRaw / rawPerCraft);
    if (prevPerCraft > 0 && constrainByPrevRefined) {
      craftsInPass = Math.min(craftsInPass, Math.floor(remPrev / prevPerCraft));
    }
    if (craftsInPass <= 0) break;

    passIndex += 1;
    if (passIndex === 1) {
      pass1Crafts = craftsInPass;
    }
    totalCrafts += craftsInPass;

    const rawUsed = craftsInPass * rawPerCraft;
    const rawReturned = Math.floor(rawUsed * rrr);
    remRaw = remRaw - rawUsed + rawReturned;

    let prevUsed = 0;
    let prevReturned = 0;
    if (prevPerCraft > 0) {
      prevUsed = craftsInPass * prevPerCraft;
      prevReturned = Math.floor(prevUsed * rrr);
      if (constrainByPrevRefined) {
        remPrev = remPrev - prevUsed + prevReturned;
      } else {
        if (simPrevBag < prevUsed) {
          const shortfall = prevUsed - simPrevBag;
          prevTotalNeeded += shortfall;
          simPrevBag += shortfall;
        }
        simPrevBag = simPrevBag - prevUsed + prevReturned;
      }
    }

    passes.push({
      pass: passIndex,
      crafts: craftsInPass,
      output: craftsInPass * stoneMultiplier,
      rawUsed,
      rawReturned,
      prevUsed,
      prevReturned,
    });

    if (rawReturned <= 0) break;
  }

  const bonusRrrCrafts = Math.max(0, totalCrafts - pass1Crafts);
  const prevNeededPass1 = pass1Crafts * prevPerCraft;
  if (prevPerCraft > 0 && constrainByPrevRefined) {
    prevTotalNeeded = Math.max(0, Math.floor(Number(prevRefinedHave) || 0) - remPrev);
  }
  const prevToBuyPass1 = Math.max(0, prevNeededPass1 - Math.max(0, Math.floor(Number(prevRefinedHave) || 0)));
  const prevToBuyTotal = Math.max(0, prevTotalNeeded - Math.max(0, Math.floor(Number(prevRefinedHave) || 0)));

  return {
    rrr,
    returnRatePct: Number((rrr * 100).toFixed(2)),
    rawPerCraft,
    prevPerCraft,
    stoneMultiplier,
    pass1Crafts,
    bonusRrrCrafts,
    totalCrafts,
    pass1Output: pass1Crafts * stoneMultiplier,
    bonusRrrOutput: bonusRrrCrafts * stoneMultiplier,
    totalOutput: totalCrafts * stoneMultiplier,
    passCount: passes.length,
    passes,
    leftoverRaw: remRaw,
    leftoverPrevRefined: constrainByPrevRefined ? remPrev : simPrevBag,
    prevNeededPass1,
    prevTotalNeeded,
    prevToBuyPass1,
    prevToBuyTotal,
  };
}

export const RESOURCE_WEIGHTS = {
  raw: { 2: 0.1, 3: 0.2, 4: 0.3, 5: 0.5, 6: 0.8, 7: 1.2, 8: 1.8 },
  refined: { 2: 0.2, 3: 0.3, 4: 0.5, 5: 0.8, 6: 1.3, 7: 2.0, 8: 3.0 },
};

export const REFINING_MOUNT_THRESHOLDS = [
  { maxWeight: 150, name: 'T4 Riding Horse / Swiftclaw', badge: 'text-emerald-400 border-emerald-600/50 bg-emerald-950/40' },
  { maxWeight: 600, name: 'T5 Transport Ox / Direboar', badge: 'text-sky-300 border-sky-500/50 bg-sky-950/40' },
  { maxWeight: 1800, name: 'T7 Transport Ox / Grizzly Bear', badge: 'text-amber-300 border-amber-500/50 bg-amber-950/40' },
  { maxWeight: Infinity, name: 'T8 Transport Mammoth / Guild Caravan', badge: 'text-rose-300 border-rose-500/50 bg-rose-950/40' },
];

export function getRefiningMountRecommendation(weightKg) {
  const w = Number(weightKg) || 0;
  for (const m of REFINING_MOUNT_THRESHOLDS) {
    if (w <= m.maxWeight) return m;
  }
  return REFINING_MOUNT_THRESHOLDS[REFINING_MOUNT_THRESHOLDS.length - 1];
}

export function getFocusPoolAnalysis(totalFocus) {
  const f = Math.max(0, Number(totalFocus) || 0);
  const days = f / 10000;
  if (f <= 0) {
    return {
      status: 'none',
      days: 0,
      daysText: '0 days',
      isOverBank: false,
      badgeText: '0 Focus',
      colorClass: 'text-slate-400 bg-slate-900/60 border-slate-700',
    };
  }
  if (f <= 10000) {
    return {
      status: 'single_session',
      days: Number(days.toFixed(1)),
      daysText: `${days.toFixed(1)} daily pool`,
      isOverBank: false,
      badgeText: `⚡ ${f.toLocaleString()} Focus (~${days.toFixed(1)} days • Ready in 1 day)`,
      colorClass: 'text-emerald-300 bg-emerald-950/60 border-emerald-500/40',
    };
  }
  if (f <= 30000) {
    return {
      status: 'within_bank',
      days: Number(days.toFixed(1)),
      daysText: `${days.toFixed(1)} days`,
      isOverBank: false,
      badgeText: `⚡ ${f.toLocaleString()} Focus (~${days.toFixed(1)} days • Within 30k bank limit)`,
      colorClass: 'text-amber-300 bg-amber-950/60 border-amber-500/40',
    };
  }
  return {
    status: 'over_bank',
    days: Number(days.toFixed(1)),
    daysText: `${days.toFixed(1)} days`,
    isOverBank: true,
    badgeText: `⚠️ Exceeds 30k Bank Cap (${f.toLocaleString()} Focus • ~${days.toFixed(1)} days regen)`,
    colorClass: 'text-rose-300 bg-rose-950/70 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.25)]',
  };
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

  const rawUnitWeight = RESOURCE_WEIGHTS.raw[t] || 0.3;
  const prevUnitWeight = RESOURCE_WEIGHTS.refined[t - 1] || 0.2;
  const outputUnitWeight = RESOURCE_WEIGHTS.refined[t] || 0.5;
  const inputCargoWeightKg = Math.round((rawGross * rawUnitWeight + prevRefinedGross * prevUnitWeight) * 10) / 10;
  const outputCargoWeightKg = Math.round((outputQuantity * outputUnitWeight) * 10) / 10;
  const recommendedMount = getRefiningMountRecommendation(Math.max(inputCargoWeightKg, outputCargoWeightKg));
  const focusPool = getFocusPoolAnalysis(totalFocus);

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
    focusPool,
    cargo: {
      inputCargoWeightKg,
      outputCargoWeightKg,
      maxCargoWeightKg: Math.max(inputCargoWeightKg, outputCargoWeightKg),
      recommendedMount,
    },
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
