import React from "react";
import { cn } from "@/lib/utils";
import { DataSourceBadge, type DataSource } from "@/components/shared/DataSourceBadge";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  dataSource?: DataSource;
}

export function PageHeader({ title, description, actions, className, titleClassName, dataSource }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className={cn("text-[32px] leading-tight font-bold tracking-tight font-heading", titleClassName)}>{title}</h1>
          {dataSource && <DataSourceBadge source={dataSource} />}
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
