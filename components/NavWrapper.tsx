"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TopBar } from "./TopBar";
import { SideDrawer } from "./SideDrawer";
import { MobileNav } from "./MobileNav";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

// Stable singleton — prevents useEffect dependency churn
const supabase = createClient();

const IMMERSIVE_ROUTES = ["/feed", "/talent/studio", "/record", "/apply"];

interface NavWrapperProps {
  children: React.ReactNode;
  role: string | null;
  user: any;
}

export const NavWrapper = ({ children, role, user }: NavWrapperProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  // Single source of truth — passed to TopBar to avoid duplicate logic
  const isImmersive = useMemo(
    () => IMMERSIVE_ROUTES.some((r) => pathname === r || pathname?.startsWith(r + "/")),
    [pathname]
  );

  useEffect(() => {
    let channel: any;
    async function loadUnread() {
      if (!user) return;
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);
      setUnreadCount(count ?? 0);

      channel = supabase
        .channel("global-nav-notif-count")
        .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
          loadUnread();
        })
        .subscribe();
    }
    loadUnread();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [user]); // supabase is a stable singleton — safe to omit from deps



  const isStudio = pathname === "/talent/studio/record";

  return (
    <>
      {!isStudio && <TopBar onOpenMenu={() => setIsDrawerOpen(true)} unreadCount={unreadCount} isImmersive={isImmersive} role={role} />}
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} role={role || "hustler"} user={user} />
      
      <main className={`flex-1 w-full relative transition-colors duration-700 ${
        isImmersive ? "bg-[#0F172A] overflow-hidden" : "bg-[#F0FDFA] overflow-y-auto pb-[calc(100px+env(safe-area-inset-bottom))]"
      }`}>
        <div className={isImmersive ? "h-full" : "pt-32 px-6"}>
          {children}
        </div>
      </main>

      {!isStudio && <MobileNav unreadCount={unreadCount} user={user} role={role} />}
    </>
  );
};
