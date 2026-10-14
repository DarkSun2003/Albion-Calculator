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
  Scale
} from 'lucide-react';

const HANDBOOK_TABS = [
  { id: 'quickstart', label: '🔰 Quickstart', icon: Compass },
  { id: 'crafting', label: '🛒 Crafting Workflow', icon: Hammer },
  { id: 'cities', label: '🏙️ City RRR Matrix', icon: MapPin },
  { id: 'blackmarket', label: '💀 Black Market Hauling', icon: Skull },
  { id: 'focus', label: '⚡ Focus Efficiency', icon: Zap },
  { id: 'faq', label: '❓ FAQ & Live Data', icon: HelpCircle },
];

export default function PlayerHandbookModal({ isOpen, onClose, onStartTour }) {
  const [activeTab, setActiveTab] = useState('quickstart');

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-albion-surface border border-albion-border/90 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 ring-1 ring-amber-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-albion-border/80 bg-gradient-to-r from-albion-card via-albion-surface to-albion-card flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-950 flex items-center justify-center border border-amber-400/50 shadow-gold-glow shrink-0">
              <BookOpen className="w-5 h-5 text-slate-950 fill-amber-300 drop-shadow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500">
                  Player Handbook & Navigation Codex
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold uppercase">
                  Guide
                </span>
              </div>
              <p className="text-xs text-slate-400 font-serif">
                Master Albion Online economy, city bonuses, crafting workflow, and silver optimization
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

        {/* Top Interactive Walkthrough Banner */}
        <div className="bg-gradient-to-r from-amber-950/50 via-sky-950/40 to-amber-950/50 border-b border-amber-500/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-sans">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>
              First time on the site? Prefer a guided, interactive walk through the buttons on your screen?
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onStartTour();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs tracking-wider transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Start Interactive Tour &rarr;</span>
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
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-serif font-bold whitespace-nowrap transition-all ${
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
          
          {/* TAB 1: QUICKSTART */}
          {activeTab === 'quickstart' && (
            <div className="space-y-6 animate-fade-in">
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
                  <h4 className="font-serif font-bold text-slate-200 text-sm">Refine in Bonus Cities</h4>
                  <p className="text-xs text-slate-400">
                    Always refine in the city that has the <strong>native 15% local production bonus</strong>. This raises your Resource Return Rate from 15.2% up to <strong>36.7%</strong> (or <strong>53.9% with Focus</strong>)!
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
                    Carry <strong>Empty Journals</strong> in your bag to capture fame for 100% free resale profit, and eat <strong>Crafter's Salad</strong> (+150 Quality Rating) before hitting the forge.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-albion-bg/80 border border-albion-border space-y-3">
                <h4 className="font-serif font-bold text-slate-200 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  Site Navigation Roadmap
                </h4>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-amber-400 font-bold shrink-0">1. Top Header:</span>
                    <span>Switch your server region (Europe, Americas, Asia), toggle Premium (drops tax from 8% to 4%), and toggle Focus.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-amber-400 font-bold shrink-0">2. Module Tabs:</span>
                    <span>Navigate between Refining, Gear Crafting, Cooking, Potions, Farming, Laborers, and Caerleon Black Market.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-amber-400 font-bold shrink-0">3. Live Prices:</span>
                    <span>Live prices fetch automatically from the Albion Online Data Project. You can type manual prices anytime to match current market boards.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-amber-400 font-bold shrink-0">4. Right-Hand Ledger:</span>
                    <span>Review your total upfront silver needed, break-even unit cost, return rate refunds, and net profit.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CRAFTING WORKFLOW */}
          {activeTab === 'crafting' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/40 to-albion-bg border border-sky-500/30 space-y-2">
                <h3 className="font-serif text-base font-bold text-sky-300 flex items-center gap-2">
                  <Hammer className="w-4 h-4 text-sky-400" />
                  Pre-Craft Planning vs. Post-Craft Realized Ledger
                </h3>
                <p className="text-slate-300 text-xs">
                  Why is the Gear Crafting calculator divided into two distinct phases? Because before you craft, <strong>it is impossible to know what quality you will get!</strong>
                </p>
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
                    <li><strong className="text-slate-100">Destiny Board Specs:</strong> Set your Mastery and Specialization sliders to see your Quality Rating boost.</li>
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
                    <li><strong className="text-slate-100">Discrete Dice Simulator:</strong> Simulates Albion's exact multi-roll quality algorithm if testing batches in advance.</li>
                    <li><strong className="text-slate-100">Weighted Average Realized Margin:</strong> Computes your true weighted revenue and realized net silver profit based on what actually rolled.</li>
                  </ul>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong>The Quality Rule:</strong> With 100 Mastery, 100 Spec (+675 Quality Rating), and Crafter's Salad (+150 QR), Normal quality chance drops from 68.9% down to only ~2.7%! Outstanding and Excellent procs occur regularly, turning good crafts into massive silver windfalls.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: CITY RRR MATRIX */}
          {activeTab === 'cities' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 to-albion-bg border border-amber-500/30 space-y-2">
                <h3 className="font-serif text-base font-bold text-amber-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  Royal Continent Resource Return Rate (RRR) Matrix
                </h3>
                <p className="text-slate-300 text-xs">
                  Refining in the native bonus city gives a <strong>+15% local refining bonus</strong>, raising base RRR to <strong>36.7%</strong> and Focus RRR to <strong>53.9%</strong>. Never refine outside these cities:
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
                      <th className="py-2.5 px-3">Gear Crafting Bonus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-albion-border/40 font-mono">
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-serif font-bold text-slate-100 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        Martlock
                      </td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">Hide &rarr; Leather</td>
                      <td className="py-2.5 px-3 text-sky-300">36.7%</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">53.9%</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">Axes, Quarterstaffs, Frost, Shoes</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-serif font-bold text-slate-100 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-200" />
                        Fort Sterling
                      </td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">Wood &rarr; Planks</td>
                      <td className="py-2.5 px-3 text-sky-300">36.7%</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">53.9%</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">Hammers, Spears, Holy, Plate Helmets</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-serif font-bold text-slate-100 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Lymhurst
                      </td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">Fiber &rarr; Cloth</td>
                      <td className="py-2.5 px-3 text-sky-300">36.7%</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">53.9%</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">Swords, Bows, Arcane, Leather Helmets</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-serif font-bold text-slate-100 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Bridgewatch
                      </td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">Ore &rarr; Metal Bars</td>
                      <td className="py-2.5 px-3 text-sky-300">36.7%</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">53.9%</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">Crossbows, Daggers, Cursed, Plate Armor</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-serif font-bold text-slate-100 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        Thetford
                      </td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">Ore &rarr; Stone Blocks</td>
                      <td className="py-2.5 px-3 text-sky-300">36.7%</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">53.9%</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">Maces, Fire, Nature, Cloth Armor</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-serif font-bold text-slate-100 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Caerleon
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">None (General)</td>
                      <td className="py-2.5 px-3 text-slate-400">15.2%</td>
                      <td className="py-2.5 px-3 text-sky-300">43.5%</td>
                      <td className="py-2.5 px-3 text-rose-300 font-sans">Gathering Gear, Tools, Food & Potions</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-serif font-bold text-slate-100 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-teal-400" />
                        Brecilien
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">None (General)</td>
                      <td className="py-2.5 px-3 text-slate-400">15.2%</td>
                      <td className="py-2.5 px-3 text-sky-300">43.5%</td>
                      <td className="py-2.5 px-3 text-teal-300 font-sans">Capes, Bags & Avalonian Tools</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: BLACK MARKET */}
          {activeTab === 'blackmarket' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 to-albion-bg border border-rose-500/30 space-y-2">
                <h3 className="font-serif text-base font-bold text-rose-300 flex items-center gap-2">
                  <Skull className="w-4 h-4 text-rose-400" />
                  Caerleon Black Market & Red Zone Transport
                </h3>
                <p className="text-slate-300 text-xs">
                  The Black Market in Caerleon buys equipment directly from players to feed PvE mob drop tables across the entire game. Prices steadily rise until filled, creating massive profit margins.
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

          {/* TAB 5: FOCUS EFFICIENCY */}
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

          {/* TAB 6: FAQ & LIVE DATA */}
          {activeTab === 'faq' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="p-4 rounded-xl bg-albion-card border border-albion-border space-y-2">
                <h4 className="font-serif font-bold text-slate-200 text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  Where do the live prices come from?
                </h4>
                <p className="text-slate-400">
                  Prices are fetched from the community-driven <strong>Albion Online Data Project (AODP)</strong>. Active players running the Albion Data Client automatically upload market board snapshots when opening market stalls in-game.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-albion-card border border-albion-border space-y-2">
                <h4 className="font-serif font-bold text-slate-200 text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  Why do some prices say &ldquo;X hours ago&rdquo; or &ldquo;No Orders&rdquo;?
                </h4>
                <p className="text-slate-400">
                  If an item or enchantment (like T8.3 Pristine) has low trading volume or nobody has opened its market tab recently with the data client running, the price record will be older.
                </p>
                <p className="text-emerald-400 font-sans">
                  <strong>Pro-Tip:</strong> Whenever a price is outdated or you see a different price in-game, simply click into any price box and type your current local market price. The calculator immediately recalculates with your manual entry!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-albion-card border border-albion-border space-y-2">
                <h4 className="font-serif font-bold text-slate-200 text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  Does this support Europe, Americas, and Asia servers?
                </h4>
                <p className="text-slate-400">
                  Yes! Use the server dropdown in the top header. Selecting <strong>Europe</strong>, <strong>Americas (West)</strong>, or <strong>Asia (East)</strong> switches the live price feed and calculations to that specific realm.
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
                onClose();
                onStartTour();
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
