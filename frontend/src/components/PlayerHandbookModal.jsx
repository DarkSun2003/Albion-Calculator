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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-albion-surface border border-albion-border/90 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 ring-1 ring-amber-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-albion-border/80 bg-gradient-to-r from-albion-card via-albion-surface to-albion-card flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#07090e] flex items-center justify-center border border-amber-400/60 shadow-gold-glow shrink-0 overflow-hidden">
              <img src="/logo.png" alt="Albion Artisan" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500">
                  Albion Artisan Master Codex &amp; UI Map
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold uppercase">
                  All 7 Disciplines
                </span>
              </div>
              <p className="text-xs text-slate-400 font-serif">
                Click any feature below to teleport straight to it, or read the economic blueprints for all 7 calculators
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition-colors"
            title="Close Handbook (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (Horizontal Scrollable) */}
        <div className="bg-[#0b0e15] border-b border-albion-border/70 px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {HANDBOOK_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-serif font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-950/60 border border-amber-500/70 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm leading-relaxed scrollbar-thin">
          
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
                      title: 'Royal City Bonus & Station Tax',
                      desc: 'Select your city (+40% RRR specialty badge), batch size, and nutrition fee.',
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
                      badge: 'Stage 04',
                      title: 'Focus Mastery & Spec Sliders',
                      desc: 'Use the 1-click 0 / 50 / Max 100 Spec buttons or adjust individual tier sliders.',
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
                      bonus: '+40% Royal City Bonus',
                      desc: 'Planks, Metal Bars, Leather, Cloth, and Stone Blocks with 6-city arbitrage.',
                      mod: 'refining',
                      sel: '#tour-resource-picker',
                    },
                    {
                      name: '⚔️ Gear & Weapon Forge',
                      bonus: '3,400+ Craftable Items',
                      desc: 'Pre-craft shopping list, Kraken Salad quality buffs, Journals, and Post-Craft quality procs.',
                      mod: 'crafting',
                      sel: '#tour-craft-categories',
                    },
                    {
                      name: "🍲 Chef's Hearth (Food)",
                      bonus: '+15% Caerleon Bonus',
                      desc: 'Stews, Omelettes, Pies, Salads, Roasts, Fish Sauces, and Butcher meat chopping.',
                      mod: 'cooking',
                      sel: '#tour-food-categories',
                    },
                    {
                      name: "🧪 Alchemist's Lab (Potions)",
                      bonus: '+15% Brecilien / Caerleon',
                      desc: 'Healing, Energy, Poison, Resistance, Sticky, and Gigantify potions + Arcane extracts.',
                      mod: 'potions',
                      sel: '#tour-potion-categories',
                    },
                    {
                      name: '🌾 Agriculture & Pastures',
                      bonus: 'Island Crops, Herbs & Animals',
                      desc: 'Seed return rates, Focus watering profit, and mount/livestock raising.',
                      mod: 'farming',
                      sel: '#tour-farming-categories',
                    },
                    {
                      name: '👷 Guild Laborers & Houses',
                      bonus: 'Up to 150% Trophy Yield',
                      desc: 'Compare buying filled journals vs self-filling, furniture tiers, and daily passive silver.',
                      mod: 'laborers',
                      sel: '#tour-laborer-Selector',
                    },
                    {
                      name: '💀 Caerleon Black Market',
                      bonus: 'Royal-to-Caerleon Flipper',
                      desc: 'Scan Royal City sell orders against Caerleon NPC buy orders + Red-Zone haul risk.',
                      mod: 'blackmarket',
                      sel: '#tour-bm-radar-controls',
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
                  <h4 className="font-serif font-bold text-slate-200 text-sm">Refine & Craft in Bonus Cities</h4>
                  <p className="text-xs text-slate-400">
                    Always manufacture in the city with the <strong>native local production bonus</strong>. This raises your Resource Return Rate from 15.2% up to <strong>36.7%</strong> (or <strong>53.9% with Focus</strong>)!
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
                  Royal Continent Resource Return Rate (RRR) Matrix
                </h3>
                <p className="text-slate-300 text-xs">
                  Refining in the native bonus city gives a <strong>+15% local refining bonus</strong>, raising base RRR to <strong>36.7%</strong> and Focus RRR to <strong>53.9%</strong>:
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-albion-border">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#0b0e15] text-slate-400 font-serif uppercase tracking-wider border-b border-albion-border">
                    <tr>
                      <th className="py-2.5 px-3">City</th>
                      <th className="py-2.5 px-3">Primary Refining Resource</th>
                      <th className="py-2.5 px-3">No-Focus RRR</th>
                      <th className="py-2.5 px-3">With-Focus RRR</th>
                      <th className="py-2.5 px-3">Equipment Crafting Bonus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-albion-border/40 font-mono">
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-serif font-bold text-slate-100">Martlock</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">Hide &rarr; Leather</td>
                      <td className="py-2.5 px-3 text-sky-300">36.7%</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">53.9%</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">Axes, Quarterstaffs, Frost, Shoes</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-serif font-bold text-slate-100">Fort Sterling</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">Wood &rarr; Planks</td>
                      <td className="py-2.5 px-3 text-sky-300">36.7%</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">53.9%</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">Hammers, Spears, Holy, Plate Helmets</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-serif font-bold text-slate-100">Lymhurst</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">Fiber &rarr; Cloth</td>
                      <td className="py-2.5 px-3 text-sky-300">36.7%</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">53.9%</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">Swords, Bows, Arcane, Leather Helmets</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-serif font-bold text-slate-100">Bridgewatch</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">Ore &rarr; Metal Bars</td>
                      <td className="py-2.5 px-3 text-sky-300">36.7%</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">53.9%</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">Crossbows, Daggers, Cursed, Plate Armor</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-serif font-bold text-slate-100">Thetford</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">Ore &rarr; Stone Blocks</td>
                      <td className="py-2.5 px-3 text-sky-300">36.7%</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">53.9%</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">Maces, Fire, Nature, Cloth Armor</td>
                    </tr>
                  </tbody>
                </table>
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
                      1. Pre-Craft Planner & Shopping List
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

              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong>The Quality Rule:</strong> With 100 Mastery, 100 Spec (+675 Quality Rating), and Crafter&apos;s Salad (+150 QR), Normal quality chance drops from 68.9% down to only ~2.7%! Outstanding and Excellent procs occur regularly, turning good crafts into massive silver windfalls.
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
                    Caerleon is the food capital of the Royal Continent. Cooking food in Caerleon awards a <strong>+15% local production bonus</strong>:
                  </p>
                  <ul className="text-slate-400 space-y-1 list-disc list-inside font-mono">
                    <li>Royal Cities (No Bonus): 15.2% RRR (43.5% with Focus)</li>
                    <li>Caerleon (Bonus Active): <strong>24.8% RRR (53.9% with Focus)</strong></li>
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
                  <h4 className="font-serif font-bold text-teal-300">City Bonuses for Potions</h4>
                  <p className="text-slate-300">
                    Just like cooking, <strong>Caerleon</strong> and <strong>Brecilien</strong> have local production bonuses for alchemy:
                  </p>
                  <ul className="text-slate-400 space-y-1 list-disc list-inside">
                    <li>Brewing in Caerleon yields high return rates without requiring focus.</li>
                    <li>Always check whether shipping herbs from Lymhurst to Caerleon yields higher arbitrage profit.</li>
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
                  <h4 className="font-serif font-bold text-purple-300">The 150% Happiness Formula</h4>
                  <p className="text-slate-300">
                    A laborer with base happiness only returns ~100% of journal loot. With maximum happiness, they return <strong>150% loot</strong>!
                  </p>
                  <ul className="text-slate-400 space-y-1 list-disc list-inside">
                    <li>1 Bed of matching or higher Tier per laborer.</li>
                    <li>1 Shared Table of matching or higher Tier (accommodates up to 4 laborers).</li>
                    <li>Generalist Trophies of each tier up to your laborer tier.</li>
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
                  Ready to scan Caerleon buy orders and calculate cargo transport spreads?
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
                  Caerleon Black Market & Red Zone Transport
                </h3>
                <p className="text-slate-300 text-xs">
                  The Black Market in Caerleon buys equipment directly from players to feed mob drop tables across the entire game. Prices steadily rise until filled, creating massive profit margins.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-albion-card border border-albion-border space-y-2 text-xs">
                  <h4 className="font-serif font-bold text-amber-300 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    How Buy Orders Work
                  </h4>
                  <p className="text-slate-300">
                    Unlike normal markets where players sell to other players, the Black Market places <strong>system-generated buy orders</strong>. If an item is rarely crafted or delivered, its buy order price rises every minute until someone sells it.
                  </p>
                  <p className="text-slate-400">
                    Use our <em>Black Market Arbitrage</em> tab to compare royal city crafting costs directly against Caerleon buy order payouts.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-albion-card border border-rose-500/30 space-y-2 text-xs">
                  <h4 className="font-serif font-bold text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Red Zone Hauling Safety Rules
                  </h4>
                  <ul className="text-slate-300 space-y-1.5 list-disc list-inside">
                    <li><strong>Scout First:</strong> Use an alt or party member naked on a swiftclaw to scout the Caerleon gate red zones.</li>
                    <li><strong>Armored Mounts:</strong> Always use an Armored Horse, Grizzly Bear, or Pest Lizard. Never use oxes that lose speed on dismount.</li>
                    <li><strong>Invisibility Gear:</strong> Equip Miner Boots (Flee) and Assassin Jacket (Invisibility) for emergency escape.</li>
                  </ul>
                </div>
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
                  <h4 className="font-serif font-bold text-slate-200">How Mastery Reduces Focus Cost</h4>
                  <p className="text-slate-400">
                    Base focus cost is halved every 10,000 Focus Efficiency points.
                  </p>
                  <ul className="text-slate-300 space-y-1.5 list-disc list-inside">
                    <li>At 0 spec: T8 item costs ~<strong>8,914 Focus</strong> to craft.</li>
                    <li>At 100/100 mastery & spec: T8 item costs only ~<strong>423 Focus</strong> to craft!</li>
                    <li>That means you can craft <strong>20x more items</strong> with the same 10,000 daily focus.</li>
                  </ul>
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
                  How Our 3-Layer Verified Market Price Engine Works
                </h4>
                <p className="text-slate-300">
                  Unlike basic calculators that blindly show raw market data, Albion Artisan protects your calculations with <strong>3 accuracy layers</strong>:
                </p>
                <ol className="text-slate-300 space-y-1.5 list-decimal list-inside">
                  <li>
                    <strong>Strict Quality &amp; Freshness Filtering (<code className="text-amber-300">qualities=1</code>):</strong> Resources, food, potions, crops, and journals only exist at Normal (Q1) in-game. We block phantom Q2–Q5 slots and sort strictly by timestamp so old prices never overwrite fresh ones.
                  </li>
                  <li>
                    <strong>24-Hour Traded History Outlier Protection:</strong> Every price is cross-checked against real completed sales over the last 24 hours (<code className="text-sky-300">/stats/history/</code>). If a listing is missing or a manipulator posts a fake 9,999,999 silver order, we automatically substitute the true 24-hour traded average.
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
                    💡 Play on PC? Run the free Albion Data Client in the background for instant 3-second live updates!
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
                  <strong>Yes!</strong> On mobile or Chrome/Edge, click the <strong>Install App</strong> button in the top bar (or &ldquo;Add to Home Screen&rdquo;) to run it fullscreen with offline icon caching. If you downloaded our project folder on Windows, double-click the <strong>Albion Artisan Calculator</strong> desktop shortcut to run the ultra-lightweight local SQLite Desktop App!
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
              onClick={() => handleLaunchModuleTour(activeTab === 'quickstart' ? 'refining' : activeTab)}
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
