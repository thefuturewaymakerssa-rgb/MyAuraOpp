"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Search, MapPin, Clock, ArrowUpRight, List, Map as MapIcon, Zap, Sparkles, ChevronRight, Briefcase, Filter, X } from "lucide-react";
import WorkRadar from "@/components/WorkRadar";
import { getDistance, getCoordsForLocation } from "@/lib/locationUtils";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const GigMap = dynamic(() => import("@/components/GigMap"), { 
  ssr: false, 
  loading: () => (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center animate-pulse">
      <div className="w-20 h-20 bg-[#F0FDFA] rounded-full flex items-center justify-center mb-4 text-[#0F766E]">
         <MapIcon size={32} />
      </div>
      <div className="text-[#0F766E] font-black text-[10px] uppercase tracking-[0.4em] italic">BOOTING RADAR...</div>
    </div>
  ) 
});

type Job = {
  id: string;
  title: string;
  trade: string;
  location: string;
  description: string;
  budget: string;
  created_at: string;
  preferred_talent_type?: string[];
};

export default function GigBoard() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  const viewMode = (searchParams.get("view") as "list" | "map") || "list";
  
  const [activeRadius, setActiveRadius] = useState<number | null>(null);
  const [activeRoleFilter, setActiveRoleFilter] = useState<string | null>(null);
  const { latitude, longitude } = useGeolocation();
  const [now] = useState(() => Date.now());

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      
      setJobs(data || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const filtered = jobs.filter(j => {
    const matchesQuery = 
      j.title.toLowerCase().includes(query.toLowerCase()) ||
      j.trade.toLowerCase().includes(query.toLowerCase()) ||
      j.location.toLowerCase().includes(query.toLowerCase());

    const matchesRole = !activeRoleFilter || j.preferred_talent_type?.includes(activeRoleFilter);
    
    const matchesRadius = (() => {
      if (!activeRadius || !latitude || !longitude) return true;
      const jobCoords = getCoordsForLocation(j.location);
      if (!jobCoords) return true;
      const distance = getDistance(latitude, longitude, jobCoords.lat, jobCoords.lng);
      return distance <= activeRadius;
    })();

    return matchesQuery && matchesRole && matchesRadius;
  });

  return (
    <div className="flex flex-col font-sans selection:bg-[#0F766E]/30 relative pb-40">
      <div className="flex-1 w-full max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-24 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
           <div className="flex items-center justify-center gap-3 text-[#0F766E] font-black uppercase tracking-[0.5em] text-[10px] italic">
             <Sparkles size={16} fill="currentColor" /> The Marketplace
           </div>
           <h1 className="text-8xl md:text-9xl font-black mb-10 tracking-tighter italic leading-[0.8] font-display uppercase">Real Gigs. <br/><span className="text-[#0F766E]">Real Makers.</span></h1>
           <p className="text-2xl text-gray-400 font-bold max-w-2xl mx-auto leading-relaxed italic pr-4 pl-4 opacity-70">
             Browse verified local projects and apply with your VibeCV. Proximity is power on WayMakers.
           </p>
        </div>
 
        {/* Search Engine */}
        <div className="relative mb-20 max-w-2xl mx-auto group z-20">
          <div className="absolute inset-0 bg-[#0F766E]/5 blur-[80px] rounded-full opacity-0 group-focus-within:opacity-100 transition-all duration-1000" />
          <div className="relative bg-white border-2 border-[#E2E8F0] focus-within:border-[#0F766E] rounded-[3.5rem] p-2 flex items-center shadow-2xl shadow-[#0F766E]/5 transition-all duration-500 overflow-hidden">
             <div className="pl-10 text-gray-300 group-focus-within:text-[#0F766E] transition-colors"><Search size={32} /></div>
             <input 
               type="text"
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               placeholder='Filter by trade, location...'
               className="flex-1 bg-transparent py-10 px-8 text-3xl font-black italic tracking-tighter placeholder-gray-200 focus:outline-none transition-all"
             />
             <div className="h-20 w-32 bg-[#F0FDFA] rounded-[1.5rem] flex items-center justify-center text-[#0F766E] mr-2 font-black text-[10px] uppercase tracking-widest italic border border-[#0F766E]/10">
                SCN
             </div>
          </div>
        </div>

        {/* Talent Type Filters */}
        <div className="mb-24 flex flex-wrap items-center justify-center gap-4">
           {[
             { id: 'hustler', label: 'Hustlers' },
             { id: 'freshie', label: 'Fresh Talent' },
             { id: 'graduate', label: 'Graduates' },
             { id: 'reskiller', label: 'Reskillers' }
           ].map(role => (
             <button
               key={role.id}
               onClick={() => setActiveRoleFilter(activeRoleFilter === role.id ? null : role.id)}
               className={`px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all italic ${
                 activeRoleFilter === role.id 
                 ? "bg-[#0F766E] border-transparent text-white shadow-lg shadow-[#0F766E]/20" 
                 : "bg-white border-[#E2E8F0] text-gray-400 hover:border-[#0F766E]/30"
               }`}
             >
                {role.label}
             </button>
           ))}
           {activeRoleFilter && (
             <button onClick={() => setActiveRoleFilter(null)} className="p-4 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                <X size={16} />
             </button>
           )}
        </div>

        {/* Results Area */}
        <div className="space-y-12 relative z-10">
          <div className="flex justify-between items-end px-4">
            <h2 className="text-3xl font-black font-display italic tracking-tight uppercase leading-none">Open Assignments <span className="text-[#0F766E] opacity-50 ml-2">({filtered.length})</span></h2>
            <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Sorted by Recency</div>
          </div>

          {loading ? (
            <div className="space-y-10">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-white rounded-[4rem] animate-pulse border-2 border-[#F0FDFA] relative overflow-hidden" />
              ))}
            </div>
          ) : viewMode === "map" ? (
             <div className="w-full h-[700px] relative">
                <GigMap 
                  jobs={filtered} 
                  userLat={latitude} 
                  userLng={longitude} 
                  activeRadius={activeRadius} 
                />
             </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-12">
              {filtered.map(job => (
                <JobCard key={job.id} job={job} now={now} />
              ))}
            </div>
          ) : (
            <div className="text-center py-40 bg-white rounded-[4rem] border-2 border-dashed border-[#E2E8F0] shadow-sm">
               <div className="w-24 h-24 bg-[#F0FDFA] rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-gray-200"><Search size={64} /></div>
               <p className="text-gray-400 text-3xl font-black italic mb-10 font-display uppercase leading-none">No Frequency <br/>Detected.</p>
               <button onClick={() => setQuery("")} className="px-12 py-5 bg-[#0F766E] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.4em] italic shadow-xl shadow-[#0F766E]/20 hover:scale-105 transition-all">REBOOT FILTERS</button>
            </div>
          )}
        </div>
        </div>

      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[50]">
        <WorkRadar activeRadius={activeRadius} onRadiusChange={(val) => setActiveRadius(val)} />
      </div>
    </div>
  );
}

