import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SettingsCardProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function SettingsCard({ title, description, icon, footer, className, children }: SettingsCardProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <CardTitle className="text-lg font-heading font-semibold leading-snug">{title}</CardTitle>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
      {footer && (
        <CardFooter className="flex items-center justify-end gap-2 border-t bg-muted/30 px-4 py-3">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
