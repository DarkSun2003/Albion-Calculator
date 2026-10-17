import React from 'react';
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

  const rawItemId = getItemIdentifier(selectedResource, selectedTier, selectedEnchantment, false);
  const refinedItemId = getItemIdentifier(selectedResource, selectedTier, selectedEnchantment, true);
  const prevRefinedItemId = selectedTier > 2
    ? getItemIdentifier(selectedResource, selectedTier - 1, 0, true)
    : null;

  const rawIcon = getItemIconPath(rawItemId);
  const refinedIcon = getItemIconPath(refinedItemId);
  const prevRefinedIcon = prevRefinedItemId ? getItemIconPath(prevRefinedItemId) : null;

  const rawLabel = `T${selectedTier}.${selectedEnchantment} ${resource.rawName}`;
  const prevLabel = isT2 ? 'None (T2 Base)' : `T${selectedTier - 1}.0 ${resource.refinedName}`;
  const refinedLabel = isStone 
    ? `T${selectedTier}.0 ${resource.refinedName}` 
    : `T${selectedTier}.${selectedEnchantment} ${resource.refinedName}`;

  const hasAnyOverride = manualOverrides.raw || manualOverrides.prevRefined || manualOverrides.refined;
  const rawFresh = getFreshness(priceTimestamps?.raw, priceTimestamps?.rawAgeHours, priceTimestamps?.rawSource);
  const prevFresh = getFreshness(priceTimestamps?.prevRefined, priceTimestamps?.prevRefinedAgeHours, priceTimestamps?.prevRefinedSource);
  const refinedFresh = getFreshness(priceTimestamps?.refined, priceTimestamps?.refinedAgeHours, priceTimestamps?.refinedSource);

  return (
    <div className="bg-albion-card border border-albion-border rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header & Live Fetch Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-albion-border/60 pb-3">
        <div>
          <h3 className="text-xs uppercase tracking-wider text-slate-200 font-semibold flex items-center gap-2 font-serif">
            <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold">
              Stage 03
            </span>
            <Coins className="w-3.5 h-3.5 text-albion-gold" />
            <span>Market Unit Price Ledger</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Auto-synced from AODP + 24h Traded History. Click any price box to type your own in-game price.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Auto-Fetch Toggle */}
          {setAutoFetchEnabled && (
            <button
              type="button"
              onClick={() => setAutoFetchEnabled(!autoFetchEnabled)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-serif font-bold transition-all border ${
                autoFetchEnabled
                  ? 'bg-amber-950/50 border-amber-500/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-300'
              }`}
              title={autoFetchEnabled ? 'Auto-fetching prices on every selection' : 'Auto-fetch paused'}
            >
              <Zap className={`w-3.5 h-3.5 ${autoFetchEnabled ? 'text-amber-400 fill-amber-400' : 'text-stone-500'}`} />
              <span>{autoFetchEnabled ? 'Auto-Fetch: ON' : 'Auto-Fetch: PAUSED'}</span>
            </button>
          )}

          {/* Reset Overrides Button if user customized prices */}
          {hasAnyOverride && onResetOverrides && (
            <button
              type="button"
              onClick={onResetOverrides}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-xs text-amber-300 border border-stone-800 transition-all"
              title="Reset manual values and re-sync with live market"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Revert to Live</span>
            </button>
          )}

          {/* Manual Query Button */}
          <button
            type="button"
            onClick={onFetchLivePrices}
            disabled={loadingPrices}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-albion-surface border border-albion-border hover:border-albion-gold text-xs font-semibold text-albion-gold hover:text-albion-gold-light transition-all disabled:opacity-50 shadow-gold-glow"
          >
            <RefreshCw className={`w-3 h-3 ${loadingPrices ? 'animate-spin' : ''}`} />
            <span>{loadingPrices ? 'Syncing...' : 'Refresh Now'}</span>
          </button>
        </div>
      </div>

      {/* Inputs Grid with Official Local Icons & Freshness Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Raw Material Price */}
        <div className="bg-albion-bg/80 p-3 rounded-xl border border-albion-border flex items-start gap-3 relative">
          <div className="w-12 h-12 shrink-0 bg-albion-surface rounded-lg p-0.5 border border-albion-border flex items-center justify-center">
            <ItemIcon src={rawIcon} itemId={rawItemId} alt={rawItemId} className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <label className="text-[11px] font-semibold text-slate-200 block truncate">
                Raw: <span className="text-sky-300 font-mono">{rawLabel}</span>
              </label>
              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${rawFresh.color} shrink-0`}>
                {rawFresh.label}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={rawPrice}
                onChange={(e) => setRawPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-albion-card border border-albion-border rounded px-2.5 py-1 text-sm font-mono text-slate-100 focus:outline-none focus:border-albion-gold"
                placeholder="0"
              />
              <span className="absolute right-2 top-1.5 text-[10px] text-slate-500 font-mono">silver</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span>Unit purchase</span>
                <span className="px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-mono text-[8px]">
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
        <div className={`p-3 rounded-xl border flex items-start gap-3 ${
          isT2 ? 'opacity-40 bg-albion-bg/30 border-albion-border/40' : 'bg-albion-bg/80 border-albion-border'
        }`}>
          {isT2 ? (
            <div className="text-xs text-slate-500 italic py-3 text-center w-full">
              T2 Base Tier (0 lower mats)
            </div>
          ) : (
            <>
              <div className="w-12 h-12 shrink-0 bg-albion-surface rounded-lg p-0.5 border border-albion-border flex items-center justify-center">
                <ItemIcon src={prevRefinedIcon} itemId={prevRefinedItemId} alt={prevRefinedItemId} className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <label className="text-[11px] font-semibold text-slate-200 block truncate">
                    Lower: <span className="text-amber-300 font-mono">{prevLabel}</span>
                  </label>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${prevFresh.color} shrink-0`}>
                    {prevFresh.label}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    disabled={isT2}
                    value={isT2 ? 0 : prevRefinedPrice}
                    onChange={(e) => setPrevRefinedPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-albion-card border border-albion-border rounded px-2.5 py-1 text-sm font-mono text-slate-100 focus:outline-none focus:border-albion-gold disabled:cursor-not-allowed"
                    placeholder="0"
                  />
                  <span className="absolute right-2 top-1.5 text-[10px] text-slate-500 font-mono">silver</span>
                </div>
                <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span>Flat .0 required</span>
                    <span className="px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-mono text-[8px]">
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
        <div className="bg-albion-bg/80 p-3 rounded-xl border border-albion-border flex items-start gap-3">
          <div className="w-12 h-12 shrink-0 bg-albion-surface rounded-lg p-0.5 border border-albion-gold/40 flex items-center justify-center">
            <ItemIcon src={refinedIcon} itemId={refinedItemId} alt={refinedItemId} className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <label className="text-[11px] font-semibold text-slate-200 block truncate">
                Output: <span className="text-emerald-300 font-mono">{refinedLabel}</span>
              </label>
              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${refinedFresh.color} shrink-0`}>
                {refinedFresh.label}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={refinedSellPrice}
                onChange={(e) => setRefinedSellPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-albion-card border border-albion-border rounded px-2.5 py-1 text-sm font-mono text-emerald-400 font-bold focus:outline-none focus:border-albion-gold"
                placeholder="0"
              />
              <span className="absolute right-2 top-1.5 text-[10px] text-slate-500 font-mono">silver</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span>Unit sell price</span>
                <span className="px-1 py-0.2 rounded bg-slate-800 text-emerald-400/90 border border-emerald-900/50 font-mono text-[8px]">
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
      <div className="flex items-center justify-between pt-1 text-xs">
        <div className="flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-300 font-medium">Market Order Strategy:</span>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <button
            type="button"
            onClick={() => setIsSellOrder(true)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
              isSellOrder
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-gold-glow'
                : 'bg-albion-bg border-albion-border text-slate-500 hover:text-slate-300'
            }`}
          >
            Sell Order (+2.5% Setup Fee)
          </button>
          <button
            type="button"
            onClick={() => setIsSellOrder(false)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
              !isSellOrder
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                : 'bg-albion-bg border-albion-border text-slate-500 hover:text-slate-300'
            }`}
          >
            Direct Sell (0% Setup Fee)
          </button>
        </div>
      </div>
    </div>
  );
}
