"use client";
import { useState, useEffect } from "react";
import { contractsHub, walletsHub, transactionsHub, notificationsHub } from "@/lib/supabase-helpers";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";
import { 
  ShieldCheck, 
  Clock, 
  Briefcase, 
  ChevronRight, 
  Star, 
  Loader2, 
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Zap
} from "lucide-react";
import ReviewModal from "@/components/ReviewModal";
import Link from "next/link";
import { toast } from "sonner";

type Contract = Database['public']['Tables']['contracts']['Row'] & {
  profiles: { name: string | null };
};

export default function ContractManager() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  
  // Review Modal State
  const [reviewTarget, setReviewTarget] = useState<{makerId: string, makerName: string, contractId: string} | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadContracts();
    }
  }, [user]);

  async function loadContracts() {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await contractsHub.fetchByEmployer(user.id);
      setContracts(data as Contract[]);
    } catch (err) {
      console.error("Failed to load contracts:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleReleaseFunds = async (contract: Contract) => {
    if (!confirm(`Are you sure you want to release R${contract.price} to ${contract.profiles?.name}?`)) return;
    
    setReleasingId(contract.id);
    try {
      
      // 1. Process Payment (Includes contract update, wallet moves, and transaction logging)
      await transactionsHub.processContractPayment(contract);

      // 2. Update UI
      setContracts(prev => prev.map(c => c.id === contract.id ? { ...c, status: 'completed' } : c));
      
      // 3. Open Review
      setReviewTarget({
        makerId: contract.maker_id,
        makerName: contract.profiles?.name || "Anonymous",
        contractId: contract.id
      });

    } catch (err) {
      console.error("Fund release failed:", err);
      toast.error("Encountered an error during fund release. Please check your connection.");
    } finally {
      setReleasingId(null);
    }
  };

  const handleRequestRevision = async (contract: Contract) => {
    const notes = prompt("What needs to be fixed? Be specific to help the maker deliver the best vibe! 🇿🇦");
    if (!notes) return;

    try {
      await contractsHub.update(contract.id, { status: 'revision_requested' });

      // Notify Maker
      await notificationsHub.insert({
        user_id: contract.maker_id,
        message: `Revision Requested: "${contract.title}". Note: ${notes}`,
        type: 'contract_update'
      });

      setContracts(prev => prev.map(c => c.id === contract.id ? { ...c, status: 'revision_requested' } : c));
      toast.info("Revision request sent! Maker has been notified. 🛠️");
    } catch (err) {
      console.error("Revision request failed:", err);
    }
  };

  const handleOpenDispute = async (contract: Contract) => {
    if (!confirm("Open an official dispute? This will freeze the bag and alert Shapa Admin for mediation. 🛡️")) return;
    
    try {
      await contractsHub.update(contract.id, { status: 'disputed' });

      // Notify both
      const message = `DISPUTE OPENED: Contract "${contract.title}" is now under admin review. Funds frozen.`;
      const type = 'contract_dispute';

      await notificationsHub.insert({ message, type, user_id: contract.maker_id });
      await notificationsHub.insert({ message, type, user_id: user!.id });

      setContracts(prev => prev.map(c => c.id === contract.id ? { ...c, status: 'disputed' } : c));
      toast.info("Dispute opened. A Shapa Admin will contact both parties within 24 hours. ⚖️");
    } catch (err) {
      console.error("Dispute failed:", err);
    }
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 relative z-10 pb-40">
      <div className="font-body">
        <header className="mb-16">
          <div className="flex items-center gap-3 text-[10px] font-black text-[#13EC6A] uppercase tracking-[0.4em] mb-4">
            <DollarSign size={14} /> Financial Operations
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic font-display leading-[0.8]">
            Contract <br/><span className="text-[#13EC6A] drop-shadow-glow">Workspace.</span>
          </h1>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6 glass rounded-[3rem] border border-white/5">
            <Loader2 className="animate-spin text-[#13EC6A]" size={48} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Syncing ledgers...</p>
          </div>
        ) : contracts.length > 0 ? (
          <div className="space-y-8">
            {contracts.map((contract) => (
              <div 
                key={contract.id} 
                className={`glass p-10 rounded-[3rem] border transition-all duration-500 relative overflow-hidden group ${
                  contract.status === 'completed' ? 'border-[#13EC6A]/20 opacity-80' : 'border-white/5 hover:border-white/10'
                }`}
              >
                {/* Status Bar */}
                <div className="absolute top-0 right-0 p-8 flex items-center gap-3">
                   {contract.status === 'completed' ? (
                     <div className="flex items-center gap-2 bg-[#13EC6A]/10 text-[#13EC6A] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#13EC6A]/20 shadow-glow">
                        <CheckCircle2 size={12} /> Bag Released
                     </div>
                   ) : contract.status === 'delivered' ? (
                      <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-500/20 shadow-glow animate-pulse">
                         <Zap size={12} fill="currentColor" /> Ready for Review
                      </div>
                   ) : contract.status === 'revision_requested' ? (
                      <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/20 shadow-glow">
                         <Clock size={12} /> Revision Pending
                      </div>
                   ) : contract.status === 'disputed' ? (
                      <div className="flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 shadow-glow">
                         <AlertCircle size={12} /> In Dispute
                      </div>
                   ) : (
                     <div className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        <Clock size={12} /> Active Escrow
                     </div>
                   )}
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    <div className="md:col-span-8">
                       <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4">Contract ID: {contract.id.slice(0,8)}</p>
                       <h3 className="text-3xl font-black mb-6 italic tracking-tight font-display">{contract.title}</h3>
                       
                       <div className="flex flex-wrap gap-8 items-center mb-10">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 border border-white/5">
                                <ShieldCheck size={20} />
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Master Talent</p>
                                <p className="text-sm font-black italic">{contract.profiles?.name}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 border border-white/5">
                                <Briefcase size={20} />
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Service Fee</p>
                                <p className="text-sm font-black italic">R {contract.price}</p>
                             </div>
                          </div>
                       </div>

                       {contract.status === 'active' && (
                         <div className="p-6 bg-[#13EC6A]/5 rounded-[2rem] border border-[#13EC6A]/20 flex items-start gap-5">
                            <AlertCircle className="text-[#13EC6A] shrink-0" size={20} />
                            <p className="text-xs text-gray-500 font-bold leading-relaxed">
                                Funds are currently held in Shapa Escrow. Once you are satisfied with the work, release the funds below. This action is permanent.
                            </p>
                         </div>
                       )}
                       {contract.status === 'revision_requested' && (
                         <div className="p-6 bg-blue-500/5 rounded-[2rem] border border-blue-500/20 flex items-start gap-5">
                            <Clock className="text-blue-400 shrink-0" size={20} />
                            <p className="text-xs text-gray-400 font-bold leading-relaxed italic">
                                REVISION IN PROGRESS: You requested changes. The maker is working on alignment.
                            </p>
                         </div>
                       )}
                       {contract.status === 'disputed' && (
                         <div className="p-6 bg-red-500/5 rounded-[2rem] border border-red-500/20 flex items-start gap-5 shadow-glow">
                            <AlertCircle className="text-red-500 shrink-0" size={20} />
                            <p className="text-xs text-gray-300 font-bold leading-relaxed">
                                DISPUTE ACTIVE: This contract is frozen. Shapa Mediation is reviewing the case.
                            </p>
                         </div>
                       )}
                    </div>

                     <div className="md:col-span-4 flex flex-col justify-end gap-4">
                       {(contract.status === 'delivered' || contract.status === 'active' || contract.status === 'revision_requested') && (
                         <button 
                           onClick={() => handleReleaseFunds(contract)}
                           disabled={releasingId === contract.id || contract.status === 'revision_requested'}
                           className={`w-full py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-glow hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 ${
                              contract.status === 'delivered' ? 'bg-[#13EC6A] text-[#052210]' : 'glass text-gray-500 opacity-50 cursor-not-allowed'
                           }`}
                         >
                            {releasingId === contract.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                            {releasingId === contract.id ? "Releasing..." : "Release Bag"}
                         </button>
                       )}
                       
                       {contract.status === 'delivered' && (
                         <button 
                           onClick={() => handleRequestRevision(contract)}
                           className="w-full glass text-blue-400 py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] border border-blue-500/20 hover:bg-blue-500/10 transition-all flex items-center justify-center gap-3 italic"
                         >
                            <Clock size={16} /> Request Revision
                         </button>
                       )}

                       {(contract.status === 'delivered' || contract.status === 'active') && (
                         <button 
                           onClick={() => handleOpenDispute(contract)}
                           className="w-full glass text-red-500/40 hover:text-red-500 py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] border border-red-500/5 hover:border-red-500/20 transition-all flex items-center justify-center gap-3 italic"
                         >
                            <AlertCircle size={16} /> Open Dispute
                         </button>
                       )}

                       {contract.status === 'completed' && (
                         <button 
                           onClick={() => setReviewTarget({makerId: contract.maker_id, makerName: contract.profiles?.name || "Anonymous", contractId: contract.id})}
                           className="w-full glass text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                         >
                            <Star size={16} className="text-amber-400" /> Review Maker
                         </button>
                       )}
                       <Link href={`/u/${contract.maker_id}`} className="w-full glass-dark text-gray-500 hover:text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] border border-white/5 text-center transition-all">
                          View Workspace
                       </Link>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center glass rounded-[3.5rem] border border-dashed border-white/10 font-body">
             <Briefcase className="mx-auto text-gray-800 mb-8" size={60} />
             <h3 className="text-4xl font-black mb-4 italic tracking-tighter">No Active Contracts.</h3>
             <p className="text-gray-600 font-bold mb-12 max-w-sm mx-auto">Hire a Maker from the Discovery feed to start a professional contract.</p>
             <Link href="/employer/hub" className="inline-flex items-center gap-3 text-[#13EC6A] font-black border-b-2 border-[#13EC6A] pb-1 uppercase text-xs tracking-widest hover:gap-5 transition-all">
               Browse Talent <ChevronRight size={16} />
             </Link>
          </div>
        )}
      </div>

      {/* Review System Integration */}
      <ReviewModal 
        isOpen={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        makerId={reviewTarget?.makerId || ""}
        reviewerId={user?.id || ""}
        makerName={reviewTarget?.makerName || ""}
        onSuccess={() => {}}
      />
    </div>
  );
}
