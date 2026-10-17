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
  const [isOpen, setIsOpen] = useState(true);

  const handleSpecChange = (tier, val) => {
    setSpecLevels((prev) => ({
      ...prev,
      [tier]: Math.max(0, Math.min(100, parseInt(val) || 0)),
    }));
  };

  const handlePreset = (lvl, e) => {
    if (e) e.stopPropagation();
    setMasteryLevel(lvl);
    setSpecLevels({ 4: lvl, 5: lvl, 6: lvl, 7: lvl, 8: lvl });
  };

  const handleMaxAll = (e) => handlePreset(100, e);
  const handleReset = (e) => handlePreset(0, e);

  return (
    <div className="bg-albion-card border border-albion-border rounded-xl shadow-lg overflow-hidden">
      {/* Header Bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-albion-surface/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${useFocus ? 'bg-sky-500/20 border-sky-500/40 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]' : 'bg-albion-bg border-albion-border text-slate-500'}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-bold">
                Stage 04
              </span>
              <h3 className="text-sm font-serif font-bold text-slate-200">
                Destiny Board Focus &amp; Specialization
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                {focusPerUnit} Focus / Craft
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {useFocus 
                ? `Total Focus Needed: ${totalFocusNeeded.toLocaleString()} points (Mastery ${masteryLevel}/100)` 
                : 'Turn Focus ON in the top bar to activate +53.9% return rate & Silver/Focus metrics.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Instant 1-Click Spec Presets Visible Without Opening Accordion */}
          <div className="flex items-center gap-1 bg-albion-bg/90 p-1 rounded-lg border border-albion-border" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => handlePreset(0, e)}
              className={`text-[10px] font-mono px-2 py-1 rounded transition-colors cursor-pointer ${
                masteryLevel === 0 ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Set all specs to 0"
            >
              0 Spec
            </button>
            <button
              type="button"
              onClick={(e) => handlePreset(50, e)}
              className={`text-[10px] font-mono px-2 py-1 rounded transition-colors cursor-pointer ${
                masteryLevel === 50 ? 'bg-sky-500/30 text-sky-200 border border-sky-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Set Mastery & Specs to 50"
            >
              50 Spec
            </button>
            <button
              type="button"
              onClick={(e) => handlePreset(100, e)}
              className={`text-[10px] font-mono px-2 py-1 rounded transition-colors cursor-pointer ${
                masteryLevel === 100 ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50 font-bold' : 'text-amber-400/80 hover:text-amber-300'
              }`}
              title="Set Mastery & All Specs to 100 (Max Efficiency)"
            >
              ⚡ Max 100
            </button>
          </div>

          <button
            type="button"
            className="p-1.5 rounded-lg bg-albion-bg border border-albion-border text-slate-300 hover:text-white"
            title={isOpen ? 'Collapse sliders' : 'Expand individual tier sliders'}
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
              Every 10,000 Focus Efficiency cuts focus cost in half. Adjust individual tiers below:
            </span>
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
