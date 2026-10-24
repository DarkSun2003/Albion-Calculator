import React, { useState, useEffect } from 'react';
import { Crown, Server, Sparkles, Settings2, X, Compass, Radio, Search, Download, Check } from 'lucide-react';

export default function Header({
  server,
  setServer,
  hasPremium,
  setHasPremium,
  useFocus,
  setUseFocus,
  onOpenHandbook,
  onStartTour,
  onOpenCommandNavigator,
  onOpenScanner,
}) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsMobileMenuOpen(false);
  };

  const serverLabels = {
    europe: 'EU',
    americas: 'US',
    asia: 'ASIA',
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#070b13]/95 backdrop-blur-md border-b border-slate-800/80 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-900/30 border border-amber-500/40 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              <img
                src="/logo.png"
                alt="Albion Artisan"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-black text-sm sm:text-base tracking-wider text-slate-100 truncate">
                  ALBION ARTISAN
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider hidden sm:inline-block">
                  PRO
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Direct Controls (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-2">
            {/* Quick Finder */}
            {onOpenCommandNavigator && (
              <button
                type="button"
                onClick={onOpenCommandNavigator}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors"
                title="Search tools (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium">Find Tool</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400">Ctrl+K</kbd>
              </button>
            )}

            {/* Server Selector */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs">
              <Server className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <select
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className="bg-transparent text-slate-200 font-mono font-bold focus:outline-none cursor-pointer uppercase text-xs"
              >
                <option value="europe" className="bg-slate-900 text-emerald-300">Europe (EU)</option>
                <option value="americas" className="bg-slate-900 text-sky-300">Americas (US)</option>
                <option value="asia" className="bg-slate-900 text-amber-300">Asia (East)</option>
              </select>
            </div>

            {/* Premium Toggle */}
            <button
              type="button"
              onClick={() => setHasPremium(!hasPremium)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                hasPremium
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crown className={`w-3.5 h-3.5 ${hasPremium ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
              <span>{hasPremium ? 'Premium (4%)' : 'No Prem (8%)'}</span>
            </button>

            {/* Live Scanner Trigger */}
            <button
              type="button"
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Live Scanner</span>
            </button>

            {/* Handbook */}
            <button
              type="button"
              onClick={onOpenHandbook}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Guide</span>
            </button>
          </div>

          {/* Right Header Actions: Fast Mobile Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Global Focus Fast Toggle (Always Visible) */}
            <button
              type="button"
              onClick={() => setUseFocus(!useFocus)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-bold transition-all min-h-[38px] ${
                useFocus
                  ? 'bg-sky-500/20 border-sky-400/60 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={useFocus ? 'Refining Focus is ON' : 'Turn Focus ON'}
            >
              <Sparkles className={`w-3.5 h-3.5 ${useFocus ? 'text-sky-300 fill-sky-300 animate-pulse' : 'text-slate-500'}`} />
              <span>{useFocus ? 'Focus ON' : 'Focus OFF'}</span>
            </button>

            {/* Server Quick Chip on Mobile */}
            <div className="md:hidden flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-amber-300 min-h-[38px]">
              <select
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className="bg-transparent text-amber-300 font-mono font-bold focus:outline-none cursor-pointer uppercase text-xs"
              >
                <option value="europe" className="bg-slate-900 text-emerald-300">EU</option>
                <option value="americas" className="bg-slate-900 text-sky-300">US</option>
                <option value="asia" className="bg-slate-900 text-amber-300">ASIA</option>
              </select>
            </div>

            {/* Mobile Settings Drawer Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              title="Open Settings"
            >
              <Settings2 className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Settings Slide-Up Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full bg-[#0c101a] border-t border-slate-800 rounded-t-2xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif font-bold text-sm text-slate-100">Quick Settings &amp; Tools</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Premium Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div>
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Albion Premium Status</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {hasPremium ? '4% Marketplace Tax Applied' : '8% Marketplace Tax Applied'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHasPremium(!hasPremium)}
                className={`min-h-[40px] px-3.5 rounded-lg text-xs font-bold transition-all border ${
                  hasPremium
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                {hasPremium ? 'Active' : 'Off'}
              </button>
            </div>

            {/* Quick Finder Action */}
            {onOpenCommandNavigator && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenCommandNavigator();
                }}
                className="w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-left hover:bg-slate-800/80 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">Find Tool or Item</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Ctrl+K</span>
              </button>
            )}

            {/* Live Scanner Action */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (onOpenScanner) onOpenScanner();
              }}
              className="w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-left"
            >
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-bold text-emerald-300 block">Live Price Scanner</span>
                  <span className="text-[10px] text-emerald-400/70">Connect Albion Data Client</span>
                </div>
              </div>
              <span className="text-xs text-emerald-400 font-bold">&rarr;</span>
            </button>

            {/* Handbook & Guide */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (onOpenHandbook) onOpenHandbook('uimap');
              }}
              className="w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-left"
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200">Player Handbook &amp; Guides</span>
              </div>
              <span className="text-xs text-slate-400 font-bold">&rarr;</span>
            </button>

            {/* PWA Install */}
            {deferredPrompt && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Install Standalone App</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full min-h-[44px] rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
