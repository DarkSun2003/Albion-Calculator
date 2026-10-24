import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  RotateCcw, 
  AlertCircle, 
  Building,
  CheckCircle,
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
  let spfColor = 'text-slate-400 bg-slate-900 border-slate-800';
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
    <div className="space-y-4">
      {/* 1. Main Profit Card */}
      <div className={`forged-tablet rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden transition-all ${
        isProfitable
          ? 'border border-emerald-500/40 bg-gradient-to-b from-emerald-950/30 via-[#0a0f18] to-[#070b12]'
          : 'border border-rose-500/40 bg-gradient-to-b from-rose-950/30 via-[#0f090d] to-[#070b12]'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs uppercase tracking-wider font-serif font-bold text-slate-300">
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
                <span>{isBackendCalculating ? 'Calculating...' : (isBackendConnected ? 'Backend Verified' : 'Client Mode')}</span>
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                isProfitable 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {financials.marginPct >= 0 ? `+${financials.marginPct}%` : `${financials.marginPct}%`} Margin
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <h2 className={`font-mono text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isProfitable ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {financials.netProfit >= 0 ? '+' : ''}{financials.netProfit.toLocaleString()}
              </h2>
              <span className="font-mono text-xs text-amber-400/80 font-bold">silver</span>
            </div>

            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Profit / item:{' '}
              <span className={`font-mono font-bold ${financials.profitPerUnit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {financials.profitPerUnit >= 0 ? '+' : ''}{financials.profitPerUnit.toLocaleString()} silver
              </span>
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap gap-2">
            <div className="bg-[#06090f] border border-slate-800 rounded-xl p-2.5 text-center min-w-[90px]">
              <span className="text-[9px] uppercase font-mono tracking-wider font-semibold text-slate-400 block">
                Return Rate
              </span>
              <span className="font-mono text-base font-extrabold text-sky-400 block mt-0.5">
                {returnRatePct}%
              </span>
              <span className="text-[9px] font-mono text-slate-500 block">
                {useFocus ? 'with Focus' : 'no Focus'}
              </span>
            </div>

            {useFocus && totalFocusNeeded > 0 && (
              <div className={`border rounded-xl p-2.5 text-center min-w-[90px] ${spfColor}`}>
                <span className="text-[9px] uppercase font-mono tracking-wider font-semibold opacity-90 block">
                  Silver / Focus
                </span>
                <span className="font-mono text-base font-extrabold block mt-0.5">
                  {silverPerFocus}
                </span>
                <span className="text-[9px] opacity-90 block font-mono font-bold">
                  {spfLabel}
                </span>
              </div>
            )}

            <div className="bg-[#06090f] border border-amber-500/30 rounded-xl p-2.5 text-center min-w-[90px]">
              <span className="text-[9px] uppercase font-mono tracking-wider font-semibold text-amber-400/90 block">
                Output
              </span>
              <span className="font-mono text-base font-extrabold text-amber-300 block mt-0.5">
                {outputQuantity.toLocaleString()}
              </span>
              <span className="text-[9px] font-mono text-slate-500 block truncate">
                units produced
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Focus Pool Capacity & Regeneration Notice */}
      {useFocus && calculation?.focusPool && (
        <div className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs ${calculation.focusPool.colorClass}`}>
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 shrink-0 ${calculation.focusPool.isOverBank ? 'text-rose-400' : 'text-sky-300'}`} />
            <div>
              <span className="font-serif font-bold block text-slate-100">
                {calculation.focusPool.badgeText}
              </span>
              <span className="text-[10px] text-slate-400 block font-sans">
                {calculation.focusPool.isOverBank
                  ? 'Exceeds 30,000 focus bank capacity. Plan over multiple days.'
                  : 'Daily regeneration is 10,000 points with Premium active.'}
              </span>
            </div>
          </div>
          <span className="font-mono text-xs font-bold shrink-0 bg-[#06090f]/80 px-2 py-0.5 rounded border border-slate-800">
            {totalFocusNeeded.toLocaleString()} Focus
          </span>
        </div>
      )}

      {/* Opportunity Cost Banner (If not in bonus city) */}
      {opportunityCost && (
        <div className="bg-[#120d04] border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-200/90">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-serif font-bold text-amber-300 text-xs">
              Bonus City: {opportunityCost.bonusCity} (+40% RRR)
            </h4>
            <p className="text-slate-300 leading-relaxed font-sans text-[11px]">
              Refining in {opportunityCost.bonusCity} would increase return rate to <strong className="text-amber-300 font-mono">{(opportunityCost.bonusCityRrr * 100).toFixed(1)}%</strong> and yield <strong className="text-emerald-400 font-mono font-bold">+{Math.round(opportunityCost.extraProfit).toLocaleString()} extra silver</strong>!
            </p>
          </div>
        </div>
      )}

      {/* 2. Material & Returns Breakdown */}
      <div className="forged-tablet rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden">
        <h3 className="text-xs uppercase tracking-wider text-slate-200 font-serif font-bold flex items-center gap-2 border-b border-slate-800/80 pb-2">
          <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
          <span>Material Consumption &amp; Returns</span>
        </h3>

        <div className="space-y-2.5">
          {/* Raw Material Card */}
          <div className="bg-[#090e18] p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-serif font-bold text-slate-200">
                Raw {res.rawName} (T{tier}.{enchantment})
              </span>
              <span className="font-mono text-amber-400 font-semibold text-[11px]">
                {materials.rawPrice.toLocaleString()} s/ea
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
              <div className="bg-[#06090f] p-1.5 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-400 block">Upfront</span>
                <span className="font-mono font-bold text-slate-200 text-xs">{materials.rawGross.toLocaleString()}</span>
              </div>
              <div className="bg-[#071610] p-1.5 rounded-lg border border-emerald-500/30">
                <span className="text-[9px] text-emerald-400 block">Refund ({returnRatePct}%)</span>
                <span className="font-mono font-bold text-emerald-400 text-xs">+{materials.rawReturned.toLocaleString()}</span>
              </div>
              <div className="bg-[#06101c] p-1.5 rounded-lg border border-sky-500/30">
                <span className="text-[9px] text-sky-400 block">Net Consumed</span>
                <span className="font-mono font-bold text-sky-300 text-xs">{materials.rawConsumed.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Previous Tier Refined Card */}
          {tier > 2 ? (
            <div className="bg-[#090e18] p-3 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-serif font-bold text-slate-200">
                  Lower Refined {res.refinedName} (T{tier - 1}.{(tier - 1 >= 4 && !res.isStone) ? enchantment : 0})
                </span>
                <span className="font-mono text-amber-400 font-semibold text-[11px]">
                  {materials.prevRefinedPrice.toLocaleString()} s/ea
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                <div className="bg-[#06090f] p-1.5 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Upfront</span>
                  <span className="font-mono font-bold text-slate-200 text-xs">{materials.prevRefinedGross.toLocaleString()}</span>
                </div>
                <div className="bg-[#071610] p-1.5 rounded-lg border border-emerald-500/30">
                  <span className="text-[9px] text-emerald-400 block">Refund ({returnRatePct}%)</span>
                  <span className="font-mono font-bold text-emerald-400 text-xs">+{materials.prevRefinedReturned.toLocaleString()}</span>
                </div>
                <div className="bg-[#06101c] p-1.5 rounded-lg border border-sky-500/30">
                  <span className="text-[9px] text-sky-400 block">Net Consumed</span>
                  <span className="font-mono font-bold text-sky-300 text-xs">{materials.prevRefinedConsumed.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#06090f] p-2 rounded-lg border border-slate-800 text-[11px] text-slate-500 text-center italic">
              Tier 2 refining does not require any lower tier materials.
            </div>
          )}
        </div>
      </div>

      {/* 3. Complete Financial Ledger */}
      <div className="forged-tablet rounded-2xl p-4 shadow-xl space-y-2.5 relative overflow-hidden">
        <h3 className="text-xs uppercase tracking-wider text-slate-200 font-serif font-bold flex items-center gap-2 border-b border-slate-800/80 pb-2">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span>Expense Breakdown</span>
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[#090e18] p-2.5 rounded-xl border border-slate-800">
            <span className="text-[9px] text-slate-400 block uppercase font-mono">Upfront Capital</span>
            <span className="font-mono font-bold text-slate-200 text-xs block mt-0.5">
              {financials.initialCapital.toLocaleString()} <span className="text-[10px] text-slate-500">silver</span>
            </span>
          </div>

          <div className="bg-[#090e18] p-2.5 rounded-xl border border-rose-500/30">
            <span className="text-[9px] text-rose-400/90 block uppercase font-mono">Station Tax</span>
            <span className="font-mono font-bold text-rose-300 text-xs block mt-0.5">
              {financials.stationFee.toLocaleString()} <span className="text-[10px] text-rose-400/70">silver</span>
            </span>
          </div>

          <div className="bg-[#090e18] p-2.5 rounded-xl border border-amber-500/30">
            <span className="text-[9px] text-amber-400/90 block uppercase font-mono">Market Tax</span>
            <span className="font-mono font-bold text-amber-300 text-xs block mt-0.5">
              {financials.marketTaxes.toLocaleString()} <span className="text-[10px] text-amber-400/70">silver</span>
            </span>
          </div>

          <div className="bg-[#090e18] p-2.5 rounded-xl border border-slate-800">
            <span className="text-[9px] text-slate-400 block uppercase font-mono">Cost / Unit</span>
            <span className="font-mono font-bold text-emerald-300 text-xs block mt-0.5">
              {financials.costPerUnit.toLocaleString()} <span className="text-[10px] text-slate-500">silver</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
