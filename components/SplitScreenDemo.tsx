"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, User, Play, ShieldCheck, Zap } from "lucide-react";

interface SplitScreenDemoProps {
  videoEmployerUrl?: string; // Default to placeholder
  videoTalentUrl?: string;   // Default to placeholder
}

export default function SplitScreenDemo({ 
  videoEmployerUrl = "https://player.vimeo.com/external/517090025.sd.mp4?s=d009210e74f1b8a9d0689b1d7d02eadb4b1a646c&profile_id=164&oauth2_token_id=57447761", 
  videoTalentUrl = "https://player.vimeo.com/external/371433846.sd.mp4?s=231ceae63541bd06e22e96e5d8a0c2830f0f5b12&profile_id=164&oauth2_token_id=57447761"
}: SplitScreenDemoProps) {
  const [activeView, setActiveView] = useState<"employer" | "talent">("talent");

  return (
    <section className="relative w-full py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-block px-5 py-2 bg-[#F0FDFA] text-[#0F766E] text-[10px] font-black uppercase tracking-[0.4em] rounded-full mb-6 italic">Visual Protocol</span>
          <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase font-display leading-[0.9]">
            The Platform <br/>In Action.
          </h2>
        </div>

        {/* Toggle Switch */}
        <div className="flex justify-center mb-16">
          <div className="bg-[#F0FDFA] p-2 rounded-[2rem] border-2 border-[#E2E8F0] shadow-inner flex gap-2">
            <button 
              onClick={() => setActiveView("talent")}
              className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-3 italic ${activeView === "talent" ? "bg-[#0F766E] text-white shadow-xl shadow-[#0F766E]/20" : "text-gray-400 hover:text-gray-600"}`}
            >
              <User size={16} /> Talent Perspective
            </button>
            <button 
              onClick={() => setActiveView("employer")}
              className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-3 italic ${activeView === "employer" ? "bg-[#8B5CF6] text-white shadow-xl shadow-[#8B5CF6]/20" : "text-gray-400 hover:text-gray-600"}`}
            >
              <Briefcase size={16} /> Employer Perspective
            </button>
          </div>
        </div>

        {/* Split Screen Container */}
        <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-[4rem] overflow-hidden border-4 border-white shadow-2xl bg-[#0F172A] shadow-black/10">
          <AnimatePresence mode="wait">
            {activeView === "talent" ? (
              <motion.div 
                key="talent"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute inset-0 w-full h-full"
              >
                <video 
                  src={videoTalentUrl} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0F766E]/60 to-transparent flex items-center p-12 lg:p-24 uppercase italic">
                   <div className="max-w-md space-y-6">
                      <div className="flex items-center gap-3 text-white">
                         <Zap size={24} className="fill-white" />
                         <span className="text-[12px] font-black tracking-[0.4em]">Talent Protocol</span>
                      </div>
                      <h3 className="text-5xl lg:text-7xl font-black text-white leading-none tracking-tighter">Record. <br/>Publish. <br/>Earn.</h3>
                      <p className="text-white/80 font-bold text-lg leading-relaxed">Showcase your grit with a VibeCV. Get verified in seconds and start matching with local gigs.</p>
                   </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="employer"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute inset-0 w-full h-full"
              >
                <video 
                  src={videoEmployerUrl} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6]/60 to-transparent flex items-center p-12 lg:p-24 uppercase italic">
                   <div className="max-w-md space-y-6">
                      <div className="flex items-center gap-3 text-white">
                         <ShieldCheck size={24} className="fill-white" />
                         <span className="text-[12px] font-black tracking-[0.4em]">Employer Protocol</span>
                      </div>
                      <h3 className="text-5xl lg:text-7xl font-black text-white leading-none tracking-tighter">Scout. <br/>Verify. <br/>Hire.</h3>
                      <p className="text-white/80 font-bold text-lg leading-relaxed">Search the local radar for verified talent. Watch proofs, chat instantly, and release escrow upon success.</p>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Overlaid UI Elements for Extra Polish */}
          <div className="absolute bottom-12 right-12 z-20 flex gap-4">
             <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 text-[10px] font-black text-white uppercase tracking-widest italic flex items-center gap-3 shadow-2xl">
                <Play size={14} className="fill-white" /> Live Stream Mode
             </div>
             <div className="bg-[#10B981] px-6 py-3 rounded-full text-[10px] font-black text-white uppercase tracking-widest italic flex items-center gap-3 shadow-2xl">
                <ShieldCheck size={14} /> Low-Data Optimized
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
