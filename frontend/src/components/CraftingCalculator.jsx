import React, { useState, useMemo, useEffect } from 'react';
import { 
  CRAFTABLE_ITEMS, 
  CRAFTING_CATEGORIES, 
  computeCrafting,
  getCraftingReturnRate,
  getArtifactQty,
} from '../utils/craftingMath';
import { CITIES } from '../utils/albionMath';
import { calculateCraftingApi, fetchCraftingPricesApi } from '../services/api';
import { 
  Hammer, 
  BookOpen, 
  Coins, 
  Sparkles, 
  MapPin, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Building,
  Check,
  Zap,
  Info,
  Gem,
  Pickaxe,
  Search,
  Flame,
  RefreshCw,
  Tag,
  TrendingUp,
  Scale,
  Utensils,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  Dices,
  ShoppingCart,
  ClipboardCheck,
  Copy,
  Compass,
  Sliders,
  Wallet,
  CheckSquare,
  Square,
  PackageCheck
} from 'lucide-react';
import ItemIcon from './ItemIcon';

const TIERS = [
  { level: 2, name: 'Novice', color: 'border-amber-700/80 text-amber-500 bg-amber-950/30' },
  { level: 3, name: 'Journeyman', color: 'border-emerald-700/80 text-emerald-400 bg-emerald-950/30' },
  { level: 4, name: 'Adept', color: 'border-sky-600/80 text-sky-400 bg-sky-950/30', gemClass: 'gem-t4' },
  { level: 5, name: 'Expert', color: 'border-red-600/80 text-red-400 bg-red-950/30', gemClass: 'gem-t5' },
  { level: 6, name: 'Master', color: 'border-orange-600/80 text-orange-400 bg-orange-950/30', gemClass: 'gem-t6' },
  { level: 7, name: 'Grandmaster', color: 'border-yellow-500/80 text-yellow-400 bg-yellow-950/30', gemClass: 'gem-t7' },
  { level: 8, name: 'Elder', color: 'border-slate-200/90 text-slate-100 bg-slate-800/40', gemClass: 'gem-t8' },
];

const ENCHANTMENTS = [
  { level: 0, label: '.0', name: '.0 Flat', color: 'border-slate-700 text-slate-300' },
  { level: 1, label: '.1', name: '.1 Uncommon', color: 'border-emerald-600/80 text-emerald-400 bg-emerald-950/30' },
  { level: 2, label: '.2', name: '.2 Rare', color: 'border-sky-500/80 text-sky-400 bg-sky-950/30' },
  { level: 3, label: '.3', name: '.3 Exceptional', color: 'border-purple-500/80 text-purple-400 bg-purple-950/30' },
  { level: 4, label: '.4', name: '.4 Pristine', color: 'border-amber-500/90 text-amber-300 bg-amber-950/30' },
];

const ITEM_QUALITIES = [
  { id: 1, name: 'Normal', label: 'Normal (Q1)', color: 'border-slate-600 text-slate-300 bg-slate-900/60', badge: 'bg-slate-800/80 text-slate-300 border-slate-700' },
  { id: 2, name: 'Good', label: 'Good (Q2)', color: 'border-emerald-600 text-emerald-400 bg-emerald-950/40', badge: 'bg-emerald-950/70 text-emerald-300 border-emerald-600' },
  { id: 3, name: 'Outstanding', label: 'Outstanding (Q3)', color: 'border-sky-500 text-sky-400 bg-sky-950/40', badge: 'bg-sky-950/70 text-sky-300 border-sky-500' },
  { id: 4, name: 'Excellent', label: 'Excellent (Q4)', color: 'border-purple-500 text-purple-400 bg-purple-950/40', badge: 'bg-purple-950/70 text-purple-300 border-purple-500' },
  { id: 5, name: 'Masterpiece', label: 'Masterpiece (Q5)', color: 'border-amber-400 text-amber-300 bg-amber-950/50 shadow-gold-glow', badge: 'bg-amber-950/70 text-amber-300 border-amber-400 shadow-gold-glow' },
];

// Base Cumulative Quality Distribution in Albion Online for a single roll
export const BASE_QUALITY_CDF = [
  0.6890,           // Normal (Q1): 68.90%
  0.6890 + 0.2800,  // Good (Q2): 96.90%
  0.9690 + 0.0280,  // Outstanding (Q3): 99.70%
  0.9970 + 0.0028,  // Excellent (Q4): 99.98%
  1.0000            // Masterpiece (Q5): 100.00%
];

export const BASE_QUALITY_CHANCES = {
  1: 0.6890,
  2: 0.2800,
  3: 0.0280,
  4: 0.0028,
  5: 0.0002,
};

/**
 * Computes exact Albion Online Quality roll probabilities given player's
 * Destiny Board Mastery (+0.75/lvl), Spec (+6.0/lvl), Crafter's Salad (+150), and Focus (+50).
 * In Albion, every 100 Quality Bonus gives an extra roll, taking the highest quality result.
 */
export function computeDynamicQualityChances(mastery = 0, spec = 0, hasSalad = false, useFocus = false) {
  const m = Math.max(0, Math.min(100, Number(mastery) || 0));
  const s = Math.max(0, Math.min(100, Number(spec) || 0));
  const qualityPower = (m * 0.75) + (s * 6.0) + (hasSalad ? 150 : 0) + (useFocus ? 50 : 0);
  
  const fullRolls = Math.floor(qualityPower / 100);
  const remainder = (qualityPower % 100) / 100.0;
  const baseRolls = 1 + fullRolls;
  
  const effectiveCDF = BASE_QUALITY_CDF.map(cdf => {
    const p1 = Math.pow(cdf, baseRolls);
    const p2 = Math.pow(cdf, baseRolls + 1);
    return (1 - remainder) * p1 + remainder * p2;
  });
  
  const chances = {};
  let prev = 0;
  for (let i = 0; i < 5; i++) {
    const qId = i + 1;
    chances[qId] = Math.max(0, effectiveCDF[i] - prev);
    prev = effectiveCDF[i];
  }
  
  return {
    qualityPower: Math.round(qualityPower),
    totalRolls: Number((1 + (qualityPower / 100)).toFixed(2)),
    chances
  };
}

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

const TIER_DEFAULT_PRICES = {
  2: { primary: 35, secondary: 30, artifact: 0, sell: 950 },
  3: { primary: 80, secondary: 75, artifact: 0, sell: 2600 },
  4: { primary: 240, secondary: 210, artifact: 12000, sell: 7200 },
  5: { primary: 680, secondary: 620, artifact: 38000, sell: 21000 },
  6: { primary: 1950, secondary: 1800, artifact: 110000, sell: 62000 },
  7: { primary: 5800, secondary: 5400, artifact: 340000, sell: 185000 },
  8: { primary: 17500, secondary: 16500, artifact: 1200000, sell: 560000 },
};

function getMaterialTactileClass(matName) {
  if (!matName) return 'bg-albion-bg/80 border-albion-border';
  const lower = matName.toLowerCase();
  if (lower.includes('wood') || lower.includes('plank')) return 'mat-wood';
  if (lower.includes('metal') || lower.includes('bar') || lower.includes('ore')) return 'mat-ore';
  if (lower.includes('leather') || lower.includes('hide')) return 'mat-hide';
  if (lower.includes('cloth') || lower.includes('fiber')) return 'mat-fiber';
  if (lower.includes('stone') || lower.includes('block')) return 'mat-stone';
  return 'bg-albion-bg/80 border-albion-border';
}

function getArtifactBadgeColor(type) {
  switch (type) {
    case 'Rune': return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    case 'Soul': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    case 'Relic': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'Avalonian': return 'bg-amber-400/25 text-amber-200 border-amber-400/50 shadow-gold-glow';
    case 'Tracking': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    case 'Crystal': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    case 'Dragon': return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    default: return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  }
}

