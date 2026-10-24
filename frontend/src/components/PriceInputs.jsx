import React from 'react';
import NumberInput from './NumberInput';
import { RefreshCw, Coins, Tag, RotateCcw, Zap } from 'lucide-react';
import { RESOURCES, getItemIdentifier, getItemIconPath } from '../utils/albionMath';
import { getCalibratedNowMs } from '../services/api';
import ItemIcon from './ItemIcon';

function getFreshness(dateString, ageHours, source) {
  if (source === 'aodp_24h_avg') {
    return {
      label: '24h Traded Avg',
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
      label: 'No Scan',
      color: 'text-slate-400 bg-slate-900/80 border-slate-700',
      tooltip: 'No active player market scan found yet',
    };
  }

  if (diffHours <= 0.04) {
    return {
      label: 'Just now',
      color: 'text-emerald-300 bg-emerald-950/80 border-emerald-700/80',
      tooltip: 'Scanned less than 2 minutes ago',
    };
  }
  if (diffHours < 1) {
    const mins = Math.max(1, Math.round(diffHours * 60));
    return {
      label: `${mins}m ago`,
      color: 'text-emerald-300 bg-emerald-950/80 border-emerald-700/80',
      tooltip: `Fresh market scan (${mins} minutes old)`,
    };
  }
  if (diffHours < 6) {
    const hrs = Math.round(diffHours * 10) / 10;
    return {
      label: `${hrs}h ago`,
      color: 'text-amber-300 bg-amber-950/80 border-amber-700/80',
      tooltip: `Recent scan (${hrs} hours old)`,
    };
  }
  if (diffHours < 48) {
    const hrs = Math.round(diffHours);
    return {
      label: `${hrs}h ago`,
      color: 'text-rose-300 bg-rose-950/80 border-rose-700/80',
      tooltip: `Older market scan (${hrs} hours old)`,
    };
  }
  const days = Math.max(1, Math.round(diffHours / 24));
  return {
    label: `${days}d ago`,
    color: 'text-rose-300 bg-rose-950/80 border-rose-700/80',
    tooltip: `Stale scan (${days} days old)`,
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
    <div className="forged-tablet p-3.5 sm:p-5 shadow-lg border border-slate-800/80 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs uppercase tracking-wider text-slate-200 font-serif font-bold">
            Market Prices &amp; Valuation
          </h3>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {hasAnyOverride && onResetOverrides && (
            <button
              type="button"
              onClick={onResetOverrides}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-amber-300 border border-amber-500/30 transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>Reset to Live</span>
            </button>
          )}

          <button
            type="button"
            onClick={onFetchLivePrices}
            disabled={loadingPrices}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loadingPrices ? 'animate-spin' : ''}`} />
            <span>{loadingPrices ? 'Syncing...' : 'Scan Market'}</span>
          </button>
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Raw Material Price */}
        <div className="bg-[#0b121d] p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
          <div className="w-10 h-10 shrink-0 bg-[#06090f] rounded-lg p-0.5 border border-slate-800 flex items-center justify-center">
            <ItemIcon src={rawIcon} itemId={rawItemId} alt={rawItemId} className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <label className="text-[11px] font-semibold text-slate-200 truncate">
                Raw: <span className="text-sky-300 font-mono">{rawLabel}</span>
              </label>
              <span className={`text-[8.5px] font-mono px-1 py-0.2 rounded border ${rawFresh.color} shrink-0`}>
                {rawFresh.label}
              </span>
            </div>
            <div className="relative">
              <NumberInput
                type="number"
                inputMode="numeric"
                min="0"
                value={rawPrice}
                onChange={(e) => setRawPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-[#06090f] border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-amber-400"
                placeholder="0"
              />
              <span className="absolute right-2.5 top-2 text-[10px] text-amber-400/60 font-mono">silver</span>
            </div>
            {/* Quick 1-tap mobile calibrators */}
            <div className="flex items-center justify-between mt-1 text-[10px]">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setRawPrice(Math.max(1, Math.round(rawPrice * 0.95)))}
                  className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] text-slate-400 hover:text-slate-200 font-mono"
                  title="Decrease 5%"
                >
                  -5%
                </button>
                <button
                  type="button"
                  onClick={() => setRawPrice(Math.round(rawPrice * 1.05))}
                  className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] text-slate-400 hover:text-slate-200 font-mono"
                  title="Increase 5%"
                >
                  +5%
                </button>
              </div>
              {manualOverrides?.raw && (
                <span className="font-mono text-amber-400 text-[9px] font-bold">Manual</span>
              )}
            </div>
          </div>
        </div>

        {/* Previous Tier Refined Price */}
        <div className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${
          isT2 ? 'opacity-40 bg-[#090d15]/40 border-slate-800/40' : 'bg-[#0b121d] border-slate-800'
        }`}>
          {isT2 ? (
            <div className="text-xs text-slate-500 italic py-2 text-center w-full">
              T2 Base Tier (0 lower mats)
            </div>
          ) : (
            <>
              <div className="w-10 h-10 shrink-0 bg-[#06090f] rounded-lg p-0.5 border border-slate-800 flex items-center justify-center">
                <ItemIcon src={prevRefinedIcon} itemId={prevRefinedItemId} alt={prevRefinedItemId} className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <label className="text-[11px] font-semibold text-slate-200 truncate">
                    Lower: <span className="text-amber-300 font-mono">{prevLabel}</span>
                  </label>
                  <span className={`text-[8.5px] font-mono px-1 py-0.2 rounded border ${prevFresh.color} shrink-0`}>
                    {prevFresh.label}
                  </span>
                </div>
                <div className="relative">
                  <NumberInput
                    type="number"
                    inputMode="numeric"
                    min="0"
                    disabled={isT2}
                    value={isT2 ? 0 : prevRefinedPrice}
                    onChange={(e) => setPrevRefinedPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-[#06090f] border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-amber-400 disabled:cursor-not-allowed"
                    placeholder="0"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] text-amber-400/60 font-mono">silver</span>
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPrevRefinedPrice(Math.max(1, Math.round(prevRefinedPrice * 0.95)))}
                      className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] text-slate-400 hover:text-slate-200 font-mono"
                      title="Decrease 5%"
                    >
                      -5%
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrevRefinedPrice(Math.round(prevRefinedPrice * 1.05))}
                      className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] text-slate-400 hover:text-slate-200 font-mono"
                      title="Increase 5%"
                    >
                      +5%
                    </button>
                  </div>
                  {manualOverrides?.prevRefined && (
                    <span className="font-mono text-amber-400 text-[9px] font-bold">Manual</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Output Refined Selling Price */}
        <div className="bg-[#0b121d] p-3 rounded-xl border border-amber-500/30 flex items-start gap-2.5">
          <div className="w-10 h-10 shrink-0 bg-[#06090f] rounded-lg p-0.5 border border-amber-500/30 flex items-center justify-center">
            <ItemIcon src={refinedIcon} itemId={refinedItemId} alt={refinedItemId} className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <label className="text-[11px] font-semibold text-slate-200 truncate">
                Output: <span className="text-emerald-300 font-mono">{refinedLabel}</span>
              </label>
              <span className={`text-[8.5px] font-mono px-1 py-0.2 rounded border ${refinedFresh.color} shrink-0`}>
                {refinedFresh.label}
              </span>
            </div>
            <div className="relative">
              <NumberInput
                type="number"
                inputMode="numeric"
                min="0"
                value={refinedSellPrice}
                onChange={(e) => setRefinedSellPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-[#06090f] border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-400"
                placeholder="0"
              />
              <span className="absolute right-2.5 top-2 text-[10px] text-amber-400/60 font-mono">silver</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[10px]">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setRefinedSellPrice(Math.max(1, Math.round(refinedSellPrice * 0.95)))}
                  className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] text-slate-400 hover:text-slate-200 font-mono"
                  title="Decrease 5%"
                >
                  -5%
                </button>
                <button
                  type="button"
                  onClick={() => setRefinedSellPrice(Math.round(refinedSellPrice * 1.05))}
                  className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] text-slate-400 hover:text-slate-200 font-mono"
                  title="Increase 5%"
                >
                  +5%
                </button>
              </div>
              {manualOverrides?.refined && (
                <span className="font-mono text-amber-400 text-[9px] font-bold">Manual</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Market Order Strategy */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Tag className="w-3.5 h-3.5 text-amber-400" />
          <span>Market Strategy:</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono">
          <button
            type="button"
            onClick={() => setIsSellOrder(true)}
            className={`px-2.5 py-1 rounded-lg border transition-all text-xs font-semibold ${
              isSellOrder
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Sell Order (+2.5% Setup)
          </button>
          <button
            type="button"
            onClick={() => setIsSellOrder(false)}
            className={`px-2.5 py-1 rounded-lg border transition-all text-xs font-semibold ${
              !isSellOrder
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Direct Sell (Instant)
          </button>
        </div>
      </div>
    </div>
  );
}
