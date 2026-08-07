"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface SectionTabItem {
  href: string;
  label: string;
  icon?: LucideIcon;
}

interface SectionTabsProps {
  items: SectionTabItem[];
  className?: string;
}

export function SectionTabs({ items, className }: SectionTabsProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex items-center gap-1 overflow-x-auto rounded-lg bg-muted/40 p-1",
        className
      )}
      aria-label="Section navigation"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
