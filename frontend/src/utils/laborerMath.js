import LABORER_DATA from '../data/laborerItems.json';

export const LABORERS = LABORER_DATA.laborers;
export const PROFESSIONS = LABORER_DATA.professions;
export const HOUSE_TIERS = LABORER_DATA.houseTiers;

export const LABORER_TYPES = [
  { id: 'all', label: 'All Professions' },
  { id: 'crafting', label: 'Refining & Crafting' },
  { id: 'gathering', label: 'Gatherers' },
  { id: 'mercenary', label: 'Mercenaries (Silver)' },
];

/**
 * Client-side fallback calculator for Laborers & Island Houses.
 */
export function computeLaborers({
  laborerId = 'blacksmith_t5',
  houseTier = 5,
  laborerCount = 3,
  hasBed = true,
  hasTable = true,
  trophiesCount = 3,
  hasPremium = true,
  isSellOrder = true,
  marketPrices = {},
}) {
  const itemDef = LABORERS.find((l) => l.id === laborerId) || LABORERS[0];
  const tier = itemDef.tier;
  const hTier = Math.max(2, Math.min(8, parseInt(houseTier) || Math.max(tier, 5)));
  const count = Math.max(1, parseInt(laborerCount) || 1);

  let happinessPct = 50.0;
  if (hasBed && hasTable) {
    const tierDiff = hTier - tier;
    const tierBonus = Math.max(0, tierDiff * 10.0);
    const trophyBonus = (parseInt(trophiesCount) || 0) * 5.0;
    const rawHappiness = 100.0 + tierBonus + trophyBonus;
    if (tier === 8 && hTier === 8) {
      happinessPct = Math.min(142.5 + ((parseInt(trophiesCount) || 0) * 1.5), 150.0);
    } else {
      happinessPct = Math.min(rawHappiness, 150.0);
    }
  }

  const yieldMultiplier = happinessPct / 100.0;
  const fullJid = itemDef.fullJournalId;
  const emptyJid = itemDef.emptyJournalId;

  const fullJPrice = parseFloat(marketPrices[fullJid]) || 25000;
  const emptyJPrice = parseFloat(marketPrices[emptyJid]) || 5000;

  const journalExpense = Math.round(count * fullJPrice);
  const emptyJournalRevenue = Math.round(count * emptyJPrice);

  let totalMaterialRevenue = 0;
  const returnedMaterials = (itemDef.returns || []).map((ret) => {
    const unitsPerLaborer = Math.round(ret.amount * yieldMultiplier * 100) / 100;
    const totalUnits = Math.round(unitsPerLaborer * count * 10) / 10;
    let unitPrice = 1.0;
    let matRev = 0;

    if (ret.item === 'SILVER') {
      unitPrice = 1.0;
      matRev = Math.round(totalUnits);
    } else {
      unitPrice = parseFloat(marketPrices[ret.item]) || 500;
      matRev = Math.round(totalUnits * unitPrice);
    }

    totalMaterialRevenue += matRev;
    return {
      item: ret.item,
      name: ret.name,
      icon: ret.icon,
      unitPrice,
      unitsPerLaborer,
      totalUnits,
      revenue: matRev,
    };
  });

  const grossRevenue = totalMaterialRevenue + emptyJournalRevenue;
  const taxRate = (hasPremium ? 0.04 : 0.08) + (isSellOrder ? 0.025 : 0.0);
  const marketTax = Math.round(grossRevenue * taxRate);

  const netProfit = grossRevenue - marketTax - journalExpense;
  const profitPerLaborer = Math.round((netProfit / count) * 100) / 100;
  const profitMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 10000) / 100 : 0;

  const laborersPerHouse = hTier >= 4 ? 3 : (hTier === 3 ? 2 : 1);
  const housesNeeded = Math.ceil(count / laborersPerHouse);

  return {
    laborer: itemDef,
    laborerCount: count,
    houseTier: hTier,
    housesNeeded,
    laborersPerHouse,
    happiness: {
      happinessPct: Math.round(happinessPct * 10) / 10,
      yieldMultiplier: Math.round(yieldMultiplier * 1000) / 1000,
      hasBed,
      hasTable,
      trophiesCount,
    },
    materials: returnedMaterials,
    finances: {
      materialRevenue: Math.round(totalMaterialRevenue),
      emptyJournalRevenue,
      grossRevenue,
      journalExpense,
      marketTax,
      netProfit,
      profitPerLaborer,
      profitMarginPct: profitMargin,
      monthlyProjectedNet: Math.round(netProfit * 30),
    }
  };
}
