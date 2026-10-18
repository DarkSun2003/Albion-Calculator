import React, { useState, useEffect, useMemo } from 'react';
import { 
  Skull, 
  ShieldAlert, 
  TrendingUp, 
  Package, 
  Truck, 
  ArrowRight, 
  Search, 
  RefreshCw, 
  Sliders, 
  Plus, 
  Minus, 
  Trash2, 
  Compass, 
  AlertTriangle, 
  ExternalLink, 
  CheckCircle2, 
  Info,
  DollarSign,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookOpen,
  HelpCircle,
  Clock,
  Zap
} from 'lucide-react';
import { 
  getBlackMarketItemsApi, 
  scanBlackMarketApi, 
  calculateHaulApi 
} from '../services/api';
import { 
  calculateClientHaul, 
  getRecommendedMount, 
  formatSilver 
} from '../utils/blackMarketMath';
import ItemIcon from './ItemIcon';

const TIERS = [
  { level: 4, name: 'T4 Adept', color: 'border-sky-600/80 text-sky-400 bg-sky-950/30' },
  { level: 5, name: 'T5 Expert', color: 'border-red-600/80 text-red-400 bg-red-950/30' },
  { level: 6, name: 'T6 Master', color: 'border-orange-600/80 text-orange-400 bg-orange-950/30' },
  { level: 7, name: 'T7 Grandmaster', color: 'border-yellow-500/80 text-yellow-400 bg-yellow-950/30' },
  { level: 8, name: 'T8 Elder', color: 'border-slate-200/90 text-slate-100 bg-slate-800/40' },
];

const ENCHANTMENTS = [
  { level: 0, label: '.0', name: '.0 Flat' },
  { level: 1, label: '.1', name: '.1 Uncommon' },
  { level: 2, label: '.2', name: '.2 Rare' },
  { level: 3, label: '.3', name: '.3 Exceptional' },
  { level: 4, label: '.4', name: '.4 Pristine' },
];

const CATEGORIES = [
  { id: 'all', label: 'All Equipment' },
  { id: 'warrior', label: 'Warrior (Forgemaster)' },
  { id: 'hunter', label: 'Hunter (Bowyer)' },
  { id: 'mage', label: 'Mage (Arcanist)' },
  { id: 'accessories', label: 'Bags & Capes' },
  { id: 'gathering', label: 'Gathering Garb' },
];

const getItemIcon = (item) => {
  if (!item) return '/items/T4_MAIN_SWORD.png';
  if (item.icon) {
    const base = item.icon.replace(/\.png$/, '').split('@')[0].replace(/_[1-4]$/, '');
    return `/items/${base}.png`;
  }
  if (item.template && item.tier) {
    return `/items/${item.template.replace('{tier}', item.tier)}.png`;
  }
  if (item.aodpId) {
    const base = item.aodpId.split('@')[0].replace(/_[1-4]$/, '');
    return `/items/${base}.png`;
  }
  return '/items/T4_MAIN_SWORD.png';
};

const getEnchantmentBadge = (enchantment) => {
  if (enchantment === 4) return 'bg-amber-500 text-stone-950 shadow-gold-glow';
  if (enchantment === 3) return 'bg-purple-600 text-white';
  if (enchantment === 2) return 'bg-sky-500 text-stone-950';
  if (enchantment === 1) return 'bg-emerald-500 text-stone-950';
  return 'bg-stone-700 text-stone-200';
};

const getEnchantmentBorder = (enchantment) => {
  if (enchantment === 4) return 'border-amber-500/80 shadow-gold-glow';
  if (enchantment === 3) return 'border-purple-500/80';
  if (enchantment === 2) return 'border-sky-500/80';
  if (enchantment === 1) return 'border-emerald-500/80';
  return 'border-stone-700/80';
};

const formatAgeText = (ageHours) => {
  if (ageHours === null || ageHours === undefined || Number.isNaN(Number(ageHours))) return null;
  const hrs = Number(ageHours);
  if (hrs >= 9000) return null;
  if (hrs < 0.04) return 'Updated just now';
  if (hrs < 1.0) {
    const mins = Math.max(1, Math.round(hrs * 60));
    return `Updated ${mins} min${mins === 1 ? '' : 's'} ago`;
  }
  if (hrs < 24.0) {
    const cleanHrs = hrs.toFixed(1).replace(/\.0$/, '');
    return `Updated ${cleanHrs} hr${cleanHrs === '1' ? '' : 's'} ago`;
  }
  const roundedHrs = Math.round(hrs);
  return `Updated ${roundedHrs} hrs ago`;
};

