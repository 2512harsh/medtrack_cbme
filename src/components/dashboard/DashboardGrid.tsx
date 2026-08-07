import React from "react";
import { cn } from "@/lib/utils";

export interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 12-column responsive dashboard grid.
 * - Desktop (>=1440px): 12-column grid, equal gutters
 * - Tablet: 2-column
 * - Mobile: single column, no horizontal scroll
 * Use `<div className="col-span-*">` on children for placement.
 */
export function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12 xl:gap-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface DashboardColProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Column span on the 12-column desktop grid (1-12).
   */
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

const spanClass: Record<number, string> = {
  1: "xl:col-span-1",
  2: "xl:col-span-2",
  3: "xl:col-span-3",
  4: "xl:col-span-4",
  5: "xl:col-span-5",
  6: "xl:col-span-6",
  7: "xl:col-span-7",
  8: "xl:col-span-8",
  9: "xl:col-span-9",
  10: "xl:col-span-10",
  11: "xl:col-span-11",
  12: "xl:col-span-12",
};

export function DashboardCol({ children, className, span }: DashboardColProps) {
  return (
    <div className={cn(span ? spanClass[span] : "xl:col-span-12", className)}>
      {children}
    </div>
  );
}
