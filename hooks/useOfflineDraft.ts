/**
 * hooks/useOfflineDraft.ts
 *
 * IndexedDB-backed offline draft storage for VibeCV recordings.
 *
 * Saves video blobs and metadata to IndexedDB during load-shedding so
 * the talent never loses their recording. Auto-syncs when connectivity
 * is restored via the Background Sync API (where supported) or a simple
 * online event listener.
 *
 * Usage:
 *   const { saveDraft, loadDrafts, deleteDraft, syncPendingDrafts } = useOfflineDraft();
 */

"use client";

import { useEffect, useCallback, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VibeDraft {
  id: string;
  /** ISO timestamp when the draft was created */
  createdAt: string;
  /** Title entered by the talent (may be empty) */
  title: string;
  /** Raw video blob — stored as Blob in IDB */
  videoBlob: Blob;
  /** MIME type of the video blob */
  mimeType: string;
  /** Sync status */
  status: "pending" | "syncing" | "synced" | "failed";
  /** How many upload attempts have been made */
  attempts: number;
}

interface UseOfflineDraftReturn {
  /** Drafts currently in IndexedDB */
  drafts: VibeDraft[];
  /** Whether the IDB store is initialised and ready */
  isReady: boolean;
  /** Save a new draft blob to IDB */
  saveDraft: (blob: Blob, mimeType: string, title?: string) => Promise<string>;
  /** Delete a draft by ID */
  deleteDraft: (id: string) => Promise<void>;
  /** Reload drafts from IDB */
  refreshDrafts: () => Promise<void>;
  /** Upload all pending drafts — called automatically on 'online' event */
  syncPendingDrafts: () => Promise<void>;
}

// ─── IDB helpers ──────────────────────────────────────────────────────────────

const DB_NAME = "waymakers-drafts";
const DB_VERSION = 1;
const STORE_NAME = "vibe-drafts";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(db: IDBDatabase, draft: VibeDraft): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).put(draft);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbGetAll(db: IDBDatabase): Promise<VibeDraft[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as VibeDraft[]);
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOfflineDraft(): UseOfflineDraftReturn {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [drafts, setDrafts] = useState<VibeDraft[]>([]);
  const [isReady, setIsReady] = useState(false);

  // ── Initialise IDB on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !window.indexedDB) return;

    openDB()
      .then((database) => {
        setDb(database);
        setIsReady(true);
        return idbGetAll(database);
      })
      .then((all) => setDrafts(all))
      .catch((err) => console.error("[useOfflineDraft] IDB init failed:", err));
  }, []);

  // ── Reload helper ────────────────────────────────────────────────────────
  const refreshDrafts = useCallback(async () => {
    if (!db) return;
    const all = await idbGetAll(db);
    setDrafts(all);
  }, [db]);

  // ── Save a new draft ─────────────────────────────────────────────────────
  const saveDraft = useCallback(
    async (blob: Blob, mimeType: string, title = ""): Promise<string> => {
      if (!db) throw new Error("IndexedDB not ready");

      const id = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const draft: VibeDraft = {
        id,
        createdAt: new Date().toISOString(),
        title,
        videoBlob: blob,
        mimeType,
        status: "pending",
        attempts: 0,
      };

      await idbPut(db, draft);
      await refreshDrafts();
      return id;
    },
    [db, refreshDrafts]
  );

  // ── Delete a draft ───────────────────────────────────────────────────────
  const deleteDraft = useCallback(
    async (id: string): Promise<void> => {
      if (!db) return;
      await idbDelete(db, id);
      await refreshDrafts();
    },
    [db, refreshDrafts]
  );

  // ── Sync pending drafts to the server ────────────────────────────────────
  const syncPendingDrafts = useCallback(async () => {
    if (!db || !navigator.onLine) return;

    const all = await idbGetAll(db);
    const pending = all.filter((d) => d.status === "pending" || d.status === "failed");

    for (const draft of pending) {
      // Mark as syncing
      await idbPut(db, { ...draft, status: "syncing" });

      try {
        const file = new File([draft.videoBlob], `draft-${draft.id}.${draft.mimeType.split("/")[1] || "webm"}`, {
          type: draft.mimeType,
        });

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", { method: "POST", body: formData });

        if (!res.ok) {
          throw new Error(`Upload failed with status ${res.status}`);
        }

        // Mark as synced and clean up
        await idbPut(db, { ...draft, status: "synced", attempts: draft.attempts + 1 });
        // Auto-delete synced drafts after a short delay so the talent can see the success
        setTimeout(() => idbDelete(db, draft.id), 3000);
      } catch {
        await idbPut(db, {
          ...draft,
          status: draft.attempts >= 3 ? "failed" : "pending",
          attempts: draft.attempts + 1,
        });
      }
    }

    await refreshDrafts();
  }, [db, refreshDrafts]);

  // ── Auto-sync when back online ───────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => syncPendingDrafts();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncPendingDrafts]);

  return { drafts, isReady, saveDraft, deleteDraft, refreshDrafts, syncPendingDrafts };
}
