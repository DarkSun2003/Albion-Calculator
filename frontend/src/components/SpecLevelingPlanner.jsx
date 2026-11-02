import React, { useState, useMemo } from 'react';
import { Award, Zap, BookOpen, TrendingUp, Sparkles, ChevronDown, ChevronUp, CheckCircle2, Flame, Wheat, Shield } from 'lucide-react';
import { calculateCookingSpecRoadmap, calculateGearSpecRoadmap } from '../utils/destinyBoardMath';

export default function SpecLevelingPlanner({
  mode = 'food', // 'food' or 'gear'
  item,
  tier = 4,
  currentSpec = 0,
  rrr = 0.15,
  sellPrice = 0,
  // For Food
  ingredientCosts = {},
  // For Gear
  primaryMatPrice = 0,
  secondaryMatPrice = 0,
  artifactPrice = 0,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetSpec, setTargetSpec] = useState(100);
  const [userStartSpec, setUserStartSpec] = useState(currentSpec || 0);
  const [strategy, setStrategy] = useState('sell'); // 'sell' or 'study'
  const [useLP, setUseLP] = useState(false);

  // Sync with prop if user hasn't touched it
  React.useEffect(() => {
    if (currentSpec !== undefined && currentSpec !== null) {
      setUserStartSpec(currentSpec);
    }
  }, [currentSpec]);

  const roadmap = useMemo(() => {
    if (mode === 'food') {
      return calculateCookingSpecRoadmap({
        foodItem: item,
        currentSpec: userStartSpec,
        targetSpec,
        strategy,
        useLearningPoints: useLP,
        rrr,
        sellPricePerUnit: sellPrice,
        ingredientCosts,
      });
    } else {
      return calculateGearSpecRoadmap({
        itemDef: item,
        tier,
        currentSpec: userStartSpec,
        targetSpec,
        strategy,
        useLearningPoints: useLP,
        rrr,
        itemSellPrice: sellPrice,
        primaryMatPrice,
        secondaryMatPrice,
        artifactPrice,
      });
    }
  }, [
    mode,
    item,
    tier,
    userStartSpec,
    targetSpec,
    strategy,
    useLP,
    rrr,
    sellPrice,
    ingredientCosts,
    primaryMatPrice,
    secondaryMatPrice,
    artifactPrice,
  ]);

  if (!item || !roadmap) return null;

  return (
    <div className="forged-tablet rounded-2xl shadow-xl border border-slate-800/80 relative overflow-hidden">
      {/* Header bar with quick trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/20 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs uppercase tracking-wider font-serif font-bold text-slate-200">
                Fame-to-Max-Spec Planner ({userStartSpec} &rarr; {targetSpec} Spec)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-bold">
                {roadmap.rawFameNeeded.toLocaleString()} Fame Needed
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                {mode === 'food' ? `${roadmap.batchesNeeded.toLocaleString()} Batches` : `${roadmap.craftsNeeded.toLocaleString()} Crafts`}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Calculate exact items, crop harvests, and silver required to level from Spec {userStartSpec} to {targetSpec}.
            </p>
          </div>
        </div>

        <button type="button" className="p-1.5 rounded-lg bg-[#06090f] border border-slate-800 text-slate-400 hover:text-white cursor-pointer">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Interactive Planner */}
      {isOpen && (
        <div className="p-4 border-t border-slate-800/80 bg-[#06090f]/70 space-y-4">
          {/* Controls Strip: Start Spec, Target Spec & Strategy */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[#090e18] border border-slate-800">
            {/* Start Spec */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1">
                <span className="text-slate-400">Starting Spec:</span>
                <span className="text-amber-300 font-bold">{userStartSpec}</span>
              </div>
              <input
                type="range"
                min="0"
                max="99"
                value={userStartSpec}
                onChange={(e) => {
                  const val = Math.min(parseInt(e.target.value, 10), targetSpec - 1);
                  setUserStartSpec(val);
                }}
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Target Spec */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1">
                <span className="text-slate-400">Target Spec:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-300 font-bold">{targetSpec}</span>
                  {targetSpec !== 100 && (
                    <button
                      type="button"
                      onClick={() => setTargetSpec(100)}
                      className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    >
                      Max 100
                    </button>
                  )}
                </div>
              </div>
              <input
                type="range"
                min={userStartSpec + 1}
                max="100"
                value={targetSpec}
                onChange={(e) => setTargetSpec(Math.max(userStartSpec + 1, parseInt(e.target.value, 10)))}
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Leveling Strategy */}
            <div>
              <span className="text-xs font-mono text-slate-400 block mb-1">Strategy:</span>
              <div className="flex items-center bg-[#06090f] p-0.5 rounded-lg border border-slate-800 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setStrategy('sell')}
                  className={`flex-1 py-1 rounded text-center transition-all cursor-pointer ${
                    strategy === 'sell'
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Sell finished items on market to recover silver"
                >
                  Craft &amp; Sell
                </button>
                <button
                  type="button"
                  onClick={() => setStrategy('study')}
                  className={`flex-1 py-1 rounded text-center transition-all cursor-pointer ${
                    strategy === 'study'
                      ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Study crafted items for 275% fame (2.75x speedup, destroys item)"
                >
                  Study (2.75x)
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
            {/* Total Crafts / Batches */}
            <div className="bg-[#090e18] p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-sans">
                {mode === 'food' ? 'Batches to Cook' : 'Items to Craft'}
              </span>
              <span className="font-extrabold text-amber-300 text-base block mt-0.5">
                {mode === 'food' ? roadmap.batchesNeeded.toLocaleString() : roadmap.craftsNeeded.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {mode === 'food' ? `${roadmap.totalUnitsProduced.toLocaleString()} pies/meals` : `+${roadmap.effectiveFamePerCraft || roadmap.effectiveFamePerBatch} fame/ea`}
              </span>
            </div>

            {/* Net Silver Balance */}
            <div className={`p-3 rounded-xl border ${
              roadmap.isProfitable
                ? 'bg-emerald-950/20 border-emerald-500/40'
                : 'bg-rose-950/20 border-rose-500/40'
            }`}>
              <span className="text-[10px] text-slate-400 block uppercase font-sans">
                Net Silver Investment
              </span>
              <span className={`font-extrabold text-base block mt-0.5 ${
                roadmap.isProfitable ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {roadmap.netSilverBalance >= 0 ? '+' : ''}{Math.round(roadmap.netSilverBalance).toLocaleString()}s
              </span>
              <span className="text-[10px] text-slate-400 block">
                {roadmap.isProfitable ? 'Profitable leveling!' : `${roadmap.silverPerFame} silver / fame`}
              </span>
            </div>

            {/* Filled Journals */}
            <div className="bg-[#090e18] p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-sans">
                Journals Filled
              </span>
              <span className="font-extrabold text-sky-400 text-base block mt-0.5">
                {roadmap.journalsFilled.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                T{tier} {mode === 'food' ? 'Chef' : 'Crafting'} Journals
              </span>
            </div>

            {/* Learning Points Option */}
            <div className="bg-[#090e18] p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 block uppercase font-sans">
                Learning Points (LP)
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={useLP}
                  onChange={(e) => setUseLP(e.target.checked)}
                  className="accent-amber-400 rounded"
                />
                <span className="text-[11px] text-slate-200 font-sans">
                  Use LP (20% threshold)
                </span>
              </label>
              <span className="text-[9px] text-slate-500 block">
                {useLP ? 'Saves 80% fame grind' : 'Bypass 80% with LP'}
              </span>
            </div>
          </div>

          {/* Farm Ingredient Requisites (for Food) or Material Requisites (for Gear) */}
          {mode === 'food' && roadmap.ingredientsBreakdown && (
            <div className="bg-[#090e18] p-3 rounded-xl border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-serif font-bold text-emerald-300 flex items-center gap-1.5">
                  <Wheat className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Farm Harvest Demand to Hit Spec {targetSpec}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {rrr > 0 ? `After ${(rrr * 100).toFixed(1)}% RRR Refunds` : 'No Return Rate'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {roadmap.ingredientsBreakdown.map((ing) => (
                  <div key={ing.uniqueName} className="bg-[#06090f] p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block truncate" title={ing.name}>
                      {ing.name}
                    </span>
                    <span className="font-bold text-amber-300 block text-xs mt-0.5">
                      {ing.netConsumed.toLocaleString()} needed
                    </span>
                    <span className="text-[9px] text-slate-500 block">
                      ({ing.grossNeeded.toLocaleString()} gross)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === 'gear' && (
            <div className="bg-[#090e18] p-3 rounded-xl border border-sky-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-serif font-bold text-sky-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-sky-400" />
                  <span>Refined Materials Demand to Hit Spec {targetSpec}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {(rrr * 100).toFixed(1)}% RRR Applied
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-[#06090f] p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Primary Resource</span>
                  <span className="font-bold text-amber-300 block text-xs mt-0.5">
                    {roadmap.primaryNet.toLocaleString()} net bars/leather
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    ({roadmap.primaryGross.toLocaleString()} upfront)
                  </span>
                </div>
                {roadmap.secondaryNet > 0 && (
                  <div className="bg-[#06090f] p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Secondary Resource</span>
                    <span className="font-bold text-amber-300 block text-xs mt-0.5">
                      {roadmap.secondaryNet.toLocaleString()} net mats
                    </span>
                    <span className="text-[9px] text-slate-500 block">
                      ({roadmap.secondaryGross.toLocaleString()} upfront)
                    </span>
                  </div>
                )}
                {roadmap.artifactCount > 0 && (
                  <div className="bg-[#06090f] p-2 rounded-lg border border-purple-500/30">
                    <span className="text-purple-300 text-[10px] block">Artifacts Needed</span>
                    <span className="font-bold text-purple-300 block text-xs mt-0.5">
                      {roadmap.artifactCount.toLocaleString()} artifacts
                    </span>
                    <span className="text-[9px] text-slate-500 block">
                      (0% RRR on artifacts)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
