import React from 'react';
import NumberInput from './NumberInput';
import { CITIES, RESOURCES } from '../utils/albionMath';
import { MapPin, Building, Flame, AlertTriangle, CheckCircle2, PackageCheck, Target, Shield } from 'lucide-react';

const CITY_THEMES = {
  Martlock: {
    accent: 'text-sky-300',
    border: 'hover:border-sky-500/50',
    selectedGlow: 'border-sky-500/80 bg-gradient-to-b from-sky-950/40 via-[#0a0f1a] to-[#06090f] shadow-[0_0_15px_rgba(56,189,248,0.2)]',
    region: 'Highlands',
  },
  'Fort Sterling': {
    accent: 'text-slate-200',
    border: 'hover:border-slate-400/50',
    selectedGlow: 'border-slate-300/80 bg-gradient-to-b from-slate-900/60 via-[#0d131f] to-[#06090f] shadow-[0_0_15px_rgba(203,213,225,0.2)]',
    region: 'Mountain Peak',
  },
  Thetford: {
    accent: 'text-emerald-300',
    border: 'hover:border-emerald-500/50',
    selectedGlow: 'border-emerald-500/80 bg-gradient-to-b from-emerald-950/40 via-[#07130f] to-[#06090f] shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    region: 'Swamp Realm',
  },
  Lymhurst: {
    accent: 'text-lime-300',
    border: 'hover:border-lime-500/50',
    selectedGlow: 'border-lime-500/80 bg-gradient-to-b from-lime-950/40 via-[#0a140b] to-[#06090f] shadow-[0_0_15px_rgba(163,230,53,0.2)]',
    region: 'Forest Realm',
  },
  Bridgewatch: {
    accent: 'text-amber-300',
    border: 'hover:border-amber-500/50',
    selectedGlow: 'border-amber-500/80 bg-gradient-to-b from-amber-950/40 via-[#141008] to-[#06090f] shadow-gold-glow',
    region: 'Steppe Plateau',
  },
  Caerleon: {
    accent: 'text-rose-400',
    border: 'hover:border-rose-500/50',
    selectedGlow: 'border-rose-500/80 bg-gradient-to-b from-rose-950/40 via-[#14080a] to-[#06090f] shadow-[0_0_15px_rgba(244,63,94,0.25)]',
    region: 'Bandit Center',
  },
  Brecilien: {
    accent: 'text-purple-300',
    border: 'hover:border-purple-500/50',
    selectedGlow: 'border-purple-500/80 bg-gradient-to-b from-purple-950/40 via-[#120a1a] to-[#06090f] shadow-[0_0_15px_rgba(168,85,247,0.2)]',
    region: 'Mist Realm',
  },
  Island: {
    accent: 'text-slate-400',
    border: 'hover:border-slate-600',
    selectedGlow: 'border-slate-500/70 bg-gradient-to-b from-slate-900/40 to-[#06090f] shadow-inner',
    region: 'Player Island',
  },
};

