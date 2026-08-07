import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

function SkeletonRow({ columns }: { columns: number }) {
  return (
    <div className="flex items-center gap-4 py-3" aria-hidden="true">
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 rounded bg-muted animate-pulse",
            i === 0 ? "w-1/3" : i === columns - 1 ? "w-16 ml-auto" : "flex-1"
          )}
        />
      ))}
    </div>
  );
}

export function LoadingSkeleton({
  rows = 5,
  columns = 4,
  className,
}: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} columns={columns} />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading page">
      <div className="h-7 w-48 rounded bg-muted animate-pulse" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-lg bg-muted animate-pulse" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}