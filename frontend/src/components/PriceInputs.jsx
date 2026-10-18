import React from 'react';
import NumberInput from './NumberInput';
import { RefreshCw, Coins, Tag, ArrowRight, Zap, RotateCcw } from 'lucide-react';
import { RESOURCES, getItemIdentifier, getItemIconPath } from '../utils/albionMath';
import { getCalibratedNowMs } from '../services/api';
import ItemIcon from './ItemIcon';

function getFreshness(dateString, ageHours, source) {
  if (source === 'aodp_24h_avg') {
    return {
      label: '📊 24h Traded Avg',
      color: 'text-sky-300 bg-sky-950/70 border-sky-700/70',
      tooltip: 'Verified 24-hour traded average price from Albion Data Project history',
    };
  }

  let diffHours = null;
  if (ageHours !== null && ageHours !== undefined && !Number.isNaN(Number(ageHours)) && Number(ageHours) < 9000) {
    diffHours = Number(ageHours);
  } else if (
    dateString &&
    typeof dateString === 'string' &&
    !dateString.startsWith('0001') &&
    !dateString.startsWith('1970') &&
    !isNaN(new Date(dateString).getTime()) &&
    new Date(dateString).getFullYear() >= 2020
  ) {
    const parsedStr = dateString.endsWith('Z') || dateString.includes('+') ? dateString : `${dateString}Z`;
    diffHours = Math.max(0, (getCalibratedNowMs() - new Date(parsedStr).getTime()) / (1000 * 60 * 60));
  }

  if (diffHours === null) {
    return {
      label: 'No Recent Scan',
      color: 'text-slate-400 bg-slate-900/80 border-slate-700',
      tooltip: 'No active player market scan found yet',
    };
  }

  if (diffHours <= 0.04) {
    return {
      label: '🟢 Updated just now',
      color: 'text-emerald-300 bg-emerald-950/80 border-emerald-700/80',
      tooltip: 'Scanned less than 2 minutes ago',
    };
  }
  if (diffHours < 1) {
    const mins = Math.max(1, Math.round(diffHours * 60));
    return {
      label: `🟢 Updated ${mins}m ago`,
      color: 'text-emerald-300 bg-emerald-950/80 border-emerald-700/80',
      tooltip: `Fresh market scan (${mins} minutes old)`,
    };
  }
  if (diffHours < 6) {
    const hrs = Math.round(diffHours * 10) / 10;
    return {
      label: `🟡 Updated ${hrs}h ago`,
      color: 'text-amber-300 bg-amber-950/80 border-amber-700/80',
      tooltip: `Moderately recent market scan (${hrs} hours old)`,
    };
  }
  if (diffHours < 48) {
    const hrs = Math.round(diffHours);
    return {
      label: `🔴 Updated ${hrs}h ago`,
      color: 'text-rose-300 bg-rose-950/80 border-rose-700/80',
      tooltip: `Older market scan (${hrs} hours old) — verify in-game if trading large volume`,
    };
  }
  const days = Math.max(1, Math.round(diffHours / 24));
  return {
    label: `🔴 Updated ${days}d ago`,
    color: 'text-rose-300 bg-rose-950/80 border-rose-700/80',
    tooltip: `Stale market scan (${days} days old)`,
  };
}