export default function CraftingCalculator({
  server,
  hasPremium,
  useFocus,
}) {
  const [activeCategory, setActiveCategory] = useState('accessories');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('bag');
  const [selectedTier, setSelectedTier] = useState(2);
  const [selectedEnchantment, setSelectedEnchantment] = useState(0);
  const [selectedCity, setSelectedCity] = useState('Brecilien');
  const [quantity, setQuantity] = useState(10);
  const [stationTax, setStationTax] = useState(500);
  const [dailyBonus, setDailyBonus] = useState(0);

  // Material, Artifact and Item Prices
  const [primaryPrice, setPrimaryPrice] = useState(35);
  const [secondaryPrice, setSecondaryPrice] = useState(30);
  const [artifactPrice, setArtifactPrice] = useState(12000);
  const [itemSellPrice, setItemSellPrice] = useState(950);
  const [isSellOrder, setIsSellOrder] = useState(true);

  // Journals
  const [includeJournals, setIncludeJournals] = useState(false);
  const [emptyJournalPrice, setEmptyJournalPrice] = useState(1500);
  const [fullJournalPrice, setFullJournalPrice] = useState(4200);

  // Mastery & Specs
  const [masteryLevel, setMasteryLevel] = useState(0);
  const [specLevel, setSpecLevel] = useState(0);
  const [isDestinyBoardOpen, setIsDestinyBoardOpen] = useState(true);

  // Workflow Phase & Pre-Craft Procurement States
  const [workflowPhase, setWorkflowPhase] = useState('plan'); // 'plan' (Pre-Craft Planning & Shopping) vs 'realized' (Post-Craft Accounting)
  const [shoppingChecked, setShoppingChecked] = useState({});
  const [copiedShoppingList, setCopiedShoppingList] = useState(false);

  // Quality Realism & Dual-Engine Valuation States
  const [valuationMode, setValuationMode] = useState('ev'); // 'ev' (Statistical EV), 'actual' (Realized Craft), 'floor' (Normal Q1), 'inspect' (Inspected Quality)
  const [hasCraftersSalad, setHasCraftersSalad] = useState(true); // Crafter's Salad / Potato Salad buff (+150 Quality Bonus)
  const [inspectQuality, setInspectQuality] = useState(2); // Active quality tier in 'inspect' mode
  const [manualQualityPrices, setManualQualityPrices] = useState({}); // Per-tier manual price overrides: { [qId]: price }
  const [actualQualityCounts, setActualQualityCounts] = useState({ 1: 0, 2: 10, 3: 0, 4: 0, 5: 0 });
  const [simulationBanner, setSimulationBanner] = useState(null);
  const [qualityPrices, setQualityPrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [priceStatus, setPriceStatus] = useState('');
  const [autoFetchEnabled, setAutoFetchEnabled] = useState(true);
  const [priceTimestamps, setPriceTimestamps] = useState({});

  const selectedQuality = inspectQuality;
  const setSelectedQuality = setInspectQuality;

  const selectedQualityMeta = useMemo(() => {
    return ITEM_QUALITIES.find(q => q.id === inspectQuality) || ITEM_QUALITIES[1];
  }, [inspectQuality]);

  // Backend calculation engine states
  const [backendCalculation, setBackendCalculation] = useState(null);
  const [isBackendCalculating, setIsBackendCalculating] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  // Available Subcategories in active category
  const availableSubcategories = useMemo(() => {
    const list = [];
    const set = new Set();
    CRAFTABLE_ITEMS.filter((i) => i.category === activeCategory).forEach((i) => {
      if (i.subcategory && !set.has(i.subcategory)) {
        set.add(i.subcategory);
        list.push(i.subcategory);
      }
    });
    return list;
  }, [activeCategory]);

  // Filter items by category, subcategory, search query, and current tier
  const filteredItems = useMemo(() => {
    return CRAFTABLE_ITEMS.filter((i) => {
      // If an item only exists up to a lower tier (e.g. Chest at maxTier: 5), remove it for T6+
      if (i.maxTier && selectedTier > i.maxTier) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          i.name.toLowerCase().includes(q) ||
          (i.artifactName && i.artifactName.toLowerCase().includes(q)) ||
          (i.subcategory && i.subcategory.toLowerCase().includes(q))
        );
      }
      if (i.category !== activeCategory) return false;
      if (selectedSubcategory !== 'all' && i.subcategory !== selectedSubcategory) return false;
      return true;
    });
  }, [activeCategory, selectedSubcategory, searchQuery, selectedTier]);

  const selectedItem = useMemo(() => {
    return CRAFTABLE_ITEMS.find((i) => i.id === selectedItemId) || CRAFTABLE_ITEMS[0];
  }, [selectedItemId]);

  // Handle Item Selection & minTier/maxTier enforcement
  const handleSelectItem = (item, overrideTier = null) => {
    setSelectedItemId(item.id);
    const min = item.minTier || 4;
    const max = item.maxTier || 8;
    let nextTier = overrideTier !== null ? overrideTier : selectedTier;
    if (nextTier < min) {
      nextTier = min;
    } else if (nextTier > max) {
      nextTier = max;
    }
    setSelectedTier(nextTier);
    
    // Auto-fill prices
    const def = TIER_DEFAULT_PRICES[nextTier] || TIER_DEFAULT_PRICES[4];
    setPrimaryPrice(def.primary);
    setSecondaryPrice(def.secondary);
    setArtifactPrice(def.artifact);
    
    // Default sell price for artifacts is higher
    if (item.isArtifact) {
      setItemSellPrice(Math.round((def.sell + def.artifact) * 1.35));
    } else {
      setItemSellPrice(def.sell);
    }

    if (item.allowEnchantment === false || nextTier < 4) {
      setSelectedEnchantment(0);
    }
    setManualQualityPrices({});
  };

  // Handle Tier selection
  const handleSelectTier = (tierLevel) => {
    // If the currently selected item cannot exist at this tier (e.g. Chest at T6, T7, T8):
    if (selectedItem.maxTier && tierLevel > selectedItem.maxTier) {
      // Find an item in the same category that exists at this tier (e.g. Bag, Cape, Bed, Table)
      const fallbackItem = CRAFTABLE_ITEMS.find(
        (i) => i.category === selectedItem.category && (!i.maxTier || tierLevel <= i.maxTier) && (tierLevel >= (i.minTier || 4))
      ) || CRAFTABLE_ITEMS.find(
        (i) => i.category === selectedItem.category && (!i.maxTier || tierLevel <= i.maxTier)
      ) || CRAFTABLE_ITEMS[0];

      handleSelectItem(fallbackItem, tierLevel);
      return;
    }

    const min = selectedItem.minTier || 4;
    const max = selectedItem.maxTier || 8;
    if (tierLevel < min || tierLevel > max) return;
    setSelectedTier(tierLevel);

    const def = TIER_DEFAULT_PRICES[tierLevel] || TIER_DEFAULT_PRICES[4];
    setPrimaryPrice(def.primary);
    setSecondaryPrice(def.secondary);
    setArtifactPrice(def.artifact);

    if (selectedItem.isArtifact) {
      setItemSellPrice(Math.round((def.sell + def.artifact) * 1.35));
    } else {
      setItemSellPrice(def.sell);
    }

    if (selectedItem.allowEnchantment === false || tierLevel < 4) {
      setSelectedEnchantment(0);
    }
    setManualQualityPrices({});
  };

  // Fetch Live Prices for this item across all 5 qualities, primary material, secondary material, and artifact
  const handleFetchPrices = async (targetQuality = null) => {
    if (!selectedItem) return;
    setLoadingPrices(true);
    setPriceStatus('Fetching live market ledger...');

    try {
      const payload = {
        item_id: selectedItem.id,
        tier: selectedTier,
        enchantment: selectedEnchantment,
        server,
        city: selectedCity,
      };

      const res = await fetchCraftingPricesApi(payload);
      if (res && res.crafted_item) {
        const qMap = res.crafted_item.qualities || {};
        setQualityPrices(qMap);

        const currentQ = targetQuality !== null ? targetQuality : selectedQuality;
        const qData = qMap[currentQ] || qMap[2] || qMap[1];
        if (qData && qData.sell_min > 0) {
          setItemSellPrice(qData.sell_min);
        } else if (res.crafted_item.sell_min > 0) {
          setItemSellPrice(res.crafted_item.sell_min);
        }

        if (res.primary_mat && res.primary_mat.sell_min > 0) {
          setPrimaryPrice(res.primary_mat.sell_min);
        }
        if (res.secondary_mat && res.secondary_mat.sell_min > 0) {
          setSecondaryPrice(res.secondary_mat.sell_min);
        }
        if (res.artifact && res.artifact.sell_min > 0) {
          setArtifactPrice(res.artifact.sell_min);
        }
        if (res.journal_empty && res.journal_empty.sell_min > 0) {
          setEmptyJournalPrice(res.journal_empty.sell_min);
        }
        if (res.journal_full && res.journal_full.sell_min > 0) {
          setFullJournalPrice(res.journal_full.sell_min);
        }

        setPriceTimestamps({
          item: qData?.updated_at || res.crafted_item.updated_at,
          primary: res.primary_mat?.updated_at,
          secondary: res.secondary_mat?.updated_at,
          artifact: res.artifact?.updated_at,
        });

        const activeCityName = qData?.city || selectedCity;
        setPriceStatus(`Live sync: ${activeCityName} (${server})`);
      } else {
        setPriceStatus('Price server busy or no recent orders');
      }
    } catch (err) {
      console.warn('Crafting price fetch error:', err);
      setPriceStatus('Backend engine synchronizing...');
    } finally {
      setLoadingPrices(false);
    }
  };

  // Switch Quality
  const handleSelectQuality = (qId) => {
    setInspectQuality(qId);
    setValuationMode('inspect');
    const qData = qualityPrices[qId];
    if (qData && qData.sell_min > 0) {
      setItemSellPrice(qData.sell_min);
      setPriceTimestamps(prev => ({ ...prev, item: qData.updated_at }));
    }
  };

  // Auto-fetch prices on item, tier, enchantment, city, or server change
  useEffect(() => {
    if (autoFetchEnabled && selectedItem) {
      handleFetchPrices();
    }
  }, [selectedItem.id, selectedTier, selectedEnchantment, selectedCity, server, autoFetchEnabled]);

  // 1. Current Quality Odds (Buff-adjusted)
  // 1. Current Dynamic Quality Odds (Destiny Board Mastery, Spec, Food & Focus adjusted)
  const qualityMetrics = useMemo(() => {
    return computeDynamicQualityChances(masteryLevel, specLevel, hasCraftersSalad, useFocus);
  }, [masteryLevel, specLevel, hasCraftersSalad, useFocus]);

  const currentOdds = qualityMetrics.chances;

  // 2. Resolved Quality Prices with Intelligent Fallback Cascade
  const resolvedQualityPrices = useMemo(() => {
    const prices = {};
    const defaultSell = (TIER_DEFAULT_PRICES[selectedTier]?.sell) || 5000;
    const baseItemFallback = itemSellPrice > 0 ? itemSellPrice : defaultSell;

    // First pass: collect available prices or manual overrides
    for (let q = 1; q <= 5; q++) {
      const manual = manualQualityPrices[q];
      if (manual !== undefined && manual !== '' && !isNaN(Number(manual))) {
        prices[q] = {
          price: Math.max(0, parseFloat(manual)),
          isManual: true,
          isFallback: false,
          updatedAt: qualityPrices[q]?.updated_at || null,
          city: qualityPrices[q]?.city || selectedCity,
        };
      } else if (qualityPrices[q]?.sell_min > 0) {
        prices[q] = {
          price: qualityPrices[q].sell_min,
          isManual: false,
          isFallback: false,
          updatedAt: qualityPrices[q].updated_at || null,
          city: qualityPrices[q].city || selectedCity,
        };
      } else {
        prices[q] = null;
      }
    }

    // Cascade fallback: Higher quality items are never worth less than lower quality items
    let q1Price = prices[1]?.price;
    if (!q1Price) {
      for (let k = 2; k <= 5; k++) {
        if (prices[k]?.price) { q1Price = prices[k].price; break; }
      }
    }
    if (!q1Price) q1Price = baseItemFallback;

    let runningPrice = q1Price;
    for (let q = 1; q <= 5; q++) {
      if (prices[q]) {
        runningPrice = prices[q].price;
      } else {
        prices[q] = {
          price: runningPrice,
          isManual: false,
          isFallback: true,
          updatedAt: null,
          city: selectedCity,
        };
      }
    }

    return prices;
  }, [manualQualityPrices, qualityPrices, selectedTier, itemSellPrice, selectedCity]);

  // 3. Expected Value (EV) Weighted Sell Price
  const evSellPrice = useMemo(() => {
    let ev = 0;
    for (let q = 1; q <= 5; q++) {
      const chance = currentOdds[q] || 0;
      const p = resolvedQualityPrices[q]?.price || 0;
      ev += chance * p;
    }
    return Math.round(ev);
  }, [currentOdds, resolvedQualityPrices]);

  // 4. Actual Realized Craft Totals (when player enters what they actually rolled or simulated)
  const actualTotals = useMemo(() => {
    let totalItems = 0;
    let totalGrossRev = 0;
    for (let q = 1; q <= 5; q++) {
      const count = Number(actualQualityCounts[q]) || 0;
      totalItems += count;
      const unitPrice = resolvedQualityPrices[q]?.price || 0;
      totalGrossRev += count * unitPrice;
    }
    const avgPrice = totalItems > 0 ? Math.round(totalGrossRev / totalItems) : (resolvedQualityPrices[2]?.price || itemSellPrice);
    return {
      totalItems,
      totalGrossRev,
      avgPrice,
    };
  }, [actualQualityCounts, resolvedQualityPrices, itemSellPrice]);

  const effectiveBatchQuantity = useMemo(() => {
    if (valuationMode === 'actual' && actualTotals.totalItems > 0) {
      return actualTotals.totalItems;
    }
    return quantity;
  }, [valuationMode, actualTotals.totalItems, quantity]);

  // 5. Active Sell Price Fed into Engine
  const activeSellPrice = useMemo(() => {
    if (workflowPhase === 'plan') {
      // In Pre-Plan: Use honest, conservative Base Sale Price (Normal/Good quality)
      return itemSellPrice > 0 ? itemSellPrice : (resolvedQualityPrices[2]?.price || resolvedQualityPrices[1]?.price || 5000);
    }
    // In Post-Craft Realized Phase:
    if (valuationMode === 'actual') {
      return actualTotals.totalItems > 0 ? actualTotals.avgPrice : (resolvedQualityPrices[2]?.price || itemSellPrice);
    }
    if (valuationMode === 'floor') {
      return resolvedQualityPrices[1]?.price || itemSellPrice;
    }
    if (valuationMode === 'inspect') {
      return resolvedQualityPrices[inspectQuality]?.price || itemSellPrice;
    }
    return evSellPrice > 0 ? evSellPrice : itemSellPrice;
  }, [workflowPhase, valuationMode, actualTotals, inspectQuality, evSellPrice, resolvedQualityPrices, itemSellPrice]);

  // 6. Discrete Craft Roll Simulator
  const handleSimulateRoll = () => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const rollCount = Math.max(1, Math.round(qualityMetrics.totalRolls));
    
    for (let i = 0; i < quantity; i++) {
      let bestQ = 1;
      for (let r = 0; r < rollCount; r++) {
        const rand = Math.random();
        let rollQ = 1;
        if (rand >= BASE_QUALITY_CDF[3]) rollQ = 5;      // Masterpiece (top 0.02%)
        else if (rand >= BASE_QUALITY_CDF[2]) rollQ = 4; // Excellent
        else if (rand >= BASE_QUALITY_CDF[1]) rollQ = 3; // Outstanding
        else if (rand >= BASE_QUALITY_CDF[0]) rollQ = 2; // Good
        else rollQ = 1;                                  // Normal
        if (rollQ > bestQ) bestQ = rollQ;
      }
      counts[bestQ] = (counts[bestQ] || 0) + 1;
    }

    setActualQualityCounts(counts);
    setValuationMode('actual');

    if (quantity === 1) {
      const rolledQ = Number(Object.keys(counts).find(k => counts[k] === 1) || 2);
      const qMeta = ITEM_QUALITIES.find(q => q.id === rolledQ) || ITEM_QUALITIES[1];
      const price = resolvedQualityPrices[rolledQ]?.price || 0;
      setSimulationBanner({
        message: rolledQ === 5 
          ? `👑 JACKPOT! 1x Masterpiece Rolled on ${selectedItem.name}! Market Price: ${price.toLocaleString()} silver`
          : rolledQ === 4
          ? `🌟 Excellent Rolled on ${selectedItem.name}! Market Price: ${price.toLocaleString()} silver`
          : rolledQ === 3
          ? `✨ Outstanding Rolled on ${selectedItem.name}! Market Price: ${price.toLocaleString()} silver`
          : `🎲 ${qMeta.name} Rolled on ${selectedItem.name}. Market Price: ${price.toLocaleString()} silver`,
        tier: rolledQ,
        counts,
      });
    } else {
      const hasMp = (counts[5] || 0) > 0;
      setSimulationBanner({
        message: hasMp 
          ? `👑 JACKPOT in Batch! Rolled ${counts[5]}x Masterpiece in ${quantity} crafts!`
          : `🎲 Batch Simulated: ${counts[1] || 0} Normal, ${counts[2] || 0} Good, ${counts[3] || 0} Outstanding, ${counts[4] || 0} Excellent, ${counts[5] || 0} Masterpiece.`,
        tier: hasMp ? 5 : (counts[4] > 0 ? 4 : (counts[3] > 0 ? 3 : 2)),
        counts,
      });
    }
  };

  // Local calculation for immediate responsive feedback
  const localCalculation = useMemo(() => {
    return computeCrafting({
      item: selectedItem,
      tier: selectedTier,
      enchantment: selectedEnchantment,
      quantity: effectiveBatchQuantity,
      primaryMatPrice: primaryPrice,
      secondaryMatPrice: secondaryPrice,
      artifactPrice,
      itemSellPrice: activeSellPrice,
      city: selectedCity,
      useFocus,
      dailyBonusPct: dailyBonus,
      stationTaxPer100: stationTax,
      hasPremium,
      isSellOrder,
      includeJournals,
      emptyJournalPrice,
      fullJournalPrice,
      masteryLevel,
      specLevel,
    });
  }, [
    selectedItem,
    selectedTier,
    selectedEnchantment,
    effectiveBatchQuantity,
    primaryPrice,
    secondaryPrice,
    artifactPrice,
    activeSellPrice,
    selectedCity,
    useFocus,
    dailyBonus,
    stationTax,
    hasPremium,
    isSellOrder,
    includeJournals,
    emptyJournalPrice,
    fullJournalPrice,
    masteryLevel,
    specLevel,
  ]);

  // Query Authoritative Django Backend Engine
  useEffect(() => {
    let isCancelled = false;
    setIsBackendCalculating(true);

    const timer = setTimeout(async () => {
      try {
        const payload = {
          item_id: selectedItem.id,
          tier: selectedTier,
          enchantment: selectedEnchantment,
          quantity: effectiveBatchQuantity,
          primary_mat_price: primaryPrice,
          secondary_mat_price: secondaryPrice,
          artifact_price: artifactPrice,
          item_sell_price: activeSellPrice,
          city: selectedCity,
          use_focus: useFocus,
          daily_bonus_pct: dailyBonus,
          station_tax_per_100: stationTax,
          has_premium: hasPremium,
          is_sell_order: isSellOrder,
          include_journals: includeJournals,
          empty_journal_price: emptyJournalPrice,
          full_journal_price: fullJournalPrice,
          mastery_level: masteryLevel,
          spec_level: specLevel,
        };

        const backendResult = await calculateCraftingApi(payload);
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
    selectedItem.id,
    selectedTier,
    selectedEnchantment,
    effectiveBatchQuantity,
    primaryPrice,
    secondaryPrice,
    artifactPrice,
    activeSellPrice,
    selectedCity,
    useFocus,
    dailyBonus,
    stationTax,
    hasPremium,
    isSellOrder,
    includeJournals,
    emptyJournalPrice,
    fullJournalPrice,
    masteryLevel,
    specLevel,
  ]);

  // Use authoritative backend calculation if available, otherwise local fallback
  const calculation = backendCalculation || localCalculation;

  const canUseJournals = selectedTier >= 4;
  const totalBatchCost = calculation?.financials?.totalCost || 0;
  const taxRate = hasPremium ? 0.04 : 0.08;
  const setupFee = isSellOrder ? 0.025 : 0.0;
  const totalTaxMultiplier = 1.0 - (taxRate + setupFee);
  const journalProfit = (includeJournals && canUseJournals && calculation?.journals?.journalProfit) 
    ? calculation.journals.journalProfit 
    : 0;

  // Floor profit (assuming 100% rolls Normal Q1)
  const floorUnitSellPrice = resolvedQualityPrices[1]?.price || 0;
  const floorGrossRevenue = effectiveBatchQuantity * floorUnitSellPrice;
  const floorMarketTaxes = floorGrossRevenue * (taxRate + setupFee);
  const floorNetRevenue = floorGrossRevenue - floorMarketTaxes + journalProfit;
  const floorNetProfit = Math.round(floorNetRevenue - totalBatchCost);

  // Salad food buff uplift in silver per batch
  const batchSaladUplift = useMemo(() => {
    const baseOdds = BASE_QUALITY_CHANCES;
    let baseEvUnit = 0;
    for (let q = 1; q <= 5; q++) {
      baseEvUnit += (baseOdds[q] || 0) * (resolvedQualityPrices[q]?.price || 0);
    }
    const saladUpliftPerUnit = Math.max(0, evSellPrice - baseEvUnit);
    return Math.round(saladUpliftPerUnit * totalTaxMultiplier * effectiveBatchQuantity);
  }, [evSellPrice, resolvedQualityPrices, totalTaxMultiplier, effectiveBatchQuantity]);

  // Break-even sale price per unit
  const breakEvenUnitPrice = useMemo(() => {
    const neededNetRevenue = Math.max(0, totalBatchCost - journalProfit);
    return (effectiveBatchQuantity > 0 && totalTaxMultiplier > 0)
      ? Math.max(0, Math.ceil(neededNetRevenue / (effectiveBatchQuantity * totalTaxMultiplier)))
      : 0;
  }, [totalBatchCost, journalProfit, effectiveBatchQuantity, totalTaxMultiplier]);

  // Comprehensive 5-Tier Quality Ladder Data
  const qualityLadderData = useMemo(() => {
    const unitCost = effectiveBatchQuantity > 0 ? (totalBatchCost / effectiveBatchQuantity) : 0;
    const totalTaxRate = taxRate + setupFee;
    const unitJournal = (includeJournals && canUseJournals && calculation?.journals?.journalProfit) 
      ? (calculation.journals.journalProfit / effectiveBatchQuantity) 
      : 0;

    return ITEM_QUALITIES.map(q => {
      const odds = currentOdds[q.id] || 0;
      const resolved = resolvedQualityPrices[q.id];
      const price = resolved?.price || 0;
      const expectedUnits = quantity * odds;
      const actualCount = Number(actualQualityCounts[q.id]) || 0;
      
      const grossPerUnit = price;
      const taxPerUnit = grossPerUnit * totalTaxRate;
      const netRevenuePerUnit = grossPerUnit - taxPerUnit + unitJournal;
      const unitNetProfit = Math.round(netRevenuePerUnit - unitCost);
      const evContribution = Math.round(odds * price);

      return {
        ...q,
        odds,
        oddsPct: (odds * 100).toFixed(odds < 0.01 ? 2 : 1),
        price,
        actualCount,
        actualRevenue: actualCount * price,
        isFallback: resolved?.isFallback,
        isManual: resolved?.isManual,
        updatedAt: resolved?.updatedAt,
        city: resolved?.city,
        expectedUnits: expectedUnits >= 1 ? expectedUnits.toFixed(1) : expectedUnits.toFixed(2),
        unitNetProfit,
        evContribution,
      };
    });
  }, [totalBatchCost, effectiveBatchQuantity, quantity, taxRate, setupFee, includeJournals, canUseJournals, calculation, currentOdds, resolvedQualityPrices, actualQualityCounts]);

  // Item icon paths
  const itemIconSrc = `/items/${selectedItem.template.replace('{tier}', selectedTier)}.png`;
  const primaryIconSrc = `/items/${selectedItem.primaryMatIcon.replace('{tier}', selectedTier)}.png`;
  const secondaryIconSrc = selectedItem.secondaryMatIcon
    ? `/items/${selectedItem.secondaryMatIcon.replace('{tier}', selectedTier)}.png`
    : null;
  const artifactIconSrc = selectedItem.isArtifact && selectedItem.artifactTemplate
    ? `/items/${selectedItem.artifactTemplate.replace('{tier}', selectedTier)}.png`
    : null;
  const journalIconSrc = selectedTier >= 4
    ? `/items/${selectedItem.journalTemplate.replace('{tier}', selectedTier)}.png`
    : null;

  const artifactCountPerUnit = getArtifactQty(selectedItem, selectedTier);
  const isProfitable = calculation.financials.netProfit > 0;
  const isLowerTier = selectedTier < 4;
  const allowsEnchantment = selectedItem.allowEnchantment !== false && selectedTier >= 4;

  const upfrontJournalsCost = useMemo(() => {
    return (includeJournals && selectedTier >= 4 && calculation?.journals?.journalsFilled)
      ? Math.round(calculation.journals.journalsFilled * emptyJournalPrice)
      : 0;
  }, [includeJournals, selectedTier, calculation?.journals?.journalsFilled, emptyJournalPrice]);

  const totalUpfrontCapitalRequired = useMemo(() => {
    const mats = calculation?.financials?.upfrontMaterials || 0;
    const fee = calculation?.financials?.stationFee || 0;
    return mats + fee + upfrontJournalsCost;
  }, [calculation, upfrontJournalsCost]);

  const handleCopyShoppingList = () => {
    const primaryGross = calculation?.materials?.primaryGross || (quantity * (selectedItem.primaryQty || 0));
    const secondaryGross = calculation?.materials?.secondaryGross || (quantity * (selectedItem.secondaryQty || 0));
    const artCount = quantity * artifactCountPerUnit;
    const stationFee = calculation?.financials?.stationFee || 0;
    const netProfit = calculation?.financials?.netProfit || 0;
    const margin = calculation?.financials?.marginPct || 0;

    const lines = [
      `⚔️ ALBION ONLINE CRAFTING SHOPPING LIST`,
      `Item: ${quantity}x ${selectedItem.name} (T${selectedTier}.${selectedEnchantment})`,
      `City: ${selectedCity} (${calculation.returnRatePct}% Return Rate)`,
      `----------------------------------------`,
      `📦 MATERIALS TO BUY ON MARKET:`,
      `• ${primaryGross}x ${selectedItem.primaryMatName}${selectedEnchantment > 0 ? ` .${selectedEnchantment}` : ''} @ ${primaryPrice.toLocaleString()}s = ${(primaryGross * primaryPrice).toLocaleString()}s`,
    ];
    if (selectedItem.secondaryQty > 0) {
      lines.push(`• ${secondaryGross}x ${selectedItem.secondaryMatName}${selectedEnchantment > 0 ? ` .${selectedEnchantment}` : ''} @ ${secondaryPrice.toLocaleString()}s = ${(secondaryGross * secondaryPrice).toLocaleString()}s`);
    }
    if (selectedItem.isArtifact) {
      lines.push(`• ${artCount}x ${selectedItem.artifactName} @ ${artifactPrice.toLocaleString()}s = ${(artCount * artifactPrice).toLocaleString()}s`);
    }
    if (includeJournals && canUseJournals) {
      lines.push(`• ${calculation.journals.journalsFilled}x Empty ${selectedItem.journalName || 'Journals'} @ ${emptyJournalPrice.toLocaleString()}s = ${upfrontJournalsCost.toLocaleString()}s`);
    }
    lines.push(`----------------------------------------`);
    lines.push(`🪙 CASH TO BRING IN POCKET:`);
    lines.push(`• Station Nutrition Fee: ${stationFee.toLocaleString()}s`);
    if (hasCraftersSalad) {
      lines.push(`• Crafter's Salad / Potato Salad buff (Active: +150 Quality Power)`);
    }
    lines.push(`----------------------------------------`);
    lines.push(`💰 TOTAL UPFRONT SILVER NEEDED: ${totalUpfrontCapitalRequired.toLocaleString()}s`);
    lines.push(`📈 EXPECTED NET PROFIT: ${netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()}s (${margin}%)`);
    lines.push(`🎯 BREAK-EVEN SELL PRICE: ${breakEvenUnitPrice.toLocaleString()}s / item`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedShoppingList(true);
    setTimeout(() => setCopiedShoppingList(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Category Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-albion-border/80 pb-3">
        {Object.values(CRAFTING_CATEGORIES).map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                setSelectedSubcategory('all');
                setSearchQuery('');
                const firstInCat = CRAFTABLE_ITEMS.find((i) => i.category === cat.id);
                if (firstInCat) handleSelectItem(firstInCat);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-serif font-bold transition-all ${
                isActive
                  ? 'bg-albion-surface border border-albion-gold text-albion-gold shadow-gold-glow'
                  : 'bg-albion-card border border-albion-border text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              <span className="text-base">{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Workflow Phase Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-albion-card border border-albion-border shadow-lg">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
            workflowPhase === 'plan' 
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
          }`}>
            {workflowPhase === 'plan' ? <ShoppingCart className="w-5 h-5" /> : <Scale className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-serif font-bold text-slate-100 block">
                Crafting Workflow Phase
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                workflowPhase === 'plan'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}>
                {workflowPhase === 'plan' ? '🛒 Phase 1: Planning & Shopping' : '⚖️ Phase 2: Post-Craft Accounting'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {workflowPhase === 'plan' 
                ? "Planning your craft before buying: Calculate upfront capital, material shopping list, and profit forecast."
                : "Crafting in progress or finished: Log discrete quality rolls, simulation, and realized silver in your pocket."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => setWorkflowPhase('plan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold flex items-center gap-1.5 transition-all ${
              workflowPhase === 'plan'
                ? 'bg-gradient-to-r from-amber-600/30 to-amber-500/20 text-amber-200 border border-amber-500/70 shadow-gold-glow'
                : 'bg-albion-bg border border-albion-border text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
            <span>🛒 Pre-Craft Planner & Shopping List</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setWorkflowPhase('realized');
              setValuationMode('actual');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold flex items-center gap-1.5 transition-all ${
              workflowPhase === 'realized'
                ? 'bg-gradient-to-r from-emerald-600/30 to-emerald-500/20 text-emerald-200 border border-emerald-500/70 shadow-emerald-glow'
                : 'bg-albion-bg border border-albion-border text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            <span>⚖️ Post-Craft Realized Ledger</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Crafting Setup (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Item Grid Selector */}
          <div className="bg-albion-card border border-albion-border rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-albion-border/60 pb-3">
              <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5 font-serif">
                <Hammer className="w-3.5 h-3.5 text-albion-gold" />
                Select Craftable Item ({filteredItems.length})
              </label>
              
              <div className="flex items-center gap-2">
                {selectedItem.bonusCity ? (
                  <>
                    <span className="text-[11px] font-mono text-albion-gold">
                      Bonus City: <strong>{selectedItem.bonusCity}</strong> (+15%)
                    </span>
                    {selectedCity.toLowerCase() !== selectedItem.bonusCity.toLowerCase() && (
                      <button
                        type="button"
                        onClick={() => setSelectedCity(selectedItem.bonusCity)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all"
                        title={`Switch city to ${selectedItem.bonusCity} for +15% RRR`}
                      >
                        Snap to {selectedItem.bonusCity}
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-[11px] font-mono text-slate-400 bg-albion-bg px-2 py-0.5 rounded border border-albion-border">
                    Universal Craft (No City Bonus)
                  </span>
                )}
              </div>
            </div>

            {/* Quick Search & Subcategory Filter Bar */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search item name or artifact (e.g. Blazing, Brimstone, Dragon, Infinity, Cape...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-albion-bg border border-albion-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-albion-gold font-mono"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-200"
                  >
                    ✕
                  </button>
                )}
              </div>

              {availableSubcategories.length > 1 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedSubcategory('all')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all ${
                      selectedSubcategory === 'all'
                        ? 'bg-albion-gold text-albion-bg shadow-sm'
                        : 'bg-albion-bg border border-albion-border text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({CRAFTABLE_ITEMS.filter(i => i.category === activeCategory).length})
                  </button>
                  {availableSubcategories.map((sub) => {
                    const count = CRAFTABLE_ITEMS.filter(i => i.category === activeCategory && i.subcategory === sub).length;
                    const label = sub.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    const isSubActive = selectedSubcategory === sub;

                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setSelectedSubcategory(sub)}
                        className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all ${
                          isSubActive
                            ? 'bg-albion-gold text-albion-bg font-bold shadow-sm'
                            : 'bg-albion-bg border border-albion-border text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {label} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
              {filteredItems.map((item) => {
                const isSelected = selectedItemId === item.id;
                const min = item.minTier || 4;
                const max = item.maxTier || 8;
                const displayTier = Math.min(max, Math.max(min, selectedTier));
                const icon = `/items/${item.template.replace('{tier}', displayTier)}.png`;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    className={`p-2 rounded-xl border flex flex-col items-center text-center transition-all relative ${
                      isSelected
                        ? 'bg-albion-surface border-albion-gold text-slate-100 shadow-gold-glow ring-1 ring-albion-gold'
                        : 'bg-albion-bg/60 border-albion-border text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {item.isArtifact && (
                      <span className={`absolute top-1 right-1 text-[8px] font-mono font-bold px-1 rounded border ${getArtifactBadgeColor(item.artifactType)}`}>
                        {item.artifactType}
                      </span>
                    )}

                    <div className="w-12 h-12 my-1 flex items-center justify-center">
                      <ItemIcon 
                        src={icon} 
                        alt={item.name} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-200 truncate w-full">{item.name}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[9px] font-mono text-amber-400 bg-amber-950/40 px-1 rounded">
                        {item.maxTier && item.maxTier < 8 ? `T${item.minTier || 4}–T${item.maxTier}` : `T${min}+`}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 truncate">
                        {item.primaryQty} {item.primaryMatName}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tier & Enchantment Bars */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-albion-border/60">
              {/* Tier Selection (T2 to T8) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] uppercase font-semibold text-slate-400">
                    Item Tier
                  </label>
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    {(selectedItem.minTier || 4) <= 3 && (
                      <span className="text-emerald-400">
                        T{selectedItem.minTier} Available
                      </span>
                    )}
                    {selectedItem.maxTier && selectedItem.maxTier < 8 && (
                      <span className="text-amber-400">
                        Max Tier {selectedItem.maxTier}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 font-mono">
                  {TIERS.map((tier) => {
                    const min = selectedItem.minTier || 4;
                    const isMinEligible = tier.level >= min;
                    const isSelected = selectedTier === tier.level;

                    return (
                      <button
                        key={tier.level}
                        type="button"
                        disabled={!isMinEligible}
                        onClick={() => handleSelectTier(tier.level)}
                        className={`py-1.5 rounded-lg border text-xs font-bold text-center transition-all active:scale-95 ${
                          !isMinEligible
                            ? 'opacity-25 cursor-not-allowed bg-albion-bg/30 border-albion-border/30 text-slate-600'
                            : isSelected
                            ? `${tier.gemClass ? `${tier.gemClass} text-white font-extrabold shadow-lg ring-2 ring-albion-gold scale-105` : `${tier.color} ring-2 ring-albion-gold scale-105 shadow-md`}`
                            : 'bg-albion-bg/80 border-albion-border/70 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                        }`}
                        title={
                          !isMinEligible 
                            ? `${selectedItem.name} starts at Tier ${min}` 
                            : `${tier.name} (T${tier.level})`
                        }
                      >
                        T{tier.level}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Enchantment Selection */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] uppercase font-semibold text-slate-400">
                    Enchantment
                  </label>
                  {selectedItem.allowEnchantment === false ? (
                    <span className="text-[10px] font-mono text-amber-400 font-semibold">
                      .0 Flat Only (No Enchants)
                    </span>
                  ) : isLowerTier ? (
                    <span className="text-[10px] font-mono text-slate-500">
                      Flat .0 only for T{selectedTier}
                    </span>
                  ) : null}
                </div>
                <div className="grid grid-cols-5 gap-1.5 font-mono">
                  {ENCHANTMENTS.map((ench) => {
                    const isEnchantDisabled = !allowsEnchantment && ench.level > 0;
                    const isSelected = selectedEnchantment === ench.level;

                    return (
                      <button
                        key={ench.level}
                        type="button"
                        disabled={isEnchantDisabled}
                        onClick={() => {
                          setSelectedEnchantment(ench.level);
                          setManualQualityPrices({});
                        }}
                        className={`py-1.5 rounded-lg border text-xs font-bold text-center transition-all active:scale-95 ${
                          isEnchantDisabled
                            ? 'opacity-20 cursor-not-allowed bg-albion-bg/30 border-albion-border/30 text-slate-600'
                            : isSelected
                            ? (ench.level === 0 
                                ? 'bg-slate-700/90 border-slate-400 text-white ring-1 ring-slate-300 scale-105 shadow-md' 
                                : `ench-glow-${ench.level} ${ench.color} font-extrabold ring-1 ring-white/50 scale-105 shadow-lg`)
                            : 'bg-albion-bg/80 border-albion-border/70 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                        }`}
                        title={
                          selectedItem.allowEnchantment === false && ench.level > 0
                            ? `${selectedItem.name} does not have enchanted variants`
                            : isLowerTier && ench.level > 0
                            ? `Tier ${selectedTier} items cannot be enchanted`
                            : ench.name
                        }
                      >
                        {ench.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Destiny Board Mastery & Specialization Card */}
          <div className="bg-albion-card border border-albion-border rounded-xl shadow-xl overflow-hidden">
            <div 
              onClick={() => setIsDestinyBoardOpen(!isDestinyBoardOpen)}
              className="p-4 sm:p-5 flex flex-wrap items-center justify-between cursor-pointer hover:bg-albion-surface/40 transition-colors border-b border-albion-border/60 gap-2"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg border bg-amber-500/15 border-amber-500/40 text-amber-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs uppercase tracking-wider text-slate-200 font-semibold font-serif">
                      Destiny Board Mastery & Specialization
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 font-bold">
                      +{qualityMetrics.qualityPower} Quality Rating
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Destiny Board levels increase rerolls per craft and cut focus cost per item dynamically
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-albion-gold hidden sm:inline">
                  Mastery: {masteryLevel}/100 &bull; Spec: {specLevel}/120
                </span>
                <button
                  type="button"
                  className="p-1 rounded text-slate-400 hover:text-slate-200"
                >
                  {isDestinyBoardOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isDestinyBoardOpen && (
              <div className="p-4 sm:p-5 bg-albion-bg/40 space-y-4">
                {/* Telemetry pill strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                  <div className="bg-albion-card/80 p-2.5 rounded-lg border border-albion-border">
                    <span className="text-[9px] uppercase text-slate-400 block font-sans">Quality Rating</span>
                    <span className="text-sm font-bold text-amber-300">+{qualityMetrics.qualityPower}</span>
                    <span className="text-[9px] text-slate-500 block">({qualityMetrics.totalRolls} rolls/craft)</span>
                  </div>
                  <div className="bg-albion-card/80 p-2.5 rounded-lg border border-albion-border">
                    <span className="text-[9px] uppercase text-slate-400 block font-sans">Focus / Unit</span>
                    <span className="text-sm font-bold text-sky-400">{calculation.focusPerUnit}</span>
                    <span className="text-[9px] text-slate-500 block">({calculation.totalFocusNeeded.toLocaleString()} total)</span>
                  </div>
                  <div className="bg-albion-card/80 p-2.5 rounded-lg border border-albion-border">
                    <span className="text-[9px] uppercase text-slate-400 block font-sans">Normal Q1 Odds</span>
                    <span className="text-sm font-bold text-slate-300">{(currentOdds[1] * 100).toFixed(1)}%</span>
                    <span className="text-[9px] text-emerald-400 block">
                      {currentOdds[1] < 0.1 ? 'Normal almost extinct' : 'Base chance'}
                    </span>
                  </div>
                  <div className="bg-albion-card/80 p-2.5 rounded-lg border border-albion-border">
                    <span className="text-[9px] uppercase text-slate-400 block font-sans">Good + Out Odds</span>
                    <span className="text-sm font-bold text-emerald-300">
                      {(((currentOdds[2] || 0) + (currentOdds[3] || 0)) * 100).toFixed(1)}%
                    </span>
                    <span className="text-[9px] text-slate-500 block">Dominates results</span>
                  </div>
                </div>

                {/* Sliders Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Node Mastery */}
                  <div className="bg-albion-card/90 p-3.5 rounded-xl border border-albion-border space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-serif font-bold text-slate-200 block">
                          Category Crafting Mastery
                        </span>
                        <span className="text-[10px] text-slate-400">
                          +0.75 Quality Power &bull; +30 Focus Eff / lvl
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-mono">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={masteryLevel}
                          onChange={(e) => setMasteryLevel(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                          className="w-14 text-center bg-albion-bg border border-albion-border rounded py-0.5 text-xs font-bold text-albion-gold focus:outline-none focus:border-albion-gold"
                        />
                        <span className="text-[10px] text-slate-400">/ 100</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={masteryLevel}
                      onChange={(e) => setMasteryLevel(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex gap-1.5 pt-1">
                      {[0, 25, 50, 75, 100].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setMasteryLevel(lvl)}
                          className={`flex-1 py-0.5 rounded text-[10px] font-mono border transition-all ${
                            masteryLevel === lvl 
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                              : 'bg-albion-bg border-albion-border text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Item Specialization */}
                  <div className="bg-albion-card/90 p-3.5 rounded-xl border border-albion-border space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-serif font-bold text-slate-200 block truncate">
                          {selectedItem.name} Specialization
                        </span>
                        <span className="text-[10px] text-slate-400">
                          +6.00 Quality Power &bull; +250 Focus Eff / lvl
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-mono shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={specLevel}
                          onChange={(e) => setSpecLevel(Math.max(0, Math.min(120, parseInt(e.target.value) || 0)))}
                          className="w-14 text-center bg-albion-bg border border-albion-border rounded py-0.5 text-xs font-bold text-emerald-400 focus:outline-none focus:border-albion-gold"
                        />
                        <span className="text-[10px] text-slate-400">/ 120</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="120"
                      value={specLevel}
                      onChange={(e) => setSpecLevel(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex gap-1.5 pt-1">
                      {[
                        { lvl: 0, label: '0' },
                        { lvl: 50, label: '50' },
                        { lvl: 100, label: '100' },
                        { lvl: 120, label: '120 Elite' },
                      ].map(({ lvl, label }) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSpecLevel(lvl)}
                          className={`flex-1 py-0.5 rounded text-[10px] font-mono border transition-all ${
                            specLevel === lvl 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                              : 'bg-albion-bg border-albion-border text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Visual Recipe & Material Cost Inputs (Refined Mats + Artifact Slot) */}
          <div className="bg-albion-card border border-albion-border rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-albion-border/60 pb-2 gap-2">
              <h3 className="text-xs uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5 font-serif">
                <Coins className="w-3.5 h-3.5 text-albion-gold" />
                Recipe Inputs & Sale Price
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${selectedQualityMeta.badge}`}>
                  {selectedQualityMeta.name} Quality
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Batch: <strong>{quantity}x</strong>
                </span>
              </div>
            </div>

            {/* Live Price Sync Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-albion-bg/60 p-2.5 rounded-xl border border-albion-border/80">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleFetchPrices(selectedQuality)}
                  disabled={loadingPrices}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold bg-albion-card hover:bg-albion-surface border-albion-border hover:border-albion-gold text-slate-200 transition-all disabled:opacity-50 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-albion-gold ${loadingPrices ? 'animate-spin' : ''}`} />
                  <span>{loadingPrices ? 'Syncing...' : 'Fetch Live Prices'}</span>
                </button>

                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoFetchEnabled}
                    onChange={(e) => setAutoFetchEnabled(e.target.checked)}
                    className="accent-amber-500 rounded cursor-pointer"
                  />
                  <span>Auto-fetch</span>
                </label>
              </div>

              {priceStatus && (
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{priceStatus}</span>
                </div>
              )}
            </div>

            <div className={`grid gap-3 ${
              selectedItem.isArtifact 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' 
                : 'grid-cols-1 sm:grid-cols-3'
            }`}>
              {/* Primary Refined Material */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${getMaterialTactileClass(selectedItem.primaryMatName)}`}>
                <div className="w-11 h-11 shrink-0 bg-albion-surface/90 rounded-lg p-0.5 border border-albion-border flex items-center justify-center">
                  <ItemIcon 
                    src={primaryIconSrc} 
                    alt={selectedItem.primaryMatName} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[11px] font-semibold text-slate-100 block truncate">
                      {selectedItem.primaryMatName}{selectedEnchantment > 0 ? ` .${selectedEnchantment}` : ''} (x{selectedItem.primaryQty})
                    </label>
                    <span className="text-[8px] font-mono px-1 rounded bg-slate-800 text-slate-400 border border-slate-700/60 shrink-0">
                      Normal (Q1)
                    </span>
                  </div>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      min="0"
                      value={primaryPrice}
                      onChange={(e) => setPrimaryPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-albion-card/90 border border-albion-border rounded px-2 py-1 text-xs font-mono text-slate-100 focus:outline-none focus:border-albion-gold"
                    />
                    <span className="absolute right-1.5 top-1 text-[9px] text-slate-500 font-mono">silver</span>
                  </div>
                </div>
              </div>

              {/* Secondary Refined Material */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${
                selectedItem.secondaryQty > 0 
                  ? getMaterialTactileClass(selectedItem.secondaryMatName) 
                  : 'bg-albion-bg/30 border-albion-border/40 opacity-40'
              }`}>
                {selectedItem.secondaryQty > 0 ? (
                  <>
                    <div className="w-11 h-11 shrink-0 bg-albion-surface/90 rounded-lg p-0.5 border border-albion-border flex items-center justify-center">
                      <ItemIcon 
                        src={secondaryIconSrc} 
                        alt={selectedItem.secondaryMatName} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <label className="text-[11px] font-semibold text-slate-100 block truncate">
                          {selectedItem.secondaryMatName}{selectedEnchantment > 0 ? ` .${selectedEnchantment}` : ''} (x{selectedItem.secondaryQty})
                        </label>
                        <span className="text-[8px] font-mono px-1 rounded bg-slate-800 text-slate-400 border border-slate-700/60 shrink-0">
                          Normal (Q1)
                        </span>
                      </div>
                      <div className="relative mt-1">
                        <input
                          type="number"
                          min="0"
                          value={secondaryPrice}
                          onChange={(e) => setSecondaryPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full bg-albion-card/90 border border-albion-border rounded px-2 py-1 text-xs font-mono text-slate-100 focus:outline-none focus:border-albion-gold"
                        />
                        <span className="absolute right-1.5 top-1 text-[9px] text-slate-500 font-mono">silver</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-500 italic py-2 text-center w-full">
                    No secondary material
                  </div>
                )}
              </div>

              {/* Artifact Component Slot (if item is Artifact) */}
              {selectedItem.isArtifact && (
                <div className="bg-gradient-to-br from-purple-950/40 to-albion-card p-3 rounded-xl border border-purple-500/40 flex items-start gap-2.5 shadow-md">
                  <div className="w-11 h-11 shrink-0 bg-albion-surface rounded-lg p-0.5 border border-purple-500/40 flex items-center justify-center">
                    <ItemIcon 
                      src={artifactIconSrc} 
                      alt={selectedItem.artifactName} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-semibold text-purple-300 block truncate">
                        {selectedItem.artifactName} (x{artifactCountPerUnit})
                      </label>
                      <span className={`text-[8px] font-mono px-1 rounded border ${getArtifactBadgeColor(selectedItem.artifactType)}`}>
                        {selectedItem.artifactType}
                      </span>
                    </div>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        min="0"
                        value={artifactPrice}
                        onChange={(e) => setArtifactPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-albion-card border border-purple-500/50 rounded px-2 py-1 text-xs font-mono text-purple-200 focus:outline-none focus:border-albion-gold"
                      />
                      <span className="absolute right-1.5 top-1 text-[9px] text-slate-500 font-mono">silver</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Output Item Sale Price */}
              <div className="bg-albion-bg/90 p-3 rounded-xl border border-albion-gold/60 flex items-start gap-2.5 shadow-gold-glow">
                <div className="w-11 h-11 shrink-0 bg-albion-surface rounded-lg p-0.5 border border-albion-gold/40 flex items-center justify-center">
                  <ItemIcon 
                    src={itemIconSrc} 
                    alt="Output" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[11px] font-semibold text-slate-200 block truncate font-serif">
                      {workflowPhase === 'plan' ? 'Base Sale Price (Normal / Good)' : 'Realized Avg Sale Price'}
                    </label>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold ${
                      workflowPhase === 'plan' 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-gold-glow'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    }`}>
                      {workflowPhase === 'plan' ? '🛡️ Safe Base Price' : '🎲 Realized Avg'}
                    </span>
                  </div>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      min="0"
                      value={workflowPhase === 'plan' ? (itemSellPrice || 0) : activeSellPrice}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setItemSellPrice(val);
                        setManualQualityPrices(prev => ({ ...prev, 1: val, 2: val }));
                      }}
                      className="w-full bg-albion-card border border-albion-border rounded px-2 py-1 text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-albion-gold"
                    />
                    <span className="absolute right-1.5 top-1 text-[9px] text-slate-500 font-mono">silver</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-slate-400">
                    <span>
                      {workflowPhase === 'plan' ? 'Standard market baseline' : `Avg: ${activeSellPrice.toLocaleString()}s`}
                    </span>
                    {priceTimestamps.item && (
                      <span className={getFreshness(priceTimestamps.item).color.split(' ')[0]}>
                        {getFreshness(priceTimestamps.item).label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {selectedItem.isRoyal ? (
              <div className="bg-amber-950/20 px-3 py-1.5 rounded-lg border border-amber-600/30 text-[10px] text-amber-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Notice: Royal gear is created via Royal Transmutation combining base equipment and Royal Sigils. They have <strong>0% Return Rate</strong> and do not consume focus.</span>
              </div>
            ) : selectedItem.isFactionCape ? (
              <div className="bg-amber-950/20 px-3 py-1.5 rounded-lg border border-amber-600/30 text-[10px] text-amber-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Notice: Faction Capes are special transmutation recipes combining a base cape, faction crest, and faction hearts. They have <strong>0% Return Rate</strong> and do not consume focus.</span>
              </div>
            ) : selectedItem.isArtifact && (
              <div className="bg-purple-950/20 px-3 py-1.5 rounded-lg border border-purple-600/30 text-[10px] text-purple-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Notice: In Albion Online, <strong>Artifacts are 100% consumed</strong>. Resource Return Rate (RRR) refunds base materials only.</span>
              </div>
            )}
          </div>

          {/* 4. Backpack Quality Roll Tracker & Roll Simulator (rendered ONLY in 'realized' phase!) */}
          {workflowPhase === 'realized' && (
            <div className="bg-albion-card border border-emerald-500/50 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
              {/* Header with Crafter's Salad Buff Switch & Quality Power Badge */}
              <div className="flex flex-wrap items-center justify-between border-b border-albion-border/60 pb-3 gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Dices className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs uppercase tracking-wider text-slate-100 font-semibold font-serif">
                      Backpack Quality Roll Tracker & Simulator
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      +{qualityMetrics.qualityPower} Quality Rating ({qualityMetrics.totalRolls} rolls/craft)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Log the actual items that rolled into your inventory, or click Roll Simulator to test-drive discrete dice rolls.
                  </p>
                </div>

              {/* Crafter's Salad Buff Toggle & Roll Simulator */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSimulateRoll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold bg-gradient-to-r from-amber-600/30 to-amber-500/20 hover:from-amber-600/50 hover:to-amber-500/40 border-amber-500/60 text-amber-200 shadow-gold-glow transition-all active:scale-95"
                  title={`Simulate discrete game roll for ${quantity} craft${quantity > 1 ? 's' : ''} using your Destiny Board roll power`}
                >
                  <Dices className="w-3.5 h-3.5 text-amber-400" />
                  <span>🎲 Roll Craft Simulator ({quantity}x)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHasCraftersSalad(!hasCraftersSalad)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all active:scale-95 ${
                    hasCraftersSalad
                      ? 'bg-amber-950/40 border-amber-500/70 text-amber-200 shadow-gold-glow ring-1 ring-amber-400/40'
                      : 'bg-albion-bg border-albion-border text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle Crafter's Salad / Potato Salad buff (+150 Quality Bonus rating)"
                >
                  <Utensils className={`w-3.5 h-3.5 ${hasCraftersSalad ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>Crafter's Salad:</span>
                  <span className={`font-mono font-bold ${hasCraftersSalad ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {hasCraftersSalad ? '+150 ACTIVE' : 'OFF'}
                  </span>
                </button>
              </div>
            </div>

            {/* Simulation Notification Banner */}
            {simulationBanner && (
              <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 animate-stagger-fade ${
                simulationBanner.tier === 5 
                  ? 'bg-amber-950/70 border-amber-400/90 shadow-gold-glow text-amber-200' 
                  : simulationBanner.tier === 4 
                  ? 'bg-purple-950/60 border-purple-500/80 text-purple-200' 
                  : simulationBanner.tier === 3 
                  ? 'bg-sky-950/60 border-sky-500/80 text-sky-200' 
                  : 'bg-albion-surface border-albion-border text-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Dices className={`w-4 h-4 shrink-0 ${simulationBanner.tier === 5 ? 'text-amber-400 animate-bounce' : 'text-slate-300'}`} />
                  <span className="text-xs font-serif font-bold">{simulationBanner.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSimulationBanner(null)}
                  className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded border border-white/10"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Valuation Mode Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-albion-bg/60 p-2.5 rounded-xl border border-albion-border/80">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] font-serif uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1 mr-1">
                  <Scale className="w-3.5 h-3.5 text-albion-gold" />
                  Valuation Mode:
                </span>
                <button
                  type="button"
                  onClick={() => setValuationMode('ev')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all active:scale-95 ${
                    valuationMode === 'ev'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-gold-glow font-bold'
                      : 'bg-albion-card border-albion-border/70 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Probability-weighted return based on your exact Destiny Board specs and food"
                >
                  ✨ Statistical EV <span className="text-[9px] opacity-80 font-normal">[Forecast]</span>
                </button>

                <button
                  type="button"
                  onClick={() => setValuationMode('actual')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all active:scale-95 ${
                    valuationMode === 'actual'
                      ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/70 shadow-emerald-glow font-bold'
                      : 'bg-albion-card border-albion-border/70 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Enter exact items rolled (e.g. 1 Masterpiece jackpot, or actual craft results)"
                >
                  🎲 Actual Realized Craft ({actualTotals.totalItems}x)
                </button>

                <button
                  type="button"
                  onClick={() => setValuationMode('floor')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all active:scale-95 ${
                    valuationMode === 'floor'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/60 font-bold'
                      : 'bg-albion-card border-albion-border/70 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Assume 100% of your crafts roll worst-case Normal (Q1)"
                >
                  🛡️ Floor (Normal Q1)
                </button>

                <button
                  type="button"
                  onClick={() => setValuationMode('inspect')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all active:scale-95 ${
                    valuationMode === 'inspect'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/60 font-bold'
                      : 'bg-albion-card border-albion-border/70 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Inspect economics of a single specific quality tier"
                >
                  🎯 Inspect ({selectedQualityMeta.name})
                </button>
              </div>

              {Object.keys(manualQualityPrices).length > 0 && (
                <button
                  type="button"
                  onClick={() => setManualQualityPrices({})}
                  className="text-[10px] text-amber-400 hover:text-amber-300 underline font-mono flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Overrides
                </button>
              )}
            </div>

            {/* 5-Tier Odds & Valuation Ladder */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-semibold text-slate-400 px-3 py-1 font-mono">
                <div className="col-span-3">Quality Tier</div>
                <div className="col-span-2">Roll Probability</div>
                <div className="col-span-3 text-right">Market Price</div>
                <div className="col-span-2 text-right">Unit Net Profit</div>
                <div className="col-span-2 text-right">
                  {valuationMode === 'actual' ? 'Actual Rolled' : 'EV Silver'}
                </div>
              </div>

              {qualityLadderData.map((q) => {
                const isInspected = inspectQuality === q.id && valuationMode === 'inspect';
                const isProfitableTier = q.unitNetProfit >= 0;

                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      setInspectQuality(q.id);
                      if (valuationMode !== 'inspect' && valuationMode !== 'actual') setValuationMode('inspect');
                    }}
                    className={`grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl border transition-all cursor-pointer active:scale-[0.99] ${
                      isInspected
                        ? `${q.color} ring-1 ring-white/50 shadow-lg scale-[1.01]`
                        : 'border-albion-border/80 bg-albion-surface/40 hover:bg-albion-surface/80 hover:border-slate-600'
                    }`}
                  >
                    {/* Quality Badge & Name */}
                    <div className="col-span-3 flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${q.badge.includes('amber') ? 'bg-amber-400 shadow-gold-glow' : q.badge.includes('purple') ? 'bg-purple-400' : q.badge.includes('sky') ? 'bg-sky-400' : q.badge.includes('emerald') ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                      <div className="truncate">
                        <span className="text-xs font-serif font-bold text-slate-100 block truncate">
                          {q.name}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">
                          Q{q.id} &bull; est. ~{q.expectedUnits}x
                        </span>
                      </div>
                    </div>

                    {/* Roll Probability Bar */}
                    <div className="col-span-2">
                      <div className="flex items-baseline justify-between font-mono text-[10px] mb-0.5">
                        <span className="font-bold text-slate-200">{q.oddsPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-albion-bg rounded-full overflow-hidden border border-albion-border/50">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            q.id === 5 ? 'bg-amber-400' : q.id === 4 ? 'bg-purple-400' : q.id === 3 ? 'bg-sky-400' : q.id === 2 ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                          style={{ width: `${Math.max(2, Math.min(100, q.odds * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* Market Price & Input */}
                    <div className="col-span-3 text-right">
                      <div className="relative inline-block w-full max-w-[120px]">
                        <input
                          type="number"
                          min="0"
                          value={manualQualityPrices[q.id] !== undefined ? manualQualityPrices[q.id] : q.price}
                          onChange={(e) => {
                            const val = e.target.value;
                            setManualQualityPrices(prev => ({ ...prev, [q.id]: val }));
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-albion-card/90 border border-albion-border/80 focus:border-albion-gold rounded px-1.5 py-0.5 text-right font-mono text-xs font-bold text-amber-300 focus:outline-none"
                        />
                      </div>
                      <div className="text-[8px] font-mono mt-0.5 truncate text-slate-400">
                        {q.isFallback ? (
                          <span className="text-amber-400/80">Cascaded fallback</span>
                        ) : q.isManual ? (
                          <span className="text-sky-300">Manual override</span>
                        ) : q.updatedAt ? (
                          <span className={getFreshness(q.updatedAt).color.split(' ')[0]}>{getFreshness(q.updatedAt).label}</span>
                        ) : (
                          <span>Market sync</span>
                        )}
                      </div>
                    </div>

                    {/* Unit Profit / Loss */}
                    <div className="col-span-2 text-right">
                      <span className={`inline-block font-mono text-xs font-bold px-1.5 py-0.5 rounded border ${
                        isProfitableTier
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/50'
                          : 'bg-rose-950/60 text-rose-300 border-rose-600/50'
                      }`}>
                        {q.unitNetProfit >= 0 ? '+' : ''}{q.unitNetProfit.toLocaleString()}s
                      </span>
                      <span className="block text-[8px] font-mono text-slate-400 mt-0.5">
                        per item
                      </span>
                    </div>

                    {/* EV Silver Contribution OR Actual Rolled Counter */}
                    {valuationMode === 'actual' ? (
                      <div className="col-span-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 font-mono">
                          <button
                            type="button"
                            onClick={() => {
                              setActualQualityCounts(prev => ({ ...prev, [q.id]: Math.max(0, (prev[q.id] || 0) - 1) }));
                            }}
                            className="w-5 h-5 rounded bg-albion-card border border-albion-border text-slate-300 hover:border-albion-gold flex items-center justify-center text-xs active:scale-95"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={actualQualityCounts[q.id] || 0}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setActualQualityCounts(prev => ({ ...prev, [q.id]: val }));
                            }}
                            className="w-10 text-center bg-albion-card border border-albion-border/90 rounded py-0.5 text-xs font-bold text-amber-300 focus:outline-none focus:border-albion-gold"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setActualQualityCounts(prev => ({ ...prev, [q.id]: (prev[q.id] || 0) + 1 }));
                            }}
                            className="w-5 h-5 rounded bg-albion-card border border-albion-border text-slate-300 hover:border-albion-gold flex items-center justify-center text-xs active:scale-95"
                          >
                            +
                          </button>
                        </div>
                        <span className="block text-[8px] text-slate-400 font-mono mt-0.5">
                          {actualQualityCounts[q.id] ? `${((actualQualityCounts[q.id] || 0) * q.price).toLocaleString()}s` : '0 rolled'}
                        </span>
                      </div>
                    ) : (
                      <div className="col-span-2 text-right font-mono">
                        <span className="text-xs font-bold text-slate-200">
                          +{q.evContribution.toLocaleString()}s
                        </span>
                        <span className="block text-[8px] text-slate-400">
                          EV share
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* In Actual Mode: Sync bar */}
            {valuationMode === 'actual' && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-xs font-mono">
                <span className="text-slate-300">
                  Actual Rolled: <strong className="text-emerald-400">{actualTotals.totalItems} items</strong> (Revenue: {actualTotals.totalGrossRev.toLocaleString()} silver)
                </span>
                {actualTotals.totalItems !== quantity && actualTotals.totalItems > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuantity(actualTotals.totalItems)}
                    className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 font-bold transition-all"
                  >
                    Set Batch Size to {actualTotals.totalItems}x
                  </button>
                )}
              </div>
            )}

            {/* Realism Footer Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-albion-border/60 text-xs font-mono">
              <div className="bg-albion-bg/60 p-2 rounded-lg border border-albion-border/60">
                <span className="text-[9px] uppercase text-slate-500 block font-sans">Active Effective Price</span>
                <span className="text-sm font-bold text-albion-gold">{activeSellPrice.toLocaleString()}s</span>
              </div>

              <div className="bg-albion-bg/60 p-2 rounded-lg border border-albion-border/60">
                <span className="text-[9px] uppercase text-slate-500 block font-sans">Floor Value (Worst-Case Q1)</span>
                <span className="text-sm font-bold text-slate-300">{(resolvedQualityPrices[1]?.price || 0).toLocaleString()}s</span>
              </div>

              <div className="bg-albion-bg/60 p-2 rounded-lg border border-albion-border/60">
                <span className="text-[9px] uppercase text-slate-500 block font-sans">Crafter Salad Uplift</span>
                <span className="text-sm font-bold text-amber-400">+{batchSaladUplift.toLocaleString()}s / batch</span>
              </div>

              <div className="bg-albion-bg/60 p-2 rounded-lg border border-albion-border/60">
                <span className="text-[9px] uppercase text-slate-500 block font-sans">Break-Even Unit Price</span>
                <span className="text-sm font-bold text-sky-300">{breakEvenUnitPrice.toLocaleString()}s</span>
              </div>
            </div>
          </div>
        )}

          {/* 3. Crafting Journals System with Explicit ON / OFF Toggle */}
          <div className="bg-albion-card border border-albion-border rounded-xl p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-albion-border/60 pb-2.5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-slate-200 font-semibold font-serif">
                    Crafting Journals (Fame Profit)
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Optionally fill laborer journals while crafting for additional silver
                  </p>
                </div>
              </div>

              {/* Journal Active Switch */}
              <button
                type="button"
                onClick={() => setIncludeJournals(!includeJournals)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all ${
                  includeJournals
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-gold-glow'
                    : 'bg-albion-bg border-albion-border text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${includeJournals ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
                {includeJournals ? 'Journals ENABLED' : 'Journals DISABLED'}
              </button>
            </div>

            {/* When Journals are Disabled */}
            {!includeJournals && (
              <div className="bg-albion-bg/40 p-3 rounded-lg border border-albion-border/60 text-xs text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  Journals are turned <strong>OFF</strong>. Calculating raw item crafting profit only (zero journal overhead).
                </span>
                <button 
                  type="button"
                  onClick={() => setIncludeJournals(true)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline shrink-0 ml-2"
                >
                  Enable Journals
                </button>
              </div>
            )}

            {/* When Journals are Enabled but Tier is T2 or T3 */}
            {includeJournals && !canUseJournals && (
              <div className="bg-amber-950/30 p-3 rounded-lg border border-amber-600/40 text-xs text-amber-300/90 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <strong className="block text-amber-300">Notice: Crafting Journals start at Tier 4</strong>
                  <span className="text-[11px] text-amber-200/80">
                    Albion Online does not have T{selectedTier} laborer journals. Crafting Tier {selectedTier} items generates zero journal fame profit.
                  </span>
                </div>
              </div>
            )}

            {/* When Journals are Enabled and Tier >= 4 */}
            {includeJournals && canUseJournals && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-1">
                <div className="flex items-center gap-2.5 bg-albion-bg/60 p-2.5 rounded-lg border border-albion-border">
                  <div className="w-10 h-10 shrink-0 bg-albion-surface rounded p-0.5 border border-albion-border flex items-center justify-center">
                    <ItemIcon 
                      src={journalIconSrc} 
                      alt="Journal" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-200 block truncate">
                      {selectedItem.journalName} (T{selectedTier})
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      Fills ~{calculation.journals.journalsFilled} journals
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-1">
                    Empty Journal Buy Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={emptyJournalPrice}
                    onChange={(e) => setEmptyJournalPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-albion-bg border border-albion-border rounded px-2 py-1 text-xs font-mono text-slate-100 focus:outline-none focus:border-albion-gold"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-1">
                    Full Journal Sell Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={fullJournalPrice}
                    onChange={(e) => setFullJournalPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-albion-bg border border-albion-border rounded px-2 py-1 text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-albion-gold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. City, Station Fee & Quantity */}
          <div className="bg-albion-card border border-albion-border rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5 font-serif">
                  <MapPin className="w-3.5 h-3.5 text-albion-gold" />
                  Crafting City Location
                </label>
                <span className="text-[11px] font-mono">
                  {selectedItem.isNoReturn || selectedItem.isRoyal ? (
                    <span className="text-slate-400 font-semibold">
                      Transmute Recipe (0% Return Rate)
                    </span>
                  ) : selectedItem.bonusCity ? (
                    selectedCity.toLowerCase() === selectedItem.bonusCity.toLowerCase() ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        Matching City Specialty (+15% Production Bonus)
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Standard City (18% Royal Base)
                      </span>
                    )
                  ) : (
                    <span className="text-slate-400 font-semibold">
                      Standard Royal City (18% Base, No City Specialty)
                    </span>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 font-mono">
                {CITIES.filter(c => c.name !== 'Island').map((c) => {
                  const isSelected = selectedCity === c.name;
                  const isSpecialty = Boolean(selectedItem.bonusCity && c.name.toLowerCase() === selectedItem.bonusCity.toLowerCase());
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedCity(c.name)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        isSelected
                          ? 'bg-albion-surface border-albion-gold text-slate-100 shadow-gold-glow'
                          : 'bg-albion-bg border-albion-border text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold">{c.name}</div>
                      {isSpecialty && <div className="text-[9px] text-emerald-400 font-bold">+15%</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="text-[11px] uppercase font-semibold text-slate-400 block mb-1">
                  Crafting Batch Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-albion-bg border border-albion-border rounded-lg px-3 py-1.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-albion-gold"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-semibold text-slate-400 block mb-1">
                  Station Tax (per 100 food)
                </label>
                <input
                  type="number"
                  min="0"
                  value={stationTax}
                  onChange={(e) => setStationTax(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-albion-bg border border-albion-border rounded-lg px-3 py-1.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-albion-gold"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-semibold text-slate-400 block mb-1">
                  Crafter's Salad Buff
                </label>
                <button
                  type="button"
                  onClick={() => setHasCraftersSalad(!hasCraftersSalad)}
                  className={`w-full py-1.5 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    hasCraftersSalad
                      ? 'bg-amber-500/20 text-amber-200 border-amber-500/60 shadow-gold-glow'
                      : 'bg-albion-bg border-albion-border text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle Crafter's Salad / Potato Salad buff (+150 Quality Rating)"
                >
                  <Utensils className={`w-3.5 h-3.5 ${hasCraftersSalad ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{hasCraftersSalad ? '+150 ACTIVE' : 'OFF'}</span>
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    Daily Event Bonus
                  </label>
                  {dailyBonus > 0 && (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      +{dailyBonus}%
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1 font-mono">
                  {[
                    { val: 0, label: '0%' },
                    { val: 10, label: '+10%' },
                    { val: 20, label: '+20%' },
                  ].map((b) => (
                    <button
                      key={b.val}
                      type="button"
                      onClick={() => setDailyBonus(b.val)}
                      className={`py-1.5 rounded-lg border text-xs font-bold text-center transition-all ${
                        dailyBonus === b.val
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-gold-glow ring-1 ring-amber-400/40'
                          : 'bg-albion-bg border-albion-border text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Crafting Profit Ledger (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Pre-Craft Shopping List & Required Upfront Capital (when in 'plan' phase) */}
          {workflowPhase === 'plan' && (
            <div className="bg-albion-card border border-albion-gold/60 rounded-xl p-5 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between border-b border-albion-border/60 pb-3 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-albion-gold">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-slate-100 font-bold font-serif flex items-center gap-1.5">
                      Pre-Craft Procurement & Shopping List
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Exact items to buy on the Market Board before heading to the crafting station
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyShoppingList}
                    className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-500/50 shadow-gold-glow transition-all active:scale-95"
                    title="Copy full procurement shopping list to clipboard for Discord or notepad"
                  >
                    {copiedShoppingList ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Copy Shopping List</span>
                      </>
                    )}
                  </button>

                  {Object.values(shoppingChecked).some(Boolean) && (
                    <button
                      type="button"
                      onClick={() => setShoppingChecked({})}
                      className="text-[10px] text-slate-400 hover:text-slate-200 underline font-mono"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Big Upfront Cash In Wallet Requirement */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-albion-bg to-albion-surface border border-albion-gold/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-300 font-serif flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-albion-gold" />
                    Total Cash Required In Inventory:
                  </span>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    Wallet Budget
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <h2 className="font-mono text-2xl sm:text-3xl font-extrabold text-albion-gold tracking-tight">
                    {totalUpfrontCapitalRequired.toLocaleString()}
                  </h2>
                  <span className="font-mono text-xs text-slate-400">silver needed</span>
                </div>

                <p className="text-[10px] text-slate-400 mt-1">
                  You must possess this liquid silver in your bag to buy raw ingredients, empty journals, and pay station nutrition fees.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-albion-border/40 text-[10px] font-mono text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Upfront Mats:</span>
                    <strong className="text-slate-200">{calculation.financials.upfrontMaterials.toLocaleString()}s</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Station Tax:</span>
                    <strong className="text-rose-300">{calculation.financials.stationFee.toLocaleString()}s</strong>
                  </div>
                  {includeJournals && canUseJournals && (
                    <div>
                      <span className="text-slate-500 block">Empty Journals:</span>
                      <strong className="text-amber-300">{upfrontJournalsCost.toLocaleString()}s</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Checklist Table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
                  <span>MARKET PROCUREMENT CHECKLIST</span>
                  <span>CLICK CHECKBOX AS YOU BUY</span>
                </div>

                {/* Primary Material Item */}
                <div 
                  onClick={() => setShoppingChecked(prev => ({ ...prev, primary: !prev.primary }))}
                  className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                    shoppingChecked.primary 
                      ? 'bg-emerald-950/20 border-emerald-500/40 line-through opacity-75' 
                      : 'bg-albion-bg/70 border-albion-border hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={!!shoppingChecked.primary}
                      onChange={() => {}}
                      className="accent-amber-500 rounded cursor-pointer"
                    />
                    <ItemIcon 
                      src={primaryIconSrc} 
                      alt="" 
                      className="w-7 h-7 object-contain bg-albion-surface rounded p-0.5 border border-albion-border"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-200 block truncate font-mono">
                        {calculation.materials.primaryGross}x {selectedItem.primaryMatName}{selectedEnchantment > 0 ? ` .${selectedEnchantment}` : ''}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        @{primaryPrice.toLocaleString()}s each
                      </span>
                    </div>
                  </div>
                  <div className="font-mono text-right shrink-0">
                    <span className="text-xs font-bold text-albion-gold">
                      {(calculation.materials.primaryGross * primaryPrice).toLocaleString()}s
                    </span>
                    <span className="block text-[8px] text-slate-500">primary mat</span>
                  </div>
                </div>

                {/* Secondary Material Item (if applicable) */}
                {selectedItem.secondaryQty > 0 && (
                  <div 
                    onClick={() => setShoppingChecked(prev => ({ ...prev, secondary: !prev.secondary }))}
                    className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                      shoppingChecked.secondary 
                        ? 'bg-emerald-950/20 border-emerald-500/40 line-through opacity-75' 
                        : 'bg-albion-bg/70 border-albion-border hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={!!shoppingChecked.secondary}
                        onChange={() => {}}
                        className="accent-amber-500 rounded cursor-pointer"
                      />
                      <ItemIcon 
                        src={secondaryIconSrc} 
                        alt="" 
                        className="w-7 h-7 object-contain bg-albion-surface rounded p-0.5 border border-albion-border"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-200 block truncate font-mono">
                          {calculation.materials.secondaryGross}x {selectedItem.secondaryMatName}{selectedEnchantment > 0 ? ` .${selectedEnchantment}` : ''}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          @{secondaryPrice.toLocaleString()}s each
                        </span>
                      </div>
                    </div>
                    <div className="font-mono text-right shrink-0">
                      <span className="text-xs font-bold text-albion-gold">
                        {(calculation.materials.secondaryGross * secondaryPrice).toLocaleString()}s
                      </span>
                      <span className="block text-[8px] text-slate-500">secondary mat</span>
                    </div>
                  </div>
                )}

                {/* Artifact Slot (if applicable) */}
                {selectedItem.isArtifact && (
                  <div 
                    onClick={() => setShoppingChecked(prev => ({ ...prev, artifact: !prev.artifact }))}
                    className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                      shoppingChecked.artifact 
                        ? 'bg-purple-950/20 border-purple-500/40 line-through opacity-75' 
                        : 'bg-gradient-to-r from-purple-950/30 to-albion-bg border-purple-500/40 hover:border-purple-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={!!shoppingChecked.artifact}
                        onChange={() => {}}
                        className="accent-purple-500 rounded cursor-pointer"
                      />
                      <ItemIcon 
                        src={artifactIconSrc} 
                        alt="" 
                        className="w-7 h-7 object-contain bg-albion-surface rounded p-0.5 border border-purple-500/40"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-purple-200 block truncate font-mono">
                          {quantity * artifactCountPerUnit}x {selectedItem.artifactName}
                        </span>
                        <span className="text-[10px] text-purple-300/80 font-mono">
                          @{artifactPrice.toLocaleString()}s each
                        </span>
                      </div>
                    </div>
                    <div className="font-mono text-right shrink-0">
                      <span className="text-xs font-bold text-purple-300">
                        {calculation.materials.artifactGrossCost.toLocaleString()}s
                      </span>
                      <span className="block text-[8px] text-purple-400">artifact item</span>
                    </div>
                  </div>
                )}

                {/* Empty Journals (if applicable) */}
                {includeJournals && canUseJournals && (
                  <div 
                    onClick={() => setShoppingChecked(prev => ({ ...prev, journals: !prev.journals }))}
                    className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                      shoppingChecked.journals 
                        ? 'bg-emerald-950/20 border-emerald-500/40 line-through opacity-75' 
                        : 'bg-albion-bg/70 border-albion-border hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={!!shoppingChecked.journals}
                        onChange={() => {}}
                        className="accent-amber-500 rounded cursor-pointer"
                      />
                      <ItemIcon 
                        src={journalIconSrc} 
                        alt="" 
                        className="w-7 h-7 object-contain bg-albion-surface rounded p-0.5 border border-albion-border"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-200 block truncate font-mono">
                          {calculation.journals.journalsFilled}x Empty {selectedItem.journalName || 'Journals'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          @{emptyJournalPrice.toLocaleString()}s each
                        </span>
                      </div>
                    </div>
                    <div className="font-mono text-right shrink-0">
                      <span className="text-xs font-bold text-amber-300">
                        {upfrontJournalsCost.toLocaleString()}s
                      </span>
                      <span className="block text-[8px] text-slate-500">empty books</span>
                    </div>
                  </div>
                )}

                {/* Station Nutrition Tax In Pocket */}
                <div 
                  onClick={() => setShoppingChecked(prev => ({ ...prev, stationFee: !prev.stationFee }))}
                  className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                    shoppingChecked.stationFee 
                      ? 'bg-rose-950/20 border-rose-500/40 line-through opacity-75' 
                      : 'bg-albion-bg/70 border-albion-border hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={!!shoppingChecked.stationFee}
                      onChange={() => {}}
                      className="accent-rose-500 rounded cursor-pointer"
                    />
                    <div className="w-7 h-7 bg-albion-surface rounded flex items-center justify-center text-rose-400 border border-albion-border text-xs font-bold">
                      🏛️
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-200 block truncate font-mono">
                        Station Nutrition Fee (Silver in Purse)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Tax: {stationTax} / 100 food
                      </span>
                    </div>
                  </div>
                  <div className="font-mono text-right shrink-0">
                    <span className="text-xs font-bold text-rose-300">
                      {calculation.financials.stationFee.toLocaleString()}s
                    </span>
                    <span className="block text-[8px] text-slate-500">station owner</span>
                  </div>
                </div>
              </div>

              {/* Resource Return Rate & Recycling Ledger */}
              <div className="p-3 rounded-xl bg-albion-bg/80 border border-albion-border/70 text-xs font-mono space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px] font-sans flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    Resource Return Rate ({calculation.returnRatePct}%):
                  </span>
                  <span className="font-bold text-sky-300">
                    +{calculation.materials.primaryReturned} {selectedItem.primaryMatName} returned
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                  During crafting, the station refunds {calculation.returnRatePct}% of refined materials back to your bag. 
                  Your <strong>Net Cost</strong> is lower, but you need the full <strong>{totalUpfrontCapitalRequired.toLocaleString()}s</strong> upfront to craft the first batch.
                </p>
              </div>
            </div>
          )}

          {/* Main Profit Card */}
          <div className={`rounded-xl border p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all ${
            isProfitable
              ? 'bg-gradient-to-br from-emerald-950/40 via-albion-card to-albion-surface border-emerald-600/40'
              : 'bg-gradient-to-br from-rose-950/40 via-albion-card to-albion-surface border-rose-600/40'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 font-serif">
                  {workflowPhase === 'plan' 
                    ? 'Conservative Net Crafting Profit (Base Price Forecast)' 
                    : valuationMode === 'ev' 
                    ? 'Expected Net Crafting Profit (EV Weighted)' 
                    : valuationMode === 'floor' 
                    ? 'Floor Net Crafting Profit (Worst-Case Q1)' 
                    : valuationMode === 'actual'
                    ? 'Realized Net Crafting Profit (Actual Backpack Rolls)'
                    : `Inspected Profit (Q${inspectQuality} ${selectedQualityMeta.name})`}
                </span>
                <span 
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                    isBackendConnected
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  }`}
                  title={isBackendConnected ? "Authoritative calculation computed by Django backend API" : "Using local client fallback math"}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isBackendCalculating ? 'bg-sky-400 animate-ping' : (isBackendConnected ? 'bg-emerald-400' : 'bg-amber-400')
                  }`} />
                  <span>{isBackendCalculating ? 'Django Calculating' : (isBackendConnected ? 'Django Engine' : 'Client Math')}</span>
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                isProfitable ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                {calculation.financials.marginPct >= 0 ? `+${calculation.financials.marginPct}%` : `${calculation.financials.marginPct}%`} Margin ({workflowPhase === 'plan' ? 'Base Price' : (valuationMode === 'ev' ? 'EV' : valuationMode === 'floor' ? 'Floor' : valuationMode === 'actual' ? 'Actual' : 'Inspect')})
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <h2 className={`font-mono text-3xl sm:text-4xl font-extrabold tracking-tight ${
                isProfitable ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {calculation.financials.netProfit >= 0 ? '+' : ''}{calculation.financials.netProfit.toLocaleString()}
              </h2>
              <span className="font-mono text-sm text-slate-400">silver</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1 mt-1 text-xs text-slate-400">
              <p>
                Profit per item: <strong className="text-slate-200 font-mono">
                  {calculation.financials.profitPerUnit >= 0 ? '+' : ''}{calculation.financials.profitPerUnit.toLocaleString()} silver
                </strong>
              </p>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                workflowPhase === 'plan'
                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/40 shadow-sm'
                  : (valuationMode === 'ev' 
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-gold-glow' 
                    : valuationMode === 'floor' 
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/40' 
                    : valuationMode === 'actual'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : selectedQualityMeta.badge)
              }`}>
                {workflowPhase === 'plan'
                  ? `T${selectedTier}.${selectedEnchantment} • 🛡️ Safe Base Price Forecast`
                  : `T${selectedTier}.${selectedEnchantment} • ${valuationMode === 'ev' ? '✨ EV Weighted (Q1–Q5)' : valuationMode === 'floor' ? '🛡️ Floor (Normal Q1)' : valuationMode === 'actual' ? `🎲 Actual Rolled (${actualTotals.totalItems}x)` : `🎯 Q${inspectQuality} ${selectedQualityMeta.name}`}`
                }
              </span>
            </div>

            {/* Risk & EV / Proc Insights Strip */}
            {workflowPhase === 'plan' ? (
              <div className="mt-3.5 p-3.5 rounded-xl bg-albion-bg/80 border border-albion-border/70 text-xs font-mono space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px] font-sans flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-albion-gold shrink-0" />
                    Break-Even Unit Sale Price:
                  </span>
                  <span className="font-bold text-sky-300">
                    {breakEvenUnitPrice.toLocaleString()}s / item
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px] font-sans flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    Upfront Wallet Silver Required:
                  </span>
                  <span className="font-bold text-amber-300">
                    {totalUpfrontCapitalRequired.toLocaleString()}s
                  </span>
                </div>

                {/* Quality Proc Upside Banner */}
                <div className="pt-2 border-t border-albion-border/50 text-[11px] font-sans text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold font-serif">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Quality Proc Upside (Pure Bonus):
                  </div>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">
                    With your Destiny Board spec (+{Math.round((masteryLevel * 0.75) + (specLevel * 6.0))} QR) & Food, Normal quality drops to only ~{((currentOdds[1] || 0) * 100).toFixed(1)}%. Outstanding, Excellent, or Masterpiece procs will sell for significantly higher — <strong>pure extra profit above this forecast!</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-3.5 p-3 rounded-xl bg-albion-bg/80 border border-albion-border/70 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px] font-sans flex items-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Realized Items Logged in Bag:
                  </span>
                  <span className={`font-bold ${actualTotals.totalItems === quantity ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {actualTotals.totalItems} / {quantity} items
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px] font-sans flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    Weighted Average Sale Price:
                  </span>
                  <span className="font-bold text-sky-300">
                    {actualTotals.avgPrice.toLocaleString()}s / item
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-albion-border/50">
                  <span className="text-slate-400 text-[11px] font-sans flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-albion-gold shrink-0" />
                    Break-Even Unit Sale Price:
                  </span>
                  <span className="font-bold text-slate-300">
                    {breakEvenUnitPrice.toLocaleString()}s / item
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 font-mono text-center">
              <div className="bg-albion-bg/60 p-2 rounded">
                <span className="text-[10px] text-slate-500 block">Craft Return</span>
                <span className="text-base font-bold text-sky-400">{calculation.returnRatePct}%</span>
              </div>
              <div className="bg-albion-bg/60 p-2 rounded">
                <span className="text-[10px] text-slate-500 block">Journal Net</span>
                <span className="text-base font-bold text-amber-300">
                  {includeJournals && canUseJournals ? `+${calculation.journals.journalProfit.toLocaleString()}` : '0 (Off)'}
                </span>
              </div>
              <div className="bg-albion-bg/60 p-2 rounded">
                <span className="text-[10px] text-slate-500 block">Silver / Focus</span>
                <span className="text-base font-bold text-emerald-400">{calculation.silverPerFocus}</span>
              </div>
            </div>

            {/* Workflow Phase Switcher Button */}
            {workflowPhase === 'plan' ? (
              <button
                type="button"
                onClick={() => {
                  setWorkflowPhase('realized');
                  setValuationMode('actual');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full mt-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold font-mono text-xs tracking-wide shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer border border-amber-400/40"
              >
                <PackageCheck className="w-4 h-4 text-slate-950" />
                <span>Ready to craft? Record Backpack Rolls in Realized Ledger &rarr;</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setWorkflowPhase('plan');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full mt-4 py-2.5 px-4 rounded-xl bg-albion-surface hover:bg-albion-border/40 text-slate-300 hover:text-white border border-albion-border font-mono text-xs tracking-wide shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                <span>&larr; Need to plan another craft? Back to Pre-Craft Planner</span>
              </button>
            )}
          </div>

          {/* Material Refund Counters */}
          <div className="bg-albion-card border border-albion-border rounded-xl p-4 sm:p-5 shadow-xl space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5 font-serif border-b border-albion-border/60 pb-2">
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
              Refined Materials Refunded ({selectedItem.isNoReturn || selectedItem.isRoyal ? '0% RRR - Transmute' : `${calculation.returnRatePct}% RRR`})
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-albion-bg/60 p-2.5 rounded-lg border border-albion-border">
                <span className="text-slate-300 font-medium">
                  {selectedItem.primaryMatName}
                </span>
                <div className="font-mono text-right">
                  <span className="text-slate-400">{calculation.materials.primaryGross} upfront &rarr; </span>
                  <span className="text-emerald-400 font-bold">+{calculation.materials.primaryReturned} returned</span>
                </div>
              </div>

              {selectedItem.secondaryQty > 0 && (
                <div className="flex justify-between items-center bg-albion-bg/60 p-2.5 rounded-lg border border-albion-border">
                  <span className="text-slate-300 font-medium">
                    {selectedItem.secondaryMatName}
                  </span>
                  <div className="font-mono text-right">
                    <span className="text-slate-400">{calculation.materials.secondaryGross} upfront &rarr; </span>
                    <span className="text-emerald-400 font-bold">+{calculation.materials.secondaryReturned} returned</span>
                  </div>
                </div>
              )}

              {selectedItem.isArtifact && (
                <div className="flex justify-between items-center bg-purple-950/30 p-2.5 rounded-lg border border-purple-500/30">
                  <span className="text-purple-300 font-medium flex items-center gap-1">
                    <Gem className="w-3 h-3 text-purple-400" />
                    {selectedItem.artifactName}
                  </span>
                  <div className="font-mono text-right text-purple-300">
                    <span>{quantity * artifactCountPerUnit} consumed &rarr; </span>
                    <span className="text-rose-400 font-semibold">0 returned (100% used)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Complete Financial Ledger */}
          <div className="bg-albion-card border border-albion-border rounded-xl p-4 sm:p-5 shadow-xl space-y-2.5 text-xs font-mono">
            <h3 className="text-xs uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5 font-serif border-b border-albion-border/60 pb-2">
              Financial Breakdown
            </h3>

            <div className="flex justify-between py-1 border-b border-albion-border/40">
              <span className="text-slate-400 font-sans">Upfront Materials Cost:</span>
              <span className="text-slate-200">{calculation.financials.upfrontMaterials.toLocaleString()} silver</span>
            </div>
            {selectedItem.isArtifact && (
              <div className="flex justify-between py-1 border-b border-albion-border/40 text-purple-300">
                <span className="font-sans">Artifact Cost ({quantity * artifactCountPerUnit}x):</span>
                <span>{calculation.materials.artifactGrossCost.toLocaleString()} silver</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-albion-border/40">
              <span className="text-slate-400 font-sans">Station Nutrition Fee:</span>
              <span className="text-rose-300">{calculation.financials.stationFee.toLocaleString()} silver</span>
            </div>
            <div className="flex justify-between py-1 border-b border-albion-border/40">
              <span className="text-slate-400 font-sans">Market Taxes & Fees:</span>
              <span className="text-amber-300">{calculation.financials.marketTaxes.toLocaleString()} silver</span>
            </div>
            <div className="flex justify-between py-1 border-b border-albion-border/40">
              <span className="text-slate-400 font-sans">Journal Fame Resale Profit:</span>
              <span className={includeJournals && canUseJournals ? "text-emerald-400" : "text-slate-500"}>
                {includeJournals && canUseJournals 
                  ? `+${calculation.journals.journalProfit.toLocaleString()} silver` 
                  : '0 silver (Disabled / T2-T3)'}
              </span>
            </div>
            <div className="flex justify-between py-1 font-bold text-sm pt-2">
              <span className="text-slate-200 font-sans">Total Net Batch Cost:</span>
              <span className="text-slate-100">{calculation.financials.totalCost.toLocaleString()} silver</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
