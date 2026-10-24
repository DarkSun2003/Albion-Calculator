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
import CommandNavigator, { spotlightElement } from './components/CommandNavigator';
import LiveScannerModal from './components/LiveScannerModal';
import { computeRefining, RESOURCES, calculateFocusCost, simulateRefiningFromMaterials } from './utils/albionMath';
import { fetchLivePricesApi, calculateRefiningApi } from './services/api';
import { Layers, Hammer, Flame, FlaskConical, Wheat, Users, Skull, Compass, BookOpen, Sparkles, X, Search, RefreshCw, ArrowUpRight } from 'lucide-react';

const MODULE_DECK = [
  {
    id: 'refining',
    label: 'Refining Works',
    sublabel: 'Royal Cities (+40% RRR)',
    discipline: 'Smelter & Tanner',
    icon: Layers,
    activeClass: 'bg-gradient-to-br from-amber-950/90 via-[#0f1523] to-amber-900/40 border-amber-400 text-amber-100 shadow-[0_0_24px_rgba(245,158,11,0.32)] ring-1 ring-amber-400/60',
    iconColor: 'text-amber-400',
    tagColor: 'text-amber-200 bg-amber-500/20 border-amber-500/40',
    cityHighlight: 'Martlock / Thetford / Fort Sterling',
  },
  {
    id: 'crafting',
    label: 'Gear Forge',
    sublabel: 'Weapons, Armor & War Mounts',
    discipline: 'Grand Forgemaster & Saddler',
    icon: Hammer,
    activeClass: 'bg-gradient-to-br from-sky-950/90 via-[#0f1523] to-sky-900/40 border-sky-400 text-sky-100 shadow-[0_0_24px_rgba(56,189,248,0.32)] ring-1 ring-sky-400/60',
    iconColor: 'text-sky-400',
    tagColor: 'text-sky-200 bg-sky-500/20 border-sky-500/40',
    cityHighlight: 'Royal Specialty Cities',
  },
  {
    id: 'cooking',
    label: "Chef's Hearth",
    sublabel: '+15% Caerleon Bonus',
    discipline: 'Master Provisions',
    icon: Flame,
    activeClass: 'bg-gradient-to-br from-orange-950/90 via-[#0f1523] to-orange-900/40 border-orange-400 text-orange-100 shadow-[0_0_24px_rgba(249,115,22,0.32)] ring-1 ring-orange-400/60',
    iconColor: 'text-orange-400',
    tagColor: 'text-orange-200 bg-orange-500/20 border-orange-500/40',
    cityHighlight: 'Caerleon Outlaw City',
  },
  {
    id: 'potions',
    label: 'Alchemy Lab',
    sublabel: '+15% Brecilien Bonus',
    discipline: 'Apothecary Guild',
    icon: FlaskConical,
    activeClass: 'bg-gradient-to-br from-emerald-950/90 via-[#0f1523] to-emerald-900/40 border-emerald-400 text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.32)] ring-1 ring-emerald-400/60',
    iconColor: 'text-emerald-400',
    tagColor: 'text-emerald-200 bg-emerald-500/20 border-emerald-500/40',
    cityHighlight: 'Brecilien Mist City',
  },
  {
    id: 'farming',
    label: 'Agriculture',
    sublabel: 'Crops & Livestock',
    discipline: 'Island Husbandry',
    icon: Wheat,
    activeClass: 'bg-gradient-to-br from-lime-950/90 via-[#0f1523] to-lime-900/40 border-lime-400 text-lime-100 shadow-[0_0_24px_rgba(132,204,22,0.32)] ring-1 ring-lime-400/60',
    iconColor: 'text-lime-400',
    tagColor: 'text-lime-200 bg-lime-500/20 border-lime-500/40',
    cityHighlight: 'Personal & Guild Islands',
  },
  {
    id: 'laborers',
    label: 'Laborer Lodge',
    sublabel: 'Fame & Journals',
    discipline: 'Workforce Bureau',
    icon: Users,
    activeClass: 'bg-gradient-to-br from-yellow-950/90 via-[#0f1523] to-amber-900/40 border-amber-300 text-amber-50 shadow-[0_0_24px_rgba(251,191,36,0.32)] ring-1 ring-amber-300/60',
    iconColor: 'text-amber-300',
    tagColor: 'text-amber-100 bg-amber-500/20 border-amber-400/40',
    cityHighlight: 'House Furniture & Trophies',
  },
  {
    id: 'blackmarket',
    label: 'Black Market',
    sublabel: 'Caerleon Contraband',
    discipline: 'Red-Zone Fence',
    icon: Skull,
    activeClass: 'bg-gradient-to-br from-rose-950/90 via-[#0f1523] to-rose-900/45 border-rose-500 text-rose-100 shadow-[0_0_26px_rgba(244,63,94,0.38)] ring-1 ring-rose-400/60',
    iconColor: 'text-rose-400',
    tagColor: 'text-rose-200 bg-rose-500/20 border-rose-500/40',
    cityHighlight: 'Underworld System Buys',
  },
];

