import React from "react";
import Link from "next/link";
import { StatusBadge, type StatusBadgeVariant } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

export type CompetencyStatus =
  | "Completed"
  | "In Progress"
  | "Pending"
  | "Awaiting Review"
  | "Approved"
  | "Rejected"
  | "Overdue";

export interface CompetencyItem {
  id: string;
  code: string;
  title: string;
  subject: string;
  status: CompetencyStatus;
  progress: number;
  href?: string;
  actionLabel?: string;
}

export const statusVariant: Record<CompetencyStatus, StatusBadgeVariant> = {
  Completed: "success",
  Approved: "success",
  "In Progress": "info",
  Pending: "warning",
  "Awaiting Review": "purple",
  Overdue: "danger",
  Rejected: "danger",
};

interface CompetencyCardProps {
  competency: CompetencyItem;
  onAction?: (competency: CompetencyItem) => void;
  className?: string;
}

/**
 * Compact competency row: code + title, subject, inline progress bar,
 * status badge and quick action. Designed to show many records with
 * minimal vertical space.
 */
export function CompetencyCard({ competency, onAction, className }: CompetencyCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5 ring-1 ring-foreground/5 transition-colors hover:bg-muted/50",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-mono text-xs font-semibold text-primary">{competency.code}</span>
          <p className="truncate text-sm font-medium">{competency.title}</p>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <p className="shrink-0 text-[11px] text-muted-foreground">{competency.subject}</p>
          <div
            className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={competency.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${competency.code} progress`}
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${competency.progress}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{competency.progress}%</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge variant={statusVariant[competency.status]}>{competency.status}</StatusBadge>
        {competency.actionLabel && (
          competency.href ? (
            <Link
              href={competency.href}
              onClick={() => onAction?.(competency)}
              className="inline-flex h-7 items-center rounded-md px-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {competency.actionLabel} <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onAction?.(competency)}
              className="inline-flex h-7 items-center rounded-md px-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {competency.actionLabel} <span aria-hidden="true">→</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}
