"use client";

import React from "react";
import Link from "next/link";
import { 
  X, 
  Layout, 
  User, 
  ShieldCheck, 
  Wallet, 
  Bookmark, 
  Zap, 
  HelpCircle, 
  Settings, 
  LogOut,
  Briefcase,
  PlusCircle,
  Building,
  CreditCard,
  Users,
  Repeat
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  role: "hustler" | "employer" | "admin" | string;
  user: any;
}

export const SideDrawer = ({ isOpen, onClose, role, user }: SideDrawerProps) => {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const talentItems = [
    { icon: <Layout size={22} strokeWidth={2} />, label: "Dashboard", href: "/talent/dashboard" },
    { icon: <User size={22} strokeWidth={2} />, label: "My VibeCV", href: `/u/${user?.id || 'me'}` },
    { icon: <ShieldCheck size={22} strokeWidth={2} />, label: "Verification", href: "/talent/verification" },
    { icon: <Wallet size={22} strokeWidth={2} />, label: "Earnings", href: "/talent/wallet" },
    { icon: <Bookmark size={22} strokeWidth={2} />, label: "Saved Items", href: "/talent/saved" },
    { icon: <Zap size={22} strokeWidth={2} />, label: "First Gig Portal", href: "/gigs?filter=first-gig" },
  ];

  const employerItems = [
    { icon: <Layout size={22} strokeWidth={2} />, label: "Operations Hub", href: "/employer/hub" },
    { icon: <PlusCircle size={22} strokeWidth={2} />, label: "Post a Gig", href: "/employer/gigs/new" },
    { icon: <Building size={22} strokeWidth={2} />, label: "Business Profile", href: "/settings/business" },
    { icon: <CreditCard size={22} strokeWidth={2} />, label: "Payments", href: "/employer/payments" },
    { icon: <Users size={22} strokeWidth={2} />, label: "Talent Shortlist", href: "/employer/saved" },
  ];

  const commonItems = [
    { icon: <HelpCircle size={22} strokeWidth={2} />, label: "Support", href: "/support" },
    { icon: <Settings size={22} strokeWidth={2} />, label: "Settings", href: "/settings" },
  ];

  const isEmployer = role === "employer";
  const accentColor = isEmployer ? "#8B5CF6" : "#0F766E";
  const accentBg = isEmployer ? "bg-[#F5F3FF]" : "bg-[#F0FDFA]";

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[10000] transition-opacity duration-700 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white z-[10001] transition-transform duration-700 ease-in-out shadow-[40px_0_100px_rgba(0,0,0,0.1)] ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
          {/* Header */}
          <div className="p-12 pb-16 flex justify-between items-center relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1 ${isEmployer ? "bg-[#8B5CF6]" : "bg-[#0F766E]"}`} />
            
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-gray-100 p-2 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <img src="/logo.png" alt="Shapa Logo" className="w-full h-auto" crossOrigin="anonymous" />
              </div>
              <div className="flex flex-col">
                <span className={`text-2xl font-black uppercase tracking-tighter italic font-display leading-none ${isEmployer ? "text-[#8B5CF6]" : "text-[#0F766E]"}`}>WayMakers.</span>
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-300 italic">Global Ops Hub</span>
              </div>
            </div>
            <button onClick={onClose} className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-12 px-8">
            {/* User Profile Summary */}
            <div className={`${accentBg} p-8 rounded-[2.5rem] border-2 border-white shadow-xl shadow-gray-100 relative overflow-hidden group`}>
               <div className="relative z-10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border-2 border-white shadow-sm overflow-hidden">
                     {user?.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={24} /></div>
                     )}
                  </div>
                  <div className="flex flex-col">
                     <span className="text-sm font-black italic tracking-tighter uppercase font-display leading-none mb-1">{user?.user_metadata?.full_name || "Profile"}</span>
                     <span className={`text-[8px] font-black uppercase tracking-widest italic opacity-60 ${isEmployer ? "text-[#8B5CF6]" : "text-[#0F766E]"}`}>{role}</span>
                  </div>
               </div>
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
                  <ShieldCheck size={64} color={accentColor} />
               </div>
            </div>

            {/* Role Specific Section */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] mb-6 italic px-4">
                {isEmployer ? "Operations Console" : "Talent Marketplace"}
              </p>
              {(isEmployer ? employerItems : talentItems).map((item, idx) => (
                <Link 
                  key={idx} 
                  href={item.href} 
                  onClick={onClose}
                  className={`flex items-center gap-5 p-5 rounded-[1.5rem] transition-all duration-300 text-gray-400 active:scale-95 group hover:bg-gray-50`}
                >
                  <div className={`transition-all duration-500 group-hover:scale-110`} style={{ color: "inherit" }}>
                     {item.icon}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest italic group-hover:text-gray-900 group-hover:translate-x-2 transition-all">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* System Section */}
            <div className="space-y-4 pb-12">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] mb-6 italic px-4">System Protocols</p>
              {commonItems.map((item, idx) => (
                <Link 
                  key={idx} 
                  href={item.href} 
                  onClick={onClose}
                  className="flex items-center gap-5 p-5 rounded-[1.5rem] transition-all text-gray-400 hover:text-gray-900 group hover:bg-gray-50 active:scale-95"
                >
                  <div className="group-hover:rotate-12 transition-transform duration-500">
                     {item.icon}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest italic group-hover:translate-x-2 transition-all">{item.label}</span>
                </Link>
              ))}
              
              {isEmployer && (
                <Link 
                  href="/role-select" 
                  onClick={onClose}
                  className="flex items-center gap-5 p-6 rounded-[2rem] bg-indigo-50 border-2 border-indigo-100 text-[#8B5CF6] hover:bg-indigo-100 transition-all mt-8 group"
                >
                  <Repeat size={22} className="group-hover:rotate-180 transition-transform duration-700" />
                  <span className="text-[11px] font-black uppercase tracking-widest italic">Switch to Talent</span>
                </Link>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-12 pt-8 border-t-2 border-gray-50 space-y-8">
             <button 
               onClick={handleLogout}
               className="flex items-center gap-5 w-full p-5 rounded-[1.5rem] bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-500 group shadow-sm shadow-red-100"
             >
                <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-widest italic">Terminate Session</span>
             </button>
             
             <div className="px-2 space-y-4">
                 <div className="flex items-center gap-2 opacity-20 grayscale">
                    <img src="/logo.png" alt="Logo" className="h-4 w-auto" crossOrigin="anonymous" />
                    <span className="text-[8px] font-black uppercase tracking-widest italic">v2.4.0 High-Fidelity Build</span>
                 </div>
                <div className="flex gap-4">
                   <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest italic hover:text-gray-500 cursor-pointer transition-colors">Terms of Ops</p>
                   <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest italic hover:text-gray-500 cursor-pointer transition-colors">Privacy Protocol</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};
