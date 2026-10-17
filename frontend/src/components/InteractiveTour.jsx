import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Compass, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  MapPin, 
  Coins, 
  Zap, 
  TrendingUp,
  Server,
  Hammer,
  Flame,
  FlaskConical,
  Wheat,
  Users,
  Skull,
  ShoppingCart,
  Scale,
  Soup,
  ShieldCheck,
  Building,
  Bed,
  Truck
} from 'lucide-react';

export const MODULE_TOURS = {
  refining: {
    name: 'Refining Workshop',
    icon: Layers,
    badgeColor: 'text-amber-300 border-amber-500/40 bg-amber-500/15',
    steps: [
      {
        targetId: '#tour-header-controls',
        title: 'Quick Finder (Ctrl+K), Server, Focus & Live Scanner',
        badge: 'Step 1 of 7',
        icon: Server,
        description: 'Use "Find Tool (Ctrl+K)" anytime to jump straight to any setting! Switch servers (Europe, Americas, Asia), toggle Premium (4% vs 8% tax), toggle Focus (+53.9% RRR), or click "Live Scanner" to download the PC market scanner.',
        placement: 'bottom',
      },
      {
        targetId: '#tour-module-tabs',
        title: '7 Economic Command Modules',
        badge: 'Step 2 of 7',
        icon: Layers,
        description: 'Easily switch between all Albion economic disciplines: Refining Workshop, Gear & Item Crafting, Chef\'s Hearth (Food), Alchemist Lab (Potions), Farming, Laborers, and Caerleon Black Market arbitrage.',
        placement: 'bottom',
      },
      {
        targetId: '#tour-resource-picker',
        title: 'Select Material, Tier & Enchantment',
        badge: 'Step 3 of 7',
        icon: Compass,
        description: 'Pick your raw resource (Hide, Wood, Fiber, Ore, Stone) across Tiers T2 to T8. Select enchantments from .0 Flat up to .4 Pristine with authentic in-game border glows.',
        placement: 'right',
      },
      {
        targetId: '#tour-city-controls',
        title: 'Royal City Bonuses & Station Tax',
        badge: 'Step 4 of 7',
        icon: MapPin,
        description: 'Refining in the native bonus city (e.g., Martlock for Hide, Fort Sterling for Wood) raises your Resource Return Rate from 15.2% up to 36.7% (or 53.9% with Focus)! Enter the station owner\'s nutrition tax and your batch size.',
        placement: 'right',
      },
      {
        targetId: '#tour-price-inputs',
        title: 'Live Market Sync & Price Inputs',
        badge: 'Step 5 of 7',
        icon: Coins,
        description: 'Live prices sync automatically from the Albion Online Data Project with real-time freshness badges. If local market orders change, type directly into any price box to override with your current game prices.',
        placement: 'right',
      },
      {
        targetId: '#tour-focus-spec',
        title: 'Destiny Board Mastery & Specs',
        badge: 'Step 6 of 7',
        icon: Zap,
        description: 'Adjust your Mastery and Specialization sliders to match your in-game Destiny Board. Higher spec slashes Focus cost exponentially, boosting your Silver-per-Focus (SPF) yield!',
        placement: 'right',
      },
      {
        targetId: '#tour-profit-ledger',
        title: 'Real-Time Net Profit & Upfront Purse',
        badge: 'Step 7 of 7',
        icon: TrendingUp,
        description: 'The authoritative ledger calculates your required upfront wallet silver, returned refunded materials, break-even unit price, and true net profit silver after all taxes and nutrition fees.',
        placement: 'left',
      },
    ]
  },
  crafting: {
    name: 'Gear & Weapon Forgemaster',
    icon: Hammer,
    badgeColor: 'text-sky-300 border-sky-500/40 bg-sky-500/15',
    steps: [
      {
        targetId: '#tour-craft-categories',
        title: 'Equipment Categories & Subcategories',
        badge: 'Step 1 of 7',
        icon: Hammer,
        description: 'Select your equipment discipline: Warrior (Swords, Axes, Maces, Plate Armor), Mage (Fire, Holy, Frost, Arcane, Cloth), Hunter (Bows, Daggers, Leather), Off-hands, or Gathering Gear.',
        placement: 'bottom',
      },
      {
        targetId: '#tour-craft-item-picker',
        title: 'Item Catalog & Instant Search',
        badge: 'Step 2 of 7',
        icon: Compass,
        description: 'Choose the exact piece of equipment you want to craft. Type in the search box to quickly filter across 3,400+ weapons, armors, and artifact gear.',
        placement: 'bottom',
      },
      {
        targetId: '#tour-craft-tier-ench',
        title: 'Tier & Enchantment Configuration',
        badge: 'Step 3 of 7',
        icon: Sparkles,
        description: 'Switch between Tier 4 through Tier 8, and choose your enchantment level (.0 Flat, .1 Uncommon, .2 Rare, .3 Exceptional, .4 Pristine).',
        placement: 'bottom',
      },
      {
        targetId: '#tour-craft-workflow-switcher',
        title: 'Pre-Craft Planner vs. Post-Craft Realized',
        badge: 'Step 4 of 7',
        icon: Scale,
        description: 'Toggle between "Phase 1: Pre-Craft Planner" (honest forecast before buying materials) and "Phase 2: Post-Craft Realized" (where you record the actual quality procs that rolled into your bag).',
        placement: 'bottom',
      },
      {
        targetId: '#tour-craft-planner-details',
        title: 'Material Shopping List & Wallet Capital',
        badge: 'Step 5 of 7',
        icon: ShoppingCart,
        description: 'See the exact gross quantities of refined materials and artifacts required. Review your Total Upfront Purse (materials + station nutrition fee + empty journals), and click "Copy Shopping List" to paste directly into Discord or game chat!',
        placement: 'top',
      },
      {
        targetId: '#tour-craft-salad-journals',
        title: 'Crafter\'s Salad Buff & Filled Journals',
        badge: 'Step 6 of 7',
        icon: Zap,
        description: 'Toggle Crafter\'s Salad (+150 Quality Power to multiply Masterpiece and Outstanding chances), and toggle empty craft journals to capture fame for 100% free resale profit silver!',
        placement: 'top',
      },
      {
        targetId: '#tour-craft-realized-ledger',
        title: 'Quality Dice Simulator & Realized Margin',
        badge: 'Step 7 of 7',
        icon: TrendingUp,
        description: 'Click "Simulate Roll (Dice)" to run Albion\'s multi-roll quality algorithm on your batch, or type the exact qualities you rolled. See your weighted realized profit and true silver margin!',
        placement: 'left',
      },
    ]
  },
  food: {
    name: 'Chef\'s Hearth & Cooking',
    icon: Flame,
    badgeColor: 'text-amber-400 border-amber-500/40 bg-amber-500/15',
    steps: [
      {
        targetId: '#tour-food-course-picker',
        title: 'Culinary Courses & Recipes',
        badge: 'Step 1 of 6',
        icon: Soup,
        description: 'Filter food recipes across Soups, Salads, Pies, Omelettes, Stews, Sandwiches, Roasts, and Butchery pantry goods.',
        placement: 'bottom',
      },
      {
        targetId: '#tour-food-item-picker',
        title: 'Meal Selection & Enchantment Level',
        badge: 'Step 2 of 6',
        icon: Compass,
        description: 'Pick your target food item (e.g. Pork Omelette, Beef Stew, Roast Pork) and select fish sauce enchantment level (.0, .1, .2, .3) for enhanced buff stats.',
        placement: 'bottom',
      },
      {
        targetId: '#tour-food-city-controls',
        title: 'Caerleon Cooking Bonus & Batch Size',
        badge: 'Step 3 of 6',
        icon: MapPin,
        description: 'Caerleon has a massive native +15% local cooking bonus (yielding 43.5% RRR without focus, or 53.9% with focus)! Enter station nutrition tax and your batch quantity.',
        placement: 'right',
      },
      {
        targetId: '#tour-food-ingredients',
        title: 'Ingredients & Reagent Costs',
        badge: 'Step 4 of 6',
        icon: Coins,
        description: 'Review the market prices of raw crops, flour, meats, eggs, milk, and fish sauce. Click any price to customize it based on your local market orders.',
        placement: 'right',
      },
      {
        targetId: '#tour-food-focus-spec',
        title: 'Chef Mastery & Spec Sliders',
        badge: 'Step 5 of 6',
        icon: Zap,
        description: 'Enter your Chef Destiny Board mastery and recipe specialization to reduce Focus cost per batch down to a fraction of base.',
        placement: 'right',
      },
      {
        targetId: '#tour-food-ledger',
        title: 'Cooking Net Profit & Nutrition Payout',
        badge: 'Step 6 of 6',
        icon: TrendingUp,
        description: 'Review total revenue, station fees, ingredient costs, refunded returned ingredients, and true net profit silver per cooking session.',
        placement: 'left',
      },
    ]
  },
  potions: {
    name: 'Alchemist Lab & Potions',
    icon: FlaskConical,
    badgeColor: 'text-teal-300 border-teal-500/40 bg-teal-500/15',
    steps: [
      {
        targetId: '#tour-potion-type-picker',
        title: 'Alchemical Categories',
        badge: 'Step 1 of 6',
        icon: FlaskConical,
        description: 'Filter between Healing, Energy, Resistance & Defense, Poison & Debuff, Invisibility & Mobility, and Gathering/Distillery extracts.',
        placement: 'bottom',
      },
      {
        targetId: '#tour-potion-item-picker',
        title: 'Potion Selection & Purity Level',
        badge: 'Step 2 of 6',
        icon: Compass,
        description: 'Select your target potion across T4 through T8, and choose enchantment purity (.0 to .3) using Arcane Extracts.',
        placement: 'bottom',
      },
      {
        targetId: '#tour-potion-city-controls',
        title: 'Caerleon / Brecilien Bonus & Batch Size',
        badge: 'Step 3 of 6',
        icon: MapPin,
        description: 'Brew in Caerleon (+15% local bonus) or Brecilien for boosted return rates. Enter the Alchemist Lab station owner fee and your batch quantity.',
        placement: 'right',
      },
      {
        targetId: '#tour-potion-ingredients',
        title: 'Herbs, Milk & Alcohol Reagents',
        badge: 'Step 4 of 6',
        icon: Coins,
        description: 'Live prices sync for Burdock, Dragon Teasel, Firefern, Ghoul Yarrow, Goat Milk, and Alchemy Extracts with instant override support.',
        placement: 'right',
      },
      {
        targetId: '#tour-potion-focus-spec',
        title: 'Alchemist Mastery & Specialization',
        badge: 'Step 5 of 6',
        icon: Zap,
        description: 'Match your in-game Destiny Board sliders to slash Focus cost and calculate your exact Silver-per-Focus (SPF) ratio.',
        placement: 'right',
      },
      {
        targetId: '#tour-potion-ledger',
        title: 'Net Potion Profit & Break-Even Cost',
        badge: 'Step 6 of 6',
        icon: TrendingUp,
        description: 'Calculate net profit per brew, break-even sell price, total upfront wallet silver needed, and returned herbs.',
        placement: 'left',
      },
    ]
  },
  farming: {
    name: 'Farming & Livestock',
    icon: Wheat,
    badgeColor: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/15',
    steps: [
      {
        targetId: '#tour-farm-mode-picker',
        title: 'Homestead Agricultural Plots',
        badge: 'Step 1 of 6',
        icon: Wheat,
        description: 'Choose your island operation: Crops (Carrots, Wheat, Corn), Herbs (Burdock, Firefern), Pasture Animals (Chickens, Pigs, Cows), or Rare Mounts.',
        placement: 'bottom',
      },
      {
        targetId: '#tour-farm-item-picker',
        title: 'Seed & Animal Selection',
        badge: 'Step 2 of 6',
        icon: Compass,
        description: 'Pick your crop or livestock across Tier 1 through Tier 8.',
        placement: 'bottom',
      },
      {
        targetId: '#tour-farm-homestead-controls',
        title: 'Island Location & Number of Plots',
        badge: 'Step 3 of 6',
        icon: MapPin,
        description: 'Set your island\'s home city (each Royal City offers +10% crop or animal growth bonuses!) and your number of farm plots (9 squares per plot).',
        placement: 'right',
      },
      {
        targetId: '#tour-farm-focus-watering',
        title: 'Focus Watering & Baby Nurturing',
        badge: 'Step 4 of 6',
        icon: Zap,
        description: 'Watering crops with Focus doubles your Seed Return Rate above 100%, allowing you to harvest crops indefinitely without ever rebuying seeds from the market!',
        placement: 'right',
      },
      {
        targetId: '#tour-farm-feed-inputs',
        title: 'Feeding Costs & Harvest Value',
        badge: 'Step 5 of 6',
        icon: Coins,
        description: 'For livestock: compare feed costs against passive milk/egg yields vs. slaughtering for raw meat.',
        placement: 'right',
      },
      {
        targetId: '#tour-farm-yield-ledger',
        title: 'Daily Homestead Net Silver Yield',
        badge: 'Step 6 of 6',
        icon: TrendingUp,
        description: 'Calculates your daily net silver profit, harvest volume, seed recycling balance, and capital investment.',
        placement: 'left',
      },
    ]
  },
  laborers: {
    name: 'Laborers & Journals',
    icon: Users,
    badgeColor: 'text-purple-300 border-purple-500/40 bg-purple-500/15',
    steps: [
      {
        targetId: '#tour-laborer-prof-picker',
        title: 'Laborer Professions',
        badge: 'Step 1 of 6',
        icon: Users,
        description: 'Pick your laborer type: Blacksmith (Metal), Fletcher (Leather/Wood), Imbuer (Cloth), Tinker, Mercenary (Raw Silver), or Gathering laborers.',
        placement: 'bottom',
      },
      {
        targetId: '#tour-laborer-house-config',
        title: 'Guild Hall & House Tiering',
        badge: 'Step 2 of 6',
        icon: Building,
        description: 'Configure your house tier (T2 to T8) and number of laborers. House tier must match or exceed your laborer tier to house them safely.',
        placement: 'right',
      },
      {
        targetId: '#tour-laborer-furniture-config',
        title: 'The 150% Happiness Formula',
        badge: 'Step 3 of 6',
        icon: Bed,
        description: 'To achieve the maximum 150% resource yield, every laborer requires: 1 Bed of equal tier, shared Table of equal tier, and Generalist Trophies.',
        placement: 'right',
      },
      {
        targetId: '#tour-laborer-journal-tier',
        title: 'Journal Tier & Fame Requirements',
        badge: 'Step 4 of 6',
        icon: Compass,
        description: 'Select the tier of journals you send them with (e.g. T5 or T7 journals). Higher tier journals require more fame to fill but return high tier materials.',
        placement: 'right',
      },
      {
        targetId: '#tour-laborer-economics',
        title: 'Journal Purchase Cost vs. Return Value',
        badge: 'Step 5 of 6',
        icon: Coins,
        description: 'Compares the market buy price of Full Journals against the market sell price of the returned refined materials + refunded empty book.',
        placement: 'right',
      },
      {
        targetId: '#tour-laborer-ledger',
        title: 'Daily Laborer Net Silver & Payback Period',
        badge: 'Step 6 of 6',
        icon: TrendingUp,
        description: 'Calculates net daily profit per worker and how many days it takes for your house/furniture investment to pay for itself completely.',
        placement: 'left',
      },
    ]
  },
  blackmarket: {
    name: 'Black Market Arbitrage',
    icon: Skull,
    badgeColor: 'text-rose-400 border-rose-500/40 bg-rose-500/15',
    steps: [
      {
        targetId: '#tour-bm-item-filter',
        title: 'Black Market Scanner & Filters',
        badge: 'Step 1 of 5',
        icon: Skull,
        description: 'Scan live buy orders placed by the Caerleon Black Market. Filter by equipment type (Warrior, Mage, Hunter, Accessories) and tier.',
        placement: 'bottom',
      },
      {
        targetId: '#tour-bm-price-comparison',
        title: 'Royal Continent Price vs. Caerleon Payout',
        badge: 'Step 2 of 5',
        icon: Coins,
        description: 'Compares the cheapest crafting or marketplace purchase price in the 5 Royal Cities directly against the highest Caerleon buy order.',
        placement: 'bottom',
      },
      {
        targetId: '#tour-bm-arbitrage-spread',
        title: 'Arbitrage Profit Spread & Margins',
        badge: 'Step 3 of 5',
        icon: TrendingUp,
        description: 'See your true net profit per item after deducting Caerleon 4% market tax, and the profit margin percentage.',
        placement: 'top',
      },
      {
        targetId: '#tour-bm-hauling-weight',
        title: 'Cargo Weight & Mount Capacity',
        badge: 'Step 4 of 5',
        icon: Truck,
        description: 'Review total haul weight and recommended transport mounts (Grizzly Bear, Armored Horse, Pest Lizard) that don\'t lose speed when dismounted.',
        placement: 'top',
      },
      {
        targetId: '#tour-bm-safety-guide',
        title: 'Red Zone Danger & Safety Protocol',
        badge: 'Step 5 of 5',
        icon: ShieldCheck,
        description: 'Follow our essential Red Zone hauling checklist: scout the Caerleon border gates first, equip Miner Boots and Assassin Jacket, and never run overweight!',
        placement: 'top',
      },
    ]
  }
};

