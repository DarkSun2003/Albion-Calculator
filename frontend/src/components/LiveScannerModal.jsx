import React from 'react';
import { X, Radio, Download, Database, Zap, ShieldCheck, Smartphone, Monitor } from 'lucide-react';

const ADC_DIRECT_DOWNLOAD_URL =
  'https://github.com/ao-data/albiondata-client/releases/latest/download/albiondata-client-amd64-installer.exe';

export default function LiveScannerModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#070b14] border border-amber-500/50 shadow-[0_0_60px_rgba(212,163,75,0.22)] overflow-hidden text-slate-100 ring-1 ring-amber-500/30">
        {/* Top Accent Banner */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950/70 via-[#0e1422] to-emerald-950/50 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600/30 to-teal-950/80 border border-emerald-500/60 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.25)]">
              <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-decorative text-lg font-black tracking-wide text-amber-200">
                  REAL-TIME MARKET SCANNER (ADC)
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold tracking-wider">
                  Recommended for PC
                </span>
              </div>
              <p className="text-xs text-slate-300/80 font-sans mt-0.5">
                Why some prices show &ldquo;2h–3h ago&rdquo; &amp; how to get instant 0-minute live prices
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#05080e] hover:bg-[#111827] border border-[#1a2436] hover:border-amber-500/50 text-slate-400 hover:text-amber-200 transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Why Explanation */}
          <div className="rounded-xl bg-[#05080e] border border-[#1a2436] p-4 space-y-2 shadow-inner">
            <h3 className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Why Do Some Prices Show &ldquo;3 Hours Ago&rdquo;?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Sandbox Interactive (the creators of Albion Online) intentionally <strong>do not provide an official public Market API</strong>. Instead, every Albion calculator relies on the community-powered <strong>Albion Online Data Project (AODP)</strong>.
            </p>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              A market price only updates when a PC player running the free <strong>Albion Data Client (ADC)</strong> looks at that item inside a city&apos;s market in-game.
            </p>
          </div>

          {/* How 1 Player Helps Everyone (Shared DB) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/40 p-4 space-y-2 shadow-inner">
              <div className="flex items-center gap-2 text-emerald-300 font-mono text-xs font-bold uppercase tracking-wider">
                <Monitor className="w-4 h-4 text-emerald-400" />
                If You Play on PC
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Install and run the free <strong>Albion Data Client</strong> once in the background while you play. Every item you click in-game will update on this calculator within <strong>3 seconds (`0m ago`)</strong>!
              </p>
            </div>

            <div className="rounded-xl bg-sky-950/20 border border-sky-500/40 p-4 space-y-2 shadow-inner">
              <div className="flex items-center gap-2 text-sky-300 font-mono text-xs font-bold uppercase tracking-wider">
                <Database className="w-4 h-4 text-sky-400" />
                1 Player Updates Everyone
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Whenever <strong>even 1 PC player</strong> using our site scans &amp; fetches fresh prices, our backend permanently saves those verified prices into our <strong>shared database</strong> so mobile &amp; web users immediately get them too!
              </p>
            </div>
          </div>

          {/* 3-Step Quick Setup */}
          <div className="rounded-xl bg-[#05080e] border border-amber-500/30 p-4 space-y-3 shadow-inner">
            <h4 className="text-xs font-serif uppercase tracking-wider text-amber-200 font-bold">
              How It Works (Takes 30 Seconds):
            </h4>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside font-sans">
              <li>
                Click <strong>Download Albion Data Client (Windows .exe)</strong> below and install it (or run <code className="px-1.5 py-0.5 rounded bg-[#090e17] text-amber-300 font-mono border border-amber-500/20">Setup_Albion_Data_Client.bat</code> if you downloaded our repo folder).
              </li>
              <li>
                Keep the tiny Data Client open in the background while you play Albion Online on PC. *(If you use our Desktop App shortcut, it starts and stops ADC for you automatically!)*
              </li>
              <li>
                Browse any market in-game, then click <strong>Fetch Live Prices</strong> here for instant, 100% accurate live silver prices.
              </li>
            </ol>
          </div>

          {/* Direct Download Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#1e2a3c]">
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-sans">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Official open-source Albion Online Data Project client (Windows 64-bit)</span>
            </div>
            <a
              href={ADC_DIRECT_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-serif text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Live Scanner (.exe)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
