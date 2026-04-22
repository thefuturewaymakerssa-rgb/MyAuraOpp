"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import GoogleSignInButton from "@/components/GoogleSignInButton";

function LoginContent() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
    const supabase = createClient();
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.replace(next);
      }
    };
    checkUser();
  }, [router, next]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F0FDFA] text-[#0F172A] flex flex-col font-sans selection:bg-[#0F766E]/30 font-body items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0F766E]/10 rounded-full blur-[140px] pointer-events-none opacity-60" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#8B5CF6]/10 rounded-full blur-[140px] pointer-events-none opacity-60" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white opacity-20 rounded-full blur-[160px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 text-center">
        {/* Brand/Logo Section */}
        <Link href="/" className="inline-flex flex-col items-center gap-6 mb-16 group">
          <div className="w-24 h-24 rounded-[2.5rem] bg-white overflow-hidden flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-all duration-500 border border-[#E2E8F0]">
            <img 
              src="/logo.png" 
              alt="Shapa Logo" 
              className="h-24 w-auto mb-10" 
            />
          </div>
          <div className="space-y-1">
            <h2 className="font-black text-5xl tracking-tighter italic font-display leading-none text-[#0F766E]">WayMakers.</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 italic">Future Proof Your Hustle</p>
          </div>
        </Link>

        {/* Login Panel */}
        <div className="bg-white/80 backdrop-blur-3xl p-12 rounded-[3.5rem] text-center space-y-12 border border-white shadow-[0_40px_100px_rgba(15,118,110,0.15)] shimmer-border overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl font-black mb-6 tracking-tighter italic font-display uppercase leading-none">Access <br/>The Gateway.</h1>
            <p className="text-gray-500 font-bold mb-14 text-sm max-w-xs mx-auto leading-relaxed italic pr-4 pl-4 opacity-70">
              Welcome back Boss. Welcome back Hustler. One simple entry to move your vision forward.
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="scale-110"><GoogleSignInButton next={next} /></div>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#64748B] italic">🔒 Secure OAuth Gateway Powered by Google</p>
          </div>

          {/* Social Social-Proof in Login */}
          <div className="relative z-10 pt-10 border-t border-[#E2E8F0] mt-10">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0F766E] italic mb-4">Joining 50,000+ local WayMakers</p>
             <div className="flex justify-center -space-x-4">
                {[1,2,3,4,5].map(i => (
                   <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-sm">
                      <img src={`https://randomuser.me/api/portraits/men/${i+20}.jpg`} alt="user" className="w-full h-full object-cover" crossOrigin="anonymous" />
                   </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white bg-[#CCFBF1] flex items-center justify-center text-[#0F766E] text-[10px] font-black italic shadow-sm">
                   +50k
                </div>
             </div>
          </div>
        </div>
        
        {/* Helper Link */}
        <p className="mt-12 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 italic">
          Don&apos;t have a partner profile? <Link href="/onboarding" className="text-[#0F766E] border-b-2 border-[#0F766E] ml-2">GET STARTED &rarr;</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center font-black uppercase text-xs italic tracking-widest text-[#0F766E]">Initializing Protocol...</div>}>
      <LoginContent />
    </Suspense>
  );
}
