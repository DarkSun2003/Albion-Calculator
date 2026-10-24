import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Zap, Award } from 'lucide-react';

const TIER_NODE_NAMES = {
  4: 'T4 Adept',
  5: 'T5 Expert',
  6: 'T6 Master',
  7: 'T7 Grandmaster',
  8: 'T8 Elder',
};

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
  const [isOpen, setIsOpen] = useState(false);

  const totalSpec = [4, 5, 6, 7, 8].reduce((acc, t) => acc + (Number(specLevels[t]) || 0), 0);

  const handleSpecChange = (tier, val) => {
    setSpecLevels((prev) => ({
      ...prev,
      [tier]: Math.max(0, Math.min(100, parseInt(val) || 0)),
    }));
  };

  const handlePreset = (lvl, e) => {
    if (e) e.stopPropagation();
    if (setMasteryLevel) setMasteryLevel(lvl);
    setSpecLevels({ 4: lvl, 5: lvl, 6: lvl, 7: lvl, 8: lvl });
  };

  return (
    <div className="forged-tablet rounded-2xl shadow-xl border border-slate-800/80 relative overflow-hidden">
      {/* Header Bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/20 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border ${useFocus ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' : 'bg-[#06090f] border-slate-800 text-slate-500'}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs uppercase tracking-wider font-serif font-bold text-slate-200">
                Destiny Board Specialization
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                {totalSpec} / 500 Spec
              </span>
              {useFocus && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30 font-bold">
                  {focusPerUnit} Focus / Craft
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              {useFocus 
                ? `Focus ACTIVE: ${totalFocusNeeded.toLocaleString()} total focus points needed.` 
                : 'Focus is OFF. Click the toggle to calculate with +53.9% return rate.'}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 ml-auto" onClick={(e) => e.stopPropagation()}>
          {/* Quick Focus Toggle Button */}
          {setUseFocus && (
            <button
              type="button"
              onClick={() => setUseFocus(!useFocus)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
                useFocus
                  ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-sm'
                  : 'bg-[#06090f] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${useFocus ? 'text-sky-300 fill-sky-300' : 'text-slate-500'}`} />
              <span>{useFocus ? 'Focus: ON' : 'Focus: OFF'}</span>
            </button>
          )}

          {/* Quick 1-Click Spec Presets */}
          <div className="flex items-center bg-[#06090f] p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={(e) => handlePreset(0, e)}
              className={`text-[10px] font-mono px-2 py-1 rounded transition-all cursor-pointer ${
                totalSpec === 0 ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Set all specs to 0"
            >
              0
            </button>
            <button
              type="button"
              onClick={(e) => handlePreset(50, e)}
              className={`text-[10px] font-mono px-2 py-1 rounded transition-all cursor-pointer ${
                totalSpec === 250 ? 'bg-sky-500/30 text-sky-200 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Set all specs to 50"
            >
              250
            </button>
            <button
              type="button"
              onClick={(e) => handlePreset(100, e)}
              className={`text-[10px] font-mono px-2 py-1 rounded transition-all cursor-pointer ${
                totalSpec === 500 ? 'bg-amber-500/30 text-amber-200 font-bold' : 'text-amber-400/80 hover:text-amber-300'
              }`}
              title="Set all specs to 100 (Max 500)"
            >
              Max
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg bg-[#06090f] border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
            title={isOpen ? 'Collapse sliders' : 'Expand sliders'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-4 border-t border-slate-800/80 bg-[#06090f]/70 space-y-3.5">
          {/* Destiny Board 500/500 Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-mono text-[11px]">
                5-Node Mastery Tree (T4-T8 independent nodes)
              </span>
              <span className="font-mono text-amber-300 font-bold text-xs">{totalSpec} / 500</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div 
                className="bg-gradient-to-r from-sky-500 via-amber-500 to-amber-300 h-1.5 rounded-full transition-all duration-200"
                style={{ width: `${(totalSpec / 500) * 100}%` }}
              />
            </div>
          </div>

          {/* Specialization Sliders (T4 to T8) */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {[4, 5, 6, 7, 8].map((t) => {
              const specVal = specLevels[t] || 0;
              const isCurrentTier = selectedTier === t;
              const nodeName = TIER_NODE_NAMES[t];

              return (
                <div
                  key={t}
                  className={`p-2.5 rounded-xl border text-xs transition-all ${
                    isCurrentTier
                      ? 'bg-gradient-to-b from-sky-950/30 to-[#090e18] border-sky-500/50'
                      : 'bg-[#090e18] border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-serif font-bold text-[11px] truncate ${isCurrentTier ? 'text-sky-200' : 'text-slate-300'}`}>
                      {nodeName}
                    </span>
                    <span className="font-mono font-bold text-amber-300">{specVal}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={specVal}
                    onChange={(e) => handleSpecChange(t, e.target.value)}
                    className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="text-[9px] font-mono mt-1 flex justify-between items-center">
                    <span className="text-slate-500">Tier {t}</span>
                    <span className={isCurrentTier ? 'text-sky-300 font-semibold' : 'text-slate-500'}>
                      {isCurrentTier ? '+280 eff' : '+30 eff'}
                    </span>
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
