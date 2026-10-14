import POTION_ITEMS_DATA from '../data/potionItems.json';

export const POTION_ITEMS = POTION_ITEMS_DATA;

export const POTION_SUBCATEGORIES = [
  { id: 'all', label: 'All Elixirs', icon: 'Sparkles' },
  { id: 'healing', label: 'Healing', icon: 'Heart' },
  { id: 'energy', label: 'Energy', icon: 'Zap' },
  { id: 'defense', label: 'Defense (Resistance)', icon: 'Shield' },
  { id: 'dragon', label: 'Dragon (Lifeward)', icon: 'Flame' },
  { id: 'combat', label: 'Combat (Berserk/Gigantify)', icon: 'Swords' },
  { id: 'debuff', label: 'Offensive (Poison/Acid/Hellfire)', icon: 'Skull' },
  { id: 'utility', label: 'Utility & CC', icon: 'Wind' },
  { id: 'gathering', label: 'Gathering', icon: 'Pickaxe' },
  { id: 'distillery', label: 'Distillery & Extracts', icon: 'FlaskConical' },
];

export const POTION_TIERS = [
  { level: 1, name: 'Beginner', color: 'border-slate-600/80 text-slate-300 bg-slate-900/40' },
  { level: 2, name: 'Novice', color: 'border-amber-700/80 text-amber-500 bg-amber-950/30' },
  { level: 3, name: 'Journeyman', color: 'border-emerald-700/80 text-emerald-400 bg-emerald-950/30' },
  { level: 4, name: 'Adept', color: 'border-sky-600/80 text-sky-400 bg-sky-950/30' },
  { level: 5, name: 'Expert', color: 'border-red-600/80 text-red-400 bg-red-950/30' },
  { level: 6, name: 'Master', color: 'border-orange-600/80 text-orange-400 bg-orange-950/30' },
  { level: 7, name: 'Grandmaster', color: 'border-yellow-500/80 text-yellow-400 bg-yellow-950/30' },
  { level: 8, name: 'Elder', color: 'border-slate-200/90 text-slate-100 bg-slate-800/40' },
];

export const POTION_ENCHANTMENTS = [
  { level: 0, label: '.0', name: 'Standard', desc: 'No Extract Added', color: 'border-slate-700 text-slate-300' },
  { level: 1, label: '.1', name: 'Basic', desc: 'Basic Arcane Extract', color: 'border-emerald-600/80 text-emerald-400 bg-emerald-950/30' },
  { level: 2, label: '.2', name: 'Refined', desc: 'Refined Arcane Extract', color: 'border-sky-500/80 text-sky-400 bg-sky-950/30' },
  { level: 3, label: '.3', name: 'Pure', desc: 'Pure Arcane Extract', color: 'border-purple-500/80 text-purple-400 bg-purple-950/30' },
];

/**
 * Calculates Return Rate for potion brewing in Albion Online.
 * - Brecilien has +15% specialty bonus for Alchemist's Lab
 * - Base Royal City = 18% bonus (15.25% RRR)
 * - Brecilien with specialty = 33% bonus (24.81% RRR)
 * - Brecilien with Focus = 33% + 59% = 92% bonus (47.91% RRR)
 * - Islands have 0% base bonus (0% base RRR, 37.11% with Focus)
 */
export function calculatePotionReturnRate(itemDef, city = 'Brecilien', useFocus = false, dailyBonusPct = 0) {
  const cityName = typeof city === 'string' ? city : city?.name || 'Brecilien';
  const isIsland = cityName.toLowerCase() === 'island';
  const baseBonus = isIsland ? 0.0 : 0.18;

  const bonusCity = itemDef?.bonusCity || 'Brecilien';
  const hasSpecialty = Boolean(bonusCity && cityName.toLowerCase() === bonusCity.toLowerCase() && !isIsland);
  const specialtyBonus = hasSpecialty ? 0.15 : 0.0;

  const dailyBonus = (parseFloat(dailyBonusPct) || 0.0) / 100.0;
  const focusBonus = useFocus ? 0.59 : 0.0;

  const totalBonus = baseBonus + specialtyBonus + dailyBonus + focusBonus;
  return totalBonus > 0 ? totalBonus / (1.0 + totalBonus) : 0.0;
}

/**
 * Calculates Focus Cost per potion craft batch with Alchemist Mastery and Specialization.
 */
export function calculatePotionFocusCost(baseFocus, mastery = 0, spec = 0) {
  if (!baseFocus || baseFocus <= 0) return 0;
  const m = Math.max(0, Math.min(100, parseInt(mastery || 0, 10)));
  const s = Math.max(0, Math.min(100, parseInt(spec || 0, 10)));
  const efficiency = m * 30 + s * 250;
  const actualFocus = baseFocus * Math.pow(0.5, efficiency / 10000.0);
  return Math.max(1, Math.floor(actualFocus));
}

/**
 * Computes complete potion crafting financials and ingredient returns (client fallback).
 */
