import React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  className?: string;
  progressClassName?: string;
}

/**
 * SVG circular progress ring used for overall completion / analytics.
 */
export function CircularProgress({
  value,
  size = 96,
  strokeWidth = 8,
  label,
  sublabel,
  className,
  progressClassName,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ? `${label}: ${Math.round(clamped)}%` : `${Math.round(clamped)}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn("stroke-primary transition-[stroke-dashoffset] duration-500", progressClassName)}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold leading-none tracking-tight">{Math.round(clamped)}%</span>
        {sublabel && <span className="mt-0.5 text-[10px] text-muted-foreground">{sublabel}</span>}
      </div>
    </div>
  );
}
