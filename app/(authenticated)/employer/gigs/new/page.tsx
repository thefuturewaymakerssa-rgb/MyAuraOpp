"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SKILL_DATABASE } from "@/utils/constants";
import { Briefcase, Send, MapPin, Zap, ArrowLeft, Gem, Loader2, ChevronRight, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { jobsHub } from "@/lib/supabase-helpers";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function NewGigPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    trade: "",
    location: "Johannesburg, GP",
    budget: "R 1,500.00",
    description: "",
    preferred_talent_type: "graduate"
  });

  const handleCreateDraft = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await (supabase as any)
        .from("jobs")
        .insert({
          employer_id: user.id,
          title: formData.title,
          trade: formData.trade,
          location: formData.location,
          budget: formData.budget,
          description: formData.description,
          preferred_talent_type: [formData.preferred_talent_type],
          status: "pending" // Stays pending until payment step
        })
        .select("id")
        .single();

      if (error) throw error;

      setJobId(data.id);
      setStep(2);
    } catch (err: any) {
      toast.error("Error creating draft: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      // payment gateway integration would go here
      const supabase = createClient();
      const { error } = await (supabase.from("jobs") as any)
        .update({ 
          payment_status: 'paid',
          payment_amount: 200,
          status: 'open' // Now visible on the radar
        })
        .eq("id", jobId);
        
      if (error) throw error;
      setStep(3);
    } catch (err: any) {
      toast.error("Payment failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0FDFA] text-[#0F172A] font-sans p-6 sm:p-12 lg:p-24 relative overflow-hidden selection:bg-[#0F766E]/20 mb-20 lg:mb-0">
      
      {/* Ambient Light Effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-[#0F766E]/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto relative z-10">
        <header className="space-y-8 mb-16">
          <Link href="/employer/hub" className="inline-flex items-center gap-3 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#0F766E] bg-white px-6 py-3 rounded-full border-2 border-[#E2E8F0] hover:border-[#0F766E]/40 hover:shadow-md transition-all group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1.5 transition-transform" /> Back to Operations Hub
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
             <div className="w-20 h-20 rounded-2xl bg-[#0F766E] flex items-center justify-center text-white shadow-lg shadow-[#0F766E]/20 shrink-0">
                <Gem size={40} />
             </div>
             <div>
                <h1 className="text-6xl sm:text-7xl font-black italic tracking-tighter font-display text-[#0F172A] uppercase leading-[0.9] mb-2">Post a Gig.</h1>
                <p className="text-gray-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-3 italic flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]"></span> Step {step} of 3 • Hire Top Talent.
                </p>
             </div>
          </div>
        </header>

        {step === 1 && (
          <form onSubmit={handleCreateDraft} className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Section 1: Target */}
            <section className="bg-white p-8 sm:p-12 lg:p-16 rounded-[3.5rem] space-y-12 border-2 border-[#E2E8F0] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-[#0F172A] pointer-events-none">
                <Briefcase size={200} />
              </div>

              <div className="flex items-center gap-5 text-[#0F766E] relative z-10">
                 <Briefcase size={28} />
                 <h3 className="text-2xl sm:text-3xl font-black italic font-display tracking-tight uppercase text-[#0F172A]">Gig Identity</h3>
              </div>
              
              <div className="space-y-8 relative z-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-4 italic">Gig Headline</label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Expert Gate Repair & Welding"
                    className="w-full h-16 bg-gray-50 border-2 border-[#E2E8F0] rounded-[2rem] px-8 outline-none focus:border-[#0F766E] focus:bg-white transition-all font-bold text-lg text-gray-800 shadow-inner"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-4 italic">Primary Skill / Trade Requirement</label>
                  <div className="relative">
                    <select 
                      required
                      value={formData.trade}
                      onChange={e => setFormData({...formData, trade: e.target.value})}
                      className="w-full h-16 bg-gray-50 border-2 border-[#E2E8F0] rounded-[2rem] px-8 outline-none focus:border-[#0F766E] focus:bg-white transition-all font-bold text-lg text-gray-800 appearance-none shadow-inner"
                    >
                       <option value="" className="text-gray-400">Select required trade...</option>
                       {SKILL_DATABASE.map((s: string) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronRight size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-4 italic">Location</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required
                        value={formData.location}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        placeholder="City, Province"
                        className="w-full h-16 bg-gray-50 border-2 border-[#E2E8F0] rounded-[2rem] pl-16 pr-8 outline-none focus:border-[#0F766E] focus:bg-white transition-all font-bold text-lg text-gray-800 shadow-inner"
                      />
                      <MapPin size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#0F766E]" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-4 italic">Budget Allocation</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required
                        value={formData.budget}
                        onChange={e => setFormData({...formData, budget: e.target.value})}
                        placeholder="R 0.00"
                        className="w-full h-16 bg-gray-50 border-2 border-[#E2E8F0] rounded-[2rem] pl-16 pr-8 outline-none focus:border-[#0F766E] focus:bg-white transition-all font-bold text-lg text-gray-800 shadow-inner"
                      />
                      <Gem size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#8B5CF6]" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-4 italic">Preferred Talent Tier</label>
                  <div className="grid grid-cols-3 gap-4">
                     {[
                       { id: 'freshie', label: 'Freshie', desc: 'Entry/Learner' },
                       { id: 'graduate', label: 'Graduate', desc: 'Qualified' },
                       { id: 'reskiller', label: 'Reskiller', desc: 'Experienced' }
                     ].map((tier) => (
                       <button
                         key={tier.id}
                         type="button"
                         onClick={() => setFormData({...formData, preferred_talent_type: tier.id})}
                         className={`p-6 rounded-[2rem] border-2 transition-all text-center group ${formData.preferred_talent_type === tier.id ? "bg-[#0F766E] border-transparent text-white shadow-lg" : "bg-gray-50 border-[#E2E8F0] text-gray-400 opacity-60"}`}
                       >
                         <p className="text-lg font-black uppercase tracking-widest italic">{tier.label}</p>
                         <p className={`text-[8px] font-black uppercase tracking-widest italic mt-1 ${formData.preferred_talent_type === tier.id ? "text-white/60" : "text-gray-400 text-opacity-80"}`}>{tier.desc}</p>
                       </button>
                     ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-4 italic">Mission Description</label>
                  <textarea 
                    required
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the skill required, timeline, and specific tasks involved..."
                    className="w-full h-48 bg-gray-50 border-2 border-[#E2E8F0] rounded-[2rem] p-8 outline-none focus:border-[#0F766E] focus:bg-white transition-all font-medium text-lg text-gray-800 leading-relaxed resize-none shadow-inner"
                  />
                </div>
              </div>
            </section>

            <button 
              type="submit"
              disabled={loading || !formData.title || !formData.trade}
              className="w-full py-8 sm:py-10 bg-[#0F766E] text-white rounded-[2.5rem] font-black text-[12px] sm:text-[14px] uppercase tracking-[0.4em] shadow-xl shadow-[#0F766E]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 italic border-b-8 border-black/10 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={28} /> : <span>Proceed to Secure Listing</span>}
              <ChevronRight size={24} strokeWidth={3} />
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-12 animate-in fade-in duration-700">
             <div className="bg-white p-10 sm:p-16 rounded-[4rem] border-2 border-[#0F766E]/20 relative overflow-hidden group shadow-lg shadow-[#0F766E]/5">
                <div className="absolute top-0 right-0 p-12 text-[#0F766E]/5 group-hover:scale-110 group-hover:text-[#0F766E]/10 transition-all duration-700 pointer-events-none">
                   <Zap size={200} />
                </div>
                
                <div className="relative z-10">
                   <h3 className="text-5xl sm:text-6xl font-black italic tracking-tighter mb-8 font-display uppercase text-[#0F172A]">Secure Listing.</h3>
                   <p className="text-gray-500 font-bold mb-12 max-w-xl leading-relaxed text-lg sm:text-xl">
                      To maintain high platform standards, a small listing fee is required. This ensures your gig is dispatched to <span className="text-[#0F766E] underline decoration-[#0F766E]/30">verified WayMakers talent.</span>
                   </p>

                   <div className="space-y-8 mb-16">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-8 bg-[#F0FDFA] rounded-[2rem] border-2 border-[#0F766E]/10 gap-6">
                         <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-[#0F766E] shadow-sm border border-[#E2E8F0]">
                               <Briefcase size={32} />
                            </div>
                            <div>
                               <p className="text-xl sm:text-2xl font-black italic text-[#0F172A]">{formData.title}</p>
                               <p className="text-[10px] font-black uppercase tracking-widest text-[#0F766E] italic mt-1">Premium Listing Package</p>
                            </div>
                         </div>
                         <h4 className="text-4xl font-black italic font-display text-[#0F172A]">R 200</h4>
                      </div>
                      
                      <div className="flex items-center gap-4 px-6 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-gray-500 italic">
                         <Sparkles size={18} className="text-[#8B5CF6] animate-pulse" />
                         Included: 7 days active, Radar priority, Escrow protection.
                      </div>
                   </div>

                   <button 
                     onClick={handlePayment}
                     disabled={loading}
                     className="w-full py-8 bg-[#0F172A] text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-gray-800 transition-all flex items-center justify-center gap-4 border-b-8 border-black hover:scale-[1.02] active:scale-[0.98] shadow-xl disabled:opacity-50"
                   >
                      {loading ? <Loader2 className="animate-spin" size={24} /> : <span>Process Payment & Publish</span>}
                      <Zap size={20} fill="currentColor" />
                   </button>
                </div>
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-[4rem] border-2 border-[#E2E8F0] shadow-sm text-center py-24 sm:py-32 px-6 animate-in fade-in zoom-in-95 duration-1000 relative overflow-hidden">
             
             <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(15,118,110,0.05)_0%,transparent_50%)] animate-spin-slow pointer-events-none" />

             <div className="w-32 h-32 rounded-[3rem] bg-[#F0FDFA] flex items-center justify-center text-[#0F766E] mx-auto mb-12 shadow-inner border-2 border-[#0F766E]/10 relative z-10">
                <CheckCircle2 size={64} className="animate-pulse" />
             </div>
             
             <h2 className="text-6xl sm:text-7xl font-black italic tracking-tighter mb-8 font-display uppercase text-[#0F172A] relative z-10">Operation Live! 🚀</h2>
             <p className="text-xl sm:text-2xl text-gray-500 font-bold max-w-2xl mx-auto mb-16 leading-relaxed relative z-10">
                Your gig has been successfully broadcast to the Shapa Work Radar. Shapa talent will be in touch shortly.
             </p>
             <button 
               onClick={() => router.push("/employer/hub")}
               className="px-12 py-6 sm:px-16 sm:py-8 bg-[#0F766E] text-white rounded-[2.5rem] font-black text-[10px] sm:text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#0F766E]/20 border-b-4 border-black/10 relative z-10"
             >
                Return to Mission Control
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
