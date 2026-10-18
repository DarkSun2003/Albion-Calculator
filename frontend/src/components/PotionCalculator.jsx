import React, { useState, useMemo, useEffect } from 'react';
import NumberInput from './NumberInput';
import { 
  POTION_ITEMS, 
  POTION_SUBCATEGORIES, 
  POTION_TIERS, 
  POTION_ENCHANTMENTS,
  computePotionCrafting,
  simulatePotionCraftingFromMaterials 
} from '../utils/potionMath';
import { CITIES, getFocusPoolAnalysis } from '../utils/albionMath';
import { calculatePotionApi, fetchPotionPricesApi } from '../services/api';
import ItemIcon from './ItemIcon';
import { 
  Sparkles, 
  Heart, 
  Zap, 
  Shield, 
  Swords, 
  Skull, 
  Wind, 
  Pickaxe, 
  FlaskConical, 
  Search, 
  Coins, 
  Building, 
  RotateCcw, 
  TrendingUp, 
  ShieldCheck, 
  RefreshCw, 
  Sliders,
  Flame,
  BookOpen,
  HelpCircle,
  PackageCheck,
  Target,
  Repeat
} from 'lucide-react';

const SUBCATEGORY_ICONS = {
  all: Sparkles,
  healing: Heart,
  energy: Zap,
  defense: Shield,
  dragon: Flame,
  combat: Swords,
  debuff: Skull,
  utility: Wind,
  gathering: Pickaxe,
  distillery: FlaskConical,
};

