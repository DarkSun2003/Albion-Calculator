import React, { useState, useMemo, useEffect } from 'react';
import NumberInput from './NumberInput';
import {
  FARMING_ITEMS,
  FARMING_CATEGORIES,
  ISLAND_BONUSES,
  DEFAULT_FARMING_PRICES,
  getFarmingPrice,
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
  Clock,
  Hammer,
} from 'lucide-react';

const CATEGORY_ICONS = {
  all: Sparkles,
  crop: Wheat,
  herb: Leaf,
  animal: Egg,
  mount: Shield,
};

const BATTLE_MOUNT_UPGRADES = {
  T7_FARM_SWAMPDRAGON_GROWN: [
    {
      id: 'mount_flame_basilisk',
      name: 'Flame Basilisk',
      icon: 'T7_MOUNT_SWAMPDRAGON_BATTLE.png',
      desc: '1 Saddled Swamp Dragon + 20 T7 Cloth + 5,000 Siphoned Energy',
    },
    {
      id: 'mount_venom_basilisk',
      name: 'Venom Basilisk',
      icon: 'T7_MOUNT_ARMORED_SWAMPDRAGON_BATTLE.png',
      desc: '1 Saddled Swamp Dragon + 20 T7 Metal Bars + 5,000 Siphoned Energy',
    },
    {
      id: 'mount_avalon_basilisk',
      name: 'Avalonian Basilisk',
      icon: 'T7_MOUNT_SWAMPDRAGON_AVALON_BASILISK.png',
      desc: '1 Saddled Swamp Dragon + 5,000 Avalonian Shards',
    },
  ],
  T8_FARM_MAMMOTH_GROWN: [
    {
      id: 'mount_command_mammoth',
      name: "Elder's Command Mammoth",
      icon: 'T8_MOUNT_MAMMOTH_BATTLE.png',
      desc: "1 Elder's Transport Mammoth + 20 T8 Leather + 10,000 Siphoned Energy",
    },
  ],
  T6_FARM_OX_GROWN: [
    {
      id: 'mount_siege_ballista',
      name: 'Siege Ballista',
      icon: 'T6_MOUNT_SIEGE_BALLISTA.png',
      desc: '1 T6 Transport Ox + 20 Bars/Leather/Planks + 500 Siphoned Energy',
    },
  ],
  T5_FARM_COUGAR_GROWN: [
    {
      id: 'mount_rageclaw',
      name: 'Rageclaw',
      icon: 'T8_MOUNT_COUGAR_KEEPER.png',
      desc: '1 Swiftclaw + Remnant of the Old Beast (Keeper Artifact)',
    },
  ],
  T8_FARM_HORSE_GROWN: [
    {
      id: 'mount_spectral_bonehorse',
      name: 'Spectral Bonehorse',
      icon: 'T8_MOUNT_HORSE_UNDEAD.png',
      desc: "1 Elder's Riding Horse + Spectral Mask (Undead Artifact)",
    },
    {
      id: 'mount_morgana_nightmare',
      name: 'Morgana Nightmare',
      icon: 'T8_MOUNT_ARMORED_HORSE_MORGANA.png',
      desc: "1 Elder's Armored Horse + Morgana's Heart (Demon Artifact)",
    },
  ],
};

