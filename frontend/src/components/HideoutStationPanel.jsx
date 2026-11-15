import React from 'react';
import { Shield, Sparkles, Sliders } from 'lucide-react';
import NumberInput from './NumberInput';
import {
  HO_POWER_GENERAL_BONUS,
  calculateHideoutBonusPct,
  computeTotalRrr,
} from '../utils/albionMath';

const ZONE_QUALITIES = [
  { q: 1, bonus: 1 },
  { q: 2, bonus: 6 },
  { q: 3, bonus: 11 },
  { q: 4, bonus: 16 },
  { q: 5, bonus: 21 },
  { q: 6, bonus: 26 },
];

const ACCENT_MAP = {
  amber: {
    pillActive: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
    badge: 'text-amber-300',
    icon: 'text-amber-400',
    toggleActive: 'bg-amber-500/15 border-amber-500/50 text-amber-200',
  },
  purple: {
    pillActive: 'bg-purple-500/20 border-purple-500/50 text-purple-300',
    badge: 'text-purple-300',
    icon: 'text-purple-400',
    toggleActive: 'bg-purple-500/15 border-purple-500/50 text-purple-200',
  },
  teal: {
    pillActive: 'bg-teal-500/20 border-teal-500/50 text-teal-300',
    badge: 'text-teal-300',
    icon: 'text-teal-400',
    toggleActive: 'bg-teal-500/15 border-teal-500/50 text-teal-200',
  },
};

