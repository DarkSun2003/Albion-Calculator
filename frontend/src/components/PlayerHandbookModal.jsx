import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  X, 
  MapPin, 
  Layers, 
  Hammer, 
  Skull, 
  Coins, 
  ShieldAlert, 
  TrendingUp, 
  CheckCircle2, 
  HelpCircle, 
  Zap, 
  Compass, 
  ChevronRight,
  ShoppingCart,
  RotateCcw,
  Scale,
  Flame,
  Soup,
  FlaskConical,
  Wheat,
  Users,
  Bed,
  Truck,
  ShieldCheck,
  Egg,
  Scissors
} from 'lucide-react';

const HANDBOOK_TABS = [
  { id: 'uimap', label: '🗺️ Where Is Everything?', icon: MapPin },
  { id: 'quickstart', label: '🔰 Quickstart', icon: Compass },
  { id: 'refining', label: '💎 Refining & RRR', icon: Layers },
  { id: 'crafting', label: '⚔️ Gear Crafting', icon: Hammer },
  { id: 'food', label: '🍲 Cooking & Food', icon: Flame },
  { id: 'potions', label: '🧪 Potions & Alchemy', icon: FlaskConical },
  { id: 'farming', label: '🌾 Farming & Animals', icon: Wheat },
  { id: 'laborers', label: '👷 Laborers & Houses', icon: Users },
  { id: 'blackmarket', label: '💀 Black Market', icon: Skull },
  { id: 'focus', label: '⚡ Focus & Specs', icon: Zap },
  { id: 'faq', label: '❓ FAQ & Live Data', icon: HelpCircle },
];

