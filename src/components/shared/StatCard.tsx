import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: string;
  bare?: boolean;
  iconClassName?: string;
  className?: string;
}

const colorStyles: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  green: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
  orange: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
  red: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  primary: "bg-primary/10 text-primary",
};

export function StatCard({ title, value, icon, trend, trendUp, color = "primary", bare, iconClassName, className }: StatCardProps) {
  return (
    <Card size="sm" className={cn("h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {bare ? (
          <div className={cn("shrink-0", iconClassName)}>{icon}</div>
        ) : (
          <div
            className={cn(
              "h-8 w-8 shrink-0 rounded-md flex items-center justify-center",
              colorStyles[color] ?? colorStyles.primary
            )}
          >
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-1">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {trend && (
          <p className={cn("text-xs mt-1", trendUp ? "text-green-600" : "text-red-600")}>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface ProgressBarProps {
  completed: number;
  total: number;
  color?: string;
}

export function ProgressBar({ completed, total, color = "primary" }: ProgressBarProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${percentage}%`,
          backgroundColor: `var(--${color})`,
        }}
      />
    </div>
  );
}
