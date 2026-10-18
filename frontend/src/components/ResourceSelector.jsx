import React from 'react';
import { RESOURCES, getItemIdentifier, getItemIconPath } from '../utils/albionMath';
import ItemIcon from './ItemIcon';
import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

const TIERS = [
  { level: 2, name: 'Novice', border: 'border-amber-700/80', text: 'text-amber-500', bg: 'bg-amber-950/30', activeGlow: 'shadow-[0_0_15px_rgba(217,119,6,0.3)]' },
  { level: 3, name: 'Journeyman', border: 'border-emerald-700/80', text: 'text-emerald-400', bg: 'bg-emerald-950/30', activeGlow: 'shadow-[0_0_15px_rgba(34,197,94,0.3)]' },
  { level: 4, name: 'Adept', border: 'border-sky-600/80', text: 'text-sky-400', bg: 'bg-sky-950/30', activeGlow: 'shadow-[0_0_15px_rgba(56,189,248,0.35)]' },
  { level: 5, name: 'Expert', border: 'border-red-600/80', text: 'text-red-400', bg: 'bg-red-950/30', activeGlow: 'shadow-[0_0_15px_rgba(239,68,68,0.35)]' },
  { level: 6, name: 'Master', border: 'border-orange-600/80', text: 'text-orange-400', bg: 'bg-orange-950/30', activeGlow: 'shadow-[0_0_15px_rgba(249,115,22,0.35)]' },
  { level: 7, name: 'Grandmaster', border: 'border-yellow-500/80', text: 'text-yellow-400', bg: 'bg-yellow-950/30', activeGlow: 'shadow-[0_0_15px_rgba(234,179,8,0.35)]' },
  { level: 8, name: 'Elder', border: 'border-slate-200/90', text: 'text-slate-100', bg: 'bg-slate-800/40', activeGlow: 'shadow-[0_0_20px_rgba(248,250,252,0.4)]' },
];

