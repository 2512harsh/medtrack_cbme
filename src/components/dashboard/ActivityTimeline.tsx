import React from "react";
import { StatusBadge, type StatusBadgeVariant } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

export interface ActivityItem {
  id: string;
  title: string;
  timestamp: string;
  icon: React.ReactNode;
  status?: string;
  statusVariant?: StatusBadgeVariant;
}

interface ActivityTimelineProps {
  items: ActivityItem[];
  className?: string;
}

/**
 * Vertical activity timeline: icon, title, timestamp and optional status.
 */
export function ActivityTimeline({ items, className }: ActivityTimelineProps) {
  if (items.length === 0) return null;
  return (
    <ol className={cn("space-y-0", className)}>
      {items.map((item, i) => (
        <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
          {i < items.length - 1 && (
            <span className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-border" aria-hidden="true" />
          )}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border">
            {item.icon}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium leading-snug">{item.title}</p>
              {item.status && (
                <StatusBadge variant={item.statusVariant ?? "gray"}>{item.status}</StatusBadge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.timestamp}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
