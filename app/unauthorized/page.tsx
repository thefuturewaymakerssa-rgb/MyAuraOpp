import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Access Denied — Future WayMakers",
  description: "You do not have permission to access this area.",
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#F0FDFA] flex flex-col items-center justify-center text-center p-8 font-sans">
      <div className="w-28 h-28 rounded-[3rem] bg-red-50 border-2 border-red-100 flex items-center justify-center text-red-400 mx-auto mb-10 shadow-inner">
        <ShieldAlert size={56} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-red-400 italic mb-4">Access Protocol Denied</p>
      <h1 className="text-6xl sm:text-7xl font-black italic tracking-tighter font-display uppercase text-[#0F172A] leading-none mb-6">
        Restricted Zone.
      </h1>
      <p className="text-gray-500 font-bold text-sm italic max-w-sm mx-auto leading-relaxed mb-12">
        You don&apos;t have clearance for this area. If you believe this is an error, contact the platform administrators.
      </p>
      <Link
        href="/dashboard"
        className="px-12 py-6 bg-[#0F766E] text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest italic shadow-xl shadow-[#0F766E]/20 hover:scale-105 active:scale-95 transition-all"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
