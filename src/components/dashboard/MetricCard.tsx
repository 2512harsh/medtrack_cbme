import React from "react";
import { cn } from "@/lib/utils";

const colorStyles: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  green: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
  orange: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
  red: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  yellow: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400",
  primary: "bg-primary/10 text-primary",
};

export interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  trend?: string;
  trendUp?: boolean;
  sub?: string;
  className?: string;
}

/**
 * Compact KPI metric card: icon + metric + label in a single dense row,
 * ~30-40% shorter than the standard StatCard. Supports an optional trend
 * and secondary info line.
 */
export function MetricCard({
  label,
  value,
  icon,
  color = "primary",
  trend,
  trendUp,
  sub,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-sm",
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            colorStyles[color] ?? colorStyles.primary
          )}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[28px] leading-none font-semibold tracking-tight">{value}</div>
        <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{label}</p>
        {(trend || sub) && (
          <p className={cn("mt-0.5 truncate text-[11px]", trend ? (trendUp ? "text-green-600" : "text-red-600") : "text-muted-foreground")}>
            {trend ?? sub}
          </p>
        )}
      </div>
    </div>
  );
}
