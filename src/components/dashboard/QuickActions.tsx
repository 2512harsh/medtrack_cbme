import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface QuickActionItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  accent?: "primary" | "blue" | "green" | "orange" | "purple";
}

const accentStyles: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  green: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
  orange: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
};

interface QuickActionsProps {
  items: QuickActionItem[];
  className?: string;
}

/**
 * Compact quick-action button grid linking to common student workflows.
 */
export function QuickActions({ items, className }: QuickActionsProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3", className)}>
      {items.map((item) => (
        <Link
          key={item.href + item.label}
          href={item.href}
          className="group flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        >
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
              accentStyles[item.accent ?? "primary"]
            )}
          >
            {item.icon}
          </span>
          <span className="min-w-0 truncate">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}