function JobCard({ job, now }: { job: Job; now: number }) {
  const timeAgo = (dateStr: string) => {
    const diff = now - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return "Just now";
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="group relative bg-white p-12 rounded-[4rem] border-2 border-[#E2E8F0] hover:border-[#0F766E] hover:shadow-[0_40px_100px_rgba(15,118,110,0.08)] transition-all duration-700 cursor-pointer overflow-hidden transform hover:-translate-y-2">
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#0F766E]/5 rounded-full blur-[120px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 relative z-10">
        <div className="flex-1 space-y-8">
          <div className="flex items-center gap-6">
            <span className="bg-[#F0FDFA] text-[#0F766E] px-6 py-2.5 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.4em] border border-[#0F766E]/10 shadow-sm italic transition-all group-hover:bg-[#0F766E] group-hover:text-white">
               {job.trade}
            </span>
            {job.preferred_talent_type && (
               <span className={`px-5 py-2.5 rounded-[1.2rem] text-[9px] font-black uppercase tracking-[0.3em] border-2 italic shadow-sm flex items-center gap-2 ${
                  job.preferred_talent_type?.includes('graduate') ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                  job.preferred_talent_type?.includes('freshie') ? "bg-[#13EC6A]/10 text-[#0F766E] border-[#13EC6A]/20" :
                  "bg-amber-500/10 text-amber-600 border-amber-500/10"
               }`}>
                  <Briefcase size={12} strokeWidth={3} /> {job.preferred_talent_type?.[0] || 'Talent'} Preferred
               </span>
            )}
            <span className="text-gray-300 text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 italic">
               <Clock size={16} /> {timeAgo(job.created_at)}
            </span>
          </div>
          
          <h3 className="text-5xl font-black tracking-tighter italic leading-[0.9] font-display uppercase group-hover:text-[#0F766E] transition-colors">{job.title}</h3>
          
          <div className="flex flex-wrap gap-10 text-[10px] font-black uppercase tracking-[0.4em] italic leading-none">
            <span className="flex items-center gap-3 text-gray-400"><MapPin size={18} className="text-[#0F766E]" fill="currentColor" opacity={0.3} /> {job.location}</span>
            {job.budget && <span className="flex items-center gap-3 text-[#0F766E] transition-all group-hover:scale-110"><Zap size={18} fill="currentColor" stroke="none" /> {job.budget}</span>}
          </div>
        </div>
        
        <Link 
          href={`/gigs/${job.id}`}
          className="flex items-center justify-center gap-4 h-24 bg-[#0F766E] text-white px-16 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.5em] shadow-2xl shadow-[#0F766E]/30 hover:scale-105 active:scale-95 transition-all italic border-b-8 border-black/10"
        >
          Initialize <ChevronRight size={24} />
        </Link>
      </div>
    </div>
  );
}
