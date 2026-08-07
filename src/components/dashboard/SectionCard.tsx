import React from "react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

/**
 * Standard dashboard card with consistent header (title + optional
 * description + optional action slot) and content body. All dashboard
 * widgets share equal radius, padding, title spacing and typography.
 */
export function SectionCard({
  title,
  description,
  action,
  className,
  bodyClassName,
  children,
}: SectionCardProps) {
  return (
    <Card className={cn("flex h-full flex-col gap-0", className)}>
      <CardHeader className="px-5 pb-2 pt-4">
        {action && <CardAction className="*:pointer-events-auto">{action}</CardAction>}
        <CardTitle className="text-base font-heading font-semibold tracking-tight">{title}</CardTitle>
        {description && (
          <p className="text-[13px] leading-snug text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className={cn("flex-1 px-5 pb-4 pt-1", bodyClassName)}>{children}</CardContent>
    </Card>
  );
}
