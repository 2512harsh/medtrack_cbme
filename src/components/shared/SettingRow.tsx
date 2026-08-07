import React from "react";
import { cn } from "@/lib/utils";

interface SettingRowProps {
  label: string;
  description?: string;
  icon?: React.ElementType;
  control?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function SettingRow({ label, description, icon: Icon, control, action, className }: SettingRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-3",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          {description && (
            <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center">{action ?? control}</div>
    </div>
  );
}
