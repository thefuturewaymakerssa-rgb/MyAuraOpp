"use client";

import { Bookmark, Briefcase, User, Star, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SavedItemsPage() {
  const savedGigs = [
    { id: 1, title: "Senior Handyman", company: "Cape Rentals", budget: "R 2,500.00", location: "Green Point" },
    { id: 2, title: "Electrician Needed", company: "Vibe Devs", budget: "R 1,200.00", location: "Century City" },
  ];

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      <header>
        <h1 className="text-5xl font-black mb-4 tracking-tighter italic font-display text-glow uppercase">Saved Items.</h1>
        <p className="text-gray-500 font-bold uppercase tracking-[0.4em] text-[10px]">Your curated list of opportunities</p>
      </header>

      <div className="space-y-12">
        {/* Toggle (Internal) */}
        <div className="flex gap-4">
          <button className="px-8 py-3 bg-white text-black rounded-2xl font-black italic text-xs uppercase tracking-widest shadow-premium">
            Gigs
          </button>
          <button className="px-8 py-3 glass rounded-2xl font-black italic text-xs uppercase tracking-widest text-gray-600 hover:text-white transition-all">
            Talent
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {savedGigs.map((gig) => (
            <div key={gig.id} className="glass p-10 rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between group hover:border-[#13EC6A]/20 transition-all border border-white/5">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 group-hover:bg-[#13EC6A]/10 group-hover:text-[#13EC6A] transition-all">
                  <Briefcase size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic font-display tracking-tight uppercase mb-1">{gig.title}</h3>
                  <div className="flex items-center gap-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                    <span>{gig.company}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-800" />
                    <span>{gig.location}</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 md:mt-0 flex items-center gap-8">
                <div className="text-right">
                  <p className="text-[#13EC6A] font-black italic font-display text-xl">{gig.budget}</p>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-700">Budget Range</p>
                </div>
                <button className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-gray-400 hover:text-[#13EC6A] transition-colors">
                  <Bookmark size={20} fill="currentColor" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
