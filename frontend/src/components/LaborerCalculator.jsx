import React, { useState, useMemo, useEffect } from 'react';
import {
  LABORERS,
  PROFESSIONS,
  HOUSE_TIERS,
  LABORER_TYPES,
  computeLaborers,
} from '../utils/laborerMath';
import { CITIES } from '../utils/albionMath';
import { calculateLaborerApi, fetchLaborerPricesApi } from '../services/api';
import ItemIcon from './ItemIcon';
import {
  Users,
  Home,
  Hammer,
  Pickaxe,
  Coins,
  TrendingUp,
  RefreshCw,
  Search,
  CheckCircle2,
  Smile,
  Bed,
  Trophy,
  Building,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

export default function LaborerCalculator({ server, hasPremium, onOpenGuide, onStartTour }) {
  // Navigation & Filtering
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTier, setSelectedTier] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLaborerId, setSelectedLaborerId] = useState('blacksmith_t5');

  // Estate Parameters
  const [laborerCount, setLaborerCount] = useState(3);
  const [houseTier, setHouseTier] = useState(5);
  const [selectedCity, setSelectedCity] = useState('Martlock');

  // Furniture & Happiness
  const [hasBed, setHasBed] = useState(true);
  const [hasTable, setHasTable] = useState(true);
  const [trophiesCount, setTrophiesCount] = useState(3);

  // Market & Economics
  const [marketPrices, setMarketPrices] = useState({
    T5_JOURNAL_WARRIOR_FULL: 24500,
    T5_JOURNAL_WARRIOR_EMPTY: 4800,
    T5_METALBAR: 1250,
    T5_PLANKS: 1180,
    T5_LEATHER: 1300,
    T5_CLOTH: 1220,
    T5_JOURNAL_MERCENARY_FULL: 12000,
    T5_JOURNAL_MERCENARY_EMPTY: 2200,
  });
  const [isSellOrder, setIsSellOrder] = useState(true);

  // Price Fetch State
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [priceStatus, setPriceStatus] = useState('');

  // Authoritative Backend Calculation State
  const [backendCalculation, setBackendCalculation] = useState(null);
  const [isBackendCalculating, setIsBackendCalculating] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  // Active laborer definition
  const currentItem = useMemo(() => {
    return LABORERS.find((l) => l.id === selectedLaborerId) || LABORERS[0];
  }, [selectedLaborerId]);

  // Keep house tier at least equal to laborer tier by default
  useEffect(() => {
    if (currentItem && houseTier < currentItem.tier) {
      setHouseTier(currentItem.tier);
    }
  }, [currentItem, houseTier]);

  // Filtered Laborers
  const filteredLaborers = useMemo(() => {
    return LABORERS.filter((l) => {
      const matchesType = selectedType === 'all' || l.type === selectedType;
      const matchesTier = !selectedTier || l.tier === selectedTier;
      const matchesSearch =
        !searchQuery ||
        l.professionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.fullJournalName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesTier && matchesSearch;
    });
  }, [selectedType, selectedTier, searchQuery]);

  // Sync selected laborer if filtered out
  useEffect(() => {
    if (filteredLaborers.length > 0 && !filteredLaborers.some((l) => l.id === selectedLaborerId)) {
      setSelectedLaborerId(filteredLaborers[0].id);
    }
  }, [filteredLaborers, selectedLaborerId]);

  // Fast Client-Side Calculation Fallback
  const localCalculation = useMemo(() => {
    return computeLaborers({
      laborerId: selectedLaborerId,
      houseTier,
      laborerCount,
      hasBed,
      hasTable,
      trophiesCount,
      hasPremium,
      isSellOrder,
      marketPrices,
    });
  }, [
    selectedLaborerId,
    houseTier,
    laborerCount,
    hasBed,
    hasTable,
    trophiesCount,
    hasPremium,
    isSellOrder,
    marketPrices,
  ]);

  // Query Authoritative Django Backend
  useEffect(() => {
    let isCancelled = false;
    setIsBackendCalculating(true);

    const payload = {
      laborer_id: selectedLaborerId,
      house_tier: houseTier,
      laborer_count: laborerCount,
      has_bed: hasBed,
      has_table: hasTable,
      trophies_count: trophiesCount,
      has_premium: hasPremium,
      is_sell_order: isSellOrder,
      market_prices: marketPrices,
    };

    calculateLaborerApi(payload)
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
    selectedLaborerId,
    houseTier,
    laborerCount,
    hasBed,
    hasTable,
    trophiesCount,
    hasPremium,
    isSellOrder,
    marketPrices,
  ]);

  const calc = backendCalculation || localCalculation;

  // Live Price Fetch from AODP
  const handleFetchPrices = async () => {
    setLoadingPrices(true);
    setPriceStatus(`Contacting AODP (${server.toUpperCase()})...`);

    const matIds = (currentItem.returns || []).map((r) => r.item).filter((i) => i !== 'SILVER');

    try {
      const res = await fetchLaborerPricesApi({
        full_journal_id: currentItem.fullJournalId,
        empty_journal_id: currentItem.emptyJournalId,
        material_ids: matIds,
        server,
        city: selectedCity,
      });

      if (res && res.prices) {
        let updated = 0;
        const newPrices = { ...marketPrices };
        Object.entries(res.prices).forEach(([id, rec]) => {
          if (rec && rec.sell_min > 0) {
            newPrices[id] = rec.sell_min;
            updated++;
          }
        });
        setMarketPrices(newPrices);
        setPriceStatus(updated > 0 ? `Updated ${updated} prices from ${selectedCity}` : `No active sell orders found in ${selectedCity}`);
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
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-900/40 bg-gradient-to-r from-[#17120a] via-[#1f1911] to-[#121824] p-5 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-700/40 to-yellow-900/60 border border-amber-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Users className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-black text-amber-200 tracking-wide">
                  The Guild Hall & Laborer Quarters
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Laborers & Journals
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculate daily returns, 150% happiness furniture requirements, empty/full journal arbitrage, and house ROI.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenGuide && onOpenGuide('laborers')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/40 text-xs font-serif font-bold text-purple-300 hover:bg-purple-500/25 transition-all shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>Laborers Guide</span>
            </button>

            <button
              type="button"
              onClick={() => onStartTour && onStartTour('laborers')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-purple-500/40 text-xs font-serif font-bold text-purple-200 hover:bg-purple-500/20 transition-all shadow-sm"
            >
              <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
              <span>Interactive Tour</span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0f0c08] border border-amber-700/40 text-xs shadow-inner">
              <Home className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Housing Setup</div>
                <div className="font-serif font-bold text-amber-300">
                  Tier {houseTier} House &bull; {calc?.housesNeeded || 1} Needed
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
            <span>Server: {server.toUpperCase()} &bull; 22h laborer cycle</span>
          </div>
        )}
      </div>

      {/* 2. Profession Category Bar */}
      <div id="tour-laborer-prof-picker" className="flex flex-wrap items-center gap-2 border-b border-albion-border/80 pb-3">
        {LABORER_TYPES.map((type) => {
          const isSelected = selectedType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedType(type.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-serif font-bold transition-all ${
                isSelected
                  ? 'bg-amber-950/50 border border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-albion-card/60 border border-albion-border text-slate-400 hover:text-slate-200 hover:bg-albion-surface'
              }`}
            >
              <span>{type.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tier & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-albion-card p-3 rounded-xl border border-albion-border shadow-md">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-mono text-slate-400 mr-1 uppercase">Tier:</span>
          {[2, 3, 4, 5, 6, 7, 8].map((t) => (
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
            placeholder="Search Blacksmith, Lumberjack, Mercenary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-albion-surface border border-albion-border text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-serif"
          />
        </div>
      </div>

      {/* 4. Laborer Catalog Browser */}
      <div id="tour-laborer-journal-tier" className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
          <span>Available Laborer Journals ({filteredLaborers.length})</span>
          <span>Click profession to assign to quarters</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-72 overflow-y-auto p-1 scrollbar-thin">
          {filteredLaborers.map((item) => {
            const isSelected = item.id === selectedLaborerId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedLaborerId(item.id)}
                className={`relative group flex flex-col items-center text-center p-3 rounded-xl transition-all border text-left ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/60'
                    : 'bg-albion-card border-albion-border hover:border-slate-600 hover:bg-albion-surface/60'
                }`}
              >
                <div className="w-16 h-16 rounded-lg bg-slate-950/80 border border-slate-800 p-1 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform">
                  <ItemIcon
                    src={`/items/${item.fullIcon}`}
                    alt={item.professionName}
                    className="w-full h-full object-contain filter drop-shadow-md"
                    loading="lazy"
                  />
                  <span className="absolute top-0.5 right-0.5 px-1 text-[8px] font-mono bg-amber-500 text-slate-950 rounded font-bold shadow">
                    T{item.tier}
                  </span>
                </div>

                <div className="mt-2 w-full">
                  <div className="text-xs font-serif font-bold text-slate-200 truncate group-hover:text-amber-300">
                    {item.professionName}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {item.type}
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
          {/* Active Laborer Spotlight */}
          <div className="rounded-2xl border border-amber-700/40 bg-albion-card p-5 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-xl bg-slate-950 border-2 border-amber-500/60 p-1 flex items-center justify-center shadow-lg">
                  <ItemIcon
                    src={`/items/${currentItem.fullIcon}`}
                    alt={currentItem.professionName}
                    className="w-full h-full object-contain filter drop-shadow-xl"
                  />
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded text-[10px] font-serif font-black bg-amber-500 text-slate-950 shadow">
                    T{currentItem.tier}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-serif font-black text-amber-200">
                      {currentItem.professionName}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {currentItem.fullJournalName}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    {currentItem.desc}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                    <span className="font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                      Fame to Fill: {currentItem.fameRequired.toLocaleString()}
                    </span>
                    <span className="font-mono text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800/40">
                      Base Yield (100%): {currentItem.baseYield100} units
                    </span>
                    <span className="font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                      Max Yield (150%): {currentItem.maxYield150} units
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-amber-500/40 text-right">
                <div className="text-[10px] font-mono uppercase text-slate-400">Yield Multiplier</div>
                <div className="text-xl font-mono font-black text-amber-300">
                  {calc?.happiness?.yieldMultiplier || 1.0}x
                  <span className="text-xs text-slate-400 ml-1 font-serif">returns</span>
                </div>
              </div>
            </div>
          </div>

          {/* House Setup & Furniture Controls */}
          <div id="tour-laborer-house-config" className="rounded-2xl border border-albion-border bg-albion-card p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-albion-border/80">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-slate-200">
                <Home className="w-4 h-4 text-amber-400" />
                <span>House Setup & Quarters</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {laborerCount} Laborers &bull; {calc?.housesNeeded || 1} House(s) Needed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Laborer Count ({laborerCount})
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={laborerCount}
                    onChange={(e) => setLaborerCount(parseInt(e.target.value) || 1)}
                    className="w-full accent-amber-500"
                  />
                  <span className="font-mono text-xs text-amber-300 font-bold px-2 py-1 bg-albion-surface rounded border border-albion-border min-w-[36px] text-center">
                    {laborerCount}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">House Tier</label>
                <select
                  value={houseTier}
                  onChange={(e) => setHouseTier(parseInt(e.target.value) || currentItem.tier)}
                  className="w-full px-3 py-2 rounded-lg bg-albion-surface border border-albion-border text-xs text-slate-100 font-serif focus:outline-none focus:border-amber-500"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((t) => (
                    <option key={t} value={t}>
                      Tier {t} House {t >= 4 ? '(3 laborers/house)' : t === 3 ? '(2 laborers/house)' : '(1 laborer)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Island City</label>
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

            {/* Furniture & Happiness Controls */}
            <div id="tour-laborer-furniture-config" className="pt-3 border-t border-albion-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-bold text-slate-300 flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-emerald-400" />
                  Happiness & Furniture Configuration
                </span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  (calc?.happiness?.happinessPct || 100) >= 140
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {calc?.happiness?.happinessPct || 100}% Happiness
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-albion-surface border border-albion-border">
                  <div className="flex items-center gap-2">
                    <Bed className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-xs font-serif font-bold text-slate-200">Proper Beds</div>
                      <div className="text-[10px] font-mono text-slate-400">Tier &ge; {currentItem.tier}</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasBed}
                    onChange={(e) => setHasBed(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-albion-surface border border-albion-border">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-xs font-serif font-bold text-slate-200">Proper Tables</div>
                      <div className="text-[10px] font-mono text-slate-400">Tier &ge; {currentItem.tier}</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasTable}
                    onChange={(e) => setHasTable(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-albion-surface border border-albion-border">
                  <div className="flex items-center justify-between text-xs font-serif font-bold text-slate-200 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      Trophies ({trophiesCount})
                    </span>
                    <span className="text-[10px] font-mono text-amber-400">+{trophiesCount * 5}% Happy</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="7"
                    value={trophiesCount}
                    onChange={(e) => setTrophiesCount(parseInt(e.target.value) || 0)}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Market Unit Prices */}
          <div id="tour-laborer-economics" className="rounded-2xl border border-albion-border bg-albion-card p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-albion-border/80">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-slate-200">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Market Prices ({selectedCity})</span>
              </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Full Journal Buy Price
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={marketPrices[currentItem.fullJournalId] || 0}
                    onChange={(e) => {
                      const val = Math.max(0, parseFloat(e.target.value) || 0);
                      setMarketPrices((prev) => ({ ...prev, [currentItem.fullJournalId]: val }));
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-albion-surface border border-albion-border text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">silver</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Empty Journal Resale Price
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={marketPrices[currentItem.emptyJournalId] || 0}
                    onChange={(e) => {
                      const val = Math.max(0, parseFloat(e.target.value) || 0);
                      setMarketPrices((prev) => ({ ...prev, [currentItem.emptyJournalId]: val }));
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-albion-surface border border-albion-border text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">silver</span>
                </div>
              </div>
            </div>

            {/* Returned Material Prices */}
            {currentItem.type !== 'mercenary' && (
              <div className="pt-3 border-t border-albion-border/60">
                <div className="text-[11px] font-mono text-slate-400 mb-2">Returned Material Market Prices</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(currentItem.returns || []).map((ret) => (
                    <div key={ret.item}>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">
                        {ret.name} Unit Price
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={marketPrices[ret.item] || 0}
                          onChange={(e) => {
                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                            setMarketPrices((prev) => ({ ...prev, [ret.item]: val }));
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-albion-surface border border-albion-border text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">silver</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Financial Ledger & Returns (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Profit Ledger */}
          <div id="tour-laborer-ledger" className="rounded-2xl border border-albion-border bg-albion-card p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-albion-border/80">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-slate-200">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Laborer Economic Ledger</span>
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
                Daily Net Silver Profit ({laborerCount} Laborers)
              </div>
              <div className={`text-2xl font-mono font-black mt-1 ${
                (calc?.finances?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {(calc?.finances?.netProfit || 0).toLocaleString()}
                <span className="text-xs font-serif text-slate-400 ml-1 font-normal">silver / 22h</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs font-mono">
                <div>
                  <div className="text-slate-500 text-[10px]">Net per Laborer</div>
                  <div className="text-slate-200 font-bold">
                    {(calc?.finances?.profitPerLaborer || 0).toLocaleString()} silver
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">30-Day Projection</div>
                  <div className="text-emerald-400 font-bold">
                    {(calc?.finances?.monthlyProjectedNet || 0).toLocaleString()} silver
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Ledger Entries */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-albion-surface">
                <span className="text-slate-400">Full Journal Purchase Cost</span>
                <span className="text-red-400 font-bold">
                  -{(calc?.finances?.journalExpense || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-albion-surface">
                <span className="text-slate-400">Empty Journals Resale</span>
                <span className="text-emerald-400 font-bold">
                  +{(calc?.finances?.emptyJournalRevenue || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-albion-surface">
                <span className="text-slate-400">Returned Materials Gross</span>
                <span className="text-emerald-400 font-bold">
                  +{(calc?.finances?.materialRevenue || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-albion-surface">
                <span className="text-slate-400">Market Tax</span>
                <span className="text-amber-400 font-bold">
                  -{(calc?.finances?.marketTax || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Returned Materials Breakdown */}
          <div className="rounded-2xl border border-albion-border bg-albion-card p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-albion-border/80">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-slate-200">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Returned Resources Breakdown</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Every 22 Hours</span>
            </div>

            <div className="space-y-2">
              {(calc?.materials || []).map((mat) => (
                <div key={mat.item} className="flex items-center justify-between p-2.5 rounded-xl bg-albion-surface border border-albion-border text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-950 p-1 border border-slate-800 flex items-center justify-center">
                      <ItemIcon src={`/items/${mat.icon}`} alt={mat.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="font-serif font-bold text-slate-200">{mat.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {mat.unitsPerLaborer} / laborer &bull; @ {mat.unitPrice.toLocaleString()} silver
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-emerald-300 font-bold">{mat.totalUnits} units</div>
                    <div className="text-[10px] text-slate-400">+{mat.revenue.toLocaleString()} s</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
