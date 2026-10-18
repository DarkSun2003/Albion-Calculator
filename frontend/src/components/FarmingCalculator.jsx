import React, { useState, useMemo, useEffect } from 'react';
import NumberInput from './NumberInput';
import {
  FARMING_ITEMS,
  FARMING_CATEGORIES,
  ISLAND_BONUSES,
  computeFarming,
} from '../utils/farmingMath';
import { CITIES, getFocusPoolAnalysis } from '../utils/albionMath';
import { calculateFarmingApi, fetchFarmingPricesApi } from '../services/api';
import ItemIcon from './ItemIcon';
import {
  Sparkles,
  Wheat,
  Leaf,
  Egg,
  Shield,
  Search,
  Building,
  Coins,
  TrendingUp,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Droplets,
  Heart,
  Layers,
  Info,
  BookOpen,
  HelpCircle,
  Zap,
} from 'lucide-react';

const CATEGORY_ICONS = {
  all: Sparkles,
  crop: Wheat,
  herb: Leaf,
  animal: Egg,
  mount: Shield,
};

export default function FarmingCalculator({ server, hasPremium, useFocus: globalFocus, setUseFocus: setGlobalFocus, onOpenGuide, onStartTour }) {
  // Navigation & Filtering
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTier, setSelectedTier] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('T3_WHEAT');

  // Homestead Setup
  const [plots, setPlots] = useState(1);
  const [selectedCity, setSelectedCity] = useState('Martlock');
  const [useFocus, setUseFocus] = useState(globalFocus || false);

  React.useEffect(() => {
    if (globalFocus !== undefined) {
      setUseFocus(globalFocus);
    }
  }, [globalFocus]);

  const handleToggleFocus = () => {
    const next = !useFocus;
    setUseFocus(next);
    if (setGlobalFocus) setGlobalFocus(next);
  };
  const [animalAction, setAnimalAction] = useState('produce'); // 'produce' or 'slaughter'
  const [useFavoriteFood, setUseFavoriteFood] = useState(true);

  // Market & Prices
  const [marketPrices, setMarketPrices] = useState({
    T3_WHEAT: 350,
    T3_FARM_WHEAT_SEED: 5000,
    T3_EGG: 310,
    T3_MEAT: 190,
    T3_FARM_CHICKEN_BABY: 5000,
    T8_MILK: 850,
    T8_MEAT: 750,
    T8_FARM_COW_BABY: 45000,
    T5_MOUNT_COUGAR_KEEPER: 85000,
    T5_FARM_COUGAR_BABY: 65000,
  });
  const [isSellOrder, setIsSellOrder] = useState(true);

  // Destiny Board Mastery & Spec
  const [masteryLevel, setMasteryLevel] = useState(0);
  const [specLevel, setSpecLevel] = useState(0);

  // Live Price Fetch State
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [priceStatus, setPriceStatus] = useState('');

  // Authoritative Backend State
  const [backendCalculation, setBackendCalculation] = useState(null);
  const [isBackendCalculating, setIsBackendCalculating] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  // Sync global focus
  useEffect(() => {
    if (globalFocus !== undefined) {
      setUseFocus(globalFocus);
    }
  }, [globalFocus]);

  // Current selected item definition
  const currentItem = useMemo(() => {
    return FARMING_ITEMS.find((it) => it.id === selectedItemId) || FARMING_ITEMS[0];
  }, [selectedItemId]);

  // Available Tiers for Active Category
  const availableTiers = useMemo(() => {
    const itemTiers = new Set();
    FARMING_ITEMS.forEach((it) => {
      if (selectedCategory === 'all' || it.category === selectedCategory) {
        itemTiers.add(it.tier);
      }
    });
    return Array.from(itemTiers).sort((a, b) => a - b);
  }, [selectedCategory]);

  // Ensure selected tier is valid
  useEffect(() => {
    if (availableTiers.length > 0 && !availableTiers.includes(selectedTier)) {
      setSelectedTier(availableTiers[0]);
    }
  }, [availableTiers, selectedTier]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return FARMING_ITEMS.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesTier = !selectedTier || item.tier === selectedTier;
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesTier && matchesSearch;
    });
  }, [selectedCategory, selectedTier, searchQuery]);

  // Ensure selected item matches filter
  useEffect(() => {
    if (filteredItems.length > 0 && !filteredItems.some((i) => i.id === selectedItemId)) {
      setSelectedItemId(filteredItems[0].id);
    }
  }, [filteredItems, selectedItemId]);

  // Fast Client-Side Calculation Fallback
  const localCalculation = useMemo(() => {
    return computeFarming({
      itemId: selectedItemId,
      city: selectedCity,
      plots,
      useFocus,
      hasPremium,
      isSellOrder,
      masteryLevel,
      specLevel,
      animalAction,
      useFavoriteFood,
      marketPrices,
    });
  }, [
    selectedItemId,
    selectedCity,
    plots,
    useFocus,
    hasPremium,
    isSellOrder,
    masteryLevel,
    specLevel,
    animalAction,
    useFavoriteFood,
    marketPrices,
  ]);

  // Query Backend Authority
  useEffect(() => {
    let isCancelled = false;
    setIsBackendCalculating(true);

    const payload = {
      item_id: selectedItemId,
      city: selectedCity,
      plots,
      use_focus: useFocus,
      has_premium: hasPremium,
      is_sell_order: isSellOrder,
      mastery_level: masteryLevel,
      spec_level: specLevel,
      animal_action: animalAction,
      use_favorite_food: useFavoriteFood,
      market_prices: marketPrices,
    };

    calculateFarmingApi(payload)
      .then((res) => {
        if (!isCancelled) {
          if (res) {
            setBackendCalculation(res);
            setIsBackendConnected(true);
          } else {
            setIsBackendConnected(false);
          }
        }
      })
      .catch(() => {
        if (!isCancelled) setIsBackendConnected(false);
      })
      .finally(() => {
        if (!isCancelled) setIsBackendCalculating(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [
    selectedItemId,
    selectedCity,
    plots,
    useFocus,
    hasPremium,
    isSellOrder,
    masteryLevel,
    specLevel,
    animalAction,
    useFavoriteFood,
    marketPrices,
  ]);

  const calc = backendCalculation || localCalculation;
  const focusPool = useMemo(() => getFocusPoolAnalysis(calc?.focus?.totalFocusNeeded), [calc?.focus?.totalFocusNeeded]);

  // Fetch Live Prices from AODP
  const handleFetchPrices = async () => {
    setLoadingPrices(true);
    setPriceStatus(`Contacting AODP (${server.toUpperCase()})...`);

    const relatedIds = [];
    if (currentItem.seedId) relatedIds.push(currentItem.seedId);
    if (currentItem.babyId) relatedIds.push(currentItem.babyId);
    if (currentItem.productId) relatedIds.push(currentItem.productId);
    if (currentItem.meatId) relatedIds.push(currentItem.meatId);
    if (currentItem.favoriteFood) relatedIds.push(currentItem.favoriteFood);
    if (currentItem.mountId) relatedIds.push(currentItem.mountId);

    try {
      const res = await fetchFarmingPricesApi({
        item_id: currentItem.id,
        related_ids: relatedIds,
        server,
        city: selectedCity,
      });

      if (res && res.prices) {
        let updated = 0;
        let sampleAge = null;
        const newPrices = { ...marketPrices };
        Object.entries(res.prices).forEach(([id, rec]) => {
          if (rec && rec.sell_min > 0) {
            newPrices[id] = rec.sell_min;
            if (sampleAge === null && rec.age_hours != null) sampleAge = rec.age_hours;
            updated++;
          }
        });
        setMarketPrices(newPrices);
        const ageText = sampleAge !== null ? (sampleAge < 1 ? ` • 🟢 Updated ${Math.max(1, Math.round(sampleAge * 60))}m ago` : ` • 🟡 Updated ${Math.round(sampleAge * 10) / 10}h ago`) : '';
        setPriceStatus(updated > 0 ? `Updated ${updated} prices from ${selectedCity}${ageText}` : `No active sell orders found in ${selectedCity}`);
      } else {
        setPriceStatus('Using local estimates');
      }
    } catch {
      setPriceStatus('Unable to reach market API');
    } finally {
      setLoadingPrices(false);
    }
  };

  const currentBonusCity = currentItem.bonusCity;
  const isCityBonusActive = Boolean(currentBonusCity && selectedCity.toLowerCase() === currentBonusCity.toLowerCase());

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Banner */}
      <div className="forged-tablet-gold relative overflow-hidden p-5 sm:p-6 shadow-2xl">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600/30 to-amber-950/80 border border-amber-500/60 flex items-center justify-center shadow-[0_0_20px_rgba(212,163,75,0.25)]">
              <Wheat className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-decorative font-black text-amber-200 tracking-wide drop-shadow-sm">
                  The Agrarian Homestead
                </h2>
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold tracking-wider">
                  Farming &amp; Agriculture
                </span>
              </div>
              <p className="text-xs text-slate-300/80 mt-1 font-sans">
                Island crop fields, alchemical herb gardens, livestock pastures, animal breeding &amp; mount raising.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenGuide && onOpenGuide('farming')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0e1422] hover:bg-[#151f33] border border-amber-500/40 text-xs font-serif font-bold text-amber-200 hover:text-amber-100 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Farming Codex</span>
            </button>

            <button
              type="button"
              onClick={() => onStartTour && onStartTour('farming')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0e1422] hover:bg-[#151f33] border border-slate-700 hover:border-amber-500/40 text-xs font-serif font-bold text-slate-300 hover:text-amber-200 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400/80" />
              <span>Interactive Tour</span>
            </button>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#05080e] border border-amber-500/30 text-xs shadow-inner">
              <Building className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Island Biome</div>
                <div className="font-serif font-bold text-amber-300">
                  {selectedCity} Island
                  {isCityBonusActive && <span className="ml-1 text-emerald-400 font-mono text-[10px]">★ +10% Bonus</span>}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFetchPrices}
              disabled={loadingPrices}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600/30 via-amber-500/20 to-amber-700/30 hover:from-amber-600/40 hover:to-amber-700/40 border border-amber-400/60 text-amber-200 text-xs font-serif font-bold transition-all shadow-[0_0_15px_rgba(212,163,75,0.2)] disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-300 ${loadingPrices ? 'animate-spin' : ''}`} />
              <span>Fetch Live Market Prices</span>
            </button>
          </div>
        </div>

        {priceStatus && (
          <div className="mt-3.5 pt-3 border-t border-amber-900/40 text-[11px] font-mono text-amber-300/80 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Status: {priceStatus}</span>
            </span>
            <span>Server: {server.toUpperCase()} &bull; 9 spots per plot</span>
          </div>
        )}
      </div>

      {/* 2. Category Switcher */}
      <div id="tour-farm-mode-picker" className="flex flex-wrap items-center gap-2 border-b border-[#1e2a3c] pb-3">
        {FARMING_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id] || Sparkles;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-b from-amber-950/70 to-[#0e1422] border border-amber-400/80 text-amber-200 shadow-[0_0_15px_rgba(212,163,75,0.25)] ring-1 ring-amber-500/40'
                  : 'bg-[#0a0f18] border border-[#1e2a3c] text-slate-400 hover:text-amber-200 hover:bg-[#111827] hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-amber-400" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tier & Search Bar */}
      <div className="forged-tablet p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-mono text-slate-400 mr-1 uppercase tracking-wider">Tier:</span>
          {availableTiers.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTier(t)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
                selectedTier === t
                  ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(212,163,75,0.4)]'
                  : 'bg-[#060a12] border-[#1a2436] text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              T{t}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search crop, herb, animal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#060a12] border border-[#1a2436] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 font-sans"
          />
        </div>
      </div>

      {/* 4. Agriculture Catalog Grid */}
      <div id="tour-farm-item-picker" className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
          <span>Available Plants &amp; Livestock ({filteredItems.length})</span>
          <span>Click item to cultivate on plots</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-72 overflow-y-auto p-1 scrollbar-thin">
          {filteredItems.map((item) => {
            const isSelected = item.id === selectedItemId;
            const isBonus = item.bonusCity && item.bonusCity.toLowerCase() === selectedCity.toLowerCase();
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItemId(item.id)}
                className={`relative group flex flex-col items-center text-center p-3 rounded-xl transition-all border text-left cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-950/60 to-[#0c121e] border-amber-400/80 shadow-[0_0_18px_rgba(212,163,75,0.3)] ring-1 ring-amber-500/50'
                    : 'bg-[#080d16] border-[#1a2436] hover:border-slate-600 hover:bg-[#0e1422]'
                }`}
              >
                <div className="w-16 h-16 rounded-xl bg-[#04060a] border border-[#1a2436] p-1 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform shadow-inner">
                  <ItemIcon
                    src={`/items/${item.icon}`}
                    alt={item.name}
                    className="w-full h-full object-contain filter drop-shadow-md"
                    loading="lazy"
                  />
                  {isBonus && (
                    <span className="absolute top-1 right-1 px-1.5 py-0.2 text-[9px] font-mono bg-gradient-to-r from-emerald-400 to-emerald-600 text-slate-950 rounded font-black shadow">
                      +10%
                    </span>
                  )}
                </div>

                <div className="mt-2.5 w-full">
                  <div className="text-xs font-serif font-bold text-slate-200 truncate group-hover:text-amber-200">
                    {item.name}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      T{item.tier} {item.plotType}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Main Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Blueprint Spotlight */}
          <div className="forged-tablet-gold p-5 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-xl bg-[#04060a] border-2 border-amber-400/80 p-1.5 flex items-center justify-center shadow-[0_0_20px_rgba(212,163,75,0.25)]">
                  <ItemIcon
                    src={`/items/${currentItem.icon}`}
                    alt={currentItem.name}
                    className="w-full h-full object-contain filter drop-shadow-xl"
                  />
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded text-[10px] font-serif font-black bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 shadow">
                    T{currentItem.tier}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-serif font-black text-amber-200">
                      {currentItem.name}
                    </h3>
                    {isCityBonusActive && (
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                        ★ Biome Bonus Active (+10%)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
                    <span className="font-mono text-amber-300 bg-[#060a12] px-2.5 py-1 rounded-lg border border-amber-500/30">
                      Plot Type: {currentItem.plotType}
                    </span>
                    {currentItem.bonusCity && (
                      <span className="font-mono text-emerald-300 bg-[#060a12] px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        Favored City: {currentItem.bonusCity}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-4 py-2.5 rounded-xl bg-[#05080e] border border-amber-500/40 text-right shadow-inner">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Harvest Output</div>
                <div className="text-2xl font-mono font-black text-amber-300">
                  {calc?.yield?.totalYield || calc?.yield?.totalOutput || 0}
                  <span className="text-xs text-slate-400 ml-1 font-serif">units</span>
                </div>
              </div>
            </div>
          </div>

          {/* Plot Controls & Island Biome */}
          <div id="tour-farm-homestead-controls" className="forged-tablet p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2a3c]">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-amber-200">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Homestead Plots &amp; Island Biome</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {plots} Plots &bull; {plots * 9} Total Spots
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Number of Plots ({plots})
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={plots}
                    onChange={(e) => setPlots(parseInt(e.target.value) || 1)}
                    className="w-full accent-amber-500"
                  />
                  <span className="font-mono text-xs text-amber-300 font-bold px-2.5 py-1 bg-[#05080e] rounded-lg border border-[#1a2436] min-w-[36px] text-center shadow-inner">
                    {plots}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Island City Location</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#05080e] border border-[#1a2436] text-xs text-slate-100 font-serif focus:outline-none focus:border-amber-500/80"
                >
                  {CITIES.map((c) => {
                    const cName = typeof c === 'string' ? c : c.name;
                    return (
                      <option key={cName} value={cName}>
                        {cName} Island
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Animal Pasture Special Toggles */}
            {currentItem.category === 'animal' && (
              <div className="pt-3 border-t border-[#1e2a3c] grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Livestock Objective</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!currentItem.productId}
                      onClick={() => setAnimalAction('produce')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-serif font-bold transition-all border cursor-pointer ${
                        animalAction === 'produce' && currentItem.productId
                          ? 'bg-amber-600/30 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(212,163,75,0.2)]'
                          : 'bg-[#05080e] border-[#1a2436] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Produce ({currentItem.productName || 'N/A'})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnimalAction('slaughter')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-serif font-bold transition-all border cursor-pointer ${
                        animalAction === 'slaughter' || !currentItem.productId
                          ? 'bg-rose-600/30 border-rose-400 text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                          : 'bg-[#05080e] border-[#1a2436] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Slaughter ({currentItem.meatName})
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#05080e] border border-[#1a2436] shadow-inner">
                  <div>
                    <div className="text-xs font-serif font-bold text-slate-200">Favorite Food</div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {currentItem.favoriteFoodName} (Halves feed required)
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={useFavoriteFood}
                    onChange={(e) => setUseFavoriteFood(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Market Unit Prices */}
          <div id="tour-farm-feed-inputs" className="forged-tablet p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2a3c]">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-amber-200">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Market Prices ({selectedCity})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSellOrder(!isSellOrder)}
                  className={`text-[11px] font-mono px-3 py-1 rounded-lg transition-all border cursor-pointer ${
                    isSellOrder
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(212,163,75,0.2)]'
                      : 'bg-[#05080e] text-slate-400 border-slate-700'
                  }`}
                >
                  {isSellOrder ? 'Sell Order (-2.5% fee)' : 'Direct Sell'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product / Harvest Sell Price */}
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  {currentItem.category === 'animal' && animalAction === 'slaughter'
                    ? `${currentItem.meatName} Sell Price`
                    : currentItem.category === 'animal'
                    ? `${currentItem.productName} Sell Price`
                    : currentItem.category === 'mount'
                    ? `${currentItem.mountName} Sell Price`
                    : `${currentItem.name} Harvest Price`}
                </label>
                <div className="relative">
                  <NumberInput
                    type="number"
                    min="0"
                    value={
                      marketPrices[
                        currentItem.category === 'animal' && animalAction === 'slaughter'
                          ? currentItem.meatId
                          : currentItem.category === 'animal'
                          ? currentItem.productId
                          : currentItem.category === 'mount'
                          ? currentItem.mountId
                          : currentItem.id
                      ] || 0
                    }
                    onChange={(e) => {
                      const val = Math.max(0, parseFloat(e.target.value) || 0);
                      const key =
                        currentItem.category === 'animal' && animalAction === 'slaughter'
                          ? currentItem.meatId
                          : currentItem.category === 'animal'
                          ? currentItem.productId
                          : currentItem.category === 'mount'
                          ? currentItem.mountId
                          : currentItem.id;
                      setMarketPrices((prev) => ({ ...prev, [key]: val }));
                    }}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#05080e] border border-[#1a2436] text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-500/80 shadow-inner"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">silver</span>
                </div>
              </div>

              {/* Seed / Baby Buy Price */}
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  {currentItem.category === 'crop' || currentItem.category === 'herb'
                    ? `${currentItem.seedName} Buy Price`
                    : `${currentItem.babyName} Buy Price`}
                </label>
                <div className="relative">
                  <NumberInput
                    type="number"
                    min="0"
                    value={
                      marketPrices[
                        currentItem.category === 'crop' || currentItem.category === 'herb'
                          ? currentItem.seedId
                          : currentItem.babyId
                      ] || 0
                    }
                    onChange={(e) => {
                      const val = Math.max(0, parseFloat(e.target.value) || 0);
                      const key =
                        currentItem.category === 'crop' || currentItem.category === 'herb'
                          ? currentItem.seedId
                          : currentItem.babyId;
                      setMarketPrices((prev) => ({ ...prev, [key]: val }));
                    }}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#05080e] border border-[#1a2436] text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-500/80 shadow-inner"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">silver</span>
                </div>
              </div>
            </div>
          </div>

          {/* Destiny Board Focus & Mastery Simulator */}
          <div id="tour-farm-focus-watering" className="forged-tablet p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2a3c]">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-amber-200">
                <Droplets className="w-4 h-4 text-sky-400" />
                <span>Destiny Board Watering / Nurture Focus</span>
              </div>
              <button
                type="button"
                onClick={handleToggleFocus}
                className={`text-[11px] font-mono px-3 py-1 rounded-lg transition-all font-bold border cursor-pointer ${
                  useFocus
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                    : 'bg-[#05080e] text-slate-400 border-slate-700'
                }`}
              >
                {useFocus ? '⚡ Focus Watering: ON' : 'Focus Watering: OFF'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>Farmer Mastery Level</span>
                  <span className="text-amber-300 font-bold">{masteryLevel} / 100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masteryLevel}
                  onChange={(e) => setMasteryLevel(parseInt(e.target.value) || 0)}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>Specialization Level</span>
                  <span className="text-amber-300 font-bold">{specLevel} / 100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={specLevel}
                  onChange={(e) => setSpecLevel(parseInt(e.target.value) || 0)}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#05080e] border border-[#1a2436] flex items-center justify-between text-xs font-mono shadow-inner">
              <div>
                <span className="text-slate-400">Focus Per Spot: </span>
                <span className="text-sky-300 font-bold">{calc?.focus?.focusPerSpot || 1000}</span>
                <span className="text-slate-500 ml-1">focus</span>
              </div>
              <div>
                <span className="text-slate-400">Total Batch Focus: </span>
                <span className="text-sky-300 font-bold">{calc?.focus?.totalFocusNeeded || 0}</span>
                <span className="text-slate-500 ml-1">/ 10,000 daily</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Financial Ledger & Biome Matrix (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Profit Ledger */}
          <div id="tour-farm-yield-ledger" className="forged-tablet-gold p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-amber-900/40">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-amber-200">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Homestead Harvest Ledger</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                (calc?.finances?.netProfit || 0) >= 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {(calc?.finances?.netProfit || 0) >= 0 ? 'PROFITABLE' : 'DEFICIT'}
              </span>
            </div>

            {/* Daily Focus Pool Cap Warning (10,000/day, max 30,000 bank) */}
            {useFocus && calc?.focus?.totalFocusNeeded > 0 && focusPool && (
              <div className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs shadow-inner ${focusPool.colorClass}`}>
                <div className="flex items-center gap-2">
                  <Zap className={`w-4 h-4 shrink-0 ${focusPool.isOverBank ? 'text-rose-400' : 'text-sky-300'}`} />
                  <div>
                    <span className="font-serif font-bold block text-slate-100">
                      {focusPool.badgeText}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-sans">
                      {focusPool.isOverBank
                        ? 'Exceeds 30,000 focus bank capacity. Nurturing/watering this many plots requires multiple days of focus regeneration.'
                        : 'Focus points regenerate at 10,000 daily with Premium active (30,000 maximum bank capacity).'}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold shrink-0 bg-[#06090f]/80 px-2 py-0.5 rounded border border-[#1e2a3c]">
                  {calc?.focus?.totalFocusNeeded?.toLocaleString()} Focus
                </span>
              </div>
            )}

            {/* Big Net Profit Display */}
            <div className="p-4 rounded-xl bg-[#04060a] border border-amber-500/40 text-center shadow-inner">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Daily Net Silver Profit ({plots} Plots)
              </div>
              <div className={`text-3xl font-mono font-black mt-1 drop-shadow-md ${
                (calc?.finances?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {(calc?.finances?.netProfit || 0).toLocaleString()}
                <span className="text-xs font-serif text-slate-400 ml-1.5 font-normal">silver / day</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-slate-800 text-xs font-mono">
                <div>
                  <div className="text-slate-500 text-[10px] uppercase">Net per Plot</div>
                  <div className="text-slate-200 font-bold mt-0.5">
                    {(calc?.finances?.profitPerPlot || 0).toLocaleString()} s
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase">Silver / Focus</div>
                  <div className="text-sky-300 font-bold mt-0.5">
                    {(calc?.focus?.silverPerFocus || 0).toFixed(2)} s/f
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Ledger Entries */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#05080e] border border-[#1a2436]">
                <span className="text-slate-400">Gross Harvest Revenue</span>
                <span className="text-emerald-400 font-bold">
                  +{(calc?.finances?.cropRevenue || calc?.finances?.outputRevenue || calc?.finances?.mountRevenue || 0).toLocaleString()} s
                </span>
              </div>

              {calc?.finances?.surplusSeedRevenue > 0 && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30">
                  <span className="text-emerald-300">Surplus Seeds Sold</span>
                  <span className="text-emerald-400 font-bold">
                    +{calc.finances.surplusSeedRevenue.toLocaleString()} s
                  </span>
                </div>
              )}

              {calc?.finances?.surplusBabyRevenue > 0 && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30">
                  <span className="text-emerald-300">Surplus Offspring Sold</span>
                  <span className="text-emerald-400 font-bold">
                    +{calc.finances.surplusBabyRevenue.toLocaleString()} s
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#05080e] border border-[#1a2436]">
                <span className="text-slate-400">
                  {currentItem.category === 'crop' || currentItem.category === 'herb'
                    ? 'Replant Seed Deficit'
                    : 'Breeding Offspring Deficit'}
                </span>
                <span className="text-rose-400 font-bold">
                  -{(calc?.finances?.seedExpense || calc?.finances?.babyExpense || 0).toLocaleString()} s
                </span>
              </div>

              {calc?.finances?.feedExpense > 0 && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#05080e] border border-[#1a2436]">
                  <span className="text-slate-400">Animal Feed Expense</span>
                  <span className="text-rose-400 font-bold">
                    -{calc.finances.feedExpense.toLocaleString()} s
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#05080e] border border-[#1a2436]">
                <span className="text-slate-400">Market Listing &amp; Tax</span>
                <span className="text-amber-400 font-bold">
                  -{(calc?.finances?.marketTax || 0).toLocaleString()} s
                </span>
              </div>
            </div>
          </div>

          {/* Island Biomes Matrix Card */}
          <div className="forged-tablet p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2a3c]">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-amber-200">
                <Building className="w-4 h-4 text-emerald-400" />
                <span>Wild Blood Island Biome Bonuses</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 font-bold">+10% Yield</span>
            </div>

            <div className="space-y-2 text-xs">
              {Object.entries(ISLAND_BONUSES).map(([cityName, info]) => {
                const isActive = selectedCity.toLowerCase() === cityName.toLowerCase();
                return (
                  <button
                    key={cityName}
                    type="button"
                    onClick={() => setSelectedCity(cityName)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-950/40 border-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/50'
                        : 'bg-[#05080e] border-[#1a2436] hover:border-slate-600 hover:bg-[#0c121e]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-slate-200">{cityName}</span>
                      {isActive && <span className="text-[10px] font-mono text-emerald-300 font-bold">Active Island</span>}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">
                      {info.crops.length > 0 && <span>Crops: {info.crops.join(', ')} &bull; </span>}
                      {info.herbs.length > 0 && <span>Herbs: {info.herbs.join(', ')} &bull; </span>}
                      {info.animals.length > 0 && <span>Livestock: {info.animals.join(', ')}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
