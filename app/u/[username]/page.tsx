"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Play, MapPin, MessageSquare, Share2, Zap, Star, ShieldCheck, 
  Video, MessageCircle, Wrench, ArrowRight, ArrowLeft, Gem, Briefcase, Sparkles
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VerificationBadge } from "@/components/VerificationBadge";
import { createConversation } from "@/lib/actions/messages";
import { getReviews, submitReview } from "@/lib/actions/reviews";
import { toast } from "sonner";

interface Maker {
  id: string;
  name: string;
  trade: string;
  location: string;
  bio: string;
  skills: string[] | null;
  verification_tier: string;
  reliability_score: number;
  hourly_rate: number | null;
  is_verified: boolean;
  identity_verified: boolean;
  recommended_tools?: Array<{
    name: string;
    brand?: string;
    price?: string;
    affiliate_url: string;
    image_url?: string;
  }>;
}

type Props = {
  params: Promise<{
    username: string;
  }>;
};

export default function CanonicalProfilePage({ params }: Props) {
  const resolvedParams = use(params);
  const identifier = resolvedParams.username;
  const router = useRouter();
  
  const [maker, setMaker] = useState<Maker | null>(null);
  const [proofs, setProofs] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"proofs" | "reviews" | "toolbox">("proofs");
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setSessionUser(user);
      
      let profileId = identifier;

      // 1. Try to find by username first
      const { data: profileByUsername } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', identifier)
        .single();
      
      if (profileByUsername) {
        profileId = (profileByUsername as any).id;
      }

      // 2. Fetch Maker Data
      const { data: makerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (makerData) {
        setMaker(makerData as any);
        
        const { data: proofsData } = await supabase
          .from('proofs')
          .select('*')
          .eq('maker_id', profileId)
          .order('created_at', { ascending: false });
        
        if (proofsData) setProofs(proofsData);

        const reviewsData = await getReviews(profileId);
        setReviews(reviewsData);
      }

      setLoading(false);
    }
    fetchProfile();
  }, [identifier]);

  const handleHire = async () => {
    if (!sessionUser) {
      toast.info("Sign in to hire verified talent. 🇿🇦");
      router.push(`/login?next=/u/${identifier}`);
      return;
    }
    router.push(`/employer/escrow/new?maker_id=${maker!.id}`);
  };

  const handleContact = async () => {
    if (!sessionUser) {
      toast.info("Sign in to message this maker. 🇿🇦");
      router.push(`/login?next=/u/${identifier}`);
      return;
    }
    if (!maker) return;
    setContactLoading(true);
    try {
      await createConversation(maker.id);
      router.push(`/messages`);
    } catch {
      toast.info("Could not start conversation. Please try again.");
    } finally {
      setContactLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    const text = `Check out ${maker?.name}'s VibeCV on Future WayMakers! Hire verified SA talent.\n${url}`;
    if (navigator.share) {
      navigator.share({ title: `Hire ${maker?.name}`, text, url }).catch(() => {
        navigator.clipboard.writeText(url);
        toast.success("Profile link copied! 🚀");
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Profile link copied! 🚀");
    }
  };

  if (loading) return (
    <div className="h-screen bg-[#F0FDFA] flex items-center justify-center text-[#0F766E] font-black italic tracking-tighter text-3xl font-display">
      <div className="flex flex-col items-center animate-pulse">
        <Sparkles size={48} className="mb-4" />
        Loading Profile...
      </div>
    </div>
  );

  if (!maker) return (
    <div className="h-screen bg-[#F0FDFA] flex flex-col items-center justify-center p-10 text-center text-[#0F172A]">
      <h1 className="text-6xl font-black italic mb-6 font-display uppercase tracking-tighter">Profile Not <br/><span className="text-[#0F766E]">Found.</span></h1>
      <Link href="/" className="px-8 py-4 bg-white text-[#0F766E] rounded-full border-2 border-[#E2E8F0] shadow-sm font-black uppercase tracking-[0.3em] hover:border-[#0F766E] transition-all text-[10px] italic">Return to Hub</Link>
    </div>
  );

  const featuredProof = proofs[0];
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  const isOwnProfile = sessionUser?.id === maker.id;

  return (
    <div className="min-h-screen bg-[#F0FDFA] text-[#0F172A] font-sans selection:bg-[#0F766E]/30 relative pb-40">
      {/* Ambient Light Background */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#0F766E]/10 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#8B5CF6]/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto min-h-screen flex flex-col px-6 pt-12 pb-32">
        
        {/* Top Header */}
        <div className="flex justify-between items-center mb-12">
          <button 
             onClick={() => router.back()} 
             className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-[#0F172A] hover:text-[#0F766E] border-2 border-[#E2E8F0] shadow-sm transition-all hover:scale-105 active:scale-95"
           >
             <ArrowLeft size={24} strokeWidth={2.5} />
           </button>

          <button 
            onClick={handleShare}
            className="px-6 py-4 bg-white rounded-full flex items-center font-black text-[10px] uppercase tracking-[0.3em] text-gray-500 border-2 border-[#E2E8F0] shadow-sm hover:text-[#0F766E] hover:border-[#0F766E]/30 hover:shadow-md transition-all italic"
          >
            <Share2 size={16} className="mr-3" /> Share Profile
          </button>
        </div>

        {/* Profile Identity Card */}
        <div className="bg-white p-10 md:p-14 rounded-[3.5rem] border-2 border-white shadow-[0_20px_60px_rgba(0,0,0,0.03)] relative overflow-hidden mb-12 group/card">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#0F766E]/5 rounded-full blur-[100px] group-hover/card:bg-[#0F766E]/10 transition-colors duration-1000" />
          
          <div className="flex flex-col md:flex-row gap-12 items-center md:items-start text-center md:text-left relative z-10">
            {/* Avatar */}
            <div className="relative shrink-0">
               <div className="absolute -inset-2 bg-gradient-to-br from-[#0F766E]/20 to-[#8B5CF6]/20 rounded-[3rem] blur-xl opacity-50" />
               <div className="w-40 h-40 rounded-[2.5rem] bg-gradient-to-br from-[#0F766E] to-[#0F766E]/80 flex items-center justify-center text-7xl font-black italic font-display text-white shadow-2xl shadow-[#0F766E]/30 relative z-10 border-4 border-white">
                 {maker.name?.[0]?.toUpperCase()}
               </div>
               <div className="absolute -bottom-4 -right-4 z-20 shadow-xl rounded-full">
                 <VerificationBadge tier={maker.verification_tier as any} score={maker.reliability_score} />
               </div>
            </div>

            {/* Identity Details */}
            <div className="flex-1 space-y-6">
              <h1 className="text-6xl md:text-[5rem] font-black italic tracking-tighter font-display uppercase leading-[0.85] text-[#0F172A]">
                {maker.name}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <span className="text-[#0F766E] font-black uppercase tracking-[0.4em] text-[10px] italic bg-[#F0FDFA] px-6 py-3 rounded-full border border-[#0F766E]/20 shadow-sm">
                  {maker.trade}
                </span>
                {maker.hourly_rate && (
                  <span className="text-gray-600 font-black uppercase tracking-[0.4em] text-[10px] italic bg-gray-50 px-6 py-3 rounded-full border border-gray-200 shadow-sm">
                    R{maker.hourly_rate}/hr
                  </span>
                )}
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 pt-4">
                <div className="flex items-center gap-2.5 text-gray-400 font-black uppercase tracking-widest text-[9px] italic">
                  <MapPin size={14} className="text-[#0F766E]" /> {maker.location || "South Africa"}
                </div>
                <div className="flex items-center gap-2.5 text-gray-400 font-black uppercase tracking-widest text-[9px] italic">
                  <Star size={14} fill="currentColor" className="text-amber-400" />
                  {avgRating ? `${avgRating} Rating` : `${maker.reliability_score ?? 100}% Trust`}
                </div>
                <div className="flex items-center gap-2.5 text-gray-400 font-black uppercase tracking-widest text-[9px] italic">
                  <Video size={14} className="text-indigo-400" /> {proofs.length} Proof{proofs.length !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-2.5 text-gray-400 font-black uppercase tracking-widest text-[9px] italic">
                  <ShieldCheck size={14} className="text-[#0F766E]" /> {reviews.length} Review{reviews.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {maker.bio && (
            <p className="text-lg text-gray-500 font-bold italic leading-relaxed mt-12 border-t-2 border-gray-50 pt-10 relative z-10">
              &quot;{maker.bio}&quot;
            </p>
          )}

          {/* Skills Tags */}
          {maker.skills && maker.skills.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-10 relative z-10">
              {maker.skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-5 py-2.5 bg-white rounded-full text-[9px] font-black uppercase tracking-[0.3em] border-2 border-[#E2E8F0] text-gray-400 hover:border-[#0F766E]/40 hover:text-[#0F766E] transition-all cursor-default italic"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Own Profile Edit Link */}
          {isOwnProfile && (
            <div className="mt-10 pt-8 border-t-2 border-gray-50 relative z-10">
              <Link
                href="/talent/dashboard"
                className="inline-flex items-center gap-3 px-6 py-3 bg-[#F0FDFA] rounded-full text-[9px] font-black uppercase tracking-[0.4em] text-[#0F766E] hover:bg-[#0F766E] hover:text-white transition-all italic border border-[#0F766E]/10"
              >
                ✏️ Edit Protocol
              </Link>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto gap-4 border-b-2 border-gray-200 pb-5 mb-10 hide-scrollbar">
          {(["proofs", "reviews", "toolbox"] as const).map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[10px] font-black italic uppercase tracking-[0.4em] transition-all whitespace-nowrap px-8 py-4 rounded-full border-2 ${
                activeTab === tab 
                  ? "bg-[#0F766E] text-white border-transparent shadow-xl shadow-[#0F766E]/20" 
                  : "bg-white text-gray-400 border-[#E2E8F0] hover:text-[#0F766E] hover:border-[#0F766E]/30"
              }`}
            >
              {tab === "proofs" && `Proofs (${proofs.length})`}
              {tab === "reviews" && `Reviews (${reviews.length})`}
              {tab === "toolbox" && `Loadout`}
            </button>
          ))}
        </div>

        {/* === PROOFS TAB === */}
        {activeTab === "proofs" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {proofs.length > 0 ? proofs.map(proof => (
              <div key={proof.id} className="aspect-[3/4.5] bg-white rounded-[2.5rem] relative overflow-hidden group border-2 border-white cursor-pointer shadow-lg shadow-gray-200/50 hover:shadow-2xl hover:border-[#0F766E]/30 transition-all duration-500">
                {proof.video_url ? (
                  <video 
                    src={proof.video_url} 
                    className="absolute inset-0 w-full h-full object-cover" 
                    muted loop playsInline 
                    crossOrigin="anonymous"
                    onMouseOver={e => (e.target as HTMLVideoElement).play()} 
                    onMouseOut={e => (e.target as HTMLVideoElement).pause()} 
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
                    <Video size={40} className="text-gray-300" />
                  </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none opacity-80" />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                  <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-md border border-white/50 shadow-2xl">
                    <Play size={24} className="text-white ml-1" fill="currentColor" />
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 z-20">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic drop-shadow-md line-clamp-2 leading-snug">{proof.title || "The Work."}</p>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-32 bg-white rounded-[3.5rem] border-2 border-dashed border-[#E2E8F0] flex flex-col items-center justify-center text-center px-6 shadow-sm">
                <div className="w-24 h-24 bg-[#F0FDFA] rounded-[2rem] flex items-center justify-center mb-8"><Video size={40} className="text-[#0F766E]/50" /></div>
                <p className="text-3xl font-black uppercase italic tracking-tighter text-gray-300 font-display">No Visual<br/>Evidence.</p>
                {isOwnProfile && (
                  <Link href="/talent/studio/record" className="mt-10 px-10 py-5 bg-[#0F766E] text-white rounded-full font-black text-[10px] uppercase tracking-[0.4em] hover:scale-105 active:scale-95 shadow-xl shadow-[#0F766E]/30 transition-all italic">
                    Record Protocol
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* === REVIEWS TAB === */}
        {activeTab === "reviews" && (
          <div className="space-y-8">
            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {reviews.map(review => (
                  <div key={review.id} className="bg-white p-10 rounded-[3rem] border-2 border-white shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:border-[#E2E8F0] transition-colors">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-xl bg-[#F0FDFA] flex items-center justify-center text-[#0F766E] font-black italic text-xl shadow-sm border border-[#0F766E]/10">
                          {review.reviewer?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-black text-[10px] uppercase tracking-[0.3em] leading-none mb-1.5 italic text-gray-800">{review.reviewer?.name || 'Anonymous'}</p>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{new Date(review.created_at).toLocaleDateString('en-ZA')}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} className={i < review.rating ? "text-amber-400" : "text-gray-200"} fill={i < review.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 font-bold italic leading-relaxed">
                      &quot;{review.comment}&quot;
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-32 bg-white rounded-[3.5rem] border-2 border-dashed border-[#E2E8F0] flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-8"><MessageCircle size={40} className="text-gray-300" /></div>
                <p className="text-3xl font-black uppercase italic tracking-tighter text-gray-300 font-display">No feedback.</p>
                <p className="text-[10px] text-gray-400 font-bold mt-4 uppercase tracking-[0.4em] italic">Awaiting community verification.</p>
              </div>
            )}

            {/* Vouch / Review Form */}
            {sessionUser && sessionUser.id !== maker.id && (
              <button 
                onClick={async () => {
                   const promptRating = () => {
                      const val = prompt("Rate their hustle (1–5) - Number only:", "5");
                      return val ? parseInt(val) : 0;
                   };
                   let rating = promptRating();
                   while(rating < 1 || rating > 5 || isNaN(rating)) {
                      if(rating === 0) return; // Cancelled
                      rating = promptRating();
                   }
                  const comment = prompt("Tell the community about their energy and work:");
                  if (!comment?.trim()) return;
                  try {
                    await submitReview({ maker_id: maker.id, reviewer_id: sessionUser.id, rating: rating, comment });
                    toast.info("Vouch saved! 🇿🇦");
                    window.location.reload();
                  } catch { toast.error("Failed to save vouch. Try again."); }
                }}
                className="w-full py-6 mt-8 bg-white rounded-[2rem] border-2 border-[#0F766E]/20 text-[#0F766E] font-black text-[10px] uppercase tracking-[0.4em] hover:bg-[#F0FDFA] hover:border-[#0F766E] shadow-sm transition-all flex items-center justify-center gap-3 italic"
              >
                <ShieldCheck size={18} /> Add Vouch Protocol
              </button>
            )}
          </div>
        )}

        {/* === TOOLBOX TAB === */}
        {activeTab === "toolbox" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {(maker.recommended_tools && maker.recommended_tools.length > 0) ? maker.recommended_tools.map((tool, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[3rem] border-2 border-white shadow-[0_10px_40px_rgba(0,0,0,0.03)] group hover:border-[#E2E8F0] transition-all">
                <div className="aspect-square bg-gray-50 rounded-[2rem] mb-8 flex items-center justify-center border-2 border-[#E2E8F0] overflow-hidden">
                  {tool.image_url ? (
                    <img src={tool.image_url} alt={tool.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" crossOrigin="anonymous" />
                  ) : (
                    <Wrench size={40} className="text-gray-300 group-hover:text-[#0F766E] transition-colors" />
                  )}
                </div>
                <h4 className="text-2xl font-black italic font-display tracking-tight leading-tight mb-2 text-gray-800">{tool.name}</h4>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8 italic">{tool.brand || 'Pro Grade'} {tool.price && `• ${tool.price}`}</p>
                <button 
                  onClick={() => window.open(tool.affiliate_url, "_blank")}
                  className="w-full py-4 bg-gray-50 hover:bg-[#0F766E] hover:text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] transition-all text-gray-500 italic shadow-sm"
                >
                  Acquire Gear
                </button>
              </div>
            )) : (
              <div className="col-span-full py-32 bg-white rounded-[3.5rem] border-2 border-dashed border-[#E2E8F0] flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-8"><Wrench size={40} className="text-gray-300" /></div>
                <p className="text-3xl font-black uppercase italic tracking-tighter text-gray-300 font-display">No Loadout.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Bar (Not Own Profile) */}
      {!isOwnProfile && (
        <div className="fixed bottom-10 inset-x-0 p-6 z-[1000] pointer-events-none fade-in slide-in-from-bottom animate-in duration-700">
          <div className="max-w-md mx-auto flex gap-4 pointer-events-auto bg-white/80 backdrop-blur-3xl p-3 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] border-2 border-white">
            <button 
              onClick={handleContact}
              disabled={contactLoading}
              className="w-16 h-16 bg-white rounded-full border-2 border-[#E2E8F0] flex items-center justify-center text-gray-500 hover:border-[#0F766E] hover:text-[#0F766E] hover:shadow-lg transition-all shrink-0 ml-1"
            >
              <MessageSquare size={24} />
            </button>
            <button 
              onClick={handleHire}
              className="flex-1 h-16 bg-[#0F766E] text-white font-black text-[11px] rounded-[2.5rem] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_15px_30px_rgba(15,118,110,0.3)] uppercase tracking-[0.4em] italic outline outline-4 outline-[#F0FDFA] group mr-1"
            >
              <Briefcase size={20} />
              Initiate Hire
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Bar (Own Profile) */}
      {isOwnProfile && (
        <div className="fixed bottom-10 inset-x-0 p-6 z-[1000] pointer-events-none fade-in slide-in-from-bottom animate-in duration-700">
          <div className="max-w-md mx-auto pointer-events-auto">
            <Link
              href="/talent/dashboard"
              className="flex w-full h-16 bg-white/90 backdrop-blur-2xl border-2 border-[#0F766E]/20 text-[#0F766E] shadow-2xl font-black text-[10px] rounded-full items-center justify-center gap-3 hover:bg-[#F0FDFA] transition-all uppercase tracking-[0.4em] italic"
            >
              ✏️ Ops Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
