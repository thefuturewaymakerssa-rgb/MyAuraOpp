"use client";

import { useState, useRef, useEffect, useMemo, useCallback, forwardRef } from "react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import Link from "next/link";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Briefcase, 
  User, 
  ShieldCheck, 
  Music,
  ArrowLeft,
  Search,
  MoreVertical,
  Volume2,
  VolumeX,
  Video,
  Plus,
  SlidersHorizontal,
  X,
  Languages,
  MapPin,
  Sparkles,
  ChevronRight,
  ArrowRight,
  AlertTriangle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { savedMakersHub, reportsHub } from "@/lib/supabase-helpers";
import dynamic from "next/dynamic";
import { Loader2, Sparkles as SparklesIcon } from "lucide-react";
import { scoreDiscoveryMatch } from "@/lib/scoring";
import { toast } from "sonner";

const MapFeed = dynamic(() => import("@/components/MapFeed"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[100dvh] bg-[#F0FDFA] flex flex-col items-center justify-center">
      <div className="w-24 h-24 rounded-[2rem] bg-white border-2 border-[#E2E8F0] flex items-center justify-center shadow-xl animate-pulse">
         <Loader2 className="animate-spin text-[#0F766E]" size={40} />
      </div>
      <p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-[#0F766E] italic">Initializing Radar...</p>
    </div>
  )
});

export type FeedItem = {
  id: string;
  makerId: string;
  makerName: string;
  makerAvatar: string | null;
  makerTrade: string;
  makerLocation: string;
  makerVerified: boolean;
  videoUrl: string;
  title: string;
  createdAt: string;
  hourlyRate: number;
  latitude: number | null;
  longitude: number | null;
  role: string;
  skills: string[];
};

interface VibeFeedClientProps {
  initialFeed: FeedItem[];
  savedIds: string[];
  userId: string;
}

// Helper: Haversine distance in km
const getDistance = (lat1: number | null, lon1: number | null, lat2: number | null, lon2: number | null) => {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return 9999;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const LANGUAGES = ["Any", "English", "IsiZulu", "IsiXhosa", "Afrikaans", "Sesotho", "Setswana"];

// Define custom list component outside to maintain stable reference and solve generic display-name lint errors
const VirtuosoList = forwardRef<HTMLDivElement, any>(({ style, children, ...props }, ref) => (
  <div
    ref={ref}
    style={style}
    {...props}
    className="snap-y snap-mandatory overflow-y-scroll h-full w-full hide-scrollbar"
  >
    {children}
  </div>
));
VirtuosoList.displayName = "VirtuosoList";

export default function VibeFeedClient({ initialFeed, savedIds: initialSavedIds, userId }: VibeFeedClientProps) {
  const router = useRouter();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(initialSavedIds));
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");

  // Filter States
  const [maxRadius, setMaxRadius] = useState<number>(50); // km
  const [maxPrice, setMaxPrice] = useState<number>(1000); // R/hr
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedLang, setSelectedLang] = useState<string>("Any");
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [viewMode, setViewMode] = useState<"video" | "map">("video");

  // Detect user location for radius filtering
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  // Compute filtered and ranked feed
  const feed = useMemo(() => {
    const filtered = initialFeed.filter(item => {
      if (userCoords) {
        const dist = getDistance(userCoords.lat, userCoords.lng, item.latitude, item.longitude);
        if (dist > maxRadius) return false;
      }
      if (item.hourlyRate > maxPrice) return false;
      if (selectedRole !== "all" && item.role !== selectedRole) return false;
      if (selectedLang !== "Any") {
          const hasLang = (item.skills || []).some(s => s.toLowerCase().includes(selectedLang.toLowerCase()));
          if (!hasLang) return false;
      }
      return true;
    });

    if (activeTab === "foryou") {
      return [...filtered].sort((a, b) => {
        const scoreA = scoreDiscoveryMatch(a, { userCoords, targetRadius: maxRadius, userHistory: { likedIds, savedIds } });
        const scoreB = scoreDiscoveryMatch(b, { userCoords, targetRadius: maxRadius, userHistory: { likedIds, savedIds } });
        return scoreB - scoreA;
      });
    }

    return filtered;
  }, [initialFeed, userCoords, maxRadius, maxPrice, selectedRole, selectedLang, activeTab, likedIds, savedIds]);

  const toggleSave = async (makerId: string) => {
    const currentlySaved = savedIds.has(makerId);

    // 1. Optimistic UI Update (Instant Feedback)
    setSavedIds(prev => {
      const next = new Set(prev);
      if (currentlySaved) next.delete(makerId);
      else next.add(makerId);
      return next;
    });

    // 2. Background Network Sync
    try {
      if (currentlySaved) {
        await savedMakersHub.remove(userId, makerId);
      } else {
        await savedMakersHub.upsert(userId, makerId);
      }
    } catch (err) {
      // 3. Rollback on failure
      setSavedIds(prev => {
        const next = new Set(prev);
        if (currentlySaved) next.add(makerId);
        else next.delete(makerId);
        return next;
      });
    }
  };

  const toggleLike = (id: string) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // rangeChanged replaces manual IntersectionObserver for autoplay synchronization
  const handleRangeChanged = useCallback(({ startIndex, endIndex }: { startIndex: number; endIndex: number }) => {
    // We calculate the center index to determine which video should be "Active"
    const centerIndex = Math.floor((startIndex + endIndex) / 2);
    if (centerIndex !== activeIndex && centerIndex >= 0 && centerIndex < feed.length) {
      setActiveIndex(centerIndex);
    }
  }, [activeIndex, feed.length]);

  if (feed.length === 0) {
    return (
      <div className="h-screen w-full bg-[#F0FDFA] text-[#0F172A] flex flex-col items-center justify-center font-display pb-20 relative">
        <header className="absolute top-0 left-0 w-full z-50 p-6 flex items-center justify-between">
          <button onClick={() => router.back()} className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-500 hover:text-[#0F766E] border-2 border-[#E2E8F0] shadow-sm transition-all hover:scale-110">
            <ArrowLeft size={24} />
          </button>
          <button 
            onClick={() => setShowFilters(true)}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-500 hover:text-[#0F766E] border-2 border-[#E2E8F0] shadow-sm transition-all hover:scale-110"
          >
            <SlidersHorizontal size={20} />
          </button>
        </header>

        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-8 border-2 border-dashed border-[#E2E8F0]">
           <Video size={40} className="text-[#0F766E]/50" />
        </div>
        <h2 className="text-4xl font-black italic uppercase tracking-tighter">No Frequencies</h2>
        <p className="text-gray-500 font-bold mt-4 text-center max-w-xs text-xs uppercase tracking-widest italic opacity-80">Adjust radius or budget parameters to find local talent.</p>
        <button onClick={() => {
          setMaxRadius(250);
          setMaxPrice(2500);
          setSelectedRole("all");
          setSelectedLang("Any");
        }} className="mt-8 px-8 py-4 bg-[#0F766E] text-white rounded-full font-black uppercase tracking-[0.4em] text-[10px] hover:scale-105 shadow-xl shadow-[#0F766E]/20 transition-all italic">
          Reset Radar
        </button>

        {showFilters && <FilterOverlay onClose={() => setShowFilters(false)} states={{ maxRadius, setMaxRadius, maxPrice, setMaxPrice, selectedRole, setSelectedRole, selectedLang, setSelectedLang }} /> }
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-[#0F172A] text-white relative flex flex-col font-sans overflow-hidden select-none">
      
      {showFilters && (
        <FilterOverlay 
          onClose={() => setShowFilters(false)} 
          states={{ maxRadius, setMaxRadius, maxPrice, setMaxPrice, selectedRole, setSelectedRole, selectedLang, setSelectedLang }} 
        />
      )}
      
      {/* Overlay Header Elements */}
      <div className="absolute top-12 left-0 right-0 z-40 flex justify-between items-center px-6 pointer-events-none">
         <button onClick={() => router.back()} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/20 border border-white/20 shadow-lg transition-all pointer-events-auto active:scale-95">
           <ArrowLeft size={24} />
         </button>

         {/* Toggle View Mode */}
         <div className="pointer-events-auto">
            <div className="bg-white/10 backdrop-blur-xl p-2 rounded-full border border-white/20 flex gap-2 shadow-2xl">
               <button 
                 onClick={() => setViewMode("video")}
                 className={`w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all duration-500 scale-90 ${viewMode === "video" ? "bg-white text-[#0F766E] shadow-xl rotate-0" : "text-white hover:bg-white/10 rotate-12"}`}
               >
                 <Video size={24} />
               </button>
               <button 
                 onClick={() => setViewMode("map")}
                 className={`w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all duration-500 scale-90 ${viewMode === "map" ? "bg-white text-[#0F766E] shadow-xl rotate-0" : "text-white hover:bg-white/10 -rotate-12"}`}
               >
                 <MapPin size={24} />
               </button>
            </div>
         </div>

         {/* Radar Status Chip */}
         <div className="pointer-events-auto hidden sm:block">
            <button 
              onClick={() => setShowFilters(true)}
              className="bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-x-3 text-white hover:bg-white/20 transition-all italic shadow-2xl"
            >
               <Sparkles size={14} className="text-amber-400" /> {userCoords ? "Local Radar" : "Global Feed"} <span className="opacity-40">/</span> {maxRadius}km
            </button>
         </div>

         <div className="flex gap-4 pointer-events-auto">
            <button 
              onClick={() => setShowFilters(true)}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/20 border border-white/20 shadow-lg transition-all active:scale-95 sm:hidden"
            >
              <SlidersHorizontal size={20} />
            </button>
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white border border-white/20 opacity-0" /> {/* Spacer */}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full h-full relative">
        {viewMode === "video" ? (
          <Virtuoso
            ref={virtuosoRef}
            style={{ height: '100%', width: '100%' }}
            data={feed}
            rangeChanged={handleRangeChanged}
            overscan={300}           // ~1 screen preload
            increaseViewportBy={400} // Buffer for smoother autoplay
            itemContent={(index, item) => (
              <VideoPlayer 
                key={item.id} 
                item={item} 
                index={index}
                isActive={index === activeIndex}
                activeIndex={activeIndex}
                isMuted={isMuted}
                toggleMute={() => setIsMuted(!isMuted)}
                isSaved={savedIds.has(item.makerId)}
                onSave={() => toggleSave(item.makerId)}
                isLiked={likedIds.has(item.id)}
                onLike={() => toggleLike(item.id)}
                userId={userId}
              />
            )}
            components={{
              // Custom list component to handle snap-y physics
              List: VirtuosoList,
            }}
          />
        ) : (
          <MapFeed 
            items={feed} 
            userCoords={userCoords}
            onShowVideo={(index) => {
              setActiveIndex(index);
              setViewMode("video");
              setTimeout(() => {
                virtuosoRef.current?.scrollToIndex({ index, align: 'start', behavior: 'auto' });
              }, 100);
            }} 
          />
        )}
      </div>
    </div>
  );
}

interface FilterState {
  maxRadius: number;
  setMaxRadius: (r: number) => void;
  maxPrice: number;
  setMaxPrice: (p: number) => void;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  selectedLang: string;
  setSelectedLang: (lang: string) => void;
}

function FilterOverlay({ onClose, states }: { onClose: () => void, states: FilterState }) {
  return (
    <div className="absolute inset-0 z-[100] bg-white/90 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-500 flex flex-col p-10 font-sans text-[#0F172A]">
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#0F766E]/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="flex items-center justify-between mb-12 relative z-10">
        <div className="flex flex-col">
           <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase font-display leading-none text-[#0F766E]">Feed Radar</h2>
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-2 italic">Filter Protocol Active</span>
        </div>
        <button onClick={onClose} className="p-4 bg-gray-50 rounded-full hover:bg-gray-100 hover:text-red-500 transition-colors border border-gray-200">
          <X size={28} />
        </button>
      </div>

      <div className="space-y-12 flex-1 overflow-y-auto pr-4 relative z-10 hide-scrollbar pb-10">
        {/* Radius Filter */}
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-[#E2E8F0] shadow-sm space-y-6">
          <div className="flex justify-between items-end">
            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 italic">Operating Radius</label>
            <span className="text-3xl font-black italic font-display tracking-tight text-[#0F766E]">{states.maxRadius}km</span>
          </div>
          <input 
            type="range" min="10" max="250" step="10"
            value={states.maxRadius} onChange={(e) => states.setMaxRadius(Number(e.target.value))}
            className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-[#0F766E]"
          />
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] italic">
            <span>10km</span>
            <span>Local Market</span>
            <span>250km+</span>
          </div>
        </div>

        {/* Price Filter */}
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-[#E2E8F0] shadow-sm space-y-6">
          <div className="flex justify-between items-end">
             <div className="flex items-center gap-2">
               <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 italic">Budget Ceiling</label>
             </div>
            <span className="text-3xl font-black italic font-display tracking-tight text-[#8B5CF6]">R{states.maxPrice}<span className="text-base text-gray-400 tracking-widest">/hr</span></span>
          </div>
          <input 
            type="range" min="50" max="2500" step="50"
            value={states.maxPrice} onChange={(e) => states.setMaxPrice(Number(e.target.value))}
            className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-[#8B5CF6]"
          />
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] italic">
            <span>R50</span>
            <span>Pro Tier</span>
            <span>R2500+</span>
          </div>
        </div>

        {/* Background Filter */}
        <div className="space-y-6">
          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 italic px-4">Talent Profile</label>
          <div className="grid grid-cols-2 gap-4">
            {['all', 'hustler', 'freshie', 'graduate', 'reskiller'].map((r) => (
              <button 
                key={r}
                onClick={() => states.setSelectedRole(r)}
                className={`p-5 rounded-[1.5rem] border-2 font-black uppercase tracking-[0.3em] text-[10px] transition-all italic ${states.selectedRole === r ? 'bg-white border-[#0F766E] text-[#0F766E] shadow-xl shadow-[#0F766E]/10 scale-105' : 'bg-transparent border-[#E2E8F0] text-gray-400 hover:border-gray-300'}`}
              >
                {r === 'all' ? 'All Makers' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Language Filter */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-4">
            <Languages size={16} className="text-[#0F766E]" />
            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 italic">Communication Protocol</label>
          </div>
          <div className="flex flex-wrap gap-3">
            {LANGUAGES.map((l) => (
              <button 
                key={l}
                onClick={() => states.setSelectedLang(l)}
                className={`px-5 py-3 rounded-full transition-all font-black text-[10px] uppercase tracking-[0.3em] italic border-2 ${states.selectedLang === l ? 'bg-[#0F766E] border-transparent text-white shadow-lg shadow-[#0F766E]/20' : 'bg-white text-gray-400 border-[#E2E8F0] hover:border-gray-300'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button 
        onClick={onClose}
        className="w-full bg-[#0F766E] text-white py-8 rounded-[2rem] font-black uppercase tracking-[0.5em] text-[11px] shadow-2xl shadow-[#0F766E]/30 mt-4 active:scale-95 transition-all flex items-center justify-center gap-3 italic"
      >
        Execute Scan <ArrowRight size={18} className="translate-y-px" />
      </button>
    </div>
  );
}

interface VideoPlayerProps {
  item: FeedItem;
  index: number;
  isActive: boolean;
  activeIndex: number;
  isMuted: boolean;
  toggleMute: () => void;
  isSaved: boolean;
  onSave: () => void;
  isLiked: boolean;
  onLike: () => void;
  userId: string;
}

function VideoPlayer({ item, index, isActive, activeIndex, isMuted, toggleMute, isSaved, onSave, isLiked, onLike, userId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  // High-Performance Virtualization Check:
  // Only mount the <video> tag if within +/- 1 of the active feed index
  const isNear = Math.abs(index - activeIndex) <= 1;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isActive) {
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else {
      video.pause();
    }

    return () => {
      // Memory crash fix: Explicitly empty buffer and load to gc on unmount 
      if (video) {
        video.pause();
        video.src = "";
        video.load();
      }
    };
  }, [isActive, isNear]);

  return (
    <div 
      className="video-container relative w-full h-[100dvh] snap-start snap-always bg-black flex items-center justify-center overflow-hidden"
      style={{ scrollSnapAlign: 'start' }}
      onClick={toggleMute}
    >
      {/* Video Element Placeholder/Real */}
      {isNear ? (
         <video
           ref={videoRef}
           src={item.videoUrl}
           loop
           muted={isMuted}
           playsInline
           crossOrigin="anonymous"
           className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
           style={{ opacity: isActive ? 1 : 0.4 }}
         />
      ) : (
         <div className="absolute inset-0 w-full h-full bg-[#050B08] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white/5 border-t-[#0F766E]/50 rounded-full animate-spin" />
         </div>
      )}
      
      {/* Immersive Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />

      {/* Mute Toggle */}
      <button className="absolute top-[30%] right-6 z-40 p-4 rounded-full bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 transition-all border border-white/20 active:scale-95 shadow-xl" onClick={(e) => { e.stopPropagation(); toggleMute(); }}>
        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </button>

      {/* Right Action Stack */}
      <div className="absolute right-6 bottom-36 flex flex-col items-center gap-8 z-40" onClick={e => e.stopPropagation()}>
        
        {/* Profile Avatar */}
        <div className="relative group cursor-pointer hover:scale-105 active:scale-95 transition-transform" onClick={() => router.push(`/u/${item.makerId}`)}>
           <div className="w-14 h-14 rounded-[1.2rem] border-[3px] border-white overflow-hidden bg-white shadow-2xl flex items-center justify-center">
             {item.makerAvatar ? (
               <img src={item.makerAvatar} alt={item.makerName} className="w-full h-full object-cover" crossOrigin="anonymous" />
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0F766E] to-[#8B5CF6] text-white font-black text-xl italic">{item.makerName?.[0]}</div>
             )}
           </div>
           <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 bg-[#0F766E] rounded-full flex items-center justify-center border-2 border-white shadow-md">
              <Plus size={16} strokeWidth={3} className="text-white" />
           </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-2 group mt-2">
          <button 
            onClick={onLike}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all bg-white/5 backdrop-blur-md border border-white/10 ${isLiked ? 'text-red-500 bg-white/10' : 'text-white hover:bg-white/20'}`}
          >
            <Heart size={28} className={isLiked ? "fill-red-500 scale-110 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all" : ""} />
          </button>
          <span className="text-[10px] font-black text-white drop-shadow-md uppercase tracking-widest">{isLiked ? '1.2K' : '1.1K'}</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all">
            <MessageCircle size={28} className="fill-white/20" />
          </button>
          <span className="text-[10px] font-black text-white drop-shadow-md uppercase tracking-widest">342</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={onSave}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all bg-white/5 backdrop-blur-md border border-white/10 ${isSaved ? 'text-amber-400 bg-white/10' : 'text-white hover:bg-white/20'}`}
          >
            <Bookmark size={28} className={isSaved ? "fill-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]" : ""} />
          </button>
          <span className="text-[10px] font-black text-white drop-shadow-md uppercase tracking-widest">Save</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all">
            <Share2 size={28} className="fill-white/20" />
          </button>
          <span className="text-[10px] font-black text-white drop-shadow-md uppercase tracking-widest">Share</span>
        </div>

        <div className="flex flex-col items-center gap-2 mt-4">
          <button 
            onClick={async (e) => {
              e.stopPropagation();
              const reason = prompt("Why are you flagging this frequency? (Inappropriate content, Scam, etc.)");
              if (reason) {
                try {
                  await reportsHub.insert({
                    reporter_id: userId,
                    proof_id: item.id,
                    target_id: item.makerId,
                    reason: reason,
                    status: 'pending'
                  });
                  toast.info("Report logged! 🛡️ Safety protocol initiated.");
                } catch (err) {
                  // Silent failure or handle UI error
                }
              }
            }}
            title="Flag Content"
            className="w-10 h-10 rounded-full flex items-center justify-center text-red-500/50 hover:text-red-500 bg-white/5 backdrop-blur-md border border-red-500/10 hover:border-red-500/30 transition-all active:scale-95 shadow-xl"
          >
            <AlertTriangle size={18} />
          </button>
        </div>
      </div>

      {/* Bottom Information Overlay */}
      <div className="absolute left-6 bottom-32 right-28 z-40 flex flex-col gap-5 border-l-2 border-[#0F766E] pl-6" onClick={e => e.stopPropagation()}>
         <div className="flex items-center gap-3">
            <Link href={`/u/${item.makerId}`} className="text-2xl md:text-3xl font-black italic uppercase font-display tracking-tight text-white hover:underline flex items-center gap-3 drop-shadow-lg">
              @{item.makerName.replace(/\s+/g, '').toLowerCase()}
              {item.makerVerified && <ShieldCheck size={22} className="text-[#0F766E]" fill="currentColor" fillOpacity={0.2} />}
            </Link>
         </div>

         <p className="text-base font-bold text-white/90 drop-shadow-lg leading-relaxed max-w-sm italic">
           {item.title || "Demonstrating high-tier workflow protocols. Standby for operation."}
         </p>

         <div className="flex flex-wrap gap-3">
            <span className="px-4 py-2 rounded-lg bg-[#0F766E] text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-lg shadow-[#0F766E]/40 italic">
               Protocol: {item.makerTrade}
            </span>
            <span className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-xl text-[10px] font-black uppercase tracking-[0.3em] text-white border border-white/20 shadow-lg italic">
               {item.makerLocation?.split(',')[0]}
            </span>
            {item.hourlyRate > 0 && (
              <span className="px-4 py-2 rounded-lg bg-[#8B5CF6]/20 backdrop-blur-xl text-[10px] font-black uppercase tracking-[0.3em] text-[#C4B5FD] border border-[#8B5CF6]/30 shadow-lg italic">
                R{item.hourlyRate}/Hr
              </span>
            )}
         </div>

         {/* Hire CTA */}
         <div className="pt-4 flex items-center gap-4">
            <Link 
              href={`/employer/escrow/new?maker_id=${item.makerId}`}
              className="bg-white text-[#0F172A] px-10 py-5 rounded-[1.5rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-3 italic"
            >
              <Briefcase size={18} className="text-[#0F766E]" /> Initialize Hire 
            </Link>
         </div>
      </div>
    </div>
  );
}