export default function App() {
  // Navigation tab
  const [activeTab, setActiveTab] = useState('refining');
  const [craftingNavigationOptions, setCraftingNavigationOptions] = useState(null);

  const handleNavigateTab = (tab, options = null) => {
    if (tab === 'crafting' && options) {
      setCraftingNavigationOptions(options);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Global settings
  const [server, setServer] = useState('europe');
  const [hasPremium, setHasPremium] = useState(true);
  const [useFocus, setUseFocus] = useState(false);

  // Guide, Onboarding, Quick Finder & Interactive Tour States
  const [isTourActive, setIsTourActive] = useState(false);
  const [isHandbookOpen, setIsHandbookOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [handbookInitialTab, setHandbookInitialTab] = useState('quickstart');
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => {
    try {
      return localStorage.getItem('albion_artisan_onboarded') !== 'true';
    } catch {
      return true;
    }
  });

  // Global Ctrl+K shortcut to open Command Navigator
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDismissWelcome = () => {
    setShowWelcomeBanner(false);
    try {
      localStorage.setItem('albion_artisan_onboarded', 'true');
    } catch (e) {
      console.warn('Could not write to localStorage:', e);
    }
  };

  const handleOpenHandbook = (tab = 'quickstart') => {
    setHandbookInitialTab(tab);
    setIsHandbookOpen(true);
  };

  const handleJumpToFeature = (moduleKey, targetSelector) => {
    setIsHandbookOpen(false);
    setIsCommandOpen(false);
    const normalizedMod = moduleKey === 'food' ? 'cooking' : moduleKey;
    if (normalizedMod && activeTab !== normalizedMod) {
      setActiveTab(normalizedMod);
    }
    if (targetSelector) {
      spotlightElement(targetSelector);
    }
  };

  const handleStartTour = (moduleName) => {
    handleDismissWelcome();
    setIsHandbookOpen(false);
    const rawTarget = moduleName || activeTab;
    const normalizedTab = rawTarget === 'food' ? 'cooking' : rawTarget;
    if (activeTab !== normalizedTab) {
      setActiveTab(normalizedTab);
    }
    setTimeout(() => {
      setIsTourActive(true);
    }, 180);
  };

  // Refining parameters
  const [selectedResource, setSelectedResource] = useState('hide');
  const [selectedTier, setSelectedTier] = useState(4);
  const [selectedEnchantment, setSelectedEnchantment] = useState(0);
  const [selectedCity, setSelectedCity] = useState('Martlock');
  const [stationTax, setStationTax] = useState(500);
  const [quantity, setQuantity] = useState(100);
  const [dailyBonus, setDailyBonus] = useState(0);

  // "I Have Materials" mode states for Refining
  const [refiningInputMode, setRefiningInputMode] = useState('target'); // 'target' | 'materials'
  const [rawMaterialsHave, setRawMaterialsHave] = useState(5000);
  const [prevRefinedHave, setPrevRefinedHave] = useState(0);
  const [compoundRrrPasses, setCompoundRrrPasses] = useState(true);

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

  // Simulate multi-pass refining from user's on-hand raw stack
  const refiningMaterialSim = useMemo(() => {
    return simulateRefiningFromMaterials({
      resourceType: selectedResource,
      tier: selectedTier,
      enchantment: selectedEnchantment,
      rawHave: rawMaterialsHave,
      prevRefinedHave,
      constrainByPrevRefined: false,
      city: selectedCity,
      useFocus,
      dailyBonusPct: dailyBonus,
    });
  }, [
    selectedResource,
    selectedTier,
    selectedEnchantment,
    rawMaterialsHave,
    prevRefinedHave,
    selectedCity,
    useFocus,
    dailyBonus,
  ]);

  const effectiveRefiningQuantity = useMemo(() => {
    if (refiningInputMode === 'materials' && refiningMaterialSim) {
      const crafts = compoundRrrPasses ? refiningMaterialSim.totalCrafts : refiningMaterialSim.pass1Crafts;
      return Math.max(1, crafts);
    }
    return quantity;
  }, [refiningInputMode, refiningMaterialSim, compoundRrrPasses, quantity]);

  // Focus cost calculation (Albion Online 500/500 refining spec)
  const focusPerUnit = useMemo(() => {
    return calculateFocusCost(selectedResource, selectedTier, selectedEnchantment, specLevels);
  }, [selectedResource, selectedTier, selectedEnchantment, specLevels]);

  const totalFocusNeeded = useMemo(() => {
    return useFocus ? focusPerUnit * effectiveRefiningQuantity : 0;
  }, [useFocus, focusPerUnit, effectiveRefiningQuantity]);

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
      quantity: effectiveRefiningQuantity,
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
    effectiveRefiningQuantity,
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
          quantity: effectiveRefiningQuantity,
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
    effectiveRefiningQuantity,
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
          rawAgeHours: res.raw.age_hours,
          rawSource: res.raw.source,
          refined: res.refined?.updated_at,
          refinedAgeHours: res.refined?.age_hours,
          refinedSource: res.refined?.source,
          prevRefined: res.prev_refined?.updated_at,
          prevRefinedAgeHours: res.prev_refined?.age_hours,
          prevRefinedSource: res.prev_refined?.source,
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
    <div className="min-h-screen bg-albion-bg text-slate-100 flex flex-col selection:bg-albion-gold selection:text-albion-bg pb-20 lg:pb-0">
      <Header
        server={server}
        setServer={setServer}
        hasPremium={hasPremium}
        setHasPremium={setHasPremium}
        useFocus={useFocus}
        setUseFocus={setUseFocus}
        onOpenHandbook={() => handleOpenHandbook('uimap')}
        onStartTour={handleStartTour}
        onOpenCommandNavigator={() => setIsCommandOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* First-Time Visitor Welcome Banner: Royal Trade Charter */}
        {showWelcomeBanner && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/80 via-[#0d131f] to-amber-950/60 border border-amber-500/50 p-4 sm:p-5 shadow-[0_12px_35px_rgba(0,0,0,0.85)] ring-1 ring-amber-400/40 animate-fade-in">
            {/* Subtle top edge gold filament */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/25 to-amber-900/40 border border-amber-400/60 flex items-center justify-center text-amber-300 shadow-gold-glow shrink-0 mt-0.5">
                  <Compass className="w-5 h-5 animate-spin-slow text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-widest shadow-gold-glow">
                      ⚔️ ROYAL TRADE CHARTER
                    </span>
                    <h3 className="font-decorative text-sm sm:text-base font-bold text-amber-100 flex items-center gap-2 drop-shadow">
                      Welcome to Albion Artisan Forgemaster
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">
                    Royal City economy &amp; Caerleon underworld suite. Use <strong className="text-amber-300">Find Tool (Ctrl+K)</strong> to jump anywhere in seconds, explore the 7 Guild Disciplines below, or launch the interactive Handbook.
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2 shrink-0 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsCommandOpen(true)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#090e17] hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-mono font-bold text-xs transition-colors cursor-pointer shadow-sm active:scale-95"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Where Is...?</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStartTour()}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-mono text-xs shadow-gold-glow transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start 60s Tour</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDismissWelcome();
                    handleOpenHandbook('uimap');
                  }}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#101624] hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold font-serif text-xs transition-colors cursor-pointer active:scale-95"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>UI Map &amp; Codex</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismissWelcome}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 text-xs font-mono transition-colors cursor-pointer"
                  title="Dismiss charter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7-Discipline Guild Sigil Deck */}
        <section id="tour-module-tabs" className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10.5px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
              Guild Economic Disciplines &bull; 7 Royal Stations
            </span>
            <button
              type="button"
              onClick={() => setIsCommandOpen(true)}
              className="text-[10.5px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Search className="w-3 h-3" />
              <span>Can&apos;t find a tool? (Ctrl+K)</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {MODULE_DECK.map((mod) => {
              const Icon = mod.icon;
              const isActive = activeTab === mod.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActiveTab(mod.id)}
                  className={`group relative flex flex-col justify-between p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 ${
                    isActive
                      ? `${mod.activeClass} scale-[1.02]`
                      : 'bg-[#080d15]/90 hover:bg-[#0f1726] border-slate-800/90 hover:border-slate-600/80 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'
                  }`}
                >
                  {/* Active Heraldic Gold Pips */}
                  {isActive && (
                    <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8.5px] font-mono font-bold tracking-wider text-amber-300 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,1)] animate-ping" />
                      <span>Active</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center shrink-0 shadow-inner ${mod.iconColor} transition-transform group-hover:scale-110`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="font-serif font-bold text-xs sm:text-[13px] leading-tight truncate text-slate-100 group-hover:text-amber-200 transition-colors">
                      {mod.label}
                    </div>
                    <div className="text-[9.5px] text-slate-400 font-sans truncate block">
                      {mod.discipline}
                    </div>
                    <div className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded border inline-block truncate max-w-full font-semibold ${
                      isActive ? mod.tagColor : 'text-slate-400 bg-black/40 border-slate-800/80'
                    }`}>
                      {mod.sublabel}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Tab Content */}
        {activeTab === 'blackmarket' ? (
          <BlackMarketCalculator
            server={server}
            hasPremium={hasPremium}
            onOpenGuide={handleOpenHandbook}
            onStartTour={handleStartTour}
          />
        ) : activeTab === 'laborers' ? (
          <LaborerCalculator
            server={server}
            hasPremium={hasPremium}
            onOpenGuide={handleOpenHandbook}
            onStartTour={handleStartTour}
          />
        ) : activeTab === 'farming' ? (
          <FarmingCalculator
            server={server}
            hasPremium={hasPremium}
            useFocus={useFocus}
            setUseFocus={setUseFocus}
            onOpenGuide={handleOpenHandbook}
            onStartTour={handleStartTour}
            onNavigateTab={handleNavigateTab}
          />
        ) : activeTab === 'potions' ? (
          <PotionCalculator
            server={server}
            hasPremium={hasPremium}
            useFocus={useFocus}
            setUseFocus={setUseFocus}
            onOpenGuide={handleOpenHandbook}
            onStartTour={handleStartTour}
          />
        ) : activeTab === 'cooking' ? (
          <FoodCalculator
            server={server}
            hasPremium={hasPremium}
            useFocus={useFocus}
            setUseFocus={setUseFocus}
            onOpenGuide={handleOpenHandbook}
            onStartTour={handleStartTour}
          />
        ) : activeTab === 'crafting' ? (
          <CraftingCalculator
            server={server}
            hasPremium={hasPremium}
            useFocus={useFocus}
            setUseFocus={setUseFocus}
            onOpenGuide={handleOpenHandbook}
            onStartTour={handleStartTour}
            navigationOptions={craftingNavigationOptions}
          />
        ) : (
          /* Tab 1: Refining Workshop */
          <div className="space-y-4">
            {/* Refining Quick Navigation & Stage Jump Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-gradient-to-r from-amber-950/40 via-[#0e131f] to-amber-950/30 p-3 rounded-xl border border-amber-500/30 shadow-lg">
              <div className="flex items-center flex-wrap gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold mr-1">
                  Quick Jump:
                </span>
                {[
                  { label: '01 Material & Tier', target: '#tour-resource-picker' },
                  { label: '02 Recipe & Vault', target: '#tour-crafting-flow' },
                  { label: '03 City & Tax', target: '#tour-city-controls' },
                  { label: '04 Market Prices', target: '#tour-price-inputs' },
                  { label: '05 Net Profit', target: '#tour-profit-ledger' },
                  { label: '06 Focus & Spec', target: '#tour-focus-spec' },
                ].map((st) => (
                  <button
                    key={st.target}
                    type="button"
                    onClick={() => spotlightElement(st.target)}
                    className="px-2.5 py-1 rounded-lg bg-[#090c14] hover:bg-amber-500/20 text-slate-300 hover:text-amber-200 border border-slate-800 hover:border-amber-500/50 font-mono text-[11px] transition-all cursor-pointer"
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenHandbook('refining')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold transition-all cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Refining Guide</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStartTour('refining')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-mono text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-105"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Spotlight Tour</span>
                </button>
              </div>
            </div>

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
                <div id="tour-crafting-flow">
                  <CraftingFlowCard
                    selectedResource={selectedResource}
                    selectedTier={selectedTier}
                    selectedEnchantment={selectedEnchantment}
                    quantity={effectiveRefiningQuantity}
                    calculation={calculation}
                    refiningInputMode={refiningInputMode}
                    setRefiningInputMode={setRefiningInputMode}
                    rawMaterialsHave={rawMaterialsHave}
                    setRawMaterialsHave={setRawMaterialsHave}
                    prevRefinedHave={prevRefinedHave}
                    setPrevRefinedHave={setPrevRefinedHave}
                    compoundRrrPasses={compoundRrrPasses}
                    setCompoundRrrPasses={setCompoundRrrPasses}
                    materialSim={refiningMaterialSim}
                  />
                </div>

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
                    refiningInputMode={refiningInputMode}
                    setRefiningInputMode={setRefiningInputMode}
                    rawMaterialsHave={rawMaterialsHave}
                    setRawMaterialsHave={setRawMaterialsHave}
                    compoundRrrPasses={compoundRrrPasses}
                    materialSim={refiningMaterialSim}
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

                {/* 5. Destiny Board Focus & Tier Specialization (500/500 System) */}
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
                    setUseFocus={setUseFocus}
                    focusPerUnit={focusPerUnit}
                    totalFocusNeeded={totalFocusNeeded}
                  />
                </div>
              </div>

              {/* Right Column: Sticky Artisan Ledger & Cross-City Matrix (5 Cols) */}
              <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
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
                    quantity={effectiveRefiningQuantity}
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

            {/* Mobile Sticky Bottom Live Verdict Bar (Ensures Phone Users Always See Live Profit Without Scrolling) */}
            {calculation && (
              <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080b12]/95 backdrop-blur-xl border-t border-amber-500/40 px-4 py-2.5 shadow-[0_-10px_30px_rgba(0,0,0,0.85)] flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                    <span>Net Profit ({calculation.returnRatePct}% RRR)</span>
                  </div>
                  <div className={`font-mono text-base font-black ${
                    calculation.financials.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {calculation.financials.netProfit >= 0 ? '+' : ''}
                    {calculation.financials.netProfit.toLocaleString()} silver
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleFetchLivePrices({ force: true })}
                    disabled={loadingPrices}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-amber-300 font-mono text-xs font-bold flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingPrices ? 'animate-spin' : ''}`} />
                    <span>Sync</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => spotlightElement('#tour-profit-ledger')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-mono text-xs font-black flex items-center gap-1"
                  >
                    <span>Ledger</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-albion-border/80 bg-albion-surface/40 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-serif text-albion-gold">
            Albion Artisan Workbench &amp; Economic Ledger
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            3-Layer Verified Market Engine (AODP Spot + 24h History + Shared DB)
          </div>
        </div>
      </footer>

      {/* Quick Command & Feature Locator (Ctrl+K) */}
      <CommandNavigator
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onSelectModule={(mod) => setActiveTab(mod === 'food' ? 'cooking' : mod)}
        onOpenHandbook={(tab) => handleOpenHandbook(tab)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onStartTour={() => handleStartTour()}
      />

      {/* Live Scanner Modal */}
      <LiveScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />

      {/* Interactive Step-by-Step Guided Tour */}
      <InteractiveTour
        isActive={isTourActive}
        activeModule={activeTab === 'cooking' ? 'food' : activeTab}
        onSelectModule={(mod) => setActiveTab(mod === 'food' ? 'cooking' : mod)}
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
        onJumpToFeature={handleJumpToFeature}
        initialTab={handbookInitialTab}
      />
    </div>
  );
}
