import craftableItemsData from '../data/craftableItems.json';

export const CRAFTING_CATEGORIES = {
  accessories: { id: 'accessories', name: 'Accessories & Furniture', station: 'Toolmaker', icon: '🎒' },
  tools: { id: 'tools', name: 'Gathering Tools', station: 'Toolmaker', icon: '⛏️' },
  gathering: { id: 'gathering', name: 'Gathering Gear', station: 'Toolmaker', icon: '🥾' },
  warrior: { id: 'warrior', name: "Warrior's Forge", station: "Warrior's Forge", icon: '⚔️' },
  hunter: { id: 'hunter', name: "Hunter's Lodge", station: "Hunter's Lodge", icon: '🏹' },
  mage: { id: 'mage', name: "Mage's Tower", station: "Mage's Tower", icon: '🔮' },
};

export const CITY_CRAFTING_BONUSES = {
  Thetford: ['maces', 'nature_staves', 'fire_staves', 'cloth_helmets', 'leather_armor'],
  'Fort Sterling': ['hammers', 'spears', 'holy_staves', 'plate_helmets', 'cloth_armor', 'shields', 'tomes'],
  Lymhurst: ['swords', 'bows', 'arcane_staves', 'leather_helmets', 'leather_shoes', 'torches'],
  Bridgewatch: ['crossbows', 'daggers', 'cursed_staves', 'plate_armor', 'cloth_shoes'],
  Martlock: ['axes', 'quarterstaffs', 'frost_staves', 'plate_shoes', 'cloth_helmets'],
  Caerleon: ['tools', 'gathering_gear', 'wargloves', 'shapeshifter', 'food'],
  Brecilien: ['bags', 'capes', 'potions'],
};

export const CRAFTABLE_ITEMS = craftableItemsData;

export const JOURNAL_FAME_REQUIRED = {
  4: 900,
  5: 1800,
  6: 3600,
  7: 7200,
  8: 14400,
};

export function getArtifactQty(item, tier = 4) {
  if (!item || !item.isArtifact) return 0;
  const t = Number(tier);
  if (item.id === 'capeitem_avalon') {
    const avalonMap = { 4: 15, 5: 25, 6: 45, 7: 75, 8: 150 };
    return avalonMap[t] || 15;
  }
  if (item.isFactionCape) {
    const heartMap = { 4: 1, 5: 1, 6: 3, 7: 5, 8: 10 };
    return heartMap[t] || 1;
  }
  if (item.isRoyal) {
    if (item.sigilType === 'armor') {
      const armorMap = { 4: 4, 5: 8, 6: 16, 7: 16, 8: 16 };
      return armorMap[t] || 4;
    } else {
      const hsMap = { 4: 2, 5: 4, 6: 8, 7: 8, 8: 8 };
      return hsMap[t] || 2;
    }
  }
  return 1;
}

export function getCraftingReturnRate(item, city, useFocus = false, dailyBonusPct = 0) {
  if (item && (item.isNoReturn || item.isRoyal)) return 0.0;
  
  const isIsland = city.toLowerCase() === 'island';
  const baseBonus = isIsland ? 0.0 : 0.18;
  
  const bonuses = CITY_CRAFTING_BONUSES[city] || [];
  const hasSpecialty = item && item.bonusCity && (
    (item.subcategory && bonuses.includes(item.subcategory)) ||
    city.toLowerCase() === item.bonusCity.toLowerCase()
  );
  const specialtyBonus = hasSpecialty ? 0.15 : 0.0;
  
  const dailyBonus = (dailyBonusPct || 0) / 100.0;
  const focusBonus = useFocus ? 0.59 : 0.0;
  
  const totalBonus = baseBonus + specialtyBonus + dailyBonus + focusBonus;
  return totalBonus > 0 ? totalBonus / (1.0 + totalBonus) : 0.0;
}