export default function HideoutStationPanel({
  hoPowerLevel,
  setHoPowerLevel,
  hoZoneQuality,
  setHoZoneQuality,
  hoHasSpecialty,
  setHoHasSpecialty,
  hoCustomBonusPct,
  setHoCustomBonusPct,
  dailyBonus = 0,
  useFocus = false,
  specialtyMode = 'crafting',
  specialtyLabel = 'Biome Specialty Match',
  accent = 'amber',
}) {
  const styles = ACCENT_MAP[accent] || ACCENT_MAP.amber;
  const hasCustom = hoCustomBonusPct !== '' && hoCustomBonusPct !== null && hoCustomBonusPct !== undefined;

  const hoOptions = {
    locationMode: 'hideout',
    hoPowerLevel,
    hoZoneQuality,
    hoHasSpecialty,
    hoCustomBonusPct: hasCustom ? Number(hoCustomBonusPct) : null,
    specialtyMode,
  };

  const stationBonusPct = calculateHideoutBonusPct({
    powerLevel: hoPowerLevel,
    zoneQuality: hoZoneQuality,
    hasSpecialty: hoHasSpecialty,
    customBonusPct: hasCustom ? Number(hoCustomBonusPct) : null,
    specialtyMode,
  });

  const baseRrrPct = (
    computeTotalRrr({
      baseCityBonus: 0,
      citySpecialtyBonus: 0,
      dailyBonusPct: dailyBonus,
      useFocus: false,
      ...hoOptions,
    }) * 100
  ).toFixed(2);

  const focusRrrPct = (
    computeTotalRrr({
      baseCityBonus: 0,
      citySpecialtyBonus: 0,
      dailyBonusPct: dailyBonus,
      useFocus: true,
      ...hoOptions,
    }) * 100
  ).toFixed(2);

  const isRefining = specialtyMode === 'refining';
  const isConsumable = specialtyMode === 'food' || specialtyMode === 'potion';
  const isCrafting = !isRefining && !isConsumable;

  const lvl = Math.max(1, Math.min(9, parseInt(hoPowerLevel || 1, 10) || 1));
  const generalBonusPct = HO_POWER_GENERAL_BONUS[lvl] ?? 0;
  const zoneBonusPct = ZONE_QUALITIES.find((z) => z.q === Number(hoZoneQuality))?.bonus ?? 1;
  const specBonusRaw = (lvl - 1) * 3.75;
  const specBonusPct = Number(specBonusRaw.toFixed(2));
  const combinedSpecBonusPct = Number((zoneBonusPct + specBonusRaw).toFixed(2));

  const formatRefiningRrr = ({ hasSpec = false, customBonus = null, focus = false }) =>
    (
      computeTotalRrr({
        baseCityBonus: 0,
        citySpecialtyBonus: 0,
        dailyBonusPct: dailyBonus,
        useFocus: focus,
        locationMode: 'hideout',
        hoPowerLevel,
        hoZoneQuality,
        hoHasSpecialty: hasSpec,
        hoCustomBonusPct: customBonus,
        specialtyMode: 'refining',
      }) * 100
    ).toFixed(2);

  const isRoadsBaseRefining = isRefining && !hoHasSpecialty && hasCustom && Number(hoCustomBonusPct) === 10;
  const isNonRoadsCustomOverride = isRefining && hasCustom && !isRoadsBaseRefining;
  const isRoadsRefining = isRefining && !isNonRoadsCustomOverride && (isRoadsBaseRefining || hoHasSpecialty);
  const isOutlandsRefining = isRefining && !hasCustom && !hoHasSpecialty;

  const outlandsBaseRrr = isRefining ? formatRefiningRrr({ hasSpec: false, customBonus: null, focus: false }) : null;
  const outlandsFocusRrr = isRefining ? formatRefiningRrr({ hasSpec: false, customBonus: null, focus: true }) : null;
  const roadsBaseRrr = isRefining ? formatRefiningRrr({ hasSpec: false, customBonus: 10, focus: false }) : null;
  const roadsBaseFocusRrr = isRefining ? formatRefiningRrr({ hasSpec: false, customBonus: 10, focus: true }) : null;
  const roadsSpecRrr = isRefining ? formatRefiningRrr({ hasSpec: true, customBonus: null, focus: false }) : null;
  const roadsSpecFocusRrr = isRefining ? formatRefiningRrr({ hasSpec: true, customBonus: null, focus: true }) : null;

  return (
    <div className="bg-[#090e18] border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-inner">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-slate-200">
          <Shield className={`w-3.5 h-3.5 ${styles.icon}`} />
          <span>
            {isRefining
              ? 'Hideout Refining Station (Outlands vs. Roads)'
              : isConsumable
                ? `Hideout ${specialtyMode === 'food' ? 'Cook' : 'Alchemist'} Bonus (General Power Level)`
                : 'Black Zone / Roads Hideout Bonus'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-slate-400">
            Prod Bonus: <strong className={styles.badge}>+{stationBonusPct}%</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            RRR: <strong className="text-emerald-300">{useFocus ? focusRrrPct : baseRrrPct}%</strong>
            {!useFocus && <span className="text-slate-500"> ({focusRrrPct}% focus)</span>}
          </span>
        </div>
      </div>

      {isRefining ? (
        <div className={`space-y-2 ${isNonRoadsCustomOverride ? 'opacity-50' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setHoHasSpecialty(false);
                setHoCustomBonusPct('');
              }}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                isOutlandsRefining
                  ? styles.toggleActive
                  : 'bg-[#06090f] border-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                <span>Outlands (Black Zone) Hideout</span>
                <span className="text-emerald-300">+15%</span>
              </div>
              <div className="text-[10px] font-mono text-slate-300 mt-0.5">
                {outlandsBaseRrr}% Base RRR • {outlandsFocusRrr}% Focus
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                Fixed Black Zone rate (NPC Rests also use +15%)
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isRoadsRefining) {
                  setHoHasSpecialty(false);
                  setHoCustomBonusPct('10');
                }
              }}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                isRoadsRefining
                  ? styles.toggleActive
                  : 'bg-[#06090f] border-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                <span>Roads of Avalon Hideout</span>
                <span className={isRoadsRefining && hoHasSpecialty ? 'text-emerald-300' : 'text-amber-300'}>
                  {isRoadsRefining ? `+${hoHasSpecialty ? 20 : 10}%` : '+10% / +20%'}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-300 mt-0.5">
                {isRoadsRefining && hoHasSpecialty
                  ? `${roadsSpecRrr}% Base RRR • ${roadsSpecFocusRrr}% Focus`
                  : `${roadsBaseRrr}% Base RRR • ${roadsBaseFocusRrr}% Focus`}
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                +10% base, or +20% if Roads zone rolls this resource
              </div>
            </button>
          </div>

          {isRoadsRefining && (
            <button
              type="button"
              onClick={() => {
                if (hoHasSpecialty) {
                  setHoHasSpecialty(false);
                  setHoCustomBonusPct('10');
                } else {
                  setHoHasSpecialty(true);
                  setHoCustomBonusPct('');
                }
              }}
              className={`w-full py-2 px-3 rounded-lg border text-[11px] font-mono flex items-center justify-between gap-2 cursor-pointer transition-all ${
                hoHasSpecialty
                  ? styles.toggleActive
                  : 'bg-[#06090f] border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span className="flex items-center gap-1.5 text-left">
                <Sparkles className={`w-3.5 h-3.5 shrink-0 ${hoHasSpecialty ? styles.icon : 'text-slate-500'}`} />
                <span>
                  <strong className="font-semibold">Roads Zone Resource Specialty</strong>
                  <span className="text-slate-400"> (+10% Extra → +20% / {roadsSpecRrr}% Base • {roadsSpecFocusRrr}% Focus)</span>
                </span>
              </span>
              <span className={`text-[10px] font-bold uppercase shrink-0 px-2 py-0.5 rounded border ${
                hoHasSpecialty
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}>
                {hoHasSpecialty ? 'ON (+20%)' : 'OFF (+10%)'}
              </span>
            </button>
          )}
        </div>
      ) : isConsumable ? (
        <div className={`bg-[#06090f] border border-slate-800/80 rounded-lg p-2.5 ${hasCustom ? 'opacity-50' : ''}`}>
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400 mb-1.5">
            <span>Hideout Power Level (Power Cores — General Crafting Only)</span>
            <span className={styles.badge}>PL {lvl} (+{generalBonusPct}%)</span>
          </div>
          <div className="grid grid-cols-9 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setHoPowerLevel(level)}
                className={`py-1.5 rounded border text-[11px] font-mono font-bold cursor-pointer transition-all ${
                  lvl === level
                    ? styles.pillActive
                    : 'bg-[#090e18] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>PL {level}</div>
                <div className="text-[9px] font-normal opacity-80">+{HO_POWER_GENERAL_BONUS[level]}%</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 ${hasCustom ? 'opacity-50' : ''}`}>
          {/* Power Level (1-9) */}
          <div className="bg-[#06090f] border border-slate-800/80 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400 mb-1.5">
              <span>Hideout Power Level</span>
              <span className={styles.badge}>PL {lvl} (+{generalBonusPct}%)</span>
            </div>
            <div className="grid grid-cols-9 gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setHoPowerLevel(level)}
                  className={`py-1 rounded border text-[11px] font-mono font-bold cursor-pointer transition-all ${
                    lvl === level
                      ? styles.pillActive
                      : 'bg-[#090e18] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Zone Quality (Q1-Q6) */}
          <div className={`bg-[#06090f] border border-slate-800/80 rounded-lg p-2.5 transition-opacity ${!hoHasSpecialty ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400 mb-1.5">
              <span>Zone Quality {hoHasSpecialty ? '(Roads=Q1)' : '(Spec OFF)'}</span>
              <span className={hoHasSpecialty ? styles.badge : 'text-slate-500'}>
                Q{hoZoneQuality} ({hoHasSpecialty ? `+${zoneBonusPct}%` : '+0%'})
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {ZONE_QUALITIES.map(({ q }) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setHoZoneQuality(q)}
                  className={`py-1 rounded border text-[11px] font-mono font-bold cursor-pointer transition-all ${
                    Number(hoZoneQuality) === q
                      ? styles.pillActive
                      : 'bg-[#090e18] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Q{q}
                </button>
              ))}
            </div>
          </div>

          {/* Specialty Match */}
          <div className="bg-[#06090f] border border-slate-800/80 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400 mb-1.5">
              <span>Zone Specialty</span>
              <span className={hoHasSpecialty ? 'text-emerald-300' : 'text-slate-500'}>
                {hoHasSpecialty ? `+${combinedSpecBonusPct}% (Q${zoneBonusPct}+S${specBonusPct})` : '+0% (General)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHoHasSpecialty(!hoHasSpecialty)}
              className={`w-full py-1.5 px-2.5 rounded border text-[11px] font-mono font-semibold flex items-center justify-between cursor-pointer transition-all ${
                hoHasSpecialty
                  ? styles.toggleActive
                  : 'bg-[#090e18] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-1.5 truncate">
                <Sparkles className="w-3 h-3 shrink-0" />
                <span className="truncate">{specialtyLabel}</span>
              </span>
              <span className="text-[10px] font-bold uppercase ml-2">
                {hoHasSpecialty ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Official Rule Reminder */}
      <div className="text-[10px] font-mono text-slate-400 leading-relaxed bg-[#06090f]/80 border border-slate-800/60 rounded-lg px-2.5 py-1.5">
        {isRefining ? (
          <span>
            <strong className="text-slate-300">Official Rule:</strong> Only two Guild Hideout locations exist: Outlands BZ Hideouts (<strong className="text-slate-200">+15%</strong> fixed) and Roads Hideouts (<strong className="text-slate-200">+10%</strong> base, or <strong className="text-slate-200">+20%</strong> if that Roads zone map has a matching resource bonus). Power Level &amp; Zone Quality do not affect refining, and Royal Cities (+58%) still beat Hideouts.
          </span>
        ) : isConsumable ? (
          <span>
            <strong className="text-slate-300">Official Rule:</strong> Outlands Hideouts give only General Power Level (<strong className="text-slate-200">0%–26%</strong>) to Food/Potions; Zone Quality &amp; Caerleon (+15% Food) / Brecilien (+15% Potion) specialties do not apply.
          </span>
        ) : isCrafting ? (
          <span>
            <strong className="text-slate-300">Official Rule:</strong> HO Upgrade Level (1–3) &amp; Zone Tier (T5–T8) do not affect RRR. General Craft uses Power Level (<strong className="text-slate-200">0–26%</strong>) only; Zone Quality (<strong className="text-slate-200">Q1–Q6</strong>) &amp; Specialist bonus only stack when Biome Specialty is ON.
          </span>
        ) : null}
      </div>

      {/* Exact Custom Station Override (for custom tooltips / Roads variants) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/70">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
          <Sliders className="w-3 h-3 text-slate-500 shrink-0" />
          <span>Exact Tooltip Override % (optional — overrides formula above)</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative w-28">
            <NumberInput
              type="number"
              min="0"
              step="0.1"
              placeholder="Auto"
              value={hoCustomBonusPct}
              onChange={(e) => setHoCustomBonusPct(e.target.value)}
              className="w-full bg-[#06090f] border border-slate-800 rounded px-2 py-1 pr-6 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
            />
            <span className="absolute right-2 top-1 text-[11px] text-slate-500 font-mono">%</span>
          </div>
          {hasCustom && (
            <button
              type="button"
              onClick={() => setHoCustomBonusPct('')}
              className="text-[10px] font-mono px-2 py-1 rounded border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
