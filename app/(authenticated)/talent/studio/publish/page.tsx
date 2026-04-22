"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { proofsHub } from "@/lib/supabase-helpers";
import { createClient } from "@/utils/supabase/client";
import { useVideoCompression } from "@/hooks/useVideoCompression";
import {
  CheckCircle2,
  Loader2,
  ArrowRight,
  Zap,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

type UploadMode = "compress" | "raw";

export default function PublishVibeCV() {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState("VibeCV Transmission");
  const [loading, setLoading] = useState(false);
  const [processingLabel, setProcessingLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode>("compress");
  const [isPublished, setIsPublished] = useState(false);
  const [remainingUploads, setRemainingUploads] = useState<number | null>(null);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  const { compressVideo, isCompressing, progress, status } = useVideoCompression();

  useEffect(() => {
    const url = sessionStorage.getItem("proof_video_url");
    const blobUrl = sessionStorage.getItem("proof_video_blob");
    if (url) {
      setVideoUrl(url);
    }
    // If we stored a blob URL from the recorder, fetch it back as a Blob
    if (blobUrl) {
      fetch(blobUrl)
        .then((r) => r.blob())
        .then((b) => setVideoBlob(b))
        .catch(() => {});
    }
    if (!url && !blobUrl) {
      setError("No active video payload found in memory.");
    }
  }, []);

  const handlePublish = async () => {
    if (!videoUrl || !title.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      let uploadFile: File | Blob | null = null;
      let thumbnailFile: File | null = null;
      let finalVideoUrl = videoUrl;

      // === COMPRESSION PATH ===
      if (uploadMode === "compress" && videoBlob) {
        setProcessingLabel("Compressing for low-bandwidth networks…");
        try {
          const result = await compressVideo(
            new File([videoBlob], "vibe.mp4", { type: "video/mp4" }),
            () => setShowTimeoutWarning(true)
          );
          uploadFile = result.compressedFile;
          thumbnailFile = result.thumbnailFile;

        } catch (compressErr: any) {
          if (compressErr.message === "TIMEOUT") {
            // Timeout — auto-fallback to raw
            setUploadMode("raw");
            console.warn("[VibeCV] Compression timed out, falling back to raw upload.");
          } else {
            throw compressErr;
          }
        }
      }

      // === RAW UPLOAD PATH (fallback or user choice) ===
      if (!uploadFile) {
        uploadFile = videoBlob ?? null;
      }

      // Upload via /api/upload if we have a blob; otherwise skip (URL already stored)
      if (uploadFile) {
        setProcessingLabel("Uploading to network…");
        const formData = new FormData();
        formData.append("file", uploadFile instanceof File ? uploadFile : new File([uploadFile], "vibe.mp4", { type: "video/mp4" }));

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        // Read remaining upload slots from rate limit headers
        const remaining = uploadRes.headers.get("X-RateLimit-Remaining");
        if (remaining !== null) setRemainingUploads(Number(remaining));

        if (uploadRes.status === 429) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || "Upload rate limit exceeded.");
        }
        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || "Upload failed.");
        }

        const uploadResult = await uploadRes.json();
        finalVideoUrl = uploadResult.url;

        // Upload thumbnail if we generated one
        if (thumbnailFile) {
          const thumbForm = new FormData();
          thumbForm.append("file", thumbnailFile);
          await fetch("/api/upload", { method: "POST", body: thumbForm }).catch(() => {
            // Non-critical — thumbnail upload failure is silent
          });
        }
      }

      // === WRITE TO DATABASE ===
      setProcessingLabel("Publishing to feed…");
      await proofsHub.insert({
        maker_id: user.id,
        video_url: finalVideoUrl!,
        title: title.trim(),
        created_at: new Date().toISOString(),
      });

      sessionStorage.removeItem("proof_video_url");
      sessionStorage.removeItem("proof_video_blob");

      setIsPublished(true);
      setProcessingLabel("Published!");
      await new Promise((r) => setTimeout(r, 1200));
      router.push("/talent/dashboard");
    } catch (err: any) {
      console.error("[PublishVibeCV]", err);
      setError(err.message || "Failed to push VibeCV to network.");
      setLoading(false);
      setProcessingLabel("");
    }
  };

  // ─── Error State ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#0D110F] text-white flex flex-col items-center justify-center p-8 text-center">
        <RefreshCw className="text-red-500 mb-8" size={60} />
        <h1 className="text-4xl font-black font-display uppercase tracking-tighter italic mb-4">
          {error}
        </h1>
        <Link
          href="/talent/studio/record"
          className="bg-[#13EC6A] text-[#052210] px-10 py-5 rounded-full font-black uppercase text-[10px] tracking-widest italic hover:scale-105 transition-transform"
        >
          Return to Studio
        </Link>
      </div>
    );
  }

  // ─── Main UI ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0D110F] text-white flex flex-col items-center justify-center p-6 sm:p-12 font-body relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#13EC6A]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 bg-white/5 backdrop-blur-xl p-10 md:p-16 rounded-[4rem] border border-white/10 shadow-2xl">
        <div className="w-20 h-20 bg-[#13EC6A]/10 rounded-[2rem] flex items-center justify-center mb-10 text-[#13EC6A] border border-[#13EC6A]/20 mx-auto">
          <Zap size={36} />
        </div>

        <h1 className="text-5xl md:text-6xl font-black font-display italic tracking-tighter uppercase leading-none mb-4 text-center">
          Prepare Launch.
        </h1>
        <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] text-center mb-12 italic">
          Finalize your VibeCV and push to the live feed.
        </p>

        {/* Upload Slots */}
        {remainingUploads !== null && (
          <div className="mb-6 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest italic text-[#13EC6A]">
              {remainingUploads} upload slot{remainingUploads !== 1 ? "s" : ""} remaining this hour
            </span>
          </div>
        )}

        <div className="space-y-8">
          {/* Video Preview */}
          <div className="w-full aspect-video bg-black rounded-[2rem] overflow-hidden border-4 border-white/10 relative shadow-inner">
            {videoUrl ? (
              <video src={videoUrl} controls crossOrigin="anonymous" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-500" size={32} />
              </div>
            )}
          </div>

          {/* Upload Mode Toggle */}
          {!loading && (
            <div className="flex gap-4">
              <button
                onClick={() => setUploadMode("compress")}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-[0.3em] italic transition-all ${
                  uploadMode === "compress"
                    ? "bg-[#13EC6A]/10 border-[#13EC6A] text-[#13EC6A]"
                    : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"
                }`}
              >
                <Wifi size={16} /> Compress (Saves Data)
              </button>
              <button
                onClick={() => setUploadMode("raw")}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-[0.3em] italic transition-all ${
                  uploadMode === "raw"
                    ? "bg-orange-500/10 border-orange-500 text-orange-400"
                    : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"
                }`}
              >
                <WifiOff size={16} /> Raw Upload (Faster)
              </button>
            </div>
          )}
          {uploadMode === "raw" && !loading && (
            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest italic text-center">
              ⚠️ Raw upload uses significantly more mobile data.
            </p>
          )}

          {/* Timeout Warning */}
          {showTimeoutWarning && (
            <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
              <AlertTriangle size={18} className="text-orange-400 flex-shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400 italic">
                Compression is taking longer than expected — switching to raw upload to save time.
              </p>
            </div>
          )}

          {/* Real Compression Progress */}
          {isCompressing && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest italic text-[#13EC6A]">
                  {status || "Compressing…"}
                </span>
                <span className="text-[10px] font-black text-[#13EC6A]">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#13EC6A] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-[#13EC6A] italic ml-4">
              Transmission Title
            </label>
            <input
              type="text"
              maxLength={40}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              placeholder="E.g., Master Plumber 2026"
              className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl focus:border-[#13EC6A] focus:bg-white/10 outline-none transition-all font-black text-xl italic text-white placeholder:text-gray-600"
            />
          </div>

          {/* Publish CTA */}
          <div className="pt-8 flex flex-col items-center">
            <button
              onClick={handlePublish}
              disabled={loading || !videoUrl || !title.trim()}
              className="w-full bg-[#13EC6A] text-[#052210] py-8 rounded-[2.5rem] font-black uppercase tracking-widest text-xl shadow-[0_0_40px_rgba(19,236,106,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex justify-center items-center gap-4 italic"
            >
              {isPublished ? (
                <><CheckCircle2 size={24} /> LIVE ON FEED</>
              ) : loading ? (
                <><Loader2 size={24} className="animate-spin" /> {processingLabel || "PROCESSING"}</>
              ) : (
                <>PUBLISH VIBECV <ArrowRight size={24} /></>
              )}
            </button>

            {loading && !isCompressing && (
              <p className="mt-6 text-[#13EC6A] font-black text-[10px] uppercase tracking-[0.4em] italic animate-pulse">
                {processingLabel}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
