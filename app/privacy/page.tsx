import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F0FDFA] text-[#0F172A] p-10 md:p-20 font-sans selection:bg-[#0F766E]/30 selection:text-[#0F172A]">
      <div className="max-w-4xl mx-auto space-y-16">
        <div className="space-y-4">
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#0F766E] italic">Legal Protocol v2.26</span>
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase font-display leading-[0.85]">Privacy <br/>Policy.</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t-2 border-[#E2E8F0] pt-16">
          <div className="space-y-6">
            <h3 className="text-xl font-black italic uppercase tracking-tight text-[#0F766E]">1. POPIA Compliance</h3>
            <p className="text-gray-500 font-bold leading-relaxed italic">
              Future WayMakers (ShapaCV) is fully compliant with the Protection of Personal Information Act (POPIA), Act 4 of 2013. We act as the &quot;Responsible Party&quot; for your VibeCV data.
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black italic uppercase tracking-tight text-[#0F766E]">2. Data Subject Rights</h3>
            <p className="text-gray-500 font-bold leading-relaxed italic">
              You have the right to access (Export) and correct (Update) your personal information at any time. You may also request deletion (Right to be Forgotten) via your Command Center.
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black italic uppercase tracking-tight text-[#0F766E]">3. Video Retention</h3>
            <p className="text-gray-500 font-bold leading-relaxed italic">
              To minimize data exposure, VibeCV proof videos auto-expire after 6 months of inactivity unless you explicitly choose to re-verify or extend your profile validity.
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black italic uppercase tracking-tight text-[#0F766E]">4. Security Gateway</h3>
            <p className="text-gray-500 font-bold leading-relaxed italic">
              We use bank-grade AES-256 encryption for stored ID selfies and secure HTTPS protocols for all video transmissions. Your data never leaves the South African region.
            </p>
          </div>
        </div>

        <div className="bg-white p-12 rounded-[3.5rem] border-2 border-white shadow-2xl shadow-[#0F766E]/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 text-[#0F766E]/5 transform rotate-12">
            <ShieldCheck size={120} />
          </div>
          <div className="relative z-10 space-y-6">
            <h3 className="text-3xl font-black italic uppercase tracking-tighter font-display text-[#0F172A]">Need Help with your Data?</h3>
            <p className="text-sm text-gray-500 font-bold italic max-w-md">Our Information Officer is available to handle any POPIA-related queries or formal data requests.</p>
            <div className="flex flex-wrap gap-4 pt-4">
              <a href="mailto:privacy@futurewaymakers.co.za" className="px-8 py-4 bg-[#0F766E] text-white rounded-full font-black text-[10px] uppercase tracking-widest italic shadow-xl shadow-[#0F766E]/20 hover:scale-105 transition-all">Contact Info Officer</a>
              <Link href="/api/user/export" className="px-8 py-4 bg-white border-2 border-[#E2E8F0] text-gray-400 rounded-full font-black text-[10px] uppercase tracking-widest italic hover:border-[#0F766E] hover:text-[#0F766E] transition-all">Request Data Export</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
