"use client";

import { Briefcase, MapPin, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { use, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface EmployerProfile {
  id: string;
  name: string | null;
  bio: string | null;
  role: string | null;
  avatar_url: string | null;
}

export default function PublicEmployerProfile({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [activeTab, setActiveTab] = useState<"opportunities" | "about">("opportunities");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<EmployerProfile | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (data) setProfile(data as EmployerProfile);
      setLoading(false);
    }
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen bg-[#0D110F] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#13EC6A]" size={48} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-screen bg-[#0D110F] flex flex-col items-center justify-center text-white p-10 text-center">
        <h1 className="text-4xl font-black italic mb-4 font-display">Employer Not Found.</h1>
        <Link href="/feed" className="text-[#13EC6A] font-black uppercase tracking-widest hover:underline">Go Back to Feed</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FDFA] text-[#0F172A] font-sans p-8 lg:p-20 relative overflow-hidden selection:bg-[#0F766E]/30">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#0F766E]/5 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-24 relative z-10">
        {/* Company Header */}
        <section className="flex flex-col md:flex-row gap-16 items-center md:items-start animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="w-48 h-48 rounded-[3.5rem] bg-white border-2 border-[#E2E8F0] shadow-sm flex items-center justify-center text-8xl font-black italic font-display text-[#0F766E] shadow-premium group hover:scale-105 transition-transform duration-500">
            {profile.name?.[0] || "E"}
          </div>
          
          <div className="flex-1 space-y-8 text-center md:text-left">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                <h1 className="text-7xl md:text-8xl font-black italic tracking-tighter font-display uppercase leading-[0.85]">{profile.name || "Anonymous"}<br/><span className="text-[#0F766E] drop-shadow-sm">Employer.</span></h1>
                <CheckCircle2 size={40} className="text-[#0F766E]" />
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-[0.4em] text-[10px] italic flex items-center justify-center md:justify-start gap-3">
                <MapPin size={16} className="text-[#0F766E]" /> South Africa • Verified Authority
              </p>
            </div>

            <p className="max-w-2xl text-xl text-gray-500 font-bold leading-relaxed italic opacity-80">
              {profile.bio || "Building the future of South Africa by hiring the best local talent with verified video proof and professional energy."}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 pt-6 justify-center md:justify-start">
               <button 
                 onClick={() => setActiveTab("about")}
                 className={`px-12 py-5 font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl transition-all shadow-xl italic ${activeTab === "about" ? "bg-[#0F766E] text-white shadow-[#0F766E]/20" : "bg-white text-[#0F172A] border-2 border-[#E2E8F0] hover:border-[#0F766E]"}`}
               >
                 Protocol Details
               </button>
               <button className="px-10 py-5 bg-white border-2 border-[#E2E8F0] rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] text-gray-400 hover:text-[#0F172A] hover:border-[#0F172A] transition-all italic">
                 Contact Info
               </button>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <StatCard label="Hustles Managed" value="128" />
           <StatCard label="Talent Secured" value="45" />
           <StatCard label="Integrity Rating" value="4.9/5" />
        </section>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-4 md:gap-10 border-b-2 border-[#E2E8F0] pb-8">
           <button 
             onClick={() => setActiveTab("opportunities")}
             className={`text-2xl md:text-3xl font-black italic uppercase tracking-tighter transition-all font-display ${activeTab === "opportunities" ? "text-[#0F172A] scale-105" : "text-gray-300 hover:text-gray-500"}`}
           >
              Active Assignments
           </button>
           <button 
             onClick={() => setActiveTab("about")}
             className={`text-2xl md:text-3xl font-black italic uppercase tracking-tighter transition-all font-display ${activeTab === "about" ? "text-[#0F172A] scale-105" : "text-gray-300 hover:text-gray-500"}`}
           >
              Intelligence
           </button>
        </div>

        {activeTab === "opportunities" ? (
          <section className="space-y-12 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 gap-10">
                {[1, 2].map(i => (
                  <Link key={i} href={`/gigs/${i}`} className="bg-white p-12 rounded-[3.5rem] flex flex-col md:flex-row md:items-center justify-between group hover:border-[#0F766E]/30 hover:shadow-2xl hover:shadow-[#0F766E]/5 transition-all border-2 border-white shadow-sm">
                     <div className="flex items-center gap-10">
                        <div className="w-20 h-20 bg-[#F0FDFA] border-2 border-[#0F766E]/10 rounded-2xl flex items-center justify-center text-[#0F766E] shadow-sm transform group-hover:rotate-6 transition-transform">
                          <Briefcase size={32} />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-4xl font-black italic tracking-tight font-display uppercase mb-1">Senior Builder Needed.</h4>
                          <div className="flex items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] italic">
                             <span className="flex items-center gap-2"><MapPin size={12} className="text-[#0F766E]" /> JHB Central</span>
                             <span className="text-[#0F766E]">R 4,500.00 Fixed</span>
                          </div>
                        </div>
                     </div>
                     <div className="mt-8 md:mt-0 flex items-center gap-10">
                        <div className="px-6 py-3 bg-[#F0FDFA] text-[#0F766E] text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-[#0F766E]/10 italic">High Priority</div>
                        <ArrowRight className="text-gray-200 group-hover:text-[#0F766E] group-hover:translate-x-4 transition-all duration-500" size={40} />
                     </div>
                  </Link>
                ))}
             </div>
          </section>
        ) : (
          <section className="space-y-12 max-w-4xl animate-in fade-in duration-500">
             <div className="bg-white p-14 rounded-[3.5rem] border-2 border-white shadow-sm space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#0F766E]/5 rounded-full blur-[80px] pointer-events-none" />
                <h3 className="text-5xl font-black italic font-display uppercase text-[#0F172A] tracking-tighter">Authority Vision.</h3>
                <p className="text-xl text-gray-500 font-bold leading-relaxed italic">
                   {profile.bio || "Building the future of South Africa by hiring the best local talent. We prioritize verified video proof and professional energy over paper resumes. Our goal is to connect skills with opportunities effectively through a high-trust digital engine."}
                </p>
                <div className="pt-10 grid grid-cols-2 gap-12 border-t-2 border-gray-50">
                   <div className="space-y-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] italic">Vertical</p>
                      <p className="text-2xl font-black italic font-display uppercase tracking-tight">Hustle Optimization</p>
                   </div>
                   <div className="space-y-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] italic">Base of Operations</p>
                      <p className="text-2xl font-black italic font-display uppercase tracking-tight">Johannesburg, Gauteng</p>
                   </div>
                </div>
             </div>
          </section>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-white p-12 rounded-[3.5rem] text-center space-y-3 border-2 border-white shadow-sm hover:scale-105 transition-all duration-500">
      <h4 className="text-5xl font-black italic font-display text-[#0F766E] tracking-tighter drop-shadow-sm">{value}</h4>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 italic">{label}</p>
    </div>
  );
}
