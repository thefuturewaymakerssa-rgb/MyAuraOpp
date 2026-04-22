"use client";

import { useEffect, useState } from "react";
import { CloudSync, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { getOfflineProofs } from "@/lib/utils/offline";

export function SyncStatusAlert() {
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    // Check queue periodically
    const checkQueue = async () => {
      const queued = await getOfflineProofs();
      setQueueCount(queued.length);
      
      // If window is online and we have queue, we assume it's "syncing" if it's decreasing
      // (This is a simplified UI indicator for the dashboard)
      if (queued.length > 0 && navigator.onLine) {
        setIsSyncing(true);
        setLastSyncStatus("idle");
      } else if (queued.length === 0 && isSyncing) {
        setIsSyncing(false);
        setLastSyncStatus("success");
        setTimeout(() => setLastSyncStatus("idle"), 5000);
      } else {
        setIsSyncing(false);
      }
    };

    const interval = setInterval(checkQueue, 3000);
    return () => clearInterval(interval);
  }, [isSyncing]);

  if (queueCount === 0 && lastSyncStatus === "idle") return null;

  return (
    <div className={`px-6 py-3 rounded-full border flex items-center gap-3 transition-all duration-500 ${
      isSyncing 
        ? "bg-[#13EC6A]/10 border-[#13EC6A]/20 text-[#13EC6A]" 
        : lastSyncStatus === "success"
        ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
        : "bg-white/5 border-white/10 text-gray-400"
    }`}>
      {isSyncing ? (
        <Loader2 size={16} className="animate-spin" />
      ) : lastSyncStatus === "success" ? (
        <CheckCircle2 size={16} />
      ) : (
        <CloudSync size={16} />
      )}
      
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">
        {isSyncing 
          ? `Syncing ${queueCount} Proof Clip${queueCount > 1 ? 's' : ''}...` 
          : lastSyncStatus === "success"
          ? "All Proofs Synced!"
          : `${queueCount} Proofs Queued (Offline)`}
      </span>
    </div>
  );
}
