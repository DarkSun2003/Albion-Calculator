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
  setUseFocus,
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
    <div className="forged-tablet shadow-2xl relative overflow-hidden">
      {/* Subtle top edge arcane cyan filament */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />

      {/* Header Bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${useFocus ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.3)]' : 'bg-[#06090f] border-[#1e2a3c] text-slate-500'}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30 font-bold">
                Stage 06
              </span>
              <h3 className="text-sm font-serif font-bold text-slate-100 tracking-wide">
                Destiny Board Focus &amp; Specialization Mastery
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30 font-bold">
                {focusPerUnit} Focus / Craft
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              {useFocus 
                ? `Total Focus Needed: ${totalFocusNeeded.toLocaleString()} points (Mastery ${masteryLevel}/100)` 
                : 'Focus is OFF. Click the Focus button to activate +53.9% return rate & Silver/Focus metrics.'}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 ml-auto">
          {/* Direct Focus Toggle Button */}
          {setUseFocus && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setUseFocus(!useFocus);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition-all border cursor-pointer ${
                useFocus
                  ? 'bg-gradient-to-r from-sky-600/35 to-sky-500/20 border-sky-400 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                  : 'bg-[#06090f] border-[#1e2a3c] text-slate-400 hover:text-slate-200 hover:border-sky-500/40'
              }`}
              title={useFocus ? 'Refining Focus is ACTIVE (+53.9% RRR) - Click to turn OFF' : 'Refining Focus is OFF - Click to turn ON'}
            >
              <Zap className={`w-3.5 h-3.5 ${useFocus ? 'text-sky-300 fill-sky-300 animate-pulse' : 'text-slate-500'}`} />
              <span>{useFocus ? '⚡ Focus: ON' : 'Focus: OFF'}</span>
            </button>
          )}

          {/* Instant 1-Click Spec Presets Visible Without Opening Accordion */}
          <div className="flex items-center gap-1 bg-[#06090f] p-1 rounded-lg border border-[#1e2a3c]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => handlePreset(0, e)}
              className={`text-[10px] font-mono px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                masteryLevel === 0 ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Set all specs to 0"
            >
              0 Spec
            </button>
            <button
              type="button"
              onClick={(e) => handlePreset(50, e)}
              className={`text-[10px] font-mono px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                masteryLevel === 50 ? 'bg-sky-500/30 text-sky-200 border border-sky-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Set Mastery & Specs to 50"
            >
              50 Spec
            </button>
            <button
              type="button"
              onClick={(e) => handlePreset(100, e)}
              className={`text-[10px] font-mono px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                masteryLevel === 100 ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50 font-bold shadow-gold-glow' : 'text-amber-400/80 hover:text-amber-300'
              }`}
              title="Set Mastery & All Specs to 100 (Max Efficiency)"
            >
              ⚡ Max 100
            </button>
          </div>

          <button
            type="button"
            className="p-1.5 rounded-lg bg-[#06090f] border border-[#1e2a3c] text-slate-300 hover:text-white cursor-pointer"
            title={isOpen ? 'Collapse sliders' : 'Expand individual tier sliders'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-[#1c2738]/80 bg-[#070b13]/60 space-y-4">
          {/* Quick Focus Status & Toggle Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#0b121d] border border-[#1e2a3c] shadow-inner">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${useFocus ? 'text-sky-400' : 'text-slate-500'}`} />
              <span className="text-xs text-slate-300 font-sans">
                {useFocus
                  ? `Focus is active: +53.9% Resource Return Rate applied across all calculations (${focusPerUnit} focus / craft).`
                  : 'Focus is currently inactive. Click the button to calculate with Royal Focus (+53.9% RRR).'}
              </span>
            </div>
            {setUseFocus && (
              <button
                type="button"
                onClick={() => setUseFocus(!useFocus)}
                className={`px-3 py-1 rounded-lg text-xs font-serif font-bold transition-all border cursor-pointer ${
                  useFocus
                    ? 'bg-sky-500/25 border-sky-400 text-sky-200 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                    : 'bg-[#06090f] border-[#1e2a3c] text-slate-300 hover:text-white hover:border-sky-500/50'
                }`}
              >
                {useFocus ? '⚡ Focus: ON' : 'Turn Focus ON'}
              </button>
            )}
          </div>

          {/* Mastery Slider */}
          <div className="bg-[#0b121d] p-3.5 rounded-xl border border-[#1e2a3c] shadow-inner">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-serif font-bold text-slate-200">
                Refining Mastery Level (Node 1-100)
              </span>
              <span className="font-mono text-amber-300 font-bold text-sm">{masteryLevel} / 100</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={masteryLevel}
              onChange={(e) => setMasteryLevel(parseInt(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 mt-1 block font-mono">
              Grants +30 Focus Efficiency per level to ALL tiers of this resource (+{masteryLevel * 30} total).
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
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    isCurrentTier
                      ? 'bg-gradient-to-b from-sky-950/40 to-[#0b121d] border-sky-500/50 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                      : 'bg-[#0b121d] border-[#1e2a3c]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-serif font-bold text-slate-200">Tier {t} Spec</span>
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
                  <div className="text-[9px] font-mono text-slate-400 mt-1.5 truncate">
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
