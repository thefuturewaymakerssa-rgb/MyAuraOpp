"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Play, Hand, Mic, Maximize, Upload, Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function MakerStudio() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setErrorMessage("");

    // Simulate progress since fetch doesn't natively expose upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 300);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Upload failed");

      setUploadedUrl(result.url);
      setUploadProgress(100);
      setUploadStatus("success");

      // Store both the remote URL and a local blob URL for the publish page
      // The blob URL enables client-side FFmpeg compression before final submission
      sessionStorage.setItem("proof_video_url", result.url);
      const blobUrl = URL.createObjectURL(file);
      sessionStorage.setItem("proof_video_blob", blobUrl);

    } catch (err: any) {
      clearInterval(progressInterval);
      setUploadStatus("error");
      setErrorMessage(err.message || "Something went wrong during the upload.");
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col items-center pt-32 font-sans selection:bg-[#13EC6A]/30 mb-20 relative overflow-hidden">
      
      <div className="mb-10 relative z-10">
        <span className="text-[10px] font-black tracking-[0.4em] text-[#13EC6A] uppercase border border-[#13EC6A]/30 px-6 py-2 rounded-full italic drop-shadow-glow bg-[#13EC6A]/5">
          Master Suite 💎
        </span>
      </div>

      <h1 className="text-8xl md:text-[10rem] font-black tracking-tighter mb-10 font-display italic leading-[0.75] text-center uppercase relative z-10">
        Show Your <br/><span className="text-[#13EC6A] drop-shadow-glow">Skill.</span>
      </h1>
      
      <p className="text-2xl text-gray-500 max-w-3xl text-center mb-16 leading-relaxed font-bold italic relative z-10 px-6">
        A Proof Video is your digital handshake. It&apos;s the fastest way to prove your technique to master employers across the nation.
      </p>

      <Link href="#" className="flex items-center gap-4 text-[#13EC6A] font-black border-b-4 border-[#13EC6A]/30 pb-3 hover:text-white hover:border-white transition-all mb-24 uppercase tracking-[0.4em] text-[11px] italic relative z-10">
        SEE HIGH-SCORE EXAMPLES <Play size={16} fill="currentColor" />
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-7xl mx-auto mb-32 px-10 relative z-10">
        <div className="glass-card p-12 rounded-[4rem] border border-white/5 shadow-premium group hover:scale-105 transition-all duration-500 shimmer-border">
          <div className="w-20 h-20 bg-[#13EC6A]/10 rounded-[2rem] flex items-center justify-center text-[#13EC6A] mb-10 shadow-glow border border-[#13EC6A]/20 group-hover:rotate-12 transition-transform">
            <Hand size={36} />
          </div>
          <h3 className="text-4xl font-black mb-6 tracking-tighter font-display italic uppercase leading-none">Film Your Hands</h3>
          <p className="text-gray-500 font-bold text-base leading-relaxed italic">Focus on the work itself. Let employers see your technique, safety protocols, and manual dexterity up close.</p>
        </div>
        <div className="glass-card p-12 rounded-[4rem] border border-white/5 shadow-premium group hover:scale-105 transition-all duration-500 shimmer-border">
          <div className="w-20 h-20 bg-[#13EC6A]/10 rounded-[2rem] flex items-center justify-center text-[#13EC6A] mb-10 shadow-glow border border-[#13EC6A]/20 group-hover:rotate-12 transition-transform">
            <Mic size={36} />
          </div>
          <h3 className="text-4xl font-black mb-6 tracking-tighter font-display italic uppercase leading-none">Vibe Check</h3>
          <p className="text-gray-500 font-bold text-base leading-relaxed italic">Narrate what you are doing as you work. Simple, clear communication is just as important as the trade itself.</p>
        </div>
        <div className="glass-card p-12 rounded-[4rem] border border-white/5 shadow-premium group hover:scale-105 transition-all duration-500 shimmer-border">
          <div className="w-20 h-20 bg-[#13EC6A]/10 rounded-[2rem] flex items-center justify-center text-[#13EC6A] mb-10 shadow-glow border border-[#13EC6A]/20 group-hover:rotate-12 transition-transform">
            <Maximize size={36} />
          </div>
          <h3 className="text-4xl font-black mb-6 tracking-tighter font-display italic uppercase leading-none">Keep It Sharp</h3>
          <p className="text-gray-500 font-bold text-base leading-relaxed italic">Maximize lighting and ensure clear audio. High-fidelity results speak louder than a thousand words.</p>
        </div>
      </div>

      {/* Upload Area */}
      <div className="w-full max-w-3xl mx-auto px-10 mb-24 relative z-10 font-body">

        {/* Upload Status Card */}
        {uploadStatus !== "idle" && (
          <div className={`mb-12 p-8 rounded-[3.5rem] border flex items-start gap-8 transition-all shadow-premium backdrop-blur-3xl
            ${uploadStatus === "uploading" ? "glass-card border-[#13EC6A]/30" : ""}
            ${uploadStatus === "success" ? "bg-[#13EC6A]/10 border-[#13EC6A]/40" : ""}
            ${uploadStatus === "error" ? "bg-red-900/20 border-red-500/30" : ""}
          `}>
            <div className="shrink-0 mt-2">
              {uploadStatus === "uploading" && <Loader2 className="text-[#13EC6A] animate-spin" size={32} />}
              {uploadStatus === "success" && <CheckCircle className="text-[#13EC6A] drop-shadow-glow" size={32} />}
              {uploadStatus === "error" && <AlertCircle className="text-red-400" size={32} />}
            </div>
            <div className="flex-1 min-w-0">
              {uploadStatus === "uploading" && (
                <>
                  <p className="font-black text-[11px] uppercase tracking-[0.4em] mb-6 text-gray-400">Transmitting {selectedFile?.name}</p>
                  <div className="w-full h-3 bg-white/[0.03] rounded-full overflow-hidden border border-white/5 mb-4">
                    <div 
                      className="h-full bg-gradient-to-r from-[#13EC6A] via-[#13EC6A] to-indigo-500 transition-all duration-300 rounded-full shadow-glow"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-black text-[#13EC6A] uppercase tracking-[0.4em] italic">{uploadProgress}% COMPLETE / OPTIMIZING PATH</p>
                </>
              )}
              {uploadStatus === "success" && (
                <>
                  <p className="font-black text-2xl text-[#13EC6A] uppercase tracking-tighter italic font-display">Vibe Captured 🚀</p>
                  <p className="text-[10px] text-gray-600 truncate mt-3 font-mono opacity-50 uppercase tracking-widest">{uploadedUrl}</p>
                </>
              )}
              {uploadStatus === "error" && (
                <>
                  <p className="font-black text-2xl text-red-400 uppercase tracking-tighter italic font-display">Transmission Failure</p>
                  <p className="text-sm text-gray-500 mt-3 font-bold italic">{errorMessage}</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Video Preview after success */}
        {uploadStatus === "success" && uploadedUrl && (
          <div className="mb-16 rounded-[4rem] overflow-hidden border-8 border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative group">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#13EC6A]/50 to-transparent z-10 group-hover:opacity-100 opacity-0 transition-opacity" />
            <video 
              src={uploadedUrl}
              controls
              crossOrigin="anonymous"
              className="w-full aspect-video bg-black/40 backdrop-blur-3xl"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-10 justify-center flex-wrap">
          <Link 
            href="/talent/studio/record" 
            className="bg-white text-black font-black py-8 px-16 rounded-[2.5rem] hover:bg-[#13EC6A] hover:scale-110 active:scale-95 transition-all shadow-premium border-b-8 border-gray-200 flex items-center gap-4 text-xs uppercase tracking-[0.4em] italic shimmer-border"
          >
            START RECORDING 📷
          </Link>

          {/* Hidden file input */}
          <input 
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
            className="hidden"
            onChange={handleFileSelect}
          />

          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadStatus === "uploading"}
            className="glass-card text-white border border-white/10 font-black py-8 px-16 rounded-[2.5rem] hover:bg-white/5 hover:scale-105 transition-all flex items-center gap-4 text-xs uppercase tracking-[0.4em] disabled:opacity-50 italic"
          >
            {uploadStatus === "uploading" ? (
              <><Loader2 className="animate-spin" size={24} /> Processing...</>
            ) : (
              <>UPLOAD SYNC <Upload size={20} /></>
            )}
          </button>
        </div>

        {uploadStatus === "success" && (
          <div className="mt-20 text-center">
            <Link 
              href="/talent/dashboard"
              className="inline-flex items-center gap-4 text-[#13EC6A] font-black text-2xl hover:text-white transition-all underline decoration-4 underline-offset-8 uppercase tracking-[0.3em] italic font-display"
            >
              Enter Dashboard <ArrowRight size={24} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