export default function PotionCalculator({ server, hasPremium, useFocus, setUseFocus, onOpenGuide, onStartTour }) {
  // Navigation & Filtering
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [selectedTier, setSelectedTier] = useState(4);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('T4_POTION_HEAL');
  const [enchantment, setEnchantment] = useState(0);

  // Production Parameters
  const [batches, setBatches] = useState(1);
  const [selectedCity, setSelectedCity] = useState('Brecilien');
  const [dailyBonus, setDailyBonus] = useState(0);
  const [stationTax, setStationTax] = useState(500);

  // Market & Economics
  const [ingredientPrices, setIngredientPrices] = useState({
    T4_BURDOCK: 180,
    T3_EGG: 150,
    T1_ALCHEMY_EXTRACT_LEVEL1: 650,
    T1_ALCHEMY_EXTRACT_LEVEL2: 2100,
    T1_ALCHEMY_EXTRACT_LEVEL3: 6800,
  });
  const [itemSellPrice, setItemSellPrice] = useState(1850);
  const [isSellOrder, setIsSellOrder] = useState(true);

  // Focus Mastery & Specs
  const [masteryLevel, setMasteryLevel] = useState(0);
  const [specLevel, setSpecLevel] = useState(0);

  // "I Have Ingredients" Mode State
  const [potionInputMode, setPotionInputMode] = useState('batches'); // 'batches' | 'materials'
  const [primaryIngHave, setPrimaryIngHave] = useState(500);
  const [compoundPotionRrr, setCompoundPotionRrr] = useState(true);

  // Live Price Fetch State
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [priceStatus, setPriceStatus] = useState('');

  // Authoritative Backend State
  const [backendCalculation, setBackendCalculation] = useState(null);
  const [isBackendCalculating, setIsBackendCalculating] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  // Currently Selected Potion Item Definition
  const currentItem = useMemo(() => {
    return POTION_ITEMS.find((it) => it.id === selectedItemId) || POTION_ITEMS[0];
  }, [selectedItemId]);

  // Primary Ingredient for "I Have Ingredients" mode
  const primaryIngredient = useMemo(() => {
    if (!currentItem?.ingredients || currentItem.ingredients.length === 0) return null;
    return currentItem.ingredients[0];
  }, [currentItem]);

  // Simulation of material-driven brewing
  const potionMaterialSim = useMemo(() => {
    if (!currentItem) return null;
    return simulatePotionCraftingFromMaterials({
      item: currentItem,
      enchantment,
      primaryHave: primaryIngHave,
      city: selectedCity,
      useFocus,
      dailyBonusPct: dailyBonus,
    });
  }, [currentItem, enchantment, primaryIngHave, selectedCity, useFocus, dailyBonus]);

  // If in 'materials' mode, calculate effective batches from potionMaterialSim
  const effectiveBatches = useMemo(() => {
    if (potionInputMode !== 'materials' || !potionMaterialSim) {
      return Math.max(1, parseInt(batches || 1, 10));
    }
    const derived = compoundPotionRrr ? potionMaterialSim.totalBatches : potionMaterialSim.pass1Batches;
    return Math.max(1, derived || 1);
  }, [potionInputMode, potionMaterialSim, compoundPotionRrr, batches]);

  // Ensure enchantment doesn't exceed item maxEnchantment
  useEffect(() => {
    if (currentItem && enchantment > (currentItem.maxEnchantment || 0)) {
      setEnchantment(0);
    }
  }, [currentItem, enchantment]);

  // Available Tiers for Active Subcategory
  const availableTiers = useMemo(() => {
    const itemTiers = new Set();
    POTION_ITEMS.forEach((it) => {
      if (selectedSubcategory === 'all' || it.subcategory === selectedSubcategory) {
        itemTiers.add(it.tier);
      }
    });
    return Array.from(itemTiers).sort((a, b) => a - b);
  }, [selectedSubcategory]);

  // Keep selected tier in sync if subcategory changes and current tier has no potions
  useEffect(() => {
    if (availableTiers.length > 0 && !availableTiers.includes(selectedTier)) {
      setSelectedTier(availableTiers[0]);
    }
  }, [availableTiers, selectedTier]);

  // Filtered Items for Grid
  const filteredItems = useMemo(() => {
    return POTION_ITEMS.filter((it) => {
      const matchSub = selectedSubcategory === 'all' || it.subcategory === selectedSubcategory;
      const matchTier = it.tier === selectedTier;
      const matchSearch = !searchQuery || it.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSub && matchTier && matchSearch;
    });
  }, [selectedSubcategory, selectedTier, searchQuery]);

  // Auto-switch item if current item is not in filtered list
  useEffect(() => {
    if (filteredItems.length > 0 && !filteredItems.some((it) => it.id === selectedItemId)) {
      setSelectedItemId(filteredItems[0].id);
    }
  }, [filteredItems, selectedItemId]);

  // Client Fallback Calculation
  const localCalculation = useMemo(() => {
    return computePotionCrafting({
      item: currentItem,
      enchantment,
      batches: effectiveBatches,
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
    effectiveBatches,
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

  // Query Authoritative Django Backend Potion Engine
  useEffect(() => {
    let isCancelled = false;
    setIsBackendCalculating(true);

    const timer = setTimeout(async () => {
      try {
        const payload = {
          item_id: currentItem.id,
          enchantment,
          batches: effectiveBatches,
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

        const res = await calculatePotionApi(payload);
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
    effectiveBatches,
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
  const focusPool = useMemo(() => getFocusPoolAnalysis(calc?.focus?.totalFocusUsed), [calc?.focus?.totalFocusUsed]);

  const handleIngredientPriceChange = (uname, val) => {
    setIngredientPrices((prev) => ({
      ...prev,
      [uname]: Math.max(0, parseFloat(val) || 0),
    }));
  };

  const handleFetchPrices = async () => {
    if (!currentItem) return;
    setLoadingPrices(true);
    setPriceStatus('Checking alchemical market records...');

    const ingIds = (currentItem.ingredients || []).map((i) => i.uniqueName);
    if (enchantment > 0 && currentItem.enchantments?.[enchantment]?.extract) {
      ingIds.push(currentItem.enchantments[enchantment].extract.uniqueName);
    }

    try {
      const res = await fetchPotionPricesApi({
        item_id: currentItem.uniqueName,
        enchantment,
        ingredient_ids: ingIds,
        server,
        city: selectedCity,
      });

      if (res) {
        let updatedCount = 0;
        let sampleAge = null;
        if (res.potion && res.potion.sell_min > 0) {
          setItemSellPrice(res.potion.sell_min);
          if (res.potion.age_hours != null) sampleAge = res.potion.age_hours;
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
      {/* 1. Header Banner: Alchemist's Crucible Atmosphere */}
      <div className="forged-tablet-gold relative overflow-hidden p-5 sm:p-6 shadow-2xl">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600/30 to-teal-950/80 border border-teal-500/60 flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.25)]">
              <FlaskConical className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-decorative font-black text-amber-200 tracking-wide drop-shadow-sm">
                  The Alchemist&apos;s Laboratory
                </h2>
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold tracking-wider">
                  Potion Brewing &amp; Distillery
                </span>
              </div>
              <p className="text-xs text-slate-300/80 mt-1 font-sans">
                Authentic Albion Online potion alchemy, Arcane Extract infusions, batch yields, and Brecilien specialty bonuses.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenGuide && onOpenGuide('potions')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0e1422] hover:bg-[#151f33] border border-amber-500/40 text-xs font-serif font-bold text-amber-200 hover:text-amber-100 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-400" />
              <span>Alchemy Codex</span>
            </button>

            <button
              type="button"
              onClick={() => onStartTour && onStartTour('potions')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0e1422] hover:bg-[#151f33] border border-slate-700 hover:border-teal-500/40 text-xs font-serif font-bold text-slate-300 hover:text-teal-200 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-teal-400/80" />
              <span>Interactive Tour</span>
            </button>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#05080e] border border-teal-500/30 text-xs shadow-inner">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <div className="text-left">
                <div className="text-[9px] uppercase font-mono text-slate-400 tracking-wider">Bonus City</div>
                <div className="font-serif font-bold text-teal-300">Brecilien (+15% Return)</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#05080e] border border-[#1a2436] text-[11px] font-mono text-slate-300 shadow-inner">
              <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-teal-400'}`} />
              <span>{isBackendCalculating ? 'Calculating...' : isBackendConnected ? 'Django Engine 100%' : 'Client Fallback'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Subcategory Filter Pills */}
      <div id="tour-potion-type-picker" className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {POTION_SUBCATEGORIES.map((cat) => {
          const IconComp = SUBCATEGORY_ICONS[cat.id] || FlaskConical;
          const isActive = selectedSubcategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedSubcategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-serif font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-b from-teal-950/70 to-[#0e1422] border border-teal-400/80 text-teal-200 shadow-[0_0_15px_rgba(20,184,166,0.25)] ring-1 ring-teal-500/40'
                  : 'bg-[#0a0f18] border border-[#1e2a3c] text-slate-400 hover:text-teal-200 hover:bg-[#111827] hover:border-slate-700'
              }`}
            >
              <IconComp className={`w-4 h-4 ${isActive ? 'text-teal-300' : 'text-slate-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tier Selector & Search Bar */}
      <div className="forged-tablet p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono uppercase text-slate-400 mr-2 flex items-center gap-1 tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-teal-400" />
            Tier:
          </span>
          {POTION_TIERS.map((t) => {
            const isAvailable = availableTiers.includes(t.level);
            const isSelected = selectedTier === t.level;
            return (
              <button
                key={t.level}
                type="button"
                disabled={!isAvailable}
                onClick={() => setSelectedTier(t.level)}
                className={`w-9 h-8 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-teal-400 to-teal-600 text-slate-950 border-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.4)]'
                    : isAvailable
                    ? 'bg-[#060a12] border-[#1a2436] text-slate-300 hover:border-slate-600'
                    : 'opacity-25 cursor-not-allowed border-transparent text-slate-600'
                }`}
                title={t.name}
              >
                T{t.level}
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search potions (e.g. Healing, Poison, Invisibility)..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#060a12] border border-[#1a2436] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/80 font-sans"
          />
        </div>
      </div>

      {/* 4. Potions Catalog Browser */}
      <div id="tour-potion-item-picker" className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
          <span>Available Concoctions ({filteredItems.length})</span>
          <span>Click potion to brew in alembic</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-72 overflow-y-auto p-1 scrollbar-thin">
          {filteredItems.map((item) => {
            const isSelected = item.id === selectedItemId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItemId(item.id)}
                className={`relative group flex flex-col items-center text-center p-3 rounded-xl transition-all border text-left cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-teal-950/60 to-[#0c121e] border-teal-400/80 shadow-[0_0_18px_rgba(20,184,166,0.3)] ring-1 ring-teal-500/50'
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
                  {item.subcategory === 'dragon' ? (
                    <span className="absolute top-1 right-1 px-1.5 py-0.2 text-[8px] font-mono bg-red-600 text-white rounded font-bold shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                      DRAGON
                    </span>
                  ) : item.isRare ? (
                    <span className="absolute top-1 right-1 px-1.5 py-0.2 text-[8px] font-mono bg-purple-500 text-slate-950 rounded font-black shadow">
                      RARE
                    </span>
                  ) : null}
                </div>

                <div className="mt-2.5 w-full">
                  <div className="text-xs font-serif font-bold text-slate-200 truncate group-hover:text-teal-200">
                    {item.name}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                      {item.amountCrafted > 1 ? `x${item.amountCrafted} / brew` : '1 unit'}
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
                <div className="relative w-20 h-20 rounded-xl bg-[#04060a] border-2 border-teal-400/80 p-1.5 flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.25)]">
                  <ItemIcon
                    src={`/items/${calc?.item?.icon || currentItem.icon}`}
                    alt={currentItem.name}
                    className="w-full h-full object-contain filter drop-shadow-xl"
                  />
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded text-[10px] font-serif font-black bg-gradient-to-r from-teal-400 to-teal-600 text-slate-950 shadow">
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
                    {currentItem.subcategory === 'dragon' && (
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-bold flex items-center gap-1">
                        <Flame className="w-3 h-3 text-red-400" />
                        Dragon Blood Alchemy
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
                    <span className="font-mono text-teal-300 bg-[#060a12] px-2.5 py-1 rounded-lg border border-teal-500/30">
                      Yield: {currentItem.amountCrafted} potions / batch
                    </span>
                    {currentItem.baseFocus > 0 && (
                      <span className="font-mono text-sky-300 bg-[#060a12] px-2.5 py-1 rounded-lg border border-sky-500/30">
                        Base Focus: {calc?.focus?.baseFocus || currentItem.baseFocus}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-4 py-2.5 rounded-xl bg-[#05080e] border border-teal-500/40 text-right shadow-inner">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Brewed Output</div>
                <div className="text-2xl font-mono font-black text-teal-300">
                  {calc?.batch?.totalUnitsProduced || batches * currentItem.amountCrafted}
                  <span className="text-xs text-slate-400 ml-1 font-serif">potions</span>
                </div>
              </div>
            </div>

            {/* Arcane Extract Infusion Crucible */}
            {currentItem.maxEnchantment > 0 && (
              <div className="p-3.5 rounded-xl bg-[#05080e] border border-[#1a2436] space-y-2.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-serif font-bold text-teal-300">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span>Arcane Extract Infusion (Potion Enchantment)</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Distilled from Arcane Essences
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {POTION_ENCHANTMENTS.map((ench) => {
                    const isSelected = enchantment === ench.level;
                    const extData = currentItem.enchantments?.[ench.level]?.extract;
                    return (
                      <button
                        key={ench.level}
                        type="button"
                        onClick={() => setEnchantment(ench.level)}
                        className={`flex flex-col items-center p-2 rounded-xl text-center transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-b from-teal-950/70 to-[#0e1422] border-teal-400 text-teal-200 shadow-[0_0_12px_rgba(20,184,166,0.3)] ring-1 ring-teal-500/50'
                            : 'bg-[#090e17] border-[#1a2436] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                        }`}
                      >
                        <span className="text-xs font-serif font-bold">{ench.name}</span>
                        <span className="text-[10px] font-mono opacity-80 mt-0.5">
                          {extData ? `${extData.count * batches}x extract` : 'Standard'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Station Controls & Batch Size */}
          <div id="tour-potion-city-controls" className="forged-tablet p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2a3c]">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-amber-200">
                <Building className="w-4 h-4 text-teal-400" />
                <span>Alchemist&apos;s Lab Conditions</span>
              </div>
              <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                selectedCity.toLowerCase() === 'brecilien'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {selectedCity.toLowerCase() === 'brecilien' ? '★ +15% Specialty Active' : '0% Specialty (Outside Brecilien)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Crafting City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#05080e] border border-[#1a2436] text-xs text-slate-100 font-serif focus:outline-none focus:border-teal-500/80"
                >
                  {CITIES.map((c) => {
                    const cityName = typeof c === 'string' ? c : c.name;
                    return (
                      <option key={cityName} value={cityName}>
                        {cityName} {cityName === 'Brecilien' ? '★ (Potion Specialty)' : cityName === 'Island' ? '(0% Base)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Station Tax / 100 Nut.</label>
                <div className="relative">
                  <NumberInput
                    type="number"
                    min="0"
                    step="50"
                    value={stationTax}
                    onChange={(e) => setStationTax(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#05080e] border border-[#1a2436] text-xs font-mono text-amber-200 focus:outline-none focus:border-teal-500/80 shadow-inner"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">silver</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Daily Bonus Event</label>
                <select
                  value={dailyBonus}
                  onChange={(e) => setDailyBonus(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-[#05080e] border border-[#1a2436] text-xs text-slate-100 font-mono focus:outline-none focus:border-teal-500/80"
                >
                  <option value={0}>0% - Standard Day</option>
                  <option value={10}>+10% - Daily Event</option>
                  <option value={20}>+20% - Alchemy Event</option>
                </select>
              </div>
            </div>

            {/* Mode Switcher: Target Batches vs I Have Ingredients */}
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-serif font-bold text-slate-300">Alchemical Production Mode</span>
              <div className="flex items-center bg-[#070b12] p-0.5 rounded-lg border border-[#1e2a3c] text-[10px] font-mono shadow-inner">
                <button
                  type="button"
                  onClick={() => setPotionInputMode('batches')}
                  className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                    potionInputMode === 'batches'
                      ? 'bg-teal-500/20 text-teal-200 border border-teal-500/50 font-bold shadow-[0_0_10px_rgba(20,184,166,0.2)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Target className="w-3 h-3 text-teal-400" />
                  <span>Target Batches</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPotionInputMode('materials')}
                  className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                    potionInputMode === 'materials'
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <PackageCheck className="w-3 h-3 text-emerald-400" />
                  <span>I Have Ingredients</span>
                </button>
              </div>
            </div>

            {/* Target Batches Controller */}
            {potionInputMode === 'batches' ? (
              <div className="p-3.5 rounded-xl bg-[#05080e] border border-[#1a2436] space-y-2 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif font-bold text-slate-200">Brewing Runs (Batches)</span>
                  <span className="text-xs font-mono text-teal-300 font-bold">{batches} craft batches</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={batches}
                    onChange={(e) => setBatches(parseInt(e.target.value, 10))}
                    className="flex-1 accent-teal-500 cursor-pointer"
                  />
                  <NumberInput
                    type="number"
                    min="1"
                    max="9999"
                    value={batches}
                    onChange={(e) => setBatches(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-16 px-2 py-1 rounded-lg bg-[#080d16] border border-[#1a2436] text-xs font-mono text-center text-teal-300 font-bold focus:outline-none focus:border-teal-500/80 shadow-inner"
                  />
                </div>

                {/* Batch Quick Preset Buttons */}
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 5, 10, 25, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBatches(preset)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                        batches === preset
                          ? 'bg-gradient-to-r from-teal-400 to-teal-600 text-slate-950 font-black shadow'
                          : 'bg-[#080d16] border border-[#1a2436] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {preset}x
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* "I Have Ingredients" Interactive Calculator */
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#061810] to-[#0a151d] border border-emerald-500/40 space-y-3.5 shadow-[0_0_20px_rgba(16,185,129,0.08)]">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">
                  <div>
                    <span className="text-xs font-serif font-bold text-emerald-300 flex items-center gap-1.5">
                      <PackageCheck className="w-4 h-4 text-emerald-400" />
                      Herb Vault &rarr; What You Need & What You Achieve
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Enter the base herb/crop in your inventory stack. We compute exact brew batches, finished potions, and secondary extracts.
                    </p>
                  </div>

                  {/* Compound RRR vs 1st Pass Only Toggle */}
                  <div className="flex items-center bg-[#070b12] p-0.5 rounded-lg border border-emerald-500/40 text-[10px] font-mono shadow-inner">
                    <button
                      type="button"
                      onClick={() => setCompoundPotionRrr(true)}
                      className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                        compoundPotionRrr
                          ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/60 font-bold shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Keep brewing returned ingredients until less than 1 batch remains"
                    >
                      <Repeat className="w-3 h-3 text-emerald-400" />
                      <span>Re-Brew RRR ({potionMaterialSim?.passCount || 1} passes)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompoundPotionRrr(false)}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        !compoundPotionRrr
                          ? 'bg-amber-500/25 text-amber-200 border border-amber-500/60 font-bold shadow-[0_0_8px_rgba(217,119,6,0.25)]'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Brew only 1 initial pass and keep returned herbs in bag"
                    >
                      1st Pass Only
                    </button>
                  </div>
                </div>

                {/* Primary Herb Input */}
                <div className="bg-[#070b12] p-3 rounded-xl border border-emerald-500/40 flex items-center gap-3 shadow-inner">
                  <div className="w-11 h-11 bg-[#0c121e] rounded-lg p-0.5 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-md">
                    <ItemIcon
                      src={primaryIngredient?.icon ? `/items/${primaryIngredient.icon}` : null}
                      itemId={primaryIngredient?.uniqueName}
                      alt={primaryIngredient?.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold block truncate">
                      I Have {primaryIngredient?.name} ({primaryIngredient?.count || 1} / brew batch)
                    </label>
                    <NumberInput
                      type="number"
                      min="0"
                      value={primaryIngHave}
                      onChange={(e) => setPrimaryIngHave(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-[#04060a] border border-emerald-500/40 rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-400 shadow-inner"
                      placeholder="e.g. 500"
                    />
                  </div>
                </div>

                {/* Simulation Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                  <div className="bg-[#0b121d] p-2.5 rounded-xl border border-emerald-500/40 shadow-inner">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">Brew Batches</span>
                    <span className="text-sm font-extrabold text-emerald-300 block mt-0.5">{effectiveBatches} runs</span>
                    <span className="text-[9px] text-slate-400 block">{compoundPotionRrr ? `${potionMaterialSim?.passCount || 1} alchemy passes` : '1 pass'}</span>
                  </div>

                  <div className="bg-[#0b121d] p-2.5 rounded-xl border border-[#1e2a3c] shadow-inner">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">Finished Output</span>
                    <span className="text-sm font-extrabold text-teal-300 block mt-0.5">
                      {effectiveBatches * (currentItem.amountCrafted || 5)} potions
                    </span>
                    <span className="text-[9px] text-emerald-400 block font-bold">
                      {compoundPotionRrr && (potionMaterialSim?.bonusRrrBatches || 0) > 0 ? `+${(potionMaterialSim?.bonusRrrBatches || 0) * (currentItem.amountCrafted || 5)} from RRR` : 'Pass 1 only'}
                    </span>
                  </div>

                  <div className="bg-[#0b121d] p-2.5 rounded-xl border border-[#1e2a3c] shadow-inner">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">Leftover {primaryIngredient?.name?.slice(0, 10)}</span>
                    <span className="text-sm font-bold text-slate-200 block mt-0.5">
                      {potionMaterialSim?.leftoverPrimary || 0} units
                    </span>
                    <span className="text-[9px] text-slate-400 block">Remaining in bag</span>
                  </div>

                  <div className="bg-[#0b121d] p-2.5 rounded-xl border border-sky-500/40 shadow-inner">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">Lab Return Rate</span>
                    <span className="text-sm font-extrabold text-sky-400 block mt-0.5">
                      {potionMaterialSim?.returnRatePct || 0}%
                    </span>
                    <span className="text-[9px] text-slate-400 block">{selectedCity} {useFocus ? '⚡ Focus' : 'Base'}</span>
                  </div>
                </div>

                {/* Secondary Ingredients Required Notice */}
                {(potionMaterialSim?.secondaryIngredientsTotal || []).length > 0 && (
                  <div className="p-2.5 rounded-lg bg-[#05080e] border border-[#1a2436] space-y-1.5 text-xs">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-serif font-bold block">
                      Other Ingredients Needed For These {effectiveBatches} Batches:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(compoundPotionRrr ? potionMaterialSim?.secondaryIngredientsTotal : potionMaterialSim?.secondaryIngredientsPass1)?.map((sec) => (
                        <div key={sec.uniqueName} className="flex items-center justify-between p-1.5 rounded bg-[#080d16] border border-[#141d2c] font-mono text-[11px]">
                          <span className="text-slate-300 truncate">{sec.name}:</span>
                          <span className="text-teal-300 font-bold shrink-0">
                            {sec.grossNeeded.toLocaleString()} <span className="text-[9px] text-slate-400 font-sans font-normal">(Net ~{sec.netNeeded.toLocaleString()})</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 6. Ingredient Recipe Ledger */}
          <div id="tour-potion-ingredients" className="forged-tablet p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2a3c]">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-amber-200">
                <Coins className="w-4 h-4 text-teal-400" />
                <span>Alchemical Ingredients &amp; Return Ledger</span>
              </div>

              <button
                type="button"
                onClick={handleFetchPrices}
                disabled={loadingPrices}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600/20 border border-teal-500/50 text-xs font-serif font-bold text-teal-300 hover:bg-teal-600/30 transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingPrices ? 'animate-spin' : ''}`} />
                <span>Fetch Live Market Prices</span>
              </button>
            </div>

            {priceStatus && (
              <div className="text-[11px] font-mono text-teal-300/90 bg-[#05080e] px-3 py-1.5 rounded-lg border border-[#1a2436]">
                {priceStatus}
              </div>
            )}

            <div className="space-y-2.5">
              {calc?.materials?.breakdown?.map((ing) => {
                const currentPrice = ingredientPrices[ing.uniqueName] ?? ing.unitPrice;
                return (
                  <div
                    key={ing.uniqueName}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#05080e] border border-[#1a2436] hover:border-slate-600 transition-all shadow-inner"
                  >
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="w-10 h-10 rounded-lg bg-[#020408] border border-slate-800 p-0.5 flex items-center justify-center">
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
                            <span className="text-amber-400">0% Refund (Rare Creature)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-[9px] font-mono uppercase text-slate-400">Unit Price</div>
                        <div className="relative">
                          <NumberInput
                            type="number"
                            min="0"
                            value={currentPrice}
                            onChange={(e) => handleIngredientPriceChange(ing.uniqueName, e.target.value)}
                            className="w-24 px-2 py-1 rounded-lg bg-[#080d16] border border-[#1a2436] text-xs font-mono text-right text-amber-200 focus:outline-none focus:border-teal-500/80 shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="text-right min-w-[90px]">
                        <div className="text-[9px] font-mono uppercase text-slate-400">Net Cost</div>
                        <div className="text-xs font-mono font-bold text-teal-300">
                          {Math.round(ing.netCost).toLocaleString()} s
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div id="tour-potion-ledger" className="forged-tablet-gold p-5 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-teal-900/40">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-serif font-bold text-amber-200">Alchemy Profit Ledger</span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {batches} {batches === 1 ? 'Batch' : 'Batches'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#05080e] border border-[#1a2436] space-y-2 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-serif font-bold text-slate-200">Sell Price (Per Potion)</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#090e17] text-teal-400/90 border border-teal-900/50 font-mono text-[9px]">
                    Quality: Normal
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSellOrder(!isSellOrder)}
                    className={`text-[10px] font-mono px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                      isSellOrder
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-[0_0_8px_rgba(20,184,166,0.2)]'
                        : 'bg-[#080d16] text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isSellOrder ? 'Sell Order (+2.5%)' : 'Direct Sell'}
                  </button>
                </div>
              </div>

              <div className="relative">
                <NumberInput
                  type="number"
                  min="0"
                  value={itemSellPrice}
                  onChange={(e) => setItemSellPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#080d16] border border-[#1a2436] text-sm font-mono text-amber-300 font-bold focus:outline-none focus:border-teal-500/80 shadow-inner"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">silver / potion</span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400 p-2 rounded-lg bg-[#05080e] border border-[#1a2436]">
                <span>Upfront Material Cost:</span>
                <span>{Math.round(calc?.materials?.upfrontCost || 0).toLocaleString()} s</span>
              </div>

              <div className="flex items-center justify-between text-emerald-400 font-bold p-2 rounded-lg bg-[#05080e] border border-[#1a2436]">
                <span>Resource Return Refund ({calc?.rates?.rrrCurrentPct}%):</span>
                <span>
                  -{Math.round((calc?.materials?.upfrontCost || 0) - (calc?.materials?.netCost || 0)).toLocaleString()} s
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400 p-2 rounded-lg bg-[#05080e] border border-[#1a2436]">
                <span>Alchemist Station Nutrition Fee:</span>
                <span>+{Math.round(calc?.fees?.stationFee || 0).toLocaleString()} s</span>
              </div>

              <div className="flex items-center justify-between text-slate-300 font-bold p-2 rounded-lg bg-[#05080e] border border-teal-500/30">
                <span>Total Net Crafting Cost:</span>
                <span className="text-teal-300 font-mono">
                  {Math.round(calc?.financials?.totalCost || 0).toLocaleString()} s
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400 p-2 rounded-lg bg-[#05080e] border border-[#1a2436]">
                <span>Gross Revenue ({calc?.batch?.totalUnitsProduced} potions):</span>
                <span>{Math.round(calc?.financials?.grossRevenue || 0).toLocaleString()} s</span>
              </div>

              <div className="flex items-center justify-between text-slate-400 p-2 rounded-lg bg-[#05080e] border border-[#1a2436]">
                <span>Market Taxes ({hasPremium ? '4%' : '8%'}{isSellOrder ? ' + 2.5%' : ''}):</span>
                <span className="text-rose-400">-{Math.round(calc?.financials?.marketTaxes || 0).toLocaleString()} s</span>
              </div>

              <div className="flex items-center justify-between text-slate-300 p-2 rounded-lg bg-[#05080e] border border-[#1a2436]">
                <span>Net Revenue After Tax:</span>
                <span>{Math.round(calc?.financials?.netRevenue || 0).toLocaleString()} s</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border text-center space-y-1 shadow-lg ${
              (calc?.financials?.netProfit || 0) >= 0
                ? 'bg-[#04060a] border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                : 'bg-[#04060a] border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
            }`}>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Net Alchemy Profit
              </div>
              <div className={`text-3xl font-mono font-black mt-1 drop-shadow-md ${
                (calc?.financials?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {(calc?.financials?.netProfit || 0) >= 0 ? '+' : ''}
                {Math.round(calc?.financials?.netProfit || 0).toLocaleString()}
                <span className="text-xs font-mono font-normal ml-1.5 text-slate-400">silver</span>
              </div>

              <div className="flex items-center justify-center gap-3 pt-1 text-[11px] font-mono">
                <span className={
                  (calc?.financials?.netProfit || 0) >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
                }>
                  Margin: {calc?.financials?.profitMarginPct || 0}%
                </span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-slate-300">
                  {Math.round(calc?.financials?.profitPerUnit || 0).toLocaleString()} / potion
                </span>
              </div>
            </div>

            {useFocus && calc?.focus?.totalFocusUsed > 0 && (
              <div className="space-y-2">
                {/* Daily Focus Pool Cap Warning (10,000/day, max 30,000 bank) */}
                {focusPool && (
                  <div className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs shadow-inner ${focusPool.colorClass}`}>
                    <div className="flex items-center gap-2">
                      <Zap className={`w-4 h-4 shrink-0 ${focusPool.isOverBank ? 'text-rose-400' : 'text-sky-300'}`} />
                      <div>
                        <span className="font-serif font-bold block text-slate-100">
                          {focusPool.badgeText}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          {focusPool.isOverBank
                            ? 'Exceeds the 30,000 max focus bank capacity. Plan this brewing run across multiple days of 10,000/day regeneration.'
                            : 'Focus points regenerate at 10,000 daily with Premium active (30,000 maximum bank capacity).'}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold shrink-0 bg-[#06090f]/80 px-2 py-0.5 rounded border border-[#1e2a3c]">
                      {calc?.focus?.totalFocusUsed?.toLocaleString()} Focus
                    </span>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-[#05080e] border border-sky-500/40 space-y-2 shadow-inner">
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
              </div>
            )}
          </div>

          {/* Alchemist Mastery & Specs */}
          <div id="tour-potion-focus-spec" className="forged-tablet p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2a3c]">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-amber-200">
                <Zap className="w-4 h-4 text-sky-400" />
                <span>Alchemist Destiny Board &amp; Focus Specs</span>
              </div>
              {setUseFocus ? (
                <button
                  type="button"
                  onClick={() => setUseFocus(!useFocus)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-serif font-bold transition-all border cursor-pointer ${
                    useFocus
                      ? 'bg-sky-500/25 border-sky-400 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                      : 'bg-[#06090f] border-[#1e2a3c] text-slate-400 hover:text-slate-200 hover:border-sky-500/40'
                  }`}
                  title={useFocus ? 'Alchemy Focus is ACTIVE - Click to turn OFF' : 'Alchemy Focus is OFF - Click to turn ON'}
                >
                  <Zap className={`w-3.5 h-3.5 ${useFocus ? 'text-sky-300 fill-sky-300 animate-pulse' : 'text-slate-500'}`} />
                  <span>{useFocus ? '⚡ Focus: ON' : 'Focus: OFF'}</span>
                </button>
              ) : (
                <span className="text-[11px] font-mono text-slate-400">
                  {useFocus ? 'Focus Mode Active' : 'Enable Focus in Header'}
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Alchemist Mastery Level</span>
                  <span className="text-teal-300 font-bold">{masteryLevel} / 100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masteryLevel}
                  onChange={(e) => setMasteryLevel(parseInt(e.target.value, 10))}
                  className="w-full accent-teal-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">{currentItem.name} Specialization</span>
                  <span className="text-teal-300 font-bold">{specLevel} / 100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={specLevel}
                  onChange={(e) => setSpecLevel(parseInt(e.target.value, 10))}
                  className="w-full accent-teal-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#05080e] border border-[#1a2436] text-xs font-mono shadow-inner">
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
