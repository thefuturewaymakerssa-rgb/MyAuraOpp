"use client";

import { useState, useEffect, use } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { 
  CheckCircle2, 
  Video, 
  Briefcase, 
  MapPin, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  Gem,
  Zap
} from "lucide-react";

type Proof = {
  id: string;
  title: string;
  video_url: string;
  created_at: string;
};

export default function ApplyJobPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const pathname = usePathname();
  const isImmersive = pathname?.includes("/studio") || pathname?.includes("/record") || pathname?.includes("/apply");
  const router = useRouter();
  const supabase = createClient();
  
  const [job, setJob] = useState<any>(null);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maker, setMaker] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login"); // Makers must be auth'd
          return;
        }

        // Fetch Maker profile
        const { data: makerData } = await (supabase
          .from('profiles')
          .select("id")
          .eq("id", user.id)
          .single() as any);
 
        if (!makerData) {
          router.push("/talent/onboarding");
          return;
        }
        setMaker(makerData);
 
        // Fetch Job details
        const { data: jobData } = await (supabase
          .from("jobs")
          .select("*")
          .eq("id", id)
          .single() as any);
        
        setJob(jobData);
 
        // Fetch Maker's proofs
        const { data: proofData } = await (supabase
          .from("proofs")
          .select("*")
          .eq("maker_id", (makerData as any).id) as any);
        
        setProofs(proofData || []);
        // Check if already applied
        const { data: existingApp } = await (supabase
          .from("job_applications")
          .select("status")
          .eq("maker_id", (makerData as any).id)
          .eq("job_id", id)
          .single() as any);
        
        if (existingApp) {
           setApplied(true);
           setApplicationStatus(existingApp.status);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, router]);

  const handleApply = async () => {
    if (!selectedProof || !maker || !job) return;

    setApplying(true);
    try {
      const { error } = await (supabase.from("job_applications") as any).insert({
        job_id: id,
        maker_id: maker.id,
        proof_id: selectedProof,
        status: "pending"
      });

      if (error) throw error;
      setApplied(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#111613] flex items-center justify-center font-display italic text-[#13EC6A] font-black text-2xl tracking-tighter">
      <Loader2 className="animate-spin text-[#13EC6A] mr-4 shadow-glow" size={48} />
      SHAPING...
    </div>
  );

  if (!job) return (
    <div className="min-h-screen bg-[#111613] text-white p-8 text-center flex flex-col items-center justify-center font-body">
      <AlertCircle size={64} className="text-red-500 mb-8 animate-pulse" />
      <h1 className="text-5xl font-black mb-6 tracking-tighter italic font-display">Work Call not found</h1>
      <Link href="/gigs" className="text-[#13EC6A] font-black uppercase tracking-widest text-xs underline decoration-2 underline-offset-8">Back to Gigs</Link>
    </div>
  );

  if (applied) return (
    <div className="min-h-screen bg-[#111613] text-white flex flex-col items-center justify-center px-6 font-body">
       <div className={`w-32 h-32 rounded-[3rem] flex items-center justify-center mb-12 border shadow-glow ${
         applicationStatus === 'accepted' ? 'bg-[#13EC6A]/10 text-[#13EC6A] border-[#13EC6A]/20' :
         applicationStatus === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
         'bg-blue-500/10 text-blue-500 border-blue-500/20'
       }`}>
         {applicationStatus === 'accepted' ? <CheckCircle2 size={80} className="drop-shadow-glow" /> :
          applicationStatus === 'rejected' ? <AlertCircle size={80} className="drop-shadow-glow" /> :
          <Loader2 size={80} className="drop-shadow-glow animate-spin-slow" />}
       </div>
       <h1 className="text-7xl font-black mb-6 tracking-tighter font-display italic text-glow text-center">
         {applicationStatus === 'accepted' ? "Hired!" : 
          applicationStatus === 'rejected' ? "Declined." : 
          "Applied!"}
       </h1>
       <p className="text-gray-400 font-bold text-center max-w-md mb-16 leading-relaxed">
         {applicationStatus === 'accepted' ? "The employer has accepted your VibeCV. They have generated a contract for you and will message you soon." :
          applicationStatus === 'rejected' ? "The employer decided to go with another candidate for this gig. Keep applying!" :
          "Your Video Proof has been sent to the employer. They will review it and contact you through Shapa's secure chat if you're a match."}
       </p>
       <div className="flex flex-col gap-6 w-full max-w-sm">
          {applicationStatus === 'accepted' ? (
             <Link href="/talent/contracts" className="bg-[#13EC6A] text-[#052210] py-8 rounded-[2.5rem] font-black text-[14px] text-center shadow-premium hover:scale-105 transition-all uppercase tracking-widest italic">View Active Contract</Link>
          ) : (
             <Link href="/gigs" className="bg-[#13EC6A] text-[#052210] py-8 rounded-[2.5rem] font-black text-[14px] text-center shadow-premium hover:scale-105 transition-all uppercase tracking-widest italic">Browse More Gigs</Link>
          )}
          <Link href="/talent/dashboard" className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px] text-center hover:text-white transition-all underline decoration-2 underline-offset-8">Return to Dashboard</Link>
       </div>
    </div>
  );

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 relative z-10 pb-[calc(100px+env(safe-area-inset-bottom))]">
      {/* Header (Minimalist) */}
      <div className="mb-12">
        <Link href={`/gigs/${id}`} className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#0F766E] transition-colors bg-white/5 px-6 py-3 rounded-full border border-white/10 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1.5 transition-transform" /> Gig Analysis
        </Link>
      </div>
        {/* Job Header */}
        <div className="glass-card p-10 sm:p-16 rounded-[4rem] border border-white/10 mb-20 overflow-hidden relative shadow-premium bg-[#0F172A]/50">
           <div className="absolute top-0 right-0 w-80 h-80 bg-[#0F766E]/10 rounded-full blur-[120px] pointer-events-none" />
           <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-6 mb-12">
                <span className="bg-[#0F766E]/20 text-[#13EC6A] px-6 py-2.5 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.3em] border border-[#0F766E]/30 italic shadow-glow">
                  {job.trade}
                </span>
                <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 italic"><MapPin size={18} className="text-[#0F766E]" /> {job.location}</span>
                <div className="ml-auto flex items-center gap-3">
                   <Gem size={20} className="text-[#8B5CF6]" />
                   <span className="text-[#13EC6A] font-black text-3xl italic tracking-tighter font-display drop-shadow-glow">{job.budget || "PROJECT CALL"}</span>
                </div>
              </div>
              <h1 className="text-6xl md:text-7xl font-black mb-8 tracking-tighter italic font-display text-white leading-[0.8] uppercase">{job.title}</h1>
              <p className="text-gray-400 font-bold text-xl leading-relaxed max-w-2xl italic opacity-70">{job.description}</p>
           </div>
        </div>

        {/* Application Form */}
        <div>
          <h2 className="text-3xl font-black mb-10 flex items-center gap-4 italic font-display tracking-tight text-glow">
            <Video size={40} className="text-[#13EC6A] drop-shadow-glow" />
            Attach Your Proof.
          </h2>

          {proofs.length === 0 ? (
            <div className="glass-dark border border-amber-500/20 p-12 rounded-[2.5rem] text-center shadow-premium">
               <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-500 mx-auto mb-8 border border-amber-500/20 shadow-glow">
                  <Video size={40} />
               </div>
               <p className="text-amber-200 text-xl font-black mb-8 italic font-display tracking-tight">Zero Proof Found.</p>
               <Link href="/talent/studio/record" className="w-full bg-[#13EC6A] text-[#052210] px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-glow hover:scale-105 transition-all">
                 Record Proof Now <ArrowLeft className="rotate-180" size={20} />
               </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
              {proofs.map(proof => (
                <button
                  key={proof.id}
                  onClick={() => setSelectedProof(proof.id)}
                  className={`p-8 rounded-[2.5rem] border text-left transition-all relative overflow-hidden group/card ${
                    selectedProof === proof.id 
                      ? "bg-[#13EC6A]/10 border-[#13EC6A] shadow-glow" 
                      : "glass-dark border-white/5 hover:border-white/20 shadow-premium"
                  }`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 border border-white/5 group-hover/card:scale-110 transition-transform">
                      <Video size={28} />
                    </div>
                    {selectedProof === proof.id && <CheckCircle2 size={32} className="text-[#13EC6A] drop-shadow-glow" />}
                  </div>
                  <h4 className="font-black text-2xl mb-2 tracking-tight italic font-display">{proof.title}</h4>
                  <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">Recorded {new Date(proof.created_at).toLocaleDateString()}</p>
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-8 text-sm font-bold">
              {error}
            </div>
          )}

          <button
            onClick={handleApply}
            disabled={applying || !selectedProof}
            className="w-full bg-[#13EC6A] text-[#052210] font-black text-2xl py-8 rounded-[2.5rem] flex items-center justify-center gap-4 hover:scale-105 transition-all shadow-premium disabled:opacity-50 uppercase tracking-widest border-b-8 border-black/20"
          >
            {applying ? (
              <Loader2 className="animate-spin" size={32} />
            ) : (
              <>Transmit Application <Zap size={32} className="drop-shadow-glow" /></>
            )}
          </button>
        </div>
    </div>
  );
}
