"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { profilesHub,  applicationsHub  } from "@/lib/supabase-helpers";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { 
  Play, 
  Trash2, 
  Plus, 
  Star, 
  ShieldCheck, 
  MapPin, 
  Briefcase, 
  User, 
  Zap,
  ChevronRight,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { formatProfileRole, getRoleTheme } from "@/lib/user-helpers";

export default function DashboardClient({ initialMaker, initialWallet, initialOpportunities, initialSaveCount, initialContracts, initialNotifications }: any) {
  const [maker, setMaker] = useState(initialMaker);
  const [proofs, setProofs] = useState(initialMaker?.proofs || []);
  const [saveCount] = useState(initialSaveCount || 0);
  const [contracts] = useState(initialContracts || []);
  const [activeSubTab, setActiveSubTab] = useState<"proofs" | "gigs" | "reviews">("proofs");
  const router = useRouter();

  const calculateVibeScore = useCallback(() => {
    let score = 0;
    if (maker?.name) score += 20;
    if (maker?.trade) score += 20;
    if (maker?.location) score += 20;
    if (maker?.bio) score += 20;
    if (proofs.length > 0) score += 20;
    return score;
  }, [maker, proofs]);

  const toggleAvailability = async () => {
    try {
      const newStatus = !maker?.is_available;
      await profilesHub.update(maker.id, { is_available: newStatus });
      setMaker({ ...maker, is_available: newStatus });
    } catch (err) {
      console.error("Error toggling availability:", err);
    }
  };

  const handleDeleteProof = async (proofId: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("proofs").delete().eq("id", proofId);
      if (error) throw error;
      setProofs(proofs.filter((p: any) => p.id !== proofId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col font-sans selection:bg-[#0F766E]/30 relative pb-40">
      <div className="flex-1 w-full max-w-2xl mx-auto pt-6">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between w-full mb-8 px-2">
           <button 
             onClick={() => router.push('/feed')} 
             className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-500 hover:text-[#0F766E] border-2 border-[#E2E8F0] shadow-sm transition-all hover:scale-105 active:scale-95"
           >
             <ArrowLeft size={24} />
           </button>
           <span className="text-[10px] font-black uppercase tracking-[0.4em] italic text-gray-400">Command Center</span>
           <div className="w-12 h-12" /> {/* Spacer for balance */}
        </div>
        
        {/* Verification Callout */}
        {!maker?.verification_paid_at && (
          <Link href="/settings?tab=payouts" className="block mb-12 group">
             <div className="p-8 bg-amber-500 rounded-[3rem] border-4 border-white shadow-2xl shadow-amber-500/20 relative overflow-hidden group-hover:scale-[1.02] active:scale-95 transition-all duration-500">
                <div className="absolute top-0 right-0 p-10 text-white/10 group-hover:text-white/20 transition-colors pointer-events-none transform rotate-12">
                   <ShieldCheck size={120} />
                </div>
                <div className="relative z-10 space-y-4">
                   <div className="flex items-center gap-3 text-white">
                      <Zap size={20} className="fill-white" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Priority Protocol</span>
                   </div>
                   <h3 className="text-4xl font-black italic tracking-tighter uppercase font-display leading-[0.85] text-white">Unlock <br/>Verification.</h3>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80 italic max-w-[200px] leading-relaxed">Boost Visibility • Earn Trust Badge • Faster Payouts</p>
                </div>
                <div className="absolute bottom-8 right-8 w-12 h-12 rounded-full bg-white flex items-center justify-center text-amber-500 shadow-xl group-hover:translate-x-2 transition-transform">
                   <ChevronRight size={24} strokeWidth={4} />
                </div>
             </div>
          </Link>
        )}
        {/* YES Programme Quick-Action */}
        <div className="mb-12 group">
           <a 
             href="https://yes4youth.co.za/" 
             target="_blank" 
             rel="noopener noreferrer"
             className="block p-8 bg-[#0F172A] rounded-[3rem] border-4 border-white shadow-2xl shadow-black/10 relative overflow-hidden group-hover:scale-[1.02] active:scale-95 transition-all duration-500"
           >
              <div className="absolute top-0 right-0 p-10 text-white/5 group-hover:text-white/10 transition-colors pointer-events-none transform -rotate-12">
                 <Sparkles size={120} />
              </div>
              <div className="relative z-10 space-y-4">
                 <div className="flex items-center gap-3 text-[#10B981]">
                    <Star size={20} className="fill-[#10B981]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Youth Opportunity</span>
                 </div>
                 <h3 className="text-4xl font-black italic tracking-tighter uppercase font-display leading-[0.85] text-white">YES <br/>Programme.</h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 italic max-w-sm leading-relaxed">Quick-Action: Apply for work-readiness & placement protocols.</p>
              </div>
              <div className="absolute bottom-8 right-8 w-12 h-12 rounded-full bg-[#10B981] flex items-center justify-center text-white shadow-xl group-hover:translate-x-2 transition-transform">
                 <ChevronRight size={24} strokeWidth={4} />
              </div>
           </a>
        </div>

        {/* Profile Header (High-Fidelity) */}
        <div className="flex flex-col items-center text-center mb-16 relative">
           <div className="relative mb-10 group">
              <div className="w-40 h-40 rounded-[3.5rem] bg-white border-2 border-[#E2E8F0] p-1.5 shadow-2xl group-hover:rotate-6 transition-all duration-500 shadow-[#0F766E]/5 relative">
                  <div className="w-full h-full bg-[#F0FDFA] rounded-[3rem] flex items-center justify-center overflow-hidden border border-[#0F766E]/5">
                    {maker?.avatar_url ? (
                       <img src={maker.avatar_url} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" />
                    ) : (
                       <span className="text-4xl font-black text-[#0F766E]/20 italic tracking-tighter">
                         {maker?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                       </span>
                    )}
                  </div>
                  {/* Role Badge Overlay */}
                  <div className={`absolute -top-3 -right-3 px-5 py-2 ${getRoleTheme(maker?.role).bg} ${getRoleTheme(maker?.role).text} text-[9px] font-black italic uppercase tracking-widest rounded-full shadow-lg border-2 border-white`}>
                     {formatProfileRole(maker?.role)}
                  </div>
               </div>
               {maker?.identity_verified && (
                 <div className="absolute -bottom-1 -right-1 w-12 h-12 rounded-full bg-[#10B981] border-4 border-white flex items-center justify-center text-white shadow-xl animate-in zoom-in duration-500">
                    <ShieldCheck size={22} />
                 </div>
               )}
            </div>

           <div className="space-y-2">
              <h2 className="text-6xl font-black italic tracking-tighter uppercase font-display leading-none">{maker?.name}</h2>
              <div className="flex flex-wrap items-center justify-center gap-4">
                 <p className="text-[#0F766E] font-black text-[10px] uppercase tracking-[0.4em] italic flex items-center gap-2">
                    <MapPin size={12} fill="currentColor" /> {maker?.location || "Soweto, ZA"}
                 </p>
                 <span className="w-1 h-1 bg-gray-300 rounded-full" />
                 <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.4em] italic">{maker?.trade}</p>
              </div>
           </div>
           
           {/* High-Impact Stat Grid */}
           <div className="grid grid-cols-3 gap-8 w-full mt-12 px-4 py-8 bg-white/50 backdrop-blur-3xl rounded-[3rem] border-2 border-white shadow-xl shadow-[#0F766E]/5">
              <div className="flex flex-col items-center gap-1">
                 <span className="text-4xl font-black italic font-display text-[#0F766E] leading-none">{calculateVibeScore()}%</span>
                 <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-400 italic">Vibe Score</span>
              </div>
              <div className="flex flex-col items-center gap-1 border-x-2 border-[#E2E8F0]">
                 <span className="text-4xl font-black italic font-display leading-none">{saveCount}</span>
                 <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-400 italic">Saves</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                 <span className="text-4xl font-black italic font-display leading-none">{contracts.length}</span>
                 <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-400 italic">Gigs Done</span>
              </div>
           </div>

           <div className="mt-10 flex gap-4 w-full px-2">
              <Link href="/settings" className="flex-1 h-16 bg-white border-2 border-[#E2E8F0] rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:border-[#0F766E]/30 transition-all italic flex items-center justify-center gap-3">
                 <Sparkles size={16} className="text-[#F59E0B]" /> Edit Profile
              </Link>
              <button 
                onClick={toggleAvailability}
                className={`flex-1 h-16 border-2 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all italic flex items-center justify-center gap-3 ${maker?.is_available ? "bg-[#0F766E] border-transparent text-white shadow-xl shadow-[#0F766E]/20" : "bg-white border-[#E2E8F0] text-gray-400"}`}
              >
                {maker?.is_available ? <><span className="w-2 h-2 bg-white rounded-full animate-pulse" /> Available</> : "Go Online"}
              </button>
           </div>
        </div>

        {/* PROFILE SUB-TABS (Segmented Control style) */}
        <div className="sticky top-0 z-40 py-8 mx-[-24px] px-8 bg-[#F0FDFA]/80 backdrop-blur-xl">
           <div className="bg-white/50 p-2 rounded-[2rem] border-2 border-white shadow-inner flex">
              {[
                { id: "proofs", label: "My Clips", icon: Play },
                { id: "gigs", label: "My Gigs", icon: Briefcase },
                { id: "reviews", label: "Vouches", icon: Star }
              ].map((tab) => {
                const isActive = activeSubTab === tab.id;
                return (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] transition-all duration-300 ${isActive ? "bg-white text-[#0F766E] shadow-lg shadow-[#0F766E]/5 italic" : "text-gray-400 hover:text-gray-600 italic"}`}
                  >
                    <tab.icon size={18} strokeWidth={isActive ? 3 : 2} />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{tab.label}</span>
                  </button>
                );
              })}
           </div>
        </div>

        {/* TAB CONTENT */}
        <div className="pt-4 pb-48">
           {activeSubTab === "proofs" && (
              <div className="grid grid-cols-2 gap-6">
                 <Link href="/talent/studio/record" className="aspect-[9/16] bg-white border-4 border-dashed border-[#E2E8F0] rounded-[3rem] flex flex-col items-center justify-center gap-6 hover:border-[#0F766E]/40 group transition-all duration-500 hover:scale-[1.02] shadow-sm">
                    <div className="w-20 h-20 rounded-[1.5rem] bg-[#F0FDFA] flex items-center justify-center text-[#0F766E] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 group-hover:bg-[#0F766E] group-hover:text-white">
                       <Plus size={40} />
                    </div>
                    <div className="text-center">
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 group-hover:text-[#0F766E] italic block">Record</span>
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 group-hover:text-[#0F766E] italic block">New Proof</span>
                    </div>
                 </Link>
                 
                 {proofs.map((proof: any) => (
                    <div key={proof.id} className="aspect-[9/16] bg-white rounded-[3rem] overflow-hidden relative group border-2 border-[#E2E8F0] shadow-premium hover:shadow-[#0F766E]/10 transition-all duration-500">
                       <video src={proof.video_url} className="w-full h-full object-cover" crossOrigin="anonymous" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                       
                       <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                          <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-white italic border border-white/10">Verified Proof</div>
                       </div>

                       <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center z-10">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black italic uppercase tracking-widest text-[#10B981] drop-shadow-lg">Mission Verified</span>
                          </div>
                          <button onClick={() => handleDeleteProof(proof.id)} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/50 hover:text-red-500 hover:bg-white hover:shadow-xl transition-all">
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           )}

           {activeSubTab === "gigs" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                 {contracts.length > 0 ? (
                    contracts.map((contract: any) => (
                       <Link key={contract.id} href={`/contracts/${contract.id}`} className="block group p-10 bg-white rounded-[3.5rem] border-2 border-[#E2E8F0] hover:border-[#0F766E] transition-all duration-500 shadow-2xl shadow-[#0F766E]/5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-12 text-[#0F766E]/5 group-hover:text-[#0F766E]/10 transition-colors pointer-events-none">
                             <Briefcase size={80} />
                          </div>
                          <div className="flex justify-between items-start mb-8 relative z-10">
                             <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.3em] italic ${contract.status === 'completed' ? "bg-indigo-50 text-indigo-500 border-2 border-indigo-100" : "bg-[#F0FDFA] text-[#0F766E] border-2 border-[#CCFBF1]"}`}>
                                {contract.status}
                             </span>
                             <div className="text-right">
                                <span className="text-3xl font-black italic font-display text-[#0F172A] leading-none mb-2">R {contract.price}</span>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Settlement amount</p>
                             </div>
                          </div>
                          <h4 className="text-4xl font-black italic tracking-tighter uppercase font-display leading-[0.9] group-hover:text-[#0F766E] transition-all transform group-hover:translate-x-2">{contract.trade} <br/>Assignment</h4>
                          <div className="mt-10 pt-8 border-t-2 border-[#F0FDFA] flex items-center justify-between">
                             <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Order ID: #{contract.id.slice(0, 8)}</span>
                             <div className="flex items-center gap-2 text-[#0F766E] font-black text-[10px] uppercase tracking-widest italic">Review Now <ChevronRight size={14} /></div>
                          </div>
                       </Link>
                    ))
                 ) : (
                    <div className="text-center py-32 space-y-8 opacity-40 grayscale animate-pulse">
                       <div className="w-24 h-24 bg-gray-100 rounded-[2.5rem] flex items-center justify-center mx-auto text-gray-300"><Briefcase size={48} /></div>
                       <div>
                          <p className="text-4xl font-black italic tracking-tighter font-display uppercase leading-tight">No Active <br/>Hustles.</p>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-6 italic">Go to the Gig Board to scout work</p>
                       </div>
                    </div>
                 )}
                 
                 <Link href="/gigs" className="flex items-center justify-center gap-4 py-8 bg-[#0F766E] text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-xl shadow-[#0F766E]/20 hover:scale-[1.02] active:scale-95 transition-all italic">
                    <Zap size={18} /> Scout Local Gigs
                 </Link>
              </div>
           )}

           {activeSubTab === "reviews" && (
              <div className="py-32 text-center animate-in scale-in-95 duration-700">
                 <div className="w-32 h-32 rounded-[3.5rem] bg-[#F59E0B]/5 text-[#F59E0B] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-[#F59E0B]/10 border-2 border-[#F59E0B]/10 transform rotate-12">
                    <Star size={64} fill="currentColor" />
                 </div>
                 <h3 className="text-5xl font-black italic tracking-tighter font-display uppercase italic text-[#0F172A] leading-none mb-6">Respect The Vibe.</h3>
                 <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.5em] italic max-w-sm mx-auto leading-relaxed opacity-70">Social proof is earned. Complete assignments to see vouches here.</p>
              </div>
           )}
        </div>
        </div>
    </div>
  );
}
