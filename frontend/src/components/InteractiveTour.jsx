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
  Server
} from 'lucide-react';

const TOUR_STEPS = [
  {
    targetId: '#tour-header-controls',
    title: 'Server Realm, Premium & Focus Controls',
    badge: 'Step 1 of 7',
    icon: Server,
    description: 'Select your Albion server realm (Europe, Americas, or Asia). Toggle Premium status (which cuts market tax in half from 8% down to 4%), and toggle Crafting Focus to simulate 53.9% Resource Return Rates.',
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
];

export default function InteractiveTour({ isActive, onComplete, onSkip }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const tooltipRef = useRef(null);

  const step = TOUR_STEPS[currentStepIndex];

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
        if (currentStepIndex < TOUR_STEPS.length - 1) {
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
  }, [isActive, currentStepIndex, onComplete, onSkip]);

  if (!isActive || !step) return null;

  const Icon = step.icon;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  // Calculate Tooltip Coordinates
  let tooltipStyle = {};
  const padding = 16;
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  if (targetRect) {
    const isMobile = windowWidth < 768;

    if (isMobile) {
      // On small screens, pin tooltip neatly to bottom
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
        top: `${Math.min(windowHeight - 280, targetRect.bottom + padding)}px`,
        left: `${Math.max(16, Math.min(windowWidth - 440, targetRect.left))}px`,
        width: '420px',
        zIndex: 100,
      };
    } else if (step.placement === 'left') {
      tooltipStyle = {
        position: 'fixed',
        top: `${Math.max(20, Math.min(windowHeight - 320, targetRect.top))}px`,
        left: `${Math.max(16, targetRect.left - 440 - padding)}px`,
        width: '420px',
        zIndex: 100,
      };
    } else {
      // Default: place on right or bottom
      const canFitRight = targetRect.right + 440 + padding < windowWidth;
      if (canFitRight) {
        tooltipStyle = {
          position: 'fixed',
          top: `${Math.max(20, Math.min(windowHeight - 320, targetRect.top))}px`,
          left: `${targetRect.right + padding}px`,
          width: '420px',
          zIndex: 100,
        };
      } else {
        tooltipStyle = {
          position: 'fixed',
          top: `${Math.min(windowHeight - 280, targetRect.bottom + padding)}px`,
          left: `${Math.max(16, targetRect.left)}px`,
          width: '420px',
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
      width: '420px',
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
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-sm shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider">
              {step.badge}
            </span>
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
            {TOUR_STEPS.map((_, idx) => (
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
              Skip Tour
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
              <span>{isLastStep ? 'Complete Tour' : 'Next'}</span>
              {!isLastStep && <ChevronRight className="w-3.5 h-3.5" />}
              {isLastStep && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