export default function CityAndStationControls({
  selectedCity,
  setSelectedCity,
  selectedResource,
  stationTax,
  setStationTax,
  quantity,
  setQuantity,
  dailyBonus,
  setDailyBonus,
  refiningInputMode = 'target',
  setRefiningInputMode,
  rawMaterialsHave = 5000,
  setRawMaterialsHave,
  compoundRrrPasses = true,
  materialSim = null,
}) {
  const resourceInfo = RESOURCES[selectedResource];
  const isBonusCity = selectedCity.toLowerCase() === resourceInfo?.bonusCity?.toLowerCase();
  const isIsland = selectedCity.toLowerCase() === 'island';
  const isMaterialsMode = refiningInputMode === 'materials';

  return (
    <div className="forged-tablet p-4 sm:p-5 shadow-2xl space-y-5 relative overflow-hidden">
      {/* Subtle top edge gold filament */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

      {/* Header & Specialty Verdict */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-[#1c2738]/80">
        <label className="text-xs uppercase tracking-wider text-slate-200 font-semibold flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
            Stage 03
          </span>
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-serif">City Jurisdiction, Batch Size &amp; Station Tax</span>
        </label>
        <div className="text-[11px] font-mono">
          {isBonusCity ? (
            <span className="text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold shadow-[0_0_12px_rgba(16,185,129,0.15)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{selectedCity} Specialty (+40% Return Bonus)</span>
            </span>
          ) : isIsland ? (
            <span className="text-rose-400 bg-rose-950/60 border border-rose-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Island Territory (0% Base Bonus)</span>
            </span>
          ) : (
            <span className="text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Standard Royal City (18% Base Bonus)</span>
            </span>
          )}
        </div>
      </div>

      {/* Regional City Selector Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Select Guild Refinery Location
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            Target Bonus: <strong className="text-amber-300">{resourceInfo?.bonusCity}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {CITIES.map((c) => {
            const isSelected = selectedCity === c.name;
            const isSpecialty = c.bonusRes === selectedResource;
            const theme = CITY_THEMES[c.name] || CITY_THEMES.Martlock;

            return (
              <button
                key={c.name}
                type="button"
                onClick={() => setSelectedCity(c.name)}
                className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                  isSelected
                    ? `${theme.selectedGlow} border-2`
                    : `bg-[#080d16] border-[#1b2536] text-slate-400 ${theme.border} hover:bg-[#0c1320]`
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={`font-serif font-bold text-xs sm:text-[13px] tracking-wide ${isSelected ? 'text-amber-100' : 'text-slate-300'}`}>
                    {c.name}
                  </span>
                  {isSpecialty && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-gradient-to-r from-emerald-600/30 to-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-mono font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)] shrink-0">
                      +40%
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono mt-1 text-slate-400">
                  <span className="truncate">{theme.region}</span>
                  {isSelected && (
                    <span className="text-[9px] font-bold text-amber-400">◆ Active</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Station Tax, Batch Quantity & Daily Bonus Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
        {/* Craft Quantity OR Raw Materials Have */}
        <div className="bg-[#0b121d] p-3.5 rounded-xl border border-[#1e2a3c] shadow-inner">
          <div className="flex items-center justify-between mb-1.5 gap-1">
            <label className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold truncate flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              {isMaterialsMode ? `Raw ${resourceInfo?.rawName} On Hand` : 'Target Output Qty'}
            </label>
            {setRefiningInputMode && (
              <button
                type="button"
                onClick={() => setRefiningInputMode(isMaterialsMode ? 'target' : 'materials')}
                className={`text-[9px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                  isMaterialsMode
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                    : 'bg-[#06090f] text-amber-300 border-amber-500/40 hover:bg-amber-500/15'
                }`}
                title="Switch between Target Output Quantity and Inputting Raw Materials You Have"
              >
                {isMaterialsMode ? (
                  <>
                    <Target className="w-2.5 h-2.5" />
                    <span>Target</span>
                  </>
                ) : (
                  <>
                    <PackageCheck className="w-2.5 h-2.5 text-emerald-400" />
                    <span>My Mats</span>
                  </>
                )}
              </button>
            )}
          </div>

          {isMaterialsMode ? (
            <>
              <div className="relative">
                <NumberInput
                  type="number"
                  min="0"
                  value={rawMaterialsHave}
                  onChange={(e) => setRawMaterialsHave && setRawMaterialsHave(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#06090f] border border-emerald-500/50 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-400 shadow-inner"
                />
                {materialSim && (
                  <span className="absolute right-2.5 top-2.5 text-[10px] text-emerald-400 font-mono font-bold bg-[#06090f]/90 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    &rarr; {(compoundRrrPasses ? materialSim.totalOutput : materialSim.pass1Output).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 mt-2">
                {[500, 1000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRawMaterialsHave && setRawMaterialsHave(amt)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                      Number(rawMaterialsHave) === amt
                        ? 'bg-emerald-500/25 border-emerald-500/60 text-emerald-300 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                        : 'bg-[#06090f] border-[#1e2a3c] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <NumberInput
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#06090f] border border-[#1e2a3c] rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-amber-400 shadow-inner transition-colors"
                />
              </div>
              <div className="flex gap-1.5 mt-2">
                {[100, 500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setQuantity(amt)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                      Number(quantity) === amt
                        ? 'bg-amber-500/25 border-amber-500/60 text-amber-300 font-bold shadow-gold-glow'
                        : 'bg-[#06090f] border-[#1e2a3c] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Station Nutrition Fee */}
        <div className="bg-[#0b121d] p-3.5 rounded-xl border border-[#1e2a3c] shadow-inner">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-amber-400/80" />
              <span>Station Tax</span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono">per 100 nutrition</span>
          </div>
          <div className="relative">
            <NumberInput
              type="number"
              min="0"
              value={stationTax}
              onChange={(e) => setStationTax(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-[#06090f] border border-[#1e2a3c] rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-amber-400 shadow-inner transition-colors"
            />
            <span className="absolute right-3 top-2.5 text-xs text-amber-400/70 font-mono">silver</span>
          </div>
          <div className="flex gap-1.5 mt-2">
            {[250, 450, 600, 850].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setStationTax(rate)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                  Number(stationTax) === rate
                    ? 'bg-amber-500/25 border-amber-500/60 text-amber-300 font-bold shadow-gold-glow'
                    : 'bg-[#06090f] border-[#1e2a3c] text-slate-400 hover:text-slate-200'
                }`}
              >
                {rate}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Production Event */}
        <div className="bg-[#0b121d] p-3.5 rounded-xl border border-[#1e2a3c] shadow-inner">
          <label className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5 mb-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Daily Event Bonus</span>
          </label>
          <select
            value={dailyBonus}
            onChange={(e) => setDailyBonus(parseFloat(e.target.value))}
            className="w-full bg-[#06090f] border border-[#1e2a3c] rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-400 cursor-pointer shadow-inner transition-colors"
          >
            <option value={0} className="bg-[#080d16]">None (0% Event)</option>
            <option value={10} className="bg-[#080d16]">+10% Refining Rotation</option>
            <option value={20} className="bg-[#080d16]">+20% Refining Festival</option>
          </select>
          <p className="text-[10px] text-slate-400 font-sans mt-2">
            Rotates daily across Royal Cities in Albion Online.
          </p>
        </div>
      </div>
    </div>
  );
}
