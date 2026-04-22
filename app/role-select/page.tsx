"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { Gem, ArrowRight, User, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RoleSelectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    // Quick verify they're actually logged in
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.replace("/");
    };
    checkUser();
  }, [router]);

  const handleRoleSelect = async (role: "talent" | "employer") => {
    setLoading(role);
    const supabase = createClient();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Update the base profile role
      const { error } = await supabase
        .from('profiles')
        // @ts-expect-error: role update is valid but type might be restrictive
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;
      
      const searchParams = new URLSearchParams(window.location.search);
      const nextParam = searchParams.get('next');

      // Route them appropriately
      if (role === 'talent') {
        router.push("/onboarding?role=hustler");
      } else {
        router.push("/onboarding?role=employer");
      }
    } catch (err: unknown) {
      console.error("Role select error:", err);
      toast.error("Failed to save role. Please try again.");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#111613] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 w-full p-10 flex justify-center items-center z-30 font-body">
        <div className="flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-xl bg-white overflow-hidden flex items-center justify-center shadow-glow">
            <Image 
              src="/logo.png" 
              alt="WayMakers Logo" 
              width={48} 
              height={48}
              className="object-cover"
            />
          </div>
          <span className="font-black text-3xl tracking-tighter italic font-display">WayMakers.</span>
        </div>
      </header>

      {/* Main Split Content */}
      <main className="flex-1 flex flex-col md:flex-row h-full">
        {/* Talent Side */}
        <div className="flex-1 relative group overflow-hidden border-b md:border-b-0 md:border-r border-white/5 pt-32 pb-20 md:py-0 flex items-center justify-center font-body">
          <div className="absolute inset-0 bg-gradient-to-br from-[#13EC6A]/10 to-transparent opacity-40 z-0" />
          <div className="relative z-10 p-12 text-center max-w-md">
            <div className="w-28 h-28 rounded-[2.5rem] bg-[#13EC6A]/10 border border-[#13EC6A]/20 flex items-center justify-center text-[#13EC6A] mb-12 mx-auto group-hover:scale-110 transition-transform duration-700 shadow-glow">
              <User size={56} />
            </div>
            <h2 className="text-7xl font-black mb-8 tracking-tighter leading-[0.85] italic uppercase font-display">I Want <br/><span className="text-[#13EC6A] drop-shadow-glow">Work.</span></h2>
            <p className="text-gray-500 font-bold mb-14 text-lg leading-relaxed">Join as a Maker. Show your skill with video proof and get hired by professional clients.</p>
            <button 
              onClick={() => handleRoleSelect('talent')}
              disabled={!!loading}
              className="group/btn relative inline-flex items-center justify-center px-14 py-7 font-black text-xl text-[#052210] transition-all duration-300 bg-[#13EC6A] rounded-full hover:scale-105 active:scale-95 shadow-glow border-b-4 border-black/10 disabled:opacity-50"
            >
              {loading === 'talent' ? <Loader2 className="animate-spin" size={24} /> : (
                <>CONTINUE AS MAKER <ArrowRight className="ml-4 group-hover/btn:translate-x-2 transition-transform" /></>
              )}
            </button>
          </div>
          {/* Background Highlight */}
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#13EC6A]/5 rounded-full blur-[100px] pointer-events-none" />
        </div>

        {/* Employer Side */}
        <div className="flex-1 relative group overflow-hidden pt-20 pb-32 md:py-0 flex items-center justify-center bg-[#171C19]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-50 z-0" />
          <div className="relative z-10 p-12 text-center max-w-md">
            <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-white mb-10 mx-auto group-hover:scale-110 transition-transform duration-500 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
              <Search size={48} />
            </div>
            <h2 className="text-6xl font-black mb-6 tracking-tighter leading-none italic uppercase text-white">I Want <br/><span>Talent.</span></h2>
            <p className="text-gray-500 font-bold mb-12 text-lg">Hire a pro. Browse verified proof clips and build your corporate talent pool.</p>
            <button 
              onClick={() => handleRoleSelect('employer')}
              disabled={!!loading}
              className="group/btn relative inline-flex items-center justify-center px-14 py-7 font-black text-xl text-black transition-all duration-300 bg-white rounded-full hover:bg-[#13EC6A] hover:text-[#052210] active:scale-95 shadow-premium disabled:opacity-50"
            >
              {loading === 'employer' ? <Loader2 className="animate-spin" size={24} /> : (
                <>CONTINUE AS EMPLOYER <ArrowRight className="ml-4 group-hover/btn:translate-x-2 transition-transform" /></>
              )}
            </button>
          </div>
          {/* Background Highlight */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
        </div>
      </main>
    </div>
  );
}
