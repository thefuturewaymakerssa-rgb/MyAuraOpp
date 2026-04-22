"use client";

import { use, useState, useEffect } from "react";
import { Users, ShieldCheck, Video, MessageSquare, ArrowRight, ArrowLeft, Star, MapPin, X, Check, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { acceptApplication, declineApplication } from "@/lib/actions/applications";
import { toast } from "sonner";

export default function GigApplicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [applications, setApplications] = useState<any[]>([]);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function loadGigAndApplicants() {
      // Fetch Job
      const { data: jobData } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();
      
      if (jobData) setJob(jobData);

      // Fetch Applications with Relations
      const { data: appsData } = await supabase
        .from("job_applications")
        .select(`
          id,
          status,
          maker_id,
          job_id,
          created_at,
          maker:profiles!job_applications_maker_id_fkey(name, location, reliability_score),
          proof:proofs!job_applications_proof_id_fkey(video_url)
        `)
        .eq("job_id", id)
        .neq("status", "rejected"); // Hide declined

      if (appsData) setApplications(appsData);
      setLoading(false);
    }
    loadGigAndApplicants();
  }, [id]);

  const handleDecline = async (appId: string) => {
    setActionLoading(appId);
    try {
      await declineApplication(appId);
      setApplications(prev => prev.filter(app => app.id !== appId));
    } catch(err) {
      console.error(err);
      toast.error("Failed to decline application.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = async (app: any) => {
    if (!job) return;
    setActionLoading(app.id);
    try {
      const contract = await acceptApplication(
        app.id, 
        job.id, 
        app.maker_id, 
        job.title, 
        job.description, 
        job.budget
      );
      if (contract) {
        // Route to the new contract
        router.push(`/employer/contracts`);
      }
    } catch(err) {
      console.error(err);
      toast.error("Failed to accept application.");
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0D110F] flex items-center justify-center font-display italic text-[#13EC6A] font-black text-2xl tracking-tighter">
      <Loader2 className="animate-spin text-[#13EC6A] mr-4 shadow-glow" size={48} />
      LOADING APPLICANTS...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D110F] text-white font-body p-8 lg:p-20 relative overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-16 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-6">
            <Link href="/employer/hub" className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" /> Back to Hub
            </Link>
            <h1 className="text-6xl font-black italic tracking-tighter mb-4 font-display text-glow uppercase">Applicants.</h1>
            <p className="text-gray-500 font-bold uppercase tracking-[0.4em] text-[10px]">
              {job?.title ? `Review talent for: ${job.title}` : `Review talent for Gig #${id}`}
            </p>
          </div>
          <div className="glass px-8 py-5 rounded-2xl border border-white/10 shadow-glow">
             <p className="text-[8px] font-black uppercase tracking-widest text-gray-700 mb-1">Total Verified Applicants</p>
             <p className="text-3xl font-black italic font-display text-[#13EC6A]">{applications.length}</p>
          </div>
        </header>

        {applications.length === 0 ? (
          <div className="glass p-20 rounded-[3rem] text-center border border-white/5 space-y-6 flex flex-col items-center">
             <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-gray-500 border border-white/10 mb-4">
                <Users size={40} />
             </div>
             <h3 className="text-4xl font-black italic tracking-tight font-display text-gray-400">No applicants yet.</h3>
             <p className="text-gray-500 font-bold max-w-md uppercase tracking-wider text-xs">When Hustlers submit their VibeCV proofs to this project, they will appear here for review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {applications.map((app) => (
              <div key={app.id} className="glass p-10 rounded-[3rem] space-y-10 group hover:border-[#13EC6A]/20 transition-all border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#13EC6A]/5 rounded-full blur-[40px] pointer-events-none" />
                
                {app.status === 'accepted' && (
                   <div className="absolute top-4 right-4 bg-[#13EC6A] text-[#052210] px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] italic shadow-glow">
                     Hired
                   </div>
                )}
                
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-20 h-20 rounded-3xl bg-[#13EC6A] flex items-center justify-center text-3xl font-black italic font-display text-[#052210] shadow-glow">
                     {app.maker?.name?.[0] || "?"}
                  </div>
                  <div className="space-y-1">
                     <h3 className="text-2xl font-black italic font-display tracking-tight uppercase leading-none">{app.maker?.name || "Anonymous Applicant"}</h3>
                     <div className="flex items-center gap-4 text-[8px] font-black text-gray-600 uppercase tracking-widest italic mt-2">
                        <span className="flex items-center gap-1"><MapPin size={10} /> {app.maker?.location || "Unknown location"}</span>
                        <span className="text-[#13EC6A] flex items-center gap-1"><Star size={10} fill="currentColor" /> {(app.maker?.reliability_score || 5.0).toFixed(1)}</span>
                     </div>
                  </div>
                </div>

                <div className="flex gap-4 relative z-10">
                   <Link 
                     href={`/u/${app.maker_id}`} 
                     className="flex-1 glass pt-6 pb-6 rounded-2xl text-center space-y-2 group-hover:bg-[#13EC6A]/5 transition-colors border border-white/5 hover:border-[#13EC6A]/30 flex flex-col items-center justify-center"
                   >
                      <Video size={24} className="text-[#13EC6A] mb-1" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-white italic">Video Proof</p>
                   </Link>
                   <Link 
                     href={`/messages/${app.maker_id}`} 
                     className="flex-1 glass pt-6 pb-6 rounded-2xl text-center space-y-2 border border-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-colors flex flex-col items-center justify-center"
                   >
                      <MessageSquare size={24} className="text-indigo-400 mb-1" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-white italic">Chat</p>
                   </Link>
                </div>

                {app.status === 'pending' && (
                  <div className="flex gap-4 relative z-10 pt-4 border-t border-white/5">
                     <button
                       onClick={() => handleDecline(app.id)}
                       disabled={actionLoading === app.id}
                       className="w-16 h-16 glass rounded-2xl flex items-center justify-center text-red-400 border border-transparent hover:border-red-500/30 hover:bg-red-500/10 transition-all disabled:opacity-50"
                     >
                        <X size={24} />
                     </button>
                     <button
                       onClick={() => handleAccept(app)}
                       disabled={actionLoading === app.id}
                       className="flex-1 bg-[#13EC6A] text-[#052210] font-black uppercase text-xs tracking-widest py-5 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow italic disabled:opacity-50"
                     >
                        {actionLoading === app.id ? <Loader2 className="animate-spin" size={18} /> : "Accept & Hire"} <Check size={18} className="drop-shadow-glow" />
                     </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
