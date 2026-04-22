"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Zap, Clock, Repeat, X } from "lucide-react";

interface QuickTemplatesProps {
  onSelect: (templateId: string) => void;
  activeTemplate: string | null;
}

const TEMPLATES = [
  { 
    id: "intro", 
    label: "30sec Intro", 
    icon: Zap, 
    desc: "Fast pitch including demo",
    overlay: "Sharp Sharp!" 
  },
  { 
    id: "hustle", 
    label: "Hustle Proof", 
    icon: Repeat, 
    desc: "Before & After showcase",
    overlay: "Yoh, check this fix!" 
  },
  { 
    id: "drop", 
    label: "Skill Drop", 
    icon: Clock, 
    desc: "Talk + 15s Skill demo",
    overlay: "The Hustle is real 🔥" 
  }
];

export const QuickTemplates = ({ onSelect, activeTemplate }: QuickTemplatesProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-40 right-6 z-[90]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-6 bg-black/80 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl w-64"
          >
            <div className="flex justify-between items-center mb-6">
               <span className="text-[10px] font-black uppercase tracking-widest text-[#FACC15] italic">Templates</span>
               <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white"><X size={16} /></button>
            </div>

            <div className="space-y-3">
               {TEMPLATES.map((t) => (
                 <button
                   key={t.id}
                   onClick={() => {
                     onSelect(t.id);
                     setIsOpen(false);
                   }}
                   className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${
                     activeTemplate === t.id 
                       ? "bg-[#FACC15] border-[#FACC15] text-black" 
                       : "bg-white/5 border-white/10 hover:border-white/20 text-white"
                   }`}
                 >
                    <div className={`p-2 rounded-xl ${activeTemplate === t.id ? "bg-black/10" : "bg-white/10"}`}>
                       <t.icon size={16} />
                    </div>
                    <div>
                       <p className="text-[11px] font-black uppercase tracking-tighter leading-none mb-1">{t.label}</p>
                       <p className={`text-[8px] font-bold italic ${activeTemplate === t.id ? "text-black/60" : "text-white/40"}`}>{t.desc}</p>
                    </div>
                 </button>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${
          isOpen ? "bg-white text-black rotate-12" : "bg-black/40 backdrop-blur-xl text-[#FACC15] border border-white/10"
        }`}
      >
        <Lightbulb size={28} className={isOpen ? "fill-current" : ""} />
        {activeTemplate && !isOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#13EC6A] rounded-full border-2 border-black flex items-center justify-center">
             <Zap size={10} className="text-black" />
          </div>
        )}
      </button>
    </div>
  );
};
