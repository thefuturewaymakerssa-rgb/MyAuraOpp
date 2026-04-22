"use client";

import { use, useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Compass, ArrowLeft, Users, CheckCircle } from "lucide-react";
import Link from "next/link";
import { maskPhoneNumbers } from "@/utils/privacy";

export default function LiveSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;
  
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("talent");
  const [userId, setUserId] = useState<string>("");
  const channelRef = useRef<any>(null);
  
  // Real-time synchronization state
  const [activeStep, setActiveStep] = useState(0);
  const [notes, setNotes] = useState("");
  const [participants, setParticipants] = useState<{ id: string, name: string, isOnline: boolean }[]>([]);

  useEffect(() => {
    const supabase = createClient();
    
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, name")
        .eq("id", user.id)
        .single<{ role: string; name: string }>();
        
      if (profile) {
        setRole(profile.role === "employer" ? "employer" : "talent");
      }
      setLoading(false);
    }
    
    init();
    
    const channel = supabase.channel(`live_session:${sessionId}`);
    channelRef.current = channel;
    
    channel
      .on("broadcast", { event: "sync_step" }, (payload) => {
        setActiveStep(payload.payload.step);
      })
      .on("broadcast", { event: "sync_notes" }, (payload) => {
        setNotes(payload.payload.notes);
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const activeUsers: any[] = [];
        for (const id in state) {
           const pres = state[id] as any[];
           if (pres.length > 0) activeUsers.push(pres[0]);
        }
        setParticipants(activeUsers);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
             const { data: p } = await supabase.from("profiles").select("name").eq("id", user.id).single<{ name: string }>();
             await channel.track({ id: user.id, name: p?.name || "User", isOnline: true });
          }
        }
      });
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const handleStepChange = (step: number) => {
    if (role !== "employer") return; // Only boss drives the session
    setActiveStep(step);
    channelRef.current?.send({
      type: "broadcast",
      event: "sync_step",
      payload: { step },
    });
  };

  const handleNotesChange = (text: string) => {
    setNotes(text);
    channelRef.current?.send({
      type: "broadcast",
      event: "sync_notes",
      payload: { notes: text },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
         <Loader2 className="animate-spin text-[#13EC6A]" size={40} />
      </div>
    );
  }

  const steps = ["Vibe Assessment", "Milestone Mapping", "Pricing & Escrow", "Handshake Protocol"];

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col font-body">
      <header className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-6">
           <Link href="/dashboard" className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
              <ArrowLeft size={20} />
           </Link>
           <div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase font-display text-[#13EC6A]">Future Mapping</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 italic">Live Session • ID: {sessionId.slice(0, 8)}</p>
           </div>
        </div>
        
        <div className="flex items-center gap-4">
           {participants.map(p => (
              <div key={p.id} className="relative group flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                 <div className="w-2 h-2 bg-[#13EC6A] rounded-full animate-pulse" />
                 <span className="text-xs font-black uppercase tracking-widest italic">{p.name}</span>
              </div>
           ))}
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-10 grid grid-cols-12 gap-10">
         <div className="col-span-4 space-y-8">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[#0F766E] italic mb-6">Session Stages</h2>
            {steps.map((step, idx) => (
               <button 
                  key={idx}
                  onClick={() => handleStepChange(idx)}
                  disabled={role !== 'employer'}
                  className={`w-full text-left p-6 rounded-3xl border-2 transition-all ${
                     activeStep === idx 
                        ? "bg-[#13EC6A]/10 border-[#13EC6A] text-[#13EC6A]" 
                        : "bg-white/5 border-white/5 text-gray-500 hover:border-white/20"
                  }`}
               >
                  <div className="flex items-center justify-between">
                     <span className="font-black italic uppercase text-lg">{step}</span>
                     {activeStep > idx && <CheckCircle size={20} className="text-[#13EC6A]" />}
                  </div>
               </button>
            ))}
            
            {role === 'talent' && (
               <div className="p-6 bg-[#0F766E]/10 rounded-3xl border border-[#0F766E]/20 text-center mt-10">
                  <Compass size={32} className="mx-auto mb-4 text-[#0F766E]" />
                  <p className="text-xs font-black uppercase tracking-widest text-[#0F766E] italic">Boss is driving the session.</p>
               </div>
            )}
         </div>
         
         <div className="col-span-8">
            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 h-[600px] flex flex-col shadow-2xl">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">Shared Sandbox</h3>
                  <span className="bg-[#13EC6A]/20 text-[#13EC6A] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic animate-pulse">Sync Active</span>
               </div>
               
               <textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder={role === 'employer' ? "Start typing the project requirements... Talents can see this live." : "Both parties can type here..."}
                  className="flex-1 w-full bg-black/20 rounded-[2rem] border-2 border-white/5 hover:border-white/10 focus:border-[#13EC6A]/50 outline-none p-8 font-bold text-gray-300 italic resize-none text-lg leading-relaxed shadow-inner"
               />
               
               <div className="mt-8 flex justify-end">
                  <button className="bg-[#13EC6A] text-[#0F172A] px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.4em] italic shadow-xl shadow-[#13EC6A]/20 hover:scale-105 active:scale-95 transition-all">
                     {role === 'employer' ? "Propose Contract" : "Accept Terms"}
                  </button>
               </div>
            </div>
         </div>
      </main>
    </div>
  );
}
