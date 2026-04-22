"use client";

import { useState } from "react";
import { Radar, Navigation, MapPin, Check, Zap, Map } from "lucide-react";
import { RADIUS_OPTIONS } from "@/lib/locationUtils";
import { useGeolocation } from "@/hooks/useGeolocation";
import { motion } from "framer-motion";

interface WorkRadarProps {
  onRadiusChange: (radius: number | null) => void;
  activeRadius: number | null;
}

// Expanded Options Menu
const EXTENDED_OPTIONS = [
  { label: "Hyper-Local (2km)", value: 2, icon: <Zap size={16} /> },
  ...RADIUS_OPTIONS,
  { label: "Global Reach", value: null, icon: <Map size={16} /> }
];

export default function WorkRadar({ onRadiusChange, activeRadius }: WorkRadarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { latitude, longitude, loading, error } = useGeolocation();

  return (
    <motion.div 
      drag 
      dragMomentum={false}
      // Position bottom-left by default, with fixed positioning
      className="fixed bottom-10 left-10 z-[60] font-sans"
      style={{ touchAction: "none" }} // Ensure touch devices drag smoothly
    >
      {/* Background Ripple Animation */}
      {isOpen && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#13EC6A]/10 rounded-full animate-ping pointer-events-none" />
      )}

      {/* Main Radar Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-24 h-24 rounded-[2rem] flex items-center justify-center transition-colors shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-4 cursor-grab active:cursor-grabbing ${
          isOpen 
            ? "bg-[#13EC6A] text-[#052210] border-[#13EC6A]/50 shadow-glow" 
            : "bg-black/60 backdrop-blur-3xl text-[#13EC6A] border-white/5 hover:border-[#13EC6A]/30"
        } group`}
        title="Drag to reposition, click to open options"
      >
        <Radar size={40} className={`drop-shadow-glow ${loading && !isOpen ? "animate-pulse" : ""}`} />
        {activeRadius && !isOpen && (
          <div className="absolute -top-3 -right-3 bg-[#13EC6A] text-[#052210] text-[11px] font-black px-4 py-1.5 rounded-full border-4 border-[#050706] shadow-glow italic uppercase tracking-tighter">
            {activeRadius}KM
          </div>
        )}
      </motion.button>

      {/* Radius Selector Menu */}
      <div 
        className={`absolute bottom-full left-0 mb-6 min-w-[320px] bg-[#050706]/90 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-6 transition-all duration-500 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.9)] ${
          isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95 pointer-events-none"
        } origin-bottom-left`}
      >
        <div className="flex items-center gap-6 mb-6 px-2">
          <div className="w-12 h-12 rounded-2xl bg-[#13EC6A]/10 flex items-center justify-center text-[#13EC6A] border border-[#13EC6A]/20 shadow-glow">
            <Navigation size={20} />
          </div>
          <div>
            <h4 className="text-lg font-black uppercase tracking-tighter text-white font-display italic">Radar Ops</h4>
            <p className="text-[9px] font-black text-[#13EC6A] uppercase tracking-[0.3em] italic opacity-80">
              {loading ? "SEARCHING PATH..." : error ? "GPS LOCKED" : "SIGNAL ACTIVE"}
            </p>
          </div>
        </div>

        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
          {EXTENDED_OPTIONS.map((option) => {
            // Deduplicate 'Nationwide' / null from extended array if needed
            if (option.label === "Nationwide" && option.value === null) return null;

            return (
              <button
                key={option.label}
                onClick={() => {
                  onRadiusChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-[1.5rem] transition-all duration-300 border ${
                  activeRadius === option.value 
                    ? "bg-[#13EC6A] text-[#052210] font-black border-[#13EC6A]/50 shadow-glow italic scale-[1.02]" 
                    : "bg-white/[0.03] text-gray-400 hover:bg-white/10 hover:text-white border-white/5 font-bold italic"
                }`}
              >
                <div className="flex items-center gap-4">
                  {'icon' in option && option.icon ? (
                     <span className={activeRadius === option.value ? "text-black" : "text-[#13EC6A]"}>{option.icon as React.ReactNode}</span>
                  ) : (
                     <MapPin size={16} className={activeRadius === option.value ? "text-black" : "text-gray-500"} />
                  )}
                  <span className="text-[11px] uppercase tracking-[0.2em]">{option.label}</span>
                </div>
                {activeRadius === option.value && <Check size={18} strokeWidth={3} />}
              </button>
            )
          })}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-900/20 border border-red-500/20 rounded-2xl text-[9px] font-black text-red-400 uppercase tracking-[0.3em] text-center italic">
            {error} (Locked)
          </div>
        )}
      </div>
    </motion.div>
  );
}
