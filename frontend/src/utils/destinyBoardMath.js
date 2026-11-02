/**
 * Albion Online Destiny Board Specialization & Fame Mathematics
 * Supports Dragonfire Patch 3 mechanics:
 * - 0 to 100 Specialization curve (~16.99M standard, ~19.31M artifact)
 * - Crafting & Cooking fame formulas
 * - Item Studying (275% fame multiplier / 2.75x speedup)
 * - Learning Points (LP threshold at 20% level progress)
 * - Filled journals generation & silver offset
 */

export const CRAFTING_FAME_PER_RESOURCE = {
  2: 7.5,
  3: 15.0,
  4: 22.5,
  5: 90.0,
  6: 270.0,
  7: 645.0,
  8: 1395.0,
};

export const COOKING_FAME_PER_BATCH = {
  3: 225,
  4: 450,
  5: 1125,
  6: 2700,
  7: 5400,
  8: 10800,
};

// Journal fame capacities
export const JOURNAL_FAME_CAPACITY = {
  2: 900,
  3: 1800,
  4: 3600,
  5: 7200,
  6: 14400,
  7: 28800,
  8: 57600,
};

/**
 * Cumulative Destiny Board fame table from Level 0 to 100.
 * Follows the authentic Albion Online power progression curve.
 */
function getCumulativeFameAtLevel(level, isArtifact = false) {
  const maxFame = isArtifact ? 19307840 : 16989300;
  const clamped = Math.max(0, Math.min(100, Number(level) || 0));
  if (clamped === 0) return 0;
  if (clamped >= 100) return maxFame;

  // Authentic Albion exponential curve: early levels are rapid, 90-100 contains ~40% of the fame pool
  const progress = clamped / 100.0;
  return Math.round(maxFame * Math.pow(progress, 2.42));
}

/**
 * Calculates exact fame required between two specialization levels.
 */
export function getFameBetweenLevels(startLevel = 0, targetLevel = 100, isArtifact = false) {
  const start = Math.max(0, Math.min(100, parseInt(startLevel) || 0));
  const target = Math.max(start, Math.min(100, parseInt(targetLevel) || 100));
  const fameStart = getCumulativeFameAtLevel(start, isArtifact);
  const fameTarget = getCumulativeFameAtLevel(target, isArtifact);
  return Math.max(0, fameTarget - fameStart);
}

/**
 * Calculates complete Spec Leveling Roadmap for Food / Cooking.
 */
export function calculateCookingSpecRoadmap({
  foodItem,
  currentSpec = 0,
  targetSpec = 100,
  strategy = 'sell', // 'sell' (keep and sell food) or 'study' (study food for 2.75x fame)
  useLearningPoints = false, // 20% fame + LP
  rrr = 0.15, // Return rate (e.g. 15% Caerleon or with Focus)
  sellPricePerUnit = 0,
  ingredientCosts = {},
}) {
  if (!foodItem) return null;

  const tier = foodItem.tier || 4;
  const baseFamePerBatch = COOKING_FAME_PER_BATCH[tier] || 1125;
  const fameMultiplier = strategy === 'study' ? 2.75 : 1.0;
  const effectiveFamePerBatch = Math.round(baseFamePerBatch * fameMultiplier);

  let rawFameNeeded = getFameBetweenLevels(currentSpec, targetSpec, false);
  if (useLearningPoints) {
    rawFameNeeded = Math.round(rawFameNeeded * 0.20); // 20% manual fame needed to unlock LP
  }

  const batchesNeeded = Math.ceil(rawFameNeeded / effectiveFamePerBatch);
  const unitsPerBatch = foodItem.amountCrafted || 10;
  const totalUnitsProduced = strategy === 'study' ? 0 : batchesNeeded * unitsPerBatch;

  // Calculate gross and net ingredient demand
  const ingredientsBreakdown = (foodItem.ingredients || []).map((ing) => {
    const qtyPerBatch = ing.count || 1;
    const grossNeeded = batchesNeeded * qtyPerBatch;
    const refunded = Math.floor(grossNeeded * rrr);
    const netConsumed = grossNeeded - refunded;
    const unitPrice = ingredientCosts[ing.uniqueName] || 350;
    const grossCost = grossNeeded * unitPrice;
    const netCost = netConsumed * unitPrice;

    return {
      uniqueName: ing.uniqueName,
      name: ing.name || ing.uniqueName,
      qtyPerBatch,
      grossNeeded,
      refunded,
      netConsumed,
      unitPrice,
      grossCost,
      netCost,
    };
  });

  const totalGrossIngredientCost = ingredientsBreakdown.reduce((sum, ing) => sum + ing.grossCost, 0);
  const totalNetIngredientCost = ingredientsBreakdown.reduce((sum, ing) => sum + ing.netCost, 0);

  // Resale revenue if selling food
  const grossRevenue = totalUnitsProduced * (sellPricePerUnit || 0);
  const marketTax = Math.round(grossRevenue * 0.065); // 4% premium + 2.5% setup
  const netRevenue = grossRevenue - marketTax;

  // Chef Journals filled
  const journalCapacity = JOURNAL_FAME_CAPACITY[tier] || 7200;
  const journalsFilled = Math.floor(rawFameNeeded / journalCapacity);

  // Net silver cost or profit
  const netSilverBalance = strategy === 'study'
    ? -totalNetIngredientCost
    : (netRevenue - totalNetIngredientCost);

  const silverPerFame = rawFameNeeded > 0
    ? Number((Math.abs(netSilverBalance) / rawFameNeeded).toFixed(2))
    : 0;

  return {
    tier,
    currentSpec,
    targetSpec,
    strategy,
    useLearningPoints,
    rawFameNeeded,
    baseFamePerBatch,
    effectiveFamePerBatch,
    batchesNeeded,
    totalUnitsProduced,
    ingredientsBreakdown,
    totalGrossIngredientCost,
    totalNetIngredientCost,
    netRevenue,
    journalsFilled,
    netSilverBalance,
    silverPerFame,
    isProfitable: netSilverBalance > 0,
  };
}

