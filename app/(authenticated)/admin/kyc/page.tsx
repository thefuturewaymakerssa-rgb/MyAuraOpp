"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  ShieldCheck, 
  XSquare, 
  User, 
  Clock, 
  Search, 
  Filter, 
  Loader2, 
  ArrowLeft,
  ExternalLink,
  Info,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminKYCPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    fetchPendingUsers();
  }, [filter]);

  async function fetchPendingUsers() {
    setLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from('profiles')
        .select('*')
        .not('id_selfie', 'is', null);

      if (filter === "pending") {
        query = query.eq('identity_verified', false);
      } else if (filter === "verified") {
        query = query.eq('identity_verified', true);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching KYC queue:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleVerify = async (userId: string) => {
    if (!confirm("Are you sure you want to approve this identity? This allows the user to perform high-value transactions.")) return;

    setProcessingId(userId);
    try {
      const supabase = createClient();
      const { error } = await (supabase.from('profiles') as any)
        .update({ identity_verified: true })
        .eq('id', userId);

      if (error) throw error;

      toast.success("Identity Verified Successfully! 🛡️");
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      console.error("Verification failed:", err);
      toast.error("Error approving identity.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    const reason = prompt("Enter reason for rejection (this will be sent to the user):");
    if (!reason) return;

    setProcessingId(userId);
    try {
      const supabase = createClient();
      
      // For rejection, we keep identity_verified = false but we might notify the user.
      // In a real app, we might also clear the id_selfie to allow them to re-upload.
      const { error } = await (supabase.from('profiles') as any)
        .update({ identity_verified: false })
        .eq('id', userId);

      if (error) throw error;

      // Notify the user via the notifications table
      await (supabase.from('notifications') as any).insert({
        user_id: userId,
        message: `🛡️ Identity Verification Rejected: ${reason}. Please re-upload your document in settings.`,
        type: 'verification_update'
      });

      toast.info("Identity Rejected. User notified.");
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      console.error("Rejection failed:", err);
      toast.error("Error rejecting identity.");
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
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[10px] font-black text-[#13EC6A] uppercase tracking-[0.4em] italic mb-2">
              <ShieldCheck size={14} /> Identity Protocol
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic font-display leading-[0.8] uppercase">
              KYC <br/><span className="text-[#13EC6A] drop-shadow-[0_0_15px_rgba(19,236,106,0.3)]">Desk.</span>
            </h1>
          </div>

          <div className="flex gap-4 p-2 bg-white/5 rounded-2xl border border-white/5">
             {['pending', 'verified', 'all'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-[#13EC6A] text-[#052210] shadow-glow' : 'text-gray-500 hover:text-white'}`}
                >
                  {t}
                </button>
             ))}
          </div>
        </div>

        {/* Search Bar Placeholder */}
        <div className="relative group">
           <div className="absolute inset-y-0 left-8 flex items-center text-gray-600 group-focus-within:text-[#13EC6A] transition-colors">
              <Search size={20} />
           </div>
           <input 
             type="text" 
             placeholder="SEARCH BY IDENTITY ID OR NAME..."
             className="w-full bg-white/5 border-2 border-white/5 rounded-[2.5rem] py-8 pl-20 pr-10 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-[#13EC6A]/30 transition-all italic placeholder:text-gray-700"
           />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 glass rounded-[3rem] border border-white/5">
            <Loader2 className="animate-spin text-[#13EC6A]" size={48} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Validating bio-records...</p>
          </div>
        ) : users.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">
            {users.map((user) => (
              <div 
                key={user.id} 
                className="glass-dark rounded-[3.5rem] border border-white/5 p-10 relative overflow-hidden group hover:border-[#13EC6A]/20 transition-all"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                   
                   {/* Identity Info */}
                   <div className="lg:col-span-3 space-y-6">
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-gray-400 border border-white/5 text-2xl font-black italic">
                            {user.name?.[0] || <User size={24} />}
                         </div>
                         <div>
                            <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest">ID Reference</p>
                            <h3 className="text-xl font-black italic uppercase font-display leading-none">{user.name || 'Anonymous'}</h3>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <div className="flex items-center gap-3 text-gray-500">
                            <Clock size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest italic">Applied: {new Date(user.updated_at).toLocaleDateString()}</span>
                         </div>
                         <div className="flex items-center gap-3 text-amber-500/80">
                            <AlertCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest italic">{user.id_selfie ? 'Evidence Uploaded' : 'Waiting for Upload'}</span>
                         </div>
                      </div>
                   </div>

                   {/* Verification Evidence */}
                   <div className="lg:col-span-6">
                      <div className="w-full aspect-video bg-black rounded-[2.5rem] border border-white/10 relative overflow-hidden group cursor-zoom-in">
                         {user.id_selfie ? (
                           <>
                             <img 
                               src={user.id_selfie} 
                               alt="KYC ID Selfie" 
                               className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                               crossOrigin="anonymous"
                             />
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                <Link 
                                  href={user.id_selfie} 
                                  target="_blank" 
                                  className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20"
                                >
                                   <ExternalLink size={24} />
                                </Link>
                             </div>
                           </>
                         ) : (
                           <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-800 italic uppercase">
                              <Info size={40} />
                              <p className="text-[10px] font-black tracking-widest">No Document Found</p>
                           </div>
                         )}
                         <div className="absolute top-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                            <p className="text-[8px] font-black uppercase tracking-widest">Legal Document Verification Image</p>
                         </div>
                      </div>
                   </div>

                   {/* Actions */}
                   <div className="lg:col-span-3 flex flex-col gap-4">
                      <button 
                         onClick={() => handleVerify(user.id)}
                         disabled={!!processingId}
                         className="w-full bg-[#13EC6A] text-[#052210] py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-glow hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center gap-3 italic"
                      >
                         {processingId === user.id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                         Approve Identity
                      </button>

                      <button 
                         onClick={() => handleReject(user.id)}
                         disabled={!!processingId}
                         className="w-full glass text-red-500 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-red-500/20 hover:bg-red-500/10 transition-all flex items-center justify-center gap-3 italic"
                      >
                         {processingId === user.id ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                         Reject Applicant
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 gap-8 glass rounded-[3rem] border border-white/5 opacity-50">
             <div className="w-24 h-24 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <CheckCircle2 size={56} />
             </div>
             <div className="text-center space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.5em] text-gray-400 italic">Queue Empty.</p>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 italic">No pending identity dossiers detected.</p>
             </div>
          </div>
        )}

        {/* Admin Note */}
        <div className="p-8 bg-white/[0.02] rounded-[2.5rem] border border-white/5 text-center">
           <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest leading-loose italic">
              PRIVACY NOTICE: YOU ARE VIEWING SENSITIVE PERSONAL IDENTIFICATION DATA. <br/>
              ALL ACTIONS ARE RECORDED IN THE PERMANENT AUDIT LOG. DATA IS ENCRYPTED AT REST.
           </p>
        </div>

      </div>
    </div>
  );
}