export default function PriceInputs({
  selectedResource,
  selectedTier,
  selectedEnchantment,
  rawPrice,
  setRawPrice,
  prevRefinedPrice,
  setPrevRefinedPrice,
  refinedSellPrice,
  setRefinedSellPrice,
  isSellOrder,
  setIsSellOrder,
  onFetchLivePrices,
  loadingPrices,
  priceFetchStatus,
  autoFetchEnabled = true,
  setAutoFetchEnabled,
  priceTimestamps = {},
  manualOverrides = {},
  onResetOverrides,
}) {
  const resource = RESOURCES[selectedResource];
  const isT2 = selectedTier === 2;
  const isStone = resource?.isStone;

  const prevEnch = (selectedTier - 1 >= 4 && !isStone) ? selectedEnchantment : 0;
  const rawItemId = getItemIdentifier(selectedResource, selectedTier, selectedEnchantment, false);
  const refinedItemId = getItemIdentifier(selectedResource, selectedTier, selectedEnchantment, true);
  const prevRefinedItemId = selectedTier > 2
    ? getItemIdentifier(selectedResource, selectedTier - 1, prevEnch, true)
    : null;

  const rawIcon = getItemIconPath(rawItemId);
  const refinedIcon = getItemIconPath(refinedItemId);
  const prevRefinedIcon = prevRefinedItemId ? getItemIconPath(prevRefinedItemId) : null;

  const rawLabel = `T${selectedTier}.${selectedEnchantment} ${resource.rawName}`;
  const prevLabel = isT2 ? 'None (T2 Base)' : `T${selectedTier - 1}.${prevEnch} ${resource.refinedName}`;
  const refinedLabel = isStone 
    ? `T${selectedTier}.0 ${resource.refinedName}` 
    : `T${selectedTier}.${selectedEnchantment} ${resource.refinedName}`;

  const hasAnyOverride = manualOverrides.raw || manualOverrides.prevRefined || manualOverrides.refined;
  const rawFresh = getFreshness(priceTimestamps?.raw, priceTimestamps?.rawAgeHours, priceTimestamps?.rawSource);
  const prevFresh = getFreshness(priceTimestamps?.prevRefined, priceTimestamps?.prevRefinedAgeHours, priceTimestamps?.prevRefinedSource);
  const refinedFresh = getFreshness(priceTimestamps?.refined, priceTimestamps?.refinedAgeHours, priceTimestamps?.refinedSource);

  return (
    <div className="forged-tablet p-4 sm:p-5 shadow-2xl space-y-5 relative overflow-hidden">
      {/* Subtle top edge gold filament */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

      {/* Header & Live Fetch Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1c2738]/80 pb-3">
        <div>
          <h3 className="text-xs uppercase tracking-wider text-slate-200 font-semibold flex items-center gap-2 font-serif">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
              Stage 04
            </span>
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-serif">Market Board Valuation &amp; Live Price Sync</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Auto-synced from AODP + 24h Traded History. Click any silver box to override with your local in-game market order.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Auto-Fetch Toggle */}
          {setAutoFetchEnabled && (
            <button
              type="button"
              onClick={() => setAutoFetchEnabled(!autoFetchEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition-all border cursor-pointer ${
                autoFetchEnabled
                  ? 'bg-gradient-to-r from-amber-600/30 to-amber-500/15 border-amber-500/60 text-amber-300 shadow-gold-glow'
                  : 'bg-[#06090f] border-[#1e2a3c] text-slate-400 hover:text-slate-200'
              }`}
              title={autoFetchEnabled ? 'Auto-fetching prices on every selection' : 'Auto-fetch paused'}
            >
              <Zap className={`w-3.5 h-3.5 ${autoFetchEnabled ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
              <span>{autoFetchEnabled ? 'Auto-Fetch: ON' : 'Auto-Fetch: PAUSED'}</span>
            </button>
          )}

          {/* Reset Overrides Button if user customized prices */}
          {hasAnyOverride && onResetOverrides && (
            <button
              type="button"
              onClick={onResetOverrides}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#090d15] hover:bg-[#121926] text-xs text-amber-300 border border-amber-500/40 transition-all cursor-pointer font-serif font-semibold"
              title="Reset manual values and re-sync with live market"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>Revert to Live</span>
            </button>
          )}

          {/* Manual Query Button */}
          <button
            type="button"
            onClick={onFetchLivePrices}
            disabled={loadingPrices}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#07090e] text-xs font-serif font-bold transition-all disabled:opacity-50 shadow-gold-glow cursor-pointer hover:scale-105 active:scale-95"
          >
            <RefreshCw className={`w-3 h-3 ${loadingPrices ? 'animate-spin' : ''}`} />
            <span>{loadingPrices ? 'Syncing...' : 'Scan Now'}</span>
          </button>
        </div>
      </div>

      {/* Inputs Grid with Official Local Icons & Freshness Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Raw Material Price */}
        <div className="bg-[#0b121d] p-3.5 rounded-xl border border-[#1e2a3c] flex items-start gap-3 relative shadow-inner">
          <div className="w-12 h-12 shrink-0 bg-[#06090f] rounded-lg p-1 border border-[#1e2a3c] flex items-center justify-center shadow-inner">
            <ItemIcon src={rawIcon} itemId={rawItemId} alt={rawItemId} className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <label className="text-[11px] font-semibold text-slate-200 block truncate">
                Raw: <span className="text-sky-300 font-mono">{rawLabel}</span>
              </label>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${rawFresh.color} shrink-0`}>
                {rawFresh.label}
              </span>
            </div>
            <div className="relative">
              <NumberInput
                type="number"
                min="0"
                value={rawPrice}
                onChange={(e) => setRawPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-[#06090f] border border-[#1e2a3c] rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-amber-400 shadow-inner transition-colors"
                placeholder="0"
              />
              <span className="absolute right-2.5 top-2 text-[10px] text-amber-400/70 font-mono">silver</span>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[9px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span>Unit buy</span>
                <span className="px-1.5 py-0.5 rounded bg-[#06090f] text-slate-400 border border-[#1e2a3c] font-mono text-[8px]">
                  Normal (Q1)
                </span>
              </span>
              {manualOverrides?.raw && (
                <span className="font-mono text-amber-400 font-bold">Manual Value</span>
              )}
            </div>
          </div>
        </div>

        {/* Previous Tier Refined Price */}
        <div className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
          isT2 ? 'opacity-40 bg-[#090d15]/40 border-[#1a2332]/40' : 'bg-[#0b121d] border-[#1e2a3c] shadow-inner'
        }`}>
          {isT2 ? (
            <div className="text-xs text-slate-500 italic py-3 text-center w-full">
              T2 Base Tier (0 lower mats required)
            </div>
          ) : (
            <>
              <div className="w-12 h-12 shrink-0 bg-[#06090f] rounded-lg p-1 border border-[#1e2a3c] flex items-center justify-center shadow-inner">
                <ItemIcon src={prevRefinedIcon} itemId={prevRefinedItemId} alt={prevRefinedItemId} className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <label className="text-[11px] font-semibold text-slate-200 block truncate">
                    Lower: <span className="text-amber-300 font-mono">{prevLabel}</span>
                  </label>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${prevFresh.color} shrink-0`}>
                    {prevFresh.label}
                  </span>
                </div>
                <div className="relative">
                  <NumberInput
                    type="number"
                    min="0"
                    disabled={isT2}
                    value={isT2 ? 0 : prevRefinedPrice}
                    onChange={(e) => setPrevRefinedPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-[#06090f] border border-[#1e2a3c] rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-amber-400 disabled:cursor-not-allowed shadow-inner transition-colors"
                    placeholder="0"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] text-amber-400/70 font-mono">silver</span>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[9px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span>{prevEnch > 0 ? `Enchanted .${prevEnch}` : 'Flat .0'}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#06090f] text-slate-400 border border-[#1e2a3c] font-mono text-[8px]">
                      Normal (Q1)
                    </span>
                  </span>
                  {manualOverrides?.prevRefined && (
                    <span className="font-mono text-amber-400 font-bold">Manual Value</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Output Refined Selling Price */}
        <div className="bg-[#0b121d] p-3.5 rounded-xl border border-amber-500/40 flex items-start gap-3 shadow-[0_0_15px_rgba(217,119,6,0.1)]">
          <div className="w-12 h-12 shrink-0 bg-[#06090f] rounded-lg p-1 border border-amber-500/40 flex items-center justify-center shadow-inner">
            <ItemIcon src={refinedIcon} itemId={refinedItemId} alt={refinedItemId} className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <label className="text-[11px] font-semibold text-slate-200 block truncate">
                Output: <span className="text-emerald-300 font-mono">{refinedLabel}</span>
              </label>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${refinedFresh.color} shrink-0`}>
                {refinedFresh.label}
              </span>
            </div>
            <div className="relative">
              <NumberInput
                type="number"
                min="0"
                value={refinedSellPrice}
                onChange={(e) => setRefinedSellPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-[#06090f] border border-[#1e2a3c] rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-400 shadow-inner transition-colors"
                placeholder="0"
              />
              <span className="absolute right-2.5 top-2 text-[10px] text-amber-400/70 font-mono">silver</span>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[9px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span>Unit sell price</span>
                <span className="px-1.5 py-0.5 rounded bg-[#06090f] text-emerald-400/90 border border-emerald-900/50 font-mono text-[8px]">
                  Normal (Q1)
                </span>
              </span>
              {manualOverrides?.refined && (
                <span className="font-mono text-amber-400 font-bold">Manual Value</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selling Method Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs border-t border-[#1c2738]/80">
        <div className="flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-amber-400/80" />
          <span className="text-slate-300 font-medium">Market Order Strategy:</span>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <button
            type="button"
            onClick={() => setIsSellOrder(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isSellOrder
                ? 'bg-gradient-to-r from-amber-600/30 to-amber-500/20 border-amber-500/60 text-amber-300 shadow-gold-glow'
                : 'bg-[#06090f] border-[#1e2a3c] text-slate-400 hover:text-slate-200'
            }`}
          >
            Sell Order (+2.5% Setup Fee)
          </button>
          <button
            type="button"
            onClick={() => setIsSellOrder(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              !isSellOrder
                ? 'bg-gradient-to-r from-sky-600/30 to-sky-500/20 border-sky-500/60 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                : 'bg-[#06090f] border-[#1e2a3c] text-slate-400 hover:text-slate-200'
            }`}
          >
            Direct Sell (0% Setup Fee)
          </button>
        </div>
      </div>
    </div>
  );
}
