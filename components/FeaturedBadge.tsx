"use client";

import { Crown } from "lucide-react";

export function FeaturedBadge() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#A855F7] via-[#FACC15] to-[#A855F7] bg-[length:200%_auto] animate-gradient rounded-full border border-white/20 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
      <Crown size={12} className="text-white fill-white animate-pulse" />
      <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md">Featured</span>
    </div>
  );
}
