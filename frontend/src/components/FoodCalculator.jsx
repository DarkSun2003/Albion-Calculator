import React, { useState, useMemo, useEffect } from 'react';
import { 
  FOOD_ITEMS, 
  FOOD_SUBCATEGORIES, 
  FOOD_TIERS, 
  FOOD_ENCHANTMENTS,
  computeFoodCrafting,
  calculateFoodReturnRate,
  calculateFoodFocusCost 
} from '../utils/foodMath';
import { CITIES } from '../utils/albionMath';
import { calculateFoodApi, fetchFoodPricesApi } from '../services/api';
import ItemIcon from './ItemIcon';
import { 
  Flame, 
  Soup, 
  Salad, 
  PieChart, 
  Egg, 
  Utensils, 
  Sandwich, 
  Drumstick, 
  Sparkles, 
  Wheat, 
  Scissors, 
  Search, 
  Zap, 
  Coins, 
  Building, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  Info, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sliders,
  DollarSign,
  BookOpen,
  HelpCircle
} from 'lucide-react';

const SUBCATEGORY_ICONS = {
  all: Flame,
  soups: Soup,
  salads: Salad,
  pies: PieChart,
  omelettes: Egg,
  stews: Utensils,
  sandwiches: Sandwich,
  roasts: Drumstick,
  dragon: Sparkles,
  pantry: Wheat,
  butchery: Scissors,
};

