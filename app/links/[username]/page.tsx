"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { VerificationBadge } from "@/components/VerificationBadge";
import { Zap, Star, MapPin, Share2, ArrowRight, Loader2, Play, Crown } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Maker {
  id: string;
  name: string;
  trade: string;
  location: string;
  bio: string;
  verification_tier: any; // Using any for component compatibility
  reliability_score: number;
  featured_until: string | null;
}

export default function LinkInBioPage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = use(params);
  const username = resolvedParams.username;
  
  const [maker, setMaker] = useState<Maker | null>(null);
  const [proofs, setProofs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMaker() {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select(`
          *,
          profiles:id (username)
        `)
        .eq('profiles.username', username)
        .single();
      
      if (data) {
        setMaker(data as any);
        const { data: proofsData } = await supabase
          .from('proofs')
          .select('*')
          .eq('maker_id', (data as any).id)
          .limit(3);
        setProofs(proofsData || []);
      }
      setLoading(false);
    }
    fetchMaker();
  }, [username]);

  if (loading) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#13EC6A]" size={48} /></div>;
  if (!maker) return <div className="h-screen bg-black flex items-center justify-center text-white text-2xl font-black italic uppercase">Maker Not Found.</div>;

  const isFeatured = !!(maker.featured_until && new Date(maker.featured_until) > new Date());

  return (
    <div className="min-h-screen bg-[#0D110F] text-white flex flex-col items-center p-6 md:p-12 relative overflow-hidden font-body">
      {/* Dynamic Background */}
      <div className={`absolute inset-0 opacity-20 pointer-events-none ${isFeatured ? 'bg-gradient-to-b from-purple-500/20 via-transparent to-transparent' : 'bg-gradient-to-b from-[#13EC6A]/10 via-transparent to-transparent'}`} />

      <div className="w-full max-w-md space-y-12 relative z-10 pt-16">
        {/* Profile Info */}
        <div className="text-center space-y-6">
          <div className="relative inline-block group">
            <div className={`w-36 h-36 rounded-[2.5rem] flex items-center justify-center text-6xl font-black italic font-display text-[#052210] shadow-glow transform transition-transform group-hover:rotate-6 ${isFeatured ? 'bg-gradient-to-br from-purple-400 to-amber-400' : 'bg-[#13EC6A]'}`}>
              {maker.name[0]}
            </div>
            <div className="absolute -bottom-4 -right-4">
               <VerificationBadge tier={maker.verification_tier} score={maker.reliability_score} />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic tracking-tighter font-display uppercase flex items-center justify-center gap-3">
               {maker.name}
               {isFeatured && <Crown size={24} className="text-amber-400 animate-pulse" />}
            </h1>
            <p className="text-[#13EC6A] font-black uppercase tracking-[0.3em] text-[10px] italic drop-shadow-glow">{maker.trade} • {maker.location}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
           <Link 
             href={`/talent/${maker.id}`}
             className="w-full py-6 bg-[#13EC6A] text-[#052210] rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-glow hover:scale-[1.02] transition-all flex items-center justify-center gap-3 border-b-4 border-black/10"
           >
              Book My Energy <ArrowRight size={18} />
           </Link>
           <button 
             onClick={() => {
                navigator.share({
                   title: `Hire ${maker.name} on ShapaCV`,
                   url: window.location.href
                }).catch(() => {
                   navigator.clipboard.writeText(window.location.href);
                   toast.success("Link copied!");
                });
             }}
             className="w-full py-6 glass rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white/70 hover:text-white transition-all flex items-center justify-center gap-3 border border-white/5"
           >
              Share My Bio <Share2 size={18} />
           </button>
        </div>

        {/* Video Proof Clips (TikTok Style) */}
        <div className="space-y-6 pt-6">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 text-center italic">Live Energy</h3>
           <div className="grid grid-cols-3 gap-3">
              {proofs.map(proof => (
                 <div key={proof.id} className="aspect-[9/16] glass rounded-xl relative overflow-hidden group">
                    <video src={proof.video_url} className="absolute inset-0 w-full h-full object-cover" muted loop autoPlay playsInline crossOrigin="anonymous" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all pointer-events-none" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <Play size={20} className="text-white opacity-40 group-hover:opacity-100 transition-opacity" fill="currentColor" />
                    </div>
                 </div>
              ))}
              {[...Array(Math.max(0, 3 - proofs.length))].map((_, i) => (
                 <div key={i} className="aspect-[9/16] glass rounded-xl flex items-center justify-center opacity-20 border border-dashed border-white/20">
                    <Zap size={24} />
                 </div>
              ))}
           </div>
        </div>

        {/* Footer Branding */}
        <div className="text-center pt-12 pb-20 opacity-40">
           <p className="text-[8px] font-black uppercase tracking-[0.5em] mb-4">Powered by</p>
           <h4 className="text-3xl font-black italic tracking-tighter font-display uppercase">ShapaCV.</h4>
           <p className="text-[8px] font-black uppercase tracking-widest mt-2 grayscale">Jozi Entrepreneur Mindset</p>
        </div>
      </div>
    </div>
  );
}
