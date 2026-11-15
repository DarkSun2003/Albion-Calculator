import craftableItemsData from '../data/craftableItems.json';
import { computeTotalRrr } from './albionMath';

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
  2: 1.5,
  3: 7.5,
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
    famePerUnit: it.famePerUnit !== undefined && it.famePerUnit !== null ? it.famePerUnit : Number((matCount * 22.5).toFixed(1)),
    baseItemValue: it.baseItemValue !== undefined && it.baseItemValue !== null ? it.baseItemValue : matCount * 16,
    baseFocus: it.baseFocus !== undefined && it.baseFocus !== null ? it.baseFocus : Math.round(matCount * 53.59375),
    destinyFactor: Number(it.destinyFactor) || 1.0,
    focusByTier: it.focusByTier || {},
    artifactItemValue: Number(it.artifactItemValue) || 0,
    artifactItemValueByTier: it.artifactItemValueByTier || {},
    primaryNoReturn: Boolean(it.primaryNoReturn),
    secondaryNoReturn: Boolean(it.secondaryNoReturn),
    artifactNoReturn: it.artifactNoReturn === undefined || it.artifactNoReturn === null ? true : Boolean(it.artifactNoReturn),
    primaryQtyByTier: it.primaryQtyByTier || null,
    secondaryQtyByTier: it.secondaryQtyByTier || null,
    extraMaterials: Array.isArray(it.extraMaterials) ? it.extraMaterials : [],
  };
});

function resolveTierQty(byTier, defaultQty, tier) {
  const t = Number(tier);
  if (byTier && (byTier[String(t)] !== undefined || byTier[t] !== undefined)) {
    return Number(byTier[String(t)] ?? byTier[t]) || 0;
  }
  return Number(defaultQty) || 0;
}

export function getPrimaryQty(item, tier = 4) {
  if (!item) return 0;
  return resolveTierQty(item.primaryQtyByTier, item.primaryQty, tier);
}

export function getSecondaryQty(item, tier = 4) {
  if (!item) return 0;
  return resolveTierQty(item.secondaryQtyByTier, item.secondaryQty, tier);
}

export function resolveExtraMaterials(item, tier = 4) {
  if (!item || !Array.isArray(item.extraMaterials)) return [];
  const t = Number(tier);
  return item.extraMaterials
    .map((ex, idx) => {
      const id = ex.id || `extra_${idx}`;
      const tierSpec = ex.byTier ? (ex.byTier[String(t)] ?? ex.byTier[t]) : null;
      const rawTmpl = (tierSpec && tierSpec.template) || ex.template || '';
      const template = rawTmpl.includes('{tier}') ? rawTmpl.replace(/\{tier\}/g, String(t)) : rawTmpl;
      const name = (tierSpec && tierSpec.name) || ex.name || id;
      const qty = Number((tierSpec && tierSpec.qty !== undefined) ? tierSpec.qty : ex.qty) || 0;
      const noReturn = Boolean((tierSpec && tierSpec.noReturn !== undefined) ? tierSpec.noReturn : ex.noReturn);
      const isRefinedResource = ex.isRefinedResource !== undefined ? Boolean(ex.isRefinedResource) : !noReturn;
      return { id, name, template, qty, noReturn, isRefinedResource };
    })
    .filter((ex) => ex.qty > 0 && ex.template);
}

/**
 * Returns exact Destiny Board FCE and Quality rates per level (0-100):
 * { masteryFce, ownFce, mutualFce, masteryQ, ownQ, mutualQ }
 */
