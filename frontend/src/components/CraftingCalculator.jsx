import React, { useState, useMemo, useEffect, useRef } from 'react';
import NumberInput from './NumberInput';
import { 
  CRAFTABLE_ITEMS, 
  CRAFTING_CATEGORIES, 
  computeCrafting,
  getCraftingReturnRate,
  getArtifactQty,
  simulateCraftingFromMaterials,
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
  PackageCheck,
  Target,
  Repeat,
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
  const s = Math.max(0, Math.min(120, Number(spec) || 0));
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

function getFreshness(dateString, ageHours) {
  let diffHours = null;
  if (ageHours !== null && ageHours !== undefined && !Number.isNaN(Number(ageHours)) && Number(ageHours) < 9000) {
    diffHours = Number(ageHours);
  } else if (
    dateString &&
    typeof dateString === 'string' &&
    !dateString.startsWith('0001') &&
    !dateString.startsWith('1970') &&
    !isNaN(new Date(dateString).getTime()) &&
    new Date(dateString).getFullYear() >= 2020
  ) {
    const parsedStr = dateString.endsWith('Z') || dateString.includes('+') ? dateString : `${dateString}Z`;
    const nowMs = (typeof window !== 'undefined' && typeof window.__INTERNET_CLOCK_OFFSET_MS__ === 'number')
      ? Date.now() + window.__INTERNET_CLOCK_OFFSET_MS__
      : Date.now();
    diffHours = Math.max(0, (nowMs - new Date(parsedStr).getTime()) / (1000 * 60 * 60));
  }
  if (diffHours === null) {
    return { label: 'No Orders', color: 'text-slate-500 bg-slate-900/60 border-slate-800' };
  }
  if (diffHours <= 0.04) return { label: '🟢 Updated just now', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' };
  if (diffHours < 1) {
    const mins = Math.max(1, Math.round(diffHours * 60));
    return { label: `🟢 Updated ${mins}m ago`, color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' };
  }
  if (diffHours < 24) {
    const hrs = Math.round(diffHours * 10) / 10;
    return { label: `🟡 Updated ${hrs}h ago`, color: 'text-amber-400 bg-amber-950/60 border-amber-800' };
  }
  const days = Math.round(diffHours / 24);
  return { label: `🔴 Updated ${days}d ago`, color: 'text-rose-400 bg-rose-950/60 border-rose-800' };
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

const MOUNT_DEFAULT_PRICES = {
  mount_flame_basilisk: { primary: 480000, secondary: 5400, artifact: 13000, sell: 68000000 },
  mount_venom_basilisk: { primary: 480000, secondary: 5800, artifact: 13000, sell: 68000000 },
  mount_avalon_basilisk: { primary: 480000, secondary: 0, artifact: 2500, sell: 18000000 },
  mount_siege_ballista: { primary: 730000, secondary: 1950, artifact: 13000, sell: 8500000 },
  mount_command_mammoth: { primary: 125000000, secondary: 17500, artifact: 13000, sell: 260000000 },
  mount_spectral_bonehorse: { primary: 7200000, secondary: 0, artifact: 16500000, sell: 27000000 },
  mount_rageclaw: { primary: 180000, secondary: 0, artifact: 7500000, sell: 9200000 },
  mount_morgana_nightmare: { primary: 8500000, secondary: 0, artifact: 12500000, sell: 23500000 },
  mount_armored_horse: {
    5: { primary: 245000, secondary: 680, artifact: 620, sell: 280000 },
    6: { primary: 730000, secondary: 1950, artifact: 1800, sell: 820000 },
    7: { primary: 2180000, secondary: 5800, artifact: 5400, sell: 2400000 },
    8: { primary: 6450000, secondary: 17500, artifact: 16500, sell: 7200000 },
  },
  mount_riding_horse: {
    3: { primary: 6500, secondary: 80, artifact: 0, sell: 28000 },
    4: { primary: 28000, secondary: 240, artifact: 0, sell: 82000 },
    5: { primary: 82000, secondary: 680, artifact: 0, sell: 245000 },
    6: { primary: 245000, secondary: 1950, artifact: 0, sell: 730000 },
    7: { primary: 730000, secondary: 5800, artifact: 0, sell: 2180000 },
    8: { primary: 2180000, secondary: 17500, artifact: 0, sell: 6450000 },
  },
  mount_transport_ox: {
    3: { primary: 6500, secondary: 75, artifact: 0, sell: 28000 },
    4: { primary: 28000, secondary: 210, artifact: 0, sell: 82000 },
    5: { primary: 82000, secondary: 620, artifact: 0, sell: 245000 },
    6: { primary: 245000, secondary: 1800, artifact: 0, sell: 730000 },
    7: { primary: 730000, secondary: 5400, artifact: 0, sell: 2180000 },
    8: { primary: 2180000, secondary: 16500, artifact: 0, sell: 6450000 },
  },
  mount_giant_stag: { primary: 65000, secondary: 240, artifact: 0, sell: 85000 },
  mount_direwolf: { primary: 310000, secondary: 1950, artifact: 0, sell: 380000 },
  mount_moose: { primary: 450000, secondary: 1950, artifact: 0, sell: 520000 },
  mount_direboar: { primary: 950000, secondary: 5800, artifact: 0, sell: 1100000 },
  mount_swampdragon: { primary: 1200000, secondary: 5800, artifact: 0, sell: 1400000 },
  mount_direbear: { primary: 2800000, secondary: 17500, artifact: 0, sell: 3200000 },
  mount_mammoth_transport: { primary: 95000000, secondary: 17500, artifact: 0, sell: 105000000 },
  mount_fw_bear_t5: { primary: 140000, secondary: 680, artifact: 42000, sell: 240000 },
  mount_fw_bear_t8: { primary: 3500000, secondary: 17500, artifact: 42000, sell: 5500000 },
  mount_fw_boar_t5: { primary: 140000, secondary: 680, artifact: 42000, sell: 240000 },
  mount_fw_boar_t8: { primary: 3500000, secondary: 17500, artifact: 42000, sell: 5500000 },
  mount_fw_ram_t5: { primary: 140000, secondary: 680, artifact: 42000, sell: 240000 },
  mount_fw_ram_t8: { primary: 3500000, secondary: 17500, artifact: 42000, sell: 5500000 },
  mount_fw_moabird_t5: { primary: 140000, secondary: 680, artifact: 42000, sell: 240000 },
  mount_fw_moabird_t8: { primary: 3500000, secondary: 17500, artifact: 42000, sell: 5500000 },
  mount_fw_salamander_t5: { primary: 140000, secondary: 680, artifact: 42000, sell: 240000 },
  mount_fw_salamander_t8: { primary: 3500000, secondary: 17500, artifact: 42000, sell: 5500000 },
  mount_fw_greywolf_t5: { primary: 140000, secondary: 680, artifact: 42000, sell: 240000 },
  mount_fw_greywolf_t8: { primary: 3500000, secondary: 17500, artifact: 42000, sell: 5500000 },
};

function getMaterialTactileClass(matName) {
  if (!matName) return 'bg-albion-bg/80 border-albion-border';
  const lower = matName.toLowerCase();
  if (lower.includes('wood') || lower.includes('plank')) return 'mat-wood';
  if (lower.includes('metal') || lower.includes('bar') || lower.includes('ore')) return 'mat-ore';
  if (lower.includes('leather') || lower.includes('hide')) return 'mat-hide';
  if (lower.includes('cloth') || lower.includes('fiber')) return 'mat-fiber';
  if (lower.includes('stone') || lower.includes('block')) return 'mat-stone';
  if (lower.includes('horse') || lower.includes('dragon') || lower.includes('ox') || lower.includes('stag') || lower.includes('wolf') || lower.includes('bear') || lower.includes('mammoth') || lower.includes('mount') || lower.includes('claw') || lower.includes('ram') || lower.includes('boar') || lower.includes('moa') || lower.includes('salamander')) return 'mat-hide';
  return 'bg-albion-bg/80 border-albion-border';
}

function getArtifactBadgeColor(type) {
  switch (type) {
    case 'Rune': return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    case 'Soul': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    case 'Relic': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'Avalonian':
    case 'Avalonian Shard': return 'bg-amber-400/25 text-amber-200 border-amber-400/50 shadow-gold-glow';
    case 'Tracking': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    case 'Crystal': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    case 'Dragon': return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    case 'Siphoned Energy': return 'bg-purple-600/25 text-purple-200 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]';
    case 'World Boss Artifact': return 'bg-rose-600/25 text-rose-200 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
    case 'Faction Crest': return 'bg-emerald-500/25 text-emerald-200 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
    default: return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  }
}

export default function CraftingCalculator({
  server,
  hasPremium,
  useFocus,
  setUseFocus,
  onOpenGuide,
  onStartTour,
  navigationOptions,
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

  // Auto-switch to category or item from navigationOptions (e.g. from Agriculture War Mount link)
  useEffect(() => {
    if (navigationOptions?.category) {
      setActiveCategory(navigationOptions.category);
      if (navigationOptions.subcategory) {
        setSelectedSubcategory(navigationOptions.subcategory);
      }
    }
    if (navigationOptions?.itemId) {
      const targetItem = CRAFTABLE_ITEMS.find((i) => i.id === navigationOptions.itemId);
      if (targetItem) {
        handleSelectItem(targetItem, navigationOptions.tier || targetItem.minTier || null);
      }
    }
  }, [navigationOptions]);

  // "I Have Materials" mode states for Crafting
  const [craftingInputMode, setCraftingInputMode] = useState('target'); // 'target' | 'materials'
  const [primaryMatsHave, setPrimaryMatsHave] = useState(500);
  const [secondaryMatsHave, setSecondaryMatsHave] = useState(0);
  const [constrainBySecondary, setConstrainBySecondary] = useState(false);
  const [compoundCraftRrr, setCompoundCraftRrr] = useState(true);

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
      // In equipment categories, if an item only exists up to a lower tier (e.g. Chest at maxTier: 5), remove it for T6+
      if (!searchQuery.trim() && i.category !== 'mounts' && i.maxTier && selectedTier > i.maxTier) return false;

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
    let def = TIER_DEFAULT_PRICES[nextTier] || TIER_DEFAULT_PRICES[4];
    if (item.category === 'mounts' && MOUNT_DEFAULT_PRICES[item.id]) {
      const mDef = MOUNT_DEFAULT_PRICES[item.id];
      def = (mDef[nextTier] || mDef);
    }
    setPrimaryPrice(def.primary || 0);
    setSecondaryPrice(def.secondary || 0);
    setArtifactPrice(def.artifact || 0);
    
    // Default sell price
    if (def.sell) {
      setItemSellPrice(def.sell);
    } else if (item.isArtifact) {
      setItemSellPrice(Math.round(((def.sell || 0) + (def.artifact || 0)) * 1.35));
    } else {
      setItemSellPrice(def.sell || 5000);
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

    let def = TIER_DEFAULT_PRICES[tierLevel] || TIER_DEFAULT_PRICES[4];
    if (selectedItem.category === 'mounts' && MOUNT_DEFAULT_PRICES[selectedItem.id]) {
      const mDef = MOUNT_DEFAULT_PRICES[selectedItem.id];
      def = (mDef[tierLevel] || mDef);
    }
    setPrimaryPrice(def.primary || 0);
    setSecondaryPrice(def.secondary || 0);
    setArtifactPrice(def.artifact || 0);

    if (def.sell) {
      setItemSellPrice(def.sell);
    } else if (selectedItem.isArtifact) {
      setItemSellPrice(Math.round(((def.sell || 0) + (def.artifact || 0)) * 1.35));
    } else {
      setItemSellPrice(def.sell || 5000);
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

  const currentOdds = useMemo(() => {
    if (selectedItem?.category === 'mounts') {
      return { 1: 1.0, 2: 0.0, 3: 0.0, 4: 0.0, 5: 0.0 };
    }
    return qualityMetrics.chances;
  }, [selectedItem, qualityMetrics]);

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

  const craftingMaterialSim = useMemo(() => {
    return simulateCraftingFromMaterials({
      item: selectedItem,
      tier: selectedTier,
      enchantment: selectedEnchantment,
      primaryHave: primaryMatsHave,
      secondaryHave: secondaryMatsHave,
      constrainBySecondary,
      city: selectedCity,
      useFocus,
      dailyBonusPct: dailyBonus,
    });
  }, [
    selectedItem,
    selectedTier,
    selectedEnchantment,
    primaryMatsHave,
    secondaryMatsHave,
    constrainBySecondary,
    selectedCity,
    useFocus,
    dailyBonus,
  ]);

  const effectiveBatchQuantity = useMemo(() => {
    if (craftingInputMode === 'materials' && craftingMaterialSim) {
      const crafts = compoundCraftRrr ? craftingMaterialSim.totalCrafts : craftingMaterialSim.pass1Crafts;
      return Math.max(1, crafts);
    }
    return Math.max(1, Number(quantity) || 1);
  }, [craftingInputMode, craftingMaterialSim, compoundCraftRrr, quantity]);

  // Keep track of previous batch quantity to detect batch adjustments
  const prevBatchRef = useRef(effectiveBatchQuantity);

  useEffect(() => {
    const prevBatch = prevBatchRef.current;
    prevBatchRef.current = effectiveBatchQuantity;

    if (!prevBatch || prevBatch === effectiveBatchQuantity) return;

    // If actualTotals was previously in sync with the batch size, automatically scale/sync rolls to the new batch!
    if (actualTotals.totalItems > 0 && actualTotals.totalItems === prevBatch) {
      const activeQualities = Object.entries(actualQualityCounts).filter(([_, cnt]) => (Number(cnt) || 0) > 0);
      if (activeQualities.length <= 1) {
        const targetQ = activeQualities.length === 1 ? activeQualities[0][0] : 2;
        setActualQualityCounts({
          1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
          [targetQ]: effectiveBatchQuantity,
        });
      } else {
        let remaining = effectiveBatchQuantity;
        const newCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (let i = 5; i >= 1; i--) {
          const ratio = (Number(actualQualityCounts[i]) || 0) / prevBatch;
          const scaled = i === 1 ? remaining : Math.round(ratio * effectiveBatchQuantity);
          newCounts[i] = Math.max(0, scaled);
          remaining -= newCounts[i];
        }
        setActualQualityCounts(newCounts);
      }
    }
  }, [effectiveBatchQuantity, actualTotals.totalItems, actualQualityCounts]);

  const handleSyncRolledToBatch = () => {
    const activeQualities = Object.entries(actualQualityCounts).filter(([_, cnt]) => (Number(cnt) || 0) > 0);
    if (activeQualities.length <= 1) {
      const targetQ = activeQualities.length === 1 ? activeQualities[0][0] : 2;
      setActualQualityCounts({
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
        [targetQ]: effectiveBatchQuantity,
      });
    } else {
      let remaining = effectiveBatchQuantity;
      const newCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const currentTotal = actualTotals.totalItems || 1;
      for (let i = 5; i >= 1; i--) {
        const ratio = (Number(actualQualityCounts[i]) || 0) / currentTotal;
        const scaled = i === 1 ? remaining : Math.round(ratio * effectiveBatchQuantity);
        newCounts[i] = Math.max(0, scaled);
        remaining -= newCounts[i];
      }
      setActualQualityCounts(newCounts);
    }
  };

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
    
    for (let i = 0; i < effectiveBatchQuantity; i++) {
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

    if (effectiveBatchQuantity === 1) {
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
          ? `👑 JACKPOT in Batch! Rolled ${counts[5]}x Masterpiece in ${effectiveBatchQuantity} crafts!`
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

  const canUseJournals = selectedTier >= 4 && Boolean(selectedItem?.journalTemplate);
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
      const expectedUnits = effectiveBatchQuantity * odds;
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
  }, [totalBatchCost, effectiveBatchQuantity, taxRate, setupFee, includeJournals, canUseJournals, calculation, currentOdds, resolvedQualityPrices, actualQualityCounts]);

  // Item icon paths
  const itemIconSrc = `/items/${selectedItem.template.replace('{tier}', selectedTier)}.png`;
  const primaryIconSrc = `/items/${selectedItem.primaryMatIcon.replace('{tier}', selectedTier)}.png`;
  const secondaryIconSrc = selectedItem.secondaryMatIcon
    ? `/items/${selectedItem.secondaryMatIcon.replace('{tier}', selectedTier)}.png`
    : null;
  const artifactIconSrc = selectedItem.isArtifact && selectedItem.artifactTemplate
    ? `/items/${selectedItem.artifactTemplate.replace('{tier}', selectedTier)}.png`
    : null;
  const journalIconSrc = (canUseJournals && selectedItem?.journalTemplate)
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

  const materialsModeShopping = useMemo(() => {
    if (craftingInputMode !== 'materials' || !craftingMaterialSim) {
      return null;
    }
    const secondaryToBuy = selectedItem.secondaryQty > 0
      ? (compoundCraftRrr ? (craftingMaterialSim.secondaryToBuyTotal || 0) : (craftingMaterialSim.secondaryToBuyPass1 || 0))
      : 0;
    const secondaryCost = secondaryToBuy * (Number(secondaryPrice) || 0);

    const artifactsToBuy = selectedItem.isArtifact
      ? (compoundCraftRrr ? (craftingMaterialSim.artifactsTotal || 0) : (craftingMaterialSim.artifactsPass1 || 0))
      : 0;
    const artifactCost = artifactsToBuy * (Number(artifactPrice) || 0);

    const journalsToBuy = (includeJournals && canUseJournals)
      ? (compoundCraftRrr ? (craftingMaterialSim.emptyJournalsToBuyTotal || 0) : (craftingMaterialSim.emptyJournalsToBuyPass1 || 0))
      : 0;
    const journalCost = journalsToBuy * (Number(emptyJournalPrice) || 0);

    const stationFee = calculation?.financials?.stationFee || 0;
    const upfrontWalletCash = secondaryCost + artifactCost + journalCost + stationFee;

    return {
      primaryOwned: primaryMatsHave,
      primaryToBuy: 0,
      primaryCost: 0,
      secondaryOwned: secondaryMatsHave,
      secondaryToBuy,
      secondaryCost,
      artifactsToBuy,
      artifactCost,
      journalsToBuy,
      journalCost,
      stationFee,
      upfrontWalletCash,
    };
  }, [
    craftingInputMode,
    craftingMaterialSim,
    selectedItem,
    compoundCraftRrr,
    secondaryPrice,
    artifactPrice,
    includeJournals,
    canUseJournals,
    emptyJournalPrice,
    calculation?.financials?.stationFee,
    primaryMatsHave,
    secondaryMatsHave,
  ]);

  const totalUpfrontCapitalRequired = useMemo(() => {
    if (craftingInputMode === 'materials' && materialsModeShopping) {
      return materialsModeShopping.upfrontWalletCash;
    }
    const mats = calculation?.financials?.upfrontMaterials || 0;
    const fee = calculation?.financials?.stationFee || 0;
    return mats + fee + upfrontJournalsCost;
  }, [craftingInputMode, materialsModeShopping, calculation, upfrontJournalsCost]);

  const handleCopyShoppingList = () => {
    const stationFee = calculation?.financials?.stationFee || 0;
    const netProfit = calculation?.financials?.netProfit || 0;
    const margin = calculation?.financials?.marginPct || 0;

    let lines = [];
    if (craftingInputMode === 'materials' && materialsModeShopping) {
      lines = [
        `⚔️ ALBION ONLINE CRAFTING SHOPPING LIST (BAG MATERIALS MODE)`,
        `Target Batch: ${effectiveBatchQuantity}x ${selectedItem.name} (T${selectedTier}.${selectedEnchantment})`,
        `City: ${selectedCity} (${calculation.returnRatePct}% Return Rate)`,
        `----------------------------------------`,
        `🎒 IN YOUR BAG (OWNED):`,
        `• ${primaryMatsHave.toLocaleString()}x ${selectedItem.primaryMatName}${selectedEnchantment > 0 ? ` .${selectedEnchantment}` : ''} (Already Owned - 0s market buy)`,
      ];
      if (selectedItem.secondaryQty > 0 && secondaryMatsHave > 0) {
        lines.push(`• ${secondaryMatsHave.toLocaleString()}x ${selectedItem.secondaryMatName}${selectedEnchantment > 0 ? ` .${selectedEnchantment}` : ''} (Already Owned in Bag)`);
      }
      lines.push(`----------------------------------------`);
      lines.push(`🛒 MARKET PURCHASES TO COMPLETE CRAFT:`);
      if (selectedItem.secondaryQty > 0) {
        if (materialsModeShopping.secondaryToBuy > 0) {
          lines.push(`• ${materialsModeShopping.secondaryToBuy.toLocaleString()}x ${selectedItem.secondaryMatName}${selectedEnchantment > 0 ? ` .${selectedEnchantment}` : ''} @ ${secondaryPrice.toLocaleString()}s = ${materialsModeShopping.secondaryCost.toLocaleString()}s`);
        } else {
          lines.push(`• 0x ${selectedItem.secondaryMatName} (Fully covered by bag)`);
        }
      }
      if (selectedItem.isArtifact) {
        lines.push(`• ${materialsModeShopping.artifactsToBuy.toLocaleString()}x ${selectedItem.artifactName} @ ${artifactPrice.toLocaleString()}s = ${materialsModeShopping.artifactCost.toLocaleString()}s`);
      }
      if (includeJournals && canUseJournals && materialsModeShopping.journalsToBuy > 0) {
        lines.push(`• ${materialsModeShopping.journalsToBuy.toLocaleString()}x Empty ${selectedItem.journalName || 'Journals'} @ ${emptyJournalPrice.toLocaleString()}s = ${materialsModeShopping.journalCost.toLocaleString()}s`);
      }
    } else {
      const primaryGross = calculation?.materials?.primaryGross || (effectiveBatchQuantity * (selectedItem.primaryQty || 0));
      const secondaryGross = calculation?.materials?.secondaryGross || (effectiveBatchQuantity * (selectedItem.secondaryQty || 0));
      const artCount = effectiveBatchQuantity * artifactCountPerUnit;

      lines = [
        `⚔️ ALBION ONLINE CRAFTING SHOPPING LIST`,
        `Item: ${effectiveBatchQuantity}x ${selectedItem.name} (T${selectedTier}.${selectedEnchantment})`,
        `City: ${selectedCity} (${calculation.returnRatePct}% Return Rate)`,
        `----------------------------------------`,
        `📦 MATERIALS NEEDED:`,
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
    }
    lines.push(`----------------------------------------`);
    lines.push(`🪙 CASH TO BRING IN POCKET:`);
    lines.push(`• Station Nutrition Fee: ${stationFee.toLocaleString()}s`);
    if (hasCraftersSalad) {
      lines.push(`• Crafter's Salad / Potato Salad buff (Active: +150 Quality Power)`);
    }
    lines.push(`----------------------------------------`);
    lines.push(`💰 TOTAL UPFRONT SILVER REQUIRED: ${totalUpfrontCapitalRequired.toLocaleString()}s`);
    lines.push(`📈 EXPECTED NET PROFIT: ${netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()}s (${margin}%)`);
    lines.push(`🎯 BREAK-EVEN SELL PRICE: ${breakEvenUnitPrice.toLocaleString()}s / item`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedShoppingList(true);
    setTimeout(() => setCopiedShoppingList(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Crafting Master Guide Banner */}
      <div className="forged-tablet p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-[#1c1405] border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-gold-glow shrink-0">
            <Hammer className="w-4 h-4" />
          </div>
          <div>
            <span className="font-serif font-bold text-sm text-slate-100 tracking-wide block">
              Royal Armorer &amp; Weapon Forgemaster Suite
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
              Pre-Craft procurement shopping manifests, Crafter&apos;s Salad quality bonuses, and discrete quality roll simulations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenGuide ? onOpenGuide('crafting') : null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#06090f] hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Read Guide</span>
          </button>
          <button
            type="button"
            onClick={() => onStartTour ? onStartTour('crafting') : null}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#07090e] font-serif text-xs font-bold transition-all shadow-gold-glow cursor-pointer hover:scale-105 active:scale-95"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Spotlight Tour</span>
          </button>
        </div>
      </div>

      {/* Category Navigation Tabs */}
      <div id="tour-craft-categories" className="flex flex-wrap gap-2.5 pb-1">
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
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-serif font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-b from-[#1c1405] to-[#0c0d12] border-2 border-amber-500/80 text-amber-200 shadow-gold-glow scale-[1.02]'
                  : 'bg-[#080d16] border border-[#1b2536] text-slate-400 hover:text-slate-200 hover:border-slate-600 hover:bg-[#0c1320]'
              }`}
            >
              <span className="text-base">{cat.icon}</span>
              <span className="tracking-wide">{cat.name}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-gold-glow"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Workflow Phase Switcher */}
      <div id="tour-craft-workflow-switcher" className="forged-tablet p-4 sm:p-5 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
            workflowPhase === 'plan' 
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-gold-glow' 
              : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
          }`}>
            {workflowPhase === 'plan' ? <ShoppingCart className="w-5 h-5 text-amber-300" /> : <Scale className="w-5 h-5 text-emerald-300" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase font-serif font-bold text-slate-100 tracking-wide block">
                Crafting Workflow Phase
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-bold ${
                workflowPhase === 'plan'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-gold-glow'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
              }`}>
                {workflowPhase === 'plan' ? '🛒 Phase 1: Planning & Procurement' : '⚖️ Phase 2: Post-Craft Accounting'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
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
            className={`px-3.5 py-2 rounded-xl text-xs font-serif font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              workflowPhase === 'plan'
                ? 'bg-gradient-to-r from-amber-600/30 to-amber-500/20 text-amber-200 border-2 border-amber-500/80 shadow-gold-glow scale-[1.02]'
                : 'bg-[#06090f] border border-[#1e2a3c] text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
            <span>🛒 Pre-Craft Planner</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setWorkflowPhase('realized');
              setValuationMode('actual');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-serif font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              workflowPhase === 'realized'
                ? 'bg-gradient-to-r from-emerald-600/30 to-emerald-500/20 text-emerald-200 border-2 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.25)] scale-[1.02]'
                : 'bg-[#06090f] border border-[#1e2a3c] text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            <span>⚖️ Realized Ledger</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Crafting Setup (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Item Grid Selector */}
          <div id="tour-craft-item-picker" className="forged-tablet p-4 sm:p-5 shadow-2xl space-y-5 relative overflow-hidden">
            {/* Subtle top edge gold hairline */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#1c2738]/80 pb-3">
              <label className="text-xs uppercase tracking-wider text-slate-200 font-semibold flex items-center gap-2 font-serif">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                  Stage 01
                </span>
                <Hammer className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-serif">Select Craftable Armament ({filteredItems.length})</span>
              </label>
              
              <div className="flex items-center gap-2">
                {selectedItem.bonusCity ? (
                  <>
                    <span className="text-[11px] font-mono text-amber-300 bg-[#1c1405] px-2 py-0.5 rounded-md border border-amber-500/40 shadow-sm">
                      Bonus City: <strong>{selectedItem.bonusCity}</strong> (+15%)
                    </span>
                    {selectedCity.toLowerCase() !== selectedItem.bonusCity.toLowerCase() && (
                      <button
                        type="button"
                        onClick={() => setSelectedCity(selectedItem.bonusCity)}
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 transition-all cursor-pointer shadow-gold-glow"
                        title={`Switch city to ${selectedItem.bonusCity} for +15% RRR`}
                      >
                        Snap to {selectedItem.bonusCity}
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-[11px] font-mono text-slate-400 bg-[#06090f] px-2 py-0.5 rounded-md border border-[#1e2a3c]">
                    Universal Craft (No City Bonus)
                  </span>
                )}
              </div>
            </div>

            {/* Quick Search & Subcategory Filter Bar */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-amber-400/70 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search armament name or artifact (e.g. Blazing, Brimstone, Dragon, Infinity, Cape...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#06090f] border border-[#1e2a3c] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono shadow-inner transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
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
                    className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      selectedSubcategory === 'all'
                        ? 'bg-amber-500 text-[#07090e] shadow-gold-glow'
                        : 'bg-[#080d16] border border-[#1b2536] text-slate-400 hover:text-slate-200 hover:border-slate-600'
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
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                          isSubActive
                            ? 'bg-amber-500 text-[#07090e] font-bold shadow-gold-glow'
                            : 'bg-[#080d16] border border-[#1b2536] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                        }`}
                      >
                        {label} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Armament Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto pr-1">
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
                    className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all relative cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#1c1405] to-[#0b0e16] border-2 border-amber-500/90 text-slate-100 shadow-gold-glow scale-[1.02]'
                        : 'bg-gradient-to-b from-[#0e1422] to-[#070b13] border border-[#1e2a3c] text-slate-400 hover:text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    {item.isArtifact && (
                      <span className={`absolute top-1.5 right-1.5 text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border shadow-sm ${getArtifactBadgeColor(item.artifactType)}`}>
                        {item.artifactType}
                      </span>
                    )}

                    <div className="w-14 h-14 my-1 bg-[#06090f] rounded-lg p-1 border border-[#1e2a3c] flex items-center justify-center shadow-inner">
                      <ItemIcon 
                        src={icon} 
                        alt={item.name} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-xs font-serif font-bold text-slate-200 truncate w-full mt-0.5">{item.name}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">
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
            <div id="tour-craft-tier-ench" className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#1c2738]/80">
              {/* Tier Selection (T2 to T8) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-300 font-serif">
                    Armament Tier
                  </label>
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    {(selectedItem.minTier || 4) <= 3 && (
                      <span className="text-emerald-400 font-bold">
                        T{selectedItem.minTier} Available
                      </span>
                    )}
                    {selectedItem.maxTier && selectedItem.maxTier < 8 && (
                      <span className="text-amber-400 font-bold">
                        Max Tier {selectedItem.maxTier}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1.5 font-mono">
                  {TIERS.map((tier) => {
                    const min = selectedItem.minTier || 4;
                    const max = selectedItem.maxTier || 8;
                    const isEligible = tier.level >= min && tier.level <= max;
                    const isSelected = selectedTier === tier.level;

                    return (
                      <button
                        key={tier.level}
                        type="button"
                        disabled={!isEligible}
                        onClick={() => handleSelectTier(tier.level)}
                        className={`py-2 rounded-xl border text-xs font-extrabold text-center transition-all cursor-pointer active:scale-95 ${
                          !isEligible
                            ? 'opacity-20 cursor-not-allowed bg-[#06090f] border-slate-800 text-slate-600'
                            : isSelected
                            ? `${tier.gemClass ? `${tier.gemClass} text-white shadow-lg ring-2 ring-amber-400 scale-105` : `${tier.color} ring-2 ring-amber-400 scale-105 shadow-md`}`
                            : 'bg-[#080d16] border-[#1e2a3c] text-slate-400 hover:text-slate-200 hover:border-slate-500'
                        }`}
                        title={
                          !isEligible 
                            ? (tier.level < min 
                                ? `${selectedItem.name} starts at Tier ${min}` 
                                : `${selectedItem.name} maxes at Tier ${max}`)
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
                  <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-300 font-serif">
                    Enchantment Level
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
                        className={`py-2 rounded-xl border text-xs font-extrabold text-center transition-all cursor-pointer active:scale-95 ${
                          isEnchantDisabled
                            ? 'opacity-20 cursor-not-allowed bg-[#06090f] border-slate-800 text-slate-600'
                            : isSelected
                            ? (ench.level === 0 
                                ? 'bg-slate-700/90 border-slate-400 text-white ring-2 ring-slate-300 scale-105 shadow-md' 
                                : `ench-glow-${ench.level} ${ench.color} font-extrabold ring-2 ring-white/60 scale-105 shadow-lg`)
                            : 'bg-[#080d16] border-[#1e2a3c] text-slate-400 hover:text-slate-200 hover:border-slate-500'
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
          <div className="forged-tablet shadow-2xl relative overflow-hidden">
            {/* Subtle top edge arcane cyan hairline */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />

            <div 
              onClick={() => setIsDestinyBoardOpen(!isDestinyBoardOpen)}
              className="p-4 sm:p-5 flex flex-wrap items-center justify-between cursor-pointer hover:bg-slate-800/20 transition-colors border-b border-[#1c2738]/80 gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl border bg-sky-500/20 border-sky-500/50 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.25)]">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30 font-bold">
                      Stage 02
                    </span>
                    <h3 className="text-xs uppercase tracking-wider text-slate-100 font-serif font-bold tracking-wide">
                      Destiny Board Mastery &amp; Quality Specialization
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30 font-bold">
                      +{qualityMetrics.qualityPower} Quality Rating
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                    Destiny Board levels increase rerolls per craft and cut focus cost per item dynamically.
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2.5">
                {/* Stage 02 Direct Focus Toggle Button */}
                {setUseFocus && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUseFocus(!useFocus);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition-all border cursor-pointer ${
                      useFocus
                        ? 'bg-gradient-to-r from-sky-600/35 to-sky-500/20 border-sky-400 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                        : 'bg-[#06090f] border-[#1e2a3c] text-slate-400 hover:text-slate-200 hover:border-sky-500/40'
                    }`}
                    title={useFocus ? 'Crafting Focus is ACTIVE (+47.9% to +53.9% RRR) - Click to turn OFF' : 'Crafting Focus is OFF - Click to turn ON'}
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${useFocus ? 'text-sky-300 fill-sky-300 animate-pulse' : 'text-slate-500'}`} />
                    <span>{useFocus ? '⚡ Focus: ON' : 'Focus: OFF'}</span>
                  </button>
                )}
                <span className="text-xs font-mono text-amber-300 font-bold hidden sm:inline bg-[#06090f] px-2.5 py-1 rounded-md border border-[#1e2a3c]">
                  Mastery: {masteryLevel}/100 &bull; Spec: {specLevel}/120
                </span>
                <button
                  type="button"
                  className="p-1.5 rounded-lg bg-[#06090f] border border-[#1e2a3c] text-slate-300 hover:text-white cursor-pointer"
                >
                  {isDestinyBoardOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isDestinyBoardOpen && (
              <div className="p-4 sm:p-5 bg-[#070b13]/60 space-y-4">
                {/* Quick Focus Status & Toggle Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#0b121d] border border-[#1e2a3c] shadow-inner">
                  <div className="flex items-center gap-2">
                    <Sparkles className={`w-4 h-4 ${useFocus ? 'text-sky-400 animate-pulse' : 'text-slate-500'}`} />
                    <span className="text-xs text-slate-300 font-sans">
                      {useFocus
                        ? `Focus Crafting is ACTIVE: High RRR applied (${calculation.focusPerUnit} focus / craft, ${calculation.totalFocusNeeded.toLocaleString()} total needed).`
                        : 'Focus Crafting is currently OFF. Click the button to calculate with Royal Focus (boosts return rate to 47.9% - 53.9%).'}
                    </span>
                  </div>
                  {setUseFocus && (
                    <button
                      type="button"
                      onClick={() => setUseFocus(!useFocus)}
                      className={`px-3 py-1 rounded-lg text-xs font-serif font-bold transition-all border cursor-pointer ${
                        useFocus
                          ? 'bg-sky-500/25 border-sky-400 text-sky-200 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                          : 'bg-[#06090f] border-[#1e2a3c] text-slate-300 hover:text-white hover:border-sky-500/50'
                      }`}
                    >
                      {useFocus ? '⚡ Focus: ON' : 'Turn Focus ON'}
                    </button>
                  )}
                </div>

                {/* Telemetry pill strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                  <div className="bg-[#0b121d] p-3 rounded-xl border border-amber-500/40 shadow-inner">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans font-semibold">Quality Rating</span>
                    <span className="text-sm sm:text-base font-extrabold text-amber-300 block mt-0.5">+{qualityMetrics.qualityPower}</span>
                    <span className="text-[9px] text-slate-400 block">({qualityMetrics.totalRolls} rolls/craft)</span>
                  </div>
                  <div className="bg-[#0b121d] p-3 rounded-xl border border-sky-500/40 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans font-semibold">Focus / Unit</span>
                      {setUseFocus && (
                        <button
                          type="button"
                          onClick={() => setUseFocus(!useFocus)}
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                            useFocus
                              ? 'bg-sky-500/30 text-sky-200 border-sky-400 font-bold'
                              : 'bg-[#06090f] text-slate-400 border-slate-700 hover:border-sky-500/50'
                          }`}
                        >
                          {useFocus ? '⚡ ON' : 'OFF'}
                        </button>
                      )}
                    </div>
                    <span className="text-sm sm:text-base font-extrabold text-sky-400 block mt-0.5">{calculation.focusPerUnit}</span>
                    <span className="text-[9px] text-slate-400 block">({calculation.totalFocusNeeded.toLocaleString()} total)</span>
                  </div>
                  <div className="bg-[#0b121d] p-3 rounded-xl border border-[#1e2a3c] shadow-inner">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans font-semibold">Normal Q1 Odds</span>
                    <span className="text-sm sm:text-base font-bold text-slate-200 block mt-0.5">{(currentOdds[1] * 100).toFixed(1)}%</span>
                    <span className="text-[9px] text-emerald-400 block">
                      {currentOdds[1] < 0.1 ? 'Normal almost extinct' : 'Base chance'}
                    </span>
                  </div>
                  <div className="bg-[#0b121d] p-3 rounded-xl border border-emerald-500/40 shadow-inner">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans font-semibold">Good + Out Odds</span>
                    <span className="text-sm sm:text-base font-bold text-emerald-300 block mt-0.5">
                      {(((currentOdds[2] || 0) + (currentOdds[3] || 0)) * 100).toFixed(1)}%
                    </span>
                    <span className="text-[9px] text-slate-400 block">Dominates results</span>
                  </div>
                </div>

                {/* Focus Pool Capacity & Regeneration Alert */}
                {useFocus && calculation?.totalFocusNeeded > 0 && (
                  <div className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-inner ${
                    calculation.totalFocusNeeded > 30000
                      ? 'bg-rose-950/70 border-rose-500/60 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                      : calculation.totalFocusNeeded > 10000
                      ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                      : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <Zap className={`w-4 h-4 shrink-0 ${calculation.totalFocusNeeded > 30000 ? 'text-rose-400' : 'text-sky-300'}`} />
                      <div>
                        <span className="font-serif font-bold block text-slate-100">
                          {calculation.totalFocusNeeded > 30000
                            ? `⚠️ Exceeds 30,000 Max Focus Bank (${calculation.totalFocusNeeded.toLocaleString()} Focus Needed)`
                            : calculation.totalFocusNeeded > 10000
                            ? `⚡ ${calculation.totalFocusNeeded.toLocaleString()} Focus (~${(calculation.totalFocusNeeded / 10000).toFixed(1)} days • Within 30k bank limit)`
                            : `⚡ ${calculation.totalFocusNeeded.toLocaleString()} Focus (~${(calculation.totalFocusNeeded / 10000).toFixed(1)} days • Ready in 1 day)`}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          {calculation.totalFocusNeeded > 30000
                            ? `Requires ~${(calculation.totalFocusNeeded / 10000).toFixed(1)} days of Premium focus regeneration (10,000/day). Plan this large batch across multiple days.`
                            : 'Focus points regenerate at 10,000 daily with Premium active (30,000 maximum bank capacity).'}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold shrink-0 bg-[#06090f]/80 px-2.5 py-1 rounded-md border border-[#1e2a3c]">
                      {calculation.totalFocusNeeded.toLocaleString()} Focus Total
                    </span>
                  </div>
                )}

                {/* Sliders Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Node Mastery */}
                  <div className="bg-[#0b121d] p-3.5 rounded-xl border border-[#1e2a3c] space-y-2 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-serif font-bold text-slate-100 block">
                          Category Crafting Mastery
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          +0.75 Quality Power &bull; +30 Focus Eff / lvl
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-mono">
                        <NumberInput
                          type="number"
                          min="0"
                          max="100"
                          value={masteryLevel}
                          onChange={(e) => setMasteryLevel(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                          className="w-14 text-center bg-[#06090f] border border-[#1e2a3c] rounded-md py-1 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400 shadow-inner"
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
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <div className="flex gap-1.5 pt-1">
                      {[0, 25, 50, 75, 100].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setMasteryLevel(lvl)}
                          className={`flex-1 py-1 rounded-md text-[10px] font-mono border transition-all cursor-pointer ${
                            masteryLevel === lvl 
                              ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 font-bold shadow-gold-glow'
                              : 'bg-[#06090f] border-[#1e2a3c] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Item Specialization */}
                  <div className="bg-[#0b121d] p-3.5 rounded-xl border border-[#1e2a3c] space-y-2 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-serif font-bold text-slate-100 block truncate">
                          {selectedItem.name} Specialization
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          +6.00 Quality Power &bull; +280 Focus Eff / lvl
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-mono shrink-0">
                        <NumberInput
                          type="number"
                          min="0"
                          max="120"
                          value={specLevel}
                          onChange={(e) => setSpecLevel(Math.max(0, Math.min(120, parseInt(e.target.value) || 0)))}
                          className="w-14 text-center bg-[#06090f] border border-[#1e2a3c] rounded-md py-1 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-400 shadow-inner"
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
                      className="w-full accent-emerald-400 cursor-pointer"
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
                          className={`flex-1 py-1 rounded-md text-[10px] font-mono border transition-all cursor-pointer ${
                            specLevel === lvl 
                              ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/60 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                              : 'bg-[#06090f] border-[#1e2a3c] text-slate-400 hover:text-slate-200'
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
          <div id="tour-craft-planner-details" className="forged-tablet p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between border-b border-[#1e2a3c] pb-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                  Stage 03
                </span>
                <h3 className="text-xs uppercase tracking-wider text-slate-200 font-bold flex items-center gap-2 font-serif">
                  <Coins className="w-4 h-4 text-albion-gold" />
                  Recipe Inputs & Live Valuation
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Mode Toggle: Target Batch vs I Have Materials */}
                <div className="flex items-center bg-[#070b12] p-0.5 rounded-lg border border-[#1e2a3c] text-[10px] font-mono shadow-inner">
                  <button
                    type="button"
                    onClick={() => setCraftingInputMode('target')}
                    className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                      craftingInputMode === 'target'
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50 font-bold shadow-[0_0_10px_rgba(217,119,6,0.2)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Target className="w-3 h-3 text-amber-400" />
                    <span>Target Batch</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCraftingInputMode('materials')}
                    className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                      craftingInputMode === 'materials'
                        ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <PackageCheck className="w-3 h-3 text-emerald-400" />
                    <span>I Have Materials</span>
                  </button>
                </div>

                <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded border font-bold ${selectedQualityMeta.badge}`}>
                  {selectedQualityMeta.name} Quality
                </span>
                <span className="text-[11px] text-slate-300 font-mono bg-[#070b12] px-2.5 py-0.5 rounded border border-[#1e2a3c]">
                  Batch: <strong className="text-albion-gold">{effectiveBatchQuantity}x</strong>
                </span>
              </div>
            </div>

            {/* "I Have Materials" Mode Panel */}
            {craftingInputMode === 'materials' && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#061810] to-[#0a151d] border border-emerald-500/40 space-y-3.5 shadow-[0_0_20px_rgba(16,185,129,0.08)]">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">
                  <div>
                    <span className="text-xs font-serif font-bold text-emerald-300 flex items-center gap-1.5">
                      <PackageCheck className="w-4 h-4 text-emerald-400" />
                      Material Vault &rarr; What You Need & What You Achieve
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Enter the refined materials in your bag. The forge calculates missing components and total finished gear (accounting for RRR loops).
                    </p>
                  </div>

                  {/* Compound RRR vs Pass 1 Only Toggle */}
                  <div className="flex items-center bg-[#070b12] p-0.5 rounded-lg border border-emerald-500/40 text-[10px] font-mono shadow-inner">
                    <button
                      type="button"
                      onClick={() => setCompoundCraftRrr(true)}
                      className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                        compoundCraftRrr
                          ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/60 font-bold shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Keep re-crafting all returned materials until less than 1 craft remains"
                    >
                      <Repeat className="w-3 h-3 text-emerald-400" />
                      <span>Re-Craft RRR ({craftingMaterialSim.passCount} passes)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompoundCraftRrr(false)}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        !compoundCraftRrr
                          ? 'bg-amber-500/25 text-amber-200 border border-amber-500/60 font-bold shadow-[0_0_8px_rgba(217,119,6,0.25)]'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Craft only 1 initial pass and keep returned materials in bag"
                    >
                      1st Pass Only
                    </button>
                  </div>
                </div>

                {/* Material Quantity Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#070b12] p-3 rounded-xl border border-emerald-500/40 flex items-center gap-3 shadow-inner">
                    <div className="w-11 h-11 bg-[#0c121e] rounded-lg p-0.5 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-md">
                      <ItemIcon
                        src={primaryIconSrc}
                        alt={selectedItem.primaryMatName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold block truncate">
                        I Have {selectedItem.primaryMatName}{selectedEnchantment > 0 ? ` .${selectedEnchantment}` : ''} ({selectedItem.primaryQty}/craft)
                      </label>
                      <NumberInput
                        type="number"
                        min="0"
                        value={primaryMatsHave}
                        onChange={(e) => setPrimaryMatsHave(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full mt-1 bg-[#0c121e] border border-emerald-500/50 focus:border-emerald-400 rounded-lg px-3 py-1.5 text-sm font-mono font-extrabold text-emerald-200 focus:outline-none shadow-inner"
                      />
                    </div>
                  </div>

                  {selectedItem.secondaryQty > 0 && (
                    <div className="bg-[#070b12] p-3 rounded-xl border border-[#1e2a3c] flex items-center gap-3 shadow-inner">
                      <div className="w-11 h-11 bg-[#0c121e] rounded-lg p-0.5 border border-[#1e2a3c] flex items-center justify-center shrink-0 shadow-md">
                        <ItemIcon
                          src={secondaryIconSrc}
                          alt={selectedItem.secondaryMatName}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <label className="text-[10px] uppercase tracking-wider text-slate-300 font-bold block truncate">
                            I Also Have {selectedItem.secondaryMatName} ({selectedItem.secondaryQty}/craft)
                          </label>
                          <label className="flex items-center gap-1 text-[9px] text-amber-300 cursor-pointer shrink-0" title="If checked, caps your crafts to the Secondary Mats you currently own instead of buying missing ones">
                            <input
                              type="checkbox"
                              checked={constrainBySecondary}
                              onChange={(e) => setConstrainBySecondary(e.target.checked)}
                              className="accent-amber-500 rounded cursor-pointer"
                            />
                            <span>Cap by this</span>
                          </label>
                        </div>
                        <NumberInput
                          type="number"
                          min="0"
                          value={secondaryMatsHave}
                          onChange={(e) => setSecondaryMatsHave(Math.max(0, parseInt(e.target.value) || 0))}
                          placeholder="0 (will calculate how many to buy)"
                          className="w-full mt-1 bg-[#0c121e] border border-[#1e2a3c] focus:border-amber-400 rounded-lg px-3 py-1.5 text-sm font-mono font-extrabold text-amber-200 focus:outline-none shadow-inner"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 4-Card Breakdown of What You Need & What You Achieve */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="bg-[#070b12] p-3 rounded-xl border border-amber-500/30">
                    <span className="text-[10px] text-slate-400 font-sans block uppercase tracking-wider font-semibold">
                      1. Complementary Mats
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {selectedItem.secondaryQty > 0 ? (
                        <span className="text-xs font-bold text-amber-300 block">
                          {compoundCraftRrr ? (craftingMaterialSim?.secondaryToBuyTotal ?? 0).toLocaleString() : (craftingMaterialSim?.secondaryToBuyPass1 ?? 0).toLocaleString()}x {selectedItem.secondaryMatName}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-400 block">
                          0x (Single-Mat Recipe)
                        </span>
                      )}
                      {selectedItem.isArtifact && (
                        <span className="text-[11px] font-bold text-purple-300 block">
                          + {compoundCraftRrr ? (craftingMaterialSim?.artifactsTotal ?? 0) : (craftingMaterialSim?.artifactsPass1 ?? 0)}x {selectedItem.artifactName}
                        </span>
                      )}
                      {includeJournals && canUseJournals && (
                        <span className="text-[10px] text-slate-400 block">
                          + {compoundCraftRrr ? (craftingMaterialSim?.journalsFilledTotal ?? 0) : (craftingMaterialSim?.journalsFilledPass1 ?? 0)}x Empty Books
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#070b12] p-3 rounded-xl border border-[#1e2a3c]">
                    <span className="text-[10px] text-slate-400 font-sans block uppercase tracking-wider font-semibold">
                      2. Initial Pass
                    </span>
                    <span className="text-sm font-bold text-slate-200 block mt-0.5">
                      {(craftingMaterialSim?.pass1Crafts ?? 0).toLocaleString()}x {selectedItem.name}
                    </span>
                    <span className="text-[10px] text-sky-400 block mt-0.5">
                      +{(craftingMaterialSim?.pass1PrimaryReturned ?? 0).toLocaleString()} {selectedItem.primaryMatName} returned
                    </span>
                  </div>

                  <div className="bg-[#070b12] p-3 rounded-xl border border-[#1e2a3c]">
                    <span className="text-[10px] text-slate-400 font-sans block uppercase tracking-wider font-semibold">
                      3. RRR Recycles
                    </span>
                    <span className="text-sm font-bold text-sky-400 block mt-0.5">
                      +{compoundCraftRrr ? (craftingMaterialSim?.bonusRrrCrafts ?? 0).toLocaleString() : 0}x {selectedItem.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {compoundCraftRrr ? `At ${calculation?.returnRatePct || 0}% RRR` : 'Kept as returned'}
                    </span>
                  </div>

                  <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                    <span className="text-[10px] text-emerald-300 font-sans uppercase tracking-wider font-bold block">
                      4. Total Finished
                    </span>
                    <span className="text-base font-extrabold text-emerald-400 block mt-0.5">
                      {effectiveBatchQuantity.toLocaleString()}x {selectedItem.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Leftover: {compoundCraftRrr ? (craftingMaterialSim?.leftoverPrimary ?? 0) : (primaryMatsHave - (craftingMaterialSim?.pass1Crafts ?? 0) * selectedItem.primaryQty + (craftingMaterialSim?.pass1PrimaryReturned ?? 0))} {selectedItem.primaryMatName}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Live Price Sync Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#070b12] p-3 rounded-xl border border-[#1e2a3c]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleFetchPrices(selectedQuality)}
                  disabled={loadingPrices}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold bg-[#0c121e] hover:bg-[#141d2e] border-amber-500/40 hover:border-amber-400 text-amber-200 transition-all disabled:opacity-50 shadow-sm cursor-pointer"
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
                  <span>Auto-fetch on change</span>
                </label>
              </div>

              {priceStatus && (
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 bg-[#0c121e] px-2.5 py-1 rounded-md border border-[#1e2a3c]">
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
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${getMaterialTactileClass(selectedItem.primaryMatName)}`}>
                <div className="w-12 h-12 shrink-0 bg-[#070b12] rounded-lg p-0.5 border border-[#1e2a3c] flex items-center justify-center shadow-md">
                  <ItemIcon 
                    src={primaryIconSrc} 
                    alt={selectedItem.primaryMatName} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[11px] font-bold text-slate-100 block truncate">
                      {selectedItem.primaryMatName}{selectedEnchantment > 0 ? ` .${selectedEnchantment}` : ''} ({selectedItem.primaryQty}x)
                    </label>
                    <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-[#070b12] text-slate-400 border border-[#1e2a3c] shrink-0">
                      Normal (Q1)
                    </span>
                  </div>
                  <div className="relative mt-1.5">
                    <NumberInput
                      type="number"
                      min="0"
                      value={primaryPrice}
                      onChange={(e) => setPrimaryPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-[#070b12] border border-[#1e2a3c] focus:border-amber-400 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-100 focus:outline-none shadow-inner"
                    />
                    <span className="absolute right-2 top-1 text-[9px] text-slate-500 font-mono">silver</span>
                  </div>
                </div>
              </div>

              {/* Secondary Refined Material */}
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                selectedItem.secondaryQty > 0 
                  ? getMaterialTactileClass(selectedItem.secondaryMatName) 
                  : 'bg-[#070b12]/40 border-[#1e2a3c]/40 opacity-40'
              }`}>
                {selectedItem.secondaryQty > 0 ? (
                  <>
                    <div className="w-12 h-12 shrink-0 bg-[#070b12] rounded-lg p-0.5 border border-[#1e2a3c] flex items-center justify-center shadow-md">
                      <ItemIcon 
                        src={secondaryIconSrc} 
                        alt={selectedItem.secondaryMatName} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <label className="text-[11px] font-bold text-slate-100 block truncate">
                          {selectedItem.secondaryMatName}{selectedEnchantment > 0 ? ` .${selectedEnchantment}` : ''} ({selectedItem.secondaryQty}x)
                        </label>
                        <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-[#070b12] text-slate-400 border border-[#1e2a3c] shrink-0">
                          Normal (Q1)
                        </span>
                      </div>
                      <div className="relative mt-1.5">
                        <NumberInput
                          type="number"
                          min="0"
                          value={secondaryPrice}
                          onChange={(e) => setSecondaryPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full bg-[#070b12] border border-[#1e2a3c] focus:border-amber-400 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-100 focus:outline-none shadow-inner"
                        />
                        <span className="absolute right-2 top-1 text-[9px] text-slate-500 font-mono">silver</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-500 italic py-3 text-center w-full">
                    No secondary material
                  </div>
                )}
              </div>

              {/* Artifact Component Slot (if item is Artifact) */}
              {selectedItem.isArtifact && (
                <div className="bg-gradient-to-br from-[#160b29] to-[#0d091a] p-3.5 rounded-xl border border-purple-500/50 flex items-start gap-3 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                  <div className="w-12 h-12 shrink-0 bg-[#070b12] rounded-lg p-0.5 border border-purple-500/50 flex items-center justify-center shadow-md">
                    <ItemIcon 
                      src={artifactIconSrc} 
                      alt={selectedItem.artifactName} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-purple-300 block truncate">
                        {selectedItem.artifactName} ({artifactCountPerUnit}x)
                      </label>
                      <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded border ${getArtifactBadgeColor(selectedItem.artifactType)}`}>
                        {selectedItem.artifactType}
                      </span>
                    </div>
                    <div className="relative mt-1.5">
                      <NumberInput
                        type="number"
                        min="0"
                        value={artifactPrice}
                        onChange={(e) => setArtifactPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-[#070b12] border border-purple-500/50 focus:border-purple-400 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-purple-200 focus:outline-none shadow-inner"
                      />
                      <span className="absolute right-2 top-1 text-[9px] text-purple-400/60 font-mono">silver</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Output Item Sale Price */}
              <div className="bg-gradient-to-br from-[#1c1407] to-[#0d121c] p-3.5 rounded-xl border border-amber-500/60 flex items-start gap-3 shadow-[0_0_15px_rgba(217,119,6,0.15)]">
                <div className="w-12 h-12 shrink-0 bg-[#070b12] rounded-lg p-0.5 border border-amber-500/40 flex items-center justify-center shadow-md">
                  <ItemIcon 
                    src={itemIconSrc} 
                    alt="Output" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[11px] font-bold text-slate-100 block truncate font-serif">
                      {workflowPhase === 'plan' ? 'Base Sale Price (Normal / Good)' : 'Realized Avg Sale Price'}
                    </label>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold ${
                      workflowPhase === 'plan' 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-gold-glow'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    }`}>
                      {workflowPhase === 'plan' ? '🛡️ Safe Base' : '🎲 Realized'}
                    </span>
                  </div>
                  <div className="relative mt-1.5">
                    <NumberInput
                      type="number"
                      min="0"
                      value={workflowPhase === 'plan' ? (itemSellPrice || 0) : activeSellPrice}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setItemSellPrice(val);
                        setManualQualityPrices(prev => ({ ...prev, 1: val, 2: val }));
                      }}
                      className="w-full bg-[#070b12] border border-amber-500/50 focus:border-amber-400 rounded-lg px-2.5 py-1 text-xs font-mono text-emerald-400 font-extrabold focus:outline-none shadow-inner"
                    />
                    <span className="absolute right-2 top-1 text-[9px] text-slate-500 font-mono">silver</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-slate-400">
                    <span>
                      {workflowPhase === 'plan' ? 'Market baseline' : `Avg: ${activeSellPrice.toLocaleString()}s`}
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
              <div className="bg-amber-950/30 px-3.5 py-2 rounded-xl border border-amber-500/40 text-[10px] text-amber-200 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Notice: Royal gear is forged via Royal Transmutation combining base equipment and Royal Sigils. They have <strong>0% Return Rate</strong> and do not consume focus.</span>
              </div>
            ) : selectedItem.isFactionCape ? (
              <div className="bg-amber-950/30 px-3.5 py-2 rounded-xl border border-amber-500/40 text-[10px] text-amber-200 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Notice: Faction Capes are special transmutation recipes combining a base cape, faction crest, and faction hearts. They have <strong>0% Return Rate</strong> and do not consume focus.</span>
              </div>
            ) : selectedItem.isArtifact && (
              <div className="bg-purple-950/30 px-3.5 py-2 rounded-xl border border-purple-500/40 text-[10px] text-purple-200 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-purple-400" />
                <span>Notice: In Albion Online, <strong>Artifacts are 100% consumed</strong>. Resource Return Rate (RRR) refunds base materials only.</span>
              </div>
            )}
          </div>

          {/* 4. Backpack Quality Roll Tracker & Roll Simulator (rendered ONLY in 'realized' phase!) */}
          {workflowPhase === 'realized' && (
            <div id="tour-craft-realized-ledger" className="forged-tablet p-5 sm:p-6 space-y-5 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.08)]">
              {/* Header with Crafter's Salad Buff Switch & Quality Power Badge */}
              <div className="flex flex-wrap items-center justify-between border-b border-[#1e2a3c] pb-3.5 gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                      Stage 04
                    </span>
                    <Dices className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs uppercase tracking-wider text-slate-100 font-bold font-serif">
                      Inventory Quality Roll Tracker & Dice Simulator
                    </h3>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 font-bold flex items-center gap-1 shadow-sm">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      +{qualityMetrics.qualityPower} Quality Rating ({qualityMetrics.totalRolls} rolls/craft)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Log the exact items that landed in your bag, or launch the Roll Simulator to roll discrete game dice for your batch.
                  </p>
                </div>

                {/* Crafter's Salad Buff Toggle & Roll Simulator */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateRoll}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-bold bg-gradient-to-r from-amber-600/40 to-amber-500/30 hover:from-amber-600/60 hover:to-amber-500/50 border-amber-500/60 text-amber-200 shadow-gold-glow transition-all active:scale-95 cursor-pointer"
                    title={`Simulate discrete game roll for ${effectiveBatchQuantity} craft${effectiveBatchQuantity > 1 ? 's' : ''} using your Destiny Board roll power`}
                  >
                    <Dices className="w-3.5 h-3.5 text-amber-400" />
                    <span>🎲 Roll Craft Simulator ({effectiveBatchQuantity}x)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHasCraftersSalad(!hasCraftersSalad)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                      hasCraftersSalad
                        ? 'bg-amber-950/50 border-amber-500/70 text-amber-200 shadow-gold-glow ring-1 ring-amber-400/40'
                        : 'bg-[#070b12] border-[#1e2a3c] text-slate-400 hover:text-slate-200'
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
                <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 animate-stagger-fade ${
                  simulationBanner.tier === 5 
                    ? 'bg-amber-950/70 border-amber-400/90 shadow-gold-glow text-amber-200' 
                    : simulationBanner.tier === 4 
                    ? 'bg-purple-950/60 border-purple-500/80 text-purple-200' 
                    : simulationBanner.tier === 3 
                    ? 'bg-sky-950/60 border-sky-500/80 text-sky-200' 
                    : 'bg-[#0c121e] border-[#1e2a3c] text-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Dices className={`w-4 h-4 shrink-0 ${simulationBanner.tier === 5 ? 'text-amber-400 animate-bounce' : 'text-slate-300'}`} />
                    <span className="text-xs font-serif font-bold">{simulationBanner.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSimulationBanner(null)}
                    className="text-slate-400 hover:text-white text-xs px-2.5 py-0.5 rounded border border-white/10 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Valuation Mode Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#070b12] p-3 rounded-xl border border-[#1e2a3c]">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[11px] font-serif uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5 mr-1">
                    <Scale className="w-3.5 h-3.5 text-albion-gold" />
                    Valuation Mode:
                  </span>
                  <button
                    type="button"
                    onClick={() => setValuationMode('ev')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                      valuationMode === 'ev'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-gold-glow font-bold'
                        : 'bg-[#0c121e] border-[#1e2a3c] text-slate-400 hover:text-slate-200'
                    }`}
                    title="Probability-weighted return based on your exact Destiny Board specs and food"
                  >
                    ✨ Statistical EV <span className="text-[9px] opacity-80 font-normal">[Forecast]</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setValuationMode('actual')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                      valuationMode === 'actual'
                        ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/70 shadow-emerald-glow font-bold'
                        : 'bg-[#0c121e] border-[#1e2a3c] text-slate-400 hover:text-slate-200'
                    }`}
                    title="Enter exact items rolled (e.g. 1 Masterpiece jackpot, or actual craft results)"
                  >
                    🎲 Actual Realized Craft ({actualTotals.totalItems}x)
                  </button>

                  <button
                    type="button"
                    onClick={() => setValuationMode('floor')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                      valuationMode === 'floor'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/60 font-bold shadow-[0_0_8px_rgba(56,189,248,0.2)]'
                        : 'bg-[#0c121e] border-[#1e2a3c] text-slate-400 hover:text-slate-200'
                    }`}
                    title="Assume 100% of your crafts roll worst-case Normal (Q1)"
                  >
                    🛡️ Floor (Normal Q1)
                  </button>

                  <button
                    type="button"
                    onClick={() => setValuationMode('inspect')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                      valuationMode === 'inspect'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/60 font-bold shadow-[0_0_8px_rgba(168,85,247,0.2)]'
                        : 'bg-[#0c121e] border-[#1e2a3c] text-slate-400 hover:text-slate-200'
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
                    className="text-[10px] text-amber-400 hover:text-amber-300 underline font-mono flex items-center gap-1 cursor-pointer"
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
                      className={`grid grid-cols-12 gap-2 items-center p-3 rounded-xl border transition-all cursor-pointer active:scale-[0.99] ${
                        isInspected
                          ? `${q.color} ring-1 ring-white/50 shadow-lg scale-[1.01]`
                          : 'border-[#1e2a3c] bg-[#070b12] hover:bg-[#0c121e] hover:border-slate-600'
                      }`}
                    >
                      {/* Quality Badge & Name */}
                      <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                        <span className={`w-3 h-3 rounded-full shrink-0 ${q.badge.includes('amber') ? 'bg-amber-400 shadow-gold-glow' : q.badge.includes('purple') ? 'bg-purple-400' : q.badge.includes('sky') ? 'bg-sky-400' : q.badge.includes('emerald') ? 'bg-emerald-400' : 'bg-slate-400'}`} />
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
                        <div className="flex items-baseline justify-between font-mono text-[10px] mb-1">
                          <span className="font-bold text-slate-200">{q.oddsPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#05080e] rounded-full overflow-hidden border border-[#1e2a3c]">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              q.id === 5 ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : q.id === 4 ? 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]' : q.id === 3 ? 'bg-sky-400' : q.id === 2 ? 'bg-emerald-400' : 'bg-slate-500'
                            }`}
                            style={{ width: `${Math.max(2, Math.min(100, q.odds * 100))}%` }}
                          />
                        </div>
                      </div>

                      {/* Market Price & Input */}
                      <div className="col-span-3 text-right">
                        <div className="relative inline-block w-full max-w-[130px]">
                          <NumberInput
                            type="number"
                            min="0"
                            value={manualQualityPrices[q.id] !== undefined ? manualQualityPrices[q.id] : q.price}
                            onChange={(e) => {
                              const val = e.target.value;
                              setManualQualityPrices(prev => ({ ...prev, [q.id]: val }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-[#0c121e] border border-[#1e2a3c] focus:border-amber-400 rounded-lg px-2 py-1 text-right font-mono text-xs font-extrabold text-amber-300 focus:outline-none shadow-inner"
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
                        <span className={`inline-block font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${
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
                              className="w-6 h-6 rounded-md bg-[#0c121e] border border-[#1e2a3c] text-slate-300 hover:border-amber-400 hover:text-amber-200 flex items-center justify-center text-xs active:scale-95 cursor-pointer"
                            >
                              -
                            </button>
                            <NumberInput
                              type="number"
                              min="0"
                              value={actualQualityCounts[q.id] || 0}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                setActualQualityCounts(prev => ({ ...prev, [q.id]: val }));
                              }}
                              className="w-12 text-center bg-[#0c121e] border border-[#1e2a3c] rounded-md py-1 text-xs font-extrabold text-amber-300 focus:outline-none focus:border-amber-400 shadow-inner"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setActualQualityCounts(prev => ({ ...prev, [q.id]: (prev[q.id] || 0) + 1 }));
                              }}
                              className="w-6 h-6 rounded-md bg-[#0c121e] border border-[#1e2a3c] text-slate-300 hover:border-amber-400 hover:text-amber-200 flex items-center justify-center text-xs active:scale-95 cursor-pointer"
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
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs font-mono shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-300">
                      Actual Rolled: <strong className="text-emerald-400">{actualTotals.totalItems} items</strong> (Revenue: {actualTotals.totalGrossRev.toLocaleString()} silver)
                    </span>
                    {actualTotals.totalItems !== effectiveBatchQuantity && (
                      <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                        Target Batch: {effectiveBatchQuantity}x
                      </span>
                    )}
                  </div>
                  {actualTotals.totalItems !== effectiveBatchQuantity && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSyncRolledToBatch}
                        className="text-[10px] px-3 py-1 rounded-md bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/35 font-bold transition-all cursor-pointer shadow-sm"
                        title="Set rolled items count to match current batch size"
                      >
                        ⚡ Sync Rolls to {effectiveBatchQuantity}x
                      </button>
                      <button
                        type="button"
                        onClick={handleSimulateRoll}
                        className="text-[10px] px-3 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 font-bold transition-all cursor-pointer shadow-sm"
                        title="Simulate fresh discrete rolls for the full batch"
                      >
                        🎲 Re-Roll {effectiveBatchQuantity}x
                      </button>
                      {actualTotals.totalItems > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setCraftingInputMode('target');
                            setQuantity(actualTotals.totalItems);
                          }}
                          className="text-[10px] px-2.5 py-1 rounded-md bg-[#0c121e] text-slate-400 hover:text-slate-200 border border-[#1e2a3c] transition-all cursor-pointer"
                          title="Change batch size down to match what you entered"
                        >
                          Set Batch to {actualTotals.totalItems}x
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Realism Footer Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-[#1e2a3c] text-xs font-mono">
                <div className="bg-[#070b12] p-2.5 rounded-xl border border-[#1e2a3c]">
                  <span className="text-[9px] uppercase text-slate-500 block font-sans font-semibold">Active Effective Price</span>
                  <span className="text-sm font-bold text-albion-gold">{activeSellPrice.toLocaleString()}s</span>
                </div>

                <div className="bg-[#070b12] p-2.5 rounded-xl border border-[#1e2a3c]">
                  <span className="text-[9px] uppercase text-slate-500 block font-sans font-semibold">Floor Value (Q1)</span>
                  <span className="text-sm font-bold text-slate-300">{(resolvedQualityPrices[1]?.price || 0).toLocaleString()}s</span>
                </div>

                <div className="bg-[#070b12] p-2.5 rounded-xl border border-[#1e2a3c]">
                  <span className="text-[9px] uppercase text-slate-500 block font-sans font-semibold">Crafter Salad Uplift</span>
                  <span className="text-sm font-bold text-amber-400">+{batchSaladUplift.toLocaleString()}s / batch</span>
                </div>

                <div className="bg-[#070b12] p-2.5 rounded-xl border border-[#1e2a3c]">
                  <span className="text-[9px] uppercase text-slate-500 block font-sans font-semibold">Break-Even Unit Price</span>
                  <span className="text-sm font-bold text-sky-300">{breakEvenUnitPrice.toLocaleString()}s</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. Crafting Journals System with Explicit ON / OFF Toggle */}
          <div id="tour-craft-salad-journals" className="forged-tablet p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-[#1e2a3c] pb-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                  Stage 05
                </span>
                <BookOpen className="w-4 h-4 text-amber-400" />
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-slate-100 font-bold font-serif">
                    Crafting Journals & Fame Resale
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Optionally fill laborer journals while crafting for substantial secondary silver profit.
                  </p>
                </div>
              </div>

              {/* Journal Active Switch */}
              <button
                type="button"
                onClick={() => setIncludeJournals(!includeJournals)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all cursor-pointer ${
                  includeJournals
                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-gold-glow'
                    : 'bg-[#070b12] border-[#1e2a3c] text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${includeJournals ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
                {includeJournals ? 'Journals ENABLED' : 'Journals DISABLED'}
              </button>
            </div>

            {/* When Journals are Disabled */}
            {!includeJournals && (
              <div className="bg-[#070b12] p-3.5 rounded-xl border border-[#1e2a3c] text-xs text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-500 shrink-0" />
                  Journals are currently <strong>OFF</strong>. Calculating pure item crafting profit with zero journal overhead.
                </span>
                <button 
                  type="button"
                  onClick={() => setIncludeJournals(true)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline shrink-0 ml-2 cursor-pointer"
                >
                  Enable Journals
                </button>
              </div>
            )}

            {/* When Journals are Enabled but Tier is T2 or T3 */}
            {includeJournals && !canUseJournals && (
              <div className="bg-amber-950/30 p-3.5 rounded-xl border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <strong className="block text-amber-300 font-serif">Notice: Crafting Journals start at Tier 4</strong>
                  <span className="text-[11px] text-slate-300 mt-0.5 block">
                    Albion Online does not have T{selectedTier} laborer journals. Crafting Tier {selectedTier} items generates zero journal fame resale.
                  </span>
                </div>
              </div>
            )}

            {/* When Journals are Enabled and Tier >= 4 */}
            {includeJournals && canUseJournals && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-1">
                <div className="flex items-center gap-3 bg-[#070b12] p-3 rounded-xl border border-[#1e2a3c]">
                  <div className="w-11 h-11 shrink-0 bg-[#0c121e] rounded-lg p-0.5 border border-[#1e2a3c] flex items-center justify-center shadow-md">
                    <ItemIcon 
                      src={journalIconSrc} 
                      alt="Journal" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-100 block truncate">
                      {selectedItem.journalName} (T{selectedTier})
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      Fills ~{calculation.journals.journalsFilled} journals
                    </span>
                  </div>
                </div>

                <div className="bg-[#070b12] p-3 rounded-xl border border-[#1e2a3c]">
                  <label className="text-[10px] text-slate-400 font-mono block mb-1 uppercase tracking-wider font-semibold">
                    Empty Journal Buy Price
                  </label>
                  <div className="relative">
                    <NumberInput
                      type="number"
                      min="0"
                      value={emptyJournalPrice}
                      onChange={(e) => setEmptyJournalPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-[#0c121e] border border-[#1e2a3c] focus:border-amber-400 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-100 focus:outline-none shadow-inner"
                    />
                    <span className="absolute right-2 top-1 text-[9px] text-slate-500 font-mono">silver</span>
                  </div>
                </div>

                <div className="bg-[#070b12] p-3 rounded-xl border border-[#1e2a3c]">
                  <label className="text-[10px] text-slate-400 font-mono block mb-1 uppercase tracking-wider font-semibold">
                    Full Journal Sell Price
                  </label>
                  <div className="relative">
                    <NumberInput
                      type="number"
                      min="0"
                      value={fullJournalPrice}
                      onChange={(e) => setFullJournalPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-[#0c121e] border border-emerald-500/50 focus:border-emerald-400 rounded-lg px-2.5 py-1 text-xs font-mono font-extrabold text-emerald-400 focus:outline-none shadow-inner"
                    />
                    <span className="absolute right-2 top-1 text-[9px] text-emerald-500 font-mono">silver</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. City, Station Fee & Quantity */}
          <div className="forged-tablet p-5 sm:p-6 space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                    Stage 06
                  </span>
                  <label className="text-xs uppercase tracking-wider text-slate-200 font-bold flex items-center gap-1.5 font-serif">
                    <MapPin className="w-4 h-4 text-albion-gold" />
                    City Jurisdiction & Station Taxes
                  </label>
                </div>
                <span className="text-[11px] font-mono">
                  {selectedItem.isNoReturn || selectedItem.isRoyal ? (
                    <span className="text-slate-400 font-semibold">
                      Transmute Recipe (0% Return Rate)
                    </span>
                  ) : selectedItem.bonusCity ? (
                    selectedCity.toLowerCase() === selectedItem.bonusCity.toLowerCase() ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Matching City Specialty (+15% Production Bonus)
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Standard Royal Base (18% RRR)
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
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0c121e] border-amber-500/80 text-amber-200 shadow-gold-glow'
                          : 'bg-[#070b12] border-[#1e2a3c] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-xs font-bold font-serif">{c.name}</div>
                      {isSpecialty && <div className="text-[9px] text-emerald-400 font-bold mt-0.5">+15% Specialty</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-[#070b12] p-3 rounded-xl border border-[#1e2a3c]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 truncate tracking-wider font-mono">
                    {craftingInputMode === 'materials' ? `I Have ${selectedItem.primaryMatName}` : 'Batch Quantity'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setCraftingInputMode(craftingInputMode === 'materials' ? 'target' : 'materials')}
                    className="text-[9px] font-mono text-emerald-400 hover:text-emerald-300 underline shrink-0 cursor-pointer"
                  >
                    {craftingInputMode === 'materials' ? 'Switch to Target' : 'I Have Mats'}
                  </button>
                </div>
                {craftingInputMode === 'materials' ? (
                  <NumberInput
                    type="number"
                    min="0"
                    value={primaryMatsHave}
                    onChange={(e) => setPrimaryMatsHave(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#0c121e] border border-emerald-500/60 rounded-lg px-2.5 py-1 text-sm font-mono font-extrabold text-emerald-300 focus:outline-none focus:border-emerald-400 shadow-inner"
                  />
                ) : (
                  <NumberInput
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#0c121e] border border-[#1e2a3c] rounded-lg px-2.5 py-1 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-amber-400 shadow-inner"
                  />
                )}
              </div>

              <div className="bg-[#070b12] p-3 rounded-xl border border-[#1e2a3c]">
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 tracking-wider font-mono">
                  Station Fee (/ 100 food)
                </label>
                <NumberInput
                  type="number"
                  min="0"
                  value={stationTax}
                  onChange={(e) => setStationTax(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-[#0c121e] border border-[#1e2a3c] rounded-lg px-2.5 py-1 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-amber-400 shadow-inner"
                />
              </div>

              <div className="bg-[#070b12] p-3 rounded-xl border border-[#1e2a3c]">
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 tracking-wider font-mono">
                  Crafter's Salad Buff
                </label>
                <button
                  type="button"
                  onClick={() => setHasCraftersSalad(!hasCraftersSalad)}
                  className={`w-full py-1.5 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    hasCraftersSalad
                      ? 'bg-amber-500/20 text-amber-200 border-amber-500/60 shadow-gold-glow'
                      : 'bg-[#0c121e] border-[#1e2a3c] text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle Crafter's Salad / Potato Salad buff (+150 Quality Rating)"
                >
                  <Utensils className={`w-3.5 h-3.5 ${hasCraftersSalad ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{hasCraftersSalad ? '+150 ACTIVE' : 'OFF'}</span>
                </button>
              </div>

              <div className="bg-[#070b12] p-3 rounded-xl border border-[#1e2a3c]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 tracking-wider font-mono">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    Event Bonus
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
                      className={`py-1 rounded-md border text-xs font-bold text-center transition-all cursor-pointer ${
                        dailyBonus === b.val
                          ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 shadow-gold-glow ring-1 ring-amber-400/40'
                          : 'bg-[#0c121e] border-[#1e2a3c] text-slate-400 hover:text-slate-200'
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
        <div id="tour-craft-ledger" className="lg:col-span-5 space-y-5">
          {/* Pre-Craft Shopping List & Required Upfront Capital (when in 'plan' phase) */}
          {workflowPhase === 'plan' && (
            <div className="forged-tablet p-5 sm:p-6 space-y-5 border-amber-500/40 shadow-[0_0_20px_rgba(217,119,6,0.1)] relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between border-b border-[#1e2a3c] pb-3.5 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-albion-gold shadow-sm">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-slate-100 font-bold font-serif flex items-center gap-1.5">
                      Pre-Craft Procurement & Shopping List
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Exact items to buy on the Market Board before heading to the crafting station.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyShoppingList}
                    className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-500/50 shadow-gold-glow transition-all active:scale-95 cursor-pointer"
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
                      className="text-[10px] text-slate-400 hover:text-slate-200 underline font-mono cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Big Upfront Cash In Wallet Requirement */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#1c1407] via-[#0c121e] to-[#070b12] border border-amber-500/50 shadow-inner">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-200 font-serif flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-albion-gold" />
                    Total Cash Required In Inventory:
                  </span>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30 font-bold">
                    Wallet Budget
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <h2 className="font-mono text-3xl sm:text-4xl font-black text-albion-gold tracking-tight drop-shadow-[0_2px_8px_rgba(217,119,6,0.3)]">
                    {totalUpfrontCapitalRequired.toLocaleString()}
                  </h2>
                  <span className="font-mono text-xs text-slate-400">silver needed</span>
                </div>

                {craftingInputMode === 'materials' ? (
                  <p className="text-[10px] text-emerald-300 mt-1 flex items-center gap-1.5 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>In Materials Mode: Your {primaryMatsHave.toLocaleString()}x {selectedItem.primaryMatName}{secondaryMatsHave > 0 ? ` & ${secondaryMatsHave.toLocaleString()}x ${selectedItem.secondaryMatName}` : ''} in your bag are already owned and deducted from market costs.</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    You must possess this liquid silver in your bag to buy raw ingredients, empty journals, and pay station nutrition fees.
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-[#1e2a3c] text-[10px] font-mono text-slate-300">
                  <div className="bg-[#070b12] p-2 rounded-lg border border-[#1e2a3c]">
                    <span className="text-slate-500 block uppercase">
                      {craftingInputMode === 'materials' ? 'Complementary Mats:' : 'Upfront Mats:'}
                    </span>
                    <strong className="text-slate-100">
                      {craftingInputMode === 'materials' && materialsModeShopping
                        ? (materialsModeShopping.secondaryCost + materialsModeShopping.artifactCost).toLocaleString()
                        : calculation.financials.upfrontMaterials.toLocaleString()}s
                    </strong>
                  </div>
                  <div className="bg-[#070b12] p-2 rounded-lg border border-[#1e2a3c]">
                    <span className="text-slate-500 block uppercase">Station Tax:</span>
                    <strong className="text-rose-300">{calculation.financials.stationFee.toLocaleString()}s</strong>
                  </div>
                  {includeJournals && canUseJournals && (
                    <div className="bg-[#070b12] p-2 rounded-lg border border-[#1e2a3c]">
                      <span className="text-slate-500 block uppercase">Empty Books:</span>
                      <strong className="text-amber-300">
                        {craftingInputMode === 'materials' && materialsModeShopping
                          ? materialsModeShopping.journalCost.toLocaleString()
                          : upfrontJournalsCost.toLocaleString()}s
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Checklist Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
                  <span className="uppercase tracking-wider font-semibold">MARKET PROCUREMENT CHECKLIST</span>
                  <span>{craftingInputMode === 'materials' ? 'BAG OWNED ITEMS AUTO-DEDUCTED' : 'CLICK CHECKBOX AS YOU BUY'}</span>
                </div>

                {/* Primary Material Item */}
                <div 
                  onClick={() => setShoppingChecked(prev => ({ ...prev, primary: !prev.primary }))}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                    (shoppingChecked.primary || craftingInputMode === 'materials')
                      ? 'bg-emerald-950/20 border-emerald-500/40 opacity-85' 
                      : 'bg-[#070b12] border-[#1e2a3c] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={craftingInputMode === 'materials' ? true : !!shoppingChecked.primary}
                      onChange={() => {}}
                      className="accent-emerald-500 rounded cursor-pointer"
                    />
                    <div className="w-8 h-8 rounded-lg bg-[#0c121e] p-0.5 border border-[#1e2a3c] flex items-center justify-center shrink-0 shadow-sm">
                      <ItemIcon 
                        src={primaryIconSrc} 
                        alt="" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-100 block truncate font-mono">
                          {craftingInputMode === 'materials'
                            ? `${primaryMatsHave.toLocaleString()}x ${selectedItem.primaryMatName}${selectedEnchantment > 0 ? ` .${selectedEnchantment}` : ''}`
                            : `${calculation.materials.primaryGross}x ${selectedItem.primaryMatName}${selectedEnchantment > 0 ? ` .${selectedEnchantment}` : ''}`}
                        </span>
                        {craftingInputMode === 'materials' && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shrink-0">
                            Owned in Bag
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {craftingInputMode === 'materials'
                          ? 'Already in your bag (0s market buy)'
                          : `@${primaryPrice.toLocaleString()}s each`}
                      </span>
                    </div>
                  </div>
                  <div className="font-mono text-right shrink-0">
                    <span className="text-xs font-bold text-albion-gold">
                      {craftingInputMode === 'materials'
                        ? '0s'
                        : `${(calculation.materials.primaryGross * primaryPrice).toLocaleString()}s`}
                    </span>
                    <span className="block text-[8px] text-slate-500">
                      {craftingInputMode === 'materials' ? '0s market buy' : 'primary mat'}
                    </span>
                  </div>
                </div>

                {/* Secondary Material Item (if applicable) */}
                {selectedItem.secondaryQty > 0 && (
                  <div 
                    onClick={() => setShoppingChecked(prev => ({ ...prev, secondary: !prev.secondary }))}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                      shoppingChecked.secondary || (craftingInputMode === 'materials' && materialsModeShopping && materialsModeShopping.secondaryToBuy === 0)
                        ? 'bg-emerald-950/20 border-emerald-500/40 opacity-85' 
                        : 'bg-[#070b12] border-[#1e2a3c] hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={craftingInputMode === 'materials' && materialsModeShopping && materialsModeShopping.secondaryToBuy === 0 ? true : !!shoppingChecked.secondary}
                        onChange={() => {}}
                        className="accent-amber-500 rounded cursor-pointer"
                      />
                      <div className="w-8 h-8 rounded-lg bg-[#0c121e] p-0.5 border border-[#1e2a3c] flex items-center justify-center shrink-0 shadow-sm">
                        <ItemIcon 
                          src={secondaryIconSrc} 
                          alt="" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-100 block truncate font-mono">
                            {craftingInputMode === 'materials' && materialsModeShopping
                              ? `${materialsModeShopping.secondaryToBuy.toLocaleString()}x ${selectedItem.secondaryMatName}${selectedEnchantment > 0 ? ` .${selectedEnchantment}` : ''}`
                              : `${calculation.materials.secondaryGross}x ${selectedItem.secondaryMatName}${selectedEnchantment > 0 ? ` .${selectedEnchantment}` : ''}`}
                          </span>
                          {craftingInputMode === 'materials' && secondaryMatsHave > 0 && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shrink-0">
                              {secondaryMatsHave.toLocaleString()} in Bag
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {craftingInputMode === 'materials' && materialsModeShopping
                            ? (materialsModeShopping.secondaryToBuy > 0
                                ? `@${secondaryPrice.toLocaleString()}s each (${secondaryMatsHave.toLocaleString()} owned in bag)`
                                : 'Fully covered by bag (0s to buy)')
                            : `@${secondaryPrice.toLocaleString()}s each`}
                        </span>
                      </div>
                    </div>
                    <div className="font-mono text-right shrink-0">
                      <span className="text-xs font-bold text-albion-gold">
                        {craftingInputMode === 'materials' && materialsModeShopping
                          ? `${materialsModeShopping.secondaryCost.toLocaleString()}s`
                          : `${(calculation.materials.secondaryGross * secondaryPrice).toLocaleString()}s`}
                      </span>
                      <span className="block text-[8px] text-slate-500">secondary mat</span>
                    </div>
                  </div>
                )}

                {/* Artifact Slot (if applicable) */}
                {selectedItem.isArtifact && (
                  <div 
                    onClick={() => setShoppingChecked(prev => ({ ...prev, artifact: !prev.artifact }))}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                      shoppingChecked.artifact 
                        ? 'bg-purple-950/20 border-purple-500/40 line-through opacity-75' 
                        : 'bg-gradient-to-r from-purple-950/30 to-[#070b12] border-purple-500/40 hover:border-purple-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={!!shoppingChecked.artifact}
                        onChange={() => {}}
                        className="accent-purple-500 rounded cursor-pointer"
                      />
                      <div className="w-8 h-8 rounded-lg bg-[#0c121e] p-0.5 border border-purple-500/40 flex items-center justify-center shrink-0 shadow-sm">
                        <ItemIcon 
                          src={artifactIconSrc} 
                          alt="" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-purple-200 block truncate font-mono">
                          {craftingInputMode === 'materials' && materialsModeShopping
                            ? `${materialsModeShopping.artifactsToBuy.toLocaleString()}x ${selectedItem.artifactName}`
                            : `${effectiveBatchQuantity * artifactCountPerUnit}x ${selectedItem.artifactName}`}
                        </span>
                        <span className="text-[10px] text-purple-300/80 font-mono">
                          @{artifactPrice.toLocaleString()}s each
                        </span>
                      </div>
                    </div>
                    <div className="font-mono text-right shrink-0">
                      <span className="text-xs font-bold text-purple-300">
                        {craftingInputMode === 'materials' && materialsModeShopping
                          ? `${materialsModeShopping.artifactCost.toLocaleString()}s`
                          : `${calculation.materials.artifactGrossCost.toLocaleString()}s`}
                      </span>
                      <span className="block text-[8px] text-purple-400">artifact item</span>
                    </div>
                  </div>
                )}

                {/* Empty Journals (if applicable) */}
                {includeJournals && canUseJournals && (
                  <div 
                    onClick={() => setShoppingChecked(prev => ({ ...prev, journals: !prev.journals }))}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                      shoppingChecked.journals 
                        ? 'bg-emerald-950/20 border-emerald-500/40 line-through opacity-75' 
                        : 'bg-[#070b12] border-[#1e2a3c] hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={!!shoppingChecked.journals}
                        onChange={() => {}}
                        className="accent-amber-500 rounded cursor-pointer"
                      />
                      <div className="w-8 h-8 rounded-lg bg-[#0c121e] p-0.5 border border-[#1e2a3c] flex items-center justify-center shrink-0 shadow-sm">
                        <ItemIcon 
                          src={journalIconSrc} 
                          alt="" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-amber-200 block truncate font-mono">
                          {craftingInputMode === 'materials' && materialsModeShopping
                            ? `${materialsModeShopping.journalsToBuy.toLocaleString()}x Empty ${selectedItem.journalName || 'Journals'}`
                            : `${calculation.journals.journalsFilled}x Empty ${selectedItem.journalName || 'Journals'}`}
                        </span>
                        <span className="text-[10px] text-amber-400/80 font-mono">
                          @{emptyJournalPrice.toLocaleString()}s each
                        </span>
                      </div>
                    </div>
                    <div className="font-mono text-right shrink-0">
                      <span className="text-xs font-bold text-amber-300">
                        {craftingInputMode === 'materials' && materialsModeShopping
                          ? `${materialsModeShopping.journalCost.toLocaleString()}s`
                          : `${upfrontJournalsCost.toLocaleString()}s`}
                      </span>
                      <span className="block text-[8px] text-slate-500">empty books</span>
                    </div>
                  </div>
                )}

                {/* Station Nutrition Tax In Pocket */}
                <div 
                  onClick={() => setShoppingChecked(prev => ({ ...prev, stationFee: !prev.stationFee }))}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                    shoppingChecked.stationFee 
                      ? 'bg-rose-950/20 border-rose-500/40 line-through opacity-75' 
                      : 'bg-[#070b12] border-[#1e2a3c] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={!!shoppingChecked.stationFee}
                      onChange={() => {}}
                      className="accent-rose-500 rounded cursor-pointer"
                    />
                    <div className="w-8 h-8 bg-[#0c121e] rounded-lg flex items-center justify-center text-rose-400 border border-[#1e2a3c] text-xs font-bold shrink-0 shadow-sm">
                      🏛️
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-100 block truncate font-mono">
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
              <div className="p-3.5 rounded-xl bg-[#070b12] border border-[#1e2a3c] text-xs font-mono space-y-2 shadow-inner">
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
          <div className={`forged-tablet p-6 sm:p-7 space-y-5 relative overflow-hidden transition-all ${
            isProfitable
              ? 'border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.12)]'
              : 'border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.12)]'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-300 font-serif">
                  {workflowPhase === 'plan' 
                    ? 'Conservative Net Profit (Safe Baseline)' 
                    : valuationMode === 'ev' 
                    ? 'Expected Net Profit (EV Weighted)' 
                    : valuationMode === 'floor' 
                    ? 'Floor Net Profit (Worst-Case Q1)' 
                    : valuationMode === 'actual'
                    ? 'Realized Net Profit (Actual Backpack Rolls)'
                    : `Inspected Profit (Q${inspectQuality} ${selectedQualityMeta.name})`}
                </span>
                <span 
                  className={`text-[9px] font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
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
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border ${
                isProfitable ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                {calculation.financials.marginPct >= 0 ? `+${calculation.financials.marginPct}%` : `${calculation.financials.marginPct}%`} Margin
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <h2 className={`font-mono text-4xl sm:text-5xl font-black tracking-tight ${
                isProfitable 
                  ? 'text-emerald-400 drop-shadow-[0_2px_12px_rgba(16,185,129,0.35)]' 
                  : 'text-rose-400 drop-shadow-[0_2px_12px_rgba(244,63,94,0.35)]'
              }`}>
                {calculation.financials.netProfit >= 0 ? '+' : ''}{calculation.financials.netProfit.toLocaleString()}
              </h2>
              <span className="font-mono text-sm text-slate-400">silver</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1 mt-1 text-xs text-slate-400">
              <p>
                Profit per item: <strong className="text-slate-100 font-mono">
                  {calculation.financials.profitPerUnit >= 0 ? '+' : ''}{calculation.financials.profitPerUnit.toLocaleString()} silver
                </strong>
              </p>
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded border font-bold ${
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
              <div className="mt-3.5 p-3.5 rounded-xl bg-[#070b12] border border-[#1e2a3c] text-xs font-mono space-y-2.5 shadow-inner">
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
                <div className="pt-2 border-t border-[#1e2a3c] text-[11px] font-sans text-slate-300 space-y-1">
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
              <div className="mt-3.5 p-3.5 rounded-xl bg-[#070b12] border border-[#1e2a3c] text-xs font-mono space-y-2.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px] font-sans flex items-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Realized Items Logged in Bag:
                  </span>
                  <span className={`font-bold ${actualTotals.totalItems === effectiveBatchQuantity ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {actualTotals.totalItems} / {effectiveBatchQuantity} items
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

                <div className="flex items-center justify-between pt-1.5 border-t border-[#1e2a3c]">
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

            <div className="grid grid-cols-3 gap-2.5 mt-4 pt-3.5 border-t border-[#1e2a3c] font-mono text-center">
              <div className="bg-[#070b12] p-2.5 rounded-xl border border-[#1e2a3c]">
                <span className="text-[10px] text-slate-500 block uppercase">Craft Return</span>
                <span className="text-base font-bold text-sky-400">{calculation.returnRatePct}%</span>
              </div>
              <div className="bg-[#070b12] p-2.5 rounded-xl border border-[#1e2a3c]">
                <span className="text-[10px] text-slate-500 block uppercase">Journal Net</span>
                <span className="text-base font-bold text-amber-300">
                  {includeJournals && canUseJournals ? `+${calculation.journals.journalProfit.toLocaleString()}` : '0 (Off)'}
                </span>
              </div>
              <div className="bg-[#070b12] p-2.5 rounded-xl border border-[#1e2a3c]">
                <span className="text-[10px] text-slate-500 block uppercase">Silver / Focus</span>
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
                className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold font-mono text-xs tracking-wide shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer border border-amber-400/40"
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
                className="w-full mt-4 py-3 px-4 rounded-xl bg-[#0c121e] hover:bg-[#141d2e] text-slate-200 hover:text-white border border-[#1e2a3c] hover:border-slate-500 font-mono text-xs tracking-wide shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                <span>&larr; Need to plan another craft? Back to Pre-Craft Planner</span>
              </button>
            )}
          </div>

          {/* Material Refund Counters */}
          <div className="forged-tablet p-5 sm:p-6 space-y-3.5">
            <h3 className="text-xs uppercase tracking-wider text-slate-200 font-bold flex items-center gap-1.5 font-serif border-b border-[#1e2a3c] pb-2.5">
              <RotateCcw className="w-4 h-4 text-sky-400" />
              Refined Materials Refunded ({selectedItem.isNoReturn || selectedItem.isRoyal ? '0% RRR - Transmute' : `${calculation.returnRatePct}% RRR`})
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-[#070b12] p-3 rounded-xl border border-[#1e2a3c]">
                <span className="text-slate-200 font-medium">
                  {selectedItem.primaryMatName}
                </span>
                <div className="font-mono text-right">
                  <span className="text-slate-400">{calculation.materials.primaryGross} upfront &rarr; </span>
                  <span className="text-emerald-400 font-bold">+{calculation.materials.primaryReturned} returned</span>
                </div>
              </div>

              {selectedItem.secondaryQty > 0 && (
                <div className="flex justify-between items-center bg-[#070b12] p-3 rounded-xl border border-[#1e2a3c]">
                  <span className="text-slate-200 font-medium">
                    {selectedItem.secondaryMatName}
                  </span>
                  <div className="font-mono text-right">
                    <span className="text-slate-400">{calculation.materials.secondaryGross} upfront &rarr; </span>
                    <span className="text-emerald-400 font-bold">+{calculation.materials.secondaryReturned} returned</span>
                  </div>
                </div>
              )}

              {selectedItem.isArtifact && (
                <div className="flex justify-between items-center bg-purple-950/30 p-3 rounded-xl border border-purple-500/40">
                  <span className="text-purple-300 font-medium flex items-center gap-1.5">
                    <Gem className="w-3.5 h-3.5 text-purple-400" />
                    {selectedItem.artifactName}
                  </span>
                  <div className="font-mono text-right text-purple-300">
                    <span>{effectiveBatchQuantity * artifactCountPerUnit} consumed &rarr; </span>
                    <span className="text-rose-400 font-semibold">0 returned (100% used)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Complete Financial Ledger */}
          <div className="forged-tablet p-5 sm:p-6 space-y-3 text-xs font-mono">
            <h3 className="text-xs uppercase tracking-wider text-slate-200 font-bold flex items-center gap-1.5 font-serif border-b border-[#1e2a3c] pb-2.5">
              Financial Breakdown
            </h3>

            <div className="flex justify-between py-1.5 border-b border-[#1e2a3c]">
              <span className="text-slate-400 font-sans">Upfront Materials Cost:</span>
              <span className="text-slate-100 font-bold">{calculation.financials.upfrontMaterials.toLocaleString()} silver</span>
            </div>
            {selectedItem.isArtifact && (
              <div className="flex justify-between py-1.5 border-b border-[#1e2a3c] text-purple-300">
                <span className="font-sans">Artifact Cost ({effectiveBatchQuantity * artifactCountPerUnit}x):</span>
                <span className="font-bold">{calculation.materials.artifactGrossCost.toLocaleString()} silver</span>
              </div>
            )}
            <div className="flex justify-between py-1.5 border-b border-[#1e2a3c]">
              <span className="text-slate-400 font-sans">Station Nutrition Fee:</span>
              <span className="text-rose-300 font-bold">{calculation.financials.stationFee.toLocaleString()} silver</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#1e2a3c]">
              <span className="text-slate-400 font-sans">Market Taxes & Fees:</span>
              <span className="text-amber-300 font-bold">{calculation.financials.marketTaxes.toLocaleString()} silver</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#1e2a3c]">
              <span className="text-slate-400 font-sans">Journal Fame Resale Profit:</span>
              <span className={includeJournals && canUseJournals ? "text-emerald-400 font-bold" : "text-slate-500"}>
                {includeJournals && canUseJournals 
                  ? `+${calculation.journals.journalProfit.toLocaleString()} silver` 
                  : '0 silver (Disabled / T2-T3)'}
              </span>
            </div>
            <div className="flex justify-between py-2 font-bold text-sm pt-3 border-t border-[#1e2a3c] bg-[#070b12] px-3 rounded-lg">
              <span className="text-slate-200 font-sans">Total Net Batch Cost:</span>
              <span className="text-albion-gold text-base">{calculation.financials.totalCost.toLocaleString()} silver</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
