"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Video, 
  Search, 
  Plus, 
  MessageSquare, 
  User,
  Sparkles,
  Users,
  PlusCircle,
  FileText,
  Building2,
  X
} from "lucide-react";

interface MobileNavProps {
  unreadCount?: number;
  user: any;
  role?: string | null;
}

export const MobileNav = ({ unreadCount = 0, user, role }: MobileNavProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Use the server-authoritative role from the database via props
  const isEmployer = role === 'employer';

  // === EMPLOYER TABS — Boss-centric navigation ===
  const employerNavItems = [
    { icon: Building2, label: "Hub", href: "/employer/hub" },
    { icon: FileText, label: "Contracts", href: "/employer/contracts" },
    { icon: PlusCircle, label: "Post Gig", isAction: true },
    { icon: MessageSquare, label: "Messages", href: "/messages", badge: unreadCount },
    { icon: User, label: "Profile", href: `/u/${user?.id}` },
  ];

  // === TALENT TABS — Hustler-centric navigation ===
  const talentNavItems = [
    { icon: Video, label: "Feed", href: "/feed" },
    { icon: Search, label: "Gigs", href: "/gigs" },
    { icon: Plus, label: "Create", isAction: true },
    { icon: MessageSquare, label: "Messages", href: "/messages", badge: unreadCount },
    { icon: User, label: "Profile", href: `/u/${user?.id}` },
  ];

  const navItems = isEmployer ? employerNavItems : talentNavItems;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[9999] px-6 pb-[calc(24px+env(safe-area-inset-bottom))] pt-4 flex justify-center pointer-events-none">
        <div className="flex justify-between items-center w-full max-w-lg bg-white/20 backdrop-blur-3xl border border-white/20 rounded-[3rem] px-8 py-4 pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative transition-all duration-500 hover:shadow-[0_30px_70px_rgba(0,0,0,0.15)]">
          {navItems.map((item, idx) => {
            const isActive = item.href
              ? item.href === `/u/${user?.id}`
                ? pathname === item.href                               // exact match for own profile
                : pathname === item.href || pathname.startsWith(item.href + "/")
              : false;
            const Icon = item.icon;
            
            if (item.isAction) {
              const actionStyles = isEmployer 
                ? "bg-[#8B5CF6] shadow-[#8B5CF6]/30" 
                : "bg-[#0F766E] shadow-[#0F766E]/30";

              return (
                <button
                  key={idx}
                  onClick={() => isEmployer ? router.push('/employer/gigs/new') : setShowCreateModal(true)}
                  className="flex flex-col items-center group relative z-10 -mt-12"
                >
                  <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl group-hover:scale-110 active:scale-95 transition-all border-4 border-[#F0FDFA] ${actionStyles}`}>
                    {isEmployer ? <PlusCircle size={32} strokeWidth={3} className="text-white" /> : <Plus size={36} strokeWidth={3} className="text-white" />}
                  </div>
                </button>
              );
            }

            const activeColor = isEmployer ? "text-[#8B5CF6]" : "text-[#0F766E]";

            return (
              <Link
                key={idx}
                href={item.href || "/"}
                className={`flex flex-col items-center gap-1 transition-all duration-500 group relative ${
                  isActive ? activeColor : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <div className="relative">
                  <Icon 
                    size={24} 
                    fill={isActive ? "currentColor" : "none"} 
                    strokeWidth={isActive ? 2.5 : 2}
                    className="transition-all duration-300 group-hover:scale-110" 
                  />
                  {(item as any).badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center border-2 border-white shadow-lg">
                      {(item as any).badge > 9 ? "9+" : (item as any).badge}
                    </span>
                  )}
                </div>
                {isActive && (
                  <div className={`absolute -bottom-2 w-1 h-1 rounded-full ${isEmployer ? "bg-[#8B5CF6]" : "bg-[#0F766E]"} animate-in fade-in zoom-in duration-300`} />
                )}
              </Link>
            );
          })}
        </div>
      </div>
      {/* Create Modal Overlay (Transformed to High Fidelity Design) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[10002] bg-white/80 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center justify-center p-12">
           <button 
             onClick={() => setShowCreateModal(false)}
             className="absolute top-12 right-12 text-gray-400 hover:text-[#0F766E] hover:rotate-90 transition-all p-4 bg-gray-50 rounded-full border border-gray-100"
           >
              <X size={32} />
           </button>
           
           <div className="text-center space-y-16 max-w-sm">
              <div className="w-24 h-24 rounded-[2.5rem] bg-[#0F766E]/5 border-2 border-[#0F766E]/10 flex items-center justify-center text-[#0F766E] mx-auto shadow-xl shadow-[#0F766E]/10 relative group">
                <div className="absolute inset-2 border-2 border-dashed border-[#0F766E]/10 rounded-[2rem] animate-spin-slow"></div>
                <Sparkles size={40} className="group-hover:scale-125 transition-transform duration-500" />
              </div>
              
              <div className="space-y-6">
                <h2 className="text-6xl font-black italic tracking-tighter uppercase font-display leading-[0.8]">Build Your <br/><span className="text-[#0F766E]">Vibe CV.</span></h2>
                <p className="text-gray-500 font-bold text-lg opacity-70 italic leading-relaxed">Show employers your skills in action. Record a 30s proof clip to 10x your hire rate.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-6 w-full">
                 <button 
                   onClick={() => {
                     setShowCreateModal(false);
                     router.push("/talent/studio/record");
                   }}
                   className="w-full bg-[#0F766E] text-white py-8 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-[#0F766E]/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 italic"
                 >
                    <Video size={20} fill="white" /> Record Protocol
                 </button>
                 <button 
                   className="w-full bg-white text-gray-400 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] border-2 border-[#E2E8F0] hover:border-[#0F766E]/20 transition-all italic"
                 >
                    Upload Gallery
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};
