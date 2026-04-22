"use client";

import { MessageSquare, ShieldCheck } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center h-full relative overflow-hidden bg-[#F0FDFA]/50 isolate">
      {/* Immersive Light Background */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] bg-[#0F766E]/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="w-32 h-32 rounded-[2.5rem] bg-white border-2 border-[#E2E8F0] shadow-sm flex items-center justify-center text-[#0F766E] mb-12 sm:mb-16 group hover:scale-105 transition-transform duration-700 relative">
        <div className="absolute inset-0 bg-[#0F766E]/5 rounded-[2.5rem] blur-xl animate-pulse" />
        <MessageSquare size={48} className="relative z-10 group-hover:rotate-6 transition-transform text-[#0F766E]" />
      </div>
      
      <h2 className="text-4xl sm:text-6xl md:text-[5rem] font-black italic tracking-tighter mb-6 font-display uppercase leading-[0.9] text-[#0F172A] drop-shadow-sm">
        Comms <br/><span className="text-[#0F766E]">Hub.</span>
      </h2>
      
      <p className="text-gray-500 font-bold uppercase tracking-[0.4em] text-[9px] sm:text-[10px] max-w-sm leading-relaxed italic opacity-80 decoration-[#0F766E]">
        Select a verified active protocol from the side directory to initiate communications.
      </p>
      
      <div className="mt-16 sm:mt-24 flex items-center gap-4 px-8 py-4 bg-white rounded-full border-2 border-[#E2E8F0] shadow-sm group">
        <ShieldCheck size={18} className="text-[#0F766E] group-hover:scale-110 transition-transform" />
        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 italic">SECURE ESCROW PROTOCOL ACTIVE // WAYMAKERS CORE</span>
      </div>
    </div>
  );
}
