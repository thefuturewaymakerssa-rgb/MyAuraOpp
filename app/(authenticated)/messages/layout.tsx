"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, MessageSquare, Loader2, Sparkles, MessageCircle } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
import { createConversation } from "@/lib/actions/messages";

interface Conversation {
  id: string;
  last_message: string | null;
  updated_at: string;
  user_1_id: string;
  user_2_id: string;
  other_user?: {
    name: string;
    trade: string;
  };
}

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-screen bg-[#F0FDFA]"><Loader2 className="animate-spin text-[#0F766E]" size={40} /></div>}>
      <MessagesContent>{children}</MessagesContent>
    </Suspense>
  );
}

function MessagesContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const employerIdParam = searchParams.get("employer_id");
  const isListOnly = pathname === "/messages";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"messages" | "notifications">("messages");

  useEffect(() => {
    const supabase = createClient();
    
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch conversations
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          user_1:user_1_id(id),
          user_2:user_2_id(id)
        `)
        .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (data) {
        // Hydrate with profile/maker info
        const hydrated = await Promise.all((data as Conversation[]).map(async (conv) => {
          const otherId = conv.user_1_id === user.id ? conv.user_2_id : conv.user_1_id;
          const { data: maker } = await supabase
            .from('profiles')
            .select('name, trade')
            .eq('id', otherId)
            .single();
          
          return {
            ...conv,
            other_user: (maker as { name: string; trade: string } | null) || { name: "Anonymous", trade: "User" }
          } as Conversation;
        }));
        setConversations(hydrated);
      }
      setLoading(false);
    }
    init();

    // Real-time updates for conversation list
    const channel = supabase
      .channel('conversations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        init();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 🆕 Handle employer_id redirect
  useEffect(() => {
    if (employerIdParam && pathname === "/messages") {
      const handleParamRedirect = async () => {
        try {
          const conversation = await createConversation(employerIdParam);
          if (conversation && (conversation as any).id) {
            router.replace(`/messages/${(conversation as any).id}`);
          }
        } catch (err) {
          console.error("Failed to establish link with partner:", err);
        }
      };
      handleParamRedirect();
    }
  }, [employerIdParam, pathname, router]);

  return (
    <div className="min-h-screen bg-[#F0FDFA]/30 text-[#0F172A] font-sans flex overflow-hidden selection:bg-[#0F766E]/20">
      
      {/* Conversation Sidebar */}
      <aside className={`w-full lg:w-[450px] border-r-2 border-[#E2E8F0] bg-white flex flex-col ${!isListOnly ? "hidden lg:flex" : "flex"} relative z-50 shadow-[20px_0_60px_rgba(0,0,0,0.02)]`}>
        
        <header className="px-10 py-12 border-b-2 border-gray-50 flex items-center justify-between">
           <div className="flex bg-gray-50 p-2 rounded-full border border-gray-200">
             <button 
               onClick={() => setActiveTab("messages")}
               className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] italic transition-all duration-300 ${activeTab === "messages" ? "bg-white text-[#0F766E] shadow-sm border border-[#E2E8F0]" : "text-gray-400 hover:text-gray-600"}`}
             >
               Messages
             </button>
             <button 
               onClick={() => setActiveTab("notifications")}
               className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] italic transition-all duration-300 ${activeTab === "notifications" ? "bg-white text-[#0F766E] shadow-sm border border-[#E2E8F0]" : "text-gray-400 hover:text-gray-600"}`}
             >
               Alerts
             </button>
           </div>
        </header>

        <nav className="flex-1 overflow-y-auto px-6 py-8 hide-scrollbar bg-gray-50/50">
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-32 space-y-6">
                <Sparkles className="animate-pulse text-[#0F766E]" size={40} />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] italic">Decrypting...</p>
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((chat) => (
                <Link 
                  key={chat.id}
                  href={`/messages/${chat.id}`}
                  className={`flex items-center gap-5 p-6 rounded-[2rem] transition-all duration-500 group border-2 relative overflow-hidden ${
                    pathname.includes(`/messages/${chat.id}`) 
                      ? "bg-[#0F766E] text-white border-transparent shadow-[0_10px_30px_rgba(15,118,110,0.2)] scale-[1.02]" 
                      : "bg-white border-white shadow-sm hover:border-[#E2E8F0] hover:shadow-md text-[#0F172A]"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black font-display flex-shrink-0 transition-transform group-hover:rotate-6 shadow-inner ${
                    pathname.includes(`/messages/${chat.id}`) ? "bg-white/10 text-white" : "bg-[#F0FDFA] text-[#0F766E] border border-[#0F766E]/10"
                  }`}>
                    {chat.other_user?.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-black italic text-lg tracking-tight truncate font-display uppercase group-hover:text-current">{chat.other_user?.name}</h3>
                      <span className={`text-[9px] font-black uppercase tracking-widest italic ${
                        pathname.includes(`/messages/${chat.id}`) ? "text-white/60" : "text-gray-400"
                      }`}>
                        {new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-[10px] font-bold truncate leading-relaxed italic ${
                      pathname.includes(`/messages/${chat.id}`) ? "text-white/80" : "text-gray-500"
                    }`}>{chat.last_message || "ESTABLISHING LINK..."}</p>
                  </div>
                </Link>
              )
            )) : (
              <div className="text-center p-20 space-y-8 opacity-60">
                <div className="w-24 h-24 rounded-[2.5rem] bg-white border-2 border-[#E2E8F0] shadow-sm flex items-center justify-center mx-auto">
                    <MessageSquare size={40} className="text-gray-300" />
                </div>
                <div className="space-y-2">
                   <h4 className="font-black italic tracking-[0.2em] font-display uppercase text-2xl text-gray-400">Void Channel.</h4>
                   <p className="text-[9px] uppercase font-bold text-gray-400 tracking-[0.4em] italic">Establish Secure Link</p>
                </div>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Chat Area Context Space */}
      <main className={`flex-1 relative flex flex-col ${isListOnly ? "hidden lg:flex" : "flex"} bg-[#F0FDFA]`}>
         {/* Subtle pattern or gradient background */}
         <div className="absolute inset-0 bg-[#0F766E]/[0.02] bg-[url('https://www.transparenttextures.com/patterns/cartographer.png')] pointer-events-none opacity-50" />
         
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </main>

    </div>
  );
}
