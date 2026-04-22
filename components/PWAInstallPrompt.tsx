"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Download, Share } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DAYS = 7;

function wasDismissedRecently(): boolean {
  if (typeof window === "undefined") return false;
  const ts = localStorage.getItem(DISMISS_KEY);
  if (!ts) return false;
  const days = (Date.now() - parseInt(ts, 10)) / (1000 * 60 * 60 * 24);
  return days < DISMISS_DAYS;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [iosPrompt, setIosPrompt] = useState(false);

  useEffect(() => {
    // Already installed — bail out
    if (isInStandaloneMode()) return;
    // Previously dismissed recently
    if (wasDismissedRecently()) return;

    // iOS Safari: no beforeinstallprompt — show manual instructions instead
    if (isIOS()) {
      const timer = setTimeout(() => setIosPrompt(true), 4000);
      return () => clearTimeout(timer);
    }

    // Android / Chrome: catch the browser's deferred prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShowPrompt(false);
    setIosPrompt(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  // ── iOS share-sheet instructions ──────────────────────────────────────────
  if (iosPrompt) {
    return (
      <div className="fixed bottom-6 left-4 right-4 z-[100] animate-in slide-in-from-bottom-8 duration-500">
        <div className="bg-[#0F766E] text-white p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(15,118,110,0.45)] border border-white/15 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                <Image src="/logo.png" alt="Future WayMakers" width={44} height={44} className="object-cover" />
              </div>
              <div>
                <h4 className="font-black text-sm tracking-tight leading-none">Add to Home Screen</h4>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-0.5">Future WayMakers</p>
              </div>
            </div>
            <button
              id="pwa-ios-dismiss"
              onClick={handleDismiss}
              className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center opacity-60 hover:opacity-100 transition-all shrink-0"
              aria-label="Dismiss install prompt"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-[11px] font-semibold leading-relaxed opacity-85">
            Tap <Share size={11} className="inline mx-0.5 -mt-0.5" /> <strong>Share</strong> then{" "}
            <strong>&ldquo;Add to Home Screen&rdquo;</strong> for offline access &amp; faster loading.
          </p>
        </div>
      </div>
    );
  }

  // ── Chrome / Android install prompt ───────────────────────────────────────
  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100] animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-[#1CD79D] text-black p-5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(28,215,157,0.4)] flex items-center justify-between gap-3 border-4 border-white/20 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-inner shrink-0">
            <Image src="/logo.png" alt="Future WayMakers" width={52} height={52} className="object-cover" />
          </div>
          <div>
            <h4 className="font-black text-base tracking-tighter italic leading-none mb-0.5">Install WayMakers.</h4>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Faster &bull; Offline Ready</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="pwa-install-accept"
            onClick={handleInstall}
            className="bg-black text-[#1CD79D] px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
            aria-label="Install Future WayMakers as a PWA"
          >
            <Download size={14} /> Install
          </button>
          <button
            id="pwa-install-dismiss"
            onClick={handleDismiss}
            className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center text-black/40 hover:text-black hover:bg-black/5 transition-all"
            aria-label="Dismiss install prompt"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
