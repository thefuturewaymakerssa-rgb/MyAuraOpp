"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { X, Settings, Image as ImageIcon, Mic as MicIcon, Square, Loader2, Camera, RefreshCw, Zap, Play, CloudOff, CloudLightning, Video, AlertCircle } from "lucide-react";
import { saveProofOffline, getOfflineProofs, deleteOfflineProof, OfflineProof } from "@/lib/utils/offline";
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics";
import { createClient } from "@/utils/supabase/client";
import { useVideoCompression } from "@/hooks/useVideoCompression";
import { PreFlightOverlay } from "@/components/studio/PreFlightOverlay";
import { RecordingHUD } from "@/components/studio/RecordingHUD";
import { SkillCoach } from "@/components/studio/SkillCoach";
import { QuickTemplates } from "@/components/studio/QuickTemplates";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const AUDIO_TRACKS = [
  { name: "Pure Vibe", url: null },               // No audio — clean recording
  { name: "Amapiano Groove", url: "/audio/amapiano-groove.mp3" },
  { name: "Township Funk", url: "/audio/township-funk.mp3" },
  { name: "Urban Hustle", url: "/audio/urban-hustle.mp3" },
  { name: "Gqom Energy", url: "/audio/gqom-energy.mp3" },
];

const DIRECTOR_CUES = [
  { title: "Protocol Initiated", text: "State your name, location, and specialization.", time: 5 },
  { title: "Visual Evidence", text: "Showcase your setup, tools, or current operation.", time: 20 },
  { title: "The Handshake", text: "Close with a confident call to action. State your terms.", time: 5 }
];

