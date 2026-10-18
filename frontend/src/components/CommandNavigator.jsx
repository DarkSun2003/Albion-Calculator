import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  CornerDownLeft,
  Layers,
  Hammer,
  Flame,
  FlaskConical,
  Wheat,
  Users,
  Skull,
  Zap,
  Coins,
  MapPin,
  Crown,
  Server,
  Radio,
  Compass,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const FEATURE_DIRECTORY = [
  // Global & Header Controls
  {
    id: 'global-server',
    title: 'Switch Server (Europe / Americas / Asia)',
    category: 'Global Controls',
    keywords: 'server region europe west east americas asia ping realm',
    description: 'Top header bar — switches live market prices between Albion servers.',
    module: null,
    targetSelector: '#tour-header-controls',
    icon: Server,
    accent: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40',
  },
  {
    id: 'global-premium',
    title: 'Toggle Premium Tax (4% vs 8% Market Tax)',
    category: 'Global Controls',
    keywords: 'premium tax 4% 8% market setup fee',
    description: 'Top header bar — halves market sales tax and doubles farming crop yields.',
    module: null,
    targetSelector: '#tour-header-controls',
    icon: Crown,
    accent: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
  },
  {
    id: 'global-focus',
    title: 'Turn Focus ON / OFF (+59% Return Bonus)',
    category: 'Global Controls',
    keywords: 'focus toggle 53.9% 59% return rate rrr watering',
    description: 'Top header bar — enables Focus crafting/refining/watering across all calculators.',
    module: null,
    targetSelector: '#tour-header-controls',
    icon: Sparkles,
    accent: 'text-sky-400 bg-sky-500/15 border-sky-500/40',
  },
  {
    id: 'global-scanner',
    title: 'Live Price Scanner (Albion Data Client .exe)',
    category: 'Global Controls',
    keywords: 'live scanner adc aodp 3 hours ago stale prices download client exe',
    description: 'Top header bar — download the PC scanner for instant 0m-ago prices shared with everyone.',
    module: null,
    action: 'openScanner',
    icon: Radio,
    accent: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40',
  },

  // Refining Workshop Controls
  {
    id: 'refining-material',
    title: 'Stage 01: Pick Material, Tier (T2–T8) & Enchantment (.0–.4)',
    category: 'Refining Workshop',
    keywords: 'wood ore hide fiber stone planks bars leather cloth blocks tier enchantment',
    description: 'Refining Tab → Stage 01 card on the top-left.',
    module: 'refining',
    targetSelector: '#tour-resource-picker',
    icon: Layers,
    accent: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
  },
  {
    id: 'refining-city-tax',
    title: 'Stage 02: Refining City (+40% Bonus), Quantity & Station Tax',
    category: 'Refining Workshop',
    keywords: 'city bonus martlock thetford fort sterling lymhurst bridgewatch caerleon island nutrition tax fee quantity batch',
    description: 'Refining Tab → Stage 02 card (select Royal City, batch quantity, and nutrition fee).',
    module: 'refining',
    targetSelector: '#tour-city-controls',
    icon: MapPin,
    accent: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
  },
  {
    id: 'refining-prices',
    title: 'Stage 03: Market Prices, Refresh Live & Sell vs Direct Order',
    category: 'Refining Workshop',
    keywords: 'price input manual override refresh live sell order direct sell setup fee 2.5%',
    description: 'Refining Tab → Stage 03 card (edit prices manually, refresh AODP, or switch Sell Order vs Direct Sell).',
    module: 'refining',
    targetSelector: '#tour-price-inputs',
    icon: Coins,
    accent: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
  },
  {
    id: 'refining-focus-spec',
    title: 'Stage 04: Destiny Board Mastery & Specialization Sliders (0–100)',
    category: 'Refining Workshop',
    keywords: 'focus spec specialization mastery level slider silver per focus spf efficiency',
    description: 'Refining Tab → Stage 04 card at bottom-left (set Mastery & T4–T8 Spec to slash focus cost).',
    module: 'refining',
    targetSelector: '#tour-focus-spec',
    icon: Zap,
    accent: 'text-sky-400 bg-sky-500/15 border-sky-500/40',
  },
  {
    id: 'refining-arbitrage',
    title: '6-City Cross-Market Arbitrage & Best City Comparison',
    category: 'Refining Workshop',
    keywords: 'arbitrage compare cities best city transport haul profit matrix',
    description: 'Refining Tab → Right column below the Net Profit card.',
    module: 'refining',
    targetSelector: '#tour-arbitrage',
    icon: Compass,
    accent: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40',
  },

  // Other 6 Calculators
  {
    id: 'mod-crafting',
    title: 'Gear & Weapon Crafting Calculator (Pre-Craft & Quality Procs)',
    category: 'Calculators',
    keywords: 'gear weapon armor crafting artifact salad journals quality masterpiece reroll',
    description: 'Switch to Gear Crafting: supports 3,400+ items, Kraken Salad quality buffs, and Journals.',
    module: 'crafting',
    targetSelector: '#tour-craft-categories',
    icon: Hammer,
    accent: 'text-sky-400 bg-sky-500/15 border-sky-500/40',
  },
  {
    id: 'mod-cooking',
    title: "Chef's Hearth — Food & Cooking Profit Calculator",
    category: 'Calculators',
    keywords: 'food cooking chef stew omelette pie salad roast butcher Caerleon +15%',
    description: 'Switch to Cooking: calculate Caerleon +15% food bonus, fish sauces, and meal batches.',
    module: 'cooking',
    targetSelector: '#tour-food-course-picker',
    icon: Flame,
    accent: 'text-orange-400 bg-orange-500/15 border-orange-500/40',
  },
  {
    id: 'mod-potions',
    title: "Alchemist's Lab — Potion & Brew Profit Calculator",
    category: 'Calculators',
    keywords: 'potion alchemy brew poison healing resistance gigantomania Brecilien Caerleon',
    description: 'Switch to Potions: herb inputs, arcane extracts, and Brecilien/Caerleon +15% alchemy bonus.',
    module: 'potions',
    targetSelector: '#tour-potion-type-picker',
    icon: FlaskConical,
    accent: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40',
  },
  {
    id: 'mod-farming',
    title: 'Farming, Herb Gardens & Animal Pastures Calculator',
    category: 'Calculators',
    keywords: 'farming crops herbs seeds animals mounts offspring watering focus island plot',
    description: 'Switch to Farming: seed return rates, watering focus profit, and animal raising.',
    module: 'farming',
    targetSelector: '#tour-farm-mode-picker',
    icon: Wheat,
    accent: 'text-lime-400 bg-lime-500/15 border-lime-500/40',
  },
  {
    id: 'mod-laborers',
    title: 'Guild Island Laborers & House Happiness Calculator',
    category: 'Calculators',
    keywords: 'laborers journals house happiness beds tables trophies yield return',
    description: 'Switch to Laborers: calculate journal fill vs buy profit and trophy/furniture happiness.',
    module: 'laborers',
    targetSelector: '#tour-laborer-prof-picker',
    icon: Users,
    accent: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
  },
  {
    id: 'mod-blackmarket',
    title: 'Caerleon Black Market Flipper, Price Age Filter & Auto-Fetch',
    category: 'Calculators',
    keywords: 'black market caerleon flip arbitrage red zone haul gank risk radar price age freshness auto fetch',
    description: 'Switch to Black Market: scan Royal City sell orders vs Caerleon buy orders with live price age filters.',
    module: 'blackmarket',
    targetSelector: '#tour-bm-item-filter',
    icon: Skull,
    accent: 'text-rose-400 bg-rose-500/15 border-rose-500/40',
  },
  {
    id: 'bm-freshness-filter',
    title: 'Black Market: Max Price Age Filter & Quality Filter',
    category: 'Black Market',
    keywords: 'price age old prices freshness filter 1 hour 3 hours quality normal good masterpiece',
    description: 'Black Market Tab → Filter out old scans (< 1h, < 3h) and filter by specific item quality (Q1–Q5).',
    module: 'blackmarket',
    targetSelector: '#tour-bm-arbitrage-spread',
    icon: Zap,
    accent: 'text-rose-400 bg-rose-500/15 border-rose-500/40',
  },
];