const ENCHANTMENTS = [
  { level: 0, name: '.0 Flat', label: '.0', color: 'border-slate-700 text-slate-300 bg-slate-900/60', glow: '' },
  { level: 1, name: '.1 Uncommon', label: '.1', color: 'border-emerald-600/80 text-emerald-400 bg-emerald-950/40', glow: 'shadow-[0_0_14px_rgba(34,197,94,0.4)]' },
  { level: 2, name: '.2 Rare', label: '.2', color: 'border-sky-500/80 text-sky-400 bg-sky-950/40', glow: 'shadow-[0_0_14px_rgba(14,165,233,0.4)]' },
  { level: 3, name: '.3 Exceptional', label: '.3', color: 'border-purple-500/80 text-purple-400 bg-purple-950/40', glow: 'shadow-[0_0_14px_rgba(168,85,247,0.45)]' },
  { level: 4, name: '.4 Pristine', label: '.4', color: 'border-amber-500/90 text-amber-300 bg-amber-950/40', glow: 'shadow-[0_0_18px_rgba(245,158,11,0.55)]' },
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

  // Mat card CSS class mapping
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
    <div className="forged-tablet rounded-2xl p-4 sm:p-5 shadow-[0_12px_36px_rgba(0,0,0,0.85)] border border-albion-border/80 space-y-5 relative overflow-hidden">
      {/* Subtle top edge gold hairline */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

      {/* 1. Resource Selector with Real Tactile Textures & Albion Icons */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs uppercase tracking-wider text-slate-200 font-serif font-bold flex items-center gap-2">
            <span className="text-[9.5px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 font-extrabold shadow-gold-glow">
              STAGE 01
            </span>
            <span>Raw Resource &bull; Refining Station</span>
          </label>
          <span className="text-[11px] font-mono text-slate-400">
            Active: <span className="text-amber-300 font-bold">{currentResource.name}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {Object.entries(RESOURCES).map(([key, res]) => {
            const isSelected = selectedResource === key;
            const matClass = getMatClass(key);
            
            // Get local render icon for preview
            const previewItemId = getItemIdentifier(key, selectedTier, isLowTier ? 0 : (isStone && selectedEnchantment > 3 ? 3 : selectedEnchantment), true);
            const iconSrc = getItemIconPath(previewItemId);

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleResourceChange(key)}
                className={`relative flex flex-col items-center justify-between p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer ${matClass} ${
                  isSelected ? 'active ring-2 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-[1.03]' : 'opacity-85 hover:opacity-100 hover:-translate-y-0.5'
                }`}
              >
                {/* Local or CDN Albion Official Item Icon */}
                <div className="w-14 h-14 my-1 relative flex items-center justify-center">
                  <ItemIcon
                    src={iconSrc}
                    itemId={previewItemId}
                    alt={res.name}
                    className="w-14 h-14 object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.8)]"
                  />
                  <span className="text-2xl absolute opacity-20 pointer-events-none">{res.icon}</span>
                </div>

                <div className="w-full">
                  <span className="font-serif font-bold text-xs text-slate-100 block truncate">{res.rawName}</span>
                  <span className="text-[10px] text-slate-400 block truncate font-sans">
                    Refines: <strong className="text-slate-200">{res.refinedName}</strong>
                  </span>
                  <span className="text-[9.5px] font-mono mt-1 px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-amber-300 block truncate font-semibold">
                    🏛️ {res.bonusCity}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Official Game Tier Selector (T2 - T8) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs uppercase tracking-wider text-slate-300 font-serif font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-gold-glow" />
            Resource Tier
          </label>
          <span className="text-xs font-mono text-slate-400">
            Active: <span className="text-slate-100 font-bold">Tier {selectedTier} ({TIERS.find(t => t.level === selectedTier)?.name})</span>
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {TIERS.map((tier) => {
            const isSelected = selectedTier === tier.level;

            return (
              <button
                key={tier.level}
                type="button"
                onClick={() => handleTierChange(tier.level)}
                className={`py-2 px-1 rounded-xl border font-mono font-bold text-center transition-all duration-200 cursor-pointer text-xs sm:text-sm ${
                  isSelected
                    ? `${tier.border} ${tier.text} ${tier.bg} ${tier.activeGlow} ring-1 ring-white/40 scale-[1.04] shadow-lg`
                    : 'bg-[#090e18] border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-600 hover:-translate-y-0.5'
                }`}
              >
                <div className="tracking-tight">T{tier.level}</div>
                <div className="text-[9px] font-normal opacity-75 hidden sm:block truncate">{tier.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Official Game Enchantment Selector (.0 - .4) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label className="text-xs uppercase tracking-wider text-slate-300 font-serif font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-gold-glow" />
              Enchantment
            </label>
            {isLowTier ? (
              <span className="text-[10px] text-sky-400/90 flex items-center gap-1 font-mono bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                <AlertCircle className="w-3 h-3" />
                T2 & T3 are flat .0 only
              </span>
            ) : isStone ? (
              <span className="text-[10px] text-amber-400/90 flex items-center gap-1 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <AlertCircle className="w-3 h-3" />
                Stone raw caps at .3 (No .4)
              </span>
            ) : null}
          </div>

          <span className="text-xs font-mono text-slate-400">
            Multiplier: <span className="text-amber-300 font-bold">
              {isLowTier
                ? 'Standard 1x'
                : isStone 
                ? `${Math.pow(2, selectedEnchantment)}x Blocks Multiplier`
                : `${ENCHANTMENTS.find(e => e.level === selectedEnchantment)?.name}`}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {ENCHANTMENTS.map((ench) => {
            const isSelected = selectedEnchantment === ench.level;
            const isDisabled = (isLowTier && ench.level > 0) || (isStone && ench.level > 3);

            return (
              <button
                key={ench.level}
                type="button"
                disabled={isDisabled}
                onClick={() => setSelectedEnchantment(ench.level)}
                className={`py-2 px-1.5 rounded-xl border font-mono font-bold text-center transition-all duration-200 text-xs sm:text-sm relative cursor-pointer ${
                  isDisabled
                    ? 'opacity-20 bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed'
                    : isSelected
                    ? `${ench.color} ${ench.glow} ring-1 ring-white/50 scale-[1.04] shadow-lg`
                    : 'bg-[#090e18] border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-600 hover:-translate-y-0.5'
                }`}
              >
                <div>{ench.label}</div>
                <div className="text-[9px] font-normal opacity-85 hidden sm:block truncate">
                  {isStone 
                    ? (ench.level === 0 ? '1x Blocks' : `${Math.pow(2, ench.level)}x Blocks`)
                    : ench.name.split(' ')[1]}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
