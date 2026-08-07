import React from "react";
import { cn } from "@/lib/utils";

interface KpiGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive grid for KPI / stat cards.
 * - Desktop (>=1440px): 4-5 columns
 * - Laptop (1024-1439px): 3-4 columns
 * - Tablet: 2 columns
 * - Mobile: 1 column
 */
export function KpiGrid({ children, className }: KpiGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
        className
      )}
    >
      {children}
    </div>
  );
}
