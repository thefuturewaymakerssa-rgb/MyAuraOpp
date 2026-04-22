"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { contractsHub } from "@/lib/supabase-helpers";
import { Database } from "@/lib/database.types";
import { ShieldCheck, Briefcase, Lock, DollarSign, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

function EscrowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const makerId = searchParams.get("maker_id");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [maker, setMaker] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null);
  const [employer, setEmployer] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    duration: "1 Week"
  });

  const [step, setStep] = useState<"details" | "payment" | "success">("details");
  const [contractId, setContractId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      if (!makerId) {
        toast.error("No Maker selected.");
        router.push("/employer/hub");
        return;
      }

      // Check if we just returned from PayFast successfully
      const statusParam = searchParams.get("status");
      const returnedContractId = searchParams.get("contract_id");
      if (statusParam === "success" && returnedContractId) {
         setContractId(returnedContractId);
         setStep("success");
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: employerData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setEmployer(employerData);

      const { data: makerData } = await supabase.from('profiles').select('*').eq('id', makerId).single();
      setMaker(makerData);

      setLoading(false);
    }
    init();
  }, [makerId, router]);

  const handleCreateContract = async () => {
    if (!makerId || !employer) return;
    setSubmitting(true);
    const toastId = toast.loading("Initializing secure escrow payment...");
    
    try {
      // 1. Create a pending contract
      const contract = await contractsHub.insert({
        employer_id: employer.id,
        maker_id: makerId,
        title: formData.title,
        description: formData.description,
        price: parseInt(formData.price),
        status: 'active',
        escrow_funded: false,
        updated_at: new Date().toISOString()
      });
      
      // 2. Obtain PayFast Payment Session payload
      const response = await fetch("/api/employer/escrow/payfast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: contract.id,
          amount: formData.price,
          itemName: `Escrow: ${formData.title}`
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to initialize payment.");
      }

      toast.success("Redirecting to secure checkout...", { id: toastId });

      // 3. Dynamically submit PayFast Form
      const form = document.createElement("form");
      form.method = "POST";
      form.action = result.url;
      
      Object.entries(result.data).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();

    } catch (err: unknown) {
      console.error("Contract creation error:", err);
      toast.error("Failed to create contract: " + (err instanceof Error ? err.message : String(err)), { id: toastId });
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen p-10 flex items-center justify-center">
      <Loader2 className="animate-spin text-[#13EC6A]" size={40} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 pb-32 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-5xl font-black italic tracking-tighter font-display uppercase">Direct <span className="text-[#13EC6A]">Hire.</span></h1>
        <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-xs">Fund a private contract with {maker?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        
        {/* Main Content Area */}
        <div className="col-span-2 space-y-8">
          
          {step === "details" && (
            <div className="glass p-8 rounded-[3rem] border border-white/5 space-y-8">
               <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                 <div className="w-16 h-16 bg-[#13EC6A]/10 rounded-2xl flex items-center justify-center text-[#13EC6A]">
                    <Briefcase size={28} />
                 </div>
                  <div>
                    <h2 className="text-2xl font-black italic tracking-tighter">Job Details</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Define the scope of work clearly.</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#13EC6A]">Gig Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Logo Design for 3 Brands"
                      className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl p-4 text-lg focus:border-[#13EC6A] transition-colors"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#13EC6A]">Scope & Deliverables</label>
                    <textarea 
                      placeholder="Be specific about what you need done..."
                      className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl p-4 h-32 text-sm focus:border-[#13EC6A] transition-colors"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#13EC6A]">Milestone Price (ZAR)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 1500"
                        className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl p-4 text-lg focus:border-[#13EC6A] transition-colors font-mono"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#13EC6A]">Timeline</label>
                      <select 
                        className="w-full mt-2 bg-[#171C19] border border-white/10 rounded-2xl p-4 text-lg focus:border-[#13EC6A] transition-colors appearance-none"
                        value={formData.duration}
                        onChange={e => setFormData({...formData, duration: e.target.value})}
                      >
                         <option>1-3 Days</option>
                         <option>1 Week</option>
                         <option>2 Weeks</option>
                         <option>1 Month</option>
                      </select>
                    </div>
                  </div>
               </div>

               <button 
                 onClick={() => setStep("payment")}
                 disabled={!formData.title || !formData.price || !formData.description}
                 className="w-full py-5 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-[#13EC6A] transition-all disabled:opacity-50 disabled:hover:bg-white"
               >
                 Proceed to Escrow Deposit
               </button>
            </div>
          )}

          {step === "payment" && (
            <div className="glass p-8 rounded-[3rem] border border-[#13EC6A]/30 space-y-8 shadow-[0_0_50px_rgba(19,236,106,0.1)] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-[#13EC6A]/10 rounded-full blur-[80px]" />
               
               <div className="flex items-center gap-4 border-b border-[#13EC6A]/20 pb-6 relative z-10">
                 <div className="w-16 h-16 bg-[#13EC6A] rounded-2xl flex items-center justify-center text-[#052210] shadow-glow">
                    <Lock size={28} />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black italic tracking-tighter">Fund Escrow</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Funds are locked securely until work is approved.</p>
                 </div>
               </div>

               <div className="relative z-10 space-y-6">
                  <div className="p-6 bg-black/40 rounded-2xl border border-white/5 flex justify-between items-center">
                     <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Contract Value</p>
                       <p className="text-3xl font-black font-mono">R{formData.price}.00</p>
                     </div>
                     <DollarSign size={32} className="text-[#13EC6A] opacity-50" />
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl flex gap-4">
                     <ShieldCheck className="text-blue-400 shrink-0" />
                     <div>
                        <h4 className="font-black text-sm uppercase tracking-widest mb-1">Shapa Protection</h4>
                        <p className="text-[10px] text-gray-400 font-bold leading-relaxed pr-4">You have up to 14 days after submission to review the work. If incomplete, you can open a dispute to freeze funds.</p>
                     </div>
                  </div>

                  <button 
                    onClick={handleCreateContract}
                    disabled={submitting}
                    className="w-full py-6 bg-[#13EC6A] text-[#052210] font-black uppercase tracking-widest text-sm rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-glow flex justify-center items-center gap-4"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={24} /> : (
                      <>DEPOSIT R{formData.price} TO ESCROW <ArrowRight size={20} /></>
                    )}
                  </button>
                  <button 
                    onClick={() => setStep("details")}
                    className="w-full text-center text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white pt-2"
                  >
                    Edit Details
                  </button>
               </div>
            </div>
          )}

          {step === "success" && (
            <div className="glass p-12 rounded-[3rem] border border-[#13EC6A]/50 text-center relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-[#13EC6A]/10 to-transparent" />
               <div className="w-24 h-24 mx-auto bg-[#13EC6A] text-[#052210] rounded-full flex items-center justify-center mb-8 shadow-glow relative z-10">
                  <CheckCircle2 size={48} />
               </div>
               <h2 className="text-5xl font-black italic tracking-tighter mb-4 font-display relative z-10">Contract Live.</h2>
               <p className="text-gray-400 font-bold mb-8 relative z-10">
                 Escrow is funded. <b>{maker?.name}</b> has been notified and expects to deliver within {formData.duration}.
               </p>
               
               <div className="relative z-10 p-6 bg-black/40 rounded-2xl border border-white/10 mb-8 inline-block">
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#13EC6A] mb-1">Contract ID</p>
                 <p className="text-xl font-black font-mono tracking-widest">{contractId}</p>
               </div>

               <div className="relative z-10 flex gap-4 justify-center">
                  <Link href={`/messages?maker_id=${makerId}`} className="px-8 py-5 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#13EC6A] transition-colors">
                     Message Maker
                  </Link>
                  <Link href="/employer/contracts" className="px-8 py-5 glass border border-white/20 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
                     Back to Hub
                  </Link>
               </div>
            </div>
          )}
        </div>

        {/* Sidebar Status / Maker Card */}
        <div className="hidden md:block col-span-1">
           <div className="glass p-6 rounded-[2.5rem] border border-white/5 sticky top-10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6">Contracting With</h3>
              
              <div className="flex flex-col items-center text-center">
                 <div className="w-24 h-24 bg-[#13EC6A]/10 text-[#13EC6A] rounded-3xl flex items-center justify-center text-4xl font-black italic font-display mb-4 border border-[#13EC6A]/20">
                    {maker?.name?.[0]}
                 </div>
                 <h4 className="font-black text-xl italic tracking-tighter">{maker?.name}</h4>
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#13EC6A] my-2">{maker?.trade}</p>
                 
                 <div className="w-full h-px bg-white/10 my-6" />
                 
                 <div className="w-full space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className="text-gray-500">Milestones</span>
                       <span className="text-white">1</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className="text-gray-500">Escrow Status</span>
                       <span className={step === "success" ? "text-[#13EC6A]" : "text-amber-500"}>
                         {step === "success" ? "FUNDED" : "PENDING DEPOSIT"}
                       </span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function EscrowPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#13EC6A]" size={40} /></div>}>
      <EscrowContent />
    </Suspense>
  );
}