export function getCraftingSpecRates(itemDef) {
  if (!itemDef) {
    return { masteryFce: 30, ownFce: 280, mutualFce: 120, masteryQ: 0.75, ownQ: 6.75, mutualQ: 3.0 };
  }
  const cat = String(itemDef.category || '').toLowerCase();
  const sub = String(itemDef.subcategory || '').toLowerCase();
  const id = String(itemDef.id || '').toLowerCase();
  const isArt = Boolean(itemDef.isArtifact);

  if (cat === 'mounts' || sub === 'furniture' || sub === 'siege_banners') {
    return { masteryFce: 0, ownFce: 0, mutualFce: 0, masteryQ: 0, ownQ: 0, mutualQ: 0 };
  }
  if (sub === 'tools') {
    if (id === '2h_tool_siegehammer' || id === '2h_tool_siegehammer_avalon') {
      return { masteryFce: 30, ownFce: 370, mutualFce: 0, masteryQ: 0.75, ownQ: 9.05, mutualQ: 0 };
    }
    return { masteryFce: 0, ownFce: 310, mutualFce: 90, masteryQ: 0, ownQ: 7.5, mutualQ: 2.25 };
  }
  if (sub === 'gathering_gear') {
    return { masteryFce: 60, ownFce: 280, mutualFce: 60, masteryQ: 1.5, ownQ: 6.75, mutualQ: 1.5 };
  }
  if (sub === 'capes') {
    return { masteryFce: 30, ownFce: 370, mutualFce: 0, masteryQ: 0.75, ownQ: 9.0, mutualQ: 0 };
  }
  if (sub === 'bags') {
    if (id === 'bag_insight') {
      return { masteryFce: 30, ownFce: 340, mutualFce: 0, masteryQ: 0.75, ownQ: 8.25, mutualQ: 0 };
    }
    return { masteryFce: 30, ownFce: 340, mutualFce: 30, masteryQ: 0.75, ownQ: 8.3, mutualQ: 0.75 };
  }
  if (sub === 'shields' || sub === 'tomes' || sub === 'torches') {
    return isArt
      ? { masteryFce: 30, ownFce: 265, mutualFce: 135, masteryQ: 0.75, ownQ: 6.375, mutualQ: 3.425 }
      : { masteryFce: 30, ownFce: 340, mutualFce: 60, masteryQ: 0.75, ownQ: 8.3, mutualQ: 1.5 };
  }
  if (sub === 'leather_armor' || sub === 'leather_helmets' || sub === 'leather_shoes') {
    return !isArt || id.includes('_fey')
      ? { masteryFce: 30, ownFce: 280, mutualFce: 165, masteryQ: 0.75, ownQ: 6.75, mutualQ: 4.125 }
      : { masteryFce: 30, ownFce: 262.5, mutualFce: 182.5, masteryQ: 0.75, ownQ: 6.3125, mutualQ: 4.5625 };
  }
  if (
    sub === 'plate_armor' || sub === 'plate_helmets' || sub === 'plate_shoes' ||
    sub === 'cloth_armor' || sub === 'cloth_helmets' || sub === 'cloth_shoes'
  ) {
    return !isArt || id.includes('_fey')
      ? { masteryFce: 30, ownFce: 280, mutualFce: 165, masteryQ: 0.75, ownQ: 6.75, mutualQ: 4.125 }
      : { masteryFce: 30, ownFce: 265, mutualFce: 180, masteryQ: 0.75, ownQ: 6.375, mutualQ: 4.5 };
  }
  return isArt
    ? { masteryFce: 30, ownFce: 265, mutualFce: 135, masteryQ: 0.75, ownQ: 6.375, mutualQ: 3.375 }
    : { masteryFce: 30, ownFce: 280, mutualFce: 120, masteryQ: 0.75, ownQ: 6.75, mutualQ: 3.0 };
}

export function calculateCraftingFocus({
  item,
  matCount = 0,
  tier = 4,
  enchantment = 0,
  masteryLevel = 0,
  specLevel = 0,
  otherSpecAvg = 0,
}) {
  const t = Number(tier);
  const ench = Number(enchantment);
  if (t < 2) return 0;

  const focusMap = item?.focusByTier || {};
  const baseT = focusMap[String(t)] ?? focusMap[t];
  let baseCost = 0;
  if (baseT !== undefined && baseT !== null && Number(baseT) > 0) {
    baseCost = Number(baseT) * Math.pow(1.75, ench);
  } else if (matCount > 0) {
    baseCost = matCount * 10.0 * Math.pow(1.75, t - 1 + ench);
  }
  if (baseCost <= 0) return 0;

  const m = Math.max(0, Math.min(100, Number(masteryLevel) || 0));
  const s = Math.max(0, Math.min(100, Number(specLevel) || 0));
  const o = Math.max(0, Math.min(100, Number(otherSpecAvg) || 0));
  const rates = getCraftingSpecRates(item);
  const efficiency = (m * rates.masteryFce) + (s * rates.ownFce) + (o * rates.mutualFce);
  const actualFocus = baseCost * Math.pow(0.5, efficiency / 10000.0);
  return Math.max(1, Math.floor(actualFocus + 0.5));
}