export default function FarmingCalculator({
  server,
  hasPremium,
  useFocus: globalFocus,
  setUseFocus: setGlobalFocus,
  onOpenGuide,
  onStartTour,
  onNavigateTab,
}) {
  // Navigation & Filtering
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [catalogViewMode, setCatalogViewMode] = useState('grown'); // 'grown' (Adults) | 'baby' (Babies & Seeds)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('T3_WHEAT');

  // Homestead Setup
  const [plots, setPlots] = useState(1);
  const [selectedCity, setSelectedCity] = useState('Martlock');
  const [useFocus, setUseFocus] = useState(globalFocus || false);

  useEffect(() => {
    if (globalFocus !== undefined) {
      setUseFocus(globalFocus);
    }
  }, [globalFocus]);

  const handleToggleFocus = () => {
    const next = !useFocus;
    setUseFocus(next);
    if (setGlobalFocus) setGlobalFocus(next);
  };

  // Animal Action: 'produce' (milk/eggs), 'slaughter' (meat), or 'sell_grown' (adult animal)
  const [animalAction, setAnimalAction] = useState('produce');
  // Mount Action: 'grown' (sell grown animal) or 'saddled' (craft into riding mount)
  const [mountAction, setMountAction] = useState('grown');
  const [useFavoriteFood, setUseFavoriteFood] = useState(true);

  // Market & Prices initialized with authoritative Albion Online baseline
  const [marketPrices, setMarketPrices] = useState(() => ({ ...DEFAULT_FARMING_PRICES }));
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
    if (selectedTier !== 'all' && availableTiers.length > 0 && !availableTiers.includes(selectedTier)) {
      setSelectedTier('all');
    }
  }, [availableTiers, selectedTier]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return FARMING_ITEMS.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const isSearching = searchQuery.trim().length > 0;
      const matchesTier = isSearching || selectedTier === 'all' || !selectedTier || item.tier === selectedTier;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !isSearching ||
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.mountName && item.mountName.toLowerCase().includes(q)) ||
        (item.babyName && item.babyName.toLowerCase().includes(q));
      return matchesCat && matchesTier && matchesSearch;
    });
  }, [selectedCategory, selectedTier, searchQuery]);

  // Ensure selected item matches filter
  useEffect(() => {
    if (filteredItems.length > 0 && !filteredItems.some((i) => i.id === selectedItemId)) {
      setSelectedItemId(filteredItems[0].id);
    }
  }, [filteredItems, selectedItemId]);

  // Helper to read current price for key or baseline default
  const getPriceVal = (key, fallback = 0) => {
    if (!key) return fallback;
    if (marketPrices[key] !== undefined && marketPrices[key] !== null) {
      return marketPrices[key];
    }
    return DEFAULT_FARMING_PRICES[key] !== undefined ? DEFAULT_FARMING_PRICES[key] : fallback;
  };

  const setPriceVal = (key, val) => {
    setMarketPrices((prev) => ({ ...prev, [key]: val }));
  };

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
      mountAction,
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
    mountAction,
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
      mount_action: mountAction,
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
    mountAction,
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

    if (currentItem.category === 'mount') {
      const isOx = Boolean(currentItem.subcategory === 'ox' || currentItem.id.includes('OX'));
      const matId = isOx ? `T${currentItem.tier || 3}_PLANKS` : `T${currentItem.tier || 3}_LEATHER`;
      relatedIds.push(matId);
    }

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

  // Mount material helper
  const isOxMount = Boolean(currentItem.category === 'mount' && (currentItem.subcategory === 'ox' || currentItem.id.includes('OX')));
  const mountMaterialId = isOxMount ? `T${currentItem.tier || 3}_PLANKS` : `T${currentItem.tier || 3}_LEATHER`;
  const mountMaterialName = isOxMount ? `T${currentItem.tier} Planks (20x)` : `T${currentItem.tier} Leather (20x)`;

  // Carnivore diet helper
  const isCarnivoreMount = Boolean(
    currentItem.category === 'mount' &&
    (currentItem.id.includes('COUGAR') || currentItem.id.includes('DIREWOLF') || currentItem.id.includes('DIREBEAR'))
  );
  const mountFeedId = isCarnivoreMount ? 'T3_MEAT' : 'T3_WHEAT';
  const mountFeedName = isCarnivoreMount ? 'Raw Meat' : 'Sheaf of Wheat';

  const isMilkingMode = currentItem.category === 'animal' && animalAction === 'produce';

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
                Island crop fields, alchemical herb gardens, livestock pastures, animal breeding &amp; mount kennels.
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

      {/* Battle Mounts & War Mounts Forge Banner */}
      {(selectedCategory === 'mount' || selectedCategory === 'all') && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/70 via-[#0a0e1a] to-amber-950/50 border border-purple-500/50 flex flex-wrap items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#070b14] border border-purple-400/60 flex items-center justify-center text-xl shadow-inner shrink-0">
              ⚔️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-serif font-black text-amber-200 uppercase tracking-wide">
                  Battle Mounts &amp; War Mount Upgrades
                </span>
                <span className="text-[9px] font-mono font-bold px-2 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Energy Manipulator &amp; Saddler
                </span>
              </div>
              <p className="text-[11px] font-sans text-slate-300 mt-0.5">
                Flame Basilisk, Venom Basilisk, Avalonian Basilisk, Siege Ballista, Elder's Command Mammoth, Spectral Bonehorse, Rageclaw &amp; Morgana Nightmares.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab ? onNavigateTab('crafting', { category: 'mounts' }) : null}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-amber-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-slate-950 font-serif font-black text-xs shadow-gold-glow flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <span>Open War Mount Forge</span>
            <span className="text-sm font-bold">&rarr;</span>
          </button>
        </div>
      )}

      {/* 3. Tier & Search Bar */}
      <div className="forged-tablet p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-mono text-slate-400 mr-1 uppercase tracking-wider">Tier:</span>
          <button
            type="button"
            onClick={() => setSelectedTier('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
              selectedTier === 'all'
                ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(212,163,75,0.4)]'
                : 'bg-[#060a12] border-[#1a2436] text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            All
          </button>
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
            placeholder="Search crop, herb, animal, baby, mount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#060a12] border border-[#1a2436] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 font-sans"
          />
        </div>
      </div>

      {/* 4. Agriculture Catalog Grid */}
      <div id="tour-farm-item-picker" className="space-y-2">
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 font-mono gap-2">
          <span>Available Plants &amp; Livestock ({filteredItems.length})</span>
          <div className="flex items-center gap-1 bg-[#060a12] p-1 rounded-xl border border-[#1a2436]">
            <button
              type="button"
              onClick={() => setCatalogViewMode('grown')}
              className={`px-3 py-1 rounded-lg text-xs font-serif font-bold transition-all cursor-pointer ${
                catalogViewMode === 'grown'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🐾 Adult Animals &amp; Crops
            </button>
            <button
              type="button"
              onClick={() => setCatalogViewMode('baby')}
              className={`px-3 py-1 rounded-lg text-xs font-serif font-bold transition-all cursor-pointer ${
                catalogViewMode === 'baby'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🐣 Baby Animals, Eggs &amp; Seeds
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-72 overflow-y-auto p-1 scrollbar-thin">
          {filteredItems.map((item) => {
            const isSelected = item.id === selectedItemId;
            const isBonus = item.bonusCity && item.bonusCity.toLowerCase() === selectedCity.toLowerCase();
            const displayIcon = catalogViewMode === 'baby'
              ? (item.babyIcon || item.seedIcon || item.icon)
              : item.icon;
            const displayName = catalogViewMode === 'baby'
              ? (item.babyName || item.seedName || item.name)
              : item.name;

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
                    src={`/items/${displayIcon}`}
                    alt={displayName}
                    className="w-full h-full object-contain filter drop-shadow-md"
                    loading="lazy"
                  />
                  {isBonus && (
                    <span className="absolute top-1 right-1 px-1.5 py-0.2 text-[9px] font-mono bg-gradient-to-r from-emerald-400 to-emerald-600 text-slate-950 rounded font-black shadow">
                      +10%
                    </span>
                  )}

                  {/* Complementary corner avatar: In adult view show baby in corner; in baby view show adult in corner */}
                  {catalogViewMode === 'grown' && item.babyIcon && (
                    <div className="absolute bottom-0.5 left-0.5 w-5 h-5 rounded bg-[#03060a]/90 border border-amber-500/40 p-0.5 shadow-md" title={`Baby: ${item.babyName}`}>
                      <ItemIcon src={`/items/${item.babyIcon}`} alt={item.babyName} />
                    </div>
                  )}
                  {catalogViewMode === 'baby' && (
                    <div className="absolute bottom-0.5 left-0.5 w-5 h-5 rounded bg-[#03060a]/90 border border-slate-700 p-0.5 shadow-md" title={`Grown: ${item.name}`}>
                      <ItemIcon src={`/items/${item.icon}`} alt={item.name} />
                    </div>
                  )}
                </div>

                <div className="mt-2.5 w-full">
                  <div className="text-xs font-serif font-bold text-slate-200 truncate group-hover:text-amber-200">
                    {displayName}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                    {catalogViewMode === 'baby'
                      ? `Grows into ${item.name}`
                      : (item.babyName ? `🐣 ${item.babyName}` : `🌱 ${item.seedName}`)}
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
                    src={`/items/${currentItem.category === 'mount' && mountAction === 'saddled' && currentItem.mountId ? `${currentItem.mountId}.png` : currentItem.icon}`}
                    alt={currentItem.category === 'mount' && mountAction === 'saddled' ? (currentItem.mountName || currentItem.name) : currentItem.name}
                    className="w-full h-full object-contain filter drop-shadow-xl"
                  />
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded text-[10px] font-serif font-black bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 shadow">
                    T{currentItem.tier}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-serif font-black text-amber-200">
                      {currentItem.category === 'mount' && mountAction === 'saddled' ? (currentItem.mountName || currentItem.name) : currentItem.name}
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
                    <span className="font-mono text-slate-300 bg-[#060a12] px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{calc?.growthHours || 22}h Cycle ({calc?.cycleDays || 1}d)</span>
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
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  {calc?.yield?.outputName || currentItem.name}
                </div>
              </div>
            </div>

            {/* Husbandry Life Cycle Progression Strip */}
            {(currentItem.category === 'animal' || currentItem.category === 'mount') && (
              <div className="pt-3 border-t border-[#1e2a3c]/80">
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold mb-2 flex items-center gap-1.5">
                  <span>Growth Life Cycle &amp; Progression</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {/* Step 1: Baby */}
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-[#05080e] border border-amber-500/40 shadow-inner">
                    <div className="w-9 h-9 rounded-lg bg-[#03060a] p-1 border border-amber-400/50 shrink-0">
                      <ItemIcon src={`/items/${currentItem.babyIcon}`} alt={currentItem.babyName} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono text-amber-400 uppercase tracking-wider block font-bold truncate">1. Offspring / Baby</span>
                      <span className="text-xs font-serif font-bold text-slate-100 truncate block">{currentItem.babyName}</span>
                    </div>
                  </div>

                  {/* Step 2: Growth */}
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-[#05080e] border border-slate-700 shadow-inner">
                    <div className="w-9 h-9 rounded-lg bg-[#03060a] p-1 border border-slate-700 shrink-0 flex items-center justify-center text-amber-400 font-bold text-xs font-mono">
                      {calc?.growthHours || 22}h
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold truncate">2. Kennel Feeding</span>
                      <span className="text-xs font-serif font-bold text-slate-200 truncate block">{calc?.cycleDays || 1} Albion Days</span>
                    </div>
                  </div>

                  {/* Step 3: Adult / Mount */}
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-[#05080e] border border-emerald-500/40 shadow-inner">
                    <div className="w-9 h-9 rounded-lg bg-[#03060a] p-1 border border-emerald-400/50 shrink-0">
                      <ItemIcon
                        src={`/items/${mountAction === 'saddled' && currentItem.mountId ? `${currentItem.mountId}.png` : currentItem.icon}`}
                        alt={mountAction === 'saddled' ? currentItem.mountName : currentItem.name}
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider block font-bold truncate">
                        {mountAction === 'saddled' ? '3. Saddled Mount' : '3. Adult Animal'}
                      </span>
                      <span className="text-xs font-serif font-bold text-emerald-200 truncate block">
                        {mountAction === 'saddled' ? (currentItem.mountName || 'Saddled Mount') : currentItem.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* War Mount & Battle Mount Upgrade Path */}
            {BATTLE_MOUNT_UPGRADES[currentItem.id] && (
              <div className="pt-3 border-t border-[#1e2a3c]/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-serif font-bold text-purple-200">
                    <span className="text-base">⚔️</span>
                    <span>War Mount Upgrades for {currentItem.name}</span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                    Battle Mount Recipes
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {BATTLE_MOUNT_UPGRADES[currentItem.id].map((bm) => (
                    <div key={bm.id} className="p-2.5 rounded-xl bg-[#05080e] border border-purple-500/30 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-[#03060a] border border-purple-400/50 p-1 shrink-0">
                          <ItemIcon src={`/items/${bm.icon}`} alt={bm.name} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-serif font-bold text-amber-200 truncate">{bm.name}</div>
                          <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{bm.desc}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigateTab ? onNavigateTab('crafting', { category: 'mounts', itemId: bm.id }) : null}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-amber-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-slate-950 font-serif font-black text-xs shrink-0 shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <span>Craft in War Mount Forge</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

            {/* Livestock Pasture Objective Toggles */}
            {currentItem.category === 'animal' && (
              <div className="pt-3 border-t border-[#1e2a3c] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={!currentItem.productId}
                    onClick={() => setAnimalAction('produce')}
                    className={`py-2 px-3 rounded-xl text-xs font-serif font-bold transition-all border cursor-pointer ${
                      animalAction === 'produce' && currentItem.productId
                        ? 'bg-amber-600/30 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(212,163,75,0.2)]'
                        : 'bg-[#05080e] border-[#1a2436] text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                  >
                    🥛 Daily Produce ({currentItem.productName || 'N/A'})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnimalAction('slaughter')}
                    className={`py-2 px-3 rounded-xl text-xs font-serif font-bold transition-all border cursor-pointer ${
                      animalAction === 'slaughter' || !currentItem.productId
                        ? 'bg-rose-600/30 border-rose-400 text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                        : 'bg-[#05080e] border-[#1a2436] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🔪 Slaughter ({currentItem.meatName})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnimalAction('sell_grown')}
                    className={`py-2 px-3 rounded-xl text-xs font-serif font-bold transition-all border cursor-pointer ${
                      animalAction === 'sell_grown'
                        ? 'bg-sky-600/30 border-sky-400 text-sky-200 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                        : 'bg-[#05080e] border-[#1a2436] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🐂 Sell Adults ({currentItem.name})
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#05080e] border border-[#1a2436] shadow-inner">
                  <div>
                    <div className="text-xs font-serif font-bold text-slate-200">Favorite Food Feeding</div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {currentItem.favoriteFoodName} (Consumes 5 per spot instead of 10)
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

            {/* Mount Kennel Objective Toggles */}
            {currentItem.category === 'mount' && (
              <div className="pt-3 border-t border-[#1e2a3c] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMountAction('grown')}
                    className={`py-2 px-3 rounded-xl text-xs font-serif font-bold transition-all border cursor-pointer ${
                      mountAction === 'grown'
                        ? 'bg-amber-600/30 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(212,163,75,0.2)]'
                        : 'bg-[#05080e] border-[#1a2436] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🐴 Sell Grown Animal ({currentItem.name})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMountAction('saddled')}
                    className={`py-2 px-3 rounded-xl text-xs font-serif font-bold transition-all border cursor-pointer ${
                      mountAction === 'saddled'
                        ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-[#05080e] border-[#1a2436] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ⚔️ Saddle Riding Mount ({currentItem.mountName || 'Saddled Mount'})
                  </button>
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
                  {currentItem.category === 'crop' || currentItem.category === 'herb'
                    ? `${currentItem.name} Harvest Price`
                    : currentItem.category === 'animal' && isMilkingMode
                    ? `${currentItem.productName} Sell Price`
                    : currentItem.category === 'animal' && animalAction === 'slaughter'
                    ? `${currentItem.meatName} Sell Price`
                    : currentItem.category === 'animal'
                    ? `${currentItem.name} (Adult) Price`
                    : mountAction === 'saddled'
                    ? `${currentItem.mountName} Sell Price`
                    : `${currentItem.name} (Grown) Price`}
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#04060a] border border-amber-500/40 p-1 shrink-0 flex items-center justify-center shadow-inner">
                    <ItemIcon
                      src={`/items/${
                        currentItem.category === 'crop' || currentItem.category === 'herb'
                          ? currentItem.icon
                          : currentItem.category === 'animal' && isMilkingMode
                          ? currentItem.productIcon
                          : currentItem.category === 'animal' && animalAction === 'slaughter'
                          ? currentItem.meatIcon
                          : currentItem.category === 'animal'
                          ? currentItem.icon
                          : mountAction === 'saddled' && currentItem.mountId
                          ? `${currentItem.mountId}.png`
                          : currentItem.icon
                      }`}
                      alt={currentItem.name}
                    />
                  </div>
                  <div className="relative flex-1">
                    <NumberInput
                      type="number"
                      min="0"
                      value={
                        currentItem.category === 'crop' || currentItem.category === 'herb'
                          ? getPriceVal(currentItem.id, 350)
                          : currentItem.category === 'animal' && isMilkingMode
                          ? getPriceVal(currentItem.productId, 310)
                          : currentItem.category === 'animal' && animalAction === 'slaughter'
                          ? getPriceVal(currentItem.meatId, 190)
                          : currentItem.category === 'animal'
                          ? getPriceVal(currentItem.id, 10000)
                          : mountAction === 'saddled'
                          ? getPriceVal(currentItem.mountId, 45000)
                          : getPriceVal(currentItem.id, 28000)
                      }
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        const key =
                          currentItem.category === 'crop' || currentItem.category === 'herb'
                            ? currentItem.id
                            : currentItem.category === 'animal' && isMilkingMode
                            ? currentItem.productId
                            : currentItem.category === 'animal' && animalAction === 'slaughter'
                            ? currentItem.meatId
                            : currentItem.category === 'animal'
                            ? currentItem.id
                            : mountAction === 'saddled'
                            ? currentItem.mountId
                            : currentItem.id;
                        setPriceVal(key, val);
                      }}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#05080e] border border-[#1a2436] text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-500/80 shadow-inner"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">silver</span>
                  </div>
                </div>
              </div>

              {/* Seed / Baby Buy Price OR Milking Feed Price */}
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  {currentItem.category === 'crop' || currentItem.category === 'herb'
                    ? `${currentItem.seedName} Buy Price`
                    : isMilkingMode
                    ? `${currentItem.favoriteFoodName} Feed Price`
                    : `${currentItem.babyName} Buy Price`}
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#04060a] border border-amber-500/40 p-1 shrink-0 flex items-center justify-center shadow-inner">
                    <ItemIcon
                      src={`/items/${
                        currentItem.category === 'crop' || currentItem.category === 'herb'
                          ? currentItem.seedIcon
                          : isMilkingMode
                          ? `${currentItem.favoriteFood}.png`
                          : currentItem.babyIcon
                      }`}
                      alt={currentItem.babyName || currentItem.seedName}
                    />
                  </div>
                  <div className="relative flex-1">
                    <NumberInput
                      type="number"
                      min="0"
                      value={
                        currentItem.category === 'crop' || currentItem.category === 'herb'
                          ? getPriceVal(currentItem.seedId, 2000)
                          : isMilkingMode
                          ? getPriceVal(currentItem.favoriteFood, 350)
                          : getPriceVal(currentItem.babyId, 5000)
                      }
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        const key =
                          currentItem.category === 'crop' || currentItem.category === 'herb'
                            ? currentItem.seedId
                            : isMilkingMode
                            ? currentItem.favoriteFood
                            : currentItem.babyId;
                        setPriceVal(key, val);
                      }}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#05080e] border border-[#1a2436] text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-500/80 shadow-inner"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">silver</span>
                  </div>
                </div>
              </div>

              {/* Animal Breeding Feed Price */}
              {currentItem.category === 'animal' && !isMilkingMode && (
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    Feed Crop Price ({currentItem.favoriteFoodName})
                  </label>
                  <div className="relative">
                    <NumberInput
                      type="number"
                      min="0"
                      value={getPriceVal(currentItem.favoriteFood, 350)}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setPriceVal(currentItem.favoriteFood, val);
                      }}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#05080e] border border-[#1a2436] text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-500/80 shadow-inner"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">silver</span>
                  </div>
                </div>
              )}

              {/* Mount Feed Price */}
              {currentItem.category === 'mount' && (
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    Feed Unit Price ({mountFeedName})
                  </label>
                  <div className="relative">
                    <NumberInput
                      type="number"
                      min="0"
                      value={getPriceVal(mountFeedId, isCarnivoreMount ? 190 : 350)}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setPriceVal(mountFeedId, val);
                      }}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#05080e] border border-[#1a2436] text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-500/80 shadow-inner"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">silver</span>
                  </div>
                </div>
              )}

              {/* Mount Saddling Material Price */}
              {currentItem.category === 'mount' && mountAction === 'saddled' && (
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    Saddling Material ({mountMaterialName})
                  </label>
                  <div className="relative">
                    <NumberInput
                      type="number"
                      min="0"
                      value={getPriceVal(mountMaterialId, 850)}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setPriceVal(mountMaterialId, val);
                      }}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#05080e] border border-[#1a2436] text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-500/80 shadow-inner"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">silver</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Destiny Board Focus & Mastery Simulator */}
          <div id="tour-farm-focus-watering" className="forged-tablet p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2a3c]">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-amber-200">
                <Droplets className="w-4 h-4 text-sky-400" />
                <span>Destiny Board Watering / Nurture Focus</span>
              </div>
              {!isMilkingMode ? (
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
              ) : (
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  Not Consumed in Milking
                </span>
              )}
            </div>

            {isMilkingMode ? (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200/90 font-sans leading-relaxed">
                🥛 <strong>Permanent Pasture Livestock:</strong> Adult milk and egg animals remain indefinitely in your pastures. Recurring daily feed generates milk or eggs with <strong>zero baby repurchases</strong>. Focus is not consumed for daily milking.
              </div>
            ) : (
              <>
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
              </>
            )}
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

            {/* Daily Focus Pool Cap Warning */}
            {useFocus && !isMilkingMode && calc?.focus?.totalFocusNeeded > 0 && focusPool && (
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
                {calc?.cycleDays > 1 ? `Full Cycle Net Silver (${calc?.growthHours}h / ${calc?.cycleDays}d)` : `Daily Net Silver Profit (${plots} Plots)`}
              </div>
              <div className={`text-3xl font-mono font-black mt-1 drop-shadow-md ${
                (calc?.finances?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {(calc?.finances?.netProfit || 0).toLocaleString()}
                <span className="text-xs font-serif text-slate-400 ml-1.5 font-normal">
                  {calc?.cycleDays > 1 ? 'silver / cycle' : 'silver / day'}
                </span>
              </div>

              {calc?.cycleDays > 1 && (
                <div className="mt-2 text-xs font-mono text-amber-300 font-bold bg-[#070b14] py-1 px-3 rounded-lg border border-amber-900/40 inline-block">
                  ⚡ Daily Equivalent: {(calc?.finances?.dailyProfit || 0).toLocaleString()} silver / day
                </div>
              )}

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

              {calc?.finances?.seedExpense > 0 && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#05080e] border border-[#1a2436]">
                  <span className="text-slate-400">Replant Seed Deficit</span>
                  <span className="text-rose-400 font-bold">
                    -{calc.finances.seedExpense.toLocaleString()} s
                  </span>
                </div>
              )}

              {calc?.finances?.babyExpense > 0 && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#05080e] border border-[#1a2436]">
                  <span className="text-slate-400">Offspring Deficit To Buy</span>
                  <span className="text-rose-400 font-bold">
                    -{calc.finances.babyExpense.toLocaleString()} s
                  </span>
                </div>
              )}

              {calc?.finances?.feedExpense > 0 && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#05080e] border border-[#1a2436]">
                  <span className="text-slate-400">
                    Animal Feed Expense ({calc?.yield?.feedUnits || 0} units)
                  </span>
                  <span className="text-rose-400 font-bold">
                    -{calc.finances.feedExpense.toLocaleString()} s
                  </span>
                </div>
              )}

              {calc?.finances?.saddlingExpense > 0 && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#05080e] border border-[#1a2436]">
                  <span className="text-slate-400">Saddling Material Expense</span>
                  <span className="text-rose-400 font-bold">
                    -{calc.finances.saddlingExpense.toLocaleString()} s
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
