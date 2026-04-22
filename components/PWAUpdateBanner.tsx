"use client";

import { usePWAServiceWorker } from "@/hooks/usePWAServiceWorker";
import { RefreshCw, WifiOff, X } from "lucide-react";
import { useState } from "react";

/**
 * PWAUpdateBanner
 *
 * Shows a dismissible banner when:
 * 1. A new app version is waiting to activate
 * 2. The user goes offline (complementary to LoadSheddingBanner)
 */
export default function PWAUpdateBanner() {
  const { updateAvailable, isOffline, applyUpdate, error } = usePWAServiceWorker();
  const [updateDismissed, setUpdateDismissed] = useState(false);

  // ── SW registration error (dev-only warning) ────────────────────────────
  if (process.env.NODE_ENV === "development" && error) {
    console.warn("[PWA] Service worker issue:", error);
  }

  // ── New version available ───────────────────────────────────────────────
  if (updateAvailable && !updateDismissed) {
    return (
      <div
        id="pwa-update-banner"
        role="alert"
        className="fixed top-0 inset-x-0 z-[200] flex items-center justify-between gap-3 bg-[#0F766E] text-white px-4 py-3 shadow-lg"
      >
        <div className="flex items-center gap-2 text-sm font-bold">
          <RefreshCw size={15} className="animate-spin" style={{ animationDuration: "2s" }} />
          <span>A new version is ready!</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="pwa-apply-update"
            onClick={applyUpdate}
            className="bg-white text-[#0F766E] text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full hover:bg-white/90 active:scale-95 transition-all"
            aria-label="Apply app update and refresh"
          >
            Update Now
          </button>
          <button
            onClick={() => setUpdateDismissed(true)}
            className="opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss update notification"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ── Offline indicator ───────────────────────────────────────────────────
  if (isOffline) {
    return (
      <div
        id="pwa-offline-indicator"
        role="status"
        aria-live="polite"
        className="fixed bottom-24 inset-x-0 mx-auto max-w-xs z-[150] pointer-events-none"
      >
        <div className="flex items-center justify-center gap-2 bg-amber-500/95 text-amber-950 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full shadow-lg mx-auto w-fit">
          <WifiOff size={13} />
          Offline — Cached content only
        </div>
      </div>
    );
  }

  return null;
}
