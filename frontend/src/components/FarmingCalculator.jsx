import React, { useState, useMemo, useEffect } from 'react';
import {
  FARMING_ITEMS,
  FARMING_CATEGORIES,
  ISLAND_BONUSES,
  computeFarming,
} from '../utils/farmingMath';
import { CITIES } from '../utils/albionMath';
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
} from 'lucide-react';

const CATEGORY_ICONS = {
  all: Sparkles,
  crop: Wheat,
  herb: Leaf,
  animal: Egg,
  mount: Shield,
};

export default function FarmingCalculator({ server, hasPremium, useFocus: globalFocus, onOpenGuide, onStartTour }) {
  // Navigation & Filtering
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTier, setSelectedTier] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('T3_WHEAT');

  // Homestead Setup
  const [plots, setPlots] = useState(1);
  const [selectedCity, setSelectedCity] = useState('Martlock');
  const [useFocus, setUseFocus] = useState(globalFocus || false);
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
      <div className="relative overflow-hidden rounded-2xl border border-amber-900/40 bg-gradient-to-r from-[#14120a] via-[#1c1810] to-[#111927] p-5 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600/30 to-amber-900/50 border border-amber-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Wheat className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-black text-amber-200 tracking-wide">
                  The Agrarian Homestead
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Farming & Agriculture
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Island crop fields, alchemical herb gardens, livestock pastures, animal breeding & mount raising.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenGuide && onOpenGuide('farming')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-xs font-serif font-bold text-amber-300 hover:bg-amber-500/25 transition-all shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Farming Guide</span>
            </button>

            <button
              type="button"
              onClick={() => onStartTour && onStartTour('farming')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-amber-500/40 text-xs font-serif font-bold text-amber-200 hover:bg-amber-500/20 transition-all shadow-sm"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Interactive Tour</span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0f0e08] border border-amber-700/40 text-xs shadow-inner">
              <Building className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Island Biome</div>
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
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 text-amber-300 text-xs font-serif font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPrices ? 'animate-spin' : ''}`} />
              <span>Fetch Live Market Prices</span>
            </button>
          </div>
        </div>

        {priceStatus && (
          <div className="mt-3 pt-3 border-t border-amber-900/30 text-[11px] font-mono text-amber-400/80 flex items-center justify-between">
            <span>Market Status: {priceStatus}</span>
            <span>Server: {server.toUpperCase()} &bull; 9 spots per plot</span>
          </div>
        )}
      </div>

      {/* 2. Category Switcher */}
      <div id="tour-farm-mode-picker" className="flex flex-wrap items-center gap-2 border-b border-albion-border/80 pb-3">
        {FARMING_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id] || Sparkles;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-serif font-bold transition-all ${
                isSelected
                  ? 'bg-amber-950/50 border border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-albion-card/60 border border-albion-border text-slate-400 hover:text-slate-200 hover:bg-albion-surface'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-amber-400" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tier & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-albion-card p-3 rounded-xl border border-albion-border shadow-md">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-mono text-slate-400 mr-1 uppercase">Tier:</span>
          {availableTiers.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTier(t)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                selectedTier === t
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-albion-surface border-albion-border text-slate-400 hover:text-slate-200'
              }`}
            >
              T{t}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search crop, herb, animal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-albion-surface border border-albion-border text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-serif"
          />
        </div>
      </div>

      {/* 4. Agriculture Catalog Grid */}
      <div id="tour-farm-item-picker" className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
          <span>Available Plants & Livestock ({filteredItems.length})</span>
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
                className={`relative group flex flex-col items-center text-center p-3 rounded-xl transition-all border text-left ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/60'
                    : 'bg-albion-card border-albion-border hover:border-slate-600 hover:bg-albion-surface/60'
                }`}
              >
                <div className="w-16 h-16 rounded-lg bg-slate-950/80 border border-slate-800 p-1 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform">
                  <ItemIcon
                    src={`/items/${item.icon}`}
                    alt={item.name}
                    className="w-full h-full object-contain filter drop-shadow-md"
                    loading="lazy"
                  />
                  {isBonus && (
                    <span className="absolute top-0.5 right-0.5 px-1 text-[8px] font-mono bg-emerald-500 text-slate-950 rounded font-bold shadow">
                      +10%
                    </span>
                  )}
                </div>

                <div className="mt-2 w-full">
                  <div className="text-xs font-serif font-bold text-slate-200 truncate group-hover:text-amber-300">
                    {item.name}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
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
          <div className="rounded-2xl border border-amber-700/40 bg-albion-card p-5 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-xl bg-slate-950 border-2 border-amber-500/60 p-1 flex items-center justify-center shadow-lg">
                  <ItemIcon
                    src={`/items/${currentItem.icon}`}
                    alt={currentItem.name}
                    className="w-full h-full object-contain filter drop-shadow-xl"
                  />
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded text-[10px] font-serif font-black bg-amber-500 text-slate-950 shadow">
                    T{currentItem.tier}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-serif font-black text-amber-200">
                      {currentItem.name}
                    </h3>
                    {isCityBonusActive && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                        ★ Biome Bonus Active (+10%)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                    <span className="font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                      Plot Type: {currentItem.plotType}
                    </span>
                    {currentItem.bonusCity && (
                      <span className="font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                        Favored City: {currentItem.bonusCity}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-amber-500/40 text-right">
                <div className="text-[10px] font-mono uppercase text-slate-400">Total Harvest Output</div>
                <div className="text-xl font-mono font-black text-amber-300">
                  {calc?.yield?.totalYield || calc?.yield?.totalOutput || 0}
                  <span className="text-xs text-slate-400 ml-1 font-serif">units</span>
                </div>
              </div>
            </div>
          </div>

          {/* Plot Controls & Island Biome */}
          <div id="tour-farm-homestead-controls" className="rounded-2xl border border-albion-border bg-albion-card p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-albion-border/80">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-slate-200">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Homestead Plots & Island Biome</span>
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
                  <span className="font-mono text-xs text-amber-300 font-bold px-2 py-1 bg-albion-surface rounded border border-albion-border min-w-[36px] text-center">
                    {plots}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Island City Location</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-albion-surface border border-albion-border text-xs text-slate-100 font-serif focus:outline-none focus:border-amber-500"
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
              <div className="pt-3 border-t border-albion-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Livestock Objective</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!currentItem.productId}
                      onClick={() => setAnimalAction('produce')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-serif font-bold transition-all border ${
                        animalAction === 'produce' && currentItem.productId
                          ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                          : 'bg-albion-surface border-albion-border text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Produce ({currentItem.productName || 'N/A'})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnimalAction('slaughter')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-serif font-bold transition-all border ${
                        animalAction === 'slaughter' || !currentItem.productId
                          ? 'bg-red-600/30 border-red-500 text-red-300'
                          : 'bg-albion-surface border-albion-border text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Slaughter ({currentItem.meatName})
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-albion-surface border border-albion-border">
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
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Market Unit Prices */}
          <div id="tour-farm-feed-inputs" className="rounded-2xl border border-albion-border bg-albion-card p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-albion-border/80">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-slate-200">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Market Prices ({selectedCity})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSellOrder(!isSellOrder)}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded transition-all border ${
                    isSellOrder
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
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
                  <input
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
                    className="w-full px-3 py-2 rounded-lg bg-albion-surface border border-albion-border text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
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
                  <input
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
                    className="w-full px-3 py-2 rounded-lg bg-albion-surface border border-albion-border text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">silver</span>
                </div>
              </div>
            </div>
          </div>

          {/* Destiny Board Focus & Mastery Simulator */}
          <div id="tour-farm-focus-watering" className="rounded-2xl border border-albion-border bg-albion-card p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-albion-border/80">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-slate-200">
                <Droplets className="w-4 h-4 text-sky-400" />
                <span>Destiny Board Watering / Nurture Focus</span>
              </div>
              <button
                type="button"
                onClick={() => setUseFocus(!useFocus)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-lg transition-all font-bold border ${
                  useFocus
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {useFocus ? '✓ Focus Watering ON' : 'Focus Watering OFF'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>Farmer Mastery Level</span>
                  <span className="text-amber-400 font-bold">{masteryLevel} / 100</span>
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
                  <span className="text-amber-400 font-bold">{specLevel} / 100</span>
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

            <div className="p-3 rounded-xl bg-albion-surface border border-albion-border flex items-center justify-between text-xs font-mono">
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
          <div id="tour-farm-yield-ledger" className="rounded-2xl border border-albion-border bg-albion-card p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-albion-border/80">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-slate-200">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Homestead Harvest Ledger</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                (calc?.finances?.netProfit || 0) >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {(calc?.finances?.netProfit || 0) >= 0 ? 'PROFITABLE' : 'DEFICIT'}
              </span>
            </div>

            {/* Big Net Profit Display */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/30 text-center">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Daily Net Silver Profit ({plots} Plots)
              </div>
              <div className={`text-2xl font-mono font-black mt-1 ${
                (calc?.finances?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {(calc?.finances?.netProfit || 0).toLocaleString()}
                <span className="text-xs font-serif text-slate-400 ml-1 font-normal">silver / day</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs font-mono">
                <div>
                  <div className="text-slate-500 text-[10px]">Net per Plot</div>
                  <div className="text-slate-200 font-bold">
                    {(calc?.finances?.profitPerPlot || 0).toLocaleString()} silver
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Silver / Focus</div>
                  <div className="text-sky-300 font-bold">
                    {(calc?.focus?.silverPerFocus || 0).toFixed(2)} s/f
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Ledger Entries */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-albion-surface">
                <span className="text-slate-400">Gross Harvest Revenue</span>
                <span className="text-emerald-400 font-bold">
                  +{(calc?.finances?.cropRevenue || calc?.finances?.outputRevenue || calc?.finances?.mountRevenue || 0).toLocaleString()}
                </span>
              </div>

              {calc?.finances?.surplusSeedRevenue > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/20 border border-emerald-800/30">
                  <span className="text-emerald-300">Surplus Seeds Sold</span>
                  <span className="text-emerald-400 font-bold">
                    +{calc.finances.surplusSeedRevenue.toLocaleString()}
                  </span>
                </div>
              )}

              {calc?.finances?.surplusBabyRevenue > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/20 border border-emerald-800/30">
                  <span className="text-emerald-300">Surplus Offspring Sold</span>
                  <span className="text-emerald-400 font-bold">
                    +{calc.finances.surplusBabyRevenue.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-2 rounded-lg bg-albion-surface">
                <span className="text-slate-400">
                  {currentItem.category === 'crop' || currentItem.category === 'herb'
                    ? 'Replant Seed Deficit'
                    : 'Breeding Offspring Deficit'}
                </span>
                <span className="text-red-400 font-bold">
                  -{(calc?.finances?.seedExpense || calc?.finances?.babyExpense || 0).toLocaleString()}
                </span>
              </div>

              {calc?.finances?.feedExpense > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-albion-surface">
                  <span className="text-slate-400">Animal Feed Expense</span>
                  <span className="text-red-400 font-bold">
                    -{calc.finances.feedExpense.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-2 rounded-lg bg-albion-surface">
                <span className="text-slate-400">Market Listing & Tax</span>
                <span className="text-amber-400 font-bold">
                  -{(calc?.finances?.marketTax || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Island Biomes Matrix Card */}
          <div className="rounded-2xl border border-albion-border bg-albion-card p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-albion-border/80">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-slate-200">
                <Building className="w-4 h-4 text-emerald-400" />
                <span>Wild Blood Island Biome Bonuses</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">+10% Yield</span>
            </div>

            <div className="space-y-2 text-xs">
              {Object.entries(ISLAND_BONUSES).map(([cityName, info]) => {
                const isActive = selectedCity.toLowerCase() === cityName.toLowerCase();
                return (
                  <button
                    key={cityName}
                    type="button"
                    onClick={() => setSelectedCity(cityName)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/60'
                        : 'bg-albion-surface border-albion-border hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-slate-200">{cityName}</span>
                      {isActive && <span className="text-[10px] font-mono text-emerald-400">Active Island</span>}
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
