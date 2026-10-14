/**
 * Black Market Arbitrage & Haul Calculations
 * Client-side fallback and transport risk formulas.
 */

export const MOUNT_WEIGHT_THRESHOLDS = [
  {
    maxWeight: 150,
    name: 'T4 Riding Horse / Swiftclaw',
    type: 'Fast, Agile Mobility',
    dangerRisk: 'Low Risk (Escape Agile)',
    badgeClass: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
    description: 'Light cargo allows quick dismount recoveries and high Gallop speed past gank squads.',
  },
  {
    maxWeight: 600,
    name: 'T5 Transport Ox / Spectral Direboar',
    type: 'Moderate Armored Transport',
    dangerRisk: 'Moderate Risk (Solid Armor & HP)',
    badgeClass: 'text-amber-400 bg-amber-950/60 border-amber-800',
    description: 'Good balance of capacity and passive survivability. Gankers will need purge and CC chains to dismount.',
  },
  {
    maxWeight: 1800,
    name: 'T7 Transport Ox / Grizzly Bear',
    type: 'Heavy Armor & CC Resistance',
    dangerRisk: 'Elevated Risk (Scouting Advised)',
    badgeClass: 'text-orange-400 bg-orange-950/60 border-orange-800',
    description: 'High health pool and Ursine CC immunity skill. Best traversed with a friend scouting one map ahead.',
  },
  {
    maxWeight: Infinity,
    name: 'T8 Transport Mammoth / Guild Caravan',
    type: 'Colossal Payload',
    dangerRisk: 'High Danger (Escort Required)',
    badgeClass: 'text-rose-400 bg-rose-950/60 border-rose-800',
    description: 'Massive target for Red Zone outlaw syndicates. Do not haul without full guild escort and scout team.',
  },
];

export function getRecommendedMount(totalWeightKg) {
  for (const t of MOUNT_WEIGHT_THRESHOLDS) {
    if (totalWeightKg <= t.maxWeight) {
      return t;
    }
  }
  return MOUNT_WEIGHT_THRESHOLDS[MOUNT_WEIGHT_THRESHOLDS.length - 1];
}

export function calculateClientHaul(items = []) {
  let totalCost = 0;
  let totalPayout = 0;
  let totalWeightKg = 0;

  const analyzedItems = items.map(entry => {
    const qty = Math.max(1, parseInt(entry.quantity || 1, 10));
    const costPerUnit = parseFloat(entry.cost || 0);
    const payoutPerUnit = parseFloat(entry.payout || 0);
    const weightPerUnit = parseFloat(entry.weightKg || 2.0);

    const subCost = Math.round(costPerUnit * qty);
    const subPayout = Math.round(payoutPerUnit * qty);
    const subProfit = subPayout - subCost;
    const subWeight = Math.round(weightPerUnit * qty * 10) / 10;

    totalCost += subCost;
    totalPayout += subPayout;
    totalWeightKg += subWeight;

    return {
      ...entry,
      quantity: qty,
      costPerUnit,
      payoutPerUnit,
      subtotalCost: subCost,
      subtotalPayout: subPayout,
      netProfit: subProfit,
      subtotalWeightKg: subWeight,
    };
  });

  const totalNetProfit = totalPayout - totalCost;
  const overallMarginPct = totalCost > 0 ? Math.round((totalNetProfit / totalCost) * 1000) / 10 : 0;
  const roundedTotalWeight = Math.round(totalWeightKg * 10) / 10;
  const mountInfo = getRecommendedMount(roundedTotalWeight);

  return {
    items: analyzedItems,
    totalCost,
    totalPayout,
    totalNetProfit,
    overallMarginPct,
    totalWeightKg: roundedTotalWeight,
    recommendedMount: mountInfo.name,
    dangerRisk: mountInfo.dangerRisk,
    mountInfo,
  };
}

export function formatSilver(val) {
  if (val === undefined || val === null) return '0';
  return Math.round(val).toLocaleString();
}
