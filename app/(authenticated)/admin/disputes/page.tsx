"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { contractsHub, notificationsHub, walletsHub, transactionsHub } from "@/lib/supabase-helpers";
import { 
  Zap, 
  ShieldAlert, 
  Scale, 
  CheckCircle2, 
  X,
  Shield,
  XCircle,
  MessageSquare, 
  ArrowLeft,
  Loader2,
  DollarSign,
  User,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  
  // Chat Surveillance State
  const [showChat, setShowChat] = useState(false);
  const [activeChatMessages, setActiveChatMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [activeParticipants, setActiveParticipants] = useState<{maker: string, employer: string} | null>(null);

  useEffect(() => {
    fetchDisputes();
  }, []);

  async function fetchDisputes() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('contracts')
        .select('*, maker:profiles!maker_id(name), employer:profiles!employer_id(name)')
        .eq('status', 'disputed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDisputes(data || []);
    } catch (err) {
      console.error("Error fetching disputes:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleResolve = async (contract: any, decision: 'maker' | 'employer') => {
    const reason = prompt(`Reason for resolving in favor of the ${decision}:`);
    if (!reason) return;

    setResolvingId(contract.id);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Authentication error. Please log in again.");
        return;
      }

      // Session is used only for the access_token (safe after getUser() validation)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired. Please log in again.");
        return;
      }

      const res = await fetch("/api/admin/disputes/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          contractId: contract.id,
          decision,
          reason
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to resolve dispute");
      }

      toast.info(`Dispute resolved in favor of the ${decision}. All parties notified. ⚖️`);
      setDisputes(prev => prev.filter(d => d.id !== contract.id));
    } catch (err: any) {
      console.error("Resolution failed:", err);
      toast.error(`Error resolving dispute: ${err.message}`);
    } finally {
      setResolvingId(null);
    }
  };

  const fetchChatLog = async (makerId: string, employerId: string) => {
    setChatLoading(true);
    setShowChat(true);
    setActiveParticipants({ maker: makerId, employer: employerId });
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Authentication error. Please log in again.");
        return;
      }

      // Session is used only for the access_token (safe after getUser() validation)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired. Please log in again.");
        return;
      }

      const res = await fetch("/api/admin/disputes/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ user1Id: makerId, user2Id: employerId })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActiveChatMessages(data.messages || []);
    } catch (err: any) {
      console.error("Chat surveillance failed:", err);
      toast.error("Failed to load evidence log.");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D110F] text-white p-8 lg:p-16 font-body">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Navigation */}
        <Link 
          href="/admin/dashboard" 
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-[#13EC6A] transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to command center
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-4">
           <div className="flex items-center gap-3 text-[10px] font-black text-red-500 uppercase tracking-[0.4em] italic mb-2">
             <ShieldAlert size={14} /> Critical Mediation
           </div>
           <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic font-display leading-[0.8] uppercase">
             Dispute <br/><span className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">Court.</span>
           </h1>
           <p className="text-gray-500 font-bold mt-4 max-w-lg italic">
             Review frozen contracts and release/refund bags based on proof of work and communication history.
           </p>
        </div>

        {/* Disputes List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 glass rounded-[3rem] border border-white/5">
            <Loader2 className="animate-spin text-red-500" size={48} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Convening the court...</p>
          </div>
        ) : disputes.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">
            {disputes.map((dispute) => (
              <div 
                key={dispute.id} 
                className="glass-dark rounded-[3.5rem] border border-red-500/10 p-12 relative overflow-hidden group"
              >
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
                   {/* Info Column */}
                   <div className="lg:col-span-8 space-y-8">
                      <div>
                        <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] mb-2">Case ID: {dispute.id.slice(0,12)}</p>
                        <h3 className="text-3xl font-black italic tracking-tight font-display text-white group-hover:text-red-500 transition-colors uppercase">{dispute.title}</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 border border-white/5">
                               <User size={20} />
                            </div>
                            <div>
                               <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Employer</p>
                               <p className="text-sm font-black italic">{dispute.employer?.name || 'Anonymous'}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 border border-white/5">
                               <Zap size={20} className="text-[#13EC6A]" />
                            </div>
                            <div>
                               <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Maker</p>
                               <p className="text-sm font-black italic">{dispute.maker?.name || 'Anonymous'}</p>
                            </div>
                         </div>
                      </div>

                      <div className="p-8 bg-white/[0.02] rounded-3xl border border-white/5">
                         <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4 italic">Bounty Description</p>
                         <p className="text-sm text-gray-400 leading-relaxed italic">&quot;{dispute.description || "No description provided."}&quot;</p>
                      </div>

                      <div className="flex items-center gap-8">
                         <div className="flex items-center gap-3">
                            <DollarSign size={16} className="text-amber-500" />
                            <span className="text-2xl font-black italic tracking-tighter">R {dispute.price}</span>
                         </div>
                         <Link 
                           href={`/u/${dispute.maker_id}`} 
                           target="_blank"
                           className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-white transition-all uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl"
                         >
                            <ExternalLink size={12} /> Maker Profile
                         </Link>
                      </div>
                   </div>

                   {/* Actions Column */}
                   <div className="lg:col-span-4 flex flex-col justify-center gap-4">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] text-center mb-4 italic">Mediation Verdict</p>
                      
                      <button 
                         onClick={() => handleResolve(dispute, 'maker')}
                         disabled={!!resolvingId}
                         className="w-full bg-[#13EC6A] text-[#052210] py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-glow hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 italic"
                      >
                         {resolvingId === dispute.id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                         Resolve for Maker
                      </button>

                      <button 
                         onClick={() => handleResolve(dispute, 'employer')}
                         disabled={!!resolvingId}
                         className="w-full glass text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all flex items-center justify-center gap-3 italic text-center"
                      >
                         {resolvingId === dispute.id ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                         Resolve for Employer
                      </button>

                      <button 
                         onClick={() => fetchChatLog(dispute.maker_id, dispute.employer_id)}
                         className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 italic mt-2 border border-white/5"
                      >
                         <MessageSquare size={14} /> View Evidence Log
                      </button>

                      <div className="mt-4 p-4 border border-white/5 rounded-2xl bg-white/[0.01]">
                         <p className="text-[8px] font-bold text-gray-600 leading-relaxed text-center italic">
                           Note: All resolutions are final and will trigger automatic financial adjustments across wallets.
                         </p>
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 gap-6 glass rounded-[3rem] border border-white/5">
             <div className="w-20 h-20 rounded-full bg-[#13EC6A]/10 flex items-center justify-center text-[#13EC6A]">
                <Scale size={40} />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 italic">No Active Disputes. The grid is peaceful.</p>
          </div>
        )}

      </div>

      {/* Chat Surveillance Modal */}
      {showChat && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-300">
           <div className="max-w-4xl w-full bg-[#0D110F] rounded-[4rem] border border-red-500/20 shadow-[0_0_100px_rgba(239,68,68,0.1)] overflow-hidden flex flex-col h-[85vh]">
              
              {/* Header */}
              <div className="p-10 border-b border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                       <Shield size={24} />
                    </div>
                    <div>
                       <div className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-widest italic">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                          Secure Evidence Log
                       </div>
                       <h2 className="text-3xl font-black italic tracking-tighter uppercase font-display">Chat Surveillance.</h2>
                    </div>
                 </div>
                 <button 
                   onClick={() => setShowChat(false)}
                   className="w-12 h-12 rounded-full hover:bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all hover:rotate-90"
                 >
                    <X size={20} />
                 </button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-10 space-y-6">
                 {chatLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-600">
                       <Loader2 className="animate-spin" size={32} />
                       <p className="text-[10px] font-black uppercase tracking-widest italic">Bypassing RLS... Decrypting Comms...</p>
                    </div>
                 ) : activeChatMessages.length > 0 ? (
                    activeChatMessages.map((m: any) => (
                       <div key={m.id} className={`flex ${m.sender_id === activeParticipants?.maker ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] space-y-2`}>
                             <div className={`text-[8px] font-black uppercase tracking-widest mb-1 italic ${m.sender_id === activeParticipants?.maker ? "text-[#13EC6A] text-right" : "text-gray-500"}`}>
                                {m.sender_id === activeParticipants?.maker ? "Maker (Talent)" : "Employer"}
                             </div>
                             <div className={`p-6 rounded-[2rem] text-sm font-bold border ${
                                m.sender_id === activeParticipants?.maker 
                                  ? "bg-[#13EC6A]/5 border-[#13EC6A]/20 text-[#13EC6A] rounded-tr-sm" 
                                  : "bg-white/5 border-white/5 text-gray-300 rounded-tl-sm"
                             }`}>
                                {m.text}
                             </div>
                             <div className={`text-[8px] font-black uppercase tracking-widest text-gray-600 italic ${m.sender_id === activeParticipants?.maker ? "text-right" : "text-left"}`}>
                                {new Date(m.created_at).toLocaleString()}
                             </div>
                          </div>
                       </div>
                    ))
                 ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-600">
                       <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                          <MessageSquare size={24} />
                       </div>
                       <p className="text-[10px] font-black uppercase tracking-widest italic">No messages found between these parties.</p>
                    </div>
                 )}
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-white/5 bg-white/[0.02]">
                 <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest text-center italic leading-loose">
                    ADMIN NOTICE: YOU ARE VIEWING PRIVATE COMMUNICATIONS FOR LEGAL AND SAFETY AUDIT PURPOSES. <br/>
                    ALL SURVEILLANCE ACTIONS ARE LOGGED AND AUDITED.
                 </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