export default function InteractiveTour({ 
  isActive, 
  activeModule = 'refining', 
  onSelectModule, 
  onComplete, 
  onSkip 
}) {
  const [currentModule, setCurrentModule] = useState(activeModule);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const tooltipRef = useRef(null);

  // Sync module if parent tab changes
  useEffect(() => {
    if (activeModule && MODULE_TOURS[activeModule]) {
      setCurrentModule(activeModule);
      setCurrentStepIndex(0);
    }
  }, [activeModule]);

  const activeTour = MODULE_TOURS[currentModule] || MODULE_TOURS.refining;
  const tourSteps = activeTour.steps;
  const step = tourSteps[currentStepIndex] || tourSteps[0];

  const handleSwitchModule = (modKey) => {
    setCurrentModule(modKey);
    setCurrentStepIndex(0);
    if (onSelectModule) {
      onSelectModule(modKey);
    }
  };

  // Update target bounding box
  const updateTargetPosition = useCallback(() => {
    if (!isActive || !step) return;

    const el = document.querySelector(step.targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
      });
    } else {
      setTargetRect(null);
    }
  }, [isActive, step]);

  useEffect(() => {
    updateTargetPosition();
    const handleResize = () => updateTargetPosition();
    const handleScroll = () => {
      const el = document.querySelector(step?.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    const timeout = setTimeout(updateTargetPosition, 300);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      clearTimeout(timeout);
    };
  }, [updateTargetPosition, step]);

  // Handle Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStepIndex < tourSteps.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
        } else {
          onComplete();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStepIndex > 0) {
          setCurrentStepIndex(prev => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStepIndex, tourSteps.length, onComplete, onSkip]);

  if (!isActive || !step) return null;

  const Icon = step.icon || Compass;
  const isLastStep = currentStepIndex === tourSteps.length - 1;

  // Calculate Tooltip Coordinates
  let tooltipStyle = {};
  const padding = 16;
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  if (targetRect) {
    const isMobile = windowWidth < 768;

    if (isMobile) {
      tooltipStyle = {
        position: 'fixed',
        bottom: '24px',
        left: '16px',
        right: '16px',
        zIndex: 100,
      };
    } else if (step.placement === 'bottom') {
      tooltipStyle = {
        position: 'fixed',
        top: `${Math.min(windowHeight - 320, targetRect.bottom + padding)}px`,
        left: `${Math.max(16, Math.min(windowWidth - 460, targetRect.left))}px`,
        width: '440px',
        zIndex: 100,
      };
    } else if (step.placement === 'left') {
      tooltipStyle = {
        position: 'fixed',
        top: `${Math.max(20, Math.min(windowHeight - 340, targetRect.top))}px`,
        left: `${Math.max(16, targetRect.left - 460 - padding)}px`,
        width: '440px',
        zIndex: 100,
      };
    } else if (step.placement === 'top') {
      tooltipStyle = {
        position: 'fixed',
        bottom: `${Math.max(20, windowHeight - targetRect.top + padding)}px`,
        left: `${Math.max(16, Math.min(windowWidth - 460, targetRect.left))}px`,
        width: '440px',
        zIndex: 100,
      };
    } else {
      // Default: place on right or bottom
      const canFitRight = targetRect.right + 460 + padding < windowWidth;
      if (canFitRight) {
        tooltipStyle = {
          position: 'fixed',
          top: `${Math.max(20, Math.min(windowHeight - 340, targetRect.top))}px`,
          left: `${targetRect.right + padding}px`,
          width: '440px',
          zIndex: 100,
        };
      } else {
        tooltipStyle = {
          position: 'fixed',
          top: `${Math.min(windowHeight - 320, targetRect.bottom + padding)}px`,
          left: `${Math.max(16, targetRect.left)}px`,
          width: '440px',
          zIndex: 100,
        };
      }
    }
  } else {
    // Fallback: center of screen
    tooltipStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '440px',
      zIndex: 100,
    };
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* Dark backdrop */}
      <div 
        onClick={onSkip}
        className="absolute inset-0 bg-black/75 transition-opacity duration-300" 
      />

      {/* Target Element Spotlight Cutout Ring */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: `${targetRect.top - 6}px`,
            left: `${targetRect.left - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            borderRadius: '16px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 25px 4px rgba(245, 158, 11, 0.65)',
            pointerEvents: 'none',
            zIndex: 90,
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            border: '2px solid rgba(245, 158, 11, 0.9)',
          }}
        />
      )}

      {/* Floating Tooltip Card */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className="bg-albion-surface border border-amber-500/80 rounded-2xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(245,158,11,0.25)] text-slate-100 ring-1 ring-amber-400/40 animate-fade-in"
      >
        {/* Module Switcher Pills */}
        <div className="mb-3 pb-2.5 border-b border-albion-border/70">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1.5">
            <span className="flex items-center gap-1 text-amber-300 font-bold">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>GUIDED TOUR MODULE:</span>
            </span>
            <span className="text-slate-400">Click to switch</span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {Object.entries(MODULE_TOURS).map(([key, mod]) => {
              const isModActive = key === currentModule;
              const ModIcon = mod.icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSwitchModule(key)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-serif font-bold whitespace-nowrap transition-all ${
                    isModActive
                      ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 shadow-sm'
                      : 'bg-slate-800/40 border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <ModIcon className={`w-3 h-3 ${isModActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{mod.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Header */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-sm shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${activeTour.badgeColor}`}>
                {activeTour.name} &bull; {step.badge}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onSkip}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Skip Tour (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <h3 className="font-serif text-base font-bold text-slate-100 tracking-wide mb-1.5">
          {step.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed font-sans mb-4">
          {step.description}
        </p>

        {/* Step dots & Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-albion-border/70">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {tourSteps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex 
                    ? 'w-5 bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]' 
                    : idx < currentStepIndex 
                    ? 'bg-amber-600/70' 
                    : 'bg-slate-700'
                }`}
                title={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSkip}
              className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors cursor-pointer mr-1"
            >
              Skip
            </button>

            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStepIndex(prev => prev - 1)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (isLastStep) {
                  onComplete();
                } else {
                  setCurrentStepIndex(prev => prev + 1);
                }
              }}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-mono text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            >
              <span>{isLastStep ? 'Finish Tour' : 'Next'}</span>
              {!isLastStep && <ChevronRight className="w-3.5 h-3.5 text-slate-950" />}
              {isLastStep && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