export default function FoodCalculator({ server, hasPremium, useFocus, onOpenGuide, onStartTour }) {
  // Navigation & Filtering
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedTier, setSelectedTier] = useState(7);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('T7_MEAL_PIE');
  const [enchantment, setEnchantment] = useState(0);

  // Production Parameters
  const [batches, setBatches] = useState(1);
  const [selectedCity, setSelectedCity] = useState('Caerleon');
  const [dailyBonus, setDailyBonus] = useState(0);
  const [stationTax, setStationTax] = useState(500);

  // Market & Economics
  const [ingredientPrices, setIngredientPrices] = useState({
    T7_CORN: 450,
    T3_FLOUR: 180,
    T7_MEAT: 680,
    T6_MILK: 320,
    T1_FISHSAUCE_LEVEL1: 1200,
    T1_FISHSAUCE_LEVEL2: 3600,
    T1_FISHSAUCE_LEVEL3: 11000,
  });
  const [itemSellPrice, setItemSellPrice] = useState(7900);
  const [isSellOrder, setIsSellOrder] = useState(true);

  // Focus Mastery & Specs
  const [masteryLevel, setMasteryLevel] = useState(0);
  const [specLevel, setSpecLevel] = useState(0);

  // Live Price Fetch State
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [priceStatus, setPriceStatus] = useState('');

  // Authoritative Backend State
  const [backendCalculation, setBackendCalculation] = useState(null);
  const [isBackendCalculating, setIsBackendCalculating] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  // Currently Selected Food Item Definition
  const currentItem = useMemo(() => {
    return FOOD_ITEMS.find((it) => it.id === selectedItemId) || FOOD_ITEMS[0];
  }, [selectedItemId]);

  // Ensure enchantment doesn't exceed item maxEnchantment
  useEffect(() => {
    if (currentItem && enchantment > (currentItem.maxEnchantment || 0)) {
      setEnchantment(0);
    }
  }, [currentItem, enchantment]);

  // Available Tiers for Active Course / Items
  const availableTiers = useMemo(() => {
    const itemTiers = new Set();
    FOOD_ITEMS.forEach((it) => {
      if (selectedCourse === 'all' || it.subcategory === selectedCourse) {
        itemTiers.add(it.tier);
      }
    });
    return Array.from(itemTiers).sort((a, b) => a - b);
  }, [selectedCourse]);

  // Keep selected tier in sync if course changes and current tier has no recipes
  useEffect(() => {
    if (availableTiers.length > 0 && !availableTiers.includes(selectedTier)) {
      setSelectedTier(availableTiers[0]);
    }
  }, [availableTiers, selectedTier]);

  // Filtered Items for Grid
  const filteredItems = useMemo(() => {
    return FOOD_ITEMS.filter((it) => {
      const matchCourse = selectedCourse === 'all' || it.subcategory === selectedCourse;
      const matchTier = it.tier === selectedTier;
      const matchSearch = !searchQuery || it.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCourse && matchTier && matchSearch;
    });
  }, [selectedCourse, selectedTier, searchQuery]);

  // Auto-switch item if current item is not in filtered list
  useEffect(() => {
    if (filteredItems.length > 0 && !filteredItems.some((it) => it.id === selectedItemId)) {
      setSelectedItemId(filteredItems[0].id);
    }
  }, [filteredItems, selectedItemId]);

  // Client Fallback Calculation
  const localCalculation = useMemo(() => {
    return computeFoodCrafting({
      item: currentItem,
      enchantment,
      batches,
      ingredientPrices,
      itemSellPrice,
      city: selectedCity,
      useFocus,
      dailyBonusPct: dailyBonus,
      stationTaxPer100: stationTax,
      hasPremium,
      isSellOrder,
      masteryLevel,
      specLevel,
    });
  }, [
    currentItem,
    enchantment,
    batches,
    ingredientPrices,
    itemSellPrice,
    selectedCity,
    useFocus,
    dailyBonus,
    stationTax,
    hasPremium,
    isSellOrder,
    masteryLevel,
    specLevel,
  ]);

  // Authoritative Backend Calculation Query
  useEffect(() => {
    let isCancelled = false;
    setIsBackendCalculating(true);

    const timer = setTimeout(async () => {
      try {
        const payload = {
          item_id: currentItem.id,
          enchantment,
          batches,
          ingredient_prices: ingredientPrices,
          item_sell_price: itemSellPrice,
          city: selectedCity,
          use_focus: useFocus,
          daily_bonus_pct: dailyBonus,
          station_tax_per_100: stationTax,
          has_premium: hasPremium,
          is_sell_order: isSellOrder,
          mastery_level: masteryLevel,
          spec_level: specLevel,
        };

        const res = await calculateFoodApi(payload);
        if (!isCancelled) {
          if (res && res.financials) {
            setBackendCalculation(res);
            setIsBackendConnected(true);
          } else {
            setIsBackendConnected(false);
          }
        }
      } catch {
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
    currentItem,
    enchantment,
    batches,
    ingredientPrices,
    itemSellPrice,
    selectedCity,
    useFocus,
    dailyBonus,
    stationTax,
    hasPremium,
    isSellOrder,
    masteryLevel,
    specLevel,
  ]);

  const calc = backendCalculation || localCalculation;

  // Handle individual ingredient price change
  const handleIngredientPriceChange = (uname, val) => {
    setIngredientPrices((prev) => ({
      ...prev,
      [uname]: Math.max(0, parseFloat(val) || 0),
    }));
  };

  // Fetch Live Prices for this recipe
  const handleFetchPrices = async () => {
    if (!currentItem) return;
    setLoadingPrices(true);
    setPriceStatus('Checking market ledger...');

    const ingIds = (currentItem.ingredients || []).map((i) => i.uniqueName);
    if (enchantment > 0 && currentItem.enchantments?.[enchantment]?.sauce) {
      ingIds.push(currentItem.enchantments[enchantment].sauce.uniqueName);
    }

    try {
      const res = await fetchFoodPricesApi({
        item_id: currentItem.uniqueName,
        enchantment,
        ingredient_ids: ingIds,
        server,
        city: selectedCity,
      });

      if (res) {
        let updatedCount = 0;
        let sampleAge = null;
        if (res.food && res.food.sell_min > 0) {
          setItemSellPrice(res.food.sell_min);
          if (res.food.age_hours != null) sampleAge = res.food.age_hours;
          updatedCount++;
        }
        if (res.ingredients) {
          const newPrices = { ...ingredientPrices };
          Object.entries(res.ingredients).forEach(([id, rec]) => {
            if (rec && rec.sell_min > 0) {
              newPrices[id] = rec.sell_min;
              if (sampleAge === null && rec.age_hours != null) sampleAge = rec.age_hours;
              updatedCount++;
            }
          });
          setIngredientPrices(newPrices);
        }
        const ageText = sampleAge !== null ? (sampleAge < 1 ? ` • 🟢 Updated ${Math.max(1, Math.round(sampleAge * 60))}m ago` : ` • 🟡 Updated ${Math.round(sampleAge * 10) / 10}h ago`) : '';
        setPriceStatus(updatedCount > 0 ? `Updated ${updatedCount} prices from ${selectedCity}${ageText}` : `No active sell orders found in ${selectedCity}`);
      } else {
        setPriceStatus('Using local estimates');
      }
    } catch {
      setPriceStatus('Unable to reach market API');
    } finally {
      setLoadingPrices(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Banner & Aesthetic Hearth Identity */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-900/40 bg-gradient-to-r from-[#17120e] via-[#1b1511] to-[#12161f] p-5 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-orange-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600/30 to-orange-800/40 border border-amber-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Flame className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-black text-amber-200 tracking-wide">
                  The Master Chef&apos;s Hearth
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Cook Station & Butchery
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Authentic Albion Online culinary crafting, Fish Sauce crucible infusions, batch returns, and live Caerleon specialty ledger.
              </p>
            </div>
          </div>

          {/* Engine Status, Guide & Royal City Specialty Badge */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenGuide && onOpenGuide('food')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-xs font-serif font-bold text-amber-300 hover:bg-amber-500/25 transition-all shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Cooking Guide</span>
            </button>

            <button
              type="button"
              onClick={() => onStartTour && onStartTour('food')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-amber-500/40 text-xs font-serif font-bold text-amber-200 hover:bg-amber-500/20 transition-all shadow-sm"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Interactive Tour</span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e1117] border border-amber-700/40 text-xs shadow-inner">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div className="text-[10px] uppercase font-mono text-slate-400">Bonus Royal City</div>
                <div className="font-serif font-bold text-amber-300">Caerleon (+15% Return)</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-[11px] font-mono text-slate-300">
              <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'}`} />
              <span>{isBackendCalculating ? 'Calculating...' : isBackendConnected ? 'Django Engine 100%' : 'Client Fallback'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Course Subcategory Filter Bar */}
      <div id="tour-food-course-picker" className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {FOOD_SUBCATEGORIES.map((cat) => {
          const IconComp = SUBCATEGORY_ICONS[cat.id] || Utensils;
          const isActive = selectedCourse === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCourse(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-serif font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-500/20 border border-amber-500/80 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50'
                  : 'bg-albion-card border border-albion-border text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <IconComp className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tier Selector & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-albion-card border border-albion-border">
        {/* Tier Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono uppercase text-slate-400 mr-2 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            Tier:
          </span>
          {FOOD_TIERS.map((t) => {
            const isAvailable = availableTiers.includes(t.level);
            const isSelected = selectedTier === t.level;
            return (
              <button
                key={t.level}
                type="button"
                disabled={!isAvailable}
                onClick={() => setSelectedTier(t.level)}
                className={`w-9 h-8 rounded-lg text-xs font-serif font-black transition-all ${
                  isSelected
                    ? `${t.color} ring-2 ring-amber-400/60 shadow-lg scale-105`
                    : isAvailable
                    ? 'bg-albion-surface border border-albion-border/80 text-slate-300 hover:border-slate-600'
                    : 'opacity-25 cursor-not-allowed border border-transparent text-slate-600'
                }`}
                title={t.name}
              >
                T{t.level}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes (e.g. Pork Pie, Omelette, Drake)..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-albion-surface border border-albion-border text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/60"
          />
        </div>
      </div>

      {/* 4. Dish Catalog Browser (Horizontal Carousel / Grid) */}
      <div id="tour-food-item-picker" className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
          <span>Available Recipes ({filteredItems.length})</span>
          <span>Click recipe to forge in hearth</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-72 overflow-y-auto p-1 scrollbar-thin">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs font-serif text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
              No recipes found for this course and tier. Select another tier above or search a different name.
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = item.id === selectedItemId;
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
                  {/* Item Icon */}
                  <div className="w-16 h-16 rounded-lg bg-slate-950/80 border border-slate-800 p-1 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform">
                    <ItemIcon
                      src={`/items/${item.icon}`}
                      alt={item.name}
                      className="w-full h-full object-contain filter drop-shadow-md"
                      loading="lazy"
                    />
                  {item.isAvalonian && (
                    <span className="absolute top-0.5 right-0.5 px-1 text-[8px] font-mono bg-amber-400 text-slate-950 rounded font-bold">
                      AVA
                    </span>
                  )}
                  {item.isDragon && (
                    <span className="absolute top-0.5 right-0.5 px-1 text-[8px] font-mono bg-orange-500 text-slate-950 rounded font-bold">
                      DRAKE
                    </span>
                  )}
                </div>

                {/* Name & Batch Yield Badge */}
                <div className="mt-2 w-full">
                  <div className="text-xs font-serif font-bold text-slate-200 truncate group-hover:text-amber-300">
                    {item.name}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {item.amountCrafted > 1 ? `x${item.amountCrafted} / craft` : '1 unit'}
                    </span>
                    {item.nutrition > 0 && (
                      <span className="text-[9px] font-mono text-slate-400" title="Nutrition consumed">
                        {item.nutrition} nut
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          }))}
        </div>
      </div>

      {/* 5. Main Workbench Grid (Left: Recipe Blueprint & Crucible | Right: Ledger & Economics) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Crucible & Recipe Config (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Dish Blueprint Spotlight */}
          <div className="rounded-2xl border border-amber-700/40 bg-albion-card p-5 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-xl bg-slate-950 border-2 border-amber-500/60 p-1 flex items-center justify-center shadow-lg">
                  <ItemIcon
                    src={`/items/${calc?.item?.icon || currentItem.icon}`}
                    alt={currentItem.name}
                    className="w-full h-full object-contain filter drop-shadow-xl"
                  />
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded text-[10px] font-serif font-black bg-amber-600 text-slate-950 shadow">
                    T{currentItem.tier}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-serif font-black text-amber-200">
                      {currentItem.name}
                      {enchantment > 0 && (
                        <span className="ml-2 text-xs font-mono text-emerald-400">
                          .{enchantment}
                        </span>
                      )}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                    <span className="font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                      Yield: {currentItem.amountCrafted} units / batch
                    </span>
                    <span className="font-mono text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
                      Nutrition: {currentItem.nutrition} / batch
                    </span>
                    {currentItem.baseFocus > 0 && (
                      <span className="font-mono text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800/40">
                        Base Focus: {calc?.focus?.baseFocus || currentItem.baseFocus}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Batch Total Display */}
              <div className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-amber-500/40 text-right">
                <div className="text-[10px] font-mono uppercase text-slate-400">Total Prepared Output</div>
                <div className="text-xl font-mono font-black text-amber-300">
                  {calc?.batch?.totalUnitsProduced || batches * currentItem.amountCrafted}
                  <span className="text-xs text-slate-400 ml-1 font-serif">dishes</span>
                </div>
              </div>
            </div>

            {/* Fish Sauce Enchantment Crucible (Only if meal supports enchantments) */}
            {currentItem.maxEnchantment > 0 && (
              <div className="p-3.5 rounded-xl bg-[#0f131a] border border-amber-900/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-serif font-bold text-amber-300">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Fish Sauce Crucible (Meal Enchantment)</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Refined with Fish Chops + Seaweed
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {FOOD_ENCHANTMENTS.map((ench) => {
                    const isSelected = enchantment === ench.level;
                    const sauceData = currentItem.enchantments?.[ench.level]?.sauce;
                    return (
                      <button
                        key={ench.level}
                        type="button"
                        onClick={() => setEnchantment(ench.level)}
                        className={`flex flex-col items-center p-2 rounded-lg text-center transition-all border ${
                          isSelected
                            ? `${ench.color} ring-2 ring-amber-400/60 shadow-lg scale-102`
                            : 'bg-albion-surface border-albion-border/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                        }`}
                      >
                        <span className="text-xs font-serif font-bold">{ench.name}</span>
                        <span className="text-[10px] font-mono opacity-80 mt-0.5">
                          {sauceData ? `${sauceData.count * batches}x sauce` : 'Standard'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Location, Nutrition Station Tax & Batch Slider Controls */}
          <div id="tour-food-city-controls" className="rounded-2xl border border-albion-border bg-albion-card p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-albion-border/80">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-slate-200">
                <Building className="w-4 h-4 text-amber-400" />
                <span>Culinary Kitchen & Station Conditions</span>
              </div>
              {/* Caerleon Specialty Callout */}
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                selectedCity.toLowerCase() === 'caerleon'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {selectedCity.toLowerCase() === 'caerleon' ? '★ +15% Specialty Active' : '0% Specialty (Outside Caerleon)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* City Selector */}
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Crafting City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-albion-surface border border-albion-border text-xs text-slate-100 font-serif focus:outline-none focus:border-amber-500"
                >
                  {CITIES.map((c) => {
                    const cityName = typeof c === 'string' ? c : c.name;
                    return (
                      <option key={cityName} value={cityName}>
                        {cityName} {cityName === 'Caerleon' ? '★ (Food Specialty)' : cityName === 'Island' ? '(0% Base)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Station Tax Per 100 Nutrition */}
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Station Tax / 100 Nut.</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={stationTax}
                    onChange={(e) => setStationTax(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-lg bg-albion-surface border border-albion-border text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">silver</span>
                </div>
              </div>

              {/* Daily Bonus Day */}
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Daily Bonus Event</label>
                <select
                  value={dailyBonus}
                  onChange={(e) => setDailyBonus(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-albion-surface border border-albion-border text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                >
                  <option value={0}>0% - Standard Day</option>
                  <option value={10}>+10% - Daily Event</option>
                  <option value={20}>+20% - Feast Day Event</option>
                </select>
              </div>
            </div>

            {/* Batch Counter Controller */}
            <div className="p-3.5 rounded-xl bg-albion-surface/60 border border-albion-border/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-bold text-slate-300">Crafting Runs (Batches)</span>
                <span className="text-xs font-mono text-amber-400 font-bold">{batches} craft batches</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={batches}
                  onChange={(e) => setBatches(parseInt(e.target.value, 10))}
                  className="flex-1 accent-amber-500 cursor-pointer"
                />
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={batches}
                  onChange={(e) => setBatches(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-center text-amber-300 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Batch Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                {[1, 5, 10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBatches(preset)}
                    className={`flex-1 py-1 rounded text-[10px] font-mono transition-all ${
                      batches === preset
                        ? 'bg-amber-600 text-slate-950 font-bold shadow'
                        : 'bg-albion-card border border-albion-border text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 6. Ingredient Recipe & Market Ledger */}
          <div id="tour-food-ingredients" className="rounded-2xl border border-albion-border bg-albion-card p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-albion-border/80">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-slate-200">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Recipe Ingredients & Return Ledger</span>
              </div>

              <button
                type="button"
                onClick={handleFetchPrices}
                disabled={loadingPrices}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/50 text-xs font-serif font-bold text-amber-300 hover:bg-amber-500/30 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingPrices ? 'animate-spin' : ''}`} />
                <span>Fetch Live Market Prices</span>
              </button>
            </div>

            {priceStatus && (
              <div className="text-[11px] font-mono text-amber-400/90 bg-amber-950/20 px-3 py-1 rounded border border-amber-900/30">
                {priceStatus}
              </div>
            )}

            {/* Ingredients Table */}
            <div className="space-y-2.5">
              {calc?.materials?.breakdown?.map((ing) => {
                const currentPrice = ingredientPrices[ing.uniqueName] ?? ing.unitPrice;
                return (
                  <div
                    key={ing.uniqueName}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-albion-surface/50 border border-albion-border/70 hover:border-slate-600 transition-all"
                  >
                    {/* Icon & Ingredient Name */}
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 p-0.5 flex items-center justify-center">
                        <ItemIcon
                          src={`/items/${ing.icon}`}
                          alt={ing.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-serif font-bold text-slate-200">
                          {ing.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
                          <span>Req: {ing.countPerBatch * batches} total</span>
                          {ing.isRefundable ? (
                            <span className="text-emerald-400 font-bold">
                              -{ing.returned} RRR refunded
                            </span>
                          ) : (
                            <span className="text-amber-400">0% Refund (Token)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Unit Price Input */}
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-[9px] font-mono uppercase text-slate-400">Unit Price</div>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={currentPrice}
                            onChange={(e) => handleIngredientPriceChange(ing.uniqueName, e.target.value)}
                            className="w-24 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-right text-slate-100 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      {/* Net Cost Output */}
                      <div className="text-right min-w-[90px]">
                        <div className="text-[9px] font-mono uppercase text-slate-400">Net Cost</div>
                        <div className="text-xs font-mono font-bold text-amber-300">
                          {Math.round(ing.netCost).toLocaleString()} silver
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Artisan Financial Ledger (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Profit & Return Ledger Card */}
          <div id="tour-food-ledger" className="rounded-2xl border border-amber-700/50 bg-gradient-to-b from-[#151922] to-[#0e1117] p-5 space-y-5 shadow-2xl">
            {/* Ledger Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-900/30">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-serif font-bold text-amber-200">Culinary Profit Ledger</span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {batches} {batches === 1 ? 'Batch' : 'Batches'}
              </span>
            </div>

            {/* Finished Food Sell Price & Order Type */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-serif font-bold text-slate-200">Sell Price (Per Finished Dish)</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-mono text-[9px]">
                    Quality: Normal (Standard Consumable)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSellOrder(!isSellOrder)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all ${
                      isSellOrder
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isSellOrder ? 'Sell Order (+2.5%)' : 'Direct Sell'}
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={itemSellPrice}
                  onChange={(e) => setItemSellPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm font-mono text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">silver / unit</span>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="space-y-2 text-xs font-mono">
              {/* Gross Upfront Cost */}
              <div className="flex items-center justify-between text-slate-400">
                <span>Upfront Material Cost:</span>
                <span>{Math.round(calc?.materials?.upfrontCost || 0).toLocaleString()} silver</span>
              </div>

              {/* RRR Refund Value */}
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span>Resource Return Refund ({calc?.rates?.rrrCurrentPct}%):</span>
                <span>
                  -{Math.round((calc?.materials?.upfrontCost || 0) - (calc?.materials?.netCost || 0)).toLocaleString()} silver
                </span>
              </div>

              {/* Station Nutrition Tax */}
              <div className="flex items-center justify-between text-slate-400">
                <span>Cook Station Nutrition Fee:</span>
                <span>+{Math.round(calc?.fees?.stationFee || 0).toLocaleString()} silver</span>
              </div>

              <div className="border-t border-slate-800 my-1" />

              {/* Total Net Cost */}
              <div className="flex items-center justify-between text-slate-300 font-bold">
                <span>Total Net Crafting Cost:</span>
                <span className="text-amber-300 font-mono">
                  {Math.round(calc?.financials?.totalCost || 0).toLocaleString()} silver
                </span>
              </div>

              {/* Gross Revenue */}
              <div className="flex items-center justify-between text-slate-400">
                <span>Gross Revenue ({calc?.batch?.totalUnitsProduced} units):</span>
                <span>{Math.round(calc?.financials?.grossRevenue || 0).toLocaleString()} silver</span>
              </div>

              {/* Market Taxes */}
              <div className="flex items-center justify-between text-slate-500">
                <span>Market Taxes ({hasPremium ? '4%' : '8%'}{isSellOrder ? ' + 2.5%' : ''}):</span>
                <span>-{Math.round(calc?.financials?.marketTaxes || 0).toLocaleString()} silver</span>
              </div>

              <div className="border-t border-slate-800 my-1" />

              {/* Net Revenue */}
              <div className="flex items-center justify-between text-slate-300">
                <span>Net Revenue After Tax:</span>
                <span>{Math.round(calc?.financials?.netRevenue || 0).toLocaleString()} silver</span>
              </div>
            </div>

            {/* Bottom Line Net Profit Card */}
            <div className={`p-4 rounded-xl border text-center space-y-1 shadow-lg ${
              (calc?.financials?.netProfit || 0) >= 0
                ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                : 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
            }`}>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Net Culinary Profit
              </div>
              <div className={`text-2xl font-serif font-black ${
                (calc?.financials?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {(calc?.financials?.netProfit || 0) >= 0 ? '+' : ''}
                {Math.round(calc?.financials?.netProfit || 0).toLocaleString()}
                <span className="text-xs font-mono font-normal ml-1 text-slate-400">silver</span>
              </div>

              <div className="flex items-center justify-center gap-3 pt-1 text-[11px] font-mono">
                <span className={
                  (calc?.financials?.netProfit || 0) >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
                }>
                  Margin: {calc?.financials?.profitMarginPct || 0}%
                </span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-slate-300">
                  {Math.round(calc?.financials?.profitPerUnit || 0).toLocaleString()} / dish
                </span>
              </div>
            </div>

            {/* Focus Economy & Silver Per Focus (SPF) */}
            {useFocus && calc?.focus?.totalFocusUsed > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-sky-500/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-serif font-bold text-sky-300">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-sky-400" />
                    <span>Focus Efficiency</span>
                  </div>
                  <span className="font-mono text-sky-400">
                    {calc?.focus?.totalFocusUsed?.toLocaleString()} Focus Used
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                  <span>Silver Per Focus (SPF):</span>
                  <span className="font-black text-amber-300 text-sm">
                    {calc?.focus?.silverPerFocus || 0} silver / focus
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Chef Specialization & Destiny Board Mastery Sliders */}
          <div id="tour-food-focus-spec" className="rounded-2xl border border-albion-border bg-albion-card p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-albion-border/80">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-slate-200">
                <Zap className="w-4 h-4 text-sky-400" />
                <span>Chef Destiny Board & Focus Efficiency</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {useFocus ? 'Focus Mode Active' : 'Enable Focus in Header'}
              </span>
            </div>

            <div className="space-y-3">
              {/* Mastery Level */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Chef Mastery Level</span>
                  <span className="text-amber-400 font-bold">{masteryLevel} / 100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masteryLevel}
                  onChange={(e) => setMasteryLevel(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Spec Level */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">{currentItem.name} Specialization</span>
                  <span className="text-amber-400 font-bold">{specLevel} / 100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={specLevel}
                  onChange={(e) => setSpecLevel(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Calculated Focus Per Batch */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-albion-surface border border-albion-border text-xs font-mono">
                <span className="text-slate-400">Focus Cost Per Batch:</span>
                <span className="text-sky-300 font-bold">
                  {calc?.focus?.focusPerBatch || 0} focus
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
