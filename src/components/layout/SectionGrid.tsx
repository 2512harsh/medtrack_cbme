import React from "react";
import { cn } from "@/lib/utils";

interface SectionGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive grid for content sections / panels below KPI cards.
 * Scales from a single column on mobile to a three-column layout on desktop.
 */
export function SectionGrid({ children, className }: SectionGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
}
