"use client";

import React from "react";
import { motion } from "framer-motion";

/**
 * Branded skeleton loader matching Future WayMakers design
 * Uses teal (#0F766E) accent with subtle animations
 */
export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <motion.div
        className="flex flex-col items-center gap-6"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* Animated Waveform */}
        <div className="flex items-end gap-1">
          {[1, 2, 3, 4, 5].map((bar) => (
            <motion.div
              key={bar}
              className="w-1.5 bg-[#0F766E] rounded-full"
              animate={{
                height: ["8px", "24px", "8px"],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: bar * 0.1,
              }}
            />
          ))}
        </div>
        <p className="text-center text-sm font-medium text-gray-600">
          Loading your vibe...
        </p>
      </motion.div>
    </div>
  );
}

/**
 * Gig card skeleton for feed loading
 */
export function GigCardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-slate-200 rounded" />
          <div className="h-3 w-1/2 bg-slate-100 rounded" />
        </div>
        <div className="h-10 w-10 bg-slate-200 rounded-full" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-full bg-slate-100 rounded" />
        <div className="h-3 w-5/6 bg-slate-100 rounded" />
      </div>

      {/* Footer skeleton */}
      <div className="flex justify-between pt-2">
        <div className="h-3 w-20 bg-slate-100 rounded" />
        <div className="h-8 w-24 bg-[#0F766E]/10 rounded" />
      </div>
    </div>
  );
}

/**
 * Dashboard stats skeleton
 */
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-slate-200 bg-white p-6 space-y-3"
        >
          <div className="h-4 w-24 bg-slate-200 rounded" />
          <div className="h-8 w-16 bg-slate-100 rounded" />
          <div className="h-3 w-32 bg-slate-50 rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Profile card skeleton
 */
export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      {/* Cover image */}
      <div className="h-32 bg-slate-200 rounded-lg" />

      {/* Avatar and info */}
      <div className="flex gap-4 -mt-12 px-6 pb-6">
        <div className="h-24 w-24 bg-slate-200 rounded-full border-4 border-white flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-4">
          <div className="h-5 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-64 bg-slate-100 rounded" />
          <div className="h-4 w-40 bg-slate-100 rounded" />
        </div>
      </div>

      {/* Bio */}
      <div className="px-6 space-y-2">
        <div className="h-3 w-full bg-slate-100 rounded" />
        <div className="h-3 w-5/6 bg-slate-100 rounded" />
      </div>
    </div>
  );
}
