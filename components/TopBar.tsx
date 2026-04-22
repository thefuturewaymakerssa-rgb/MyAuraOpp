"use client";

import React, { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
  Menu, 
  Bell, 
  Map as MapIcon, 
  MapPin,
  MessageSquare,
  List,
  PlusCircle,
  Building2,
  Share2,
  RefreshCw,
  User
} from "lucide-react";

interface TopBarProps {
  onOpenMenu: () => void;
  unreadCount?: number;
  isImmersive?: boolean; // provided by NavWrapper — single source of truth
  role?: string | null;
}

export const TopBar = ({ onOpenMenu, unreadCount = 0, isImmersive = false, role }: TopBarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [feedTab, setFeedTab] = useState<"foryou" | "following">("foryou");
  const [isSwitching, setIsSwitching] = useState(false);

  const handleRoleSwitch = async () => {
    setIsSwitching(true);
    try {
      const res = await fetch("/api/user/switch-role", { method: "POST" });
      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        console.error("Failed to switch role");
        setIsSwitching(false);
      }
    } catch (err) {
      console.error(err);
      setIsSwitching(false);
    }
  };

  const getTopBarContent = () => {
    if (pathname === "/feed") {
      return {
        center: (
          <div className="flex items-center gap-6 text-gray-400 font-black uppercase tracking-[0.4em] text-[10px] italic">
            <button
              onClick={() => setFeedTab("foryou")}
              className={`transition-colors ${feedTab === "foryou" ? "text-[#0F766E]" : "hover:text-gray-600"}`}
            >
              For You
            </button>
            <div className="w-1 h-1 rounded-full bg-gray-200" />
            <button
              onClick={() => setFeedTab("following")}
              className={`transition-colors ${feedTab === "following" ? "text-[#0F766E]" : "hover:text-gray-600"}`}
            >
              Following
            </button>
          </div>
        ) as any,
        right: (
          <button onClick={() => router.push("/notifications")} className="p-3 text-gray-400 hover:text-[#0F766E] transition-all relative">
            <Bell size={24} />
          </button>
        ) as any
      };
    }
    
    if (pathname === "/gigs") {
      const isMap = searchParams.get("view") === "map";
      return {
        center: (
          <div className="flex items-center gap-3 text-[#0F766E] font-black uppercase tracking-[0.3em] text-[10px] italic">
            <MapPin size={14} fill="currentColor" /> Gigs Near You
          </div>
        ) as any,
        right: (
          <button 
            onClick={() => {
              // Use the hook-derived searchParams for SSR safety
              const params = new URLSearchParams(searchParams.toString());
              params.set("view", isMap ? "list" : "map");
              router.push(`${pathname}?${params.toString()}`);
            }}
            className="w-12 h-12 bg-white border-2 border-[#E2E8F0] rounded-2xl flex items-center justify-center text-gray-400 hover:text-[#0F766E] hover:border-[#0F766E]/20 transition-all shadow-sm"
          >
            {isMap ? <List size={22} /> : <MapIcon size={22} />}
          </button>
        ) as any
      };
    }

    if (pathname.includes("/messages")) {
      return {
        center: <span className="text-[10px] font-black uppercase tracking-[0.4em] italic text-[#0F766E]">Secure Messages</span>,
        right: (
          <button onClick={() => router.push("/messages")} className="p-3 text-gray-400 hover:text-[#0F766E] transition-all">
            <MessageSquare size={24} />
          </button>
        ) as any
      };
    }

    if (pathname.includes("/employer")) {
      return {
        center: (
          <button 
            onClick={() => router.push("/employer/gigs/new")}
            className="flex items-center gap-3 px-6 py-2 bg-[#8B5CF6] text-white rounded-full font-black uppercase tracking-[0.2em] text-[9px] italic shadow-lg shadow-[#8B5CF6]/20 transition-all hover:scale-105 active:scale-95"
          >
            <PlusCircle size={16} />
            <span>Post A Gig</span>
          </button>
        ) as any,
        right: (
          <button 
            onClick={() => router.push("/employer/hub")}
            className="w-12 h-12 bg-white border-2 border-[#E2E8F0] rounded-2xl flex items-center justify-center text-gray-400 hover:text-[#8B5CF6] transition-all shadow-sm"
          >
            <Building2 size={22} />
          </button>
        ) as any
      };
    }

    if (pathname.includes("/dashboard") || pathname.includes("/u/")) {
      return {
        center: <span className="text-[10px] font-black uppercase tracking-[0.4em] italic text-gray-400">My Vibe Profile</span>,
        right: (
          <button onClick={() => alert("Share logic...")} className="p-3 text-gray-400 hover:text-[#0F766E] transition-all">
            <Share2 size={24} />
          </button>
        ) as any
      };
    }

    return {
      center: (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white border-2 border-[#E2E8F0] flex items-center justify-center shadow-sm overflow-hidden">
            <img src="/logo.png" alt="Shapa Logo" className="w-full h-full object-cover" crossOrigin="anonymous" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] italic text-[#0F766E]">WayMakers</span>
        </div>
      ) as any,
      right: (
        <button onClick={() => router.push("/notifications")} className="p-3 text-gray-400 hover:text-[#0F766E] transition-all">
          <Bell size={24} />
        </button>
      ) as any
    };
  };

  const { center, right } = getTopBarContent();
  // isImmersive is now provided by NavWrapper — no local re-derivation needed

  return (
    <div className={`fixed top-0 left-0 right-0 z-[9998] backdrop-blur-xl border-b pt-12 pb-6 px-10 flex items-center justify-between pointer-events-auto transition-all duration-700 ${
      isImmersive 
        ? "bg-black/20 border-white/5 shadow-none text-white" 
        : "bg-[#F0FDFA]/90 border-white shadow-[0_10px_40px_rgba(0,0,0,0.02)] text-gray-400"
    }`}>
      <button onClick={onOpenMenu} className={`p-3 transition-all hover:scale-110 active:scale-95 ${isImmersive ? "text-white/50 hover:text-white" : "text-gray-400 hover:text-[#0F766E]"}`}>
        <Menu size={28} />
      </button>

      <div className="absolute left-1/2 -translate-x-1/2 w-max">
        {center}
      </div>

      <div className="flex items-center gap-4 relative">
        {/* Role Switcher */}
        {role && (
          <button 
            onClick={handleRoleSwitch}
            disabled={isSwitching}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all group shadow-sm ${
              isImmersive 
                ? "border-white/10 text-white/70 hover:text-white bg-white/5" 
                : "border-[#E2E8F0] text-gray-400 hover:text-[#0F766E] bg-white hover:border-[#0F766E]/20"
            }`}
          >
             {role === "employer" ? <Building2 size={16} /> : <User size={16} />}
             <RefreshCw size={14} className={`opacity-50 group-hover:opacity-100 ${isSwitching ? "animate-spin" : ""}`} />
          </button>
        )}

        <div className="relative">
          {right}
          {unreadCount > 0 && !pathname.includes("/gigs") && (
            <span className={`absolute top-2 right-2 w-5 h-5 rounded-full text-white text-[9px] font-black flex items-center justify-center border-2 shadow-lg pointer-events-none ${isImmersive ? "bg-[#13EC6A] border-black" : "bg-[#0F766E] border-white"}`}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
