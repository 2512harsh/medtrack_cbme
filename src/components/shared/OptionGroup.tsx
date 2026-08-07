"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface OptionGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
}

export function OptionGroup({
  value,
  onValueChange,
  options,
  disabled,
  className,
}: OptionGroupProps) {
  return (
    <div
      role="radiogroup"
      className={cn("flex w-full overflow-hidden rounded-lg border bg-muted/40 p-1", className)}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={disabled}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "flex flex-1 items-center justify-center rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground hover:bg-accent",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