export function computePotionCrafting({
  item,
  enchantment = 0,
  batches = 1,
  ingredientPrices = {},
  itemSellPrice = 0,
  city = 'Brecilien',
  useFocus = false,
  dailyBonusPct = 0,
  stationTaxPer100 = 500,
  hasPremium = true,
  isSellOrder = true,
  masteryLevel = 0,
  specLevel = 0,
}) {
  if (!item) return null;

  const cityName = typeof city === 'string' ? city : city?.name || 'Brecilien';
  const batchCount = Math.max(1, parseInt(batches || 1, 10));
  const ench = Math.max(0, Math.min(item.maxEnchantment || 0, parseInt(enchantment || 0, 10)));

  // Return rates
  const rrrCurrent = calculatePotionReturnRate(item, cityName, useFocus, dailyBonusPct);
  const rrrNoFocus = calculatePotionReturnRate(item, cityName, false, dailyBonusPct);

  // Active ingredients (Base + Arcane Extract if enchanted)
  const activeIngredients = (item.ingredients || []).map((ing) => ({
    uniqueName: ing.uniqueName,
    name: ing.name,
    countPerBatch: ing.count,
    noRefund: Boolean(ing.noRefund),
    icon: ing.icon || `${ing.uniqueName}.png`,
  }));

  if (ench > 0 && item.enchantments?.[ench]?.extract) {
    const ext = item.enchantments[ench].extract;
    activeIngredients.push({
      uniqueName: ext.uniqueName,
      name: ext.name,
      countPerBatch: ext.count,
      noRefund: false, // Arcane Extract is refunded by RRR
      icon: ext.icon || `${ext.uniqueName}.png`,
    });
  }

  // Material calculations
  let upfrontCost = 0;
  let netCost = 0;

  const breakdown = activeIngredients.map((ing) => {
    const unitPrice = parseFloat(ingredientPrices[ing.uniqueName] || 0);
    const grossNeeded = ing.countPerBatch * batchCount;
    const isRefundable = !ing.noRefund;
    const returned = isRefundable ? grossNeeded * rrrCurrent : 0;
    const netConsumed = grossNeeded - returned;

    const grossIngCost = grossNeeded * unitPrice;
    const netIngCost = netConsumed * unitPrice;

    upfrontCost += grossIngCost;
    netCost += netIngCost;

    return {
      uniqueName: ing.uniqueName,
      name: ing.name,
      icon: ing.icon,
      unitPrice,
      countPerBatch: ing.countPerBatch,
      grossNeeded,
      returned: Math.round(returned * 100) / 100,
      netConsumed: Math.round(netConsumed * 100) / 100,
      grossCost: Math.round(grossIngCost * 100) / 100,
      netCost: Math.round(netIngCost * 100) / 100,
      isRefundable,
    };
  });

  // Station Fee (nutrition)
  const nutritionPerBatch = parseFloat(item.nutrition || 0);
  const stationTaxRate = parseFloat(stationTaxPer100 || 0) / 100.0;
  const stationFee = nutritionPerBatch * stationTaxRate * batchCount;

  // Focus
  let baseFocus = item.baseFocus || 0;
  if (ench > 0 && item.enchantments?.[ench]?.focus) {
    baseFocus = item.enchantments[ench].focus;
  }
  const focusPerBatch = calculatePotionFocusCost(baseFocus, masteryLevel, specLevel);
  const totalFocusUsed = useFocus ? focusPerBatch * batchCount : 0;

  // Production & Financials
  const amountPerBatch = item.amountCrafted || 5;
  const totalUnitsProduced = amountPerBatch * batchCount;

  const grossRevenue = totalUnitsProduced * parseFloat(itemSellPrice || 0);
  const marketTaxRate = hasPremium ? 0.04 : 0.08;
  const setupFeeRate = isSellOrder ? 0.025 : 0.0;
  const marketTaxes = grossRevenue * (marketTaxRate + setupFeeRate);
  const netRevenue = grossRevenue - marketTaxes;

  const totalCost = netCost + stationFee;
  const netProfit = netRevenue - totalCost;

  const profitMarginPct = totalCost > 0 ? (netProfit / totalCost) * 100.0 : 0.0;
  const profitPerBatch = netProfit / batchCount;
  const profitPerUnit = totalUnitsProduced > 0 ? netProfit / totalUnitsProduced : 0.0;

  return {
    item: {
      ...item,
      enchantment: ench,
      icon: ench > 0 ? `${item.uniqueName}@${ench}.png` : `${item.uniqueName}.png`,
    },
    batch: {
      batchCount,
      unitsPerBatch: amountPerBatch,
      totalUnitsProduced,
    },
    rates: {
      rrrCurrent,
      rrrCurrentPct: Math.round(rrrCurrent * 10000) / 100,
      rrrNoFocus,
      rrrNoFocusPct: Math.round(rrrNoFocus * 10000) / 100,
      hasCitySpecialty: cityName.toLowerCase() === (item.bonusCity || 'brecilien').toLowerCase() && cityName.toLowerCase() !== 'island',
      city: cityName,
      bonusCity: item.bonusCity || 'Brecilien',
    },
    focus: {
      useFocus,
      baseFocus,
      focusPerBatch,
      totalFocusUsed,
      silverPerFocus: 0,
    },
    materials: {
      upfrontCost: Math.round(upfrontCost * 100) / 100,
      netCost: Math.round(netCost * 100) / 100,
      breakdown,
    },
    fees: {
      nutritionPerBatch,
      totalNutrition: nutritionPerBatch * batchCount,
      stationFee: Math.round(stationFee * 100) / 100,
    },
    financials: {
      grossRevenue: Math.round(grossRevenue * 100) / 100,
      marketTaxes: Math.round(marketTaxes * 100) / 100,
      netRevenue: Math.round(netRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      profitPerBatch: Math.round(profitPerBatch * 100) / 100,
      profitPerUnit: Math.round(profitPerUnit * 100) / 100,
      profitMarginPct: Math.round(profitMarginPct * 100) / 100,
    },
  };
}
