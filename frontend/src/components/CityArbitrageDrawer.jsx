import React, { useState, useMemo } from 'react';
import { CITIES, computeRefining, RESOURCES } from '../utils/albionMath';
import { getCalibratedNowMs } from '../services/api';
import { MapPin, TrendingUp, ChevronDown, ChevronUp, ArrowRight, Shield, Truck, Sparkles, AlertCircle } from 'lucide-react';

function getFreshness(dateString, ageHours) {
  let diffHours = null;
  if (ageHours !== null && ageHours !== undefined && !Number.isNaN(Number(ageHours)) && Number(ageHours) < 9000) {
    diffHours = Number(ageHours);
  } else if (
    dateString &&
    typeof dateString === 'string' &&
    !dateString.startsWith('0001') &&
    !dateString.startsWith('1970') &&
    !isNaN(new Date(dateString).getTime()) &&
    new Date(dateString).getFullYear() >= 2020
  ) {
    const parsedStr = dateString.endsWith('Z') || dateString.includes('+') ? dateString : `${dateString}Z`;
    diffHours = Math.max(0, (getCalibratedNowMs() - new Date(parsedStr).getTime()) / (1000 * 60 * 60));
  }
  if (diffHours === null) {
    return { label: 'No Orders', color: 'text-slate-500 bg-slate-900 border-slate-800' };
  }
  if (diffHours <= 0.04) return { label: '🟢 Just now', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' };
  if (diffHours < 1) {
    const mins = Math.max(1, Math.round(diffHours * 60));
    return { label: `🟢 ${mins}m ago`, color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' };
  }
  if (diffHours < 24) {
    const hrs = Math.round(diffHours * 10) / 10;
    return { label: `🟡 ${hrs}h ago`, color: 'text-amber-400 bg-amber-950/60 border-amber-800' };
  }
  const days = Math.round(diffHours / 24);
  return { label: `🔴 ${days}d ago`, color: 'text-rose-400 bg-rose-950/60 border-rose-800' };
}

export default function CityArbitrageDrawer({
  selectedResource,
  selectedTier,
  selectedEnchantment,
  quantity,
  rawPrice,
  prevRefinedPrice,
  refinedSellPrice,
  stationTax,
  useFocus,
  dailyBonus,
  hasPremium,
  isSellOrder,
  masteryLevel,
  specLevels,
  currentCity,
  onSelectCity,
  multiCityPrices = null,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const res = RESOURCES[selectedResource];

  // Compute realistic city-by-city economics using live multi-city prices
  const cityComparisons = useMemo(() => {
    return CITIES.filter(c => c.name !== 'Island').map((cityObj) => {
      const cityData = multiCityPrices?.[cityObj.name];
      const hasCityRaw = Boolean(cityData && cityData.raw_sell_min > 0);
      const hasCityRefined = Boolean(cityData && cityData.refined_sell_min > 0);

      // Use city-specific prices when available, fallback to user's current values
      const cityRawPrice = hasCityRaw ? cityData.raw_sell_min : rawPrice;
      const cityRefinedPrice = hasCityRefined ? cityData.refined_sell_min : refinedSellPrice;
      const cityPrevRefinedPrice = (cityData && cityData.prev_refined_sell_min > 0)
        ? cityData.prev_refined_sell_min
        : prevRefinedPrice;

      const calc = computeRefining({
        resourceType: selectedResource,
        tier: selectedTier,
        enchantment: selectedEnchantment,
        quantity,
        rawPrice: cityRawPrice,
        prevRefinedPrice: cityPrevRefinedPrice,
        refinedSellPrice: cityRefinedPrice,
        city: cityObj.name,
        useFocus,
        dailyBonusPct: dailyBonus,
        stationTaxPer100: stationTax,
        hasPremium,
        isSellOrder,
        masteryLevel,
        specLevels,
      });

      const isCurrent = currentCity.toLowerCase() === cityObj.name.toLowerCase();
      const isSpecialty = cityObj.bonusRes === selectedResource;

      return {
        cityName: cityObj.name,
        isCurrent,
        isSpecialty,
        rawPrice: cityRawPrice,
        refinedPrice: cityRefinedPrice,
        hasLiveRaw: hasCityRaw,
        hasLiveRefined: hasCityRefined,
        rawUpdatedAt: cityData?.raw_updated_at,
        refinedUpdatedAt: cityData?.refined_updated_at,
        returnRatePct: calc.returnRatePct,
        netProfit: calc.financials.netProfit,
        marginPct: calc.financials.marginPct,
        profitPerUnit: calc.financials.profitPerUnit,
        silverPerFocus: calc.silverPerFocus,
      };
    });
  }, [
    multiCityPrices,
    selectedResource,
    selectedTier,
    selectedEnchantment,
    quantity,
    rawPrice,
    prevRefinedPrice,
    refinedSellPrice,
    stationTax,
    useFocus,
    dailyBonus,
    hasPremium,
    isSellOrder,
    masteryLevel,
    specLevels,
    currentCity,
  ]);

  // Find the highest local profit city
  const bestLocalCity = useMemo(() => {
    return [...cityComparisons].sort((a, b) => b.netProfit - a.netProfit)[0];
  }, [cityComparisons]);

  // Optimal Cross-City Haul Route Calculation
  const optimalHaulRoute = useMemo(() => {
    const liveRawCities = cityComparisons.filter(c => c.hasLiveRaw && c.rawPrice > 0);
    const validRawCities = liveRawCities.length > 0 ? liveRawCities : cityComparisons.filter(c => c.rawPrice > 0);
    if (!validRawCities.length) return null;
    const cheapestRaw = [...validRawCities].sort((a, b) => a.rawPrice - b.rawPrice)[0];

    const bonusCity = cityComparisons.find(c => c.isSpecialty) || cityComparisons[0];

    const liveRefinedCities = cityComparisons.filter(c => c.hasLiveRefined && c.refinedPrice > 0);
    const validRefinedCities = liveRefinedCities.length > 0 ? liveRefinedCities : cityComparisons.filter(c => c.refinedPrice > 0);
    if (!validRefinedCities.length) return null;
    const highestSell = [...validRefinedCities].sort((a, b) => b.refinedPrice - a.refinedPrice)[0];

    const bonusPrevPrice = (multiCityPrices?.[bonusCity.cityName]?.prev_refined_sell_min > 0)
      ? multiCityPrices[bonusCity.cityName].prev_refined_sell_min
      : prevRefinedPrice;

    const haulCalc = computeRefining({
      resourceType: selectedResource,
      tier: selectedTier,
      enchantment: selectedEnchantment,
      quantity,
      rawPrice: cheapestRaw.rawPrice,
      prevRefinedPrice: bonusPrevPrice,
      refinedSellPrice: highestSell.refinedPrice,
      city: bonusCity.cityName,
      useFocus,
      dailyBonusPct: dailyBonus,
      stationTaxPer100: stationTax,
      hasPremium,
      isSellOrder,
      masteryLevel,
      specLevels,
    });

    const isSameCity = cheapestRaw.cityName === bonusCity.cityName && bonusCity.cityName === highestSell.cityName;
    const hasLiveMultiCity = (liveRawCities.length >= 2 || liveRefinedCities.length >= 2);

    return {
      cheapestRaw,
      bonusCity,
      highestSell,
      netProfit: haulCalc.financials.netProfit,
      marginPct: haulCalc.financials.marginPct,
      profitPerUnit: haulCalc.financials.profitPerUnit,
      returnRatePct: haulCalc.returnRatePct,
      isSameCity,
      hasLiveMultiCity,
    };
  }, [
    cityComparisons,
    multiCityPrices,
    selectedResource,
    selectedTier,
    selectedEnchantment,
    quantity,
    prevRefinedPrice,
    stationTax,
    useFocus,
    dailyBonus,
    hasPremium,
    isSellOrder,
    masteryLevel,
    specLevels,
  ]);

  return (
    <div className="forged-tablet rounded-2xl shadow-xl border border-slate-800/80 relative overflow-hidden">
      {/* Header bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/20 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs uppercase tracking-wider font-serif font-bold text-slate-200">
                Cross-City Arbitrage &amp; Hauling Matrix
              </h3>
              {bestLocalCity && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                  Top Hub: {bestLocalCity.cityName} ({bestLocalCity.returnRatePct}% RRR)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Compare profit spreads across all 6 Royal Cities with optimal 3-step transport routes.
            </p>
          </div>
        </div>

        <button type="button" className="p-1.5 rounded-lg bg-[#06090f] border border-slate-800 text-slate-400 hover:text-white cursor-pointer">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-4 border-t border-slate-800/80 bg-[#06090f]/70 space-y-3.5">
          {/* Optimal Inter-City Hauling Blueprint Card */}
          {optimalHaulRoute && (
            <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-[#0a0f18] to-[#070b12] p-3.5 space-y-3 shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-serif font-bold text-amber-300 uppercase tracking-wider">
                    Recommended Hauling Route
                  </span>
                  {optimalHaulRoute.hasLiveMultiCity && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                      Live Prices
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Haul Net Profit: +{optimalHaulRoute.netProfit.toLocaleString()} silver ({optimalHaulRoute.marginPct}% ROI)
                </div>
              </div>

              {/* Step-by-Step Transport Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {/* Step 1: Buy Raw */}
                <div className="bg-[#090e18] p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[9px] font-mono uppercase text-sky-400 font-bold flex items-center justify-between">
                    <span>1. Buy Raw In</span>
                    <span className="text-[9px] text-slate-500">{optimalHaulRoute.cheapestRaw.cityName}</span>
                  </div>
                  <div className="font-serif font-bold text-slate-100 text-xs">
                    {optimalHaulRoute.cheapestRaw.cityName}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    <strong className="text-sky-300 font-bold">{optimalHaulRoute.cheapestRaw.rawPrice.toLocaleString()}s</strong> / unit
                  </div>
                </div>

                {/* Step 2: Refine in Bonus City */}
                <div className="bg-[#090e18] p-2.5 rounded-xl border border-amber-500/30 space-y-1">
                  <div className="text-[9px] font-mono uppercase text-amber-400 font-bold flex items-center justify-between">
                    <span>2. Transport &amp; Refine</span>
                    <span className="text-[9px] text-amber-400/80 font-bold">+40% Bonus</span>
                  </div>
                  <div className="font-serif font-bold text-slate-100 text-xs">
                    {optimalHaulRoute.bonusCity.cityName}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Return Rate: <strong className="text-amber-300 font-bold">{optimalHaulRoute.returnRatePct}% RRR</strong>
                  </div>
                </div>

                {/* Step 3: Liquidate in Highest City */}
                <div className="bg-[#090e18] p-2.5 rounded-xl border border-emerald-500/30 space-y-1">
                  <div className="text-[9px] font-mono uppercase text-emerald-400 font-bold flex items-center justify-between">
                    <span>3. Sell Refined In</span>
                    <span className="text-[9px] text-emerald-400/80 font-bold">Peak Sell</span>
                  </div>
                  <div className="font-serif font-bold text-slate-100 text-xs">
                    {optimalHaulRoute.highestSell.cityName}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Sell: <strong className="text-emerald-300 font-bold">{optimalHaulRoute.highestSell.refinedPrice.toLocaleString()}s</strong> / unit
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Card View (< sm) */}
          <div className="block sm:hidden space-y-2">
            {cityComparisons.map((row) => (
              <div
                key={row.cityName}
                className={`p-3 rounded-xl border transition-all ${
                  row.isCurrent
                    ? 'bg-gradient-to-r from-amber-950/30 to-[#090e18] border-amber-400/60'
                    : 'bg-[#090e18] border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif font-bold text-slate-100 text-xs">{row.cityName}</span>
                    {row.isCurrent && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                        Active
                      </span>
                    )}
                    {row.isSpecialty && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                        +40% RRR
                      </span>
                    )}
                  </div>
                  {!row.isCurrent ? (
                    <button
                      type="button"
                      onClick={() => onSelectCity(row.cityName)}
                      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#06090f] border border-amber-500/40 text-amber-300"
                    >
                      Select
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">Current</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Raw Buy:</span>
                    <span className={row.hasLiveRaw ? "text-slate-200 font-bold" : "text-slate-400"}>
                      {row.rawPrice.toLocaleString()}s
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Refined Sell:</span>
                    <span className={row.hasLiveRefined ? "text-emerald-400 font-bold" : "text-emerald-400/70"}>
                      {row.refinedPrice.toLocaleString()}s
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Local Profit:</span>
                    <span className={`font-bold ${row.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {row.netProfit >= 0 ? '+' : ''}{row.netProfit.toLocaleString()}s ({row.marginPct}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Return Rate:</span>
                    <span className="text-sky-400 font-bold">{row.returnRatePct}% RRR</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= sm) */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-800 bg-[#06090f]">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] bg-[#070b12]">
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3">Raw Buy</th>
                  <th className="py-2.5 px-3">Refined Sell</th>
                  <th className="py-2.5 px-3">Return Rate</th>
                  <th className="py-2.5 px-3 text-right">Local Net Profit</th>
                  <th className="py-2.5 px-3 text-right">Margin %</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {cityComparisons.map((row) => {
                  const rawFresh = getFreshness(row.rawUpdatedAt);
                  const refinedFresh = getFreshness(row.refinedUpdatedAt);

                  return (
                    <tr 
                      key={row.cityName}
                      className={`hover:bg-[#0c1422] transition-colors ${
                        row.isCurrent ? 'bg-[#0c1424] font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-100 font-bold font-serif">{row.cityName}</span>
                          {row.isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                              Active
                            </span>
                          )}
                          {row.isSpecialty && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                              +40%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Raw Material Price */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={row.hasLiveRaw ? "text-slate-100 font-bold" : "text-slate-400"}>
                            {row.rawPrice.toLocaleString()}s
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded border ${row.hasLiveRaw ? rawFresh.color : 'text-slate-500 bg-[#06090f] border-slate-800'}`}>
                            {row.hasLiveRaw ? rawFresh.label : 'Fallback'}
                          </span>
                        </div>
                      </td>

                      {/* Refined Sell Price */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={row.hasLiveRefined ? "text-emerald-400 font-bold" : "text-emerald-400/70"}>
                            {row.refinedPrice.toLocaleString()}s
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded border ${row.hasLiveRefined ? refinedFresh.color : 'text-slate-500 bg-[#06090f] border-slate-800'}`}>
                            {row.hasLiveRefined ? refinedFresh.label : 'Fallback'}
                          </span>
                        </div>
                      </td>

                      {/* RRR */}
                      <td className="py-2.5 px-3 font-bold text-sky-400">
                        {row.returnRatePct}%
                      </td>

                      {/* Local Net Profit */}
                      <td className={`py-2.5 px-3 text-right font-extrabold ${
                        row.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {row.netProfit >= 0 ? '+' : ''}{row.netProfit.toLocaleString()}s
                      </td>

                      {/* Margin % */}
                      <td className={`py-2.5 px-3 text-right font-bold ${
                        row.marginPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {row.marginPct >= 0 ? '+' : ''}{row.marginPct}%
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-center">
                        {!row.isCurrent ? (
                          <button
                            type="button"
                            onClick={() => onSelectCity(row.cityName)}
                            className="text-[10px] font-serif font-bold px-2 py-0.5 rounded bg-[#06090f] border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 transition-all cursor-pointer"
                          >
                            Select
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">Current</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
