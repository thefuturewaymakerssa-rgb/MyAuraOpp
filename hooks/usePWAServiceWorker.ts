"use client";

import { useEffect, useState, useCallback } from "react";

export interface SWStatus {
  /** Whether a SW is currently active and controlling the page */
  isActive: boolean;
  /** Whether a new SW version is waiting and an update is available */
  updateAvailable: boolean;
  /** Whether the SW registration failed */
  error: string | null;
  /** Whether the app is currently offline */
  isOffline: boolean;
  /** Trigger the waiting SW to activate immediately */
  applyUpdate: () => void;
}

/**
 * usePWAServiceWorker
 *
 * Reports service worker state and exposes an `applyUpdate()` trigger.
 * Suitable for displaying a "New version available — refresh" banner.
 */
export function usePWAServiceWorker(): SWStatus {
  const [isActive, setIsActive] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // ── Online/offline detection ────────────────────────────────────────────
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // ── Service worker registration check ──────────────────────────────────
    if (!("serviceWorker" in navigator)) {
      setError("Service workers are not supported in this browser.");
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }

    let registration: ServiceWorkerRegistration | null = null;

    const onControllerChange = () => {
      // A new SW has taken control — page should reload to activate
      window.location.reload();
    };

    navigator.serviceWorker
      .getRegistration("/")
      .then((reg) => {
        if (!reg) {
          // SW exists in the file but isn't registered yet — not an error
          return;
        }
        registration = reg;

        // Check current state
        if (reg.active) setIsActive(true);

        // If there's already a waiting SW on mount
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setUpdateAvailable(true);
        }

        // Listen for future updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "activated") setIsActive(true);
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New SW installed, old one still active -> update available
              setWaitingWorker(newWorker);
              setUpdateAvailable(true);
            }
          });
        });

        // Poll for updates every 60 seconds (supplements browser's own check)
        const interval = setInterval(() => reg.update().catch(() => null), 60_000);

        return () => clearInterval(interval);
      })
      .catch((err) => {
        console.error("[PWA] Service worker registration check failed:", err);
        setError(err instanceof Error ? err.message : "Unknown SW error");
      });

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waitingWorker) return;
    // Tell the waiting SW to skip waiting and activate
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
    setUpdateAvailable(false);
  }, [waitingWorker]);

  return { isActive, updateAvailable, error, isOffline, applyUpdate };
}
