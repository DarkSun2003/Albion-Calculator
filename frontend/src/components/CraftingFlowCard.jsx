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
    <div className="forged-tablet rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-800/80 space-y-4 relative overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs uppercase tracking-wider text-slate-200 font-serif font-bold">
            Refining Blueprint Flow
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {setRefiningInputMode && (
            <div className="flex items-center bg-[#06090f] p-0.5 rounded-lg border border-slate-800 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => setRefiningInputMode('target')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  refiningInputMode === 'target'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Target className="w-3 h-3" />
                <span>Target Output</span>
              </button>
              <button
                type="button"
                onClick={() => setRefiningInputMode('materials')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  refiningInputMode === 'materials'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PackageCheck className="w-3 h-3 text-emerald-400" />
                <span>Inventory Mode</span>
              </button>
            </div>
          )}
          <span className="text-[11px] font-mono px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 font-bold">
            {returnRatePct}% RRR
          </span>
        </div>
      </div>

      {/* "I Have Materials" Interactive Calculator Panel */}
      {isMaterialsMode && (
        <div className="bg-[#081210] border border-emerald-500/30 rounded-xl p-3.5 sm:p-4 space-y-3.5 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-serif font-bold text-emerald-300 flex items-center gap-1.5">
              <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inventory Stack Calculator (T{selectedTier}.{selectedEnchantment} {res.rawName})</span>
            </span>

            {setCompoundRrrPasses && (
              <div className="flex items-center bg-[#06090f] p-0.5 rounded-lg border border-slate-800 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => setCompoundRrrPasses(true)}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition-all cursor-pointer ${
                    compoundRrrPasses
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Re-refine all returned raw materials across multiple passes"
                >
                  <Repeat className="w-3 h-3 text-emerald-400" />
                  <span>Compound RRR ({materialSim.passCount} Passes)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCompoundRrrPasses(false)}
                  className={`px-2 py-1 rounded transition-all cursor-pointer ${
                    !compoundRrrPasses
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Refine initial stack once"
                >
                  <span>1st Pass Only</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Raw Material Have Input */}
            <div className="bg-[#090e18] p-3 rounded-xl border border-emerald-500/30">
              <label className="text-[11px] font-semibold text-slate-200 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Raw {res.rawName} in Bag:
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {materialSim.rawPerCraft} raw / craft
                </span>
              </label>
              <NumberInput
                type="number"
                min="0"
                value={rawMaterialsHave}
                onChange={(e) => setRawMaterialsHave && setRawMaterialsHave(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-[#06090f] border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-400 shadow-inner"
              />
              <div className="flex gap-1.5 mt-2">
                {[500, 1000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRawMaterialsHave(amt)}
                    className={`flex-1 text-[10px] font-mono py-1 rounded border transition-all cursor-pointer ${
                      Number(rawMaterialsHave) === amt
                        ? 'bg-emerald-500/25 border-emerald-500/60 text-emerald-300 font-bold'
                        : 'bg-[#06090f] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Lower-Tier Refined Already Have */}
            {!isT2 && setPrevRefinedHave && (
              <div className="bg-[#090e18] p-3 rounded-xl border border-slate-800">
                <label className="text-[11px] font-semibold text-slate-200 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    T{selectedTier - 1}.{prevEnch} {res.refinedName} Already Owned:
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">1 / craft</span>
                </label>
                <NumberInput
                  type="number"
                  min="0"
                  value={prevRefinedHave}
                  onChange={(e) => setPrevRefinedHave(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#06090f] border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400 shadow-inner"
                  placeholder="0"
                />
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2">
                  <span>Leave 0 to see total needed</span>
                  {prevRefinedHave > 0 && (
                    <button
                      type="button"
                      onClick={() => setPrevRefinedHave(0)}
                      className="text-amber-400 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Instant Breakdown Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
            <div className="bg-[#06090f] p-2.5 rounded-xl border border-slate-800">
              <span className="text-[9px] text-amber-400/90 block uppercase tracking-wider font-semibold">
                {isT2 ? 'Lower Refined' : `T${selectedTier - 1} ${res.refinedName} Needed`}
              </span>
              <span className="text-sm font-bold text-amber-300 block mt-0.5">
                {isT2
                  ? '0 (T2 Base)'
                  : `${(compoundRrrPasses ? materialSim.prevToBuyTotal : materialSim.prevToBuyPass1).toLocaleString()}x`}
              </span>
            </div>

            <div className="bg-[#06090f] p-2.5 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-semibold">
                Pass 1 Output
              </span>
              <span className="text-sm font-bold text-slate-100 block mt-0.5">
                {materialSim.pass1Output.toLocaleString()} units
              </span>
              <span className="text-[9px] text-emerald-400 block truncate">
                +{Math.floor(materialSim.pass1Crafts * materialSim.rawPerCraft * materialSim.rrr).toLocaleString()} raw back
              </span>
            </div>

            <div className="bg-[#06090f] p-2.5 rounded-xl border border-slate-800">
              <span className="text-[9px] text-sky-400 block uppercase tracking-wider font-semibold">
                Compound Bonus
              </span>
              <span className="text-sm font-bold text-sky-400 block mt-0.5">
                +{materialSim.bonusRrrOutput.toLocaleString()} units
              </span>
              <span className="text-[9px] text-slate-400 block">
                {materialSim.passCount} refining passes
              </span>
            </div>

            <div className="bg-[#071710] p-2.5 rounded-xl border border-emerald-500/40">
              <span className="text-[9px] text-emerald-400 block uppercase tracking-wider font-semibold">
                Total Output Yield
              </span>
              <span className="text-sm font-extrabold text-emerald-300 block mt-0.5">
                {(compoundRrrPasses ? materialSim.totalOutput : materialSim.pass1Output).toLocaleString()} units
              </span>
              <span className="text-[9px] text-slate-300 block">
                Leftover: {compoundRrrPasses ? materialSim.leftoverRaw : (rawMaterialsHave - materialSim.pass1Crafts * materialSim.rawPerCraft + Math.floor(materialSim.pass1Crafts * materialSim.rawPerCraft * materialSim.rrr))} raw
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Visual Blueprint Flow */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-2.5 items-center">
        {/* Input 1: Raw Resource (5 cols on mobile, 4 on desktop) */}
        <div className="md:col-span-4 bg-[#090e18] border border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="w-12 h-12 shrink-0 bg-[#06090f] rounded-lg p-1 border border-slate-800 flex items-center justify-center">
            <ItemIcon src={rawIcon} itemId={rawItemId} alt={rawItemId} className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block truncate">
              {isMaterialsMode ? 'Raw Material' : 'Raw Input'}
            </span>
            <h4 className="text-xs font-bold text-slate-100 truncate">
              {res.rawName} (T{selectedTier}.{selectedEnchantment})
            </h4>
            <div className="text-[11px] font-mono mt-0.5">
              <span className="text-amber-300 font-bold">{displayRawNeeded.toLocaleString()}</span>{' '}
              {isMaterialsMode ? 'on hand' : 'needed'}
            </div>
            <div className="text-[10px] font-mono text-emerald-400">
              {isMaterialsMode
                ? `${materialSim.leftoverRaw} leftover after ${materialSim.passCount} passes`
                : `+${materials.rawReturned.toLocaleString()} refunded`}
            </div>
          </div>
        </div>

        {/* Plus Symbol */}
        <div className="md:col-span-1 flex justify-center py-1 md:py-0">
          <div className="w-6 h-6 rounded-full bg-[#06090f] border border-slate-800 flex items-center justify-center text-slate-400">
            <Plus className="w-3.5 h-3.5 text-amber-500/70" />
          </div>
        </div>

        {/* Input 2: Previous Tier Refined */}
        <div className={`md:col-span-3 rounded-xl p-3 flex items-center gap-3 border ${
          isT2 
            ? 'bg-[#080c14]/40 border-slate-800/40 opacity-40' 
            : 'bg-[#090e18] border-slate-800'
        }`}>
          {isT2 ? (
            <div className="text-xs text-slate-500 italic py-2 text-center w-full">
              T2 Base (No lower tier required)
            </div>
          ) : (
            <>
              <div className="w-12 h-12 shrink-0 bg-[#06090f] rounded-lg p-1 border border-slate-800 flex items-center justify-center">
                <ItemIcon src={prevRefinedIcon} itemId={prevRefinedItemId} alt={prevRefinedItemId} className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block truncate">
                  Lower Tier
                </span>
                <h4 className="text-xs font-bold text-slate-100 truncate">
                  {res.refinedName} (T{selectedTier - 1}.{prevEnch})
                </h4>
                <div className="text-[11px] font-mono mt-0.5">
                  <span className="text-amber-300 font-bold">{displayPrevNeeded.toLocaleString()}</span> needed
                </div>
                <div className="text-[10px] font-mono text-emerald-400">
                  {isMaterialsMode
                    ? `Pass 1: ${materialSim.prevNeededPass1.toLocaleString()} (RRR refunds rest)`
                    : `+${materials.prevRefinedReturned.toLocaleString()} refunded`}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Arrow */}
        <div className="md:col-span-1 flex justify-center py-1 md:py-0">
          <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>

        {/* Output: Refined Item */}
        <div className="md:col-span-2 bg-gradient-to-b from-[#141006] to-[#090e18] border border-amber-500/50 rounded-xl p-3 flex items-center gap-2.5">
          <div className="w-12 h-12 shrink-0 bg-[#06070a] rounded-lg p-1 border border-amber-500/40 flex items-center justify-center">
            <ItemIcon src={refinedIcon} itemId={refinedItemId} alt={refinedItemId} className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] uppercase font-mono font-bold text-amber-400 block truncate">
              Output
            </span>
            <h4 className="text-xs font-bold text-slate-100 truncate">
              {res.refinedName}
            </h4>
            <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
              {outputQuantity.toLocaleString()} units
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              {financials.netRevenue.toLocaleString()}s rev
            </div>
          </div>
        </div>
      </div>

      {/* Transport Haul & Cargo Weight */}
      {calculation?.cargo && (
        <div className="bg-[#06090f] px-3.5 py-2.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 font-mono text-[11px]">
              Cargo Haul: <strong className="text-amber-300">{calculation.cargo.inputCargoWeightKg.toLocaleString()} kg</strong> (mats) &rarr; <strong className="text-emerald-300">{calculation.cargo.outputCargoWeightKg.toLocaleString()} kg</strong> (refined)
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="text-slate-500">Mount:</span>
            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${calculation.cargo.recommendedMount.badge}`}>
              {calculation.cargo.recommendedMount.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
