import React from "react";
import { cn } from "@/lib/utils";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} aria-hidden="true" />;
}

/**
 * Loading skeleton that mirrors the student dashboard grid so no blank
 * pages appear while data loads.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard">
      <div className="space-y-3">
        <SkeletonBlock className="h-8 w-64" />
        <SkeletonBlock className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-[88px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12 xl:gap-6">
        <SkeletonBlock className="h-72 xl:col-span-8" />
        <SkeletonBlock className="h-72 xl:col-span-4" />
        <SkeletonBlock className="h-80 xl:col-span-8" />
        <SkeletonBlock className="h-80 xl:col-span-4" />
        <SkeletonBlock className="h-64 xl:col-span-6" />
        <SkeletonBlock className="h-64 xl:col-span-6" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
