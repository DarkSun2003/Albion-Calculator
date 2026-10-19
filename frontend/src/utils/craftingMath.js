import craftableItemsData from '../data/craftableItems.json';

export const CRAFTING_CATEGORIES = {
  accessories: { id: 'accessories', name: 'Accessories & Furniture', station: 'Toolmaker', icon: '🎒' },
  tools: { id: 'tools', name: 'Gathering Tools', station: 'Toolmaker', icon: '⛏️' },
  gathering: { id: 'gathering', name: 'Gathering Gear', station: 'Toolmaker', icon: '🥾' },
  warrior: { id: 'warrior', name: "Warrior's Forge", station: "Warrior's Forge", icon: '⚔️' },
  hunter: { id: 'hunter', name: "Hunter's Lodge", station: "Hunter's Lodge", icon: '🏹' },
  mage: { id: 'mage', name: "Mage's Tower", station: "Mage's Tower", icon: '🔮' },
  mounts: { id: 'mounts', name: 'Saddler & War Mounts', station: 'Saddler / Energy Manipulator', icon: '🐎' },
};

export const CITY_CRAFTING_BONUSES = {
  Thetford: ['maces', 'nature_staves', 'fire_staves', 'cloth_helmets', 'leather_armor'],
  'Fort Sterling': ['hammers', 'spears', 'holy_staves', 'plate_helmets', 'cloth_armor'],
  Lymhurst: ['swords', 'bows', 'arcane_staves', 'leather_helmets', 'leather_shoes'],
  Bridgewatch: ['crossbows', 'daggers', 'cursed_staves', 'plate_armor', 'cloth_shoes'],
  Martlock: ['axes', 'quarterstaffs', 'frost_staves', 'plate_shoes', 'shields', 'tomes', 'torches'],
  Caerleon: ['tools', 'gathering_gear', 'wargloves', 'shapeshifter', 'food'],
  Brecilien: ['bags', 'capes', 'potions'],
};

export const CRAFTING_FAME_PER_RESOURCE = {
  2: 7.5,
  3: 15.0,
  4: 22.5,
  5: 90.0,
  6: 270.0,
  7: 645.0,
  8: 1395.0,
};

export const JOURNAL_FAME_REQUIRED = {
  2: 900,
  3: 1800,
  4: 3600,
  5: 7200,
  6: 14400,
  7: 28380,
  8: 58590,
};

export const ARTIFACT_BASE_ITEM_VALUE = {
  Rune: 64,
  Soul: 192,
  Relic: 448,
  Tracking: 448,
  Avalonian: 960,
  Crystal: 960,
  Dragon: 448,
};

export const CRAFTABLE_ITEMS = craftableItemsData.map((it) => {
  const matCount = (it.primaryQty || 0) + (it.secondaryQty || 0);
  return {
    ...it,
    famePerUnit: Number((matCount * 22.5).toFixed(1)),
    baseItemValue: matCount * 16,
    baseFocus: Math.round(matCount * 53.59375),
  };
});

