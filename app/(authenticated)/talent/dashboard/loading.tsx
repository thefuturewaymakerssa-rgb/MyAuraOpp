"use client";

import { Zap } from "lucide-react";

function DarkSkeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/5 ${className}`} />;
}

export default function TalentDashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0D110F] p-8 lg:p-16 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <DarkSkeleton className="h-16 w-64" />
        <DarkSkeleton className="h-4 w-48" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <DarkSkeleton key={i} className="h-36 rounded-[2rem]" />
        ))}
      </div>

      {/* Wallet */}
      <DarkSkeleton className="h-48 rounded-[3rem]" />

      {/* Opportunities */}
      <div className="space-y-4">
        <DarkSkeleton className="h-6 w-40" />
        {[1, 2, 3].map((i) => (
          <DarkSkeleton key={i} className="h-24 rounded-[2rem]" />
        ))}
      </div>

      {/* Branded loader pulse */}
      <div className="fixed bottom-8 right-8">
        <Zap className="text-[#13EC6A] animate-pulse" size={24} />
      </div>
    </div>
  );
}