export function computeCrafting({
  item,
  tier = 4,
  enchantment = 0,
  quantity = 1,
  primaryMatPrice = 0,
  secondaryMatPrice = 0,
  artifactPrice = 0,
  itemSellPrice = 0,
  city = 'Lymhurst',
  useFocus = false,
  dailyBonusPct = 0,
  stationTaxPer100 = 500,
  hasPremium = true,
  isSellOrder = true,
  includeJournals = false,
  emptyJournalPrice = 0,
  fullJournalPrice = 0,
  masteryLevel = 0,
  specLevel = 0,
}) {
  const qty = Math.max(1, Number(quantity) || 1);
  const t = Number(tier);
  const ench = Number(enchantment);
  
  // Return rates
  const rrrCurrent = getCraftingReturnRate(item, city, useFocus, dailyBonusPct);
  const rrrNoFocus = getCraftingReturnRate(item, city, false, dailyBonusPct);
  
  // Refined materials required
  const primaryGross = qty * (item.primaryQty || 0);
  const primaryConsumed = primaryGross * (1.0 - rrrCurrent);
  const primaryReturned = primaryGross * rrrCurrent;
  
  const secondaryGross = qty * (item.secondaryQty || 0);
  const secondaryConsumed = secondaryGross * (1.0 - rrrCurrent);
  const secondaryReturned = secondaryGross * rrrCurrent;
  
  // Artifact handling: In Albion Online, Artifacts are NEVER refunded by RRR!
  const hasArtifact = !!item.isArtifact;
  const artCountPerUnit = getArtifactQty(item, t);
  const artifactGrossCost = hasArtifact ? qty * artCountPerUnit * (Number(artifactPrice) || 0) : 0;
  
  const upfrontMaterials = (primaryGross * primaryMatPrice) + 
                           (secondaryGross * secondaryMatPrice) + 
                           artifactGrossCost;
                           
  const netMaterialsCost = (primaryConsumed * primaryMatPrice) + 
                          (secondaryConsumed * secondaryMatPrice) + 
                          artifactGrossCost;
  
  // Nutrition & Station Fee (Doubles per tier, T3 is 0.5x, T2 is 0.25x)
  const ivMultiplier = Math.pow(2, t - 4 + ench);
  const totalIv = (item.baseItemValue || 100) * ivMultiplier;
  const nutrition = totalIv * 0.1125;
  const stationFee = nutrition * ((stationTaxPer100 || 0) / 100.0) * qty;
  
  // Journals (Crafting journals start at Tier 4 in Albion Online)
  let journalProfit = 0;
  let journalsFilled = 0;
  if (includeJournals && t >= 4 && item.journalName) {
    const totalFame = (item.famePerUnit || 100) * ivMultiplier * qty;
    const fameReq = JOURNAL_FAME_REQUIRED[t] || 900;
    journalsFilled = Number((totalFame / fameReq).toFixed(2));
    const unitProfit = Math.max(0, fullJournalPrice - emptyJournalPrice);
    journalProfit = Math.round(journalsFilled * unitProfit);
  }
  
  // Financials
  const totalCost = netMaterialsCost + stationFee;
  const grossRevenue = qty * itemSellPrice;
  const taxRate = hasPremium ? 0.04 : 0.08;
  const setupFee = isSellOrder ? 0.025 : 0.0;
  const marketTaxes = grossRevenue * (taxRate + setupFee);
  const netRevenue = grossRevenue - marketTaxes + journalProfit;
  
  const netProfit = netRevenue - totalCost;
  const marginPct = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  const profitPerUnit = qty > 0 ? netProfit / qty : 0;
  
  // Focus scaling
  const isTransmutation = Boolean(item.isNoReturn || item.isRoyal);
  const baseFocus = isTransmutation ? 0 : (item.baseFocus || 100) * ivMultiplier;
  const m = Math.max(0, Math.min(100, Number(masteryLevel) || 0));
  const s = Math.max(0, Math.min(100, Number(specLevel) || 0));
  const efficiency = (m * 30) + (s * 250);
  const focusPerUnit = isTransmutation ? 0 : Math.max(1, Math.floor(baseFocus * Math.pow(0.5, efficiency / 10000.0)));
  const totalFocus = useFocus ? focusPerUnit * qty : 0;
  
  // Profit without focus
  const costNoFocus = (primaryGross * (1.0 - rrrNoFocus) * primaryMatPrice) +
                      (secondaryGross * (1.0 - rrrNoFocus) * secondaryMatPrice) +
                      artifactGrossCost +
                      stationFee;
  const profitNoFocus = netRevenue - costNoFocus;
  const silverPerFocus = (useFocus && totalFocus > 0) ? (netProfit - profitNoFocus) / totalFocus : 0;
  
  return {
    item,
    tier: t,
    enchantment: ench,
    quantity: qty,
    city,
    isBonusCity: item.bonusCity ? city.toLowerCase() === item.bonusCity.toLowerCase() : false,
    useFocus,
    returnRatePct: Number((rrrCurrent * 100).toFixed(2)),
    focusPerUnit,
    totalFocusNeeded: totalFocus,
    silverPerFocus: Number(silverPerFocus.toFixed(2)),
    materials: {
      primaryGross,
      primaryConsumed: Number(primaryConsumed.toFixed(1)),
      primaryReturned: Number(primaryReturned.toFixed(1)),
      secondaryGross,
      secondaryConsumed: Number(secondaryConsumed.toFixed(1)),
      secondaryReturned: Number(secondaryReturned.toFixed(1)),
      hasArtifact,
      artifactGrossCost: Math.round(artifactGrossCost),
    },
    journals: {
      included: includeJournals,
      journalsFilled,
      journalProfit,
    },
    financials: {
      upfrontMaterials: Math.round(upfrontMaterials),
      stationFee: Math.round(stationFee),
      totalCost: Math.round(totalCost),
      grossRevenue: Math.round(grossRevenue),
      marketTaxes: Math.round(marketTaxes),
      netRevenue: Math.round(netRevenue),
      netProfit: Math.round(netProfit),
      profitPerUnit: Math.round(profitPerUnit),
      marginPct: Number(marginPct.toFixed(2)),
    }
  };
}
