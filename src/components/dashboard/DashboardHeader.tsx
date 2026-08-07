import React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

interface IdentityItemProps {
  label: string;
  value: React.ReactNode;
}

export function IdentityItem({ label, value }: IdentityItemProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

export interface DashboardHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  identity?: React.ReactNode;
  className?: string;
}

/**
 * Dashboard header: 32px page title + description, optional action slot
 * (quick actions), and an optional identity strip (batch / academic year /
 * semester / mentor etc.) rendered as a bordered row below the title.
 */
export function DashboardHeader({
  title,
  description,
  actions,
  identity,
  className,
}: DashboardHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <PageHeader title={title} description={description} actions={actions} />
      {identity && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-card px-5 py-3.5 ring-1 ring-foreground/10">
          {identity}
        </div>
      )}
    </div>
  );
}
