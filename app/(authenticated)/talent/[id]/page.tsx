"use client";

import { User, ShieldCheck, MapPin, Video, Zap, Star, Globe, MessageSquare, Briefcase, Loader2, Play, Heart, MessageCircle, Lock, ShieldAlert, Wrench } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { VerificationBadge, VerificationTier } from "@/components/VerificationBadge";
import { createConversation } from "@/lib/actions/messages";
import { useRouter } from "next/navigation";
import { getReviews, submitReview } from "@/lib/actions/reviews";
import { reportsHub } from "@/lib/supabase-helpers";
import { formatProfileRole, getRoleTheme } from "@/lib/user-helpers";
import { toast } from "sonner";

interface MakerData {
  id: string;
  name: string;
  trade: string;
  location: string;
  bio: string;
  verification_tier: string;
  reliability_score: number;
  recommended_tools?: Array<{
    name: string;
    brand?: string;
    price?: string;
    affiliate_url: string;
    image_url?: string;
  }>;
}

interface Proof {
  id: string;
  video_url: string;
  title: string;
  created_at: string;
}

export default function PublicTalentProfile({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [maker, setMaker] = useState<MakerData | null>(null);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"proofs" | "reviews" | "about">("proofs");

  useEffect(() => {
    async function fetchProfile() {
      // Validate UUID format to prevent Postgres 22P02 errors on invalid dynamic routes (e.g., /talent/verification)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
         setLoading(false);
         setMaker(null);
         return;
      }

      const supabase = createClient();
      
      // 1. Fetch Maker
      const { data: makerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (makerData) setMaker(makerData as any);

      // 2. Fetch Proofs
      const { data: proofsData } = await supabase
        .from('proofs')
        .select('*')
        .eq('maker_id', id)
        .order('created_at', { ascending: false });
      
      if (proofsData) setProofs(proofsData as any[]);

      // 3. Fetch Reviews
      const reviewsData = await getReviews(id);
      setReviews(reviewsData);

      setLoading(false);
    }
    fetchProfile();
  }, [id]);

  const handleMessage = async () => {
    try {
      const conv = await createConversation(id);
      router.push(`/messages/${(conv as any).id}`);
    } catch (err) {
      console.error(err);
      toast.info("Please login to message makers.");
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#0D110F] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#13EC6A]" size={48} />
      </div>
    );
  }

  if (!maker) {
    return (
      <div className="h-screen bg-[#0D110F] flex flex-col items-center justify-center text-white p-10 text-center">
        <h1 className="text-4xl font-black italic mb-4 font-display">Talent Not Found.</h1>
        <Link href="/feed" className="text-[#13EC6A] font-black uppercase tracking-widest hover:underline">Go Back Discovery</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D110F] text-white font-body p-8 lg:p-20 relative overflow-hidden">
      {/* Decorative Blurs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#13EC6A]/5 rounded-full blur-[150px] pointer-events-none opacity-40" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none opacity-40" />

      <div className="max-w-6xl mx-auto space-y-20 relative z-10">
        {/* Profile Header */}
        <section className="flex flex-col md:flex-row gap-16 items-center md:items-start text-center md:text-left">
          <div className="relative group">
            <div className="w-64 h-64 rounded-[4rem] bg-[#13EC6A] flex items-center justify-center text-8xl font-black italic font-display text-[#052210] shadow-glow transform group-hover:rotate-6 transition-transform">
              {maker.name[0]}
            </div>
            <div className="absolute -bottom-6 -right-6">
              <VerificationBadge tier={maker.verification_tier as any} score={maker.reliability_score} />
            </div>
            {/* Role Badge Overlay */}
            <div className={`absolute -top-3 -right-3 px-5 py-2 ${getRoleTheme((maker as any).role).bg} ${getRoleTheme((maker as any).role).text} text-[9px] font-black italic uppercase tracking-widest rounded-full shadow-lg border-2 border-white z-20`}>
                {formatProfileRole((maker as any).role)}
            </div>
          </div>

          <div className="flex-1 space-y-8">
            <div className="flex flex-col gap-4">
              <h1 className="text-7xl md:text-8xl font-black italic tracking-tighter font-display uppercase leading-tight">
                {maker.name.split(' ')[0]} <br/>
                <span className="text-[#13EC6A] drop-shadow-glow">{maker.trade}.</span>
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-gray-400 font-bold uppercase tracking-widest text-xs italic">
                <span className="flex items-center gap-2 bg-white/5 px-6 py-2 rounded-full border border-white/5"><MapPin size={16} className="text-[#13EC6A]" /> {maker.location}</span>
                <span className="flex items-center gap-2 bg-white/5 px-6 py-2 rounded-full border border-white/5 text-[#13EC6A]"><Star size={16} fill="currentColor" /> {maker.reliability_score} Integrity</span>
              </div>
            </div>

            <p className="max-w-2xl text-2xl text-gray-400 font-medium leading-relaxed italic">
              &quot;{maker.bio || 'Professional artisan dedicated to high-quality work and reliable service. Check my video proofs below.'}&quot;
            </p>

            <div className="flex flex-col sm:flex-row gap-6 pt-6 justify-center md:justify-start">
              <button 
                onClick={handleMessage}
                className="px-16 py-8 bg-[#13EC6A] text-[#052210] font-black text-xl rounded-[2.5rem] flex items-center justify-center gap-4 hover:scale-110 active:scale-95 transition-all shadow-glow uppercase tracking-widest italic border-b-8 border-black/10"
              >
                <MessageSquare size={24} /> MESSAGE ME
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Profile link copied!");
                }}
                className="px-12 py-8 glass rounded-[2.5rem] flex items-center justify-center font-black text-xs uppercase tracking-widest text-white/70 hover:text-white transition-all"
              >
                <Globe size={20} className="mr-3" /> Share Profile
              </button>
              <button 
                onClick={async () => {
                  const reason = prompt("Why are you reporting this profile? (e.g. Inappropriate content, Scam, etc.)");
                  if (reason) {
                    try {
                      const supabase = createClient();
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) throw new Error("Login required");

                      await reportsHub.insert({
                        reporter_id: user.id,
                        target_id: id,
                        reason: reason,
                        status: 'pending'
                      });
                      toast.info("Ziyakhala! 🛡️ Safety team notified. We will review this profile immediately.");
                    } catch (err) {
                      console.error("Report failed:", err);
                      toast.info("Login to report profiles.");
                    }
                  }
                }}
                className="px-8 py-8 glass rounded-[2.5rem] flex items-center justify-center font-black text-xs uppercase tracking-widest text-red-500/50 hover:text-red-500 transition-all border border-red-500/10 hover:border-red-500/30"
              >
                <ShieldAlert size={20} />
              </button>
            </div>
          </div>
        </section>

        {/* Tab Switcher */}
        <div className="flex gap-8 border-b border-white/5 pb-6">
           <button 
             onClick={() => setActiveTab("proofs")}
             className={`text-2xl font-black italic uppercase tracking-tighter transition-all ${activeTab === "proofs" ? "text-white" : "text-gray-600 hover:text-gray-400"}`}
           >
              Video Proofs ({proofs.length})
           </button>
           <button 
             onClick={() => setActiveTab("about")}
             className={`text-2xl font-black italic uppercase tracking-tighter transition-all ${activeTab === "about" ? "text-white" : "text-gray-600 hover:text-gray-400"}`}
           >
              About Me
           </button>
           <button 
             onClick={() => setActiveTab("reviews")}
             className={`text-2xl font-black italic uppercase tracking-tighter transition-all ${activeTab === "reviews" ? "text-white" : "text-gray-600 hover:text-gray-400"}`}
           >
              Community Feed ({reviews.length})
           </button>
        </div>

        {activeTab === "proofs" ? (
          <section className="space-y-12">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {proofs.length > 0 ? proofs.map(proof => (
                  <div key={proof.id} className="aspect-[9/16] glass rounded-[3rem] relative overflow-hidden group border border-white/5 cursor-pointer">
                     <video src={proof.video_url} className="absolute inset-0 w-full h-full object-cover" muted loop crossOrigin="anonymous" onMouseOver={e => (e.target as any).play()} onMouseOut={e => (e.target as any).pause()} />
                     <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-all pointer-events-none" />
                     <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-3xl group-hover:scale-125 transition-transform shadow-glow">
                           <Play size={32} className="text-[#13EC6A]" fill="currentColor" />
                        </div>
                     </div>
                     <div className="absolute bottom-10 left-10 z-20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#13EC6A] mb-2 italic">Proof Clip</p>
                        <h4 className="text-2xl font-black italic uppercase font-display tracking-tight text-glow">{proof.title || "The Hustle."}</h4>
                     </div>
                  </div>
                )) : (
                  <div className="col-span-full py-20 glass rounded-[3rem] border border-dashed border-white/10 flex flex-col items-center justify-center opacity-40">
                     <Video size={64} className="mb-6" />
                     <p className="text-xl font-bold italic">No video proofs uploaded yet.</p>
                  </div>
                )}
             </div>
          </section>
        ) : activeTab === "about" ? (
          <section className="space-y-12 max-w-3xl">
             <div className="glass p-12 rounded-[3rem] border border-white/5 space-y-8">
                <h3 className="text-4xl font-black italic font-display uppercase text-[#13EC6A]">My Story.</h3>
                <p className="text-xl text-gray-300 font-medium leading-relaxed italic">
                   {maker.bio || "No detailed bio provided yet. Just a hustler making magic happen in the streets."}
                </p>
                <div className="pt-8 grid grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Background</p>
                      <p className={`text-xl font-black italic font-display ${getRoleTheme((maker as any).role).lightText}`}>{formatProfileRole((maker as any).role)}</p>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Trade</p>
                      <p className="text-xl font-black italic font-display">{maker.trade}</p>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Location</p>
                      <p className="text-xl font-black italic font-display">{maker.location}</p>
                   </div>
                </div>
             </div>
          </section>
        ) : (
          <section className="space-y-12 min-h-[400px]">
             {reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   {reviews.map(review => (
                     <div key={review.id} className="glass p-10 rounded-[3rem] border border-white/5 relative group">
                        <div className="flex justify-between items-start mb-6">
                           <div className="flex gap-4 items-center">
                              <div className="w-12 h-12 rounded-2xl bg-[#13EC6A]/10 flex items-center justify-center text-[#13EC6A] font-black italic">
                                 {review.profiles?.name?.[0] || 'U'}
                              </div>
                              <div>
                                 <p className="font-black text-sm uppercase tracking-widest">{review.profiles?.name || 'Anonymous Client'}</p>
                                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{new Date(review.created_at).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} className={i < review.rating ? "text-amber-400" : "text-gray-800"} fill={i < review.rating ? "currentColor" : "none"} />
                              ))}
                           </div>
                        </div>
                        <p className="text-lg text-gray-300 font-medium italic leading-relaxed">
                           &quot;{review.comment}&quot;
                        </p>
                     </div>
                   ))}
                </div>
             ) : (
                <div className="py-20 glass rounded-[3rem] border border-dashed border-white/10 flex flex-col items-center justify-center opacity-40">
                   <MessageCircle size={64} className="mb-6" />
                   <p className="text-xl font-bold italic">No community feedback yet. Be the first!</p>
                </div>
             )}

             {/* Review Prompt Reminder */}
             <div className="p-8 bg-[#13EC6A]/5 rounded-[2.5rem] border border-[#13EC6A]/20 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 rounded-2xl bg-[#13EC6A]/10 flex items-center justify-center text-[#13EC6A]">
                      <Lock size={32} />
                   </div>
                   <div>
                      <h4 className="text-xl font-black italic">Hired {maker.name.split(' ')[0]} before?</h4>
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Only confirmed employers can leave a public vouch.</p>
                   </div>
                </div>
                 <button 
                   onClick={async () => {
                     const rating = prompt("Rate their energy (1-5):", "5");
                     if (!rating || isNaN(parseInt(rating))) return;
                     
                     const comment = prompt("Tell the community about their hustle:");
                     if (!comment) return;

                     try {
                        const supabase = createClient();
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) throw new Error("Login required");

                        await submitReview({
                          maker_id: id,
                          reviewer_id: user.id,
                          rating: parseInt(rating),
                          comment: comment
                        });
                        toast.info("Vouch saved! 🇿🇦 The community thanks you.");
                        window.location.reload();
                     } catch (err) {
                        toast.error("Account required to vouch.");
                     }
                   }}
                   className="bg-[#13EC6A] text-[#052210] px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 hover:scale-105 transition-all shadow-glow"
                 >
                    VOUCH FOR SKILLS
                 </button>
             </div>
          </section>
        )}
        
        {/* The Toolbox - Affiliate section */}
        <section className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
               <div className="space-y-4">
                  <div className="flex items-center gap-3 text-[#13EC6A]">
                     <Wrench size={24} className="drop-shadow-glow" />
                     <span className="text-[10px] font-black uppercase tracking-[0.4em]">The Setup</span>
                  </div>
                  <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter font-display uppercase leading-none">The Toolbox.</h2>
               </div>
               <p className="text-gray-500 font-bold max-w-sm text-sm uppercase tracking-widest leading-relaxed">
                  Recommended gear for the {maker.trade} hustle. (Affiliate links)
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {(maker.recommended_tools && maker.recommended_tools.length > 0) ? maker.recommended_tools.map((tool, idx) => (
                 <div key={idx} className="glass p-8 rounded-[3rem] border border-white/5 group hover:border-[#13EC6A]/30 transition-all">
                    <div className="aspect-square bg-white/5 rounded-[2.5rem] mb-8 flex items-center justify-center border border-white/5 overflow-hidden group-hover:scale-95 transition-transform">
                       {tool.image_url ? (
                         <img src={tool.image_url} alt={tool.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                       ) : (
                         <Wrench size={48} className="text-gray-700" />
                       )}
                    </div>
                    <div className="space-y-2 mb-8">
                       <h4 className="text-2xl font-black italic font-display tracking-tight text-glow">{tool.name}</h4>
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{tool.brand || 'Professional Grade'} • {tool.price || 'R999+'}</p>
                    </div>
                    <button 
                      onClick={() => window.open(tool.affiliate_url, "_blank")}
                      className="w-full py-4 bg-white/5 hover:bg-[#13EC6A] hover:text-[#052210] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-white/10"
                    >
                       Get This Gear
                    </button>
                 </div>
               )) : (
                 // Mocked toolbox if none in DB to show the vibe
                 [
                   { name: "Heavy Duty Drill", brand: "Bosch Professional", price: "R1,499", url: "https://amazon.com" },
                   { name: "Safety Master Kit", brand: "3M Security", price: "R850", url: "https://amazon.com" },
                   { name: "Digital Multi-meter", brand: "Fluke", price: "R2,200", url: "https://amazon.com" },
                   { name: "Tradesman Bag", brand: "ToughBuilt", price: "R1,100", url: "https://amazon.com" }
                 ].map((t, i) => (
                    <div key={i} className="glass p-8 rounded-[3rem] border border-white/5 group hover:border-[#13EC6A]/30 transition-all opacity-80 hover:opacity-100">
                       <div className="aspect-square bg-white/5 rounded-[2.5rem] mb-8 flex items-center justify-center border border-white/5 group-hover:scale-95 transition-transform relative">
                          <Wrench size={48} className="text-white/5" />
                          <div className="absolute inset-0 flex items-center justify-center">
                             <Zap size={32} className="text-[#13EC6A] opacity-20 group-hover:opacity-100 transition-opacity" />
                          </div>
                       </div>
                       <div className="space-y-2 mb-8">
                          <h4 className="text-2xl font-black italic font-display tracking-tight text-glow">{t.name}</h4>
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t.brand} • {t.price}</p>
                       </div>
                       <button className="w-full py-4 bg-white/5 hover:bg-[#13EC6A] hover:text-[#052210] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-white/10">
                          Get This Gear
                       </button>
                    </div>
                 ))
               )}
            </div>
        </section>

        {/* Expertise Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-32">
           <ExpertiseCard title={maker.trade} level="Expert" icon={<Zap className="text-yellow-400" />} />
           <ExpertiseCard title="Reliability" level="Verified" icon={<Star className="text-[#13EC6A]" />} />
           <ExpertiseCard title="Availability" level="Open" icon={<ShieldCheck className="text-indigo-500" />} />
        </section>
      </div>
    </div>
  );
}

function ExpertiseCard({ title, level, icon }: { title: string, level: string, icon: React.ReactNode }) {
  return (
    <div className="glass p-10 rounded-[3rem] border border-white/5 hover:border-white/10 transition-all group">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h4 className="text-2xl font-black italic tracking-tight font-display uppercase mb-2">{title}</h4>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">{level}</p>
    </div>
  );
}
