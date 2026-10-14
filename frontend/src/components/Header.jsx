import React from 'react';
import { Crown, Server, Sparkles, Shield, Compass, BookOpen } from 'lucide-react';

export default function Header({
  server,
  setServer,
  hasPremium,
  setHasPremium,
  useFocus,
  setUseFocus,
  onOpenHandbook,
  onStartTour,
}) {
  const serverColors = {
    europe: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
    americas: 'bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.8)]',
    asia: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
  };

  return (
    <header className="border-b border-amber-950/40 bg-[#07090e]/90 backdrop-blur-xl sticky top-0 z-50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div id="tour-brand" className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-950 flex items-center justify-center border border-amber-400/50 animate-forge-glow shrink-0">
            <Shield className="w-6 h-6 text-slate-950 fill-amber-300 drop-shadow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 drop-shadow">
                ALBION ARTISAN
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold tracking-widest shadow-gold-glow">
                FORGEMASTER
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-serif tracking-wide hidden sm:block">
              Royal Economic Engine &bull; Contraband Hauling Ledger
            </p>
          </div>
        </div>

        {/* Global Controls & Guide Action */}
        <div id="tour-header-controls" className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Server Selector */}
          <div className="flex items-center bg-[#0d111a] border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-1.5 text-xs shadow-inner transition-colors">
            <span className={`w-2 h-2 rounded-full mr-2 shrink-0 ${serverColors[server] || 'bg-slate-400'}`} />
            <Server className="w-3.5 h-3.5 text-slate-400 mr-1.5 hidden sm:inline" />
            <select
              value={server}
              onChange={(e) => setServer(e.target.value)}
              className="bg-transparent text-slate-200 font-mono font-bold focus:outline-none cursor-pointer uppercase text-xs"
            >
              <option value="europe" className="bg-[#121722] text-slate-100">Europe</option>
              <option value="americas" className="bg-[#121722] text-slate-100">Americas (West)</option>
              <option value="asia" className="bg-[#121722] text-slate-100">Asia (East)</option>
            </select>
          </div>

          {/* Premium Status Toggle */}
          <button
            type="button"
            onClick={() => setHasPremium(!hasPremium)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
              hasPremium
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'bg-[#0d111a] border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
            }`}
          >
            <Crown className={`w-3.5 h-3.5 ${hasPremium ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
            <span className="font-mono">{hasPremium ? 'Premium (4% Tax)' : 'Non-Prem (8% Tax)'}</span>
          </button>

          {/* Focus Toggle */}
          <button
            type="button"
            onClick={() => setUseFocus(!useFocus)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
              useFocus
                ? 'bg-sky-500/20 border-sky-400/60 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                : 'bg-[#0d111a] border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${useFocus ? 'text-sky-400 fill-sky-400' : 'text-slate-500'}`} />
            <span className="font-mono">{useFocus ? 'Focus ON (+59% Bonus)' : 'Focus OFF'}</span>
          </button>

          {/* Guide & Codex Launcher Button */}
          <button
            type="button"
            onClick={onOpenHandbook}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600/30 to-amber-700/20 hover:from-amber-600/40 hover:to-amber-500/30 text-amber-300 border border-amber-500/50 hover:border-amber-400 font-mono text-xs font-bold shadow-[0_0_12px_rgba(245,158,11,0.2)] transition-all active:scale-95 cursor-pointer ml-1"
            title="Open Player Handbook & Site Guide"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
}
