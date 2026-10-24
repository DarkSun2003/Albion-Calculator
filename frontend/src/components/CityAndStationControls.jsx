import React from 'react';
import NumberInput from './NumberInput';
import { CITIES, RESOURCES } from '../utils/albionMath';
import { MapPin, Building, Flame, CheckCircle2, AlertTriangle, PackageCheck, Target } from 'lucide-react';

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
    <div className="forged-tablet rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 relative overflow-hidden">
      {/* Header & Specialty Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs uppercase tracking-wider text-slate-200 font-bold font-serif">
            Refinery Location &amp; Station Taxes
          </h3>
        </div>

        <div className="text-[11px] font-mono">
          {isBonusCity ? (
            <span className="text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{selectedCity} Specialty (+40% RRR Bonus)</span>
            </span>
          ) : isIsland ? (
            <span className="text-rose-400 bg-rose-950/60 border border-rose-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Island (0% Base Bonus)</span>
            </span>
          ) : (
            <span className="text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Standard Royal (18% Base Bonus)</span>
            </span>
          )}
        </div>
      </div>

      {/* Compact City Selector: 4 columns on mobile, 4 on tablet/desktop */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Select Refining City
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            +40% Bonus City: <strong className="text-amber-300">{resourceInfo?.bonusCity}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CITIES.map((c) => {
            const isSelected = selectedCity === c.name;
            const isSpecialty = c.bonusRes === selectedResource;

            return (
              <button
                key={c.name}
                type="button"
                onClick={() => setSelectedCity(c.name)}
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-left transition-all relative flex flex-col justify-center cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-950/50 via-[#101522] to-[#080d16] border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : isSpecialty
                    ? 'bg-[#080d16] border-emerald-500/40 text-slate-300 hover:border-emerald-400 hover:bg-[#0c1424]'
                    : 'bg-[#080d16] border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-[#0c1320]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span className={`font-serif font-bold text-xs truncate ${isSelected ? 'text-amber-200' : 'text-slate-200'}`}>
                    {c.name}
                  </span>
                  {isSpecialty && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                      +40%
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono mt-0.5">
                  <span className={isSelected ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                    {isSelected ? '◆ Selected' : (isSpecialty ? 'Specialty' : (c.name === 'Island' ? '0% RRR' : '18% Base'))}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Station Tax, Batch Quantity & Daily Bonus Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Craft Quantity OR Raw Materials Have */}
        <div className="bg-[#090e18] p-3 rounded-xl border border-slate-800 shadow-inner">
          <div className="flex items-center justify-between mb-1.5 gap-1">
            <label className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold truncate flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {isMaterialsMode ? 'Yield from Inventory' : 'Target Batch Qty'}
            </label>
            {setRefiningInputMode && (
              <button
                type="button"
                onClick={() => setRefiningInputMode(isMaterialsMode ? 'target' : 'materials')}
                className={`text-[9px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                  isMaterialsMode
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                    : 'bg-[#06090f] text-slate-400 border-slate-700 hover:text-amber-300'
                }`}
                title="Switch input mode"
              >
                {isMaterialsMode ? <Target className="w-2.5 h-2.5" /> : <PackageCheck className="w-2.5 h-2.5" />}
                <span>{isMaterialsMode ? 'Target Mode' : 'Inventory Mode'}</span>
              </button>
            )}
          </div>

          {isMaterialsMode ? (
            <>
              <div className="text-sm font-mono font-bold text-emerald-300 py-2 px-3 bg-[#06090f] rounded-lg border border-emerald-500/40 flex items-center justify-between">
                <span>{(compoundRrrPasses ? materialSim?.totalOutput : materialSim?.pass1Output)?.toLocaleString() || 0} units</span>
                <span className="text-[10px] text-slate-400 font-normal">from {rawMaterialsHave} raw</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                Adjust raw bag quantity in the Refining Flow above.
              </p>
            </>
          ) : (
            <>
              <div className="relative">
                <NumberInput
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#06090f] border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-amber-400 shadow-inner transition-colors"
                />
              </div>
              <div className="flex gap-1.5 mt-2">
                {[100, 500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setQuantity(amt)}
                    className={`flex-1 text-[10px] font-mono py-1 rounded border transition-all cursor-pointer ${
                      Number(quantity) === amt
                        ? 'bg-amber-500/25 border-amber-500/60 text-amber-300 font-bold'
                        : 'bg-[#06090f] border-slate-800 text-slate-400 hover:text-slate-200'
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
        <div className="bg-[#090e18] p-3 rounded-xl border border-slate-800 shadow-inner">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-amber-400/80" />
              <span>Station Tax</span>
            </label>
            <span className="text-[10px] text-slate-500 font-mono">per 100 food</span>
          </div>
          <div className="relative">
            <NumberInput
              type="number"
              min="0"
              value={stationTax}
              onChange={(e) => setStationTax(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-[#06090f] border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-amber-400 shadow-inner transition-colors"
            />
            <span className="absolute right-3 top-2 text-xs text-amber-400/70 font-mono">silver</span>
          </div>
          <div className="flex gap-1.5 mt-2">
            {[250, 450, 600, 850].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setStationTax(rate)}
                className={`flex-1 text-[10px] font-mono py-1 rounded border transition-all cursor-pointer ${
                  Number(stationTax) === rate
                    ? 'bg-amber-500/25 border-amber-500/60 text-amber-300 font-bold'
                    : 'bg-[#06090f] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {rate}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Production Event */}
        <div className="bg-[#090e18] p-3 rounded-xl border border-slate-800 shadow-inner">
          <label className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5 mb-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Daily Event Bonus</span>
          </label>
          <select
            value={dailyBonus}
            onChange={(e) => setDailyBonus(parseFloat(e.target.value))}
            className="w-full bg-[#06090f] border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-400 cursor-pointer shadow-inner transition-colors"
          >
            <option value={0} className="bg-[#080d16]">None (0% Event)</option>
            <option value={10} className="bg-[#080d16]">+10% Refining Rotation</option>
            <option value={20} className="bg-[#080d16]">+20% Refining Festival</option>
          </select>
          <p className="text-[10px] text-slate-500 mt-2 font-mono">
            Rotates daily across Royal Cities.
          </p>
        </div>
      </div>
    </div>
  );
}