export function spotlightElement(selector) {
  if (!selector) return;
  setTimeout(() => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add(' navigator-spotlight-pulse');
    el.style.transition = 'box-shadow 0.3s ease, outline 0.3s ease';
    el.style.outline = '2px solid #f59e0b';
    el.style.boxShadow = '0 0 0 6px rgba(245, 158, 11, 0.25), 0 0 35px rgba(245, 158, 11, 0.55)';
    el.style.borderRadius = '16px';
    setTimeout(() => {
      el.style.outline = '';
      el.style.boxShadow = '';
    }, 3200);
  }, 180);
}

export default function CommandNavigator({
  isOpen,
  onClose,
  onSelectModule,
  onOpenHandbook,
  onOpenScanner,
   onStartTour,
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FEATURE_DIRECTORY;
    return FEATURE_DIRECTORY.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  }, [query]);

  if (!isOpen) return null;

  const handleTrigger = (item) => {
    onClose();
    if (item.action === 'openScanner' && onOpenScanner) {
      onOpenScanner();
      return;
    }
    if (item.module && onSelectModule) {
      onSelectModule(item.module);
    }
    if (item.targetSelector) {
      spotlightElement(item.targetSelector);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center pt-12 sm:pt-20 p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#070b14] border border-amber-500/50 shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(212,163,75,0.25)] overflow-hidden text-slate-100 ring-1 ring-amber-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#1e2a3c] bg-[#04060a] flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Can't find something? Type 'focus spec', 'station tax', 'black market', 'city bonus'..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-amber-200 px-2.5 py-1 rounded-lg bg-[#090e17] border border-[#1a2436] cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#05080e] hover:bg-[#111827] border border-[#1a2436] hover:border-amber-500/50 text-slate-400 hover:text-amber-200 transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Helper Banner */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-amber-950/60 via-[#0a0f18] to-amber-950/40 border-b border-amber-500/30 flex flex-wrap items-center justify-between gap-2 text-[11px] text-amber-200/90 font-sans">
          <span>
            💡 <strong>Click any feature below</strong> — we will switch tabs, scroll straight to it, and highlight it in gold!
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenHandbook) onOpenHandbook('uimap');
              }}
              className="underline text-amber-300 hover:text-amber-200 font-serif font-bold cursor-pointer"
            >
              Open Full UI Map
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2 bg-[#070b14] scrollbar-thin">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm font-sans">
              No matching controls found for &ldquo;{query}&rdquo;. Try searching &ldquo;focus&rdquo;, &ldquo;tax&rdquo;, &ldquo;price&rdquo;, or &ldquo;black market&rdquo;.
            </div>
          ) : (
            filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTrigger(item)}
                  className="w-full text-left p-3 rounded-xl bg-[#05080e] hover:bg-[#0c121e] border border-[#1a2436] hover:border-amber-400/80 transition-all flex items-center justify-between gap-3 group cursor-pointer shadow-inner"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${item.accent}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-serif font-bold text-slate-100 group-hover:text-amber-200 transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0a0f18] text-slate-400 border border-[#1e2a3c]">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate font-sans">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 opacity-75 group-hover:opacity-100 shrink-0">
                    <span className="hidden sm:inline">Jump Here</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#04060a] border-t border-[#1e2a3c] flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>Shortcut:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#090e17] border border-[#1a2436] font-mono text-[10px] text-amber-300">
              Ctrl + K
            </kbd>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onStartTour) onStartTour();
            }}
            className="text-amber-300 hover:text-amber-200 font-serif font-bold flex items-center gap-1 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Launch Step-by-Step Spotlight Tour</span>
          </button>
        </div>
      </div>
    </div>
  );
}