export default function PlayerHandbookModal({
  isOpen,
  onClose,
  onStartTour,
  onJumpToFeature,
  initialTab = 'uimap',
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync initialTab when modal opens
  useEffect(() => {
    if (initialTab && isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLaunchModuleTour = (moduleKey) => {
    onClose();
    if (onStartTour) {
      onStartTour(moduleKey);
    }
  };

  const triggerJump = (moduleKey, selector) => {
    if (onJumpToFeature) {
      onJumpToFeature(moduleKey, selector);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-[#070b14] border border-amber-500/50 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-[0_0_60px_rgba(212,163,75,0.22)] overflow-hidden text-slate-100 ring-1 ring-amber-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-amber-500/30 bg-gradient-to-r from-amber-950/70 via-[#0e1422] to-amber-950/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#04060a] flex items-center justify-center border border-amber-400/80 shadow-[0_0_20px_rgba(212,163,75,0.25)] shrink-0 overflow-hidden">
              <img src="/logo.png" alt="Albion Artisan" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-decorative text-lg sm:text-xl font-black tracking-wide text-amber-200 drop-shadow-sm">
                  Albion Artisan Master Codex &amp; UI Map
                </h2>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider">
                  All 7 Disciplines
                </span>
              </div>
              <p className="text-xs text-slate-300/80 font-sans mt-0.5">
                Click any feature below to teleport straight to it, or read the economic blueprints for all 7 calculators
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#05080e] hover:bg-[#111827] border border-[#1a2436] hover:border-amber-500/50 text-slate-400 hover:text-amber-200 transition-colors cursor-pointer active:scale-95"
            title="Close Handbook (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (Horizontal Scrollable) */}
        <div className="bg-[#04060a] border-b border-[#1e2a3c] px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          {HANDBOOK_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-serif font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-b from-amber-950/70 to-[#0e1422] border border-amber-400/90 text-amber-200 shadow-[0_0_12px_rgba(212,163,75,0.3)] ring-1 ring-amber-500/40'
                    : 'text-slate-400 hover:text-amber-200 hover:bg-[#0a0f18] border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm leading-relaxed scrollbar-thin bg-[#070b14]">
          
          {/* TAB 0: WHERE IS EVERYTHING? (INTERACTIVE UI MAP) */}
          {activeTab === 'uimap' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/50 via-[#111726] to-amber-950/40 border border-amber-500/40 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif text-base font-bold text-amber-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    Interactive UI Map — Click Any Card to Teleport &amp; Highlight It!
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Can&apos;t find a setting? Click any card below (or press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-amber-300">Ctrl+K</kbd> anytime) and we will switch to that tab, scroll straight to it, and highlight it in gold!
                  </p>
                </div>
              </div>

              {/* Section 1: Where are the Refining & Global Settings? */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold mb-2.5">
                  1. Common Settings &amp; Refining Controls (Click to Jump)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {[
                    {
                      badge: 'Top Bar',
                      title: 'Server, Premium & Focus Switch',
                      desc: 'Switch Europe/Americas/Asia, toggle Premium 4% tax, or turn Focus ON/OFF.',
                      mod: null,
                      sel: '#tour-header-controls',
                    },
                    {
                      badge: 'Stage 01',
                      title: 'Material, Tier & Enchantment',
                      desc: 'Choose Wood, Ore, Hide, Fiber, or Stone across T2–T8 and .0 to .4.',
                      mod: 'refining',
                      sel: '#tour-resource-picker',
                    },
                    {
                      badge: 'Stage 02',
                      title: 'Royal City & Hideout Station Rules',
                      desc: 'Choose Royal Cities (+40% refining / +15% crafting specialty) or Hideouts (Outlands & Roads), plus batch size and nutrition tax.',
                      mod: 'refining',
                      sel: '#tour-city-controls',
                    },
                    {
                      badge: 'Stage 03',
                      title: 'Market Prices & Sell/Direct Order',
                      desc: 'Refresh live AODP prices, type manual overrides, or switch Sell vs Direct Order.',
                      mod: 'refining',
                      sel: '#tour-price-inputs',
                    },
                    {
                      badge: 'Stage 04 / 02',
                      title: 'Destiny Board Mastery & Individual Specs',
                      desc: 'Adjust Mastery and individual sibling item specs (saved automatically), or use quick presets and the Fame-to-Max-Spec Planner.',
                      mod: 'refining',
                      sel: '#tour-focus-spec',
                    },
                    {
                      badge: 'Right Column',
                      title: '6-City Arbitrage & Profit Verdict',
                      desc: 'See Net Batch Profit, Silver per Focus, and compare all 6 Royal Cities side-by-side.',
                      mod: 'refining',
                      sel: '#tour-arbitrage',
                    },
                  ].map((card) => (
                    <button
                      key={card.title}
                      type="button"
                      onClick={() => triggerJump(card.mod, card.sel)}
                      className="text-left p-3.5 rounded-xl bg-albion-card hover:bg-[#161f33] border border-albion-border hover:border-amber-500/60 transition-all group cursor-pointer flex flex-col justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                            {card.badge}
                          </span>
                          <span className="text-[10px] font-mono text-amber-400 group-hover:translate-x-0.5 transition-transform">
                            Teleport &rarr;
                          </span>
                        </div>
                        <div className="font-serif font-bold text-slate-100 group-hover:text-amber-200">
                          {card.title}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          {card.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Where are the 7 Calculators? */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-sky-400 font-bold mb-2.5">
                  2. All 7 Economic Calculators (Click to Open Calculator)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {[
                    {
                      name: '💎 Refining Workshop',
                      bonus: 'Up to +40% Royal / Hideout Modes',
                      desc: 'Planks, Metal Bars, Leather, Cloth, and Stone Blocks across 6 Royal Cities, Outlands, and Roads Hideouts.',
                      mod: 'refining',
                      sel: '#tour-resource-picker',
                    },
                    {
                      name: '⚔️ Gear & Weapon Forge',
                      bonus: '328 Base Items • City & Hideout',
                      desc: "Pre-craft manifests, Crafter's Salad quality buffs (+150), individual Destiny Board spec sliders, Fame Planner, and Post-Craft procs.",
                      mod: 'crafting',
                      sel: '#tour-craft-categories',
                    },
                    {
                      name: "🍲 Chef's Hearth (Food)",
                      bonus: '+15% Caerleon • 24.8% / 47.9% RRR',
                      desc: 'Stews, Omelettes, Pies, Salads, Roasts, Fish Sauces, and Butchery across Caerleon, Royal Cities, Islands & Hideouts.',
                      mod: 'cooking',
                      sel: '#tour-food-course-picker',
                    },
                    {
                      name: "🧪 Alchemist's Lab (Potions)",
                      bonus: '+15% Brecilien • 24.8% / 47.9% RRR',
                      desc: 'Healing, Energy, Poison, Resistance, Lifeward, and Cleansing potions + Arcane extracts across Brecilien, Cities & Hideouts.',
                      mod: 'potions',
                      sel: '#tour-potion-type-picker',
                    },
                    {
                      name: '🌾 Agriculture & Pastures',
                      bonus: 'Island Crops, Herbs & Animals',
                      desc: 'Seed return rates, Focus watering profit, and mount/livestock raising.',
                      mod: 'farming',
                      sel: '#tour-farm-mode-picker',
                    },
                    {
                      name: '👷 Guild Laborers & Houses',
                      bonus: 'Up to 150% Trophy Yield',
                      desc: 'Compare buying filled journals vs self-filling, furniture tiers, and daily passive silver.',
                      mod: 'laborers',
                      sel: '#tour-laborer-prof-picker',
                    },
                    {
                      name: '💀 Caerleon Black Market',
                      bonus: 'Royal-to-Caerleon Flipper',
                      desc: 'Scan Royal City sell orders against Caerleon NPC buy orders + live price age filters.',
                      mod: 'blackmarket',
                      sel: '#tour-bm-item-filter',
                    },
                  ].map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => triggerJump(c.mod, c.sel)}
                      className="text-left p-3.5 rounded-xl bg-albion-card hover:bg-[#161f33] border border-albion-border hover:border-sky-500/60 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-serif font-bold text-slate-100 group-hover:text-sky-300">
                          {c.name}
                        </span>
                        <span className="text-[10px] font-mono text-sky-400">Open &rarr;</span>
                      </div>
                      <div className="text-[10px] font-mono text-amber-300 mb-1">{c.bonus}</div>
                      <p className="text-[11px] text-slate-400 leading-snug">{c.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: QUICKSTART */}
          {activeTab === 'quickstart' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-r from-amber-950/40 via-sky-950/30 to-amber-950/40 border border-amber-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-serif font-bold text-amber-300 text-sm mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    New to the Albion Calculator?
                  </h4>
                  <p className="text-slate-300">
                    You can launch a step-by-step interactive spotlight tour of the current page anytime!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleLaunchModuleTour('refining')}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Start Refining Tour &rarr;</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 to-albion-bg border border-amber-500/30 space-y-2">
                <h3 className="font-serif text-base font-bold text-amber-300 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  The 3 Golden Rules of Albion Economy
                </h3>
                <p className="text-slate-300 text-xs">
                  In Albion Online, silver is made by exploiting location bonuses, resource recycling, and focus efficiency. Follow these 3 rules to never lose money on a craft:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-albion-card border border-albion-border space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-950/70 border border-sky-500/50 flex items-center justify-center text-sky-400 font-mono font-bold text-sm">
                    1
                  </div>
                  <h4 className="font-serif font-bold text-slate-200 text-sm">Refine &amp; Craft in Bonus Zones</h4>
                  <p className="text-xs text-slate-400">
                    Always craft in a matching bonus city or qualified Hideout. Bonus Cities raise Refining RRR to <strong>36.7%</strong> (<strong>53.9% Focus</strong>) and Gear/Food/Potion RRR to <strong>24.8%</strong> (<strong>47.9% Focus</strong>).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-albion-card border border-albion-border space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-950/70 border border-amber-500/50 flex items-center justify-center text-amber-400 font-mono font-bold text-sm">
                    2
                  </div>
                  <h4 className="font-serif font-bold text-slate-200 text-sm">Plan with Safe Base Prices</h4>
                  <p className="text-xs text-slate-400">
                    Never plan a craft assuming you will roll Masterpiece procs. Always calculate your profit using <strong>Normal or Good quality</strong>. Any high quality proc is pure bonus silver!
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-albion-card border border-albion-border space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
                    3
                  </div>
                  <h4 className="font-serif font-bold text-slate-200 text-sm">Bring Journals & Eat Salad</h4>
                  <p className="text-xs text-slate-400">
                    Carry <strong>Empty Journals</strong> in your bag to capture fame for 100% free resale profit, and eat <strong>Crafter&apos;s Salad</strong> (+150 Quality Rating) before hitting the forge.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REFINING & RRR MATRIX */}
          {activeTab === 'refining' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-gradient-to-r from-sky-950/40 via-albion-bg to-sky-950/40 border border-sky-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
                <span className="text-sky-300 font-sans">
                  Ready to see these bonuses live in action on the Refining workshop?
                </span>
                <button
                  type="button"
                  onClick={() => handleLaunchModuleTour('refining')}
                  className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Launch Refining Tour &rarr;</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 to-albion-bg border border-amber-500/30 space-y-2">
                <h3 className="font-serif text-base font-bold text-amber-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  Royal City, Caerleon &amp; Brecilien Resource Return Rate (RRR) Matrix
                </h3>
                <p className="text-slate-300 text-xs">
                  Refining in a specialty Royal City gives a <strong>+40% local refining bonus</strong> (<strong>36.7% base RRR</strong> / <strong>53.9% Focus RRR</strong>). Crafting gear, food, or potions in their specialty city gives <strong>+15%</strong> (<strong>24.8% base RRR</strong> / <strong>47.9% Focus RRR</strong>).
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-albion-border">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#0b0e15] text-slate-400 font-serif uppercase tracking-wider border-b border-albion-border">
                    <tr>
                      <th className="py-2.5 px-3">City</th>
                      <th className="py-2.5 px-3">Primary Refining Resource</th>
                      <th className="py-2.5 px-3">Refining No-Focus</th>
                      <th className="py-2.5 px-3">Refining Focus</th>
                      <th className="py-2.5 px-3">Equipment / Consumable (+15%) Bonus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-albion-border/40 font-mono">
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-serif font-bold text-slate-100">Martlock</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">Hide &rarr; Leather</td>
                      <td className="py-2.5 px-3 text-sky-300">36.7%</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">53.9%</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">Axes, Quarterstaffs, Frost Staves, Plate Shoes, Shields, Tomes, Torches</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-serif font-bold text-slate-100">Fort Sterling</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">Wood &rarr; Planks</td>
                      <td className="py-2.5 px-3 text-sky-300">36.7%</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">53.9%</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">Hammers, Spears, Holy Staves, Plate Helmets, Cloth Armor (Robes)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-serif font-bold text-slate-100">Lymhurst</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">Fiber &rarr; Cloth</td>
                      <td className="py-2.5 px-3 text-sky-300">36.7%</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">53.9%</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">Swords, Bows, Arcane Staves, Leather Helmets (Hoods), Leather Shoes</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-serif font-bold text-slate-100">Bridgewatch</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">Stone &rarr; Stone Blocks</td>
                      <td className="py-2.5 px-3 text-sky-300">36.7%</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">53.9%</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">Crossbows, Daggers, Cursed Staves, Plate Armor, Cloth Shoes (Sandals)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-serif font-bold text-slate-100">Thetford</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">Ore &rarr; Metal Bars</td>
                      <td className="py-2.5 px-3 text-sky-300">36.7%</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">53.9%</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">Maces, Fire Staves, Nature Staves, Leather Armor (Jackets), Cloth Helmets (Cowls)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-serif font-bold text-rose-300">Caerleon</td>
                      <td className="py-2.5 px-3 text-slate-400 font-sans">No Refining Bonus</td>
                      <td className="py-2.5 px-3 text-slate-400">15.2%</td>
                      <td className="py-2.5 px-3 text-slate-300">43.5%</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">Shapeshifter Staves, War Gloves, Tools, Gathering Gear, Cooking (Food)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-serif font-bold text-teal-300">Brecilien</td>
                      <td className="py-2.5 px-3 text-slate-400 font-sans">No Refining Bonus</td>
                      <td className="py-2.5 px-3 text-slate-400">15.2%</td>
                      <td className="py-2.5 px-3 text-slate-300">43.5%</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">Bags, Capes, Alchemy (Potions)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Outlands vs Roads Hideout Matrix */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/35 to-albion-bg border border-indigo-500/40 space-y-2.5 text-xs">
                <h4 className="font-serif font-bold text-indigo-300 text-sm">
                  Hideout Station Rules (Outlands Black Zone vs. Roads of Avalon)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-[#0b121d] p-3 rounded-lg border border-[#1e2a3c] space-y-1">
                    <span className="font-bold text-amber-300 block">Refining Hideouts</span>
                    <p className="text-slate-300">
                      Hideout Power Level &amp; Zone Quality do <strong>not</strong> boost refining:
                    </p>
                    <ul className="text-slate-400 list-disc list-inside font-mono space-y-0.5">
                      <li>Outlands HO / Rest: +15% (13.04% / 42.54% Focus)</li>
                      <li>Roads HO Base: +10% (9.09% / 40.83% Focus)</li>
                      <li>Roads Resource Specialty: +20% (16.67% / 44.13% Focus)</li>
                    </ul>
                  </div>
                  <div className="bg-[#0b121d] p-3 rounded-lg border border-[#1e2a3c] space-y-1">
                    <span className="font-bold text-sky-300 block">Gear Crafting Hideouts</span>
                    <p className="text-slate-300">
                      Scales dynamically with Hideout Power Level (PL 1–9) &amp; Biome Specialty:
                    </p>
                    <ul className="text-slate-400 list-disc list-inside space-y-0.5">
                      <li>General PL 1–9: +0% up to +26%</li>
                      <li>Zone Quality Q1–Q6: +1% to +26% (when specialty matches)</li>
                      <li>Power Specialty: +(PL &minus; 1) &times; 3.75%</li>
                    </ul>
                  </div>
                  <div className="bg-[#0b121d] p-3 rounded-lg border border-[#1e2a3c] space-y-1">
                    <span className="font-bold text-emerald-300 block">Food &amp; Potion Hideouts</span>
                    <p className="text-slate-300">
                      Uses General Hideout Power Level only (no zone quality or biome specialty bonus):
                    </p>
                    <ul className="text-slate-400 list-disc list-inside font-mono space-y-0.5">
                      <li>PL 1: +0% &bull; PL 5: +18% &bull; PL 9: +26%</li>
                      <li>+59% Focus bonus applies on top</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* "I Have Materials" Mode & Multi-Pass RRR Guide */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 to-albion-bg border border-amber-500/40 space-y-2.5 text-xs shadow-inner">
                <h4 className="font-serif font-bold text-amber-300 text-sm flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  "I Have Materials" Reverse Mode &amp; Compounded Multi-Pass RRR
                </h4>
                <p className="text-slate-300">
                  Don't want to calculate backward in your head? You can enter the exact materials sitting in your bank:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-[#0b121d] p-3 rounded-lg border border-[#1e2a3c] space-y-1">
                    <span className="font-bold text-slate-100 block">1. Reverse Mode (All 4 Forges)</span>
                    <p className="text-slate-400">
                      Toggle <strong>"I Have Materials / Ingredients"</strong> in Refining, Gear Crafting, Chef's Hearth (Food), or Alchemist's Lab (Potions). Enter your inventory stack (e.g., 5,000 raw hide, 500 corn, or 500 burdock). The engine tells you what secondary materials you need and your total yield!
                    </p>
                  </div>
                  <div className="bg-[#0b121d] p-3 rounded-lg border border-[#1e2a3c] space-y-1">
                    <span className="font-bold text-slate-100 block">2. Compounded Multi-Pass RRR</span>
                    <p className="text-slate-400">
                      When refining or crafting with return rates (RRR), returned materials go back to your bag. When <em>Compounded RRR</em> is enabled, the calculator re-runs those returned mats through successive passes until leftovers drop below recipe costs, showing the full compound production yield.
                    </p>
                  </div>
                  <div className="bg-[#0b121d] p-3 rounded-lg border border-[#1e2a3c] space-y-1">
                    <span className="font-bold text-slate-100 block">3. Cargo Weight &amp; 30k Focus Cap</span>
                    <p className="text-slate-400">
                      Refining calculates total haul weight (input materials &rarr; output blocks/bars) and recommends transport mounts (Horse, Ox, Bear, Mammoth) so you never get overburdened. All calculators alert you when focus exceeds your 30,000 bank capacity!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GEAR CRAFTING */}
          {activeTab === 'crafting' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-gradient-to-r from-sky-950/40 via-albion-bg to-sky-950/40 border border-sky-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
                <span className="text-sky-300 font-sans">
                  Ready to test the Pre-Craft Planner and Quality Dice Simulator live?
                </span>
                <button
                  type="button"
                  onClick={() => handleLaunchModuleTour('crafting')}
                  className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Launch Crafting Tour &rarr;</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Pre-Craft Plan */}
                <div className="p-4 rounded-xl bg-albion-card border border-sky-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-serif font-bold text-sky-300 flex items-center gap-1.5">
                      <ShoppingCart className="w-4 h-4 text-sky-400" />
                      1. Pre-Craft Planner &amp; Shopping List
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold">
                      Before Crafting
                    </span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                    <li><strong className="text-slate-100">Safe Base Forecast:</strong> Valued strictly at Normal/Good market prices. If a craft is profitable at base price, you cannot lose.</li>
                    <li><strong className="text-slate-100">Upfront Wallet Budget:</strong> Tells you exactly how much liquid silver you must have in your inventory (materials + station food fees + empty books).</li>
                    <li><strong className="text-slate-100">Interactive Shopping Checklist:</strong> Check off items as you buy them from the marketplace, or click <em>Copy Shopping List</em> to paste into game chat.</li>
                  </ul>
                </div>

                {/* Post-Craft Realized */}
                <div className="p-4 rounded-xl bg-albion-card border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-serif font-bold text-amber-300 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-amber-400" />
                      2. Post-Craft Realized Ledger
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      After Crafting
                    </span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                    <li><strong className="text-slate-100">Backpack Quality Logger:</strong> Enter the exact quantities of Normal (Q1), Good (Q2), Outstanding (Q3), Excellent (Q4), and Masterpiece (Q5) that landed in your bag.</li>
                    <li><strong className="text-slate-100">Discrete Dice Simulator:</strong> Simulates Albion&apos;s exact multi-roll quality algorithm if testing batches in advance.</li>
                    <li><strong className="text-slate-100">Weighted Average Realized Margin:</strong> Computes your true weighted revenue and realized net silver profit based on what actually rolled.</li>
                  </ul>
                </div>
              </div>

              {/* Updated Stage 02 Destiny Board & Special Item Mechanics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-albion-card border border-sky-500/25 space-y-2">
                  <h4 className="font-serif font-bold text-sky-300">Stage 02: 1-Tree Destiny Board &amp; Sibling Sliders</h4>
                  <ul className="text-slate-300 space-y-1.5 list-disc list-inside">
                    <li><strong className="text-slate-100">Single In-Game Branch:</strong> Every item line shares <strong>one Mastery node</strong> (for example, all 7 Shapeshifter Staves belong to <em>Shapeshifter Staff Crafter</em>).</li>
                    <li><strong className="text-slate-100">Individual Sibling Spec Sliders:</strong> Set every peer item&apos;s exact Spec (`0–100`) or use <strong>Quick Set All</strong> instead of guessing an average. Non-artifact &amp; Fey peer nodes automatically carry <strong>2x mutual weight</strong> vs <strong>1x</strong> for artifact nodes, and all levels auto-save to browser storage.</li>
                    <li><strong className="text-slate-100">Fame-to-Max-Spec Planner:</strong> Expand the planner below Stage 02 to project crafts, Study vs. Sell paths, Learning Points, and silver required to reach your target Spec.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-albion-card border border-purple-500/25 space-y-2">
                  <h4 className="font-serif font-bold text-purple-300">Cities, Hideouts, Shapeshifters &amp; Non-Returnables</h4>
                  <ul className="text-slate-300 space-y-1.5 list-disc list-inside">
                    <li><strong className="text-slate-100">Caerleon &amp; Brecilien Craft Bonuses:</strong> <strong>Caerleon (+15%)</strong> covers Tools, Gathering Gear, War Gloves, <strong>Shapeshifter Staves</strong>, and Food; <strong>Brecilien (+15%)</strong> covers Bags, Capes, and Potions.</li>
                    <li><strong className="text-slate-100">Outlands &amp; Roads Hideouts:</strong> Switch between <em>Royal City / Island</em> and <em>Outlands / Roads Hideout</em> to combine Power Level (+0% to +26%), Zone Quality, or Roads Resource Specialty (+20%).</li>
                    <li><strong className="text-slate-100">Strict 0% RRR Slots:</strong> Artifacts, <strong>Tracking Animal Remains</strong> (Shapeshifter Staves), <strong>Royal Sigils / Royal Armor</strong>, <strong>Avalonian Energy</strong>, and <strong>Grown Mounts</strong> are non-returnable (0% RRR even with Focus) and grant zero Item Value / Craft Fame.</li>
                  </ul>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong>The Quality Rule:</strong> Every +100 Quality Rating adds another quality dice roll (keeping the highest outcome). Combining 100 Mastery (+75 QR), 100 Item Spec (+675 QR), Mutual Sibling Specs (+300 to +412.5 QR), and <strong>Crafter&apos;s Salad (+150 QR)</strong> yields 1,200+ QR, dropping Normal (Q1) probability below ~1% and turning Outstanding/Excellent/Masterpiece rolls into steady silver windfalls.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: COOKING & FOOD */}
          {activeTab === 'food' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-gradient-to-r from-amber-950/40 via-albion-bg to-amber-950/40 border border-amber-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
                <span className="text-amber-300 font-sans">
                  Ready to test cooking recipes, batch nutrition, and Caerleon return rates?
                </span>
                <button
                  type="button"
                  onClick={() => handleLaunchModuleTour('food')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Launch Food Tour &rarr;</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 to-albion-bg border border-amber-500/30 space-y-2">
                <h3 className="font-serif text-base font-bold text-amber-300 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Chef&apos;s Hearth Economics & Caerleon Bonus
                </h3>
                <p className="text-slate-300 text-xs">
                  Food is constantly consumed across Albion by players for combat/crafting buffs and by crafting stations as nutrition fuel.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-albion-card border border-albion-border space-y-2">
                  <h4 className="font-serif font-bold text-amber-300">Caerleon +15% Local Cooking Bonus</h4>
                  <p className="text-slate-300">
                    Caerleon is the culinary capital of the Royal Continent. Cooking food in Caerleon awards a <strong>+15% local production bonus</strong> (33% total Bonus), while Hideouts can also boost cooking yields:
                  </p>
                  <ul className="text-slate-400 space-y-1 list-disc list-inside font-mono">
                    <li>Caerleon (+15% Bonus): <strong className="text-amber-300">24.8% RRR (47.9% with Focus)</strong></li>
                    <li>Other Royal Cities (0% Bonus): 15.25% RRR (43.5% with Focus)</li>
                    <li>Personal / Guild Island: 0.0% RRR (37.1% with Focus)</li>
                    <li>Outlands &amp; Roads Hideouts: +0% to +26% Power Level + Zone/Specialty</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-albion-card border border-albion-border space-y-2">
                  <h4 className="font-serif font-bold text-amber-300">High-Velocity Food Staples</h4>
                  <p className="text-slate-300">
                    The highest volume, fastest turnover foods in Albion:
                  </p>
                  <ul className="text-slate-400 space-y-1 list-disc list-inside">
                    <li><strong>Pork Omelette:</strong> Essential for PvE healers and PvP mages (Cooldown Reduction).</li>
                    <li><strong>Beef Stew:</strong> Standard damage booster (+13.5% damage) for every DPS build.</li>
                    <li><strong>Roast Pork:</strong> Crucial solo dungeon and corrupt dungeon lifesteal food.</li>
                    <li><strong>Crafter&apos;s Salad:</strong> Mandatory for all gear crafters for +150 Quality Power.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: POTIONS & ALCHEMY */}
          {activeTab === 'potions' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-gradient-to-r from-teal-950/40 via-albion-bg to-teal-950/40 border border-teal-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
                <span className="text-teal-300 font-sans">
                  Ready to brew potions and optimize Silver-per-Focus in the Alchemist Lab?
                </span>
                <button
                  type="button"
                  onClick={() => handleLaunchModuleTour('potions')}
                  className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-mono font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Launch Potions Tour &rarr;</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-teal-950/30 to-albion-bg border border-teal-500/30 space-y-2">
                <h3 className="font-serif text-base font-bold text-teal-300 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-teal-400" />
                  Alchemist Lab Brewing & Herb Reagents
                </h3>
                <p className="text-slate-300 text-xs">
                  Potions are single-use consumables that players drink constantly in ZvZ guild battles, Hellgates, and Mists. Demand is endless.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-albion-card border border-albion-border space-y-2">
                  <h4 className="font-serif font-bold text-teal-300">Brecilien +15% Alchemy Bonus &amp; Hideouts</h4>
                  <p className="text-slate-300">
                    <strong>Brecilien</strong> is Albion&apos;s dedicated Alchemy capital (+15% local production bonus), not Caerleon:
                  </p>
                  <ul className="text-slate-400 space-y-1 list-disc list-inside font-mono">
                    <li>Brecilien (+15% Bonus): <strong className="text-teal-300">24.8% RRR (47.9% with Focus)</strong></li>
                    <li>Royal Cities &amp; Caerleon: 15.25% RRR (43.5% with Focus)</li>
                    <li>Personal / Guild Island: 0.0% RRR (37.1% with Focus)</li>
                    <li>Dragonfire 16-Node Tree: up to <strong>55,000 FCE</strong> (~2.21% of base focus)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-albion-card border border-albion-border space-y-2">
                  <h4 className="font-serif font-bold text-teal-300">Top PVP Potion Meta</h4>
                  <ul className="text-slate-400 space-y-1 list-disc list-inside">
                    <li><strong>Poison Potions (T4, T6, T8):</strong> Huge volume for gankers and PvE mob clearing.</li>
                    <li><strong>Resistance Potions (T5, T7):</strong> Crucial defensives for tanking burst in ZvZ.</li>
                    <li><strong>Invisibility Potions (T8):</strong> High value escape tools used by gatherers and solo rovers.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: FARMING & ANIMALS */}
          {activeTab === 'farming' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-gradient-to-r from-emerald-950/40 via-albion-bg to-emerald-950/40 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
                <span className="text-emerald-300 font-sans">
                  Ready to calculate seed yields, focus watering, and animal slaughter vs. milk?
                </span>
                <button
                  type="button"
                  onClick={() => handleLaunchModuleTour('farming')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Launch Farming Tour &rarr;</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 to-albion-bg border border-emerald-500/30 space-y-2">
                <h3 className="font-serif text-base font-bold text-emerald-300 flex items-center gap-2">
                  <Wheat className="w-4 h-4 text-emerald-400" />
                  Homestead Agriculture & The Infinite Seed Loop
                </h3>
                <p className="text-slate-300 text-xs">
                  Farming is the lowest-risk passive economy in Albion Online. If you water your crops with Focus, you generate free silver every 22 hours.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-albion-card border border-albion-border space-y-2">
                  <h4 className="font-serif font-bold text-emerald-300">The Infinite Seed Loop (Watering)</h4>
                  <p className="text-slate-300">
                    Without watering, seeds have a return rate of ~60-80% (meaning you lose seeds each cycle).
                  </p>
                  <p className="text-slate-400">
                    When you <strong>Water with Focus</strong>, your seed return rate jumps above <strong>100%</strong> (often 106% to 113%). Not only do you keep 100% of your seeds, you get <strong>bonus extra seeds to sell on the market for pure profit</strong>!
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-albion-card border border-albion-border space-y-2">
                  <h4 className="font-serif font-bold text-emerald-300">Livestock: Milk vs. Slaughter</h4>
                  <p className="text-slate-300">
                    Animals can be kept alive for daily produce (e.g. Eggs, Cow Milk, Sheep Milk) or slaughtered at the butcher for raw meat.
                  </p>
                  <p className="text-slate-400">
                    Use our <em>Slaughter vs. Produce</em> toggle to automatically calculate which option yields the highest silver based on today&apos;s meat and milk prices.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: LABORERS & HOUSES */}
          {activeTab === 'laborers' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-gradient-to-r from-purple-950/40 via-albion-bg to-purple-950/40 border border-purple-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
                <span className="text-purple-300 font-sans">
                  Ready to configure your player houses, trophies, and journal returns?
                </span>
                <button
                  type="button"
                  onClick={() => handleLaunchModuleTour('laborers')}
                  className="px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-slate-950 font-mono font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Launch Laborers Tour &rarr;</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/30 to-albion-bg border border-purple-500/30 space-y-2">
                <h3 className="font-serif text-base font-bold text-purple-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  Laborer Estate Mechanics & The 150% Happiness Cap
                </h3>
                <p className="text-slate-300 text-xs">
                  Laborers turn filled crafting journals into massive batches of refined materials and silver every single day.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-albion-card border border-albion-border space-y-2">
                  <h4 className="font-serif font-bold text-purple-300">The 142.5% / 150% Happiness Formula</h4>
                  <p className="text-slate-300">
                    Base happiness yields ~100% of journal loot. Furniture &amp; trophies push returns up to <strong>142.5% in T8 houses</strong> or <strong>150%</strong> in higher-tier houses:
                  </p>
                  <ul className="text-slate-400 space-y-1 list-disc list-inside">
                    <li>1 equal-or-higher Tier <strong>Bed</strong> per laborer + 1 shared equal-or-higher Tier <strong>Table</strong> (up to 4 laborers).</li>
                    <li><strong>Profession Trophies</strong> (+5% happiness each, up to 7 tiers) matched to that craft/gathering type.</li>
                    <li><strong>Generalist Trophies</strong> (+2.5% happiness each, up to 5) &mdash; T8 House + T8 Laborer caps at <strong>142.5% Max Yield</strong>.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-albion-card border border-albion-border space-y-2">
                  <h4 className="font-serif font-bold text-purple-300">Synergy with Crafting</h4>
                  <p className="text-slate-300">
                    Never craft equipment without bringing Empty Journals in your bag!
                  </p>
                  <p className="text-slate-400">
                    Crafting fills the books with fame for free. You then hand the books to your laborers, and tomorrow morning they give you back refined planks, bars, and leather to craft with again!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: BLACK MARKET */}
          {activeTab === 'blackmarket' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-gradient-to-r from-rose-950/40 via-albion-bg to-rose-950/40 border border-rose-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
                <span className="text-rose-300 font-sans">
                  Ready to scan Caerleon buy orders, filter by price freshness, and calculate cargo spreads?
                </span>
                <button
                  type="button"
                  onClick={() => handleLaunchModuleTour('blackmarket')}
                  className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-mono font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Launch Black Market Tour &rarr;</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 to-albion-bg border border-rose-500/30 space-y-2">
                <h3 className="font-serif text-base font-bold text-rose-300 flex items-center gap-2">
                  <Skull className="w-4 h-4 text-rose-400" />
                  Caerleon Black Market, Price Freshness &amp; Red Zone Transport
                </h3>
                <p className="text-slate-300 text-xs">
                  The Black Market in Caerleon buys equipment directly from players to feed mob drop tables across the entire game. Prices steadily rise until filled, creating massive profit margins.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-albion-card border border-albion-border space-y-2 text-xs">
                  <h4 className="font-serif font-bold text-amber-300 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    Quality-Matched Arbitrage &amp; Auto-Fetch
                  </h4>
                  <p className="text-slate-300">
                    Unlike basic flippers that accidentally compare a Normal (Q1) Royal City item against a Masterpiece (Q5) Black Market order, our scanner <strong>strictly matches identical item qualities (Q1–Q5)</strong>.
                  </p>
                  <p className="text-slate-400">
                    Keep <strong>⚡ Auto-Fetch: ON</strong> in the header to automatically scan live prices whenever you change Tier, Enchantment, or Category (plus every 60 seconds).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-albion-card border border-emerald-500/30 space-y-2 text-xs">
                  <h4 className="font-serif font-bold text-emerald-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    Reading Price Age Badges &amp; Freshness Filter
                  </h4>
                  <ul className="text-slate-300 space-y-1.5 list-disc list-inside">
                    <li><strong className="text-emerald-300">🟢 Updated X mins ago (&le; 1 hr):</strong> Fresh scan — high confidence that the order is still open!</li>
                    <li><strong className="text-amber-300">🟡 Updated X hrs ago (1–4 hrs):</strong> Moderate age — verify in-game volume before hauling huge stacks.</li>
                    <li><strong className="text-rose-300">🔴 Updated X hrs ago (&gt; 4 hrs):</strong> Older scan — use the <strong>Max Price Age</strong> dropdown to hide stale orders!</li>
                    <li><strong className="text-indigo-300">⚒️ Craft Cost Est.:</strong> No Royal City listing found; uses estimated bonus-city crafting cost.</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-albion-card border border-rose-500/30 space-y-2 text-xs">
                <h4 className="font-serif font-bold text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Red Zone Hauling Safety Rules
                </h4>
                <ul className="text-slate-300 space-y-1.5 list-disc list-inside">
                  <li><strong>Scout First:</strong> Use an alt or party member on a fast mount to scout the Caerleon border red-zone gates.</li>
                  <li><strong>Armored Mounts:</strong> Always use an Armored Horse, Grizzly Bear, Spectral Direboar, or Pest Lizard that keeps carry capacity if dismounted.</li>
                  <li><strong>Escape Gear:</strong> Equip Miner Boots (Flee), Assassin Jacket (Ambush), and Fort Sterling Cape (CC Immunity) for emergency escape.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 9: FOCUS EFFICIENCY */}
          {activeTab === 'focus' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-albion-bg border border-emerald-500/30 space-y-2">
                <h3 className="font-serif text-base font-bold text-emerald-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  Silver per Focus (SPF) & Destiny Board Scaling
                </h3>
                <p className="text-slate-300 text-xs">
                  Every Premium player generates <strong>10,000 Focus points per day</strong>. Focus efficiency is the true engine of Albion wealth.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-albion-card border border-albion-border space-y-2">
                  <h4 className="font-serif font-bold text-slate-200">What is Silver per Focus (SPF)?</h4>
                  <p className="text-slate-400">
                    SPF represents how much silver each focus point makes you compared to crafting without focus.
                  </p>
                  <div className="space-y-1 pt-1 font-mono">
                    <div className="flex justify-between text-slate-400"><span>Average Refiner:</span> <span className="text-amber-300">20–35 SPF</span></div>
                    <div className="flex justify-between text-slate-300"><span>Skilled Crafter:</span> <span className="text-sky-300">40–75 SPF</span></div>
                    <div className="flex justify-between text-emerald-300 font-bold"><span>100 Spec Master:</span> <span className="text-emerald-400">100–180+ SPF</span></div>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    At 100 SPF, your daily 10,000 focus translates into <strong>1,000,000 free profit silver every single day</strong>!
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-albion-card border border-albion-border space-y-2">
                  <h4 className="font-serif font-bold text-slate-200">How Mastery &amp; Mutual Specs Cut Focus Cost</h4>
                  <p className="text-slate-400">
                    Base Focus cost halves every <strong>10,000 Focus Efficiency (FCE)</strong> points via <code className="text-amber-300">0.5^(FCE/10,000)</code>.
                  </p>
                  <ul className="text-slate-300 space-y-1.5 list-disc list-inside">
                    <li>Weapons scale up to <strong>43,000 FCE</strong> (100 Mastery + 100 Item Spec + 100 Mutual Siblings); Armors reach <strong>47,500 FCE</strong>; Alchemist potions (Dragonfire 16-node) reach <strong>55,000 FCE</strong>.</li>
                    <li>Maxed efficiency cuts Focus cost by <strong>20x to 45x</strong> (~95%&ndash;97.8% reduction), letting 10,000 daily Focus cover huge profitable batches.</li>
                    <li>In Crafting Stage 02, set <strong>each sibling weapon/armor Spec individually</strong> (auto-saved in browser storage) and open the <strong>Fame-to-Max-Spec Planner</strong> to chart your leveling cost.</li>
                  </ul>
                </div>
              </div>

              {/* Focus Dual-Switch Location Guide */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/40 via-[#0b121d] to-[#070b13] border border-sky-500/40 space-y-2 text-xs shadow-inner">
                <h4 className="font-serif font-bold text-sky-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-sky-400" />
                  Where Can I Toggle Focus? (Dual-Switch Controls)
                </h4>
                <p className="text-slate-300">
                  You can toggle Focus ON or OFF at any moment in <strong>two places</strong>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-[#06090f] p-3 rounded-lg border border-[#1e2a3c]">
                    <span className="font-bold text-amber-300 block mb-1">1. Global Top Header</span>
                    <p className="text-slate-400">
                      The persistent <strong>⚡ Focus ON / OFF</strong> button in the top navigation bar updates all calculators simultaneously.
                    </p>
                  </div>
                  <div className="bg-[#06090f] p-3 rounded-lg border border-[#1e2a3c]">
                    <span className="font-bold text-sky-300 block mb-1">2. Inside Every Spec Card</span>
                    <p className="text-slate-400">
                      Every Destiny Board Mastery &amp; Spec card (Refining Stage 06, Crafting Stage 02, Food, Potions, and Farming) now features its own tactile <strong>⚡ Focus: ON / OFF</strong> switch right next to the spec sliders!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: FAQ & LIVE DATA */}
          {activeTab === 'faq' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-albion-card to-albion-card border border-emerald-500/40 space-y-2.5">
                <h4 className="font-serif font-bold text-emerald-300 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  How Our 3-Layer Verified Market Price Engine &amp; Clock Calibration Work
                </h4>
                <p className="text-slate-300">
                  Unlike basic calculators that blindly show raw market data, Albion Artisan protects your calculations across all 7 calculators with <strong>4 accuracy layers</strong>:
                </p>
                <ol className="text-slate-300 space-y-1.5 list-decimal list-inside">
                  <li>
                    <strong>Strict Quality &amp; Freshness Filtering (<code className="text-amber-300">qualities=1</code>):</strong> Resources, food, potions, crops, and journals only exist at Normal (Q1) in-game. We block phantom Q2–Q5 slots and sort strictly by timestamp so old prices never overwrite fresh ones.
                  </li>
                  <li>
                    <strong>24-Hour Traded History Outlier Protection (<code className="text-sky-300">📊 24h Traded Avg</code>):</strong> Every price is cross-checked against real completed sales over the last 24 hours (<code className="text-sky-300">/stats/history/</code>). If a listing is missing or a manipulator posts a fake 9,999,999 silver order, we automatically substitute the true 24-hour traded average.
                  </li>
                  <li>
                    <strong>Automatic Internet Clock Calibration:</strong> Even if your computer or phone system clock/date is out of sync, all 7 calculators automatically calibrate against the live Albion Data Project UTC server clock so <strong>🟢 Updated Xm ago</strong> and <strong>🟡 Updated Xh ago</strong> badges are always 100% accurate.
                  </li>
                  <li>
                    <strong>Shared Community Database (<code className="text-emerald-300">MarketPriceSnapshot</code>):</strong> Whenever <strong>even 1 player</strong> using our site scans &amp; fetches fresh prices, our database permanently saves those verified prices so everyone on the site (including mobile users!) gets the newest prices.
                  </li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-albion-card border border-amber-500/30 space-y-2.5">
                <h4 className="font-serif font-bold text-amber-300 text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  Why do some prices say &ldquo;2h–3h ago&rdquo; &amp; how do I get instant &ldquo;0m ago&rdquo; prices?
                </h4>
                <p className="text-slate-300">
                  Sandbox Interactive intentionally does not provide an official Market API. Prices in the global Albion Data Project only update when a PC player running the free <strong>Albion Data Client (ADC)</strong> opens that city&apos;s market in-game.
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="text-emerald-300 font-semibold">
                    💡 Play on PC? Run the free Albion Data Client in the background (or run <code className="text-amber-300">Setup_Albion_Data_Client.bat</code>) for instant 3-second live updates!
                  </span>
                  <a
                    href="https://github.com/ao-data/albiondata-client/releases/latest/download/albiondata-client-amd64-installer.exe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs transition-all"
                  >
                    Download ADC Scanner (.exe)
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-albion-card border border-albion-border space-y-2">
                <h4 className="font-serif font-bold text-slate-200 text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-sky-400" />
                  Can I install this calculator as a Desktop App or Mobile App?
                </h4>
                <p className="text-slate-300">
                  <strong>Yes!</strong> On mobile or Chrome/Edge, click the <strong>Install App</strong> button in the top bar (or &ldquo;Add to Home Screen&rdquo;) to run it fullscreen with offline icon caching. If you downloaded our project folder on Windows, double-click <strong>Albion Desktop App.vbs</strong> (or the <strong>Albion Artisan Calculator</strong> desktop shortcut) to launch the zero-terminal native desktop window, or <strong>start-albion-local.bat</strong> for developer browser mode!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-albion-card border border-purple-500/30 space-y-2">
                <h4 className="font-serif font-bold text-purple-300 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  How do Outlands vs. Roads of Avalon Hideouts (and Roads Resource Specialty) work?
                </h4>
                <p className="text-slate-300">
                  Albion has <strong>2 Hideout environments</strong>: Outlands Black Zone (base <strong>+15%</strong> Bonus + Zone Quality) and Roads of Avalon (base <strong>+10%</strong> Bonus, or <strong>+20%</strong> if the Roads zone matches your craft via <strong>Roads Zone Resource Specialty</strong>). Both add your Hideout Power Level bonus (<strong>+0% to +26%</strong> across PL 1&ndash;9) &mdash; select <em>Outlands / Roads Hideout</em> in Refining, Gear Crafting, Food, or Potions to compute exact Focus and no-Focus RRR automatically.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-albion-border/80 bg-[#0b0e15] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 font-sans flex items-center gap-2">
            <span>Press</span>
            <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">Esc</kbd>
            <span>to close anytime</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const tourKey = ['uimap', 'quickstart', 'focus', 'faq'].includes(activeTab) ? 'refining' : activeTab;
                handleLaunchModuleTour(tourKey);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Launch Interactive Tour</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors cursor-pointer"
            >
              Got It, Let&apos;s Craft!
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
