import React from "react";
import { CircularProgress } from "./CircularProgress";
import { cn } from "@/lib/utils";

export interface SubjectProgress {
  subject: string;
  completed: number;
  total: number;
  color?: "blue" | "green" | "purple" | "orange" | "primary";
}

export interface DistributionSlice {
  label: string;
  value: number;
  className: string;
}

const subjectBarColors: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  primary: "bg-primary",
};

interface ProgressWidgetProps {
  overall: number;
  subjects: SubjectProgress[];
  distribution?: DistributionSlice[];
  className?: string;
}

/**
 * Learning progress widget: overall completion ring, per-subject progress
 * bars and competency distribution.
 */
export function ProgressWidget({ overall, subjects, distribution, className }: ProgressWidgetProps) {
  return (
    <div className={cn("flex h-full flex-col gap-4", className)}>
      <div className="flex items-center gap-4 rounded-lg bg-muted/30 px-4 py-3">
        <CircularProgress value={overall} size={88} strokeWidth={7} sublabel="Overall" />
        <div className="min-w-0 flex-1 space-y-2">
          {distribution?.map((slice) => (
            <div key={slice.label} className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className={cn("h-2 w-2 rounded-full", slice.className)} aria-hidden="true" />
                {slice.label}
              </span>
              <span className="font-medium">{slice.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {subjects.map((subject) => {
          const pct = subject.total > 0 ? (subject.completed / subject.total) * 100 : 0;
          return (
            <div key={subject.subject}>
              <div className="mb-1 flex items-center justify-between text-[13px]">
                <span className="font-medium">{subject.subject}</span>
                <span className="text-muted-foreground">
                  {subject.completed}/{subject.total} · {Math.round(pct)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full transition-all", subjectBarColors[subject.color ?? "primary"])}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
