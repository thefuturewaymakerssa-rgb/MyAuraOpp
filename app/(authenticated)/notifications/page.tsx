"use client";

import { useEffect, useState } from "react";
import { Bell, Zap, MessageSquare, Star, ArrowRight, ShieldCheck, DollarSign, AlertCircle, Clock, Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

function getIcon(type: string) {
  switch (type) {
    case "contract_update": return DollarSign;
    case "contract_dispute": return AlertCircle;
    case "message": return MessageSquare;
    case "review": return Star;
    case "verification": return ShieldCheck;
    case "gig": return Zap;
    default: return Bell;
  }
}

function getRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)
        .then(({ data }) => {
          setNotifications((data as Notification[]) || []);
          setLoading(false);
        });
    });
  }, []);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMarkingAll(false); return; }

    await (supabase.from("notifications") as any)
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);

    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setMarkingAll(false);
  };

  const handleMarkOneRead = async (id: string) => {
    const supabase = createClient();
    await (supabase.from("notifications") as any)
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center">
        <Sparkles className="animate-pulse text-[#0F766E]" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FDFA] text-[#0F172A] font-sans p-6 sm:p-12 lg:p-20 relative overflow-hidden selection:bg-[#0F766E]/20">
      
      {/* Ambient Background Blur */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[#0F766E]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-12 sm:space-y-16 relative z-10 mb-32">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 text-[10px] font-black text-[#0F766E] uppercase tracking-[0.4em] mb-4 italic">
              <Bell size={14} />
              {unreadCount > 0 ? `${unreadCount} High Priority` : "System Nominal"}
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic tracking-tighter font-display uppercase leading-[0.85] text-[#0F172A]">
              Alerts.
            </h1>
            <p className="text-gray-500 font-black uppercase tracking-[0.4em] text-[10px] mt-6 italic">
              Live Operations Protocol
            </p>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-white bg-[#0F766E] px-6 py-3 rounded-full hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#0F766E]/30 italic flex items-center gap-2 disabled:opacity-50"
            >
              {markingAll ? <Loader2 size={12} className="animate-spin" /> : null}
              Acknowledge All
            </button>
          )}
        </header>

        {notifications.length === 0 ? (
          <div className="py-24 sm:py-32 bg-white text-center rounded-[3.5rem] border-2 border-dashed border-[#E2E8F0] shadow-sm">
            <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
               <Bell className="text-gray-300" size={40} />
            </div>
            <h3 className="text-3xl sm:text-4xl font-black mb-4 italic tracking-tighter font-display uppercase text-gray-300">All Quiet.</h3>
            <p className="text-gray-400 font-bold max-w-sm mx-auto text-sm px-6">
              No active alerts. Market signals, contract updates, and messaging events will broadcast here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {notifications.map((n) => {
              const Icon = getIcon(n.type);
              const isUnread = !n.read_at;
              return (
                <div
                  key={n.id}
                  className={`bg-white p-6 sm:p-8 rounded-[2.5rem] flex items-center justify-between group transition-all duration-300 border-2 shadow-sm cursor-pointer ${
                    isUnread 
                      ? "border-[#0F766E]/20 hover:border-[#0F766E]/40 hover:shadow-md" 
                      : "border-transparent hover:border-[#E2E8F0] opacity-70 hover:opacity-100"
                  }`}
                  onClick={() => isUnread && handleMarkOneRead(n.id)}
                >
                  <div className="flex items-center gap-6 sm:gap-8 overflow-hidden pr-4">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                      isUnread 
                        ? "bg-[#F0FDFA] text-[#0F766E] border border-[#0F766E]/10 scale-105 shadow-inner" 
                        : "bg-gray-50 text-gray-400 border border-gray-100"
                    }`}>
                      <Icon size={isUnread ? 24 : 20} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm sm:text-base font-bold leading-snug mb-2 truncate ${isUnread ? "text-[#0F172A]" : "text-gray-500"}`}>
                        {n.message}
                      </p>
                      <p className={`text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2 italic ${
                         isUnread ? "text-[#0F766E]/70" : "text-gray-400"
                      }`}>
                         <Clock size={10} />
                        {getRelativeTime(n.created_at)}
                      </p>
                    </div>
                  </div>
                  {isUnread && (
                    <div className="w-4 h-4 rounded-full bg-[#0F766E] shadow-[0_0_15px_rgba(15,118,110,0.4)] flex-shrink-0 ml-4 animate-pulse relative border-2 border-white" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
