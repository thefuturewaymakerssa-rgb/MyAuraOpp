"use client";

import { Zap } from "lucide-react";

function DarkSkeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/5 ${className}`} />;
}

export default function EmployerHubLoading() {
  return (
    <div className="min-h-screen bg-[#0D110F] p-8 lg:p-16 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <DarkSkeleton className="h-16 w-72" />
        <DarkSkeleton className="h-4 w-56" />
      </div>

      {/* Analytics Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <DarkSkeleton key={i} className="h-36 rounded-[2rem]" />
        ))}
      </div>

      {/* Saved Makers */}
      <div className="space-y-4">
        <DarkSkeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <DarkSkeleton key={i} className="h-48 rounded-[3rem]" />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <DarkSkeleton className="h-6 w-36" />
        {[1, 2, 3, 4].map((i) => (
          <DarkSkeleton key={i} className="h-20 rounded-[2rem]" />
        ))}
      </div>

      <div className="fixed bottom-8 right-8">
        <Zap className="text-[#13EC6A] animate-pulse" size={24} />
      </div>
    </div>
  );
}

