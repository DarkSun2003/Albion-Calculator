import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import ResourceSelector from './components/ResourceSelector';
import CraftingFlowCard from './components/CraftingFlowCard';
import CityAndStationControls from './components/CityAndStationControls';
import PriceInputs from './components/PriceInputs';
import FocusSpecManager from './components/FocusSpecManager';
import LedgerResults from './components/LedgerResults';
import CityArbitrageDrawer from './components/CityArbitrageDrawer';
import CraftingCalculator from './components/CraftingCalculator';
import FoodCalculator from './components/FoodCalculator';
import PotionCalculator from './components/PotionCalculator';
import FarmingCalculator from './components/FarmingCalculator';
import LaborerCalculator from './components/LaborerCalculator';
import BlackMarketCalculator from './components/BlackMarketCalculator';
import InteractiveTour from './components/InteractiveTour';
import PlayerHandbookModal from './components/PlayerHandbookModal';
import { computeRefining, RESOURCES, calculateFocusCost } from './utils/albionMath';
import { fetchLivePricesApi, calculateRefiningApi } from './services/api';
import { Layers, Hammer, Flame, FlaskConical, Wheat, Users, Skull, Compass, BookOpen, Sparkles, X } from 'lucide-react';

export default function App() {
  // Navigation tab
  const [activeTab, setActiveTab] = useState('refining');

  // Global settings
  const [server, setServer] = useState('europe');
  const [hasPremium, setHasPremium] = useState(true);
  const [useFocus, setUseFocus] = useState(false);

  // Guide, Onboarding & Interactive Tour States
  const [isTourActive, setIsTourActive] = useState(false);
  const [isHandbookOpen, setIsHandbookOpen] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => {
    try {
      return localStorage.getItem('albion_artisan_onboarded') !== 'true';
    } catch {
      return true;
    }
  });

  const handleDismissWelcome = () => {
    setShowWelcomeBanner(false);
    try {
      localStorage.setItem('albion_artisan_onboarded', 'true');
    } catch (e) {
      console.warn('Could not write to localStorage:', e);
    }
  };

  const handleStartTour = () => {
    handleDismissWelcome();
    setIsHandbookOpen(false);
    setActiveTab('refining');
    setTimeout(() => {
      setIsTourActive(true);
    }, 150);
  };

  // Refining parameters
  const [selectedResource, setSelectedResource] = useState('hide');
  const [selectedTier, setSelectedTier] = useState(4);
  const [selectedEnchantment, setSelectedEnchantment] = useState(0);
  const [selectedCity, setSelectedCity] = useState('Martlock');
  const [stationTax, setStationTax] = useState(500);
  const [quantity, setQuantity] = useState(100);
  const [dailyBonus, setDailyBonus] = useState(0);

  // Market prices
  const [rawPrice, setRawPrice] = useState(70);
  const [prevRefinedPrice, setPrevRefinedPrice] = useState(50);
  const [refinedSellPrice, setRefinedSellPrice] = useState(175);
  const [isSellOrder, setIsSellOrder] = useState(true);

  // Auto-fetch, Multi-city & Freshness state
  const [multiCityPrices, setMultiCityPrices] = useState(null);
  const [priceTimestamps, setPriceTimestamps] = useState({ raw: null, refined: null, prevRefined: null });
  const [autoFetchEnabled, setAutoFetchEnabled] = useState(true);
  const [manualOverrides, setManualOverrides] = useState({ raw: false, prevRefined: false, refined: false });

  // Focus & Specs
  const [masteryLevel, setMasteryLevel] = useState(0);
  const [specLevels, setSpecLevels] = useState({ 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });

  // Price fetch state
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [priceFetchStatus, setPriceFetchStatus] = useState('');

  // Focus cost calculation
  const focusPerUnit = useMemo(() => {
    return calculateFocusCost(selectedResource, selectedTier, selectedEnchantment, masteryLevel, specLevels);
  }, [selectedResource, selectedTier, selectedEnchantment, masteryLevel, specLevels]);

  const totalFocusNeeded = useMemo(() => {
    return useFocus ? focusPerUnit * quantity : 0;
  }, [useFocus, focusPerUnit, quantity]);

  // Backend calculation engine states
  const [backendCalculation, setBackendCalculation] = useState(null);
  const [isBackendCalculating, setIsBackendCalculating] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  // Compute live refining results (local fallback)
  const localCalculation = useMemo(() => {
    return computeRefining({
      resourceType: selectedResource,
      tier: selectedTier,
      enchantment: selectedEnchantment,
      quantity,
      rawPrice,
      prevRefinedPrice,
      refinedSellPrice,
      city: selectedCity,
      useFocus,
      dailyBonusPct: dailyBonus,
      stationTaxPer100: stationTax,
      hasPremium,
      isSellOrder,
      masteryLevel,
      specLevels,
    });
  }, [
    selectedResource,
    selectedTier,
    selectedEnchantment,
    quantity,
    rawPrice,
    prevRefinedPrice,
    refinedSellPrice,
    selectedCity,
    useFocus,
    dailyBonus,
    stationTax,
    hasPremium,
    isSellOrder,
    masteryLevel,
    specLevels,
  ]);

  // Query Authoritative Django Backend Refining Engine
  useEffect(() => {
    let isCancelled = false;
    setIsBackendCalculating(true);

    const timer = setTimeout(async () => {
      try {
        const payload = {
          resource_type: selectedResource,
          tier: selectedTier,
          enchantment: selectedEnchantment,
          quantity,
          raw_price: rawPrice,
          prev_refined_price: prevRefinedPrice,
          refined_sell_price: refinedSellPrice,
          city: selectedCity,
          use_focus: useFocus,
          daily_bonus_pct: dailyBonus,
          station_tax_per_100: stationTax,
          has_premium: hasPremium,
          is_sell_order: isSellOrder,
          mastery_level: masteryLevel,
          spec_levels: specLevels,
        };

        const backendResult = await calculateRefiningApi(payload);
        if (!isCancelled) {
          if (backendResult && backendResult.financials) {
            setBackendCalculation(backendResult);
            setIsBackendConnected(true);
          } else {
            setIsBackendConnected(false);
          }
        }
      } catch (err) {
        if (!isCancelled) setIsBackendConnected(false);
      } finally {
        if (!isCancelled) setIsBackendCalculating(false);
      }
    }, 120);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [
    selectedResource,
    selectedTier,
    selectedEnchantment,
    quantity,
    rawPrice,
    prevRefinedPrice,
    refinedSellPrice,
    selectedCity,
    useFocus,
    dailyBonus,
    stationTax,
    hasPremium,
    isSellOrder,
    masteryLevel,
    specLevels,
  ]);

  const calculation = backendCalculation || localCalculation;

  // Fetch live market prices strictly via Django backend API proxy
  const handleFetchLivePrices = async ({ force = false } = {}) => {
    setLoadingPrices(true);
    setPriceFetchStatus('Querying Albion Data Engine...');

    try {
      const res = await fetchLivePricesApi({
        resource_type: selectedResource,
        tier: selectedTier,
        enchantment: selectedEnchantment,
        server,
        city: selectedCity,
      });

      if (res && res.raw) {
        if (res.cities) {
          setMultiCityPrices(res.cities);
        }
        setPriceTimestamps({
          raw: res.raw.updated_at,
          refined: res.refined?.updated_at,
          prevRefined: res.prev_refined?.updated_at,
        });

        if (res.raw.sell_min > 0 && (force || !manualOverrides.raw)) {
          setRawPrice(res.raw.sell_min);
        }
        if (res.prev_refined && res.prev_refined.sell_min > 0 && (force || !manualOverrides.prevRefined)) {
          setPrevRefinedPrice(res.prev_refined.sell_min);
        }
        if (res.refined && res.refined.sell_min > 0 && (force || !manualOverrides.refined)) {
          setRefinedSellPrice(res.refined.sell_min);
        }
        setPriceFetchStatus(`Live sync: ${selectedCity} (${server})`);
      } else {
        setPriceFetchStatus('Price server busy or no recent orders');
      }
    } catch (err) {
      console.warn('Backend price fetch error:', err);
      setPriceFetchStatus('Backend engine synchronizing...');
    } finally {
      setLoadingPrices(false);
    }
  };


  // Debounced auto-fetch effect whenever selection or city/server changes
  useEffect(() => {
    if (!autoFetchEnabled) return;
    const timer = setTimeout(() => {
      handleFetchLivePrices({ force: false });
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedResource, selectedTier, selectedEnchantment, selectedCity, server, autoFetchEnabled]);

  return (
    <div className="min-h-screen bg-albion-bg text-slate-100 flex flex-col selection:bg-albion-gold selection:text-albion-bg">
      <Header
        server={server}
        setServer={setServer}
        hasPremium={hasPremium}
        setHasPremium={setHasPremium}
        useFocus={useFocus}
        setUseFocus={setUseFocus}
        onOpenHandbook={() => setIsHandbookOpen(true)}
        onStartTour={handleStartTour}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* First-Time Visitor Welcome Banner */}
        {showWelcomeBanner && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/70 via-[#121824] to-amber-950/50 border border-amber-500/50 p-4 sm:p-5 shadow-[0_0_25px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/30 animate-fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-gold-glow shrink-0 mt-0.5">
                  <Compass className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                      New to Albion Artisan Forgemaster?
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                      Tour Available
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">
                    Learn how to navigate our 7 economic calculators, exploit royal city Resource Return Rates (RRR), and forecast 100% accurate silver profits with our 60-second interactive tour.
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2.5 shrink-0 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleStartTour}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-mono text-xs shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start 60s Tour</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDismissWelcome();
                    setIsHandbookOpen(true);
                  }}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-albion-surface hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold font-serif text-xs transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Handbook</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismissWelcome}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 text-xs font-mono transition-colors cursor-pointer"
                  title="Dismiss guide permanently"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Dismiss</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Module Switcher Tabs (Responsive Horizontal Scroll) */}
        <div id="tour-module-tabs" className="w-full overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 p-1.5 bg-[#0e131d]/90 backdrop-blur-md border border-albion-border/90 rounded-2xl w-max shadow-xl">
            <button
              type="button"
              onClick={() => setActiveTab('refining')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap ${
                activeTab === 'refining'
                  ? 'bg-amber-950/50 border border-amber-500/80 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Refining Workshop</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('crafting')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap ${
                activeTab === 'crafting'
                  ? 'bg-sky-950/50 border border-sky-500/80 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.25)] ring-1 ring-sky-400/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Hammer className="w-4 h-4 text-sky-400" />
              <span>Gear & Item Crafting</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cooking')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap ${
                activeTab === 'cooking'
                  ? 'bg-orange-950/50 border border-orange-500/80 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.25)] ring-1 ring-orange-400/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Chef&apos;s Hearth (Food)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('potions')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap ${
                activeTab === 'potions'
                  ? 'bg-emerald-950/50 border border-emerald-500/80 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <FlaskConical className="w-4 h-4 text-emerald-400" />
              <span>Alchemist&apos;s Lab (Potions)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('farming')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap ${
                activeTab === 'farming'
                  ? 'bg-lime-950/50 border border-lime-500/80 text-lime-300 shadow-[0_0_15px_rgba(132,204,22,0.25)] ring-1 ring-lime-400/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Wheat className="w-4 h-4 text-lime-400" />
              <span>Farming & Agriculture</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('laborers')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap ${
                activeTab === 'laborers'
                  ? 'bg-amber-950/50 border border-amber-400/80 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.25)] ring-1 ring-amber-300/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Laborers & Houses</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('blackmarket')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap ${
                activeTab === 'blackmarket'
                  ? 'bg-rose-950/70 border border-rose-500/80 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)] ring-1 ring-rose-400/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Skull className="w-4 h-4 text-rose-400" />
              <span>Caerleon Black Market</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'blackmarket' ? (
          <BlackMarketCalculator
            server={server}
            hasPremium={hasPremium}
          />
        ) : activeTab === 'laborers' ? (
          <LaborerCalculator
            server={server}
            hasPremium={hasPremium}
          />
        ) : activeTab === 'farming' ? (
          <FarmingCalculator
            server={server}
            hasPremium={hasPremium}
            useFocus={useFocus}
          />
        ) : activeTab === 'potions' ? (
          <PotionCalculator
            server={server}
            hasPremium={hasPremium}
            useFocus={useFocus}
          />
        ) : activeTab === 'cooking' ? (
          <FoodCalculator
            server={server}
            hasPremium={hasPremium}
            useFocus={useFocus}
          />
        ) : activeTab === 'crafting' ? (
          <CraftingCalculator
            server={server}
            hasPremium={hasPremium}
            useFocus={useFocus}
          />
        ) : (
          /* Tab 2: Refining Workshop */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Workshop Controls (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* 1. Tactile Material, Tier & Enchantment Picker */}
              <div id="tour-resource-picker">
                <ResourceSelector
                  selectedResource={selectedResource}
                  setSelectedResource={setSelectedResource}
                  selectedTier={selectedTier}
                  setSelectedTier={setSelectedTier}
                  selectedEnchantment={selectedEnchantment}
                  setSelectedEnchantment={setSelectedEnchantment}
                />
              </div>

              {/* 2. Visual Blueprint Flow with Local Item Renders */}
              <CraftingFlowCard
                selectedResource={selectedResource}
                selectedTier={selectedTier}
                selectedEnchantment={selectedEnchantment}
                quantity={quantity}
                calculation={calculation}
              />

              {/* 3. Location, Station Nutrition Tax & Batch Quantity */}
              <div id="tour-city-controls">
                <CityAndStationControls
                  selectedCity={selectedCity}
                  setSelectedCity={setSelectedCity}
                  selectedResource={selectedResource}
                  stationTax={stationTax}
                  setStationTax={setStationTax}
                  quantity={quantity}
                  setQuantity={setQuantity}
                  dailyBonus={dailyBonus}
                  setDailyBonus={setDailyBonus}
                />
              </div>

              {/* 4. Market Unit Price Inputs */}
              <div id="tour-price-inputs">
                <PriceInputs
                  selectedResource={selectedResource}
                  selectedTier={selectedTier}
                  selectedEnchantment={selectedEnchantment}
                  rawPrice={rawPrice}
                  setRawPrice={(val) => {
                    setRawPrice(val);
                    setManualOverrides(m => ({ ...m, raw: true }));
                  }}
                  prevRefinedPrice={prevRefinedPrice}
                  setPrevRefinedPrice={(val) => {
                    setPrevRefinedPrice(val);
                    setManualOverrides(m => ({ ...m, prevRefined: true }));
                  }}
                  refinedSellPrice={refinedSellPrice}
                  setRefinedSellPrice={(val) => {
                    setRefinedSellPrice(val);
                    setManualOverrides(m => ({ ...m, refined: true }));
                  }}
                  isSellOrder={isSellOrder}
                  setIsSellOrder={setIsSellOrder}
                  onFetchLivePrices={() => handleFetchLivePrices({ force: true })}
                  loadingPrices={loadingPrices}
                  priceFetchStatus={priceFetchStatus}
                  autoFetchEnabled={autoFetchEnabled}
                  setAutoFetchEnabled={setAutoFetchEnabled}
                  priceTimestamps={priceTimestamps}
                  manualOverrides={manualOverrides}
                  onResetOverrides={() => {
                    setManualOverrides({ raw: false, prevRefined: false, refined: false });
                    handleFetchLivePrices({ force: true });
                  }}
                />
              </div>

              {/* 5. Destiny Board Focus & Mastery Simulator */}
              <div id="tour-focus-spec">
                <FocusSpecManager
                  selectedResource={selectedResource}
                  selectedTier={selectedTier}
                  selectedEnchantment={selectedEnchantment}
                  masteryLevel={masteryLevel}
                  setMasteryLevel={setMasteryLevel}
                  specLevels={specLevels}
                  setSpecLevels={setSpecLevels}
                  useFocus={useFocus}
                  focusPerUnit={focusPerUnit}
                  totalFocusNeeded={totalFocusNeeded}
                />
              </div>
            </div>

            {/* Right Column: Artisan Ledger & Cross-City Matrix (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* 1. Main Profit Ledger & Return Metrics */}
              <div id="tour-profit-ledger">
                <LedgerResults 
                  calculation={calculation} 
                  isBackendConnected={isBackendConnected} 
                  isBackendCalculating={isBackendCalculating} 
                />
              </div>

              {/* 2. Multi-City Arbitrage & Hauling Ledger */}
              <div id="tour-arbitrage">
                <CityArbitrageDrawer
                  selectedResource={selectedResource}
                  selectedTier={selectedTier}
                  selectedEnchantment={selectedEnchantment}
                  quantity={quantity}
                  rawPrice={rawPrice}
                  prevRefinedPrice={prevRefinedPrice}
                  refinedSellPrice={refinedSellPrice}
                  stationTax={stationTax}
                  useFocus={useFocus}
                  dailyBonus={dailyBonus}
                  hasPremium={hasPremium}
                  isSellOrder={isSellOrder}
                  masteryLevel={masteryLevel}
                  specLevels={specLevels}
                  currentCity={selectedCity}
                  onSelectCity={(city) => setSelectedCity(city)}
                  multiCityPrices={multiCityPrices}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-albion-border/80 bg-albion-surface/40 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-serif text-albion-gold">
            Albion Artisan Workbench & Economic Ledger
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            Official Local Game Item Assets &bull; Zero External URL Dependencies
          </div>
        </div>
      </footer>

      {/* Interactive Step-by-Step Guided Tour */}
      <InteractiveTour
        isActive={isTourActive}
        onComplete={() => {
          setIsTourActive(false);
          handleDismissWelcome();
        }}
        onSkip={() => {
          setIsTourActive(false);
          handleDismissWelcome();
        }}
      />

      {/* Comprehensive Player Handbook Modal */}
      <PlayerHandbookModal
        isOpen={isHandbookOpen}
        onClose={() => setIsHandbookOpen(false)}
        onStartTour={handleStartTour}
      />
    </div>
  );
}
