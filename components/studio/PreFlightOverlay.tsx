"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Battery, Wifi, ShieldCheck, Sparkles, ChevronRight, Activity } from "lucide-react";

interface PreFlightOverlayProps {
  onReady: (profile: "saver" | "hq") => void;
  batteryLevel?: number;
  networkType?: string;
}

export const PreFlightOverlay = ({ onReady }: PreFlightOverlayProps) => {
  const [profile, setProfile] = useState<"saver" | "hq">("hq");
  const [battery, setBattery] = useState<number | null>(null);
  const [status, setStatus] = useState<"initializing" | "checking" | "ready">("initializing");

  useEffect(() => {
    // 2026 Resilience: Check real hardware stats
    const checkHardware = async () => {
      if ('getBattery' in navigator) {
        const bat = await (navigator as any).getBattery();
        setBattery(Math.round(bat.level * 100));
        if (bat.level < 0.2) setProfile("saver");
      }
      setTimeout(() => setStatus("ready"), 2000);
    };
    checkHardware();
  }, []);

  const profiles = {
    hq: { label: "Cinema HQ", size: "~45MB", desc: "1080p • 60fps • Pro Grade" },
    saver: { label: "Data Saver", size: "~8MB", desc: "720p • 30fps • Low Data" }
  };

  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-3xl p-8 overflow-hidden">
      {/* Background Grid Distortion */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
         <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(#0F766E 1px, transparent 1px), linear-gradient(90deg, #0F766E 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      <AnimatePresence mode="wait">
        {status !== "ready" ? (
          <motion.div 
            key="init"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="text-center space-y-12 relative z-10"
          >
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 rounded-[2.5rem] border-2 border-dashed border-[#0F766E]/50 flex items-center justify-center"
              >
                <Activity size={40} className="text-[#0F766E] animate-pulse" />
              </motion.div>
              <div className="absolute -inset-4 bg-[#0F766E]/20 blur-3xl rounded-full animate-pulse" />
            </div>
            
            <div>
              <h1 className="text-5xl font-black tracking-[-2px] uppercase bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent italic">
                Protocol <br/> Initiated
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 mt-6 animate-pulse italic">Syncing Hardware Optics...</p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="ready"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md space-y-12 relative z-10"
          >
            <header className="text-center space-y-4">
              <h1 className="text-6xl font-black italic tracking-tighter uppercase font-display leading-none">Studio <span className="text-[#0F766E]">Ready.</span></h1>
              <p className="text-white/40 font-bold italic text-sm">Hardware verified. Select transmission profile.</p>
            </header>

            {/* Hardware Vitals */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                     <Battery size={16} className={battery && battery < 20 ? "text-red-400" : "text-[#10B981]"} />
                     <span className="text-xl font-black italic">{battery || "--"}%</span>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/30">System Power</span>
               </div>
               <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                     <Wifi size={16} className="text-[#0F766E]" />
                     <span className="text-xl font-black italic uppercase">4G+</span>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Signal Strength</span>
               </div>
            </div>

            {/* Profile Selection */}
            <div className="space-y-4">
              {(Object.keys(profiles) as Array<"hq" | "saver">).map((type) => (
                <button
                  key={type}
                  onClick={() => setProfile(type)}
                  className={`w-full group relative overflow-hidden p-8 rounded-[2.5rem] border-2 transition-all text-left flex items-center justify-between ${
                    profile === type 
                      ? "bg-[#0F766E] border-[#0F766E] shadow-2xl shadow-[#0F766E]/20" 
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black italic uppercase font-display leading-none mb-2">{profiles[type].label}</h3>
                    <p className={`text-xs font-bold italic transition-colors ${profile === type ? "text-white/80" : "text-white/40"}`}>
                      {profiles[type].desc}
                    </p>
                  </div>
                  <div className="flex flex-col items-end relative z-10">
                     <span className={`text-[10px] font-black italic uppercase bg-black/40 px-3 py-1 rounded-full mb-3 ${profile === type ? "text-[#10B981]" : "text-white/40"}`}>
                       {profiles[type].size}
                     </span>
                     {profile === type && <ShieldCheck size={24} className="text-white animate-in zoom-in duration-300" />}
                  </div>
                </button>
              ))}
            </div>

            <button 
              onClick={() => onReady(profile)}
              className="w-full h-24 bg-white text-[#0F172A] rounded-[2.5rem] flex items-center justify-center gap-4 group active:scale-95 transition-all shadow-2xl"
            >
              <span className="text-sm font-black uppercase tracking-[0.5em] italic">Enter Viewfinder</span>
              <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="absolute bottom-12 text-center">
         <div className="flex items-center gap-3 opacity-20">
            <Sparkles size={16} />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] italic">VibeCV Studio v2.0 Elite</span>
         </div>
      </footer>
    </div>
  );
};
