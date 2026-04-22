"use client";

import { Briefcase, MapPin, Zap, Star, ShieldCheck, ArrowLeft, Send, Gem, Globe, User, Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function GigDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadJob() {
      setLoading(true);
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", id)
          .single();
        
        if (error) throw error;
        setJob(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadJob();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center font-display italic text-[#0F766E] font-black text-2xl tracking-tighter">
      <Loader2 className="animate-spin text-[#0F766E] mr-4 shadow-sm" size={40} />
      Fetching Target...
    </div>
  );

  if (!job || error) return (
    <div className="min-h-screen bg-[#F0FDFA] text-[#0F172A] p-8 text-center flex flex-col items-center justify-center font-sans">
      <AlertCircle size={60} className="text-red-500 mb-8 animate-pulse shadow-sm rounded-full bg-red-50" />
      <h1 className="text-5xl font-black mb-4 tracking-tighter italic font-display uppercase">Work Call Not Found</h1>
      <p className="text-gray-500 mb-10 font-bold max-w-sm">{error || "The gig you are looking for has been removed from the directory."}</p>
      <Link href="/gigs" className="bg-white border-2 border-[#E2E8F0] px-8 py-4 rounded-full text-[#0F766E] font-black uppercase tracking-widest text-xs hover:border-[#0F766E]/30 hover:bg-[#0F766E]/5 transition-all shadow-sm">Back to Gigs</Link>
    </div>
  );

  return (
    <div className="min-h-screen font-sans relative overflow-hidden selection:bg-[#0F766E]/20 pb-[calc(120px+env(safe-area-inset-bottom))]">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[#0F766E]/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-5xl mx-auto space-y-12 sm:space-y-16 relative z-10 pt-8 px-6 lg:px-0">
        <Link href="/gigs" className="inline-flex items-center gap-3 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#0F766E] hover:scale-[1.02] bg-white border-2 border-[#E2E8F0] px-6 py-3 rounded-full hover:shadow-md transition-all group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1.5 transition-transform" /> Back to Directory
        </Link>

        {/* Gig Hero */}
        <div className="bg-white p-10 sm:p-16 rounded-[4rem] relative overflow-hidden group border-2 border-[#E2E8F0] shadow-sm">
          <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-indigo-50 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row gap-12 items-start justify-between relative z-10">
            <div className="space-y-10 flex-1">
              <div className="w-24 h-24 bg-[#F0FDFA] border-2 border-[#0F766E]/10 rounded-[2.5rem] flex items-center justify-center text-[#0F766E] shadow-sm">
                <Briefcase size={48} />
              </div>
              <div className="space-y-6">
                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black italic tracking-tighter leading-[0.8] font-display uppercase text-[#0F172A] drop-shadow-sm">
                  {job.title.split(' ').slice(0, -1).join(' ')} <br/><span className="text-[#0F766E]">{job.title.split(' ').slice(-1)}</span>
                </h1>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 italic mt-6">
                  <span className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-full border border-gray-200"><MapPin size={18} className="text-[#0F766E]" /> {job.location}</span>
                  <span className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-full border border-gray-200"><Gem size={18} className="text-[#8B5CF6]" /> {job.budget}</span>
                </div>
              </div>
            </div>

            <div className="hidden md:flex flex-col gap-4 w-full md:w-auto shrink-0 mt-6 md:mt-0">
               <div className="bg-gray-50 p-10 rounded-[3rem] text-center space-y-3 mb-4 border-2 border-[#E2E8F0] shadow-inner">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#0F766E]">Applications Open</p>
                  <p className="text-4xl lg:text-5xl font-black italic font-display text-gray-800 uppercase tracking-tighter">Active</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">Awaiting Submissions</p>
               </div>
               <Link href={`/gigs/${id}/apply`} className="w-full bg-[#0F766E] text-white font-black py-10 px-16 rounded-[2.5rem] flex items-center justify-center gap-4 hover:scale-[1.05] active:scale-[0.98] transition-all shadow-2xl shadow-[#0F766E]/30 uppercase tracking-[0.4em] text-xs italic border-b-8 border-black/10">
                 Apply with Proof
                 <Send size={24} />
               </Link>
               
               <button 
                 onClick={async () => {
                   const reason = prompt("Why are you reporting this gig? (Scam, Inappropriate, etc.)");
                   if (reason) {
                     try {
                       const supabase = createClient();
                       const { data: { user } } = await supabase.auth.getUser();
                       if (!user) throw new Error("Login required");

                       // We use target_id for the Job ID in this context
                       const { error } = await supabase.from('reports').insert({
                         reporter_id: user.id,
                         target_id: id,
                         reason: reason,
                         status: 'pending'
                       } as any);
                       
                       if (error) throw error;
                       toast.info("Ziyakhala! 🛡️ Safety team notified. We will review this gig immediately.");
                     } catch (err: any) {
                       console.error("Report failed:", err);
                       toast.error(err.message === "Login required" ? "Login to report gigs." : "Error reporting gig.");
                     }
                   }
                 }}
                 className="flex items-center justify-center gap-2 text-[10px] font-black text-red-500/50 hover:text-red-500 transition-all uppercase tracking-widest pt-2 italic"
               >
                 <ShieldAlert size={14} /> Report this Gig
               </button>
            </div>
          </div>
        </div>

        {/* Mobile Sticky CTA */}
        <div className="md:hidden fixed bottom-32 left-0 right-0 z-50 px-10">
           <Link href={`/gigs/${id}/apply`} className="w-full bg-[#0F766E] text-white font-black py-10 px-12 rounded-[2.5rem] flex items-center justify-center gap-4 shadow-[0_30px_100px_rgba(15,118,110,0.5)] uppercase tracking-[0.4em] text-xs italic border-b-8 border-black/20 animate-in slide-in-from-bottom-20 duration-700">
             INITIALIZE APPLICATION <Send size={20} />
           </Link>
        </div>

        {/* Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
          <div className="lg:col-span-2 space-y-12">
            <section className="space-y-6 bg-white p-8 sm:p-12 rounded-[3.5rem] border-2 border-[#E2E8F0] shadow-sm">
              <h3 className="text-xl font-black italic uppercase font-display tracking-tight text-gray-300">The Mission.</h3>
              <p className="text-lg sm:text-xl md:text-2xl font-medium leading-relaxed italic text-gray-600">
                {job.description}
              </p>
            </section>

            <section className="space-y-6 bg-white p-8 sm:p-12 rounded-[3.5rem] border-2 border-[#E2E8F0] shadow-sm">
               <h3 className="text-xl font-black italic uppercase font-display tracking-tight text-gray-300">Required Competencies.</h3>
               <div className="flex flex-wrap gap-4">
                  {[(job.trade || 'General Pick'), 'Verified Proof Required', 'On-Site Call'].map(tag => (
                    <span key={tag} className="px-5 py-3 bg-gray-50 border border-gray-200 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-[#0F172A] hover:bg-gray-100 transition-colors cursor-default shadow-inner">{tag}</span>
                  ))}
               </div>
            </section>
          </div>

          <aside className="space-y-8">
             <div className="bg-white p-8 sm:p-10 rounded-[3rem] border-2 border-[#E2E8F0] space-y-8 shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 italic">Gig MetaData</h4>
                <div className="flex items-center gap-6 group">
                   <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-3xl font-black italic font-display text-indigo-500 shadow-sm border border-indigo-100">W</div>
                   <div>
                      <h5 className="font-black italic text-lg uppercase tracking-tight font-display text-[#0F172A] group-hover:text-indigo-500 transition-colors">Future Verified.</h5>
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Escrow Secured</span>
                   </div>
                </div>
                <div className="pt-8 border-t-2 border-gray-100 space-y-6">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-gray-400">Target Trade</span>
                      <span className="text-[#0F766E]">{job.trade}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-gray-400">Mission Status</span>
                      <span className="text-indigo-400 uppercase bg-indigo-50 px-3 py-1 rounded-full">{job.status}</span>
                   </div>
                </div>
             </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