export default function RecordProof() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [maxTime, setMaxTime] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [activeCue, setActiveCue] = useState(0);
  const [offlineProofs, setOfflineProofs] = useState<OfflineProof[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<"setup" | "record" | "review">("setup");
  const [profile, setProfile] = useState<"hq" | "saver">("hq");
  const [session, setSession] = useState<any>(null);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState<"camera" | "ai">("camera");
  const [userTrade, setUserTrade] = useState("General");

  const [shouldAutoSync, setShouldAutoSync] = useState(false);

  const { trimVideo, isCompressing: isProcessing, progress: processProgress, status: processStatus } = useVideoCompression();
  const [pendingVideo, setPendingVideo] = useState<{ blob: Blob; url: string } | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(30);
  const [selectedAudio, setSelectedAudio] = useState<string | undefined>(undefined);


  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await createClient().auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setSession(user);
      
      // Load user trade from profile
      const { data: profile } = await createClient().from("profiles").select("trade").eq("id", user.id).single();
      if ((profile as any)?.trade) setUserTrade((profile as any).trade);
    }
    checkAuth();
  }, []);

  // Callback Ref for the Viewfinder — ensures binding even with AnimatePresence delays
  const viewfinderRef = (node: HTMLVideoElement | null) => {
    if (node && stream) {
      node.srcObject = stream;
    }
  };

  const handleStartStudio = async (selectedProfile: "hq" | "saver") => {
    try {
      setProfile(selectedProfile);
      const userStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user", 
          width: selectedProfile === "hq" ? { ideal: 1920 } : { ideal: 1280 }, 
          height: selectedProfile === "hq" ? { ideal: 1080 } : { ideal: 720 } 
        },
        audio: true,
      });
      setStream(userStream);
      setActiveTab("record");
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access optics. Check device permissions.");
    }
  };

  useEffect(() => {
    return () => {
      // Release hardware tracks
      stream?.getTracks().forEach(track => track.stop());
      // Explicitly stop MediaRecorder if unmounting during active session
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          // Ignore if already stopped
        }
        mediaRecorderRef.current = null;
      }
    };
  }, [stream]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          const currentMax = activeTemplate === "intro" ? 30 : 60;
          if (prev >= currentMax) {
            stopRecording();
            return currentMax;
          }
          const elapsed = prev + 1;
          if (elapsed <= 5) setActiveCue(0);
          else if (elapsed <= 25) setActiveCue(1);
          else setActiveCue(2);
          return elapsed;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, activeTemplate]);

  const getSupportedMimeType = () => {
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4;codecs=avc1,mp4a.40.2",
      "video/mp4",
      "video/quicktime",
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "";
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    
    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      setError("No compatible video recording format found on this device.");
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setPendingVideo({ blob, url });
        setTrimEnd(recordingTime);
        setActiveTab("review");
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error("Recording start error:", err);
      setError("Failed to start recording session.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleProcessAndUpload = async () => {
    if (!pendingVideo) return;
    
    try {
      const duration = trimEnd - trimStart;
      const file = new File([pendingVideo.blob], "raw.mp4", { type: pendingVideo.blob.type });
      
      const processedFile = await trimVideo(file, trimStart, duration, selectedAudio);
      await handleUpload(processedFile, "mp4");
    } catch (err) {
      console.error(err);
      setError("Post-production failure. Protocol corrupted.");
    }
  };

  const handleUpload = async (blob: Blob, ext: string = "webm") => {
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", blob, `recording.${ext}`);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Upload failed");
      }
      const result = await response.json();

      sessionStorage.setItem("proof_video_url", result.url);
      trackEvent(ANALYTICS_EVENTS.VIBECHECK_RECORDED, { url: result.url });

      // Check Onboarding Status
      const supa = createClient();
      const { data: { user: currentUser } } = await supa.auth.getUser();
      
      let isOnboarded = false;
      if (currentUser) {
         const { data: maker } = await supa.from("profiles").select("onboarded").eq("id", currentUser.id).single() as any;
         isOnboarded = maker?.onboarded || false;
      }

      if (isOnboarded) {
         router.push("/talent/studio/publish");
      } else {
         router.push("/onboarding");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      await saveProofOffline(blob, `Proof_${new Date().toISOString()}.${ext}`);
      const offline = await getOfflineProofs();
      setOfflineProofs(offline);
      setError(`Network protocol failure 🔋. Proof encoded and saved locally for sync.`);
      setIsUploading(false);
    }
  };

  const handleSync = async () => {
    if (offlineProofs.length === 0 || isSyncing) return;
    setIsSyncing(true);
    setIsUploading(true);

    try {
      for (const proof of offlineProofs) {
        const formData = new FormData();
        formData.append("file", proof.blob, proof.filename || "sync.webm");

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          await deleteOfflineProof(proof.id);
        }
      }
      
      const remaining = await getOfflineProofs();
      setOfflineProofs(remaining);
      if (remaining.length === 0) {
        toast.success("Syncing complete. Output verified.");
        router.push("/onboarding");
      }
    } catch (err) {
      console.error("Sync error:", err);
      setError("Network issues detected. Proceeding later.");
    } finally {
      setIsSyncing(false);
      setIsUploading(false);
      setShouldAutoSync(false); // Reset auto-sync flag
    }
  };

  useEffect(() => {
    if (shouldAutoSync && !isSyncing && !isRecording && !isUploading && offlineProofs.length > 0) {
      handleSync();
    }
  }, [shouldAutoSync, isSyncing, isRecording, isUploading, offlineProofs]);

  const isValidLength = (trimEnd - trimStart) >= 30 && (trimEnd - trimStart) <= 180;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-cyan-400/30 bg-[#0F172A] text-white">
      
      {/* Top Navigation */}
      <div className="absolute top-0 w-full p-8 md:p-12 flex justify-between items-center z-[60]">
        <Link href="/talent/dashboard" className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-3xl hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 shadow-lg active:scale-95 group">
          <X size={24} className="group-hover:rotate-90 transition-transform" />
        </Link>
        <div className="flex gap-4">
           {activeTab === 'record' && (
             <div className="bg-black/40 backdrop-blur-3xl px-6 py-3 rounded-full flex items-center gap-3 border border-white/10 shadow-xl">
               <span className="text-[10px] font-black uppercase tracking-widest text-[#FACC15] italic">Create Shapa</span>
               <div className="w-1 h-3 bg-white/20"></div>
               <span className="text-[10px] font-bold text-white/60">{userTrade} 🔥</span>
             </div>
           )}
           {activeTab !== 'setup' && (
             <div className="bg-white/5 backdrop-blur-3xl px-6 py-3 rounded-full flex items-center gap-4 border border-white/10 shadow-xl">
               <div className={`w-3 h-3 rounded-full ${isRecording ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse" : "bg-gray-400"}`}></div>
               <span className="font-black tracking-[0.4em] text-[9px] italic uppercase text-gray-200">{activeTab.toUpperCase()}</span>
             </div>
           )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "setup" && (
           <motion.div 
             key="setup"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 z-[100]"
           >
             <PreFlightOverlay onReady={handleStartStudio} />
           </motion.div>
        )}

        {activeTab === "record" && (
          <motion.div 
            key="record"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative w-full h-full flex flex-col items-center justify-center"
          >
             <div className="relative w-full max-w-sm aspect-[9/16] bg-black rounded-[3.5rem] overflow-hidden border-[8px] border-white/10 shadow-2xl mx-auto shadow-black flex items-center justify-center">
                <video 
                  ref={viewfinderRef}
                  autoPlay 
                  muted 
                  playsInline
                  crossOrigin="anonymous"
                  className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                />
                
                {/* AI Skill Coach */}
                {activeTab === "record" && (
                  <SkillCoach trade={userTrade} isRecording={isRecording} elapsedTime={recordingTime} />
                )}

                {/* Template Overlays */}
                <AnimatePresence>
                   {activeTemplate && isRecording && (
                     <motion.div 
                        initial={{ opacity: 0, scale: 2 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-[65]"
                     >
                        <span className="text-4xl font-black italic text-[#FACC15] drop-shadow-[0_0_20px_rgba(250,204,21,0.5)] text-center px-6">
                           {activeTemplate === "intro" ? "SHARP SHARP!" : activeTemplate === "hustle" ? "YOH, CHECK THIS!" : "HUSTLE TIME!"}
                        </span>
                     </motion.div>
                   )}
                </AnimatePresence>

                <RecordingHUD elapsed={recordingTime} onTimeUp={stopRecording} isRecording={isRecording} maxTime={activeTemplate === "intro" ? 30 : 60} />
                
                {/* Director Cues Overlay */}
                <div className="absolute bottom-40 inset-x-0 mx-auto w-max z-[70]">
                   <AnimatePresence mode="wait">
                      <motion.div 
                        key={activeCue}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-black/40 backdrop-blur-xl px-10 py-6 rounded-[2rem] border border-white/10 text-center max-w-[280px]"
                      >
                         <p className="text-[#10B981] text-[9px] font-black uppercase tracking-[0.5em] mb-2 italic">{DIRECTOR_CUES[activeCue].title}</p>
                         <p className="text-white font-bold italic leading-tight">{DIRECTOR_CUES[activeCue].text}</p>
                      </motion.div>
                   </AnimatePresence>
                </div>
             </div>

              {/* Control Bar */}
              <div className="mt-12 flex items-center justify-center gap-12 w-full max-w-md px-12">
                 
                 {/* Gallery Placeholder */}
                 <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 overflow-hidden shadow-xl relative group">
                    <div className="absolute inset-0 bg-[#13EC6A]/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <ImageIcon className="absolute inset-0 m-auto text-white/20" size={24} />
                    <div className="absolute bottom-1 right-1 w-3 h-3 bg-[#13EC6A] rounded-full border-2 border-black"></div>
                 </div>

                 <button 
                   onClick={isRecording ? stopRecording : startRecording}
                   disabled={isUploading}
                   className="relative w-28 h-28 flex items-center justify-center group disabled:opacity-50 pointer-events-auto"
                 >
                   <div className={`absolute -inset-4 rounded-full border-4 ${isRecording ? "border-[#13EC6A]/50 animate-ping" : "border-[#FACC15]/20"}`}></div>
                   <div className={`absolute inset-0 rounded-full border-[6px] ${isRecording ? "border-[#13EC6A]" : "border-white"} opacity-80 shadow-2xl`}></div>
                   <div className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-all duration-700 ${isRecording ? "bg-red-600 rounded-2xl scale-75" : "bg-red-600 rounded-full scale-100"}`}>
                      <Video size={32} className={`text-white transition-opacity ${isRecording ? "opacity-0" : "opacity-100"}`} />
                   </div>
                 </button>

                 {/* Create Mode Toggle */}
                 <div className="flex flex-col items-center gap-3">
                    <button 
                      onClick={() => setCreateMode(createMode === "camera" ? "ai" : "camera")}
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all shadow-xl ${createMode === "ai" ? "bg-cyan-400 border-cyan-400 text-black" : "bg-black/40 border-white/10 text-white"}`}
                    >
                       {createMode === "camera" ? <Camera size={24} /> : <Zap size={24} />}
                    </button>
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{createMode.toUpperCase()}</span>
                 </div>
              </div>

              {/* Template Picker */}
              <QuickTemplates onSelect={setActiveTemplate} activeTemplate={activeTemplate} />

              {/* Create Mode Modal Placeholder */}
              <AnimatePresence>
                 {createMode === "ai" && (
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: 20 }}
                     className="absolute inset-0 z-[120] bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center"
                   >
                     <div className="w-24 h-24 rounded-3xl bg-cyan-400 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(34,211,238,0.3)]">
                        <Zap size={40} className="text-black" />
                     </div>
                     <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-white">AI Studio ✨</h3>
                     <p className="text-white/60 text-sm italic mb-12">Building the future of skill-automated vibes. Protocol currently offline.</p>
                     <button 
                       onClick={() => setCreateMode("camera")}
                       className="px-12 py-4 bg-white text-black rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all"
                     >
                        Back to Lens
                     </button>
                   </motion.div>
                 )}
              </AnimatePresence>
          </motion.div>
        )}

        {activeTab === "review" && pendingVideo && (
            <motion.div 
              key="review"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative w-full h-full max-w-lg flex flex-col items-center justify-between py-24"
            >
              <div className="relative w-full aspect-[9/16] bg-black rounded-[3rem] overflow-hidden border-4 border-white/10 shadow-2xl">
                 <video 
                   src={pendingVideo.url} 
                   autoPlay 
                   loop 
                   muted 
                   crossOrigin="anonymous"
                   className="w-full h-full object-cover" 
                   onLoadedMetadata={(e) => setTrimEnd((e.target as HTMLVideoElement).duration)}
                 />
                 
                 {isProcessing && (
                   <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center z-[80]">
                      <div className="w-32 h-32 rounded-[2.5rem] bg-white border-2 border-[#E2E8F0] flex items-center justify-center mb-10 shadow-2xl">
                         <Loader2 className="animate-spin text-[#0F766E]" size={60} />
                      </div>
                      <p className="text-2xl font-black italic uppercase tracking-tighter text-white font-display mb-4">{processStatus}</p>
                      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/5 mb-4">
                         <div className="h-full bg-cyan-400 shadow-lg shadow-cyan-400/20 transition-all duration-500" style={{ width: `${processProgress}%` }} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-400 italic">{processProgress}% COMPLETE</p>
                   </div>
                 )}
              </div>

              <div className="w-full space-y-8 px-8">
                 {/* Hashtag Cloud */}
                 <div className="flex flex-wrap gap-2 justify-center">
                    {["#ShapaCV", "#JoziHustle", "#MzansiSkills", `#${userTrade.replace(/\s+/g, '')}Life`].map((tag) => (
                      <span key={tag} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-cyan-400 italic">
                        {tag}
                      </span>
                    ))}
                 </div>

                 {/* Multi-Action Publish Bar */}
                 <div className="flex flex-col gap-4">
                    <button 
                      onClick={handleProcessAndUpload}
                      disabled={!isValidLength || isProcessing || isUploading}
                      className={`w-full py-8 text-xl font-black tracking-widest rounded-[2rem] transition-all uppercase italic shadow-2xl flex items-center justify-center gap-4 ${
                        isValidLength 
                          ? 'bg-[#13EC6A] text-black hover:scale-[1.02] active:scale-95 shadow-[#13EC6A]/20' 
                          : 'bg-white/5 text-white/40 cursor-not-allowed border border-white/10'
                      }`}
                    >
                      {isUploading ? <Loader2 className="animate-spin" /> : <Zap size={24} />}
                      {isValidLength ? 'POST TO FEED' : (trimEnd - trimStart) < 30 ? 'TOO SHORT – MIN 30s' : 'TOO LONG'}
                    </button>

                    <div className="flex gap-4">
                       <button className="flex-1 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest italic text-white/60 hover:bg-white/10">Save Portfolio</button>
                       <button className="flex-1 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest italic text-white/60 hover:bg-white/10">Save Draft</button>
                    </div>
                 </div>
              </div>
            </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="fixed bottom-40 inset-x-8 z-[110] bg-red-500/20 backdrop-blur-xl border border-red-500/50 p-8 rounded-3xl text-center">
           <AlertCircle size={32} className="mx-auto mb-4 text-red-500" />
           <p className="text-sm font-black uppercase italic tracking-widest">{error}</p>
           <button onClick={() => window.location.reload()} className="mt-6 px-10 py-3 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-widest">Reinitialize</button>
        </div>
      )}
    </div>
  );
}
