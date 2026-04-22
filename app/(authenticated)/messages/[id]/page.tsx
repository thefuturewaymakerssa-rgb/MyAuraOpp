"use client";

import { Send, Plus, MoreVertical, ArrowLeft, Loader2, Video, X, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { sendMessage, markAsRead } from "@/lib/actions/messages";
import { maskPhoneNumbers } from "@/utils/privacy";

import { Database } from "@/lib/database.types";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  text: string;
  is_read: boolean;
  created_at: string;
  attachment_url?: string;
  attachment_type?: string;
}

const CHAT_TEMPLATES = [
  "Sharp sharp 🤙",
  "Sho / Sho my bru 🇿🇦",
  "I'm around the corner 📍",
  "Howzit? 👋",
  "Lekker! ✨",
  "Eish 😅",
  "Yebo / Yebo yes ✅",
  "Molo ☀️",
  "Dankie 🙏",
  "No stress / Sharp 🤝",
  "I have the tools 🛠️",
  "What's the address? 🏠",
];

type Conversation = Database['public']['Tables']['conversations']['Row'];
type Maker = Database['public']['Tables']['profiles']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export default function ConversationView({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const conversationId = resolvedParams.id;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [partner, setPartner] = useState<{ id: string; name: string; trade: string } | null>(null);
  const [showVibeCheck, setShowVibeCheck] = useState(false);
  
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setIsUploading(true);
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${conversationId}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file';
      await sendMessage(conversationId, `Sent a ${type}`, publicUrl, type);
    } catch (err) {
      console.error(err);
      toast.error("Attachment transmission failed. Protocol sync required.");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // 2. Get conversation partner info
      const { data: conv } = await supabase
        .from('conversations')
        .select('user_1_id, user_2_id')
        .eq('id', conversationId)
        .single();

      if (conv) {
        const otherId = (conv as Conversation).user_1_id === user.id 
          ? (conv as Conversation).user_2_id 
          : (conv as Conversation).user_1_id;
        
        // Try makers first (Talent)
        const { data: maker } = await supabase
          .from('profiles')
          .select('name, trade')
          .eq('id', otherId)
          .maybeSingle();

        if (maker) {
          setPartner({ id: otherId, name: (maker as Maker).name || "Anonymous", trade: (maker as Maker).trade || "Talent" });
        } else {
          // Fallback to profiles (Employer)
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', otherId)
            .maybeSingle();
          
          if (profile) {
            setPartner({ id: otherId, name: (profile as Profile).name || "Anonymous", trade: 'Employer' });
          }
        }
      }

      // 3. Initial message fetch
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgs) setMessages(msgs as Message[]);
      setLoading(false);
      
      // Initial scroll and mark unread as read
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      if (user) markAsRead(conversationId, user.id);
    }

    fetchData();

    // 4. Subscribe to Realtime (Messages + Presence)
    const channel = supabase.channel(`chat:${conversationId}`);
    channelRef.current = channel;

    channel
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMessages(prev => [...prev, payload.new as Message]);
          setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
          
          // If we receive a message that isn't ours, mark it read immediately if we're active
          if (payload.new.sender_id !== userId) {
            markAsRead(conversationId, userId || "");
          }
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        let partnerOnline = false;
        let partnerTyping = false;
        
        for (const [key, presenceData] of Object.entries(state)) {
          // Compare objects to find partner presence
          if (!presenceData) continue;
          for (const item of presenceData as any[]) {
             if (item.user && item.user !== userId) {
                partnerOnline = true;
                if (item.typing) partnerTyping = true;
             }
          }
        }
        setIsPartnerOnline(partnerOnline);
        setIsPartnerTyping(partnerTyping);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
           const { data: { user } } = await supabase.auth.getUser();
           if (user) await channel.track({ user: user.id, typing: false });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

  const handleTyping = () => {
     if (!channelRef.current || !userId) return;
     channelRef.current.track({ user: userId, typing: true });
     
     if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
     typingTimeoutRef.current = setTimeout(() => {
        channelRef.current.track({ user: userId, typing: false });
     }, 2000);
  };

  const handleSend = async () => {
    if (!msg.trim()) return;
    const currentMsg = msg;
    setMsg("");
    try {
      await sendMessage(conversationId, currentMsg);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message.");
      setMsg(currentMsg);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0F766E]" size={40} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative selection:bg-[#0F766E]/20 mb-20 sm:mb-0">
      
      {/* Chat Header */}
      <header className="py-6 px-8 sm:py-8 sm:px-10 border-b-2 border-[#E2E8F0] bg-white/80 backdrop-blur-3xl flex items-center justify-between z-20 shadow-sm sticky top-0">
        <div className="flex items-center gap-6">
          <Link href="/messages" className="lg:hidden w-12 h-12 rounded-full flex items-center justify-center text-gray-500 hover:text-[#0F766E] transition-colors border-2 border-[#E2E8F0] shadow-sm bg-white">
            <ArrowLeft size={20} />
          </Link>
          <div className="relative group">
            <div className="w-14 h-14 rounded-2xl bg-[#F0FDFA] flex items-center justify-center text-[#0F766E] font-black italic font-display group-hover:rotate-6 transition-all duration-500 text-xl border-2 border-[#E2E8F0] shadow-sm">
              {partner?.name?.[0] || "?"}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#0F766E] rounded-full border-2 border-white animate-pulse shadow-sm" />
          </div>
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter font-display uppercase leading-none mb-1.5 text-[#0F172A]">{partner?.name || "Anonymous Contact"}</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPartnerOnline ? "bg-[#13EC6A] animate-pulse" : "bg-gray-300"}`} />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#0F766E] italic opacity-90">
                 {isPartnerOnline ? "Online" : "Away"} • {partner?.trade || "Secure Link Active"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowVibeCheck(true)}
            className="w-12 h-12 bg-white rounded-[1rem] flex items-center justify-center text-[#0F766E] border-2 border-[#E2E8F0] hover:border-[#0F766E]/30 hover:bg-[#F0FDFA] transition-all shadow-sm hover:scale-105 active:scale-95 group"
            title="Launch Secure Bridge"
          >
            <Video size={20} className="group-hover:rotate-6 transition-transform" />
          </button>
          <button className="w-12 h-12 bg-white rounded-[1rem] flex items-center justify-center text-gray-400 border-2 border-transparent hover:border-[#E2E8F0] hover:text-[#0F172A] transition-all">
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      {/* Vibe Check UI - High Fidelity Bridge */}
      {showVibeCheck && (
        <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="max-w-xl w-full bg-white p-12 sm:p-16 rounded-[4rem] border-2 border-[#E2E8F0] relative overflow-hidden text-center shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
            <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-[#0F766E]/5 rounded-full blur-[80px] pointer-events-none" />
            
            <button 
              onClick={() => setShowVibeCheck(false)}
              className="absolute top-8 right-8 w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-800 transition-all hover:bg-gray-100 hover:rotate-90 border border-gray-200"
            >
              <X size={20} />
            </button>

            <div className="w-28 h-28 rounded-[2rem] bg-[#F0FDFA] flex items-center justify-center text-[#0F766E] mx-auto mb-10 shadow-sm border border-[#0F766E]/10 relative">
              <div className="absolute inset-2 border-2 border-dashed border-[#0F766E]/20 rounded-[1.5rem] animate-spin-slow"></div>
              <Shield size={40} className="relative z-10" />
            </div>

            <h3 className="text-5xl font-black italic tracking-tighter mb-6 font-display uppercase leading-none text-[#0F172A]">Vibe Check.</h3>
            <p className="text-lg text-gray-500 font-bold mb-12 leading-relaxed italic max-w-sm mx-auto">
              Initiating secure visual comms with <span className="text-[#0F766E] underline decoration-[#0F766E]/30">{partner?.name.split(' ')[0]}</span>. High-fidelity protocol active.
            </p>

            <div className="space-y-6 mb-12 px-6">
              <div className="flex items-center gap-5 text-left p-6 bg-gray-50 rounded-[1.5rem] border border-[#E2E8F0] shadow-sm">
                <Sparkles size={24} className="text-[#0F766E] animate-pulse" />
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 italic">SECURE BRIDGE v4.0 // END-TO-END ENCRYPTED</p>
              </div>
            </div>

            <div className="flex flex-col gap-6 px-6 relative z-10">
              <button 
                onClick={() => {
                  toast.info("Protocol established. Launching bridge...");
                  setShowVibeCheck(false);
                }}
                className="w-full py-6 bg-[#0F766E] text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-xl shadow-[#0F766E]/20 hover:scale-[1.02] active:scale-[0.98] transition-all italic border-b-4 border-black/10 text-center flex items-center justify-center"
              >
                Accept Transmission
              </button>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.4em] italic leading-loose">SECURITY NOTICE: PROTECTED BY FUTURE WAYMAKERS COMMERCE ENGINE.</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-10 sm:px-12 sm:py-12 space-y-8 sm:space-y-10 hide-scrollbar bg-transparent">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_id === userId ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] sm:max-w-[75%] space-y-3 ${m.sender_id === userId ? "text-right" : "text-left"}`}>
              <div className={`p-6 sm:p-8 rounded-[2.5rem] text-[14px] sm:text-[15px] font-bold leading-relaxed shadow-sm transition-transform hover:scale-[1.01] duration-300 border-2 ${
                m.sender_id === userId 
                  ? "bg-[#0F766E] text-white rounded-tr-lg border-transparent shadow-md shadow-[#0F766E]/10" 
                  : "bg-white text-gray-700 rounded-tl-lg border-white shadow-md shadow-gray-200/50"
              }`}>
                {m.attachment_url && m.attachment_type === 'image' && (
                  <img src={m.attachment_url} alt="Attachment" className="max-w-full rounded-[1.5rem] mb-6 border-2 border-white/20 shadow-xl" crossOrigin="anonymous" />
                )}
                {m.attachment_url && m.attachment_type === 'video' && (
                  <video src={m.attachment_url} controls className="max-w-full rounded-[1.5rem] mb-6 border-2 border-white/20 shadow-xl" crossOrigin="anonymous" />
                )}
                {m.attachment_url && m.attachment_type === 'file' && (
                  <a href={m.attachment_url} target="_blank" className={`flex items-center gap-3 p-5 rounded-[1.5rem] mb-6 border ${m.sender_id === userId ? "bg-white/10 border-white/20 text-white" : "bg-gray-50 border-gray-100 text-[#0F766E]"}`}>
                    <Plus className="rotate-45" size={20} /> <span className="text-[10px] font-black uppercase tracking-widest italic">Download Attachment</span>
                  </a>
                )}
                {maskPhoneNumbers(m.text)}
              </div>
              <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-400 italic flex items-center gap-2 px-3 justify-inherit">
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {m.sender_id === userId && (
                  <span className={`flex gap-[1px] ml-1 ${m.is_read ? "text-[#13EC6A]" : "text-gray-300"}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="-ml-[8px]"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
        {isPartnerTyping && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="max-w-[85%] sm:max-w-[75%] p-4 sm:p-6 bg-white/50 rounded-[2rem] rounded-tl-lg border border-transparent shadow-sm flex items-center gap-2">
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={scrollRef} className="h-10 sm:h-20" />
      </div>

      {/* Chat Input */}
      <footer className="px-6 py-6 sm:px-10 sm:py-8 z-20 bg-white/90 backdrop-blur-xl border-t-2 border-[#E2E8F0]">
        
        {/* Quick-Action Chips */}
        <div className="max-w-4xl mx-auto flex gap-3 overflow-x-auto pb-6 hide-scrollbar mb-2">
           {CHAT_TEMPLATES.map((tmpl, i) => (
             <button
               key={i}
               onClick={() => {
                 setMsg(tmpl);
                 handleTyping();
               }}
               className="shrink-0 px-6 py-3 bg-[#F0FDFA] border-2 border-[#E2E8F0] rounded-full text-[9px] font-black uppercase tracking-widest text-[#0F766E] italic hover:border-[#0F766E]/30 hover:bg-white transition-all shadow-sm"
             >
               {tmpl}
             </button>
           ))}
        </div>

        <div className="max-w-4xl mx-auto flex gap-4 sm:gap-6 items-center">
          <input 
            type="file" 
            ref={fileRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*,video/*,.pdf,.doc,.docx"
          />
          <button 
            disabled={isUploading}
            onClick={() => fileRef.current?.click()}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-50 rounded-[1.5rem] flex shrink-0 items-center justify-center text-gray-400 hover:text-[#0F766E] hover:border-[#0F766E]/30 transition-all border-2 border-[#E2E8F0] group shadow-sm disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <Plus size={24} className="group-hover:rotate-90 transition-transform" />
            )}
          </button>
          <div className="flex-1 relative group">
            <input 
              value={msg}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              onChange={(e) => {
                 setMsg(e.target.value);
                 handleTyping();
              }}
              placeholder="ENTER SECURE TRANSMISSION..." 
              className="w-full h-14 sm:h-16 bg-white border-2 border-[#E2E8F0] rounded-[2rem] px-6 sm:px-8 outline-none focus:border-[#0F766E]/50 focus:bg-[#F0FDFA]/20 transition-all font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[10px] sm:text-[11px] italic placeholder:text-gray-400 shadow-inner text-[#0F172A]"
            />
          </div>
          <button 
            onClick={handleSend}
            className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 bg-[#0F766E] text-white rounded-[1.5rem] border-b-4 border-black/10 flex items-center justify-center shadow-md shadow-[#0F766E]/30 hover:scale-105 active:scale-95 transition-transform"
          >
            <Send size={20} strokeWidth={3} className="ml-1" />
          </button>
        </div>
        <p className="text-center text-[8px] font-black text-gray-400 uppercase tracking-[0.4em] mt-6 italic opacity-70">WAYMAKERS COMMS ACTIVE // CONNECTION STABLE</p>
      </footer>
    </div>
  );
}
