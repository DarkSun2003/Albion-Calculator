import React from 'react';
import { CITIES, RESOURCES } from '../utils/albionMath';
import { MapPin, Building, Flame, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';

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
}) {
  const resourceInfo = RESOURCES[selectedResource];
  const isBonusCity = selectedCity.toLowerCase() === resourceInfo?.bonusCity?.toLowerCase();
  const isIsland = selectedCity.toLowerCase() === 'island';

  return (
    <div className="bg-albion-card border border-albion-border rounded-xl p-4 sm:p-5 shadow-lg space-y-5">
      {/* City Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-bold">
              Stage 02
            </span>
            <MapPin className="w-3.5 h-3.5 text-albion-gold" />
            <span>Refining City, Batch Size &amp; Station Tax</span>
          </label>
          <span className="text-[11px] font-mono">
            {isBonusCity ? (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                City Specialty (+40% Bonus Active)
              </span>
            ) : isIsland ? (
              <span className="text-rose-400 flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3 h-3" />
                Island (0% Base Bonus)
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Non-Bonus City (18% Base Bonus)
              </span>
            )}
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
                className={`p-2.5 rounded-lg border text-left transition-all relative ${
                  isSelected
                    ? 'bg-albion-surface border-albion-gold text-slate-100 shadow-gold-glow'
                    : 'bg-albion-bg border-albion-border text-slate-400 hover:border-slate-600 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-200">{c.name}</span>
                  {isSpecialty && (
                    <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                      +40%
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {c.isRoyal ? (isSpecialty ? 'Bonus City' : 'Standard Royal') : '0% Base RRR'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Station Tax & Craft Quantity */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Craft Quantity */}
        <div>
          <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
            Refining Quantity
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-albion-bg border border-albion-border rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-albion-gold"
            />
          </div>
          <div className="flex gap-1.5 mt-1.5">
            {[100, 500, 1000, 5000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setQuantity(amt)}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-albion-bg border border-albion-border text-slate-400 hover:text-slate-200 hover:border-slate-600"
              >
                {amt >= 1000 ? `${amt / 1000}k` : amt}
              </button>
            ))}
          </div>
        </div>

        {/* Station Nutrition Fee */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              Station Tax
            </label>
            <span className="text-[10px] text-slate-500 font-mono">per 100 nutrition</span>
          </div>
          <div className="relative">
            <input
              type="number"
              min="0"
              value={stationTax}
              onChange={(e) => setStationTax(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-albion-bg border border-albion-border rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-albion-gold"
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">silver</span>
          </div>
          <div className="flex gap-1.5 mt-1.5">
            {[250, 450, 600, 850].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setStationTax(rate)}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-albion-bg border border-albion-border text-slate-400 hover:text-slate-200 hover:border-slate-600"
              >
                {rate}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Production Event */}
        <div>
          <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1 mb-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            Daily Event Bonus
          </label>
          <select
            value={dailyBonus}
            onChange={(e) => setDailyBonus(parseFloat(e.target.value))}
            className="w-full bg-albion-bg border border-albion-border rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-albion-gold cursor-pointer"
          >
            <option value={0} className="bg-albion-card">None (0%)</option>
            <option value={10} className="bg-albion-card">+10% Refining Bonus</option>
            <option value={20} className="bg-albion-card">+20% Refining Bonus</option>
          </select>
          <p className="text-[10px] text-slate-500 font-sans mt-1.5">
            Active during Albion daily production rotation.
          </p>
        </div>
      </div>
    </div>
  );
}
