"use client";

import React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

export interface TrendPoint {
  label: string;
  value: number;
}

export interface AnalyticsStat {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  hint?: string;
}

interface AnalyticsWidgetProps {
  trend: TrendPoint[];
  stats: AnalyticsStat[];
  className?: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">{payload[0].value} competencies</p>
    </div>
  );
}

/**
 * Weekly learning analytics: area chart of competencies completed per
 * week plus a grid of insight stats.
 */
export function AnalyticsWidget({ trend, stats, className }: AnalyticsWidgetProps) {
  return (
    <div className={cn("flex h-full flex-col gap-4", className)}>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="dashTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#dashTrend)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg bg-muted/30 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              {stat.icon && <span className="text-muted-foreground">{stat.icon}</span>}
              <p className="text-[11px] font-medium text-muted-foreground">{stat.label}</p>
            </div>
            <p className="mt-0.5 text-lg font-semibold tracking-tight">{stat.value}</p>
            {stat.hint && <p className="text-[11px] text-muted-foreground">{stat.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
