"use client";

import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0D110F] text-white flex flex-col items-center justify-center p-10 text-center font-body">
      <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-12 border border-white/10 shadow-premium animate-bounce">
         <AlertCircle size={64} className="text-amber-500" />
      </div>
      <h1 className="text-7xl font-black italic tracking-tighter font-display uppercase mb-6 leading-none">
        Lost in <br/><span className="text-[#13EC6A] drop-shadow-glow">The Hustle.</span>
      </h1>
      <p className="text-xl text-gray-400 font-bold mb-12 max-w-sm mx-auto uppercase tracking-widest leading-relaxed">
        The page you are looking for has been load-shedded or doesn&apos;t exist.
      </p>
      <Link href="/" className="inline-flex items-center gap-4 px-10 py-6 bg-[#13EC6A] text-[#052210] rounded-[2rem] font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-glow">
        <ArrowLeft size={16} /> Back to WayMakers Hub
      </Link>
    </div>
  );
}
