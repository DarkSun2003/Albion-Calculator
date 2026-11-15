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
  generalistTrophies = 0,
  hasPremium = true,
  isSellOrder = true,
  marketPrices = {},
}) {
  const itemDef = LABORERS.find((l) => l.id === laborerId) || LABORERS[0];
  const tier = itemDef.tier;
  const hTier = Math.max(2, Math.min(8, parseInt(houseTier) || Math.max(tier, 5)));
  const count = Math.max(1, parseInt(laborerCount) || 1);
  const profTrophies = Math.max(0, Math.min(7, parseInt(trophiesCount) || 0));
  const genTrophies = Math.max(0, Math.min(5, parseInt(generalistTrophies) || 0));

  let happinessPct = 50.0;
  if (hasBed && hasTable) {
    if (hTier > tier) {
      happinessPct = 150.0;
    } else {
      const trophyBonus = (profTrophies * 5.0) + (genTrophies * 2.5);
      const rawHappiness = 100.0 + trophyBonus;
      const maxCap = (tier === 8 && hTier === 8) ? 142.5 : 150.0;
      happinessPct = Math.min(rawHappiness, maxCap);
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
  let taxableMaterialRevenue = 0;
  const returnedMaterials = (itemDef.returns || []).map((ret) => {
    const unitsPerLaborer = Math.round(ret.amount * yieldMultiplier * 100) / 100;
    const totalUnits = Math.round(unitsPerLaborer * count * 100) / 100;
    const isEnchantableReturn = (
      tier >= 4
      && ret.item !== 'SILVER'
      && !ret.item.includes('ROCK')
      && !ret.item.includes('FISH')
    );

    let unitPrice = 1.0;
    let matRev = 0;

    if (ret.item === 'SILVER') {
      unitPrice = 1.0;
      matRev = Math.round(totalUnits);
    } else {
      const p0 = parseFloat(marketPrices[ret.item]) || 500;
      if (isEnchantableReturn) {
        const p1 = parseFloat(marketPrices[`${ret.item}_LEVEL1@1`] || marketPrices[`${ret.item}@1`]) || p0;
        const p2 = parseFloat(marketPrices[`${ret.item}_LEVEL2@2`] || marketPrices[`${ret.item}@2`]) || p0;
        const p3 = parseFloat(marketPrices[`${ret.item}_LEVEL3@3`] || marketPrices[`${ret.item}@3`]) || p0;
        unitPrice = Math.round(((0.9445 * p0) + (0.05 * p1) + (0.005 * p2) + (0.0005 * p3)) * 100) / 100;
      } else {
        unitPrice = p0;
      }
      matRev = Math.round(totalUnits * unitPrice);
      taxableMaterialRevenue += matRev;
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
      hasEnchantedSplit: isEnchantableReturn,
    };
  });

  const grossRevenue = totalMaterialRevenue + emptyJournalRevenue;
  const taxRate = (hasPremium ? 0.04 : 0.08) + (isSellOrder ? 0.025 : 0.0);
  const taxableGrossRevenue = taxableMaterialRevenue + emptyJournalRevenue;
  const marketTax = Math.round(taxableGrossRevenue * taxRate);

  const netProfit = grossRevenue - marketTax - journalExpense;
  const profitPerLaborer = Math.round((netProfit / count) * 100) / 100;
  const profitMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 10000) / 100 : 0;

  const laborersPerHouse = hTier >= 5 ? 3 : (hTier >= 3 ? 2 : 1);
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
      trophiesCount: profTrophies,
      generalistTrophies: genTrophies,
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
