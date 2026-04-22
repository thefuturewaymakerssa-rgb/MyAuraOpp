"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Sparkles, X } from "lucide-react";

interface SkillCoachProps {
  trade: string;
  isRecording: boolean;
  elapsedTime: number;
}

const TRADE_HINTS: Record<string, { cues: string[], translations: string[] }> = {
  "Plumbing": {
    cues: ["Show the pipes before working", "Point out the specific leak", "Demonstrate the repair tool"],
    translations: ["Khombisa amapayipi (Zulu)", "Bonisa imibhobho (Xhosa)"]
  },
  "Electrical": {
    cues: ["Show the DB board safely", "Explain the wiring color code", "Test the connection"],
    translations: ["Khombisa ibhodi kagesi (Zulu)", "Bonisa ibhodi yombane (Xhosa)"]
  },
  "General": {
    cues: ["Introduce your workspace", "Show your most used tool", "Describe your daily hustle"],
    translations: ["Yisho igama lakho (Zulu)", "Xela igama lakho (Xhosa)"]
  }
};

export const SkillCoach = ({ trade, isRecording, elapsedTime }: SkillCoachProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentHint, setCurrentHint] = useState(0);
  const prevHintIndexRef = useRef(0);
  
  const hints = TRADE_HINTS[trade] || TRADE_HINTS["General"];

  useEffect(() => {
    if (isRecording) {
      const hintIndex = Math.floor(elapsedTime / 10) % hints.cues.length;
      if (hintIndex !== prevHintIndexRef.current) {
        prevHintIndexRef.current = hintIndex;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentHint(hintIndex);
      }
    }
  }, [elapsedTime, isRecording, hints.cues.length]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: 20 }}
          className="absolute top-24 right-6 z-[80] w-64"
        >
          <div className="bg-black/60 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/10 shadow-2xl relative">
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute -top-2 -right-2 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white"
            >
              <X size={14} />
            </button>

            <div className="flex items-center gap-3 mb-4">
               <div className="w-8 h-8 rounded-full bg-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-400/20">
                  <Sparkles size={14} className="text-black" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 italic">AI Skill Coach</span>
            </div>

            <div className="space-y-4">
              <p className="text-white font-bold italic leading-tight text-sm">
                &quot;{hints.cues[currentHint]}&quot;
              </p>
              <div className="pt-3 border-t border-white/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Local Context</p>
                <p className="text-[10px] font-bold text-[#10B981] italic">
                   {hints.translations[currentHint % hints.translations.length]}
                </p>
              </div>
            </div>
          </div>
          
          {/* Pulse Effect */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -inset-4 bg-cyan-400/10 blur-xl rounded-full -z-10"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
