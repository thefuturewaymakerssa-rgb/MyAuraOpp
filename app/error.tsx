"use client";

import { ShieldAlert, RefreshCcw } from "lucide-react";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0D110F] text-white flex flex-col items-center justify-center p-10 text-center font-body">
      <div className="w-24 h-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center mb-10 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
         <ShieldAlert size={48} className="text-red-500" />
      </div>
      <h1 className="text-6xl font-black italic tracking-tighter font-display uppercase mb-4">Grid Failure.</h1>
      <p className="text-sm text-gray-500 font-black mb-12 max-w-sm mx-auto uppercase tracking-widest">
         An unexpected error occurred in the platform. Future WayMakers.
      </p>
      <div className="flex flex-col gap-4">
        <button
            onClick={() => reset()}
            className="px-8 py-5 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-3 shadow-premium"
        >
            <RefreshCcw size={16} /> Attempt Grid Reset
        </button>
        <p className="text-[8px] text-gray-700 font-mono">Error Digest: {error.digest || 'Internal-System-Fault'}</p>
      </div>
    </div>
  );
}