/**
 * Calculates complete Spec Leveling Roadmap for Gear Crafting (Weapons & Armor).
 */
export function calculateGearSpecRoadmap({
  itemDef,
  tier = 4,
  currentSpec = 0,
  targetSpec = 100,
  strategy = 'sell', // 'sell' or 'study' (2.75x fame)
  useLearningPoints = false,
  rrr = 0.248, // Return rate
  itemSellPrice = 0,
  primaryMatPrice = 0,
  secondaryMatPrice = 0,
  artifactPrice = 0,
}) {
  if (!itemDef) return null;

  const isArtifact = Boolean(itemDef.artifact || itemDef.isArtifact);
  let rawFameNeeded = getFameBetweenLevels(currentSpec, targetSpec, isArtifact);
  if (useLearningPoints) {
    rawFameNeeded = Math.round(rawFameNeeded * 0.20);
  }

  // Gear fame formula: resourceCount * CRAFTING_FAME_PER_RESOURCE[tier]
  const famePerRes = CRAFTING_FAME_PER_RESOURCE[tier] || 22.5;
  const totalResources = (itemDef.primaryCount || 16) + (itemDef.secondaryCount || 0);
  const baseFamePerCraft = Math.round(totalResources * famePerRes);
  const fameMultiplier = strategy === 'study' ? 2.75 : 1.0;
  const effectiveFamePerCraft = Math.round(baseFamePerCraft * fameMultiplier);

  const craftsNeeded = Math.ceil(rawFameNeeded / effectiveFamePerCraft);
  const totalItemsProduced = strategy === 'study' ? 0 : craftsNeeded;

  // Primary resource demand
  const primaryGross = craftsNeeded * (itemDef.primaryCount || 16);
  const primaryRefund = Math.floor(primaryGross * rrr);
  const primaryNet = primaryGross - primaryRefund;
  const primaryCost = primaryNet * (primaryMatPrice || 0);

  // Secondary resource demand
  const secondaryGross = craftsNeeded * (itemDef.secondaryCount || 0);
  const secondaryRefund = Math.floor(secondaryGross * rrr);
  const secondaryNet = secondaryGross - secondaryRefund;
  const secondaryCost = secondaryNet * (secondaryMatPrice || 0);

  // Artifact demand (Artifacts have 0% RRR)
  const artifactCount = itemDef.artifactCount ? craftsNeeded * itemDef.artifactCount : 0;
  const artifactCost = artifactCount * (artifactPrice || 0);

  const totalNetMaterialsCost = primaryCost + secondaryCost + artifactCost;

  // Resale revenue if selling gear
  const grossRevenue = totalItemsProduced * (itemSellPrice || 0);
  const marketTax = Math.round(grossRevenue * 0.065);
  const netRevenue = grossRevenue - marketTax;

  // Crafting Journals filled
  const journalCapacity = JOURNAL_FAME_CAPACITY[tier] || 3600;
  const journalsFilled = Math.floor(rawFameNeeded / journalCapacity);

  const netSilverBalance = strategy === 'study'
    ? -totalNetMaterialsCost
    : (netRevenue - totalNetMaterialsCost);

  const silverPerFame = rawFameNeeded > 0
    ? Number((Math.abs(netSilverBalance) / rawFameNeeded).toFixed(2))
    : 0;

  return {
    tier,
    isArtifact,
    currentSpec,
    targetSpec,
    strategy,
    useLearningPoints,
    rawFameNeeded,
    baseFamePerCraft,
    effectiveFamePerCraft,
    craftsNeeded,
    totalItemsProduced,
    primaryGross,
    primaryNet,
    secondaryGross,
    secondaryNet,
    artifactCount,
    totalNetMaterialsCost,
    netRevenue,
    journalsFilled,
    netSilverBalance,
    silverPerFame,
    isProfitable: netSilverBalance > 0,
  };
}