export function getArtifactQty(item, tier = 4) {
  if (!item || !item.isArtifact) return 0;
  const t = Number(tier);
  if (item.artifactQty !== undefined && item.artifactQty !== null) {
    if (typeof item.artifactQty === 'object') {
      return item.artifactQty[t] || item.artifactQty[String(t)] || 1;
    }
    return Number(item.artifactQty);
  }
  if (item.id === 'capeitem_avalon') {
    const avalonMap = { 4: 15, 5: 15, 6: 45, 7: 75, 8: 150 };
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

export function getCraftingReturnRate(item, city, useFocus = false, dailyBonusPct = 0, hoOptions = {}) {
  if (item && (item.isNoReturn || item.isRoyal)) return 0.0;

  const isIsland = city.toLowerCase() === 'island';
  const baseBonus = isIsland ? 0.0 : 0.18;

  const bonuses = CITY_CRAFTING_BONUSES[city] || [];
  const hasSpecialty = item && item.bonusCity && (
    (item.subcategory && bonuses.includes(item.subcategory)) ||
    city.toLowerCase() === item.bonusCity.toLowerCase()
  );
  const specialtyBonus = hasSpecialty ? 0.15 : 0.0;

  return computeTotalRrr({
    baseCityBonus: baseBonus,
    citySpecialtyBonus: specialtyBonus,
    dailyBonusPct,
    useFocus,
    specialtyMode: 'crafting',
    ...hoOptions,
  });
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
  locationMode = 'city',
  hoPowerLevel = 1,
  hoZoneQuality = 1,
  hoHasSpecialty = false,
  hoCustomBonusPct = null,
}) {
  const t = Number(tier);
  const ench = Number(enchantment);
  const pQty = Math.max(1, getPrimaryQty(item, t) || 1);
  const sQty = Math.max(0, getSecondaryQty(item, t) || 0);
  const extras = resolveExtraMaterials(item, t);
  const rrr = getCraftingReturnRate(item, city, useFocus, dailyBonusPct, {
    locationMode,
    hoPowerLevel,
    hoZoneQuality,
    hoHasSpecialty,
    hoCustomBonusPct,
  });
  const isTransmutation = Boolean(item?.isNoReturn || item?.isRoyal);
  const primaryNoRet = isTransmutation || Boolean(item?.primaryNoReturn);
  const secondaryNoRet = isTransmutation || Boolean(item?.secondaryNoReturn);

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
    const pReturned = primaryNoRet ? 0 : Math.floor(pUsed * rrr);
    remPrimary = remPrimary - pUsed + pReturned;

    let sUsed = 0;
    let sReturned = 0;
    if (sQty > 0) {
      sUsed = craftsInPass * sQty;
      sReturned = secondaryNoRet ? 0 : Math.floor(sUsed * rrr);
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

  const extraMaterialsSim = extras.map((ex) => {
    const exNoRet = isTransmutation || ex.noReturn;
    let totalNeeded = 0;
    let bag = 0;
    let pass1Ret = 0;
    for (let i = 0; i < passes.length; i++) {
      const needed = passes[i].crafts * ex.qty;
      if (bag < needed) {
        const shortfall = needed - bag;
        totalNeeded += shortfall;
        bag += shortfall;
      }
      const ret = exNoRet ? 0 : Math.floor(needed * rrr);
      if (i === 0) pass1Ret = ret;
      bag = bag - needed + ret;
    }
    return {
      id: ex.id,
      name: ex.name,
      template: ex.template,
      qtyPerUnit: ex.qty,
      noReturn: exNoRet,
      neededPass1: pass1Crafts * ex.qty,
      totalNeeded,
      pass1Returned: pass1Ret,
    };
  });

  const refinedIvMatCount =
    (primaryNoRet ? 0 : pQty) +
    (secondaryNoRet ? 0 : sQty) +
    extras.reduce((sum, ex) => sum + (ex.isRefinedResource ? ex.qty : 0), 0);
  const famePerRes = CRAFTING_FAME_PER_RESOURCE[t] || 22.5;
  const destinyFactor = Number(item?.destinyFactor) || 1.0;
  const famePerUnit = isTransmutation ? 0 : refinedIvMatCount * famePerRes * Math.pow(2, ench) * destinyFactor;
  const fameReq = JOURNAL_FAME_REQUIRED[t] || 3600;
  const journalsFilledPass1 = (t >= 4 && !isTransmutation) ? Number(((famePerUnit * pass1Crafts) / fameReq).toFixed(2)) : 0;
  const journalsFilledTotal = (t >= 4 && !isTransmutation) ? Number(((famePerUnit * totalCrafts) / fameReq).toFixed(2)) : 0;

  const pass1PrimaryReturned = passes[0]?.primaryReturned || 0;
  const pass1SecondaryReturned = passes[0]?.secondaryReturned || 0;

  return {
    rrr,
    returnRatePct: Number((rrr * 100).toFixed(2)),
    primaryQtyPerUnit: pQty,
    secondaryQtyPerUnit: sQty,
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
    extraMaterials: extraMaterialsSim,
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
  otherSpecAvg = 0,
  locationMode = 'city',
  hoPowerLevel = 1,
  hoZoneQuality = 1,
  hoHasSpecialty = false,
  hoCustomBonusPct = null,
  extraMatPrices = {},
}) {
  const qty = Math.max(1, Number(quantity) || 1);
  const t = Number(tier);
  const ench = Number(enchantment);
  const isTransmutation = Boolean(item.isNoReturn || item.isRoyal);
  const pQty = getPrimaryQty(item, t);
  const sQty = getSecondaryQty(item, t);
  const extras = resolveExtraMaterials(item, t);

  const hoOptions = {
    locationMode,
    hoPowerLevel,
    hoZoneQuality,
    hoHasSpecialty,
    hoCustomBonusPct,
  };

  // Return rates
  const rrrCurrent = getCraftingReturnRate(item, city, useFocus, dailyBonusPct, hoOptions);
  const rrrNoFocus = getCraftingReturnRate(item, city, false, dailyBonusPct, hoOptions);

  const primaryNoRet = isTransmutation || Boolean(item.primaryNoReturn);
  const secondaryNoRet = isTransmutation || Boolean(item.secondaryNoReturn);
  const artNoRet = isTransmutation || (item.artifactNoReturn === undefined || item.artifactNoReturn === null ? true : Boolean(item.artifactNoReturn));

  // Refined materials required (respect per-slot non-returnable materials such as grown mounts/remains)
  const primaryGross = qty * pQty;
  const primaryRrr = primaryNoRet ? 0.0 : rrrCurrent;
  const primaryConsumed = primaryGross * (1.0 - primaryRrr);
  const primaryReturned = primaryGross * primaryRrr;

  const secondaryGross = qty * sQty;
  const secondaryRrr = secondaryNoRet ? 0.0 : rrrCurrent;
  const secondaryConsumed = secondaryGross * (1.0 - secondaryRrr);
  const secondaryReturned = secondaryGross * secondaryRrr;

  // Artifact handling (artifacts have RRR=0 unless explicitly returnable)
  const hasArtifact = !!item.isArtifact;
  const artCountPerUnit = getArtifactQty(item, t);
  const artifactGross = hasArtifact ? qty * artCountPerUnit : 0;
  const artifactRrr = (!hasArtifact || artNoRet) ? 0.0 : rrrCurrent;
  const artifactConsumed = artifactGross * (1.0 - artifactRrr);
  const artifactReturned = artifactGross * artifactRrr;
  const artUnitPrice = Number(artifactPrice) || 0;
  const artifactGrossCost = artifactGross * artUnitPrice;
  const artifactNetCost = artifactConsumed * artUnitPrice;

  // Extra 4th/5th material slots (e.g. Animal Remains on Shapeshifter Staves, Cloth on Armored Horse, Leather/Planks on Siege Ballista)
  const extraPriceMap = extraMatPrices || {};
  let extraGrossTotalCost = 0;
  let extraNetTotalCost = 0;
  let extraNfTotalCost = 0;
  const extraMaterialsOut = extras.map((ex) => {
    const unitPrice = Number(extraPriceMap[ex.id] ?? extraPriceMap[ex.template] ?? 0) || 0;
    const exNoRet = isTransmutation || Boolean(ex.noReturn);
    const gross = qty * ex.qty;
    const exRrr = exNoRet ? 0.0 : rrrCurrent;
    const consumed = gross * (1.0 - exRrr);
    const returned = gross * exRrr;
    const grossCost = gross * unitPrice;
    const netCost = consumed * unitPrice;
    const exRrrNf = exNoRet ? 0.0 : rrrNoFocus;
    const consumedNf = gross * (1.0 - exRrrNf);
    extraGrossTotalCost += grossCost;
    extraNetTotalCost += netCost;
    extraNfTotalCost += consumedNf * unitPrice;
    return {
      id: ex.id,
      name: ex.name,
      template: ex.template,
      qtyPerUnit: ex.qty,
      noReturn: exNoRet,
      isRefinedResource: ex.isRefinedResource,
      unitPrice: Number(unitPrice.toFixed(2)),
      gross,
      consumed: Number(consumed.toFixed(1)),
      returned: Number(returned.toFixed(1)),
      grossCost: Number(grossCost.toFixed(2)),
      netCost: Number(netCost.toFixed(2)),
    };
  });

  const upfrontMaterials = (primaryGross * primaryMatPrice) +
                           (secondaryGross * secondaryMatPrice) +
                           artifactGrossCost +
                           extraGrossTotalCost;

  const netMaterialsCost = (primaryConsumed * primaryMatPrice) +
                          (secondaryConsumed * secondaryMatPrice) +
                          artifactNetCost +
                          extraNetTotalCost;

  // Refined resources only contribute to Item Value & Craft Fame (grown mounts & remains contribute 0 IV / 0 fame)
  const refinedIvMatCount =
    (primaryNoRet ? 0 : pQty) +
    (secondaryNoRet ? 0 : sQty) +
    extras.reduce((sum, ex) => sum + (ex.isRefinedResource ? ex.qty : 0), 0);

  // Nutrition & Station Fee (Tier 2 and transmutations have 0 station fee in Albion Online)
  let stationFee = 0;
  if (t > 2 && !isTransmutation) {
    const resourceIv = (refinedIvMatCount * 16) * Math.pow(2, t - 4 + ench);
    const artIvByTier = item.artifactItemValueByTier || {};
    let artifactIv = 0;
    if (hasArtifact && t >= 4) {
      if (artIvByTier[String(t)] !== undefined || artIvByTier[t] !== undefined) {
        artifactIv = Number(artIvByTier[String(t)] ?? artIvByTier[t]) || 0;
      } else if ((Number(item.artifactItemValue) || 0) > 0) {
        artifactIv = Number(item.artifactItemValue) * Math.pow(2, t - 4);
      } else {
        artifactIv = (ARTIFACT_BASE_ITEM_VALUE[item.artifactType] || 0) * Math.pow(2, t - 4);
      }
    }
    const totalIv = resourceIv + artifactIv;
    const nutrition = totalIv * 0.1125;
    stationFee = nutrition * ((stationTaxPer100 || 0) / 100.0) * qty;
  }

  // Journals (Crafting journals start at Tier 4 in Albion Online; scaled by destinyFactor)
  let journalProfit = 0;
  let journalsFilled = 0;
  const destinyFactor = Number(item.destinyFactor) || 1.0;
  const famePerRes = CRAFTING_FAME_PER_RESOURCE[t] || 22.5;
  const famePerUnit = isTransmutation ? 0 : refinedIvMatCount * famePerRes * Math.pow(2, ench) * destinyFactor;
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

  // Focus scaling (category-specific FCE rates across mastery, item spec, and mutual specs)
  const focusPerUnit = isTransmutation ? 0 : calculateCraftingFocus({
    item,
    matCount: refinedIvMatCount,
    tier: t,
    enchantment: ench,
    masteryLevel,
    specLevel,
    otherSpecAvg,
  });
  const totalFocus = useFocus ? focusPerUnit * qty : 0;

  // Profit without focus
  const primaryRrrNf = primaryNoRet ? 0.0 : rrrNoFocus;
  const secondaryRrrNf = secondaryNoRet ? 0.0 : rrrNoFocus;
  const artifactRrrNf = (!hasArtifact || artNoRet) ? 0.0 : rrrNoFocus;
  const costNoFocus = (primaryGross * (1.0 - primaryRrrNf) * primaryMatPrice) +
                      (secondaryGross * (1.0 - secondaryRrrNf) * secondaryMatPrice) +
                      (artifactGross * (1.0 - artifactRrrNf) * artUnitPrice) +
                      extraNfTotalCost +
                      stationFee;
  const profitNoFocus = netRevenue - costNoFocus;
  const silverPerFocus = (useFocus && totalFocus > 0) ? (netProfit - profitNoFocus) / totalFocus : 0;

  return {
    item,
    tier: t,
    enchantment: ench,
    quantity: qty,
    city,
    locationMode,
    isBonusCity: String(locationMode || 'city').toLowerCase() !== 'hideout' && item.bonusCity ? city.toLowerCase() === item.bonusCity.toLowerCase() : false,
    useFocus,
    returnRatePct: Number((rrrCurrent * 100).toFixed(2)),
    focusPerUnit,
    totalFocusNeeded: totalFocus,
    silverPerFocus: Number(silverPerFocus.toFixed(2)),
    materials: {
      primaryQtyPerUnit: pQty,
      primaryGross,
      primaryConsumed: Number(primaryConsumed.toFixed(1)),
      primaryReturned: Number(primaryReturned.toFixed(1)),
      secondaryQtyPerUnit: sQty,
      secondaryGross,
      secondaryConsumed: Number(secondaryConsumed.toFixed(1)),
      secondaryReturned: Number(secondaryReturned.toFixed(1)),
      hasArtifact,
      artifactGross,
      artifactConsumed: Number(artifactConsumed.toFixed(1)),
      artifactReturned: Number(artifactReturned.toFixed(1)),
      artifactGrossCost: Math.round(artifactGrossCost),
      extraMaterials: extraMaterialsOut,
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
