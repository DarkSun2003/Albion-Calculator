import React from 'react';
import { RESOURCES, getItemIdentifier, getItemIconPath } from '../utils/albionMath';
import ItemIcon from './ItemIcon';
import { AlertCircle } from 'lucide-react';

const TIERS = [
  { level: 2, name: 'Novice', border: 'border-amber-700/80', text: 'text-amber-500', bg: 'bg-amber-950/30' },
  { level: 3, name: 'Journeyman', border: 'border-emerald-700/80', text: 'text-emerald-400', bg: 'bg-emerald-950/30' },
  { level: 4, name: 'Adept', border: 'border-sky-600/80', text: 'text-sky-400', bg: 'bg-sky-950/30' },
  { level: 5, name: 'Expert', border: 'border-red-600/80', text: 'text-red-400', bg: 'bg-red-950/30' },
  { level: 6, name: 'Master', border: 'border-orange-600/80', text: 'text-orange-400', bg: 'bg-orange-950/30' },
  { level: 7, name: 'Grandmaster', border: 'border-yellow-500/80', text: 'text-yellow-400', bg: 'bg-yellow-950/30' },
  { level: 8, name: 'Elder', border: 'border-slate-200/90', text: 'text-slate-100', bg: 'bg-slate-800/40' },
];

const ENCHANTMENTS = [
  { level: 0, name: '.0 Flat', label: '.0', color: 'border-slate-700 text-slate-300 bg-slate-900/60' },
  { level: 1, name: '.1 Uncommon', label: '.1', color: 'border-emerald-600/80 text-emerald-400 bg-emerald-950/40' },
  { level: 2, name: '.2 Rare', label: '.2', color: 'border-sky-500/80 text-sky-400 bg-sky-950/40' },
  { level: 3, name: '.3 Exceptional', label: '.3', color: 'border-purple-500/80 text-purple-400 bg-purple-950/40' },
  { level: 4, name: '.4 Pristine', label: '.4', color: 'border-amber-500/90 text-amber-300 bg-amber-950/40' },
];

export default function ResourceSelector({
  selectedResource,
  setSelectedResource,
  selectedTier,
  setSelectedTier,
  selectedEnchantment,
  setSelectedEnchantment,
}) {
  const currentResource = RESOURCES[selectedResource];
  const isStone = selectedResource === 'stone';
  const isLowTier = selectedTier < 4;

  const handleResourceChange = (key) => {
    setSelectedResource(key);
    if (key === 'stone' && selectedEnchantment > 3) {
      setSelectedEnchantment(3);
    }
  };

  const handleTierChange = (tierLevel) => {
    setSelectedTier(tierLevel);
    if (tierLevel < 4 && selectedEnchantment > 0) {
      setSelectedEnchantment(0);
    }
  };

  const getMatClass = (key) => {
    switch (key) {
      case 'wood': return 'mat-wood';
      case 'ore': return 'mat-ore';
      case 'hide': return 'mat-hide';
      case 'fiber': return 'mat-fiber';
      case 'stone': return 'mat-stone';
      default: return '';
    }
  };

  return (
    <div className="forged-tablet rounded-2xl p-3.5 sm:p-5 shadow-lg border border-slate-800/80 space-y-4">
      {/* 1. Resource Selector (Single Row on All Screens) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs uppercase tracking-wider text-slate-300 font-serif font-bold">
            Select Resource
          </label>
          <span className="text-[11px] font-mono text-amber-300 font-bold">
            🏛️ {currentResource.bonusCity} (+40% RRR)
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
          {Object.entries(RESOURCES).map(([key, res]) => {
            const isSelected = selectedResource === key;
            const matClass = getMatClass(key);
            const previewItemId = getItemIdentifier(key, selectedTier, isLowTier ? 0 : (isStone && selectedEnchantment > 3 ? 3 : selectedEnchantment), true);
            const iconSrc = getItemIconPath(previewItemId);

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleResourceChange(key)}
                className={`relative flex flex-col items-center justify-between p-2 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer min-h-[72px] sm:min-h-[88px] ${matClass} ${
                  isSelected 
                    ? 'active ring-2 ring-amber-400 bg-amber-500/10 shadow-md scale-[1.02]' 
                    : 'opacity-80 hover:opacity-100 hover:bg-slate-800/50'
                }`}
              >
                <div className="w-8 h-8 sm:w-11 sm:h-11 my-0.5 relative flex items-center justify-center">
                  <ItemIcon
                    src={iconSrc}
                    itemId={previewItemId}
                    alt={res.name}
                    className="w-8 h-8 sm:w-11 sm:h-11 object-contain drop-shadow"
                  />
                </div>

                <div className="w-full">
                  <span className="font-serif font-bold text-[11px] sm:text-xs text-slate-100 block truncate">
                    {res.name}
                  </span>
                  <span className="text-[9px] text-slate-400 hidden sm:block truncate">
                    {res.refinedName}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Tier Selector (T2 - T8) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs uppercase tracking-wider text-slate-300 font-serif font-bold">
            Tier
          </label>
          <span className="text-xs font-mono text-slate-400">
            Active: <span className="text-slate-100 font-bold">Tier {selectedTier} ({TIERS.find(t => t.level === selectedTier)?.name})</span>
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {TIERS.map((tier) => {
            const isSelected = selectedTier === tier.level;

            return (
              <button
                key={tier.level}
                type="button"
                onClick={() => handleTierChange(tier.level)}
                className={`py-2 px-1 rounded-xl border font-mono font-bold text-center transition-all cursor-pointer text-xs sm:text-sm min-h-[42px] flex flex-col items-center justify-center ${
                  isSelected
                    ? `${tier.border} ${tier.text} ${tier.bg} ring-1 ring-white/40 shadow-sm scale-[1.02]`
                    : 'bg-[#090e18] border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>T{tier.level}</div>
                <div className="text-[8.5px] font-normal opacity-75 hidden sm:block truncate">{tier.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Enchantment Selector (.0 - .4) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <label className="text-xs uppercase tracking-wider text-slate-300 font-serif font-bold">
              Enchantment
            </label>
            {isLowTier && (
              <span className="text-[9.5px] text-sky-400 font-mono flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                T2/T3 are flat only
              </span>
            )}
          </div>

          <span className="text-xs font-mono text-slate-400">
            {isStone && selectedEnchantment > 0 ? (
              <span className="text-amber-300 font-bold">{Math.pow(2, selectedEnchantment)}x Blocks</span>
            ) : (
              <span className="text-slate-300">{ENCHANTMENTS.find(e => e.level === selectedEnchantment)?.name}</span>
            )}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {ENCHANTMENTS.map((ench) => {
            const isSelected = selectedEnchantment === ench.level;
            const isDisabled = (isLowTier && ench.level > 0) || (isStone && ench.level > 3);

            return (
              <button
                key={ench.level}
                type="button"
                disabled={isDisabled}
                onClick={() => setSelectedEnchantment(ench.level)}
                className={`py-2 px-1 rounded-xl border font-mono font-bold text-center transition-all text-xs sm:text-sm min-h-[42px] flex flex-col items-center justify-center cursor-pointer ${
                  isDisabled
                    ? 'opacity-20 bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed'
                    : isSelected
                    ? `${ench.color} ring-1 ring-white/40 shadow-sm scale-[1.02]`
                    : 'bg-[#090e18] border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>{ench.label}</div>
                <div className="text-[8.5px] font-normal opacity-85 hidden sm:block truncate">
                  {isStone && ench.level > 0 ? `${Math.pow(2, ench.level)}x` : ench.name.split(' ')[1]}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
