"use client";

import { useState } from "react";
import { Play, MapPin, ChevronLeft, ChevronRight } from "lucide-react";

const PROOF_CLIPS = [
  { 
    name: "Lerato", 
    trade: "Graphic Designer", 
    location: "Soweto", 
    color: "from-purple-500 to-indigo-600",
    image: "https://images.unsplash.com/photo-1572044162444-ad60f128bde3?w=800"
  },
  { 
    name: "Sipho", 
    trade: "Welder", 
    location: "Alexandra", 
    color: "from-orange-500 to-red-600",
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800"
  },
  { 
    name: "Thabo", 
    trade: "Chef", 
    location: "Umlazi", 
    color: "from-emerald-500 to-teal-600",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800"
  },
  { 
    name: "Zanele", 
    trade: "Plumber", 
    location: "Khayelitsha", 
    color: "from-blue-500 to-cyan-600",
    image: "https://images.unsplash.com/photo-1581244276877-c332ff00e99d?w=800"
  },
];

export function ProofCarousel() {
  const [scrollProgress, setScrollProgress] = useState(0);

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("proof-scroll-container");
    if (container) {
      const scrollAmount = direction === "left" ? -400 : 400;
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full overflow-hidden py-24 relative">
      <div className="max-w-7xl mx-auto px-6 mb-12 flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-black text-white mb-4 tracking-tighter italic">Featured Proof Clips.</h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Real skill, captured in action.</p>
        </div>
        <div className="hidden md:flex gap-4">
           <button 
             onClick={() => scroll("left")}
             className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#1CD79D] hover:text-black transition-all group"
           >
              <ChevronLeft size={24} className="group-active:scale-95" />
           </button>
           <button 
             onClick={() => scroll("right")}
             className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#1CD79D] hover:text-black transition-all group"
           >
              <ChevronRight size={24} className="group-active:scale-95" />
           </button>
        </div>
      </div>

      <div 
        id="proof-scroll-container"
        className="flex gap-8 overflow-x-auto pb-12 px-6 md:px-[calc((100vw-80rem)/2)] no-scrollbar snap-x scroll-smooth"
      >
        {PROOF_CLIPS.map((clip, i) => (
          <div 
            key={i} 
            className="flex-shrink-0 w-[450px] aspect-[9/16] rounded-[3rem] bg-[#2D332A] relative overflow-hidden group snap-center border border-white/5 shadow-2xl"
          >
            {/* Real Background Image */}
            <img 
              src={clip.image} 
              alt={clip.name} 
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
              crossOrigin="anonymous"
            />
            
            <div className={`absolute inset-0 bg-gradient-to-br ${clip.color} opacity-20 mix-blend-overlay`} />
            
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="w-24 h-24 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white border border-white/20 group-hover:scale-110 transition-transform shadow-2xl">
                <Play fill="currentColor" size={32} className="ml-1" />
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-black via-black/40 to-transparent z-10">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1CD79D] animate-pulse shadow-[0_0_10px_rgba(28,215,157,0.8)]"></span>
                <p className="text-white font-black text-3xl italic tracking-tighter uppercase">{clip.name}</p>
              </div>
              <p className="text-gray-300 font-bold text-lg mb-4">{clip.trade}</p>
              <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] bg-white/5 w-fit px-4 py-2 rounded-full border border-white/5">
                <MapPin size={12} className="text-[#1CD79D]" />
                {clip.location}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
