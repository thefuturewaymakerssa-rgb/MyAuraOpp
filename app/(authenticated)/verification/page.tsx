"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, User, Video, Landmark, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Database } from "@/lib/database.types";

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function VerificationCenterPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [proofsCount, setProofsCount] = useState(0);

  useEffect(() => {
    async function fetchVerificationData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      const { count: proofCount, error: proofErr } = await supabase
        .from("proofs")
        .select("*", { count: 'exact', head: true })
        .eq("maker_id", user.id);

      if (!profileErr && profileData) setProfile(profileData);
      if (!proofErr && proofCount !== null) setProofsCount(proofCount);

      setLoading(false);
    }
    fetchVerificationData();
  }, []);

  const handleAction = (actionTitle: string) => {
    if (actionTitle === "Identity Check") {
      toast.info("ID Upload flow will open here. (Coming soon)");
    } else if (actionTitle === "Bank Sync") {
      toast.info("PayFast payout registration protocol initiated.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#0D110F]">
        <Loader2 className="animate-spin text-[#13EC6A]" size={40} />
      </div>
    );
  }

  // Calculate dynamic trust score (out of 1000 max for UI)
  let score = 250; // Base score
  if (profile?.name && profile?.bio) score += 150;
  if (profile?.identity_verified) score += 300;
  if (proofsCount > 0) score += Math.min(proofsCount * 100, 300);

  const levelName = score >= 800 ? "Gold Agent" : score >= 500 ? "Silver Agent" : "Bronze Agent";
  const levelChar = levelName.charAt(0);
  const nextTarget = score >= 800 ? 1000 : score >= 500 ? 800 : 500;
  const progressPercent = Math.min(100, Math.floor((score / nextTarget) * 100));

  const steps = [
    { 
      title: "Identity Check", 
      status: profile?.identity_verified ? "completed" : "pending", 
      icon: User, 
      desc: profile?.identity_verified ? "ID securely verified" : "ID Upload + Manual Review required" 
    },
    { 
      title: "Skill Validation", 
      status: proofsCount >= 1 ? "completed" : "pending", 
      icon: Video, 
      desc: proofsCount > 0 ? `${proofsCount} Proof Clip(s) live` : "Upload your first Vibe CV clip" 
    },
    { 
      title: "Bank Sync", 
      status: "pending", // Future wiring
      icon: Landmark, 
      desc: "Connect your bank for Gig payouts" 
    },
    { 
      title: "Pro Badge", 
      status: "locked", // Future wiring
      icon: ShieldCheck, 
      desc: "Complete 10 Gigs to unlock" 
    },
  ];

  return (
    <div className="min-h-screen bg-[#0D110F] text-white font-body p-8 lg:p-20 relative overflow-hidden">
      <div className="max-w-5xl mx-auto space-y-16 relative z-10">
        <header className="space-y-6">
           <h1 className="text-7xl font-black italic tracking-tighter leading-[0.85] font-display uppercase text-glow">
             Verification <br/><span className="text-[#13EC6A] drop-shadow-glow">Center.</span>
           </h1>
           <p className="text-gray-500 font-bold uppercase tracking-[0.4em] text-[10px] max-w-xl leading-loose">
              Build your WayMakers Trust Score. Verified agents get 5x more gig requests.
           </p>
        </header>

        {/* Level Banner */}
        <section className="glass p-10 lg:p-12 rounded-[3.5rem] border border-white/5 relative overflow-hidden flex flex-col md:flex-row items-center gap-12 group">
           <div className="absolute top-0 right-0 w-80 h-80 bg-[#13EC6A]/5 rounded-full blur-[80px] pointer-events-none" />
           <div className="w-24 h-24 rounded-3xl bg-[#13EC6A] flex items-center justify-center text-[#052210] font-black italic font-display text-4xl shadow-glow scale-100 group-hover:scale-110 transition-transform">
              {levelChar}
           </div>
           <div className="flex-1 text-center md:text-left space-y-2">
              <h3 className="text-3xl font-black italic font-display uppercase tracking-tight">Level: {levelName}.</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#13EC6A] italic">
                Score: {score} / 1000 — Next Target: {nextTarget}
              </p>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mt-6">
                 <div className="h-full bg-[#13EC6A] shadow-glow transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
              </div>
           </div>
        </section>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((s) => (
            <div key={s.title} className="glass p-10 rounded-[3rem] border border-white/5 group hover:border-white/10 transition-all relative overflow-hidden flex flex-col">
               <div className="flex justify-between items-start mb-10 relative z-10 flex-1">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-b-4 border-black/10 ${
                    s.status === 'completed' ? "bg-[#13EC6A]/10 text-[#13EC6A]" : s.status === 'pending' ? "bg-indigo-500/10 text-indigo-400" : "bg-white/5 text-gray-700"
                  }`}>
                    <s.icon size={28} />
                  </div>
                  {s.status === 'completed' && <CheckCircle2 size={24} className="text-[#13EC6A] drop-shadow-glow" />}
               </div>
               <div className="relative z-10">
                  <h4 className="text-2xl font-black italic font-display uppercase tracking-tight mb-2">{s.title}</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">{s.desc}</p>
               </div>
               {s.status === 'pending' && (
                 <button 
                  onClick={() => handleAction(s.title)}
                  className="mt-8 w-full py-4 glass rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#13EC6A] hover:bg-[#13EC6A] hover:text-[#052210] transition-all"
                 >
                    Complete Now &rarr;
                 </button>
               )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
