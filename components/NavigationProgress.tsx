"use client";

import { Suspense } from "react";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Start progress on path change
    const initialTimer = setTimeout(() => {
      setLoading(true);
      setProgress(30);
    }, 0);

    const timer = setTimeout(() => {
      setProgress(70);
    }, 200);

    const finishTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    }, 500);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(timer);
      clearTimeout(finishTimer);
    };
  }, [pathname, searchParams]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] pointer-events-none h-[3px]">
      <div 
        className="h-full bg-[#13EC6A] transition-all duration-500 ease-out shadow-[0_0_15px_rgba(19,236,106,0.8)]"
        style={{ width: `${progress}%` }}
      />
      <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-r from-transparent to-[#13EC6A] animate-pulse blur-sm" 
           style={{ left: `${progress - 5}%` }} />
    </div>
  );
}

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
