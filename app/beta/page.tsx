"use client";

import Link from "next/link";
import { Sparkles, Trophy, Zap, ShieldCheck, ArrowRight, Video, Globe, Users } from "lucide-react";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function BetaLaunchPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans selection:bg-[#0F766E]/50 selection:text-white overflow-x-hidden pt-20">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-[#0F766E]/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#8B5CF6]/5 rounded-full blur-[150px] animate-pulse" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          
          {/* Left: Value Proposition */}
          <div className="space-y-12">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-[#0F766E]/20 border border-[#0F766E]/30 rounded-full">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981]"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#10B981] italic">Phase 1: Zero-Rated Beta Launch</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-7xl lg:text-9xl font-black italic tracking-tighter uppercase font-display leading-[0.8] animate-in slide-in-from-left duration-700">
                The First <br/>
                <span className="text-[#0F766E]">Hundred.</span>
              </h1>
              <p className="text-xl text-white/50 font-bold italic leading-relaxed max-w-xl">
                We are recruiting the founding 100 WayMakers. The elite skilled professionals who will define the new standard of work in South Africa.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { icon: ShieldCheck, title: "Founding Badge", desc: "Exclusive profile status forever." },
                { icon: Zap, title: "Priority Match", desc: "Our AI prioritizes your VibeCV." },
                { icon: Globe, title: "Zero-Rated", desc: "Browse & record with free data." },
                { icon: Trophy, title: "Elite Network", desc: "Direct access to our Boss hub." }
              ].map((benefit, i) => (
                <div key={i} className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] hover:bg-white/10 transition-all duration-500 group">
                   <benefit.icon className="w-10 h-10 text-[#0F766E] mb-6 group-hover:scale-110 transition-transform" />
                   <h3 className="text-lg font-black uppercase italic tracking-tighter mb-2">{benefit.title}</h3>
                   <p className="text-xs text-white/40 font-bold italic leading-relaxed">{benefit.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-8 flex flex-col sm:flex-row items-center gap-8 group">
               <div className="flex -space-x-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-[#0F172A] bg-[#1E293B] flex items-center justify-center overflow-hidden">
                       <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Hustler" crossOrigin="anonymous" />
                    </div>
                  ))}
               </div>
               <div className="text-left">
                  <p className="text-sm font-black italic tracking-tighter uppercase">Joined by 84/100 Leaders</p>
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1 italic">Only 16 VIP slots remaining for Phase 1</p>
               </div>
            </div>
          </div>

          {/* Right: Join Component */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-br from-[#0F766E] to-[#8B5CF6] rounded-[4rem] blur-2xl opacity-20 group-hover:opacity-40 transition-all duration-1000" />
            <div className="relative bg-[#1E293B]/80 backdrop-blur-3xl p-12 lg:p-20 rounded-[4rem] border-2 border-white/10 shadow-2xl space-y-16">
              
              <div className="space-y-6 text-center">
                 <div className="w-24 h-24 bg-[#0F766E] rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-[#0F766E]/40 animate-bounce-slow">
                    <Sparkles size={48} className="text-white" fill="white" />
                 </div>
                 <h2 className="text-5xl font-black italic tracking-tighter uppercase font-display leading-[0.85]">Secure Your <br/>Legacy.</h2>
                 <p className="text-white/40 font-bold italic leading-relaxed max-w-xs mx-auto text-sm">
                   Phase 1 Beta members receive a permanent &quot;Founding 100&quot; badge on their profile.
                 </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-center text-[10px] font-black uppercase tracking-[0.5em] text-[#0F766E] italic">Initialize Onboarding</p>
                  <GoogleSignInButton next="/onboarding?ref=beta100" />
                </div>
                
                <div className="flex items-center gap-4 text-white/20">
                   <div className="h-px flex-1 bg-white/10" />
                   <span className="text-[8px] font-black uppercase tracking-widest">or scout first</span>
                   <div className="h-px flex-1 bg-white/10" />
                </div>

                <Link href="/feed" className="w-full flex items-center justify-between px-10 py-6 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 transition-all group/scout">
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] italic text-white/60 group-hover/scout:text-white">Watch The Vibe Feed</span>
                   <ArrowRight size={20} className="text-[#0F766E] group-hover/scout:translate-x-2 transition-transform" />
                </Link>
              </div>

              <div className="pt-10 border-t border-white/5 grid grid-cols-2 gap-8 text-center">
                 <div className="space-y-1">
                    <p className="text-2xl font-black italic font-display text-[#0F766E]">R 0.00</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/30 italic">Registration Fee</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-2xl font-black italic font-display text-[#10B981]">100%</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/30 italic">Zero-Rated Access</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 py-20 px-8 border-t border-white/5 opacity-40 hover:opacity-100 transition-opacity">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <Link href="/">
               <img src="/logo.png" alt="ShapaCV" className="h-12 w-auto grayscale brightness-200" />
            </Link>
            <p className="text-[9px] font-black uppercase tracking-[0.6em] italic text-white/50 text-center md:text-right leading-loose">
               Future WayMakers Platform Group SA <br/>
               The Elite Standard for Township Hustle Analytics.
            </p>
         </div>
      </footer>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
