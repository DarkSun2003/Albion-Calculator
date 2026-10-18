import React from 'react';
import NumberInput from './NumberInput';
import { getItemIdentifier, getItemIconPath, RESOURCES } from '../utils/albionMath';
import ItemIcon from './ItemIcon';
import { ArrowRight, Plus, Sparkles, PackageCheck, Target, Repeat, Truck } from 'lucide-react';

export default function CraftingFlowCard({
  selectedResource,
  selectedTier,
  selectedEnchantment,
  quantity,
  calculation,
  refiningInputMode = 'target',
  setRefiningInputMode,
  rawMaterialsHave = 5000,
  setRawMaterialsHave,
  prevRefinedHave = 0,
  setPrevRefinedHave,
  compoundRrrPasses = true,
  setCompoundRrrPasses,
  materialSim = null,
}) {
  if (!calculation) return null;

  const res = RESOURCES[selectedResource];
  const isT2 = selectedTier === 2;
  const isStone = selectedResource === 'stone';

  // Item IDs
  const prevEnch = (selectedTier - 1 >= 4 && !isStone) ? selectedEnchantment : 0;
  const rawItemId = getItemIdentifier(selectedResource, selectedTier, selectedEnchantment, false);
  const refinedItemId = getItemIdentifier(selectedResource, selectedTier, selectedEnchantment, true);
  const prevRefinedItemId = selectedTier > 2
    ? getItemIdentifier(selectedResource, selectedTier - 1, prevEnch, true)
    : null;

  const rawIcon = getItemIconPath(rawItemId);
  const refinedIcon = getItemIconPath(refinedItemId);
  const prevRefinedIcon = prevRefinedItemId ? getItemIconPath(prevRefinedItemId) : null;

  const { materials, financials, returnRatePct, outputQuantity } = calculation;
  const isMaterialsMode = refiningInputMode === 'materials' && materialSim;

  const displayRawNeeded = isMaterialsMode
    ? Number(rawMaterialsHave) || 0
    : materials.rawGross;
  const displayPrevNeeded = isMaterialsMode
    ? (compoundRrrPasses ? materialSim.prevTotalNeeded : materialSim.prevNeededPass1)
    : materials.prevRefinedGross;

  return (
    <div className="forged-tablet rounded-2xl p-4 sm:p-5 shadow-[0_12px_36px_rgba(0,0,0,0.85)] border border-albion-border/80 space-y-4 relative overflow-hidden">
      {/* Subtle top edge gold hairline */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-albion-border/60 pb-2.5">
        <h3 className="text-xs uppercase tracking-wider text-slate-200 font-serif font-bold flex items-center gap-2">
          <span className="text-[9.5px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 font-extrabold shadow-gold-glow">
            STAGE 02
          </span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>The Artisan Refining Altar &amp; Blueprint Flow</span>
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          {setRefiningInputMode && (
            <div className="flex items-center bg-[#090e18] p-0.5 rounded-xl border border-albion-border font-mono text-[11px] shadow-inner">
              <button
                type="button"
                onClick={() => setRefiningInputMode('target')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  refiningInputMode === 'target'
                    ? 'bg-gradient-to-r from-amber-600/30 to-amber-500/20 text-amber-300 border border-amber-500/60 font-bold shadow-gold-glow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Target Output</span>
              </button>
              <button
                type="button"
                onClick={() => setRefiningInputMode('materials')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  refiningInputMode === 'materials'
                    ? 'bg-gradient-to-r from-emerald-600/30 to-emerald-500/20 text-emerald-300 border border-emerald-500/60 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>I Have Materials</span>
              </button>
            </div>
          )}
          <span className="text-[11px] font-mono px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 font-bold">
            RRR: {returnRatePct}%
          </span>
        </div>
      </div>

      {/* "I Have Materials" Interactive Calculator Banner */}
      {isMaterialsMode && (
        <div className="bg-gradient-to-br from-[#071611]/90 via-[#0a0f18]/95 to-[#0b1320] border border-emerald-500/35 rounded-xl p-3.5 sm:p-5 space-y-4 shadow-[0_8px_24px_rgba(0,0,0,0.4)] relative overflow-hidden">
          {/* Subtle top edge emerald glow */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-serif font-bold tracking-wide text-emerald-300 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <PackageCheck className="w-3.5 h-3.5" />
                </span>
                Refine From My Inventory Stack (T{selectedTier}.{selectedEnchantment} {res.rawName})
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Enter the raw {res.rawName} you have on hand — we calculate how much T{selectedTier - 1}.{prevEnch} {res.refinedName} you need and your total yield.
              </p>
            </div>

            {setCompoundRrrPasses && (
              <div className="flex items-center bg-[#070b12] p-0.5 rounded-lg border border-[#1e2a3c] font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => setCompoundRrrPasses(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    compoundRrrPasses
                      ? 'bg-gradient-to-r from-emerald-600/30 to-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Keep refining all RRR returned materials until less than 1 craft remains"
                >
                  <Repeat className="w-3 h-3 text-emerald-400" />
                  <span>Re-Refine RRR Returns ({materialSim.passCount} passes)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCompoundRrrPasses(false)}
                  className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    !compoundRrrPasses
                      ? 'bg-gradient-to-r from-amber-600/30 to-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Refine your stack once (Pass 1) and keep the returned materials"
                >
                  <span>1st Pass Only</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Raw Material Have Input */}
            <div className="bg-[#0b121d]/90 p-3.5 rounded-xl border border-emerald-500/30 shadow-inner">
              <label className="text-[11px] font-semibold text-slate-200 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Raw T{selectedTier}.{selectedEnchantment} {res.rawName} You Have:
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {materialSim.rawPerCraft} raw / craft
                </span>
              </label>
              <NumberInput
                type="number"
                min="0"
                value={rawMaterialsHave}
                onChange={(e) => setRawMaterialsHave(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-[#06090f] border border-[#1e2a3c] rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-400 transition-colors shadow-inner"
              />
              <div className="flex gap-1.5 mt-2">
                {[500, 1000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRawMaterialsHave(amt)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                      Number(rawMaterialsHave) === amt
                        ? 'bg-emerald-500/25 border-emerald-500/60 text-emerald-300 font-bold shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                        : 'bg-[#06090f] border-[#1e2a3c] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Lower-Tier Refined Already Have */}
            {!isT2 && setPrevRefinedHave && (
              <div className="bg-[#0b121d]/90 p-3.5 rounded-xl border border-[#1e2a3c] shadow-inner">
                <label className="text-[11px] font-semibold text-slate-200 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    T{selectedTier - 1}.{prevEnch} {res.refinedName} Already Owned (Optional):
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-[#06090f] px-1.5 py-0.5 rounded border border-[#1e2a3c]">
                    1 / craft
                  </span>
                </label>
                <NumberInput
                  type="number"
                  min="0"
                  value={prevRefinedHave}
                  onChange={(e) => setPrevRefinedHave(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#06090f] border border-[#1e2a3c] rounded-lg px-3 py-2 text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
                  placeholder="0"
                />
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2">
                  <span>Leave at 0 to see total needed</span>
                  {prevRefinedHave > 0 && (
                    <button
                      type="button"
                      onClick={() => setPrevRefinedHave(0)}
                      className="text-amber-400 hover:underline hover:text-amber-300 font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Instant Breakdown Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 font-mono text-xs">
            <div className="bg-[#0b121d] p-3 rounded-xl border border-amber-500/40 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
              <span className="text-[10px] text-amber-400/80 block font-sans uppercase tracking-wider font-semibold">
                {isT2 ? 'Lower Refined Needed' : `T${selectedTier - 1}.${prevEnch} ${res.refinedName} Needed`}
              </span>
              <span className="text-sm sm:text-base font-extrabold text-amber-300 block mt-1">
                {isT2
                  ? '0 (T2 Base)'
                  : `${(compoundRrrPasses ? materialSim.prevToBuyTotal : materialSim.prevToBuyPass1).toLocaleString()} units`}
              </span>
              {!isT2 && (
                <span className="text-[9px] text-slate-400 block mt-0.5 truncate">
                  {compoundRrrPasses
                    ? `${materialSim.prevNeededPass1.toLocaleString()} Pass 1 (RRR covers rest)`
                    : `Cost: ${((compoundRrrPasses ? materialSim.prevToBuyTotal : materialSim.prevToBuyPass1) * (materials.prevRefinedPrice || 0)).toLocaleString()}s`}
                </span>
              )}
            </div>

            <div className="bg-[#0b121d] p-3 rounded-xl border border-[#1e2a3c] shadow-sm">
              <span className="text-[10px] text-slate-400 block font-sans uppercase tracking-wider font-semibold">
                Pass 1 Output (1st Click)
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-100 block mt-1">
                {materialSim.pass1Output.toLocaleString()} {res.refinedName}
              </span>
              <span className="text-[9px] text-emerald-400 block mt-0.5 truncate font-bold">
                +{Math.floor(materialSim.pass1Crafts * materialSim.rawPerCraft * materialSim.rrr).toLocaleString()} raw returned
              </span>
            </div>

            <div className="bg-[#0b121d] p-3 rounded-xl border border-[#1e2a3c] shadow-sm">
              <span className="text-[10px] text-sky-400/90 block font-sans uppercase tracking-wider font-semibold">
                RRR Bonus Yield (Passes 2+)
              </span>
              <span className="text-sm sm:text-base font-bold text-sky-400 block mt-1">
                +{materialSim.bonusRrrOutput.toLocaleString()} {res.refinedName}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5 truncate">
                From {returnRatePct}% RRR compounding
              </span>
            </div>

            <div className="bg-gradient-to-b from-[#061811] to-[#0a1017] p-3 rounded-xl border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
              <span className="text-[10px] text-emerald-300 block font-sans uppercase tracking-wider font-bold">
                Total Achieved Output
              </span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-400 block mt-1">
                {(compoundRrrPasses ? materialSim.totalOutput : materialSim.pass1Output).toLocaleString()} {res.refinedName}
              </span>
              <span className="text-[9px] text-slate-300 block mt-0.5 truncate">
                Leftover: {compoundRrrPasses ? materialSim.leftoverRaw : (rawMaterialsHave - materialSim.pass1Crafts * materialSim.rawPerCraft + Math.floor(materialSim.pass1Crafts * materialSim.rawPerCraft * materialSim.rrr))} raw
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Visual Blueprint Flow */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
        {/* Input 1: Raw Resource (3 cols) */}
        <div className="md:col-span-3 bg-gradient-to-b from-[#0f1523] to-[#090d15] border border-[#232f42] rounded-xl p-3.5 flex items-center gap-3 relative overflow-hidden shadow-inner hover:border-slate-500/50 transition-all">
          <div className="w-14 h-14 shrink-0 bg-[#06090f] rounded-lg p-1 border border-[#1e2a3c] flex items-center justify-center shadow-inner">
            <ItemIcon src={rawIcon} itemId={rawItemId} alt={rawItemId} className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block truncate">
              {isMaterialsMode ? 'Raw In Your Bag' : 'Raw Input'}
            </span>
            <h4 className="text-xs font-bold text-slate-100 truncate">
              {res.rawName} (T{selectedTier}.{selectedEnchantment})
            </h4>
            <div className="text-[11px] font-mono mt-0.5">
              <span className="text-amber-300 font-bold">{displayRawNeeded.toLocaleString()}</span>{' '}
              {isMaterialsMode ? 'on hand' : 'needed'}
            </div>
            <div className="text-[10px] font-mono text-emerald-400 font-semibold">
              {isMaterialsMode
                ? `${materialSim.leftoverRaw} leftover after ${materialSim.passCount} passes`
                : `+${materials.rawReturned} refunded`}
            </div>
          </div>
        </div>

        {/* Plus Symbol (1 col) */}
        <div className="md:col-span-1 flex justify-center">
          <div className="w-8 h-8 rounded-full bg-[#0b1018] border border-[#1e2a3c] flex items-center justify-center text-slate-400 shadow-inner">
            <Plus className="w-4 h-4 text-amber-500/70" />
          </div>
        </div>

        {/* Input 2: Previous Tier Refined (3 cols) */}
        <div className={`md:col-span-3 rounded-xl p-3.5 flex items-center gap-3 border transition-all ${
          isT2 
            ? 'bg-[#090d15]/40 border-[#1a2332]/40 opacity-40' 
            : 'bg-gradient-to-b from-[#0f1523] to-[#090d15] border-[#232f42] shadow-inner hover:border-slate-500/50'
        }`}>
          {isT2 ? (
            <div className="text-xs text-slate-500 italic py-2 text-center w-full">
              T2 Base (No lower tier required)
            </div>
          ) : (
            <>
              <div className="w-14 h-14 shrink-0 bg-[#06090f] rounded-lg p-1 border border-[#1e2a3c] flex items-center justify-center shadow-inner">
                <ItemIcon src={prevRefinedIcon} itemId={prevRefinedItemId} alt={prevRefinedItemId} className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block truncate">
                  Previous Refined
                </span>
                <h4 className="text-xs font-bold text-slate-100 truncate">
                  {res.refinedName} (T{selectedTier - 1}.{prevEnch})
                </h4>
                <div className="text-[11px] font-mono mt-0.5">
                  <span className="text-amber-300 font-bold">{displayPrevNeeded.toLocaleString()}</span> needed
                </div>
                <div className="text-[10px] font-mono text-emerald-400 font-semibold">
                  {isMaterialsMode
                    ? `Pass 1: ${materialSim.prevNeededPass1.toLocaleString()} (RRR refunds rest)`
                    : `+${materials.prevRefinedReturned} refunded`}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Arrow Transition (1 col) */}
        <div className="md:col-span-1 flex justify-center">
          <div className="w-8 h-8 rounded-full bg-[#1c1505] border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(217,119,6,0.25)]">
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        {/* Output: Refined Item (3 cols) */}
        <div className="md:col-span-3 bg-gradient-to-b from-[#181206] to-[#0c0d12] border-2 border-amber-500/60 rounded-xl p-3.5 flex items-center gap-3 shadow-gold-glow relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
          <div className="w-14 h-14 shrink-0 bg-[#06070a] rounded-lg p-1 border border-amber-500/50 flex items-center justify-center shadow-inner">
            <ItemIcon src={refinedIcon} itemId={refinedItemId} alt={refinedItemId} className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-400 block truncate">
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

      {/* Transport Haul & Cargo Weight Advisor */}
      {calculation?.cargo && (
        <div className="bg-[#070b13] p-3.5 rounded-xl border border-[#1e2a3c] flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-950/60 border border-sky-500/40 text-sky-400">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-slate-200">Cargo Haul Weight:</span>
                <span className="font-mono text-amber-300 font-bold">
                  {calculation.cargo.inputCargoWeightKg.toLocaleString()} kg <span className="text-[10px] text-slate-400 font-normal font-sans">(Input Materials)</span> &rarr; {calculation.cargo.outputCargoWeightKg.toLocaleString()} kg <span className="text-[10px] text-slate-400 font-normal font-sans">(Refined Output)</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Calculated using true Albion item weights so you never get overburdened when moving resources between Royal Cities.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">Recommended Mount:</span>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border ${calculation.cargo.recommendedMount.badge}`}>
              {calculation.cargo.recommendedMount.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
