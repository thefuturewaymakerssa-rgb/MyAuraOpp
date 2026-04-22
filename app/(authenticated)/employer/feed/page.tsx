"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown, Heart, Bookmark, Send, ShieldCheck, Play, Loader2, Radar } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { buildWhatsAppUrl, buildMakerMessage } from "@/lib/whatsapp";
import Link from "next/link";
import WorkRadar from "@/components/WorkRadar";
import { getDistance, getCoordsForLocation } from "@/lib/locationUtils";
import { useGeolocation } from "@/hooks/useGeolocation";
import { savedMakersHub } from "@/lib/supabase-helpers";
import { toast } from "sonner";

import { Database } from "@/lib/database.types";

type Maker = Database['public']['Tables']['profiles']['Row'];

interface ProofWithMaker {
  id: string;
  title: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  created_at: string | null;
  makers: Maker | Maker[] | null;
}

export default function EmployerFeed() {
  const supabase = createClient();
  const [proofs, setProofs] = useState<ProofWithMaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, [supabase]);
  const [activeRadius, setActiveRadius] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { latitude, longitude } = useGeolocation();

  useEffect(() => {
    async function fetchProofs() {
      const { data, error } = await (supabase as any)
        .from('proofs')
        .select(`
          id,
          title,
          video_url,
          thumbnail_url,
          created_at,
          profiles:maker_id (
            id,
            name,
            trade,
            hourly_rate,
            bio,
            location,
            is_verified,
            phone
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) setProofs(data as unknown as ProofWithMaker[]);
      setLoading(false);
    }
    fetchProofs();
  }, [supabase]);

  const filteredProofs = proofs.filter((proof) => {
    if (!activeRadius || !latitude || !longitude) return true;
    
    const maker = Array.isArray(proof.makers) ? proof.makers[0] : proof.makers;
    if (!maker?.location) return true;

    const makerCoords = getCoordsForLocation(maker.location);
    if (!makerCoords) return true; // Keep if location is unknown

    const distance = getDistance(latitude, longitude, makerCoords.lat, makerCoords.lng);
    return distance <= activeRadius;
  });

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] w-full flex items-center justify-center bg-[#0D110F]">
        <Loader2 className="animate-spin text-[#13EC6A] drop-shadow-glow" size={48} />
      </div>
    );
  }

  if (!proofs || proofs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black relative p-8 text-center text-white">
        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-6">
          <Play size={40} className="text-gray-400" />
        </div>
        <h2 className="text-3xl font-bold mb-4">No Proofs Yet</h2>
        <p className="text-gray-400 max-w-md mb-8">
          The feed is empty! Check back later when Makers have uploaded their video proofs.
        </p>
        <Link href="/talent/studio/record" className="bg-[#13EC6A] text-[#052210] px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-glow font-display italic">
          Publish a Proof
        </Link>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-80px)] w-full bg-transparent font-sans selection:bg-[#13EC6A]/30">
      <div 
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth hide-scrollbar"
      >
        {filteredProofs.map((proof) => (
          <VideoSlide key={proof.id} proof={proof} userId={userId} />
        ))}

        {filteredProofs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-transparent relative z-10">
            <div className="w-32 h-32 bg-[#13EC6A]/5 rounded-full flex items-center justify-center mb-12 animate-pulse border border-[#13EC6A]/10 shadow-glow">
              <Radar size={64} className="text-[#13EC6A]" />
            </div>
            <h3 className="text-6xl font-black italic mb-6 font-display uppercase tracking-tighter text-glow">Out of Range.</h3>
            <p className="text-gray-500 font-bold max-w-sm font-sans italic text-lg leading-relaxed">No master makers found within {activeRadius}km. Try expanding your radar to sync with more talent.</p>
            <button 
              onClick={() => setActiveRadius(null)}
              className="mt-12 px-12 py-5 bg-white text-black rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-premium hover:bg-[#13EC6A] hover:scale-110 active:scale-95 transition-all italic shimmer-border"
            >
              Show Nationwide
            </button>
          </div>
        )}
      </div>

      <WorkRadar 
        activeRadius={activeRadius} 
        onRadiusChange={(val) => setActiveRadius(val)} 
      />
    </div>
  );
}

function VideoSlide({ proof, userId }: { proof: ProofWithMaker, userId: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const maker = Array.isArray(proof.makers) ? proof.makers[0] : proof.makers;

  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Check saved state initially (MVP shortcut: default false, let employer manage via interactions)

  const toggleSave = async () => {
    if (!userId) { toast.error("Please login to save makers."); return; }
    if (!maker?.id) return;
    setIsSaved(!isSaved); 
    try {
      await savedMakersHub.upsert(userId, maker.id);
      toast.success(isSaved ? "Saved removed." : "Maker saved to your Hub.");
    } catch (e) {
      setIsSaved(isSaved);
      toast.error("Failed to save. Try again.");
    }
  };

  const toggleLike = async () => {
    if (!userId) { toast.error("Please login to vibe."); return; }
    setIsLiked(!isLiked);
    toast.success(isLiked ? "Vibe retracted." : "Vibe captured!");
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.6 } // 60% visibility triggers active state
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      if (isVisible) {
        videoRef.current.play().catch(() => {}); // Catch autoplay blocks
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isVisible]);

  const whatsappUrl = buildWhatsAppUrl(
    maker?.phone || undefined,
    buildMakerMessage(maker?.name || "Maker", proof.title || "")
  ) ?? "#";

  return (
    <div className="relative w-full h-[calc(100vh-80px)] snap-start flex items-center justify-center p-4 md:p-8">
      {/* Background Glow */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isVisible ? 'opacity-20' : 'opacity-0'} bg-gradient-to-tr from-[#13EC6A] to-indigo-600 blur-[200px] pointer-events-none`} />

      <div className="relative w-full h-full max-w-[480px] aspect-[9/16] bg-black rounded-[4rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.9)] border-4 border-white/5 group shimmer-border">
        
        {/* Real video element */}
        {proof.video_url && proof.video_url !== "placeholder_url" ? (
          <video
            ref={videoRef}
            src={proof.video_url}
            loop
            muted
            playsInline
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-screen"
            style={{backgroundImage: `url('${proof.thumbnail_url || 'https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?q=80&w=1965&auto=format&fit=crop'}')`}}
          />
        )}

        {/* Play/pause overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 z-10 pointer-events-none scale-150 group-hover:scale-100">
          <div className="w-28 h-28 rounded-full bg-white/10 backdrop-blur-3xl flex items-center justify-center text-white border border-white/20 shadow-premium">
            <Play fill="currentColor" size={48} className="ml-2 text-[#13EC6A] drop-shadow-glow" />
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="absolute right-6 bottom-40 flex flex-col gap-10 z-20">
          <div className="flex flex-col items-center gap-3 group/btn">
            <button 
              onClick={toggleLike}
              className="w-16 h-16 rounded-[2rem] glass-card flex items-center justify-center text-white border border-white/10 hover:scale-125 hover:bg-white/10 transition-all active:scale-90 shadow-2xl backdrop-blur-3xl"
            >
              <Heart 
                fill={isLiked ? "currentColor" : "none"} 
                size={28} 
                className={`${isLiked ? "text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" : "text-white"} group-hover/btn:text-red-500 group-hover/btn:drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] transition-all`} 
              />
            </button>
            <span className="text-[10px] uppercase font-black text-white/50 tracking-[0.3em] font-display italic">Vibe</span>
          </div>

          <div className="flex flex-col items-center gap-3 group/btn">
            <button 
              onClick={toggleSave}
              className="w-16 h-16 rounded-[2rem] glass-card flex items-center justify-center text-white border border-white/10 hover:scale-125 hover:bg-white/10 transition-all active:scale-90 shadow-2xl backdrop-blur-3xl"
            >
              <Bookmark 
                fill={isSaved ? "currentColor" : "none"} 
                size={28} 
                className={`${isSaved ? "text-[#13EC6A] drop-shadow-[0_0_15px_rgba(19,236,106,0.8)]" : "text-white"} group-hover/btn:text-[#13EC6A] group-hover/btn:drop-shadow-glow transition-all`} 
              />
            </button>
            <span className="text-[10px] uppercase font-black text-white/50 tracking-[0.3em] font-display italic">Save</span>
          </div>

          <div className="flex flex-col items-center gap-3 group/btn">
            <button className="w-16 h-16 rounded-[2rem] glass-card flex items-center justify-center text-white border border-white/10 hover:scale-125 hover:bg-white/10 transition-all active:scale-90 shadow-2xl backdrop-blur-3xl">
              <Send size={28} className="group-hover/btn:rotate-12 transition-all group-hover/btn:text-indigo-400" />
            </button>
            <span className="text-[10px] uppercase font-black text-white/50 tracking-[0.3em] font-display italic">Send</span>
          </div>
        </div>

        {/* Maker Info Footer */}
        <div className="absolute bottom-0 w-full p-10 bg-gradient-to-t from-black via-black/90 to-transparent z-10 pt-40">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-premium border border-white/10 group-hover:rotate-12 transition-transform">
              {maker?.name ? maker.name[0] : "S"}
            </div>
            <div>
              <h2 className="text-3xl font-black flex items-center gap-3 uppercase tracking-tighter italic font-display text-glow">
                {maker?.name || 'Anonymous Master'}
                {maker?.identity_verified && <ShieldCheck size={26} className="text-[#13EC6A] drop-shadow-glow" />}
              </h2>
              <p className="text-[10px] font-black text-[#13EC6A] uppercase tracking-[0.4em] font-display opacity-80 italic">Master {maker?.trade || "Artisan"}</p>
            </div>
          </div>
          
          <p className="text-base font-bold text-gray-400 line-clamp-2 leading-relaxed mb-10 font-sans italic">
            {maker?.bio || "Presenting high-fidelity technique and professional reliability."}
          </p>

          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#13EC6A] text-[#052210] font-black py-6 rounded-[2rem] flex items-center justify-center gap-5 hover:scale-[1.02] transition-all shadow-glow active:scale-95 text-[11px] uppercase tracking-[0.3em] italic group/wa"
          >
            <span className="text-3xl group-hover/wa:rotate-12 transition-transform">💬</span> SYNC VIA WHATSAPP
          </a>
        </div>
        
        {/* Individual Slide Progress Bar */}
        <div className="absolute top-6 left-6 right-6 h-1.5 bg-white/10 rounded-full overflow-hidden z-20">
           <div 
             className={`h-full bg-[#13EC6A] rounded-full transition-all duration-[5000ms] linear ${isVisible ? 'w-full shadow-glow' : 'w-0'}`}
           />
        </div>
      </div>
    </div>
  );
}
