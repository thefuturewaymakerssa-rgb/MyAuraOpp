"use client";

import { Briefcase, Plus, Users, Clock, ArrowRight, MoreVertical, Search, Filter } from "lucide-react";
import Link from "next/link";

export default function EmployerGigsPage() {
  const myGigs = [
    { id: 1, title: "Handyman Pro Needed", applications: 12, status: "active", date: "Oct 24, 2026", budget: "R 1,500" },
    { id: 2, title: "Senior Builder", applications: 45, status: "active", date: "Oct 18, 2026", budget: "R 4,500" },
    { id: 3, title: "Plumbing Assistant", applications: 0, status: "draft", date: "Oct 15, 2026", budget: "R 800" },
  ];

  return (
    <div className="min-h-screen bg-transparent text-white font-sans p-8 lg:p-24 relative overflow-hidden selection:bg-[#6366F1]/30 mb-20">
      <div className="max-w-6xl mx-auto space-y-20 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-end border-b border-white/5 pb-16 gap-12">
          <div>
            <h1 className="text-8xl font-black italic tracking-tighter mb-4 font-display text-glow uppercase leading-none">My Gigs.</h1>
            <p className="text-gray-500 font-black uppercase tracking-[0.5em] text-[10px] italic">Mission Control & Workforce Pulse</p>
          </div>
          <Link href="/employer/gigs/new" className="px-12 py-7 bg-[#13EC6A] text-[#052210] font-black text-xs rounded-[2rem] flex items-center gap-4 hover:scale-110 active:scale-95 transition-all shadow-glow uppercase tracking-[0.4em] italic border-b-8 border-black/10 group shimmer-border">
            <Plus size={24} strokeWidth={4} className="group-hover:rotate-90 transition-transform" /> POST NEW GIG
          </Link>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap gap-6">
           {['All Ops', 'Active', 'Drafts', 'Completed'].map((tab, i) => (
             <button key={tab} className={`px-10 py-4 rounded-[2rem] font-black italic text-[11px] uppercase tracking-[0.3em] transition-all border ${
               i === 0 
                ? "bg-white text-black shadow-premium border-white" 
                : "bg-white/[0.03] text-gray-500 hover:text-white border-white/5 hover:border-white/20"
             }`}>
               {tab}
             </button>
           ))}
        </div>

        {/* Gig List */}
        <div className="grid grid-cols-1 gap-8">
          {myGigs.map((gig) => (
            <div key={gig.id} className="glass-card p-12 rounded-[4.5rem] flex flex-col lg:flex-row lg:items-center justify-between group hover:border-indigo-500/30 hover:scale-[1.01] transition-all duration-500 border border-white/5 shadow-premium overflow-hidden relative">
              <div className="flex items-center gap-12">
                <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center border-b-4 border-black/20 shadow-glow transition-all group-hover:rotate-12 ${
                  gig.status === 'active' ? "bg-indigo-600 text-white" : "bg-white/[0.03] text-gray-700"
                }`}>
                  <Briefcase size={36} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-4xl font-black italic tracking-tighter font-display uppercase mb-4 text-glow group-hover:text-indigo-400 transition-colors leading-none">{gig.title}</h3>
                  <div className="flex items-center gap-10 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] italic">
                    <span className="flex items-center gap-3"><Clock size={16} /> BROADCAST {gig.date}</span>
                    <span className="flex items-center gap-3 text-[#13EC6A] font-display text-xl">{gig.budget} / BUDGET</span>
                  </div>
                </div>
              </div>

              <div className="mt-12 lg:mt-0 flex flex-wrap items-center gap-10">
                <Link href={`/employer/gigs/${gig.id}`} className="flex items-center gap-8 px-10 py-6 glass-card rounded-[3rem] border border-white/10 hover:bg-white/10 transition-all group/btn shadow-premium group-hover:border-indigo-500/20">
                  <div className="relative">
                    <Users size={32} className="text-[#13EC6A] drop-shadow-glow" />
                    {gig.applications > 0 && (
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-indigo-500 rounded-full animate-ping" />
                    )}
                  </div>
                  <div>
                    <p className="text-3xl font-black italic font-display leading-none text-white">{gig.applications}</p>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 mt-1">Applications</p>
                  </div>
                  <ArrowRight size={24} className="text-gray-800 group-hover/btn:translate-x-4 transition-transform group-hover/btn:text-white" />
                </Link>
                <button className="w-16 h-16 glass-card rounded-[1.8rem] border border-white/5 flex items-center justify-center text-gray-600 hover:text-white transition-all hover:rotate-90">
                  <MoreVertical size={24} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
