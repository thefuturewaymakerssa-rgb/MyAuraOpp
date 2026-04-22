"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { 
  ShieldCheck, 
  Clock, 
  Briefcase, 
  CheckCircle2, 
  DollarSign, 
  AlertCircle,
  Loader2,
  MessageSquare,
  Zap,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { contractsHub, notificationsHub } from "@/lib/supabase-helpers";
import { Database } from "@/lib/database.types";
import { toast } from "sonner";

type Contract = Database['public']['Tables']['contracts']['Row'] & {
  profiles?: { name: string | null };
  makers?: { name: string | null };
};

interface TalentContractsClientProps {
  initialContracts: Contract[];
  userId: string;
}

export default function TalentContractsClient({ initialContracts, userId }: TalentContractsClientProps) {
  const [contracts, setContracts] = useState(initialContracts);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  const handleMarkComplete = async (contractId: string) => {
    if (!confirm("Confirming you have delivered the work as per the contract? This will notify the employer to release the bag. 🇿🇦")) return;
    
    const previousStatus = contracts.find(c => c.id === contractId)?.status;
    const isResubmission = previousStatus === 'revision_requested';

    setProcessingId(contractId);
    try {
      await contractsHub.update(contractId, { status: 'delivered' });

      // Notify employer
      const contracts_data = await contractsHub.fetchByMaker(userId);
      const contract = (contracts_data as Contract[]).find(c => c.id === contractId);

      if (contract) {
        await notificationsHub.insert({
          user_id: contract.employer_id,
          message: isResubmission 
            ? `Revision Resubmitted: "${contract.title}" has been updated by ${contract.profiles?.name}. Please review the changes! 🇿🇦`
            : `Hustle Delivered: "${contract.title}" is ready for review by ${contract.profiles?.name}. Review and release the bag! 🇿🇦`,
          type: 'contract_update',
        });
      }

      // Update local state
      setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'delivered' } : c));
      toast.success(isResubmission ? "Revision resubmitted! Employer has been notified. 🛠️" : "Hustle delivered! Employer has been notified. 🚀");
    } catch (err) {
      console.error("Error marking complete:", err);
      toast.error("Failed to update status: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 relative z-10 pb-40">
      <div className="font-body">
        
        {/* Header Section */}
        <header className="mb-16">
          <div className="flex items-center gap-3 text-[10px] font-black text-[#13EC6A] uppercase tracking-[0.4em] mb-4 italic">
            <Zap size={14} fill="currentColor" /> Live Hustle Stream
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic font-display leading-[0.8] uppercase">
            Active <br/><span className="text-[#13EC6A] drop-shadow-glow">Contracts.</span>
          </h1>
          <p className="text-gray-500 font-bold mt-8 max-w-lg italic">
            Manage your funded work, chat with employers, and mark deliverable completions to release your bag.
          </p>
        </header>

        {/* Contract List */}
        {contracts.length > 0 ? (
          <div className="space-y-8">
            {contracts.map((contract) => (
              <div 
                key={contract.id}
                className={`glass p-10 rounded-[3.5rem] border transition-all duration-700 relative overflow-hidden group/card ${
                  contract.status === 'completed' ? 'border-[#13EC6A]/20 bg-[#13EC6A]/[0.02]' : 'border-white/5 hover:border-white/10'
                }`}
              >
                {/* Background Glow */}
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] transition-opacity duration-700 ${
                  contract.status === 'completed' ? 'bg-[#13EC6A]/10 opacity-100' : 'bg-indigo-500/5 opacity-0 group-hover/card:opacity-100'
                }`} />

                {/* Status Badge */}
                <div className="absolute top-10 right-10 z-10">
                   {contract.status === 'completed' ? (
                     <div className="flex items-center gap-2 bg-[#13EC6A]/10 text-[#13EC6A] px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-[#13EC6A]/20 shadow-glow italic">
                        <CheckCircle2 size={14} /> Bag Secured
                     </div>
                   ) : contract.status === 'delivered' ? (
                      <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-amber-500/20 shadow-glow italic">
                         <Zap size={14} fill="currentColor" /> Under Review
                      </div>
                   ) : contract.status === 'revision_requested' ? (
                      <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-500/20 shadow-glow italic">
                         <Clock size={14} /> Revision Requested
                      </div>
                   ) : contract.status === 'disputed' ? (
                      <div className="flex items-center gap-2 bg-red-500/10 text-red-500 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 shadow-glow italic">
                         <AlertCircle size={14} /> In Dispute
                      </div>
                   ) : (
                     <div className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 shadow-glow italic">
                        <Clock size={14} /> Active Escrow
                     </div>
                   )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 relative z-10">
                  <div className="md:col-span-8 space-y-8">
                    <div>
                      <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] mb-4 italic">Protocol ID: {contract.id.slice(0, 10).toUpperCase()}</p>
                      <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter font-display uppercase">{contract.title}</h3>
                    </div>

                    <div className="flex flex-wrap gap-10">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-400">
                          <Briefcase size={24} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest italic">Employer</p>
                          <p className="font-black italic text-lg">{contract.profiles?.name || "Premium Partner"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-[#13EC6A] shadow-glow">
                          <DollarSign size={24} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest italic">Contract Value</p>
                          <p className="font-black italic text-lg text-[#13EC6A]">R {contract.price}.00</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm font-medium leading-relaxed italic border-t border-white/5 pt-8">
                       &quot;{contract.description || "No specific brief provided. Align with your standard professional workflow."}&quot;
                    </p>

                    {contract.status === 'revision_requested' && (
                      <div className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 flex items-start gap-5">
                        <AlertCircle className="text-blue-400 shrink-0" size={20} />
                        <p className="text-[11px] text-gray-500 font-bold leading-relaxed italic">
                           REVISION REQUESTED: The employer has requested changes. Check your messages for details and resubmit once alignment is reached. 🇿🇦
                        </p>
                      </div>
                    )}

                    {contract.status === 'disputed' && (
                      <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/10 flex items-start gap-5 shadow-glow">
                        <AlertCircle className="text-red-500 shrink-0" size={20} />
                        <p className="text-[11px] text-gray-300 font-bold leading-relaxed italic">
                           DISPUTE OPEN: The bag is frozen due to a dispute. A WayMakers Admin is reviewing the conversation and deliverables.
                        </p>
                      </div>
                    )}

                    {contract.status === 'active' && (
                      <div className="p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 flex items-start gap-5">
                        <ShieldCheck className="text-indigo-400 shrink-0" size={20} />
                        <p className="text-[11px] text-gray-500 font-bold leading-relaxed italic">
                           WAYMAKERS ESCROW ACTIVE: Funds for this contract are secured. Approval of work will release them to your balance instantly.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-4 flex flex-col justify-end gap-5">
                    {(contract.status === 'active' || contract.status === 'revision_requested') ? (
                      <button 
                        onClick={() => handleMarkComplete(contract.id)}
                        disabled={processingId === contract.id}
                        className="w-full bg-white text-black py-7 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-premium hover:bg-[#13EC6A] hover:scale-105 transition-all flex items-center justify-center gap-4 italic border-b-8 border-gray-200"
                      >
                         {processingId === contract.id ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                         {processingId === contract.id ? "UPDATING..." : contract.status === 'revision_requested' ? "RESUBMIT WORK" : "DELIVER WORK"}
                      </button>
                    ) : contract.status === 'delivered' ? (
                      <div className="w-full bg-amber-500/10 text-amber-500 py-7 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] border border-amber-500/20 flex items-center justify-center gap-4 italic pointer-events-none">
                         <Clock size={20} /> PENDING REVIEW
                      </div>
                    ) : contract.status === 'disputed' ? (
                      <div className="w-full bg-red-500/10 text-red-500 py-7 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] border border-red-500/20 flex items-center justify-center gap-4 italic pointer-events-none">
                         <AlertCircle size={20} /> FROZEN
                      </div>
                    ) : (
                      <div className="w-full bg-[#13EC6A]/10 text-[#13EC6A] py-7 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] border border-[#13EC6A]/20 flex items-center justify-center gap-4 italic pointer-events-none">
                         <Zap size={20} fill="currentColor" /> TRANSFERRED
                      </div>
                    )}
                    
                    <button 
                      onClick={() => router.push(`/messages?employer_id=${contract.employer_id}`)}
                      className="w-full glass py-7 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] border border-white/10 hover:border-white/30 transition-all flex items-center justify-center gap-4 italic"
                    >
                       <MessageSquare size={20} /> CONTACT PARTNER
                    </button>
                    
                    <button 
                      onClick={() => router.push(`/u/${userId}`)}
                      className="w-full glass-dark text-gray-500 hover:text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] border border-white/5 transition-all italic"
                    >
                       PREVIEW PUBLIC VIBE
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-40 text-center glass rounded-[4rem] border border-dashed border-white/10">
             <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-gray-700">
                <Briefcase size={64} />
             </div>
             <h3 className="text-5xl font-black mb-6 italic tracking-tighter uppercase font-display">No Active Bags.</h3>
             <p className="text-gray-500 font-bold mb-14 max-w-sm mx-auto leading-relaxed italic pr-4 pl-4">Your contract stream is currently quiet. Update your proofs to get noticed by employers and secure your first fund.</p>
             <Link 
               href="/talent/dashboard" 
               className="inline-flex items-center gap-4 text-[#13EC6A] font-black border-b-4 border-[#13EC6A] pb-2 uppercase text-xs tracking-[0.4em] hover:gap-8 transition-all italic"
             >
                BACK TO COMMAND <ArrowRight size={20} />
             </Link>
          </div>
        )}
      </div>
    </div>
  );
}
