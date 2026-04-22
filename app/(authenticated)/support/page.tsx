"use client";

import { useState } from "react";
import { ShieldAlert, LifeBuoy, Send, MessageSquare, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SupportCenter() {
  const router = useRouter();
  const [ticketType, setTicketType] = useState<"general" | "dispute" | "bug">("general");
  const [description, setDescription] = useState("");
  const [contractId, setContractId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    // Simulate API call to ticketing system
    await new Promise(r => setTimeout(r, 1500));
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0D110F] flex items-center justify-center p-4">
        <div className="glass p-12 rounded-[3rem] border border-[#13EC6A]/30 text-center max-w-lg w-full animate-in zoom-in duration-500">
           <div className="w-24 h-24 bg-[#13EC6A]/10 text-[#13EC6A] rounded-full flex items-center justify-center mx-auto mb-8 shadow-glow border border-[#13EC6A]/30">
              <CheckCircle2 size={48} />
           </div>
           <h2 className="text-4xl font-black italic tracking-tighter uppercase font-display mb-4">Ticket Logged.</h2>
           <p className="text-gray-400 font-bold mb-8 leading-relaxed">
             Our Trust & Safety team in Johannesburg has received your report. We aim to respond within 24 hours.
           </p>
           {ticketType === "dispute" && (
             <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center justify-center gap-2">
                   <AlertTriangle size={14} /> Escrow Funds Frozen
                </p>
             </div>
           )}
           <button 
             onClick={() => router.push("/dashboard")}
             className="w-full py-5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-[#13EC6A] transition-colors shadow-premium"
           >
             Return to Dashboard
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D110F] text-white font-body selection:bg-[#13EC6A] selection:text-black">
      {/* Decorative Blur */}
      <div className="fixed top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />

      <div className="max-w-4xl mx-auto p-4 md:p-10 pt-20 relative z-10">
         
         <div className="text-center mb-16">
            <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
               <LifeBuoy size={40} />
            </div>
            <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter font-display uppercase">Support <span className="text-indigo-400">Center.</span></h1>
            <p className="text-gray-400 font-bold mt-4 max-w-lg mx-auto uppercase tracking-widest text-[10px] leading-relaxed">
               We&apos;re here to protect the hustle. Open a ticket for general issues or dispute an active WayMakers Escrow contract.
            </p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Quick Contact Info */}
            <div className="col-span-1 space-y-6">
               <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">WhatsApp Support</h3>
                    <p className="font-bold">082 123 4567</p>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Email</h3>
                    <p className="font-bold">hustle@futurewaymakers.co.za</p>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Operating Hours</h3>
                    <p className="font-bold">Mon-Fri: 8am - 6pm (SAST)</p>
                  </div>
               </div>

               <div className="bg-amber-500/10 border border-amber-500/20 p-8 rounded-[2.5rem]">
                  <ShieldAlert className="text-amber-500 mb-4" size={28} />
                  <h3 className="text-lg font-black italic uppercase tracking-tighter text-amber-500 mb-2">Dispute Policy</h3>
                  <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 leading-relaxed">
                     If you file a dispute on an active contract, all funds inside the escrow are immediately frozen pending manual review by our mediators.
                  </p>
               </div>
            </div>

            {/* Ticket Form */}
            <div className="col-span-2 glass p-8 md:p-10 rounded-[3rem] border border-white/5">
               <form onSubmit={handleSubmit} className="space-y-8">
                  
                  {/* Category Selector */}
                  <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-4">How can we help?</label>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button 
                          type="button"
                          onClick={() => setTicketType("general")}
                          className={`p-4 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest text-center ${ticketType === "general" ? "bg-indigo-500/20 border-indigo-500 text-indigo-400" : "bg-white/5 border-white/10 text-gray-500 hover:text-white"}`}
                        >
                          General Help
                        </button>
                        <button 
                          type="button"
                          onClick={() => setTicketType("dispute")}
                          className={`p-4 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest text-center ${ticketType === "dispute" ? "bg-amber-500/20 border-amber-500 text-amber-500" : "bg-white/5 border-white/10 text-gray-500 hover:text-white"}`}
                        >
                          File Dispute
                        </button>
                        <button 
                          type="button"
                          onClick={() => setTicketType("bug")}
                          className={`p-4 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest text-center ${ticketType === "bug" ? "bg-rose-500/20 border-rose-500 text-rose-400" : "bg-white/5 border-white/10 text-gray-500 hover:text-white"}`}
                        >
                          Report a Bug
                        </button>
                     </div>
                  </div>

                  {ticketType === "dispute" && (
                    <div className="animate-in fade-in slide-in-from-top-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-amber-500 block mb-2">Contract ID (Required)</label>
                       <input 
                         type="text" 
                         required
                         placeholder="e.g. C-102933"
                         className="w-full bg-black/40 border border-amber-500/30 rounded-2xl p-4 text-sm font-mono focus:border-amber-500 transition-colors"
                         value={contractId}
                         onChange={(e) => setContractId(e.target.value)}
                       />
                       <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mt-2">Find this on your Gig Board or in the active workspace.</p>
                    </div>
                  )}

                  <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-2">Details</label>
                     <textarea 
                       required
                       placeholder="Please explain the situation thoroughly..."
                       className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 h-40 text-sm focus:border-indigo-500 transition-colors resize-none"
                       value={description}
                       onChange={(e) => setDescription(e.target.value)}
                     />
                  </div>

                  <button 
                    type="submit"
                    disabled={loading || !description.trim() || (ticketType === "dispute" && !contractId.trim())}
                    className="w-full py-6 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-indigo-500 hover:text-white transition-all shadow-premium disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black flex items-center justify-center gap-3"
                  >
                     {loading ? "SUBMITTING TICKET..." : <><Send size={16} /> SUBMIT {ticketType === "dispute" ? "DISPUTE" : "TICKET"}</>}
                  </button>

               </form>
            </div>

         </div>
      </div>
    </div>
  );
}
