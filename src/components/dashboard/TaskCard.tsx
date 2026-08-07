import React from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

export type TaskUrgency = "overdue" | "today" | "tomorrow" | "upcoming";

export interface PriorityTask {
  id: string;
  action: string;
  competency: string;
  subject: string;
  dueLabel: string;
  urgency: TaskUrgency;
  attempt?: string;
  actionLabel?: string;
  actionHref?: string;
}

export const taskUrgencyOrder: Record<TaskUrgency, number> = {
  overdue: 0,
  today: 1,
  tomorrow: 2,
  upcoming: 3,
};

const urgencyStyles: Record<TaskUrgency, { left: string; badge: React.ReactNode }> = {
  overdue: {
    left: "border-red-500",
    badge: <StatusBadge variant="danger">Overdue</StatusBadge>,
  },
  today: {
    left: "border-orange-500",
    badge: <StatusBadge variant="warning">Due Today</StatusBadge>,
  },
  tomorrow: {
    left: "border-blue-500",
    badge: <StatusBadge variant="info">Due Tomorrow</StatusBadge>,
  },
  upcoming: {
    left: "border-muted-foreground/30",
    badge: <StatusBadge variant="gray">Upcoming</StatusBadge>,
  },
};

interface TaskCardProps {
  task: PriorityTask;
  onAction?: (task: PriorityTask) => void;
  className?: string;
}

/**
 * Single priority-task row with subject, competency, due date, urgency
 * badge, attempt status and an action button.
 */
export function TaskCard({ task, onAction, className }: TaskCardProps) {
  const style = urgencyStyles[task.urgency];
  const actionContent = task.actionLabel ? (
    <>
      {task.actionLabel} <span aria-hidden="true">→</span>
    </>
  ) : null;

  const actionClasses =
    "inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-lg border px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 " +
    (task.urgency === "overdue" || task.urgency === "today"
      ? "border-transparent bg-primary text-primary-foreground hover:bg-primary/80"
      : "border-border bg-background hover:bg-muted");

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border-l-4 bg-muted/30 px-3.5 py-3 sm:flex-row sm:items-center",
        style.left,
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium leading-snug">{task.action}</p>
          {style.badge}
        </div>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
          {task.competency} · {task.subject}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn("font-medium", task.urgency === "overdue" ? "text-red-600" : task.urgency === "today" ? "text-orange-600" : "")}>
            Due: {task.dueLabel}
          </span>
          {task.attempt && <span className="text-muted-foreground/70">· {task.attempt}</span>}
        </p>
      </div>
      {task.actionHref ? (
        <Link href={task.actionHref} onClick={() => onAction?.(task)} className={actionClasses}>
          {actionContent}
        </Link>
      ) : actionContent ? (
        <button type="button" onClick={() => onAction?.(task)} className={actionClasses}>
          {actionContent}
        </button>
      ) : null}
    </div>
  );
}
