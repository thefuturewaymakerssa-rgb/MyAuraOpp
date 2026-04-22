"use client";

import { Zap } from "lucide-react";

function DarkSkeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/5 ${className}`} />;
}

export default function GigsLoading() {
  return (
    <div className="min-h-screen bg-[#0D110F] p-8 lg:p-16">
      {/* Header */}
      <div className="mb-12 space-y-4">
        <DarkSkeleton className="h-16 w-48" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <DarkSkeleton key={i} className="h-10 w-24 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="mb-10 space-y-4">
        <DarkSkeleton className="h-12 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <DarkSkeleton key={i} className="h-10 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Gig Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <DarkSkeleton key={i} className="h-56 rounded-[3rem]" />
        ))}
      </div>

      <div className="fixed bottom-8 right-8">
        <Zap className="text-[#13EC6A] animate-pulse" size={24} />
      </div>
    </div>
  );
}

