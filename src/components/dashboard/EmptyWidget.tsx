import React from "react";
import { cn } from "@/lib/utils";

interface EmptyWidgetProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Compact empty-state used inside dashboard widgets (no tasks, no
 * competencies, no notifications, no activity).
 */
export function EmptyWidget({ title, description, icon, className }: EmptyWidgetProps) {
  return (
    <div className={cn("flex h-full flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center", className)}>
      {icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">{description}</p>}
    </div>
  );
}
