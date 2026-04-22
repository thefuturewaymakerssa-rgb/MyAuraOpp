"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, AlertCircle, Camera, Square } from "lucide-react";

interface RecordingHUDProps {
  elapsed: number;
  onTimeUp: () => void;
  isRecording: boolean;
  maxTime?: number;
}

export const RecordingHUD = ({ elapsed, onTimeUp, isRecording, maxTime = 180 }: RecordingHUDProps) => {
  const progress = Math.min((elapsed / maxTime) * 100, 100);
  const timeLeft = Math.max(maxTime - elapsed, 0);
  const isWarning = elapsed >= (maxTime - 30); // Warning 30s before end
  const isCritical = elapsed >= (maxTime - 10); // Red alert 10s before end
  const MIN_TIME = 30;  // 30 seconds
  const isNearMin = elapsed >= MIN_TIME;

  useEffect(() => {
    if (elapsed >= maxTime) onTimeUp();
  }, [elapsed, onTimeUp, maxTime]);

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Cinematic Viewfinder Corners */}
      <div className="absolute top-12 left-12 w-20 h-20 border-t-2 border-l-2 border-white/40 rounded-tl-3xl" />
      <div className="absolute top-12 right-12 w-20 h-20 border-t-2 border-r-2 border-white/40 rounded-tr-3xl" />
      <div className="absolute bottom-12 left-12 w-20 h-20 border-b-2 border-l-2 border-white/40 rounded-bl-3xl" />
      <div className="absolute bottom-12 right-12 w-20 h-20 border-b-2 border-r-2 border-white/40 rounded-br-3xl" />

      {/* Top Status Bar */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-12">
        <div className="flex flex-col items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-[0.6em] text-white/40 italic">Live Transmit</span>
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${isRecording ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse" : "bg-gray-400"}`} />
              <span className="text-xl font-black italic font-mono tracking-widest text-white">00:{timeLeft.toString().padStart(3, '0')}</span>
            </div>
        </div>
      </div>

      {/* Main Timer HUD (Bottom Center) */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-full max-w-sm px-8">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-black/60 backdrop-blur-3xl p-8 rounded-[2.5rem] border-2 border-white/10 shadow-2xl flex items-center gap-8 relative overflow-hidden"
        >
          {/* Progress Ring Overlay */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/5 overflow-hidden">
             <motion.div 
               className={`h-full ${isWarning ? "bg-amber-400" : "bg-[#0F766E]"}`}
               initial={{ width: 0 }}
               animate={{ width: `${progress}%` }}
               transition={{ duration: 0.5 }}
             />
          </div>

          <div className="relative">
             {/* Progress Circle SVG */}
             <svg width="80" height="80" className="rotate-[-90deg]">
               <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
               <motion.circle 
                 cx="40" cy="40" r="34" 
                 fill="none" 
                 stroke={isWarning ? "#F59E0B" : "#0F766E"} 
                 strokeWidth="6" 
                 strokeDasharray={`${2 * Math.PI * 34}`}
                 strokeDashoffset={2 * Math.PI * 34 * (1 - progress / 100)}
                 strokeLinecap="round"
                 animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - progress / 100) }}
                 transition={{ duration: 0.3 }}
               />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center">
                {isRecording ? <Square size={20} className="text-white fill-white" /> : <Camera size={20} className="text-white/50" />}
             </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-end">
               <span className={`text-5xl font-black italic font-display tracking-tighter tabular-nums transition-colors ${isCritical ? "text-red-500 animate-pulse" : "text-white"}`}>
                 {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
               </span>
               <div className="flex flex-col text-right gap-1 pb-1">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded leading-none transition-colors ${isNearMin ? "bg-[#13EC6A] text-black" : "bg-white/10 text-white/40"}`}>MIN 0:30</span>
                  <span className={`text-white text-[8px] font-black px-2 py-0.5 rounded leading-none ${isCritical ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-red-500/40"}`}>MAX {Math.floor(maxTime/60)}:00</span>
               </div>
            </div>
            
            <AnimatePresence>
               {isWarning && (
                 <motion.div 
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0 }}
                   className="flex items-center gap-2 text-amber-400"
                 >
                    <AlertCircle size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest animate-pulse italic">Auto-stop imminent</span>
                 </motion.div>
               )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Side Director Metadata */}
      <div className="absolute left-12 top-1/2 -translate-y-1/2 flex flex-col gap-8 opacity-40">
         {[
           { label: "ISO", val: "400" },
           { label: "FPS", val: "60" },
           { label: "BIT", val: "32" },
           { label: "VOL", val: "-12dB" }
         ].map((stat, i) => (
           <div key={i} className="flex flex-col items-center">
              <span className="text-[8px] font-black italic text-white/50">{stat.label}</span>
              <span className="text-[10px] font-black italic text-white">{stat.val}</span>
           </div>
         ))}
      </div>
    </div>
  );
};
