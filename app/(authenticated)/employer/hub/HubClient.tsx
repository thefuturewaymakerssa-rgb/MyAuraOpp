"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { parseSmartSearch } from "@/lib/searchUtils";
import { useRouter } from "next/navigation";
import { 
  Play, 
  Bookmark, 
  Search, 
  Gem, 
  TrendingUp, 
  MapPin, 
  Users, 
  Zap,
  Star,
  ShieldCheck,
  Crown,
  Plus,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Loader2
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { FeaturedBadge } from "@/components/FeaturedBadge";
import { savedMakersHub } from "@/lib/supabase-helpers";
import { AnalyticsChart } from "@/components/AnalyticsChart";
import { toast } from "sonner";

type Maker = {
  id: string;
  name: string;
  trade: string;
  location: string;
  avatar_url?: string;
  is_verified: boolean;
  identity_verified: boolean;
  phone?: string;
  created_at: string;
  featured_until?: string;
  proofs: { title: string; video_url: string; thumbnail_url: string; created_at: string }[];
  reviews: { rating: number }[];
};

interface HubClientProps {
  initialMakers: Maker[];
  initialJobs: any[];
  initialSavedIds: string[];
  userId: string | null;
  currentUser: any;
}

export default function HubClient({ initialMakers, initialJobs, initialSavedIds, userId, currentUser }: HubClientProps) {
  const router = useRouter();
  const [makers] = useState<Maker[]>(initialMakers);
  const [query, setQuery] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(initialSavedIds));
  const [myJobs] = useState<any[]>(initialJobs);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [userProfile, setUserProfile] = useState(currentUser);
  const [aiResults, setAiResults] = useState<any[] | null>(null);
  const [isAISearching, setIsAISearching] = useState(false);
  const [weeklyContracts, setWeeklyContracts] = useState<number | null>(null);

  useEffect(() => {
    async function fetchWeeklyCount() {
      const supabase = createClient();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());
        
      setWeeklyContracts((typeof count === 'number') ? count : 320);
    }
    fetchWeeklyCount();
  }, []);

  useEffect(() => {
    if (!userId) {
      router.push("/login?returnTo=/employer/hub");
    }
  }, [userId, router]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('status') === 'success') {
      setUserProfile((prev: any) => ({ ...prev, verification_tier: 'elite' }));
      // Notification of success
      router.replace('/employer/hub');
    }
  }, [router]);

  const toggleSave = useCallback(async (makerId: string) => {
    if (!userId) {
      router.push("/login?returnTo=/employer/hub");
      return;
    }
    try {
      await savedMakersHub.upsert(userId, makerId);
      setSavedIds(prev => {
        const next = new Set(prev);
        if (next.has(makerId)) next.delete(makerId);
        else next.add(makerId);
        return next;
      });
    } catch (err) {
      console.error("Error toggling save:", err);
    }
  }, [userId, router]);

  const handleUpgrade = async () => {
    if (!userId) return router.push("/login?returnTo=/employer/hub");
    setIsUpgrading(true);
    try {
      const res = await fetch("/api/employer/billing/payfast", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Protocol offline.");
      
      const { url, data } = await res.json();
      
      // PayFast requires a form POST redirect
      const form = document.createElement("form");
      form.method = "POST";
      form.action = url;
      
      Object.keys(data).forEach((key) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = data[key];
        form.appendChild(input);
      });
      
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      toast.error("Transmission failure. Check your uplink.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const [now] = useState(() => Date.now());

  const handleHybridSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) {
      setAiResults(null);
      return;
    }

    setIsAISearching(true);
    try {
      const res = await fetch("/api/discovery/hybrid", {
        method: "POST",
        body: JSON.stringify({ query, limit: 12 }),
      });
      if (!res.ok) throw new Error("Matchmaker Offline.");
      const data = await res.json();
      setAiResults(data);
    } catch (err) {
      console.error("AI Search Failure:", err);
      setAiResults(null);
    } finally {
      setIsAISearching(false);
    }
  };

  const filtered = aiResults || makers.filter((m: Maker) => {
    if (!query.trim()) return true;
    if (query === "First Gigs") {
       return new Date(m.created_at).getTime() > now - 30 * 24 * 60 * 60 * 1000;
    }
    const { skill, location } = parseSmartSearch(query);
    const matchesSkill = !skill || m.trade?.toLowerCase().includes(skill) || m.name?.toLowerCase().includes(skill);
    const matchesLocation = !location || m.location?.toLowerCase().includes(location);
    return matchesSkill && matchesLocation;
  }).sort((a, b) => {
    const aFeatured = a.featured_until && new Date(a.featured_until) > new Date();
    const bFeatured = b.featured_until && new Date(b.featured_until) > new Date();
    if (aFeatured && !bFeatured) return -1;
    if (!aFeatured && bFeatured) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-transparent text-[#0F172A] font-sans selection:bg-[#0F766E]/30 pb-40">
      <main className="pt-20 pb-32 px-8 max-w-[1400px] mx-auto">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24">
            {/* Search & Intro */}
            <div className="lg:col-span-8 flex flex-col justify-center">
               <div className="space-y-6 mb-16 max-w-3xl">
                  <div className="flex items-center gap-3 text-[#0F766E] font-black uppercase tracking-[0.4em] text-[10px] italic">
                     <Sparkles size={16} fill="currentColor" /> Mission Control
                  </div>
                  <h1 className="text-8xl md:text-9xl font-black tracking-tighter italic leading-[0.8] font-display uppercase">
                     Scout the <br/><span className="text-[#0F766E]">Elite.</span>
                  </h1>
                  <p className="text-xl text-gray-400 font-bold italic leading-relaxed max-w-xl">
                     Discover verified local professionals with 30s video proof. Hire with context, not just resumes.
                  </p>
               </div>

                <form onSubmit={handleHybridSearch} className="relative max-w-2xl group/search">
                   <div className="absolute inset-0 bg-[#0F766E]/5 blur-[100px] rounded-full opacity-0 group-focus-within/search:opacity-100 transition-all duration-1000" />
                   <div className="relative z-10 bg-white p-2 rounded-[3.5rem] border-2 border-[#E2E8F0] focus-within:border-[#0F766E] transition-all duration-500 shadow-2xl shadow-[#0F766E]/5 overflow-hidden flex items-center">
                      <div className="pl-8 text-gray-300 group-focus-within/search:text-[#0F766E] transition-colors">
                        {isAISearching ? <Loader2 size={32} className="animate-spin text-[#0F766E]" /> : <Search size={32} />}
                      </div>
                      <input
                         type="text"
                         value={query}
                         onChange={(e) => {
                            setQuery(e.target.value);
                            if (!e.target.value.trim()) setAiResults(null);
                         }}
                         placeholder="Welders in Soweto..."
                         className="flex-1 bg-transparent py-10 px-8 text-4xl font-black italic tracking-tighter placeholder-gray-200 focus:outline-none transition-all"
                      />
                      <button 
                        type="submit"
                        disabled={isAISearching}
                        className="h-20 w-20 rounded-full bg-[#0F766E] text-white flex items-center justify-center mr-2 shadow-xl shadow-[#0F766E]/30 hover:scale-105 active:scale-95 transition-all"
                      >
                         <ArrowRight size={32} />
                      </button>
                   </div>
                </form>
            </div>

            {/* Operations Panel */}
            <div className="lg:col-span-4 space-y-10 group">
                {userProfile?.verification_tier !== 'elite' ? (
                  <div className="bg-[#8B5CF6] p-12 rounded-[4rem] border-2 border-white relative overflow-hidden shadow-2xl shadow-[#8B5CF6]/20 transition-all hover:scale-[1.02] duration-700">
                      <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
                      <div className="relative z-10 text-white">
                         <div className="flex items-center gap-4 mb-10">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20"><Crown size={32} className="text-amber-300" /></div>
                            <div className="flex flex-col">
                               <span className="text-2xl font-black italic tracking-tighter uppercase font-display leading-none text-white">Operations</span>
                               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 italic">Elite Access</span>
                            </div>
                         </div>
                         <p className="text-white/80 font-bold text-base mb-12 italic leading-relaxed">Boost your hiring cycle with unlimited scout access and priority gig placements.</p>
                         
                         <div className="flex items-baseline gap-2 mb-12">
                            <span className="text-6xl font-black italic font-display tracking-tighter">R49</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">/ Month</span>
                         </div>
                         
                         <button 
                           onClick={handleUpgrade}
                           disabled={isUpgrading}
                           className="w-full h-20 bg-white text-[#8B5CF6] rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all shadow-xl italic flex items-center justify-center gap-3"
                         >
                            {isUpgrading ? <Loader2 className="animate-spin" size={20} /> : "UPGRADE PROTOCOL"}
                         </button>
                      </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-12 rounded-[4rem] border-2 border-[#8B5CF6]/30 relative overflow-hidden shadow-2xl shadow-[#8B5CF6]/10">
                      <div className="absolute top-0 right-0 p-12 text-[#8B5CF6]/10 animate-pulse">
                         <Crown size={120} />
                      </div>
                      <div className="relative z-10">
                         <div className="flex items-center gap-4 mb-10">
                            <div className="w-16 h-16 rounded-2xl bg-[#8B5CF6] text-white flex items-center justify-center shadow-lg"><Crown size={32} /></div>
                            <div className="flex flex-col">
                               <span className="text-2xl font-black italic tracking-tighter uppercase font-display leading-none text-white">Elite Active</span>
                               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B5CF6] italic">Priority Protocol Engaged</span>
                            </div>
                         </div>
                         <p className="text-white/60 font-bold text-xs uppercase tracking-widest italic leading-loose">You are currently operating with full scout authorization and maximum talent visibility.</p>
                      </div>
                  </div>
                )}

               {/* Talent Velocity Chart */}
               <div className="bg-white p-10 rounded-[3.5rem] border-2 border-[#E2E8F0] shadow-2xl shadow-[#0F766E]/5 relative overflow-hidden">
                   <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-[#0F766E]/10 rounded-xl flex items-center justify-center text-[#0F766E]">
                            <TrendingUp size={16} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#0F766E] italic leading-none">Velocity</p>
                            <p className="text-sm font-black italic tracking-tighter text-gray-400">Applications vs Hires</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-2xl font-black italic font-display text-[#0F172A] tracking-tighter">{weeklyContracts !== null ? `${weeklyContracts}+` : '...'}</p>
                         <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-400 italic mt-1">This Week</p>
                      </div>
                   </div>
                   <AnalyticsChart />
               </div>

               {/* Market Pulse Widget */}
               <div className="bg-white p-12 rounded-[4rem] border-2 border-[#E2E8F0] shadow-2xl shadow-gray-100 relative overflow-hidden group/insights">
                   <div className="absolute top-0 right-0 p-10 text-[#0F766E]/5 group-hover/insights:scale-[1.5] group-hover/insights:rotate-12 transition-all duration-1000"><TrendingUp size={160}/></div>
                   <div className="relative z-10">
                      <p className="text-[10px] font-black text-[#0F766E] uppercase tracking-[0.5em] mb-12 italic flex items-center gap-2">
                         <Zap size={14} fill="currentColor" /> Operations Pulse
                      </p>
                      <div className="space-y-12">
                         {[
                           { label: "Solar Technicians", value: 88, status: "Hot", color: "bg-[#0F766E]" },
                           { label: "Master Electricians", value: 72, status: "Trending", color: "bg-amber-400" }
                         ].map((pulse, i) => (
                           <div key={i}>
                             <div className="flex justify-between items-end mb-4">
                               <p className="font-black text-[10px] uppercase tracking-[0.3em] text-gray-400 italic">{pulse.label}</p>
                               <p className={`${pulse.status === "Hot" ? "text-[#0F766E]" : "text-amber-500"} text-[8px] font-black uppercase tracking-[0.4em] italic`}>{pulse.status}</p>
                             </div>
                             <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                               <div className={`h-full ${pulse.color} shadow-lg transition-all duration-1000`} style={{width: `${pulse.value}%`}} />
                             </div>
                           </div>
                         ))}
                      </div>
                       <div className="mt-16 pt-10 border-t-2 border-gray-50 space-y-4">
                          <Link href="/employer/gigs/new" className="flex items-center justify-between w-full h-16 bg-white border-2 border-[#E2E8F0] hover:border-[#0F766E] p-2 rounded-[1.5rem] pr-6 transition-all group/post shadow-sm">
                             <div className="w-12 h-12 rounded-xl bg-[#0F766E] text-white flex items-center justify-center group-hover/post:scale-110 transition-transform"><Plus size={24} /></div>
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] italic text-[#0F766E]">Post Assignment</span>
                          </Link>
                          
                          <button 
                            onClick={() => toast.success("Boost Protocol Engaged! (3% Platform Fee applies)")}
                            className="flex items-center justify-between w-full h-16 bg-[#F0FDFA] border-2 border-transparent hover:border-[#0F766E]/20 p-2 rounded-[1.5rem] pr-6 transition-all group/boost shadow-premium-subtle"
                          >
                             <div className="w-12 h-12 rounded-xl bg-amber-400 text-white flex items-center justify-center group-hover/boost:scale-110 transition-transform"><Zap size={24} fill="white" /></div>
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] italic text-amber-600">Boost Visibility</span>
                          </button>
                       </div>
                   </div>
                </div>
            </div>
        </section>

        {/* Filter & Results Section */}
        <section className="space-y-16">
            <div className="flex items-center gap-8 overflow-x-auto pb-10 scrollbar-hide px-4 border-b-2 border-gray-50">
               <button
                 onClick={() => setQuery("First Gigs")}
                 className={`flex items-center gap-4 px-10 py-6 rounded-full font-black text-[10px] uppercase tracking-[0.3em] transition-all whitespace-nowrap italic border-2 ${
                   query === "First Gigs"
                     ? "bg-[#0F766E] text-white border-transparent shadow-xl shadow-[#0F766E]/20 scale-110"
                     : "bg-white text-gray-400 border-[#E2E8F0] hover:border-[#0F766E]/30"
                 }`}
               >
                 <Zap size={18} fill="currentColor" stroke="none" /> First Gigs
               </button>
               <div className="w-0.5 h-10 bg-gray-200" />
               {["All Pros", "Welder", "Solar Guru", "Carpenter", "Electrician", "Chef", "Barber"].map((skill) => (
                 <button
                   key={skill}
                   onClick={() => setQuery(skill === "All Pros" ? "" : skill)}
                   className={`px-10 py-6 rounded-full font-black text-[10px] uppercase tracking-[0.3em] transition-all whitespace-nowrap italic border-2 ${
                     (skill === "All Pros" && !query) || query === skill
                       ? "bg-white text-[#0F766E] border-[#0F766E] shadow-xl shadow-[#0F766E]/10 scale-110"
                       : "bg-transparent border-transparent text-gray-300 hover:text-gray-500 hover:border-gray-200"
                   }`}
                 >
                   {skill}
                 </button>
               ))}
               
               {aiResults && (
                 <div className="flex items-center gap-2 px-6 py-4 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-full border border-[#8B5CF6]/30 animate-in fade-in zoom-in ml-auto">
                    <Sparkles size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap italic">AI Hybrid Search Active: {aiResults.length} matches</span>
                 </div>
               )}
            </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {filtered.length > 0 ? (
                filtered.map((maker) => (
                  <MakerCard
                    key={maker.id}
                    maker={maker}
                    isSaved={savedIds.has(maker.id)}
                    onSave={() => toggleSave(maker.id)}
                  />
                ))
              ) : (
                <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-[#E2E8F0] shadow-sm">
                   <div className="w-32 h-32 bg-[#F0FDFA] rounded-[3rem] flex items-center justify-center mx-auto mb-10 text-[#0F766E]/20">
                      <Users size={64} strokeWidth={1} />
                   </div>
                   <h3 className="text-5xl font-black mb-4 italic tracking-tighter uppercase font-display leading-none">No Frequency <br/>Found.</h3>
                   <p className="text-gray-400 font-bold mb-12 max-w-sm mx-auto leading-relaxed italic opacity-70">Adjust your reconnaissance parameters or scout other regions.</p>
                   <button onClick={() => setQuery("")} className="px-12 py-5 bg-[#0F766E] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.4em] italic shadow-xl shadow-[#0F766E]/20 hover:scale-105 active:scale-95 transition-all">REBOOT RADAR</button>
                </div>
              )}
           </div>
        </section>
      </main>
    </div>
  );
}

function MakerCard({ maker, isSaved, onSave }: { maker: Maker; isSaved: boolean; onSave: () => void }) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  
  const avgRating = maker.reviews?.length > 0 
    ? (maker.reviews.reduce((acc, r) => acc + r.rating, 0) / maker.reviews.length).toFixed(1)
    : "New";

  const displayImage = maker.avatar_url || maker.proofs?.[0]?.thumbnail_url || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=400";
  const initials = maker.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div 
      className="group relative aspect-[3/4.8] rounded-[3.5rem] overflow-hidden bg-white border-2 border-[#E2E8F0] hover:border-[#0F766E] hover:shadow-[0_40px_100px_rgba(15,118,110,0.1)] transition-all duration-700 cursor-pointer shadow-premium font-body"
      onMouseEnter={() => { router.prefetch(`/u/${maker.id}`); setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
      onClick={() => router.push(`/u/${maker.id}`)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onSave(); }}
        className={`absolute top-10 right-10 z-40 w-16 h-16 rounded-[1.8rem] backdrop-blur-3xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-2 ${
          isSaved
            ? "bg-[#0F766E] text-white border-transparent shadow-xl shadow-[#0F766E]/40"
            : "bg-white/40 text-[#0F766E] border-white/20 hover:bg-white hover:text-[#0F766E] hover:shadow-xl"
        }`}
      >
        <Bookmark size={28} fill={isSaved ? "currentColor" : "none"} />
      </button>

      {/* Verification Overlay */}
      <div className="absolute top-10 left-10 z-30 flex flex-col gap-3">
         {maker.featured_until && new Date(maker.featured_until) > new Date() && <FeaturedBadge />}
         {maker.is_verified && (
            <div className="bg-[#0F766E] px-5 py-2.5 rounded-[1.2rem] flex items-center gap-3 shadow-xl shadow-[#0F766E]/20 border border-white/10">
               <Gem size={14} className="text-white" />
               <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white italic">Master Pro</span>
            </div>
         )}
         {maker.identity_verified && (
            <div className="bg-white/60 backdrop-blur-xl px-5 py-2.5 rounded-[1.2rem] flex items-center gap-3 border border-white/20 shadow-sm text-[#0F766E]">
               <ShieldCheck size={14} fill="currentColor" fillOpacity={0.1} />
               <span className="text-[9px] font-black uppercase tracking-[0.4em] italic opacity-70">Identity OK</span>
            </div>
         )}
      </div>

      {/* Visual Container */}
      <div className="absolute inset-0 z-0">
         <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/80 to-transparent z-[2]" />
         <div className={`absolute inset-0 bg-[#0F766E]/10 transition-opacity duration-1000 z-[1] ${hovered ? "opacity-100" : "opacity-0"}`} />
         {/* Fallback initials + bg */}
         <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 z-0 flex items-center justify-center">
            <span className="text-8xl font-black text-[#0F766E]/10 italic tracking-tighter">{initials}</span>
         </div>
         {/* Video preview / Image placeholder */}
         <img 
           src={displayImage}
           alt={maker.name}
           className={`absolute inset-0 w-full h-full object-cover grayscale transition-all duration-1000 ${hovered ? "grayscale-0 scale-105" : "scale-100"}`} 
           crossOrigin="anonymous"
         />
      </div>

      {/* Play Protocol Overlay */}
      <div className={`absolute inset-0 z-20 flex items-center justify-center transition-all duration-700 ease-out ${hovered ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`}>
         <div className="w-24 h-24 rounded-[3.5rem] bg-white text-[#0F766E] flex items-center justify-center shadow-2xl shadow-[#0F766E]/30 border-2 border-[#F0FDFA] active:scale-95 transition-all">
            <Play fill="currentColor" size={40} className="ml-1" />
         </div>
      </div>

      {/* Identity Block */}
      <div className="absolute bottom-0 w-full p-12 z-30 space-y-6">
         <div className="space-y-4">
            <div className="flex items-center gap-3">
               <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-lg shadow-[#10B981]/50" />
               <p className="text-[#10B981] text-[10px] font-black uppercase tracking-[0.6em] italic drop-shadow-lg">{maker.trade || "Hustler"}</p>
            </div>
            <h3 className="text-5xl md:text-6xl font-black text-white tracking-widest uppercase italic font-display leading-[0.75] mb-2 drop-shadow-2xl">
               {maker.name?.split(' ')[0] || "Maker"} <br/>
               <span className={`${hovered ? "text-[#0F766E]" : "text-white/30"} transition-all duration-700`}>{maker.name?.split(' ')[1] || "Pro"}</span>
            </h3>
         </div>
         
         <div className="flex items-center gap-6 pt-10 border-t border-white/10 group-hover:border-[#0F766E]/20 transition-all duration-500">
            <div className="flex-1">
               <div className="flex items-center gap-3 text-[11px] font-black text-white/40 uppercase tracking-[0.4em] italic leading-none">
                  <MapPin size={14} className="text-[#0F766E]" fill="currentColor" opacity={0.3} /> {maker.location?.split(',')[0] || "Soweto"}
               </div>
            </div>
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-3xl px-6 py-3 rounded-2xl border border-white/5 shadow-2xl">
                <Star size={14} className="text-amber-400" fill="currentColor" />
                <span className="text-lg font-black italic tracking-tighter text-white">{avgRating}</span>
            </div>
         </div>

         {/* CTA Interaction */}
         <div className={`pt-6 transition-all duration-700 ease-out ${hovered ? "h-auto opacity-100 translate-y-0" : "h-0 opacity-0 translate-y-12 invisible"}`}>
            <button className="w-full h-16 bg-[#0F766E] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.5em] shadow-2xl shadow-[#0F766E]/40 italic flex items-center justify-center gap-3 active:scale-95 transition-all">
               Scout Vibe <ChevronRight size={16} />
            </button>
         </div>
      </div>
    </div>
  );
}
