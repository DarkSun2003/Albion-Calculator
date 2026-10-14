import React from 'react';
import { getItemIdentifier, getItemIconPath, RESOURCES } from '../utils/albionMath';
import { ArrowRight, Plus, Sparkles, RotateCcw, Building } from 'lucide-react';

export default function CraftingFlowCard({
  selectedResource,
  selectedTier,
  selectedEnchantment,
  quantity,
  calculation,
}) {
  if (!calculation) return null;

  const res = RESOURCES[selectedResource];
  const isT2 = selectedTier === 2;
  const isStone = selectedResource === 'stone';

  // Item IDs
  const rawItemId = getItemIdentifier(selectedResource, selectedTier, selectedEnchantment, false);
  const refinedItemId = getItemIdentifier(selectedResource, selectedTier, selectedEnchantment, true);
  const prevRefinedItemId = selectedTier > 2
    ? getItemIdentifier(selectedResource, selectedTier - 1, 0, true)
    : null;

  const rawIcon = getItemIconPath(rawItemId);
  const refinedIcon = getItemIconPath(refinedItemId);
  const prevRefinedIcon = prevRefinedItemId ? getItemIconPath(prevRefinedItemId) : null;

  const { materials, financials, returnRatePct, outputQuantity } = calculation;

  return (
    <div className="bg-albion-card border border-albion-border rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-albion-border/60 pb-2.5">
        <h3 className="text-xs uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5 font-serif">
          <Sparkles className="w-3.5 h-3.5 text-albion-gold" />
          The Artisan Refining Altar & Blueprint Flow
        </h3>
        <span className="text-[11px] font-mono text-sky-400">
          Return Rate: <strong className="text-sky-300">{returnRatePct}%</strong>
        </span>
      </div>

      {/* Visual Blueprint Flow */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
        {/* Input 1: Raw Resource (3 cols) */}
        <div className="md:col-span-3 bg-albion-bg/80 border border-albion-border rounded-xl p-3 flex items-center gap-3 relative overflow-hidden">
          <div className="w-14 h-14 shrink-0 bg-albion-surface rounded-lg p-1 border border-albion-border/80 flex items-center justify-center">
            <img src={rawIcon} alt={rawItemId} className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-mono text-slate-400 block truncate">
              Raw Input
            </span>
            <h4 className="text-xs font-bold text-slate-100 truncate">
              {res.rawName} (T{selectedTier}.{selectedEnchantment})
            </h4>
            <div className="text-[11px] font-mono mt-0.5">
              <span className="text-amber-300 font-bold">{materials.rawGross}</span> needed
            </div>
            <div className="text-[10px] font-mono text-emerald-400">
              +{materials.rawReturned} refunded
            </div>
          </div>
        </div>

        {/* Plus Symbol (1 col) */}
        <div className="md:col-span-1 flex justify-center text-slate-500 font-bold text-lg">
          <Plus className="w-5 h-5 text-slate-500" />
        </div>

        {/* Input 2: Previous Tier Refined (3 cols) */}
        <div className={`md:col-span-3 rounded-xl p-3 flex items-center gap-3 border ${
          isT2 
            ? 'bg-albion-bg/30 border-albion-border/40 opacity-40' 
            : 'bg-albion-bg/80 border-albion-border'
        }`}>
          {isT2 ? (
            <div className="text-xs text-slate-500 italic py-2 text-center w-full">
              T2 Base (No lower tier required)
            </div>
          ) : (
            <>
              <div className="w-14 h-14 shrink-0 bg-albion-surface rounded-lg p-1 border border-albion-border/80 flex items-center justify-center">
                <img src={prevRefinedIcon} alt={prevRefinedItemId} className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-mono text-slate-400 block truncate">
                  Previous Refined
                </span>
                <h4 className="text-xs font-bold text-slate-100 truncate">
                  {res.refinedName} (T{selectedTier - 1}.0)
                </h4>
                <div className="text-[11px] font-mono mt-0.5">
                  <span className="text-amber-300 font-bold">{materials.prevRefinedGross}</span> needed
                </div>
                <div className="text-[10px] font-mono text-emerald-400">
                  +{materials.prevRefinedReturned} refunded
                </div>
              </div>
            </>
          )}
        </div>

        {/* Arrow Transition (1 col) */}
        <div className="md:col-span-1 flex justify-center text-albion-gold">
          <ArrowRight className="w-5 h-5" />
        </div>

        {/* Output: Refined Item (3 cols) */}
        <div className="md:col-span-3 bg-gradient-to-br from-albion-surface to-albion-card border border-albion-gold/60 rounded-xl p-3 flex items-center gap-3 shadow-gold-glow">
          <div className="w-14 h-14 shrink-0 bg-albion-bg rounded-lg p-1 border border-albion-gold/40 flex items-center justify-center">
            <img src={refinedIcon} alt={refinedItemId} className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-mono text-albion-gold block truncate">
              Refined Output
            </span>
            <h4 className="text-xs font-bold text-slate-100 truncate">
              {res.refinedName} (T{selectedTier}{isStone ? '.0' : `.${selectedEnchantment}`})
            </h4>
            <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
              {outputQuantity.toLocaleString()} units produced
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Rev: {financials.netRevenue.toLocaleString()} silver
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
