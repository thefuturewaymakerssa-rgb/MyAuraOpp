"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { reportsHub, proofsHub, notificationsHub, jobsHub } from "@/lib/supabase-helpers";
import { 
  ShieldAlert, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  User,
  Play,
  Film,
  AlertTriangle,
  History,
  ArrowLeft,
  Briefcase,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminModerationPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    setLoading(true);
    try {
      const data = await reportsHub.fetchAll();
      setReports(data || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteVideo = async (report: any) => {
    if (!confirm("Are you sure you want to PERMANENTLY DELETE this video? This cannot be undone.")) return;
    
    setProcessingId(report.id);
    try {
      // 1. Delete actual proof (Storage & DB)
      if (report.proof_id) {
        await proofsHub.delete(report.proof_id);
      }

      // 2. Resolve the report
      await reportsHub.resolve(report.id, 'resolved');

      // 3. Notify Maker
      await notificationsHub.insert({
        user_id: report.target_id,
        message: `🛡️ Moderation: Your video proof has been removed due to a violation of platform safety guidelines.`,
        type: 'system_alert'
      } as any);

      toast.info("Video purged from the grid. 🛡️");
      setReports(prev => prev.filter(r => r.id !== report.id));
    } catch (err) {
      console.error("Deletion failed:", err);
      toast.error("Error deleting video.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleTakedownGig = async (report: any) => {
    if (!confirm("Are you sure you want to CLOSE this Gig? This will prevent applicants from applying.")) return;
    
    setProcessingId(report.id);
    try {
      // 1. Update job status to closed
      const supabase = createClient();
      const { error: jobError } = await (supabase.from('jobs') as any)
        .update({ status: 'closed' })
        .eq('id', report.target_id);

      if (jobError) throw jobError;

      // 2. Resolve the report
      await reportsHub.resolve(report.id, 'resolved');

      // 3. Notify Employer
      if (report.jobs?.employer_id) {
        await notificationsHub.insert({
          user_id: report.jobs.employer_id,
          message: `🛡️ Moderation: Your Gig "${report.jobs.title}" has been taken down following a community report for violating platform guidelines.`,
          type: 'system_alert'
        } as any);
      }

      toast.info("Gig taken down. 🛡️");
      setReports(prev => prev.filter(r => r.id !== report.id));
    } catch (err) {
      console.error("Takedown failed:", err);
      toast.error("Error taking down gig.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismiss = async (report: any) => {
    setProcessingId(report.id);
    try {
      await reportsHub.resolve(report.id, 'dismissed');
      setReports(prev => prev.filter(r => r.id !== report.id));
    } catch (err) {
      console.error("Dismiss failed:", err);
    } finally {
      setProcessingId(null);
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
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> COMMAND CENTER
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-4">
           <div className="flex items-center gap-3 text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] italic mb-2">
             <ShieldAlert size={14} /> Safety Protocol
           </div>
           <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic font-display leading-[0.8] uppercase">
             Moderation <br/><span className="text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">Hub.</span>
           </h1>
           <p className="text-gray-500 font-bold mt-4 max-w-lg italic">
             Review flagged frequencies and protect the integrity of the Waymaker ecosystem.
           </p>
        </div>

        {/* Reports Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 glass rounded-[3rem] border border-white/5">
            <Loader2 className="animate-spin text-amber-500" size={48} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Scanning reports...</p>
          </div>
        ) : reports.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">
            {reports.map((report) => (
              <div 
                key={report.id} 
                className="glass-dark rounded-[3.5rem] border border-amber-500/10 p-10 relative overflow-hidden group"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                   {/* Info Column */}
                   <div className="lg:col-span-4 space-y-6">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Case: {report.id.slice(0,8)}</p>
                        <div className="flex items-center gap-2 text-amber-500">
                           <AlertTriangle size={16} />
                           <span className="text-xs font-black uppercase tracking-widest italic">{report.reason}</span>
                        </div>
                      </div>

                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                               <User size={16} className="text-gray-500" />
                            </div>
                            <div>
                               <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Reporter</p>
                               <p className="text-xs font-black">{report.profiles?.name || 'Anonymous'}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            </div>
                            <div>
                               <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Flagged Account</p>
                               <p className="text-xs font-black">{report.target?.name || 'Unknown'}</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Content Preview Column */}
                   <div className="lg:col-span-5 flex items-center">
                      {report.proof_id ? (
                        <div className="w-full h-48 bg-black rounded-3xl border border-white/5 relative overflow-hidden group flex flex-col items-center justify-center">
                           {report.proofs?.video_url ? (
                             <video 
                               src={report.proofs.video_url} 
                               className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                               controls 
                               crossOrigin="anonymous"
                             />
                           ) : (
                             <>
                               <Film size={32} className="text-gray-800 mb-2" />
                               <p className="text-[10px] font-black text-gray-600 uppercase tracking-tighter italic">Proof Lost (Deleted?)</p>
                             </>
                           )}
                           <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                              <p className="text-[8px] font-black uppercase tracking-widest">{report.proofs?.title || 'Unknown Video'}</p>
                           </div>
                        </div>
                      ) : report.jobs ? (
                        <div className="w-full bg-[#13EC6A]/5 rounded-3xl border border-[#13EC6A]/20 p-8 space-y-4">
                           <div className="flex items-center gap-3 text-[#13EC6A]">
                              <Briefcase size={20} />
                              <p className="text-[10px] font-black uppercase tracking-widest italic">Flagged Gig Listing</p>
                           </div>
                           <h4 className="text-xl font-black italic uppercase font-display text-white">{report.jobs.title}</h4>
                           <div className="flex flex-wrap gap-4 text-[9px] font-black uppercase tracking-widest text-gray-500">
                              <span className="bg-white/5 px-3 py-1 rounded-md border border-white/5">{report.jobs.trade}</span>
                              <span className="bg-white/5 px-3 py-1 rounded-md border border-white/5">{report.jobs.location}</span>
                              <span className="text-[#13EC6A]">{report.jobs.budget}</span>
                           </div>
                           <p className="text-[10px] text-gray-400 font-bold italic line-clamp-2">&quot;{report.jobs.description}&quot;</p>
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-white/[0.02] rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center">
                           <User size={32} className="text-gray-800 mb-2" />
                           <p className="text-[10px] font-black text-gray-600 uppercase tracking-tighter italic">Profile Level Flag</p>
                        </div>
                      )}
                   </div>

                    <div className="lg:col-span-3 flex flex-col justify-center gap-3">
                      {report.proof_id && (
                        <button 
                           onClick={() => handleDeleteVideo(report)}
                           disabled={!!processingId}
                           className="w-full bg-red-500/10 text-red-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3 italic"
                        >
                           {processingId === report.id ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                           Purge Video
                        </button>
                      )}

                      {report.jobs && (
                        <button 
                           onClick={() => handleTakedownGig(report)}
                           disabled={!!processingId}
                           className="w-full bg-red-500/10 text-red-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3 italic"
                        >
                           {processingId === report.id ? <Loader2 className="animate-spin" size={14} /> : <Briefcase size={14} />}
                           Takedown Gig
                        </button>
                      )}

                      <button 
                         onClick={() => handleDismiss(report)}
                         disabled={!!processingId}
                         className="w-full glass text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3 italic"
                      >
                         Dismiss Flag
                      </button>

                      <div className="mt-4 p-4 text-[8px] font-bold text-gray-600 border border-white/5 rounded-2xl text-center italic">
                         Note: Purging a video permanently removes it from the Maker&apos;s profile and storage.
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 gap-6 glass rounded-[3rem] border border-white/5 opacity-50">
             <CheckCircle2 size={48} className="text-[#13EC6A]" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 italic">Clear Grid. No Active Conflicts.</p>
          </div>
        )}

      </div>
    </div>
  );
}
