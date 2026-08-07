"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NotificationType = "assessment" | "feedback" | "evidence" | "deadline" | "announcement";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  unread: boolean;
  icon: React.ReactNode;
  iconClass?: string;
}

export interface NotificationWidgetProps {
  items: NotificationItem[];
  onOpen?: (item: NotificationItem) => void;
  onDismiss?: (item: NotificationItem) => void;
  onMarkRead?: (item: NotificationItem) => void;
  onViewAll?: () => void;
  className?: string;
}

/**
 * Notification list with unread emphasis, mark-read / open / dismiss
 * per item, and a "View all" footer action.
 */
export function NotificationWidget({
  items,
  onOpen,
  onDismiss,
  onMarkRead,
  onViewAll,
  className,
}: NotificationWidgetProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [read, setRead] = useState<Set<string>>(new Set());

  const visible = items.filter((item) => !dismissed.has(item.id));

  if (visible.length === 0) return null;

  const handleDismiss = (item: NotificationItem) => {
    setDismissed((prev) => new Set(prev).add(item.id));
    onDismiss?.(item);
  };

  const handleMarkRead = (item: NotificationItem) => {
    setRead((prev) => new Set(prev).add(item.id));
    onMarkRead?.(item);
  };

  const isRead = (item: NotificationItem) => read.has(item.id) || !item.unread;

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {visible.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex gap-3 rounded-lg border px-3 py-2.5 transition-colors",
              isRead(item)
                ? "border-transparent bg-muted/30"
                : "border-primary/20 bg-primary/[0.04]"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border",
                item.iconClass
              )}
            >
              {item.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{item.title}</p>
                {!isRead(item) && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                )}
              </div>
              <p className="mt-0.5 line-clamp-2 text-[13px] text-muted-foreground">{item.message}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{item.timestamp}</p>
              <div className="mt-1.5 flex items-center gap-1">
                <Button type="button" size="xs" variant="ghost" onClick={() => onOpen?.(item)}>
                  Open
                </Button>
                {!isRead(item) && (
                  <Button type="button" size="xs" variant="ghost" onClick={() => handleMarkRead(item)}>
                    Mark Read
                  </Button>
                )}
                <Button type="button" size="xs" variant="ghost" onClick={() => handleDismiss(item)}>
                  Dismiss
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {onViewAll && (
        <div className="mt-2 border-t pt-2">
          <Button type="button" variant="ghost" size="sm" className="w-full" onClick={onViewAll}>
            View all notifications
          </Button>
        </div>
      )}
    </div>
  );
}
