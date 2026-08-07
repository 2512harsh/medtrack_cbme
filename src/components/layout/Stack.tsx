import React from "react";
import { cn } from "@/lib/utils";

type SpaceScale = "micro" | "related" | "section" | "group";

const spaceClasses: Record<SpaceScale, string> = {
  micro: "space-y-2",
  related: "space-y-4",
  section: "space-y-6",
  group: "space-y-8",
};

interface StackProps {
  children: React.ReactNode;
  space?: SpaceScale;
  className?: string;
}

/**
 * Consistent vertical spacing scale:
 * - micro: 8px between tightly related elements
 * - related: 16px between related elements
 * - section: 24px between sections
 * - group: 32px between major dashboard groups
 */
export function Stack({ children, space = "related", className }: StackProps) {
  return <div className={cn(spaceClasses[space], className)}>{children}</div>;
}
