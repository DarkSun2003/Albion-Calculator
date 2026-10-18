import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Sparkles, 
  Layers, 
  RotateCcw, 
  AlertCircle, 
  Building,
  CheckCircle,
  HelpCircle,
  ExternalLink,
  Truck,
  Zap
} from 'lucide-react';
import { RESOURCES } from '../utils/albionMath';

export default function LedgerResults({ 
  calculation, 
  isBackendConnected = true, 
  isBackendCalculating = false 
}) {
  if (!calculation) return null;

  const {
    resourceType,
    tier,
    enchantment,
    quantity,
    outputQuantity,
    city,
    isBonusCity,
    opportunityCost,
    useFocus,
    returnRatePct,
    returnRateNoFocusPct,
    focusPerUnit,
    totalFocusNeeded,
    silverPerFocus,
    materials,
    financials,
  } = calculation;

  const res = RESOURCES[resourceType];
  const isProfitable = financials.netProfit > 0;

  // Silver per focus badge color
  let spfColor = 'text-slate-400 bg-slate-800/50 border-slate-700';
  let spfLabel = 'Standard';
  if (silverPerFocus > 60) {
    spfColor = 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30';
    spfLabel = 'High Value';
  } else if (silverPerFocus > 30) {
    spfColor = 'text-amber-300 bg-amber-500/15 border-amber-500/30';
    spfLabel = 'Good Value';
  } else if (silverPerFocus > 0) {
    spfColor = 'text-sky-300 bg-sky-500/15 border-sky-500/30';
    spfLabel = 'Modest';
  }

  return (
    <div className="space-y-5">
      {/* 1. Main Profit Header Card: Royal Verdict Tablet */}
      <div className={`forged-tablet p-5 sm:p-6 shadow-2xl relative overflow-hidden transition-all ${
        isProfitable
          ? 'border-2 border-emerald-500/60 bg-gradient-to-b from-[#061811]/90 via-[#0a0f18]/95 to-[#0b1320] shadow-[0_10px_35px_rgba(16,185,129,0.15)]'
          : 'border-2 border-rose-500/60 bg-gradient-to-b from-[#18080a]/90 via-[#0f090d]/95 to-[#0b1320] shadow-[0_10px_35px_rgba(244,63,94,0.15)]'
      }`}>
        {/* Subtle top edge glow */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${
          isProfitable ? 'via-emerald-400/80' : 'via-rose-400/80'
        } to-transparent`} />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                Stage 05
              </span>
              <span className="text-xs uppercase tracking-wider font-serif font-bold text-slate-300">
                Net Batch Profit &amp; Valuation
              </span>
              <span 
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                  isBackendConnected
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                }`}
                title={isBackendConnected ? "Authoritative calculation computed by Django backend API" : "Using local client fallback math"}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isBackendCalculating ? 'bg-sky-400 animate-ping' : (isBackendConnected ? 'bg-emerald-400' : 'bg-amber-400')
                }`} />
                <span>{isBackendCalculating ? 'Django Engine...' : (isBackendConnected ? 'Django Authoritative' : 'Local Fallback')}</span>
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                isProfitable 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]' 
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {financials.marginPct >= 0 ? `+${financials.marginPct}%` : `${financials.marginPct}%`} Margin
              </span>
            </div>

            <div className="flex items-baseline gap-2.5">
              <h2 className={`font-mono text-3xl sm:text-4xl font-extrabold tracking-tight drop-shadow ${
                isProfitable ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {financials.netProfit >= 0 ? '+' : ''}{financials.netProfit.toLocaleString()}
              </h2>
              <span className="font-mono text-sm text-amber-400/80 font-bold">silver</span>
            </div>

            <p className="text-xs text-slate-300 font-sans mt-1">
              Profit per refined item:{' '}
              <span className={`font-mono font-bold ${financials.profitPerUnit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {financials.profitPerUnit >= 0 ? '+' : ''}{financials.profitPerUnit.toLocaleString()} silver
              </span>
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap gap-2.5">
            {/* Resource Return Rate */}
            <div className="bg-[#080d16] border border-[#1e2a3c] rounded-xl p-3 text-center min-w-[105px] shadow-inner">
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400 block">
                Resource Return
              </span>
              <span className="font-mono text-lg sm:text-xl font-extrabold text-sky-400 block mt-0.5">
                {returnRatePct}%
              </span>
              <span className="text-[9px] font-mono text-slate-400 block">
                {useFocus ? 'with Focus' : 'no Focus'}
              </span>
            </div>

            {/* Silver Per Focus */}
            {useFocus && totalFocusNeeded > 0 && (
              <div className={`border rounded-xl p-3 text-center min-w-[105px] shadow-inner ${spfColor}`}>
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold opacity-90 block">
                  Silver / Focus
                </span>
                <span className="font-mono text-lg sm:text-xl font-extrabold block mt-0.5">
                  {silverPerFocus}
                </span>
                <span className="text-[9px] opacity-90 block font-mono font-bold">
                  {spfLabel}
                </span>
              </div>
            )}

            {/* Output Quantity */}
            <div className="bg-[#080d16] border border-amber-500/40 rounded-xl p-3 text-center min-w-[105px] shadow-[0_0_12px_rgba(217,119,6,0.15)]">
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-amber-400/90 block">
                Total Output
              </span>
              <span className="font-mono text-lg sm:text-xl font-extrabold text-amber-300 block mt-0.5">
                {outputQuantity.toLocaleString()}
              </span>
              <span className="text-[9px] font-mono text-slate-400 block truncate">
                {res.isStone ? 'standard blocks' : 'units produced'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Focus Pool Capacity & Regeneration Analysis */}
      {useFocus && calculation?.focusPool && (
        <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-inner ${calculation.focusPool.colorClass}`}>
          <div className="flex items-center gap-2.5">
            <Zap className={`w-4 h-4 shrink-0 ${calculation.focusPool.isOverBank ? 'text-rose-400' : 'text-sky-300'}`} />
            <div>
              <span className="font-serif font-bold block text-slate-100">
                {calculation.focusPool.badgeText}
              </span>
              <span className="text-[10px] text-slate-400 block font-sans">
                {calculation.focusPool.isOverBank
                  ? 'Exceeds the 30,000 max focus bank capacity. Plan this batch across multiple days of 10,000/day regeneration.'
                  : 'Focus points regenerate at 10,000 daily with Premium active (30,000 maximum bank capacity).'}
              </span>
            </div>
          </div>
          <span className="font-mono text-xs font-bold shrink-0 bg-[#06090f]/80 px-2.5 py-1 rounded-md border border-[#1e2a3c]">
            {totalFocusNeeded.toLocaleString()} Focus Points
          </span>
        </div>
      )}

      {/* Cargo Transport Haul Weight & Mount Capacity */}
      {calculation?.cargo && (
        <div className="bg-[#0b121d] p-3 rounded-xl border border-[#1e2a3c] flex items-center justify-between gap-3 text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-serif font-bold text-slate-200">Cargo Haul Weight: </span>
              <span className="font-mono text-amber-300 font-bold">
                {calculation.cargo.inputCargoWeightKg.toLocaleString()} kg &rarr; {calculation.cargo.outputCargoWeightKg.toLocaleString()} kg
              </span>
            </div>
          </div>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${calculation.cargo.recommendedMount.badge}`}>
            {calculation.cargo.recommendedMount.name}
          </span>
        </div>
      )}

      {/* 2. Opportunity Cost Banner (If not in bonus city) */}
      {opportunityCost && (
        <div className="bg-gradient-to-r from-[#1f1505] via-[#150f05] to-[#0c0d12] border border-amber-500/40 rounded-xl p-4 flex items-start gap-3.5 text-amber-200/90 text-xs shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500" />
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-amber-300 text-sm tracking-wide">
              City Jurisdiction Advisory: Refining in {city} instead of {opportunityCost.bonusCity}
            </h4>
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              {opportunityCost.bonusCity} holds the Royal Crown's +40% specialty refining charter for {res.rawName}. Refining this batch in {opportunityCost.bonusCity} would elevate your Resource Return Rate to <strong className="text-amber-300 font-mono">{(opportunityCost.bonusCityRrr * 100).toFixed(1)}%</strong> and yield an estimated <strong className="text-emerald-400 font-mono font-bold">+{Math.round(opportunityCost.extraProfit).toLocaleString()} extra silver</strong>!
            </p>
          </div>
        </div>
      )}

      {/* 3. Material & Returns Breakdown */}
      <div className="forged-tablet p-4 sm:p-5 shadow-xl space-y-4 relative overflow-hidden">
        <h3 className="text-xs uppercase tracking-wider text-slate-200 font-serif font-bold flex items-center gap-2 border-b border-[#1c2738]/80 pb-2.5">
          <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
          <span>Material Consumption &amp; Resource Returns</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Raw Material Card */}
          <div className="bg-[#0b121d] p-3.5 rounded-xl border border-[#1e2a3c] space-y-2 shadow-inner">
            <div className="flex justify-between items-center text-xs">
              <span className="font-serif font-bold text-slate-200">
                Raw {res.rawName} (T{tier}.{enchantment})
              </span>
              <span className="font-mono text-amber-400 font-semibold">
                {materials.rawPrice.toLocaleString()} s/ea
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="bg-[#06090f] p-2 rounded-lg border border-[#1e2a3c]">
                <span className="text-[10px] text-slate-400 block font-sans">Upfront Needed</span>
                <span className="font-mono font-bold text-slate-200 text-sm">{materials.rawGross.toLocaleString()}</span>
              </div>
              <div className="bg-[#061811] p-2 rounded-lg border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400/90 block font-sans font-semibold">Returned ({returnRatePct}%)</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">+{materials.rawReturned.toLocaleString()}</span>
              </div>
              <div className="bg-[#08121e] p-2 rounded-lg border border-sky-500/30">
                <span className="text-[10px] text-sky-400/90 block font-sans font-semibold">Net Consumed</span>
                <span className="font-mono font-bold text-sky-300 text-sm">{materials.rawConsumed.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Previous Tier Refined Card */}
          {tier > 2 ? (
            <div className="bg-[#0b121d] p-3.5 rounded-xl border border-[#1e2a3c] space-y-2 shadow-inner">
              <div className="flex justify-between items-center text-xs">
                <span className="font-serif font-bold text-slate-200">
                  Previous Refined {res.refinedName} (T{tier - 1}.{(tier - 1 >= 4 && !res.isStone) ? enchantment : 0})
                </span>
                <span className="font-mono text-amber-400 font-semibold">
                  {materials.prevRefinedPrice.toLocaleString()} s/ea
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="bg-[#06090f] p-2 rounded-lg border border-[#1e2a3c]">
                  <span className="text-[10px] text-slate-400 block font-sans">Upfront Needed</span>
                  <span className="font-mono font-bold text-slate-200 text-sm">{materials.prevRefinedGross.toLocaleString()}</span>
                </div>
                <div className="bg-[#061811] p-2 rounded-lg border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400/90 block font-sans font-semibold">Returned ({returnRatePct}%)</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">+{materials.prevRefinedReturned.toLocaleString()}</span>
                </div>
                <div className="bg-[#08121e] p-2 rounded-lg border border-sky-500/30">
                  <span className="text-[10px] text-sky-400/90 block font-sans font-semibold">Net Consumed</span>
                  <span className="font-mono font-bold text-sky-300 text-sm">{materials.prevRefinedConsumed.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#080d16] p-3.5 rounded-xl border border-[#1b2536] flex items-center justify-center text-xs text-slate-500 italic">
              Tier 2 refining does not require any previous tier materials.
            </div>
          )}
        </div>
      </div>

      {/* 4. Complete Financial Ledger */}
      <div className="forged-tablet p-4 sm:p-5 shadow-xl space-y-3 relative overflow-hidden">
        <h3 className="text-xs uppercase tracking-wider text-slate-200 font-serif font-bold flex items-center gap-2 border-b border-[#1c2738]/80 pb-2.5">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span>Financial Breakdown &amp; Station Expenses</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#0b121d] p-3 rounded-xl border border-[#1e2a3c] shadow-inner">
            <span className="text-[10px] text-slate-400 block font-sans uppercase tracking-wider font-semibold">Upfront Capital (mats)</span>
            <span className="font-mono font-bold text-slate-200 text-sm block mt-1">
              {financials.initialCapital.toLocaleString()} <span className="text-xs text-slate-400">silver</span>
            </span>
          </div>

          <div className="bg-[#0b121d] p-3 rounded-xl border border-rose-500/30 shadow-inner">
            <span className="text-[10px] text-rose-400/90 block font-sans uppercase tracking-wider font-semibold">Station Nutrition Tax</span>
            <span className="font-mono font-bold text-rose-300 text-sm block mt-1">
              {financials.stationFee.toLocaleString()} <span className="text-xs text-rose-400/70">silver</span>
            </span>
          </div>

          <div className="bg-[#0b121d] p-3 rounded-xl border border-amber-500/30 shadow-inner">
            <span className="text-[10px] text-amber-400/90 block font-sans uppercase tracking-wider font-semibold">Market Taxes &amp; Fees</span>
            <span className="font-mono font-bold text-amber-300 text-sm block mt-1">
              {financials.marketTaxes.toLocaleString()} <span className="text-xs text-amber-400/70">silver</span>
            </span>
          </div>

          <div className="bg-[#0b121d] p-3 rounded-xl border border-[#1e2a3c] shadow-inner">
            <span className="text-[10px] text-slate-400 block font-sans uppercase tracking-wider font-semibold">Effective Cost / Unit</span>
            <span className="font-mono font-bold text-emerald-300 text-sm block mt-1">
              {financials.costPerUnit.toLocaleString()} <span className="text-xs text-slate-400">silver</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
