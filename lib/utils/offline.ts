/**
 * Offline Storage Utility for ShapaCV
 * Uses IndexedDB to store video Blobs for "Load Shedding Mode"
 */

const DB_NAME = "ShapaCV_Offline";
const STORE_NAME = "proof_uploads";

export interface OfflineProof {
  id: string;
  blob: Blob;
  title: string;
  filename: string;
  timestamp: number;
}

export async function initDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProofOffline(blob: Blob, title: string) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  
  const id = crypto.randomUUID();
  const proof: OfflineProof = {
    id,
    blob,
    title,
    filename: title, // Use title as fallback if needed, or explicitly pass filename
    timestamp: Date.now()
  };

  return new Promise<void>((resolve, reject) => {
    const request = store.add(proof);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineProofs(): Promise<OfflineProof[]> {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteOfflineProof(id: string) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  return new Promise<void>((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