export function getArtifactQty(item, tier = 4) {
  if (!item || !item.isArtifact) return 0;
  const t = Number(tier);
  if (item.artifactQty) {
    if (typeof item.artifactQty === 'object') {
      return item.artifactQty[t] || item.artifactQty[String(t)] || 1;
    }
    return Number(item.artifactQty);
  }
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

/**
 * Simulates pass-by-pass crafting at a station starting from a player's on-hand material stack.
 * Computes Pass 1 crafts, bonus RRR crafts across subsequent passes, secondary materials needed,
 * artifacts required, journals filled, and leftover materials in bag.
 */
export function simulateCraftingFromMaterials({
  item,
  tier = 4,
  enchantment = 0,
  primaryHave = 0,
  secondaryHave = 0,
  constrainBySecondary = false,
  city = 'Lymhurst',
  useFocus = false,
  dailyBonusPct = 0,
}) {
  const t = Number(tier);
  const ench = Number(enchantment);
  const pQty = Math.max(1, Number(item?.primaryQty) || 1);
  const sQty = Math.max(0, Number(item?.secondaryQty) || 0);
  const rrr = getCraftingReturnRate(item, city, useFocus, dailyBonusPct);
  const isTransmutation = Boolean(item?.isNoReturn || item?.isRoyal);

  let remPrimary = Math.max(0, Math.floor(Number(primaryHave) || 0));
  let remSecondary = Math.max(0, Math.floor(Number(secondaryHave) || 0));

  let pass1Crafts = 0;
  let totalCrafts = 0;
  let secondaryTotalNeeded = 0;
  let simSecondaryBag = 0;
  const passes = [];

  let passIndex = 0;
  while (remPrimary >= pQty && passIndex < 50) {
    let craftsInPass = Math.floor(remPrimary / pQty);
    if (sQty > 0 && constrainBySecondary) {
      craftsInPass = Math.min(craftsInPass, Math.floor(remSecondary / sQty));
    }
    if (craftsInPass <= 0) break;

    passIndex += 1;
    if (passIndex === 1) {
      pass1Crafts = craftsInPass;
    }
    totalCrafts += craftsInPass;

    const pUsed = craftsInPass * pQty;
    const pReturned = isTransmutation ? 0 : Math.floor(pUsed * rrr);
    remPrimary = remPrimary - pUsed + pReturned;

    let sUsed = 0;
    let sReturned = 0;
    if (sQty > 0) {
      sUsed = craftsInPass * sQty;
      sReturned = isTransmutation ? 0 : Math.floor(sUsed * rrr);
      if (constrainBySecondary) {
        remSecondary = remSecondary - sUsed + sReturned;
      } else {
        if (simSecondaryBag < sUsed) {
          const shortfall = sUsed - simSecondaryBag;
          secondaryTotalNeeded += shortfall;
          simSecondaryBag += shortfall;
        }
        simSecondaryBag = simSecondaryBag - sUsed + sReturned;
      }
    }

    passes.push({
      pass: passIndex,
      crafts: craftsInPass,
      primaryUsed: pUsed,
      primaryReturned: pReturned,
      secondaryUsed: sUsed,
      secondaryReturned: sReturned,
    });

    if (pReturned <= 0) break;
  }

  const bonusRrrCrafts = Math.max(0, totalCrafts - pass1Crafts);
  const secondaryNeededPass1 = pass1Crafts * sQty;
  if (sQty > 0 && constrainBySecondary) {
    secondaryTotalNeeded = Math.max(0, Math.floor(Number(secondaryHave) || 0) - remSecondary);
  }
  const secondaryToBuyPass1 = Math.max(0, secondaryNeededPass1 - Math.max(0, Math.floor(Number(secondaryHave) || 0)));
  const secondaryToBuyTotal = Math.max(0, secondaryTotalNeeded - Math.max(0, Math.floor(Number(secondaryHave) || 0)));

  const artPerUnit = getArtifactQty(item, t);
  const artifactsPass1 = pass1Crafts * artPerUnit;
  const artifactsTotal = totalCrafts * artPerUnit;

  const matCount = pQty + sQty;
  const famePerRes = CRAFTING_FAME_PER_RESOURCE[t] || 22.5;
  const famePerUnit = isTransmutation ? 0 : matCount * famePerRes * Math.pow(2, ench);
  const fameReq = JOURNAL_FAME_REQUIRED[t] || 3600;
  const journalsFilledPass1 = (t >= 4 && !isTransmutation) ? Number(((famePerUnit * pass1Crafts) / fameReq).toFixed(2)) : 0;
  const journalsFilledTotal = (t >= 4 && !isTransmutation) ? Number(((famePerUnit * totalCrafts) / fameReq).toFixed(2)) : 0;

  const pass1PrimaryReturned = passes[0]?.primaryReturned || 0;
  const pass1SecondaryReturned = passes[0]?.secondaryReturned || 0;

  return {
    rrr,
    returnRatePct: Number((rrr * 100).toFixed(2)),
    pass1Crafts,
    bonusRrrCrafts,
    totalCrafts,
    passCount: passes.length,
    passes,
    pass1PrimaryReturned,
    pass1SecondaryReturned,
    leftoverPrimary: remPrimary,
    leftoverSecondary: constrainBySecondary ? remSecondary : simSecondaryBag,
    secondaryNeededPass1,
    secondaryTotalNeeded,
    secondaryToBuyPass1,
    secondaryToBuyTotal,
    artPerUnit,
    artifactsPass1,
    artifactsTotal,
    famePerUnit,
    fameReq,
    journalsFilledPass1,
    journalsFilledTotal,
    emptyJournalsToBuyPass1: Math.ceil(journalsFilledPass1),
    emptyJournalsToBuyTotal: Math.ceil(journalsFilledTotal),
  };
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
  const isTransmutation = Boolean(item.isNoReturn || item.isRoyal);
  const matCount = (item.primaryQty || 0) + (item.secondaryQty || 0);
  
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
  
  // Nutrition & Station Fee (Tier 2 and transmutations have 0 station fee in Albion Online)
  let stationFee = 0;
  if (t > 2 && !isTransmutation) {
    const resourceIv = (matCount * 16) * Math.pow(2, t - 4 + ench);
    const artifactIv = (hasArtifact && t >= 4)
      ? (ARTIFACT_BASE_ITEM_VALUE[item.artifactType] || 0) * Math.pow(2, t - 4)
      : 0;
    const totalIv = resourceIv + artifactIv;
    const nutrition = totalIv * 0.1125;
    stationFee = nutrition * ((stationTaxPer100 || 0) / 100.0) * qty;
  }
  
  // Journals (Crafting journals start at Tier 4 in Albion Online)
  let journalProfit = 0;
  let journalsFilled = 0;
  const famePerRes = CRAFTING_FAME_PER_RESOURCE[t] || 22.5;
  const famePerUnit = isTransmutation ? 0 : matCount * famePerRes * Math.pow(2, ench);
  const fameReq = JOURNAL_FAME_REQUIRED[t] || 3600;
  if (includeJournals && t >= 4 && item.journalName && !isTransmutation) {
    const totalFame = famePerUnit * qty;
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
  
  // Focus scaling (Base focus per resource = 10 * 1.75^(tier - 1 + ench), Spec = +280 eff/lvl)
  const baseFocus = (isTransmutation || t <= 2 || matCount <= 0)
    ? 0
    : matCount * 10.0 * Math.pow(1.75, t - 1 + ench);
  const m = Math.max(0, Math.min(100, Number(masteryLevel) || 0));
  const s = Math.max(0, Math.min(120, Number(specLevel) || 0));
  const efficiency = (m * 30) + (s * 280);
  const focusPerUnit = baseFocus <= 0 ? 0 : Math.max(1, Math.floor((baseFocus * Math.pow(0.5, efficiency / 10000.0)) + 0.5));
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
      famePerUnit: Math.round(famePerUnit),
      fameReq,
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
