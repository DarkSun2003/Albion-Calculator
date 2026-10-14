import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, RotateCcw, Zap } from 'lucide-react';
import { calculateFocusCost, calculateReturnRate } from '../utils/albionMath';

export default function FocusSpecManager({
  selectedResource,
  selectedTier,
  selectedEnchantment,
  masteryLevel,
  setMasteryLevel,
  specLevels,
  setSpecLevels,
  useFocus,
  focusPerUnit,
  totalFocusNeeded,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSpecChange = (tier, val) => {
    setSpecLevels((prev) => ({
      ...prev,
      [tier]: Math.max(0, Math.min(100, parseInt(val) || 0)),
    }));
  };

  const handleMaxAll = () => {
    setMasteryLevel(100);
    setSpecLevels({ 4: 100, 5: 100, 6: 100, 7: 100, 8: 100 });
  };

  const handleReset = () => {
    setMasteryLevel(0);
    setSpecLevels({ 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
  };

  return (
    <div className="bg-albion-card border border-albion-border rounded-xl shadow-lg overflow-hidden">
      {/* Header Bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-albion-surface/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${useFocus ? 'bg-sky-500/20 border-sky-500/40 text-sky-400' : 'bg-albion-bg border-albion-border text-slate-500'}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-serif font-bold text-slate-200">
                Destiny Board Focus & Specialization
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                {focusPerUnit} Focus / Craft
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {useFocus 
                ? `Total Focus Needed: ${totalFocusNeeded.toLocaleString()} points` 
                : 'Turn Focus ON above to simulate focus consumption and silver/focus ratio.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-albion-gold hidden sm:inline">
            Mastery: {masteryLevel}/100
          </span>
          <button
            type="button"
            className="p-1 rounded text-slate-400 hover:text-slate-200"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-albion-border/70 bg-albion-bg/40 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-sans">
              Every 10,000 Focus Efficiency cuts focus cost in half.
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleMaxAll}
                className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40"
              >
                <Zap className="w-3 h-3" />
                Max Spec (100)
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>

          {/* Mastery Slider */}
          <div className="bg-albion-surface/60 p-3 rounded-lg border border-albion-border">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-slate-200">
                Refining Mastery Level (Node 1-100)
              </span>
              <span className="font-mono text-albion-gold font-bold">{masteryLevel} / 100</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={masteryLevel}
              onChange={(e) => setMasteryLevel(parseInt(e.target.value))}
              className="w-full accent-albion-gold cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Grants +30 Focus Efficiency per level to ALL tiers of this resource.
            </span>
          </div>

          {/* Specialization Sliders (T4 to T8) */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[4, 5, 6, 7, 8].map((t) => {
              const specVal = specLevels[t] || 0;
              const isCurrentTier = selectedTier === t;

              return (
                <div
                  key={t}
                  className={`p-2.5 rounded-lg border text-xs ${
                    isCurrentTier
                      ? 'bg-sky-500/10 border-sky-500/40'
                      : 'bg-albion-surface/40 border-albion-border'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold font-mono text-slate-200">Tier {t} Spec</span>
                    <span className="font-mono font-bold text-amber-300">{specVal}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={specVal}
                    onChange={(e) => handleSpecChange(t, e.target.value)}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="text-[9px] text-slate-500 mt-1">
                    {isCurrentTier ? '+250 eff/lvl (active)' : '+30 eff/lvl (cross)'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