const renderFreshnessBadge = (ageHours, updatedAt, fallbackType = null) => {
  if (fallbackType === 'craft') {
    return (
      <span
        title="No active Royal City market listing found — using estimated crafting material cost in the bonus city."
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-950/90 text-indigo-200 border border-indigo-600/60 cursor-help shrink-0"
      >
        ⚒️ Craft Cost Est.
      </span>
    );
  }

  const label = formatAgeText(ageHours);
  if (!label) {
    return (
      <span
        title="No recent player scan timestamp available"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono text-stone-400 bg-stone-900/90 border border-stone-700 shrink-0"
      >
        🕒 No Recent Scan
      </span>
    );
  }

  const hrs = Number(ageHours);
  const exactTime = updatedAt ? new Date(updatedAt).toLocaleString() : 'Live AODP Server';

  if (hrs <= 1.0) {
    return (
      <span
        title={`Fresh market scan (${label}) • Recorded at ${exactTime}. High confidence!`}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-600/80 cursor-help shrink-0 shadow-sm"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>{label}</span>
      </span>
    );
  }

  if (hrs <= 4.0) {
    return (
      <span
        title={`Moderate scan age (${label}) • Recorded at ${exactTime}. Double-check order volume before hauling large quantities.`}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-600/80 cursor-help shrink-0 shadow-sm"
      >
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span
      title={`Older market scan (${label}) • Recorded at ${exactTime}. High risk that this order has already been filled!`}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-950/90 text-rose-300 border border-rose-600/80 cursor-help shrink-0 shadow-sm"
    >
      <span className="h-2 w-2 rounded-full bg-rose-400" />
      <span>{label}</span>
    </span>
  );
};

export default function BlackMarketCalculator({ server = 'europe', hasPremium = true, onOpenGuide, onStartTour }) {
  // Scanner state
  const [tier, setTier] = useState(5);
  const [enchantment, setEnchantment] = useState(0);
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [minProfit, setMinProfit] = useState(1000);
  const [minMargin, setMinMargin] = useState(15);
  const [qualityFilter, setQualityFilter] = useState('all');
  const [maxAgeFilter, setMaxAgeFilter] = useState('all'); // 'all', '1', '3', '6', '12'
  const [sortBy, setSortBy] = useState('profit'); // 'profit', 'margin', 'density', 'cost', 'freshness'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [autoFetchEnabled, setAutoFetchEnabled] = useState(true);

  // Loading & Data states
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState([]);
  const [totalScanned, setTotalScanned] = useState(0);
  const [lastScanTime, setLastScanTime] = useState(null);
  const [catalogItems, setCatalogItems] = useState([]);
  const [errorStatus, setErrorStatus] = useState('');

  // Transport Cargo Manifest ("Haul Cart")
  const [haulCart, setHaulCart] = useState([]);
  const [isHaulCalculating, setIsHaulCalculating] = useState(false);
  const [haulManifest, setHaulManifest] = useState(null);
  const [isManifestOpen, setIsManifestOpen] = useState(true);

  // Fetch initial catalog
  useEffect(() => {
    async function loadCatalog() {
      const catalog = await getBlackMarketItemsApi();
      if (catalog && catalog.items) {
        setCatalogItems(catalog.items);
      }
    }
    loadCatalog();
  }, []);

  // Scan live market
  const handleScan = async () => {
    setIsScanning(true);
    setErrorStatus('');
    try {
      const payload = {
        server,
        tier,
        enchantment,
        category,
        quality: qualityFilter !== 'all' ? parseInt(qualityFilter) : 'all',
        min_profit: minProfit,
        min_margin: minMargin,
        sort_by: sortBy,
        limit: 50,
      };

      const res = await scanBlackMarketApi(payload);
      if (res && res.results) {
        setScanResults(res.results);
        setTotalScanned(res.totalScanned || res.results.length);
        setLastScanTime(new Date().toLocaleTimeString());
      } else {
        // Fallback simulated scan if AODP backend is unreachable
        performClientFallbackScan();
      }
    } catch (err) {
      console.error('Scan error:', err);
      setErrorStatus('Failed to query live Black Market. Generating conservative market spreads.');
      performClientFallbackScan();
    } finally {
      setIsScanning(false);
    }
  };

  // Debounced Auto-Fetch whenever tier, enchantment, server, category, quality, sort, or profit/margin sliders change
  useEffect(() => {
    if (!autoFetchEnabled) return;
    const timer = setTimeout(() => {
      handleScan();
    }, 220);
    return () => clearTimeout(timer);
  }, [server, tier, enchantment, category, qualityFilter, sortBy, minProfit, minMargin, autoFetchEnabled]);

  // Periodic background auto-refresh every 60 seconds when Auto-Fetch is ON
  useEffect(() => {
    if (!autoFetchEnabled) return;
    const interval = setInterval(() => {
      handleScan();
    }, 60000);
    return () => clearInterval(interval);
  }, [server, tier, enchantment, category, qualityFilter, sortBy, minProfit, minMargin, autoFetchEnabled]);

  // Fallback simulator for offline mode
  const performClientFallbackScan = () => {
    const filtered = catalogItems.filter(it => {
      if (category !== 'all' && it.category !== category) return false;
      if (tier < (it.minTier || 4) || tier > (it.maxTier || 8)) return false;
      return true;
    });

    const fallbackResults = filtered.slice(0, 30).map(it => {
      const aodpId = `${it.template.replace('{tier}', tier)}${enchantment > 0 ? `@${enchantment}` : ''}`;
      const mult = (2 ** (tier - 4)) * (2 ** enchantment);
      const estCost = Math.round((it.baseItemValue || 100) * 12 * mult);
      const bmDemand = Math.round(estCost * 1.55);
      const instantPayout = Math.round(bmDemand * 0.935);
      const profit = instantPayout - estCost;
      const margin = Math.round((profit / estCost) * 1000) / 10;
      const weight = Math.round(((it.primaryQty || 16) + (it.secondaryQty || 8)) * 0.15 * 10) / 10;
      const density = weight > 0 ? Math.round(profit / weight) : 0;

      return {
        id: it.id,
        aodpId,
        name: it.name,
        tier,
        enchantment,
        category: it.category,
        subcategory: it.subcategory,
        icon: `${it.template.replace('{tier}', tier)}.png`,
        weightKg: weight,
        bonusCity: it.bonusCity,
        acquisition: {
          method: `Craft in ${it.bonusCity || 'Royal City'}`,
          city: it.bonusCity,
          cost: estCost,
          isMarketListing: false,
          updatedAt: null,
          ageHours: null,
        },
        blackMarket: {
          buyOrderMax: bmDemand,
          sellOrderMin: Math.round(bmDemand * 1.15),
          instantPayout,
          listedPayout: Math.round(bmDemand * 1.15 * 0.935),
          buyOrderAgeHours: null,
          sellOrderAgeHours: null,
          activeAgeHours: null,
        },
        spread: {
          instantProfit: profit,
          instantMarginPct: margin,
          listedProfit: Math.round(bmDemand * 1.15 * 0.935) - estCost,
          listedMarginPct: Math.round(((Math.round(bmDemand * 1.15 * 0.935) - estCost) / estCost) * 1000) / 10,
          bestProfit: profit,
          bestMarginPct: margin,
          bestMode: 'Instant Buy Order',
          silverPerKg: density,
        }
      };
    });

    setScanResults(fallbackResults.filter(r => r.spread.bestProfit >= minProfit && r.spread.bestMarginPct >= minMargin));
    setTotalScanned(filtered.length);
    setLastScanTime(new Date().toLocaleTimeString());
  };

  // Filtered view by search query and max price age
  const displayedOpportunities = useMemo(() => {
    let list = scanResults;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.aodpId.toLowerCase().includes(q) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(q))
      );
    }
    if (maxAgeFilter !== 'all') {
      const maxHrs = parseFloat(maxAgeFilter);
      list = list.filter(item => {
        const bmAge = item.blackMarket?.activeAgeHours ?? item.blackMarket?.buyOrderAgeHours ?? item.blackMarket?.sellOrderAgeHours;
        const royalAge = item.acquisition?.isMarketListing ? item.acquisition?.ageHours : 0;
        const bOk = bmAge !== null && bmAge !== undefined && bmAge <= maxHrs;
        const rOk = !item.acquisition?.isMarketListing || (royalAge !== null && royalAge !== undefined && royalAge <= maxHrs);
        return bOk && rOk;
      });
    }
    return list;
  }, [scanResults, searchQuery, maxAgeFilter]);

  // Recalculate Haul Manifest whenever cart changes
  useEffect(() => {
    if (haulCart.length === 0) {
      setHaulManifest(null);
      return;
    }

    let isSubscribed = true;
    setIsHaulCalculating(true);

    async function updateManifest() {
      try {
        const res = await calculateHaulApi({ items: haulCart });
        if (isSubscribed && res && res.totalCost !== undefined) {
          setHaulManifest(res);
          return;
        }
      } catch (err) {
        console.warn('Backend haul calculation fallback to local math:', err);
      }

      if (isSubscribed) {
        const clientRes = calculateClientHaul(haulCart);
        setHaulManifest(clientRes);
      }
    }

    updateManifest().finally(() => {
      if (isSubscribed) setIsHaulCalculating(false);
    });

    return () => { isSubscribed = false; };
  }, [haulCart]);

  // Add item to Haul Cart
  const handleAddToHaul = (item, mode = 'best') => {
    const payout = mode === 'listed' ? item.blackMarket.listedPayout : item.blackMarket.instantPayout;
    setHaulCart(prev => {
      const existing = prev.find(p => p.aodpId === item.aodpId);
      if (existing) {
        return prev.map(p => p.aodpId === item.aodpId ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [
        ...prev,
        {
          aodpId: item.aodpId,
          name: item.name,
          tier: item.tier,
          enchantment: item.enchantment,
          icon: item.icon,
          cost: item.acquisition.cost,
          payout: payout > 0 ? payout : Math.round(item.acquisition.cost * 1.3),
          weightKg: item.weightKg,
          acquisitionMethod: item.acquisition.method,
          sellMode: mode === 'listed' ? 'Listed Order' : 'Instant Buy Order',
          quantity: 1,
        }
      ];
    });
  };

  const handleUpdateHaulQty = (aodpId, delta) => {
    setHaulCart(prev => {
      return prev.map(p => {
        if (p.aodpId === aodpId) {
          const newQty = p.quantity + delta;
          return newQty > 0 ? { ...p, quantity: newQty } : null;
        }
        return p;
      }).filter(Boolean);
    });
  };

  const handleRemoveFromHaul = (aodpId) => {
    setHaulCart(prev => prev.filter(p => p.aodpId !== aodpId));
  };

  const handleClearHaul = () => {
    setHaulCart([]);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Contraband Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-900/40 bg-gradient-to-br from-[#180a0f] via-[#0d0914] to-[#07090e] p-6 shadow-2xl">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-700/60 shadow-inner font-bold">
                <Skull className="w-3.5 h-3.5 text-rose-400" />
                Underworld Black Market Arbitrage
              </span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#070b12] text-amber-300 border border-amber-500/40 font-bold">
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                Red Zone High Risk
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-black text-slate-100 tracking-tight">
              Caerleon Arbitrage & Transport Margin Scanner
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl font-serif">
              Scan live AODP price differentials across the 6 Royal Cities vs. the Black Market in Caerleon. Uncover high-margin Craft-to-Order and Transport Hauling routes optimized for cargo weight density.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoFetchEnabled(!autoFetchEnabled)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-serif font-bold transition-all border cursor-pointer ${
                autoFetchEnabled
                  ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 shadow-gold-glow'
                  : 'bg-[#070b12] border-[#1e2a3c] text-slate-400 hover:text-slate-200'
              }`}
              title={autoFetchEnabled ? 'Automatically fetches live prices whenever filters change (and every 60s)' : 'Auto-fetch paused'}
            >
              <Zap className={`w-3.5 h-3.5 ${autoFetchEnabled ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
              <span>{autoFetchEnabled ? 'Auto-Fetch: ON' : 'Auto-Fetch: PAUSED'}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenGuide && onOpenGuide('blackmarket')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-serif font-bold bg-rose-950/70 border border-rose-700/60 text-rose-300 hover:bg-rose-900/50 transition-all shadow-sm cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-rose-400" />
              <span>Smuggler&apos;s Guide</span>
            </button>

            <button
              type="button"
              onClick={() => onStartTour && onStartTour('blackmarket')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-serif font-bold bg-[#070b12] border border-amber-600/50 text-amber-200 hover:bg-amber-950/40 transition-all shadow-sm cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Interactive Tour</span>
            </button>

            <button
              onClick={handleScan}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-serif font-bold text-xs bg-gradient-to-r from-rose-800 to-amber-700 hover:from-rose-700 hover:to-amber-600 text-white shadow-lg shadow-rose-950/50 transition-all border border-rose-500/30 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Live AODP...' : 'Refresh Now'}</span>
            </button>
          </div>
        </div>

        {/* Dual Arbitrage Pathways & Safety Infographic Pill */}
        <div id="tour-bm-safety-guide" className="mt-4 pt-4 border-t border-rose-900/30 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div id="tour-bm-hauling-weight" className="flex items-start gap-3 bg-[#070b12] p-3 rounded-xl border border-sky-500/30 shadow-sm">
            <div className="p-2 rounded-lg bg-sky-950/60 border border-sky-500/40 text-sky-400 mt-0.5">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sky-300 font-serif">Path 1: Transport Hauling</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Buy finished equipment in the cheapest Royal City &rarr; Haul past Red Zone gankers &rarr; Sell directly to Black Market Buy Orders or Sell Orders.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-[#070b12] p-3 rounded-xl border border-amber-500/30 shadow-sm">
            <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-400 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-amber-300 font-serif">Path 2: Craft-to-Order</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Craft gear in the specialized Royal City (24.8% &ndash; 47.9% RRR) &rarr; Haul to Caerleon &rarr; Cash in at high-demand Black Market Buy Orders for maximum margin.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Scanner Parameters & Filter Controls */}
      <div id="tour-bm-item-filter" className="forged-tablet p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e2a3c] pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
              Stage 01
            </span>
            <Sliders className="w-4 h-4 text-albion-gold" />
            <h2 className="text-sm font-serif font-black uppercase tracking-wider text-slate-100">
              Live Scanner Controls & Cargo Filters
            </h2>
          </div>

          {lastScanTime && (
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 bg-[#070b12] px-3 py-1 rounded-lg border border-[#1e2a3c]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Server: <span className="text-slate-200 uppercase font-bold">{server}</span>
              </span>
              <span>&bull;</span>
              <span>Updated: <span className="text-slate-200">{lastScanTime}</span></span>
              <span>&bull;</span>
              <span>Found: <span className="text-amber-400 font-bold">{displayedOpportunities.length}</span> spreads</span>
            </div>
          )}
        </div>

        {/* Tier & Enchantment Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Tiers */}
          <div className="md:col-span-7 space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Equipment Tier
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {TIERS.map(t => {
                const isSelected = tier === t.level;
                return (
                  <button
                    key={t.level}
                    type="button"
                    onClick={() => setTier(t.level)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-serif font-bold transition-all border cursor-pointer ${
                      isSelected
                        ? `${t.color} ring-1 ring-amber-400/80 shadow-gold-glow scale-[1.02]`
                        : 'border-[#1e2a3c] bg-[#070b12] text-slate-400 hover:text-slate-200 hover:bg-[#0c121e] hover:border-slate-600'
                    }`}
                  >
                    T{t.level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enchantments */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Enchantment
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {ENCHANTMENTS.map(e => {
                const isSelected = enchantment === e.level;
                return (
                  <button
                    key={e.level}
                    type="button"
                    onClick={() => setEnchantment(e.level)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-950/60 text-amber-200 ring-1 ring-amber-400/60 shadow-gold-glow'
                        : 'border-[#1e2a3c] bg-[#070b12] text-slate-400 hover:text-slate-200 hover:bg-[#0c121e] hover:border-slate-600'
                    }`}
                  >
                    {e.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category Filter Pills & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1e2a3c]">
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map(c => {
              const isSelected = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-serif transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-950/80 text-rose-200 border border-rose-600/80 font-bold shadow-md shadow-rose-950/40'
                      : 'bg-[#070b12] text-slate-400 border border-[#1e2a3c] hover:text-slate-200 hover:bg-[#0c121e] hover:border-slate-600'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search gear by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#070b12] border border-[#1e2a3c] focus:border-amber-400 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none font-serif shadow-inner"
            />
          </div>
        </div>

        {/* Sliders & Dropdowns: Min Profit, Min Margin, Quality, Max Price Age, Sort By */}
        <div id="tour-bm-arbitrage-spread" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2 border-t border-[#1e2a3c] text-xs">
          <div className="bg-[#070b12] p-2.5 rounded-xl border border-[#1e2a3c] space-y-1">
            <div className="flex justify-between font-serif text-[11px] text-slate-400">
              <span>Min Profit Spread</span>
              <span className="font-mono text-amber-300 font-bold">{formatSilver(minProfit)} s</span>
            </div>
            <input
              type="range"
              min="0"
              max="200000"
              step="5000"
              value={minProfit}
              onChange={e => setMinProfit(Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-[#05080e] rounded-lg cursor-pointer"
            />
          </div>

          <div className="bg-[#070b12] p-2.5 rounded-xl border border-[#1e2a3c] space-y-1">
            <div className="flex justify-between font-serif text-[11px] text-slate-400">
              <span>Min Margin %</span>
              <span className="font-mono text-amber-300 font-bold">{minMargin}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minMargin}
              onChange={e => setMinMargin(Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-[#05080e] rounded-lg cursor-pointer"
            />
          </div>

          <div className="bg-[#070b12] p-2.5 rounded-xl border border-[#1e2a3c] space-y-1">
            <label className="block font-serif text-[11px] text-slate-400">
              Item Quality Filter
            </label>
            <select
              value={qualityFilter}
              onChange={e => setQualityFilter(e.target.value)}
              className="w-full bg-[#0c121e] border border-[#1e2a3c] rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-serif"
            >
              <option value="all">All Qualities (Best Spread)</option>
              <option value="1">Normal (Q1)</option>
              <option value="2">Good (Q2)</option>
              <option value="3">Outstanding (Q3)</option>
              <option value="4">Excellent (Q4)</option>
              <option value="5">Masterpiece (Q5)</option>
            </select>
          </div>

          <div className="bg-[#070b12] p-2.5 rounded-xl border border-[#1e2a3c] space-y-1">
            <label className="flex items-center gap-1 font-serif text-[11px] text-slate-400">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>Max Price Age</span>
            </label>
            <select
              value={maxAgeFilter}
              onChange={e => setMaxAgeFilter(e.target.value)}
              className="w-full bg-[#0c121e] border border-[#1e2a3c] rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-serif"
            >
              <option value="all">All Ages (&lt; 48 Hours)</option>
              <option value="1">🟢 Fresh Only (&lt; 1 Hour)</option>
              <option value="3">🟡 Under 3 Hours</option>
              <option value="6">Under 6 Hours</option>
              <option value="12">Under 12 Hours</option>
            </select>
          </div>

          <div className="bg-[#070b12] p-2.5 rounded-xl border border-[#1e2a3c] space-y-1">
            <label className="block font-serif text-[11px] text-slate-400">
              Sort Spreads By
            </label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full bg-[#0c121e] border border-[#1e2a3c] rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-serif"
            >
              <option value="profit">Highest Net Profit (Silver)</option>
              <option value="margin">Highest Margin ROI (%)</option>
              <option value="density">Highest Cargo Density (Silver / Kg)</option>
              <option value="freshness">Freshest Prices First</option>
              <option value="cost">Lowest Capital Investment</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Transport Cargo Manifest ("Haul Cart") Panel */}
      {haulCart.length > 0 && (
        <div className="forged-tablet p-5 sm:p-6 space-y-4 border-amber-500/50 shadow-[0_0_25px_rgba(217,119,6,0.15)] relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3.5 border-b border-[#1e2a3c]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-albion-gold shadow-sm">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-black text-amber-200 flex items-center gap-2">
                  Transport Cargo Manifest
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    {haulCart.reduce((sum, i) => sum + i.quantity, 0)} Units Loaded
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-serif">
                  Smuggling manifest to Caerleon Black Market. Review total investment, cargo weight, and recommended escape mount.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearHaul}
                className="px-3 py-1.5 rounded-xl text-xs font-serif text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/60 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                Clear Manifest
              </button>
              <button
                type="button"
                onClick={() => setIsManifestOpen(!isManifestOpen)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 bg-[#070b12] border border-[#1e2a3c] cursor-pointer"
              >
                {isManifestOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isManifestOpen && (
            <>
              {/* Manifest Item Rows */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {haulCart.map(item => {
                  const subCost = item.cost * item.quantity;
                  const subPayout = item.payout * item.quantity;
                  const subProfit = subPayout - subCost;
                  const subWeight = Math.round(item.weightKg * item.quantity * 10) / 10;

                  return (
                    <div
                      key={item.aodpId}
                      className="flex flex-wrap items-center justify-between gap-3 bg-[#070b12] p-3 rounded-xl border border-[#1e2a3c] text-xs hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className={`w-11 h-11 rounded-lg bg-[#0c121e] border p-0.5 flex items-center justify-center relative shadow-sm ${getEnchantmentBorder(item.enchantment)}`}>
                          <ItemIcon
                            src={getItemIcon(item)}
                            alt={item.name}
                            className="w-full h-full object-contain filter drop-shadow"
                          />
                          <span className={`absolute -bottom-1 -right-1 text-[8px] font-mono px-1 rounded font-bold shadow ${getEnchantmentBadge(item.enchantment)}`}>
                            T{item.tier}{item.enchantment > 0 ? `.${item.enchantment}` : ''}
                          </span>
                        </div>
                        <div>
                          <div className="font-serif font-bold text-slate-100">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                            <span>Cost: {formatSilver(item.cost)}s</span>
                            <span>&bull;</span>
                            <span>{subWeight} kg</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-mono font-bold text-emerald-400">+{formatSilver(subProfit)} s</div>
                          <div className="text-[10px] font-mono text-slate-400">Payout: {formatSilver(subPayout)}s</div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 bg-[#0c121e] border border-[#1e2a3c] rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateHaulQty(item.aodpId, -1)}
                            className="p-1 hover:bg-[#141d2e] rounded text-slate-400 hover:text-slate-200 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-mono text-xs font-bold text-amber-300">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateHaulQty(item.aodpId, 1)}
                            className="p-1 hover:bg-[#141d2e] rounded text-slate-400 hover:text-slate-200 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFromHaul(item.aodpId)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Haul Aggregated Financials & Mount Analyzer */}
              {haulManifest && (
                <div className="pt-3 border-t border-[#1e2a3c] space-y-4">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-[#070b12] p-3 rounded-xl border border-[#1e2a3c]">
                      <div className="text-[10px] font-serif uppercase tracking-wider text-slate-400 font-semibold">
                        Silver Invested
                      </div>
                      <div className="text-base font-mono font-bold text-slate-100 mt-0.5">
                        {formatSilver(haulManifest.totalCost)} <span className="text-xs text-albion-gold">s</span>
                      </div>
                    </div>

                    <div className="bg-[#070b12] p-3 rounded-xl border border-[#1e2a3c]">
                      <div className="text-[10px] font-serif uppercase tracking-wider text-slate-400 font-semibold">
                        Gross Revenue
                      </div>
                      <div className="text-base font-mono font-bold text-slate-100 mt-0.5">
                        {formatSilver(haulManifest.totalPayout)} <span className="text-xs text-albion-gold">s</span>
                      </div>
                    </div>

                    <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                      <div className="text-[10px] font-serif uppercase tracking-wider text-emerald-300 font-bold">
                        Net Profit ({haulManifest.overallMarginPct}%)
                      </div>
                      <div className="text-base font-mono font-extrabold text-emerald-400 mt-0.5">
                        +{formatSilver(haulManifest.totalNetProfit)} <span className="text-xs">s</span>
                      </div>
                    </div>

                    <div className="bg-[#070b12] p-3 rounded-xl border border-[#1e2a3c]">
                      <div className="text-[10px] font-serif uppercase tracking-wider text-slate-400 font-semibold">
                        Total Cargo Weight
                      </div>
                      <div className="text-base font-mono font-bold text-amber-300 mt-0.5">
                        {haulManifest.totalWeightKg} <span className="text-xs font-serif text-slate-400">kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Mount Recommendation & Risk Banner */}
                  <div className="bg-[#070b12] p-3.5 rounded-xl border border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-inner">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-serif uppercase tracking-wider text-slate-400 font-semibold">
                          Recommended Transport Mount
                        </div>
                        <div className="font-serif font-black text-amber-200 text-sm">
                          {haulManifest.recommendedMount}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full font-mono text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/80 shadow-sm">
                        {haulManifest.dangerRisk}
                      </span>
                    </div>
                  </div>

                  {/* Red Zone Intel Tip */}
                  <div className="flex items-start gap-2.5 bg-[#070b12] p-3 rounded-xl border border-amber-500/20 text-[11px] text-slate-400 font-serif">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-amber-300">Red Zone Smuggling Protocol:</strong> Check the Hostile Outlaw counter in the bottom-right mini-map before crossing cluster borders into Caerleon. Never haul overweight without mount capacity active. Use the Underway entrance to bypass gate campers.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 4. Arbitrage Opportunities Results (Cards / Table) */}
      <div id="tour-bm-price-comparison" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-serif font-black uppercase tracking-wider text-slate-100">
                Arbitrage Spreads ({displayedOpportunities.length})
              </h2>
            </div>

            {/* Price Freshness Traffic-Light Legend */}
            <div className="flex flex-wrap items-center gap-2 px-3 py-1 rounded-xl bg-[#070b12] border border-[#1e2a3c] text-[10px] font-mono text-slate-400">
              <span className="text-slate-300 font-bold flex items-center gap-1 font-serif">
                <Clock className="w-3 h-3 text-albion-gold" />
                Price Age:
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                &le;1h Fresh
              </span>
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                1–4h Moderate
              </span>
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1 text-rose-300 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                &gt;4h Older
              </span>
              <span>&bull;</span>
              <span className="text-sky-300 font-semibold">⚒️ Craft Est.</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-serif text-slate-400">View Mode:</span>
            <div className="flex items-center bg-[#070b12] border border-[#1e2a3c] rounded-lg p-0.5 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-md text-xs font-serif font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-gold-glow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-md text-xs font-serif font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-gold-glow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {displayedOpportunities.length === 0 ? (
          <div className="forged-tablet p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-serif font-bold text-slate-200">
              No Arbitrage Opportunities Found
            </h3>
            <p className="text-xs text-slate-400 font-serif max-w-md mx-auto">
              No equipment matched your current profit, margin, or price freshness thresholds. Try relaxing the Max Price Age filter, lowering Min Profit/Margin, or scanning another Tier/Category.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Cards Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayedOpportunities.map(item => {
              const inCart = haulCart.find(h => h.aodpId === item.aodpId);

              return (
                <div
                  key={`${item.aodpId}-${item.quality || 1}`}
                  className="forged-tablet p-4 space-y-3.5 hover:border-amber-500/60 transition-all duration-200 relative group shadow-lg"
                >
                  {/* Top Bar: Icon, Name, Tier, Category */}
                  <div className="flex items-start gap-3">
                    <div className={`relative w-14 h-14 rounded-xl bg-[#070b12] border p-1 flex items-center justify-center shrink-0 shadow-md ${getEnchantmentBorder(item.enchantment)}`}>
                      <ItemIcon
                        src={getItemIcon(item)}
                        alt={item.name}
                        className="w-full h-full object-contain filter drop-shadow"
                        loading="lazy"
                      />
                      <span className={`absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold shadow ${getEnchantmentBadge(item.enchantment)}`}>
                        T{item.tier}{item.enchantment > 0 ? `.${item.enchantment}` : ''}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono uppercase text-slate-400 truncate">
                          {item.subcategory || item.category}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#070b12] text-slate-300 border border-[#1e2a3c] shrink-0">
                          {item.weightKg} kg
                        </span>
                      </div>
                      <h4 className="text-sm font-serif font-black text-slate-100 truncate group-hover:text-amber-300 transition-colors">
                        {item.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold ${
                          item.quality === 5 ? 'bg-amber-950/70 text-amber-300 border-amber-500 shadow-gold-glow' :
                          item.quality === 4 ? 'bg-purple-950/70 text-purple-300 border-purple-500' :
                          item.quality === 3 ? 'bg-sky-950/70 text-sky-300 border-sky-500' :
                          item.quality === 2 ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500' :
                          'bg-[#070b12] text-slate-300 border-[#1e2a3c]'
                        }`}>
                          {item.qualityName || 'Normal'} Quality
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Royal City Acquisition Box with Clear Price Age */}
                  <div className="bg-[#070b12] px-3.5 py-2.5 rounded-xl border border-[#1e2a3c] flex items-center justify-between gap-2 shadow-inner">
                    <div className="min-w-0">
                      <span className="text-[10px] font-serif text-slate-400 block">
                        Royal City Cost ({item.acquisition.method})
                      </span>
                      <div className="font-mono font-bold text-amber-300 text-xs">
                        {formatSilver(item.acquisition.cost)} s
                      </div>
                    </div>
                    {renderFreshnessBadge(
                      item.acquisition.ageHours,
                      item.acquisition.updatedAt,
                      item.acquisition.isMarketListing ? null : 'craft'
                    )}
                  </div>

                  {/* Dual Market Prices: Buy Order vs Sell Order */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#070b12] p-3 rounded-xl border border-[#1e2a3c] shadow-inner">
                    <div className="space-y-1">
                      <span className="text-[10px] font-serif text-slate-400 block font-semibold">Caerleon BM Buy Order</span>
                      <div className="font-mono font-bold text-slate-100">
                        {item.blackMarket.buyOrderMax > 0 ? `${formatSilver(item.blackMarket.buyOrderMax)} s` : 'No demand'}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-400 font-extrabold">
                        {item.spread.instantProfit > 0 ? `+${formatSilver(item.spread.instantProfit)}s (${item.spread.instantMarginPct}%)` : '-'}
                      </div>
                      {item.blackMarket.buyOrderMax > 0 && (
                        <div className="pt-0.5">
                          {renderFreshnessBadge(
                            item.blackMarket.buyOrderAgeHours,
                            item.blackMarket.buyOrderUpdatedAt
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-l border-[#1e2a3c] pl-3 space-y-1">
                      <span className="text-[10px] font-serif text-slate-400 block font-semibold">Caerleon BM Sell Order</span>
                      <div className="font-mono font-bold text-slate-100">
                        {item.blackMarket.sellOrderMin > 0 ? `${formatSilver(item.blackMarket.sellOrderMin)} s` : 'No listings'}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-400 font-extrabold">
                        {item.spread.listedProfit > 0 ? `+${formatSilver(item.spread.listedProfit)}s (${item.spread.listedMarginPct}%)` : '-'}
                      </div>
                      {item.blackMarket.sellOrderMin > 0 && (
                        <div className="pt-0.5">
                          {renderFreshnessBadge(
                            item.blackMarket.sellOrderAgeHours,
                            item.blackMarket.sellOrderUpdatedAt
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Density & Best Mode Pill */}
                  <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 border-t border-[#1e2a3c]">
                    <span className="text-slate-400">
                      Density: <strong className="text-amber-300">{formatSilver(item.spread.silverPerKg)}</strong> s/kg
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      Mode: <strong className="text-rose-300">{item.spread.bestMode}</strong>
                    </span>
                  </div>

                  {/* Add to Haul Cart Action */}
                  <div className="pt-1">
                    {inCart ? (
                      <div className="flex items-center justify-between bg-amber-950/40 border border-amber-500/50 rounded-xl p-2 shadow-inner">
                        <span className="text-[11px] font-serif text-amber-300 font-bold px-2">
                          In Haul Cart ({inCart.quantity})
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateHaulQty(item.aodpId, -1)}
                            className="p-1 hover:bg-[#141d2e] rounded text-amber-300 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateHaulQty(item.aodpId, 1)}
                            className="p-1 hover:bg-[#141d2e] rounded text-amber-300 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddToHaul(item)}
                        className="w-full py-2.5 px-3 rounded-xl font-serif font-bold text-xs bg-[#0c121e] hover:bg-amber-950/60 text-slate-200 hover:text-amber-200 border border-[#1e2a3c] hover:border-amber-500/60 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95"
                      >
                        <Plus className="w-4 h-4 text-albion-gold" />
                        <span>Add to Transport Cargo</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="forged-tablet overflow-x-auto shadow-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070b12] border-b border-[#1e2a3c] text-[10px] font-serif uppercase tracking-wider text-slate-300">
                <tr>
                  <th className="py-3 px-4">Equipment</th>
                  <th className="py-3 px-3">Acquisition (Royal City)</th>
                  <th className="py-3 px-3 text-right">Acquisition Cost &amp; Age</th>
                  <th className="py-3 px-3 text-right">BM Order &amp; Age</th>
                  <th className="py-3 px-3 text-right">Best Profit</th>
                  <th className="py-3 px-3 text-right">Density (s/kg)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2a3c]">
                {displayedOpportunities.map(item => {
                  const inCart = haulCart.find(h => h.aodpId === item.aodpId);

                  return (
                    <tr key={`${item.aodpId}-${item.quality || 1}`} className="hover:bg-[#0c121e]/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-[#070b12] border p-0.5 flex items-center justify-center shrink-0 shadow-sm ${getEnchantmentBorder(item.enchantment)}`}>
                            <ItemIcon
                              src={getItemIcon(item)}
                              alt={item.name}
                              className="w-full h-full object-contain filter drop-shadow"
                            />
                          </div>
                          <div>
                            <div className="font-serif font-bold text-slate-100 flex items-center gap-2">
                              <span>{item.name}</span>
                              <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded border font-bold ${
                                item.quality === 5 ? 'bg-amber-950/70 text-amber-300 border-amber-500 shadow-gold-glow' :
                                item.quality === 4 ? 'bg-purple-950/70 text-purple-300 border-purple-500' :
                                item.quality === 3 ? 'bg-sky-950/70 text-sky-300 border-sky-500' :
                                item.quality === 2 ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500' :
                                'bg-[#070b12] text-slate-300 border-[#1e2a3c]'
                              }`}>
                                {item.qualityName || 'Normal'}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              T{item.tier}{item.enchantment > 0 ? `.${item.enchantment}` : ''} &bull; {item.weightKg} kg
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-mono text-slate-300">
                          {item.acquisition.method}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="font-mono font-bold text-slate-200">
                          {formatSilver(item.acquisition.cost)} s
                        </div>
                        <div className="mt-0.5 flex justify-end">
                          {renderFreshnessBadge(
                            item.acquisition.ageHours,
                            item.acquisition.updatedAt,
                            item.acquisition.isMarketListing ? null : 'craft'
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="font-mono font-bold text-slate-100">
                          {item.blackMarket.buyOrderMax > 0
                            ? `${formatSilver(item.blackMarket.buyOrderMax)} s`
                            : item.blackMarket.sellOrderMin > 0
                            ? `${formatSilver(item.blackMarket.sellOrderMin)} s (Sell)`
                            : '-'}
                        </div>
                        <div className="mt-0.5 flex justify-end">
                          {(item.blackMarket.buyOrderMax > 0 || item.blackMarket.sellOrderMin > 0) &&
                            renderFreshnessBadge(
                              item.blackMarket.buyOrderMax > 0
                                ? item.blackMarket.buyOrderAgeHours
                                : item.blackMarket.sellOrderAgeHours,
                              item.blackMarket.buyOrderMax > 0
                                ? item.blackMarket.buyOrderUpdatedAt
                                : item.blackMarket.sellOrderUpdatedAt
                            )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="font-mono font-extrabold text-emerald-400">
                          +{formatSilver(item.spread.bestProfit)} s
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {item.spread.bestMarginPct}% ({item.spread.bestMode === 'Instant Buy Order' ? 'Instant' : 'Listed'})
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">
                        {formatSilver(item.spread.silverPerKg)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {inCart ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-serif font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Loaded ({inCart.quantity})
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToHaul(item)}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-serif font-bold bg-[#0c121e] hover:bg-amber-950 text-slate-200 hover:text-amber-200 border border-[#1e2a3c] hover:border-amber-500/60 transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-albion-gold" />
                            Add
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
