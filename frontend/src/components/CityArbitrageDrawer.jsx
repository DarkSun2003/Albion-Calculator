import React, { useState, useMemo } from 'react';
import { CITIES, computeRefining, RESOURCES } from '../utils/albionMath';
import { MapPin, TrendingUp, ChevronDown, ChevronUp, ArrowRight, Shield, Truck, Sparkles, AlertCircle } from 'lucide-react';

function getFreshness(dateString) {
  if (
    !dateString ||
    typeof dateString !== 'string' ||
    dateString.startsWith('0001') ||
    dateString.startsWith('1970') ||
    isNaN(new Date(dateString).getTime()) ||
    new Date(dateString).getFullYear() < 2020
  ) {
    return { label: 'No Orders', color: 'text-slate-500 bg-slate-900/60 border-slate-800' };
  }
  const diffHours = (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60);
  if (diffHours < 0) return { label: '🟢 Just now', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' };
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
  const [isOpen, setIsOpen] = useState(true);

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
    // 1. Cheapest city to buy raw materials (prefer confirmed live data)
    const liveRawCities = cityComparisons.filter(c => c.hasLiveRaw && c.rawPrice > 0);
    const validRawCities = liveRawCities.length > 0 ? liveRawCities : cityComparisons.filter(c => c.rawPrice > 0);
    if (!validRawCities.length) return null;
    const cheapestRaw = [...validRawCities].sort((a, b) => a.rawPrice - b.rawPrice)[0];

    // 2. Specialty bonus city for high Resource Return Rate
    const bonusCity = cityComparisons.find(c => c.isSpecialty) || cityComparisons[0];

    // 3. Highest city to sell refined output (prefer confirmed live data)
    const liveRefinedCities = cityComparisons.filter(c => c.hasLiveRefined && c.refinedPrice > 0);
    const validRefinedCities = liveRefinedCities.length > 0 ? liveRefinedCities : cityComparisons.filter(c => c.refinedPrice > 0);
    if (!validRefinedCities.length) return null;
    const highestSell = [...validRefinedCities].sort((a, b) => b.refinedPrice - a.refinedPrice)[0];

    // Pick bonus city's prev refined price if available
    const bonusPrevPrice = (multiCityPrices?.[bonusCity.cityName]?.prev_refined_sell_min > 0)
      ? multiCityPrices[bonusCity.cityName].prev_refined_sell_min
      : prevRefinedPrice;

    // Compute haul profit: buy at cheapest raw, refine in bonus city, sell at highest refined
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
    <div className="bg-albion-card border border-albion-border rounded-xl shadow-xl overflow-hidden">
      {/* Header bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-albion-surface/40 transition-colors border-b border-albion-border/60"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-serif font-black text-slate-100">
                Cross-City Arbitrage & Hauling Ledger
              </h3>
              {bestLocalCity && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Top Local: {bestLocalCity.cityName} ({bestLocalCity.returnRatePct}% RRR)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-serif">
              Live multi-city price spreads across all 6 Royal Cities with optimal inter-city hauling routes.
            </p>
          </div>
        </div>

        <button type="button" className="p-1 rounded text-slate-400 hover:text-slate-200">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-4 sm:p-5 bg-albion-bg/60 space-y-4">
          {/* Optimal Inter-City Hauling Blueprint Card */}
          {optimalHaulRoute && (
            <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-amber-950/30 p-4 space-y-3 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-serif font-black uppercase tracking-wider text-amber-200">
                    Optimal Inter-City Hauling Route
                  </span>
                  {optimalHaulRoute.hasLiveMultiCity ? (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Verified Multi-City Live Data
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Active Hub Projection
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono font-bold text-emerald-400">
                  Haul Net Profit: +{optimalHaulRoute.netProfit.toLocaleString()} silver ({optimalHaulRoute.marginPct}% ROI)
                </div>
              </div>

              {/* Step-by-Step Transport Flow */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                {/* Step 1: Buy Raw */}
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-sky-400 font-bold flex items-center justify-between">
                    <span>1. Buy Raw Materials</span>
                    <span>{optimalHaulRoute.cheapestRaw.hasLiveRaw ? 'Cheapest Hub' : 'Projected Hub'}</span>
                  </div>
                  <div className="font-serif font-bold text-slate-200">
                    {optimalHaulRoute.cheapestRaw.cityName}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Rate: <strong className="text-sky-300">{optimalHaulRoute.cheapestRaw.rawPrice.toLocaleString()}s</strong> / unit
                    {!optimalHaulRoute.cheapestRaw.hasLiveRaw && (
                      <span className="ml-1 text-[9px] text-slate-500">(Est.)</span>
                    )}
                  </div>
                </div>

                {/* Step 2: Refine in Bonus City */}
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center justify-between">
                    <span>2. Transport & Refine</span>
                    <span>Bonus RRR</span>
                  </div>
                  <div className="font-serif font-bold text-slate-200">
                    {optimalHaulRoute.bonusCity.cityName}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Return Rate: <strong className="text-amber-300">{optimalHaulRoute.returnRatePct}% RRR</strong>
                  </div>
                </div>

                {/* Step 3: Liquidate in Highest City */}
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex items-center justify-between">
                    <span>3. Transport & Sell</span>
                    <span>{optimalHaulRoute.highestSell.hasLiveRefined ? 'Peak Revenue' : 'Projected Hub'}</span>
                  </div>
                  <div className="font-serif font-bold text-slate-200">
                    {optimalHaulRoute.highestSell.cityName}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Sell: <strong className="text-emerald-300">{optimalHaulRoute.highestSell.refinedPrice.toLocaleString()}s</strong> / unit
                    {!optimalHaulRoute.highestSell.hasLiveRefined && (
                      <span className="ml-1 text-[9px] text-slate-500">(Est.)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full City-by-City Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-albion-border text-slate-400 uppercase font-mono text-[10px]">
                  <th className="py-2.5 px-3">Royal City</th>
                  <th className="py-2.5 px-3">Raw Buy Price</th>
                  <th className="py-2.5 px-3">Refined Sell Price</th>
                  <th className="py-2.5 px-3">Return Rate (RRR)</th>
                  <th className="py-2.5 px-3 text-right">Local Net Profit</th>
                  <th className="py-2.5 px-3 text-right">Margin %</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-albion-border/40 font-mono">
                {cityComparisons.map((row) => {
                  const isTop = row.cityName === bestLocalCity?.cityName;
                  const rawFresh = getFreshness(row.rawUpdatedAt);
                  const refinedFresh = getFreshness(row.refinedUpdatedAt);

                  return (
                    <tr 
                      key={row.cityName}
                      className={`hover:bg-albion-surface/40 transition-colors ${
                        row.isCurrent ? 'bg-albion-surface/60 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-200 font-bold font-serif">{row.cityName}</span>
                          {row.isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-sans">
                              Active
                            </span>
                          )}
                          {row.isSpecialty && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-sans">
                              +40% Bonus
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Raw Material Price with Freshness */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={row.hasLiveRaw ? "text-slate-200 font-bold" : "text-slate-400 font-normal"}>
                            {row.hasLiveRaw ? `${row.rawPrice.toLocaleString()}s` : `~${row.rawPrice.toLocaleString()}s`}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded border ${row.hasLiveRaw ? rawFresh.color : 'text-slate-500 bg-slate-900/60 border-slate-800'}`}>
                            {row.hasLiveRaw ? rawFresh.label : 'Fallback'}
                          </span>
                        </div>
                      </td>

                      {/* Refined Sell Price with Freshness */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={row.hasLiveRefined ? "text-emerald-400 font-bold" : "text-emerald-400/70 font-normal"}>
                            {row.hasLiveRefined ? `${row.refinedPrice.toLocaleString()}s` : `~${row.refinedPrice.toLocaleString()}s`}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded border ${row.hasLiveRefined ? refinedFresh.color : 'text-slate-500 bg-slate-900/60 border-slate-800'}`}>
                            {row.hasLiveRefined ? refinedFresh.label : 'Fallback'}
                          </span>
                        </div>
                      </td>

                      {/* RRR */}
                      <td className="py-3 px-3 font-bold text-sky-400">
                        {row.returnRatePct}%
                      </td>

                      {/* Local Net Profit */}
                      <td className={`py-3 px-3 text-right font-bold ${
                        row.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {row.netProfit >= 0 ? '+' : ''}{row.netProfit.toLocaleString()} s
                      </td>

                      {/* Margin % */}
                      <td className={`py-3 px-3 text-right ${
                        row.marginPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {row.marginPct >= 0 ? '+' : ''}{row.marginPct}%
                      </td>

                      {/* Switch City Action */}
                      <td className="py-3 px-3 text-center">
                        {!row.isCurrent ? (
                          <button
                            type="button"
                            onClick={() => onSelectCity(row.cityName)}
                            className="text-[10px] font-serif font-bold px-2.5 py-1 rounded-lg bg-albion-surface border border-albion-border hover:border-albion-gold text-slate-300 hover:text-albion-gold transition-all shadow"
                          >
                            Snap City
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-sans">Selected</span>
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
