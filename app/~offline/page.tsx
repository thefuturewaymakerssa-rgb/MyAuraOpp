"use client";

import { CloudOff, RefreshCw, Smartphone } from "lucide-react";

export default function OfflineFallback() {
  const handleReload = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  const handleCachedFeed = () => {
    if (typeof window !== "undefined") window.history.back();
  };

  return (
    <div className="min-h-screen bg-[#0D110F] text-white flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#13EC6A]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Icon */}
      <div className="w-32 h-32 bg-amber-500/10 rounded-[3rem] flex items-center justify-center text-amber-500 mb-10 border border-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.15)] animate-pulse">
        <CloudOff size={64} />
      </div>

      {/* Headline */}
      <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase mb-4 leading-none">
        Link<br />Severed.
      </h1>

      <p className="text-gray-400 font-bold max-w-sm mx-auto mb-4 uppercase tracking-[0.3em] text-xs leading-relaxed italic">
        You&apos;re in a dead zone. No network detected.
      </p>

      {/* Load shedding context */}
      <div className="mb-12 flex items-center gap-2 text-amber-500/70 text-[10px] font-black uppercase tracking-widest">
        <Smartphone size={12} />
        <span>Load Shedding Protocol Active</span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          id="offline-retry-btn"
          onClick={handleReload}
          className="bg-amber-500 text-amber-950 px-10 py-5 rounded-full font-black uppercase text-[10px] tracking-[0.4em] italic hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-500/25"
          aria-label="Try reconnecting to the internet"
        >
          <RefreshCw size={16} />
          Re-establish Link
        </button>

        <button
          id="offline-back-btn"
          onClick={handleCachedFeed}
          className="bg-white/5 border border-white/10 px-10 py-5 rounded-full font-black uppercase text-[10px] tracking-[0.4em] italic text-white hover:bg-white/10 active:scale-95 transition-all"
          aria-label="Go back to cached content"
        >
          Back to Cached Content
        </button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-12 uppercase tracking-[0.6em] text-[8px] font-black text-gray-600 italic">
        Future WayMakers &bull; Offline Mode
      </div>
    </div>
  );
}
