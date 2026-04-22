import { ShieldCheck, Zap, Award, CheckCircle2 } from "lucide-react";

export function TrustBadges() {
  const badges = [
    { icon: <Zap size={18} className="text-[#13EC6A]" />, text: "Zero-rated Vodacom", sub: "Data-free browse" },
    { icon: <Award size={18} className="text-blue-400" />, text: "Harambee Partner", sub: "Verified Pathways" },
    { icon: <ShieldCheck size={18} className="text-emerald-400" />, text: "Secure Escrow", sub: "PayFast Backed" },
    { icon: <CheckCircle2 size={18} className="text-amber-400" />, text: "YES Programme", sub: "Youth Opportunities" },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-6 mt-12">
      {badges.map((b, i) => (
        <div key={i} className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/10 transition-colors">
          <div className="p-2 bg-white/5 rounded-xl">{b.icon}</div>
          <div className="text-left">
            <p className="text-sm font-black text-white leading-tight">{b.text}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{b.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
