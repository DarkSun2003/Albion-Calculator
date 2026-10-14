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
  ExternalLink
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
      {/* 1. Main Profit Header Card */}
      <div className={`rounded-xl border p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all ${
        isProfitable
          ? 'bg-gradient-to-br from-emerald-950/40 via-albion-card to-albion-surface border-emerald-600/40 shadow-emerald-950/20'
          : 'bg-gradient-to-br from-rose-950/40 via-albion-card to-albion-surface border-rose-600/40 shadow-rose-950/20'
      }`}>
        {/* Subtle decorative glow */}
        <div className={`absolute top-0 right-0 w-64 h-64 blur-3xl opacity-10 pointer-events-none rounded-full ${isProfitable ? 'bg-emerald-400' : 'bg-rose-400'}`} />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 font-sans">
                Net Batch Profit
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
                <span>{isBackendCalculating ? 'Django Calculating' : (isBackendConnected ? 'Django Engine' : 'Client Math')}</span>
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                isProfitable 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                {financials.marginPct >= 0 ? `+${financials.marginPct}%` : `${financials.marginPct}%`} Margin
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <h2 className={`font-mono text-3xl sm:text-4xl font-extrabold tracking-tight ${
                isProfitable ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {financials.netProfit >= 0 ? '+' : ''}{financials.netProfit.toLocaleString()}
              </h2>
              <span className="font-mono text-sm text-slate-400">silver</span>
            </div>

            <p className="text-xs text-slate-400 font-sans mt-1">
              Profit per refined item: <span className="font-mono font-semibold text-slate-200">
                {financials.profitPerUnit >= 0 ? '+' : ''}{financials.profitPerUnit.toLocaleString()} silver
              </span>
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap gap-2.5">
            {/* Resource Return Rate */}
            <div className="bg-albion-bg/80 border border-albion-border rounded-lg p-2.5 text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Resource Return
              </span>
              <span className="font-mono text-lg font-bold text-sky-400">
                {returnRatePct}%
              </span>
              <span className="text-[9px] text-slate-500 block">
                {useFocus ? 'with Focus' : 'no Focus'}
              </span>
            </div>

            {/* Silver Per Focus */}
            {useFocus && totalFocusNeeded > 0 && (
              <div className={`border rounded-lg p-2.5 text-center min-w-[100px] ${spfColor}`}>
                <span className="text-[10px] uppercase font-semibold opacity-80 block">
                  Silver / Focus
                </span>
                <span className="font-mono text-lg font-bold">
                  {silverPerFocus}
                </span>
                <span className="text-[9px] opacity-80 block font-mono">
                  {spfLabel}
                </span>
              </div>
            )}

            {/* Output Quantity */}
            <div className="bg-albion-bg/80 border border-albion-border rounded-lg p-2.5 text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Yield Output
              </span>
              <span className="font-mono text-lg font-bold text-amber-300">
                {outputQuantity.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-500 block">
                {res.isStone ? 'standard blocks' : 'units produced'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Opportunity Cost Banner (If not in bonus city) */}
      {opportunityCost && (
        <div className="bg-amber-950/20 border border-amber-600/30 rounded-xl p-4 flex items-start gap-3 text-amber-200/90 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-300 font-sans">
              City Bonus Advisory: Refining in {city} instead of {opportunityCost.bonusCity}
            </h4>
            <p className="text-amber-200/80 leading-relaxed">
              {opportunityCost.bonusCity} holds the +40% specialty refining bonus for {res.rawName}. Refining this batch in {opportunityCost.bonusCity} would increase your Resource Return Rate to <strong className="text-amber-300 font-mono">{(opportunityCost.bonusCityRrr * 100).toFixed(1)}%</strong> and yield an estimated <strong className="text-emerald-400 font-mono">+{Math.round(opportunityCost.extraProfit).toLocaleString()} extra silver</strong>!
            </p>
          </div>
        </div>
      )}

      {/* 3. Material & Returns Breakdown */}
      <div className="bg-albion-card border border-albion-border rounded-xl p-4 sm:p-5 shadow-lg space-y-4">
        <h3 className="text-xs uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5 border-b border-albion-border/60 pb-2.5">
          <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
          Material Ledger & Resource Returns
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Raw Material Card */}
          <div className="bg-albion-bg/60 p-3.5 rounded-lg border border-albion-border space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">
                Raw {res.rawName} (T{tier}.{enchantment})
              </span>
              <span className="font-mono text-slate-400">
                {materials.rawPrice.toLocaleString()} silver/ea
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="bg-albion-surface/80 p-2 rounded border border-albion-border/60">
                <span className="text-[10px] text-slate-500 block">Upfront Needed</span>
                <span className="font-mono font-bold text-slate-300">{materials.rawGross}</span>
              </div>
              <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                <span className="text-[10px] text-emerald-400/80 block">Returned ({returnRatePct}%)</span>
                <span className="font-mono font-bold text-emerald-400">+{materials.rawReturned}</span>
              </div>
              <div className="bg-sky-500/10 p-2 rounded border border-sky-500/20">
                <span className="text-[10px] text-sky-400/80 block">Net Consumed</span>
                <span className="font-mono font-bold text-sky-300">{materials.rawConsumed}</span>
              </div>
            </div>
          </div>

          {/* Previous Tier Refined Card */}
          {tier > 2 ? (
            <div className="bg-albion-bg/60 p-3.5 rounded-lg border border-albion-border space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">
                  Previous Refined {res.refinedName} (T{tier - 1}.0)
                </span>
                <span className="font-mono text-slate-400">
                  {materials.prevRefinedPrice.toLocaleString()} silver/ea
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="bg-albion-surface/80 p-2 rounded border border-albion-border/60">
                  <span className="text-[10px] text-slate-500 block">Upfront Needed</span>
                  <span className="font-mono font-bold text-slate-300">{materials.prevRefinedGross}</span>
                </div>
                <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-400/80 block">Returned ({returnRatePct}%)</span>
                  <span className="font-mono font-bold text-emerald-400">+{materials.prevRefinedReturned}</span>
                </div>
                <div className="bg-sky-500/10 p-2 rounded border border-sky-500/20">
                  <span className="text-[10px] text-sky-400/80 block">Net Consumed</span>
                  <span className="font-mono font-bold text-sky-300">{materials.prevRefinedConsumed}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-albion-bg/30 p-3.5 rounded-lg border border-albion-border/40 flex items-center justify-center text-xs text-slate-500 italic">
              Tier 2 refining does not require any previous tier materials.
            </div>
          )}
        </div>
      </div>

      {/* 4. Complete Financial Ledger */}
      <div className="bg-albion-card border border-albion-border rounded-xl p-4 sm:p-5 shadow-lg space-y-3">
        <h3 className="text-xs uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5 border-b border-albion-border/60 pb-2.5">
          <Coins className="w-3.5 h-3.5 text-albion-gold" />
          Financial Breakdown & Station Costs
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-albion-bg/60 p-3 rounded-lg border border-albion-border">
            <span className="text-[10px] text-slate-500 block">Upfront Capital (mats)</span>
            <span className="font-mono font-bold text-slate-200">
              {financials.initialCapital.toLocaleString()} silver
            </span>
          </div>

          <div className="bg-albion-bg/60 p-3 rounded-lg border border-albion-border">
            <span className="text-[10px] text-slate-500 block">Station Nutrition Tax</span>
            <span className="font-mono font-bold text-rose-300">
              {financials.stationFee.toLocaleString()} silver
            </span>
          </div>

          <div className="bg-albion-bg/60 p-3 rounded-lg border border-albion-border">
            <span className="text-[10px] text-slate-500 block">Market Taxes & Fees</span>
            <span className="font-mono font-bold text-amber-300">
              {financials.marketTaxes.toLocaleString()} silver
            </span>
          </div>

          <div className="bg-albion-bg/60 p-3 rounded-lg border border-albion-border">
            <span className="text-[10px] text-slate-500 block">Effective Cost / Unit</span>
            <span className="font-mono font-bold text-slate-200">
              {financials.costPerUnit.toLocaleString()} silver
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
