"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { Briefcase, Lock, CheckCircle2, ShieldAlert, Star, DollarSign, Clock, FileText, Send, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitReview } from "@/lib/actions/reviews";
import { toast } from "sonner";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default function ContractWorkspace({ params }: Props) {
  const resolvedParams = use(params);
  const contractId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [contractNotFound, setContractNotFound] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<"maker" | "employer">("maker");
  const [contract, setContract] = useState<any>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewNote, setReviewNote] = useState("");

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      
      setSessionUser(user);
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if ((profile as any)?.role === "employer") setUserRole("employer");
      
      // Fetch Real Contract Data
      try {
        const { data: contractData, error } = await (supabase
          .from('contracts')
          .select('*')
          .eq('id', contractId)
          .single() as any);

        if (error && error.code === 'PGRST116') {
          // Not found
          setContractNotFound(true);
        } else if (error) {
          throw error;
        } else if (contractData) {
          setContract(contractData);
        } else {
          setContractNotFound(true);
        }
      } catch (err: any) {
        console.error('[ContractWorkspace] Load error:', err.message);
        setContractNotFound(true);
      }

      setLoading(false);
    }
    init();
  }, [router, contractId]);

  const handleReleaseFunds = async () => {
    if(!confirm("Are you sure you want to release Escrow funds? This is permanent and indicates you are satisfied with the operational outcome.")) return;
    
    setIsProcessing(true);
    const supabase = createClient();
    
    try {
       const { error } = await (supabase
         .from('contracts') as any)
         .update({ status: 'completed' })
         .eq('id', contractId);
       
       if (error) throw error;
       setContract((prev: any) => ({ ...prev, status: "completed" }));
       toast.info("Funds released to Talent. Escrow Closed. 🇿🇦");
    } catch (err: any) {
       toast.error("Failed: " + err.message);
    } finally {
       setIsProcessing(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewNote.trim()) { toast.info("Please write a quick comment."); return; }
    
    setIsProcessing(true);
    try {
       await submitReview({
          maker_id: contract.maker_id,
          reviewer_id: sessionUser.id,
          rating: reviewScore,
          comment: reviewNote
       });
       setContract((prev: any) => ({ ...prev, review_submitted: true }));
       toast.info("Review synced to Identity Portfolio.");
    } catch (err: any) {
       toast.error("Review Error: " + err.message);
    } finally {
       setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center text-[#0F766E] font-black italic tracking-widest text-xl">
        INITIALIZING WORKSPACE...
      </div>
    );
  }

  if (contractNotFound || !contract) {
    return (
      <div className="min-h-screen bg-[#F0FDFA] flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 rounded-[2.5rem] bg-red-50 flex items-center justify-center text-red-400 mx-auto mb-8 border-2 border-red-100">
          <ShieldAlert size={48} />
        </div>
        <h1 className="text-5xl font-black italic tracking-tighter font-display uppercase text-[#0F172A] mb-4">Contract Not Found.</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 italic mb-10">This workspace does not exist or you do not have access.</p>
        <Link href="/dashboard" className="px-10 py-5 bg-[#0F766E] text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest italic shadow-xl shadow-[#0F766E]/20 hover:scale-105 transition-all">
          Return to Dashboard
        </Link>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#F0FDFA] text-[#0F172A] font-sans selection:bg-[#0F766E]/20 p-6 sm:p-12 lg:p-24 pb-40 relative overflow-hidden">
       
       <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#0F766E]/5 rounded-full blur-[120px] pointer-events-none -z-10" />

       <div className="max-w-6xl mx-auto space-y-16 sm:space-y-24 relative z-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-[#E2E8F0] pb-12 gap-8">
             <div className="flex-1">
                <p className="text-[9px] sm:text-[10px] font-black tracking-[0.4em] uppercase text-[#0F766E] mb-6 italic bg-white shadow-sm px-6 py-2 rounded-full border border-[#E2E8F0] inline-block">SECURE ESCROW PROTOCOL</p>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black italic tracking-tighter uppercase font-display leading-[0.85] text-[#0F172A]">
                   {contract.title}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mt-8">
                  <div className="flex items-center gap-2 text-gray-500 font-bold uppercase tracking-[0.2em] text-[9px] sm:text-[10px] italic bg-white px-4 py-2 rounded-lg border border-gray-200">
                    <span className="w-5 h-5 rounded-md bg-gray-50 flex items-center justify-center text-[#0F766E] border border-gray-100"><User size={12} /></span>
                    PARTNER: {userRole === "employer" ? contract.maker_name : contract.employer_name}
                  </div>
                  <div className="hidden sm:block w-px h-6 bg-gray-300" />
                  <div className="flex items-center gap-2 text-gray-500 font-bold uppercase tracking-[0.2em] text-[9px] sm:text-[10px] italic bg-white px-4 py-2 rounded-lg border border-gray-200">
                    <span className="w-5 h-5 rounded-md bg-gray-50 flex items-center justify-center text-indigo-500 border border-gray-100"><Clock size={12} /></span>
                    DUE: {contract.due_date}
                  </div>
                </div>
             </div>
             
             <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
                <div className={`w-full md:w-auto px-8 py-4 sm:px-10 sm:py-5 rounded-[2rem] text-[9px] sm:text-[10px] uppercase font-black tracking-[0.3em] border-2 italic shadow-sm text-center ${
                  contract.status === "active" ? "bg-amber-50 text-amber-600 border-amber-200" :
                  contract.status === "completed" ? "bg-[#F0FDFA] text-[#0F766E] border-[#0F766E]/20" :
                  "bg-red-50 text-red-500 border-red-200"
                }`}>
                  {contract.status === "active" ? "FUNDS LOCKED IN ESCROW" : contract.status.toUpperCase()}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
             
             {/* Left Col - Details & Actions */}
             <div className="lg:col-span-8 space-y-10">
                
                {/* Status Banners */}
                {contract.status === "completed" && !contract.review_submitted && (
                   <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-200 shadow-sm flex flex-col md:flex-row items-center gap-8 animate-in zoom-in duration-700">
                      <div className="w-20 h-20 rounded-[2rem] bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-100 shadow-inner">
                         <Star size={36} className="animate-pulse" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                         <h3 className="text-3xl font-black italic uppercase tracking-tighter text-[#0F172A] font-display">Mission Complete.</h3>
                         <p className="text-[9px] sm:text-[10px] font-black text-gray-500 mt-2 tracking-[0.2em] uppercase italic">Close the loop: Review performance to sync reputation.</p>
                      </div>
                   </div>
                )}

                {/* Scope Box */}
                <div className="bg-white p-8 sm:p-12 rounded-[3.5rem] border-2 border-[#E2E8F0] space-y-10 shadow-sm relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-12 text-[#0F172A] opacity-[0.02] group-hover:opacity-[0.04] transition-opacity duration-1000 pointer-events-none">
                     <FileText size={160} />
                   </div>
                   <div className="flex items-center gap-4 mb-4 relative z-10">
                      <div className="w-12 h-12 rounded-[1rem] bg-gray-50 border border-gray-200 flex items-center justify-center text-[#0F766E]">
                        <FileText size={20} />
                      </div>
                      <h3 className="text-2xl font-black italic tracking-tighter uppercase font-display text-[#0F172A]">Scope of Operation</h3>
                   </div>
                   <p className="text-xl font-medium text-gray-600 italic leading-relaxed max-w-2xl px-2 relative z-10">
                      &quot;{contract.description}&quot;
                   </p>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 bg-gray-50 p-8 sm:p-10 rounded-[2.5rem] border-2 border-[#E2E8F0] relative overflow-hidden z-10 shadow-inner">
                      <div className="flex flex-col gap-8">
                         <div>
                            <p className="text-[9px] sm:text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mb-2 italic">EMPLOYER UNIT</p>
                            <p className="text-lg font-black italic font-display uppercase text-gray-800">{contract.employer_name}</p>
                         </div>
                         <div>
                            <p className="text-[9px] sm:text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mb-2 italic">TALENT UNIT</p>
                            <p className="text-lg font-black italic font-display uppercase text-gray-800">{contract.maker_name}</p>
                         </div>
                      </div>
                      
                      <div className="bg-white p-8 rounded-[2rem] border-2 border-[#E2E8F0] space-y-6 shadow-sm">
                         <div className="flex justify-between items-center text-[9px] sm:text-[10px]">
                            <span className="text-gray-500 font-black uppercase tracking-[0.2em] italic">GROSS PROTOCOL</span>
                            <span className="font-mono text-gray-600 font-bold">R{contract.price}</span>
                         </div>
                         <div className="flex justify-between items-center text-[9px] sm:text-[10px]">
                            <span className="text-gray-500 font-black uppercase tracking-[0.2em] italic">WayMakers Escrow Fee (10%)</span>
                            <span className="font-mono text-orange-400 font-bold">-R{(contract.price * 0.1).toFixed(2)}</span>
                         </div>
                         <div className="h-px bg-gray-200 w-full" />
                         <div className="flex justify-between items-end">
                            <span className="text-[10px] text-[#0F766E] font-black uppercase tracking-[0.3em] italic mb-1">NET SYNC</span>
                            <span className="font-mono text-[#0F766E] text-3xl font-black tracking-tight">R{(contract.price * 0.9).toFixed(2)}</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Interactive Action Area based on Role and Status */}
                <div className="bg-white p-10 sm:p-16 rounded-[4rem] border-2 border-[#E2E8F0] relative overflow-hidden shadow-sm">
                   
                   {/* Employer Views */}
                   {userRole === "employer" && contract.status === "active" && (
                      <div className="space-y-8 relative z-10 text-center">
                         <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm border border-amber-200 transition-transform hover:scale-105">
                            <Lock size={36} className="animate-pulse" />
                         </div>
                         <h3 className="text-4xl sm:text-5xl font-black uppercase italic tracking-tighter font-display leading-[0.9] text-[#0F172A]">Verify Operation?</h3>
                         <p className="text-sm font-bold text-gray-500 max-w-sm mx-auto leading-relaxed italic">Only release funds once the operational outcome is fully delivered and verified by your unit.</p>
                         
                         <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                            <button 
                               onClick={handleReleaseFunds}
                               disabled={isProcessing}
                               className="px-8 py-6 bg-[#0F766E] text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#0F766E]/20 flex items-center justify-center gap-3 italic border-b-4 border-black/10"
                            >
                               {isProcessing ? "PROCESSING..." : <><CheckCircle2 size={20} strokeWidth={3} /> Release R{contract.price} to Talent</>}
                            </button>
                            <Link href="/support" className="px-8 py-6 bg-white border-2 border-[#E2E8F0] text-gray-500 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-gray-50 hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center gap-3 italic shadow-sm">
                               <ShieldAlert size={18} /> Open Security Dispute
                            </Link>
                         </div>
                      </div>
                   )}

                   {/* Talent Views */}
                   {userRole === "maker" && contract.status === "active" && (
                      <div className="space-y-8 relative z-10 text-center">
                         <div className="w-20 h-20 bg-[#F0FDFA] text-[#0F766E] rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm border border-[#0F766E]/10 transition-transform hover:scale-105">
                            <Lock size={36} className="animate-pulse" />
                         </div>
                         <h3 className="text-4xl sm:text-5xl font-black uppercase italic tracking-tighter font-display leading-[0.9] text-[#0F172A]">Initiate Action.</h3>
                         <p className="text-[10px] sm:text-[11px] font-black text-gray-500 max-w-sm mx-auto leading-relaxed italic uppercase tracking-[0.3em]">
                            R{contract.price} is locked in Escrow. Deliver payload and communicate with the client for release.
                         </p>
                         
                         <div className="pt-8 flex justify-center">
                            <Link href="/messages" className="inline-flex items-center gap-4 px-10 py-6 bg-white text-[#0F172A] rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] hover:scale-105 active:scale-95 transition-all shadow-sm border-2 border-[#E2E8F0] italic">
                               <Briefcase size={18} strokeWidth={2.5} className="text-[#0F766E]" /> Establish Comms Link
                            </Link>
                         </div>
                      </div>
                   )}

                   {/* Post-Completion Review Step (Both Roles) */}
                   {contract.status === "completed" && !contract.review_submitted && (
                      <div className="space-y-10 relative z-10">
                         <div className="flex items-center gap-6 mb-8 border-b-2 border-[#E2E8F0] pb-6">
                            <h3 className="text-4xl sm:text-5xl font-black uppercase italic tracking-tighter font-display text-[#0F172A]">Leave a Review</h3>
                         </div>
                         
                         <div className="flex gap-4 justify-center">
                            {[1,2,3,4,5].map((star) => (
                               <button 
                                 key={star}
                                 onClick={() => setReviewScore(star)}
                                 className="hover:scale-110 transition-transform active:scale-95"
                               >
                                  <Star size={48} className={star <= reviewScore ? "text-amber-400 drop-shadow-sm" : "text-gray-300"} fill={star <= reviewScore ? "currentColor" : "none"} strokeWidth={1.5} />
                               </button>
                            ))}
                         </div>
                         
                         <textarea 
                           placeholder={userRole === "employer" ? "Detail the talent's operational efficiency..." : "How was the client protocol?"}
                           className="w-full bg-gray-50 border-2 border-[#E2E8F0] rounded-[2.5rem] p-8 h-40 text-lg sm:text-xl focus:border-[#0F766E] transition-all focus:bg-white outline-none font-bold italic resize-none placeholder:text-gray-400 shadow-inner text-gray-800"
                           value={reviewNote}
                           onChange={e => setReviewNote(e.target.value)}
                         />
                         
                         <button 
                           onClick={handleSubmitReview}
                           disabled={isProcessing}
                           className="w-full py-8 bg-[#0F766E] text-white rounded-[2rem] font-black text-[10px] sm:text-xs uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#0F766E]/20 flex justify-center items-center gap-4 italic border-b-4 border-black/10 disabled:opacity-50"
                         >
                            {isProcessing ? "SYNCING..." : <><Send size={20} strokeWidth={2.5} /> Submit Assessment</>}
                         </button>
                      </div>
                   )}

                   {/* Fully Done State */}
                   {contract.status === "completed" && contract.review_submitted && (
                      <div className="text-center py-12">
                         <div className="w-24 h-24 bg-[#F0FDFA] text-[#0F766E] rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-sm border border-[#0F766E]/10 animate-in zoom-in duration-1000">
                            <CheckCircle2 size={48} strokeWidth={3} />
                         </div>
                         <h3 className="text-5xl sm:text-6xl font-black uppercase italic tracking-tighter font-display mb-4 text-[#0F172A]">It&apos;s A Wrap.</h3>
                         <p className="text-[9px] sm:text-[10px] font-black text-gray-500 max-w-sm mx-auto uppercase tracking-[0.3em] italic leading-relaxed">OPERATION CLOSED. FUNDS RELEASED. PORTFOLIO UPDATED.</p>
                      </div>
                   )}
                </div>
             </div>
             
             {/* Right Col - Money & Safety */}
             <div className="lg:col-span-4 space-y-8">
                <div className="bg-gradient-to-br from-[#0F766E] to-teal-800 border-2 border-black/5 p-8 sm:p-10 rounded-[3.5rem] relative overflow-hidden group shadow-[0_20px_40px_rgba(15,118,110,0.2)]">
                   <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white opacity-[0.03] rounded-full blur-[80px] pointer-events-none" />
                   <DollarSign size={40} className="text-teal-200 mb-8" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 mb-3 italic">Protected Asset Value</p>
                   <h4 className="text-5xl sm:text-6xl font-black font-display italic tracking-tight text-white leading-none mb-10">R{contract.price}</h4>
                   
                   <div className="space-y-6 border-t border-white/10 pt-8 mt-auto">
                      <div className="flex justify-between items-center px-1">
                         <p className="text-[9px] font-black text-teal-200 uppercase tracking-[0.2em] italic">PLATFORM INFRA FEE</p>
                         <p className="font-bold text-teal-100 font-mono italic"> -R{(contract.price * 0.1).toFixed(0)}</p>
                      </div>
                      <div className="p-6 bg-white rounded-[2rem] border border-transparent shadow-xl">
                         <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 italic">TALENT SYNC PAYOUT</p>
                         <p className="text-3xl font-black text-[#0F172A] font-display italic tracking-tight"> R{(contract.price * 0.9).toFixed(0)}</p>
                      </div>
                   </div>
                   
                   <p className="text-[9px] sm:text-[10px] font-bold text-teal-100 mt-8 leading-relaxed italic border-l-2 border-teal-400 pl-4">
                      Assets secured via WayMakers Digital Escrow. {userRole === 'employer' ? "Platform Logic Fee is deducted upon verified release." : "Net sync allocation is R" + (contract.price * 0.9).toFixed(0) + "."}
                   </p>
                </div>
                
                <div className="bg-white p-10 rounded-[3rem] border-2 border-[#E2E8F0] flex flex-col items-center text-center gap-6 shadow-sm group">
                   <div className="w-14 h-14 bg-gray-50 rounded-[1.2rem] flex items-center justify-center border border-gray-200 transition-transform group-hover:scale-105">
                     <ShieldAlert size={24} className="text-[#0F766E]" />
                   </div>
                   <div className="space-y-3">
                     <h5 className="font-black uppercase tracking-[0.3em] text-[10px] italic text-[#0F172A]">Trust & Integrity</h5>
                     <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 leading-relaxed uppercase tracking-widest italic px-2">Never transact outside the WayMakers Platform. Digital escrow ensures absolute system safety.</p>
                   </div>
                   <Link href="/support" className="mt-2 px-6 py-4 bg-gray-50 border-2 border-[#E2E8F0] hover:border-[#0F766E]/30 rounded-[1.5rem] text-[#0F766E] font-black hover:bg-white transition-all uppercase text-[9px] tracking-[0.3em] italic shadow-sm w-full">
                      Access Support Center
                   </Link>
                </div>
             </div>

          </div>
       </div>
    </div>
  );
}
