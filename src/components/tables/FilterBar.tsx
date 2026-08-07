import React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

const DEFAULT_STATUS_OPTIONS: FilterOption[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "Draft", label: "Draft" },
  { value: "Assigned", label: "Assigned" },
  { value: "In Progress", label: "In Progress" },
  { value: "Submitted", label: "Submitted" },
  { value: "Faculty Reviewed", label: "Faculty Reviewed" },
  { value: "Waiting for Student Acknowledgement", label: "Waiting for Student Acknowledgement" },
  { value: "Reattempt Scheduled", label: "Reattempt Scheduled" },
  { value: "Completed", label: "Completed" },
  { value: "Needs Remediation", label: "Needs Remediation" },
];

interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  statusFilter?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: FilterOption[];
  departmentFilter?: string;
  onDepartmentChange?: (value: string) => void;
  departmentOptions?: FilterOption[];
  subjectFilter?: string;
  onSubjectChange?: (value: string) => void;
  subjectOptions?: FilterOption[];
  batchFilter?: string;
  onBatchChange?: (value: string) => void;
  batchOptions?: FilterOption[];
  onClearFilters?: () => void;
  className?: string;
}

const selectClassName =
  "rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  statusFilter,
  onStatusChange,
  statusOptions,
  departmentFilter,
  onDepartmentChange,
  departmentOptions,
  subjectFilter,
  onSubjectChange,
  subjectOptions,
  batchFilter,
  onBatchChange,
  batchOptions,
  onClearFilters,
  className,
}: FilterBarProps) {
  const hasActiveFilters =
    (searchValue && searchValue.length > 0) ||
    (statusFilter && statusFilter !== "") ||
    (departmentFilter && departmentFilter !== "") ||
    (subjectFilter && subjectFilter !== "") ||
    (batchFilter && batchFilter !== "");

  const resolvedStatusOptions =
    statusOptions && statusOptions.length > 0 ? statusOptions : DEFAULT_STATUS_OPTIONS;

  return (
    <div className={cn("flex flex-wrap items-center gap-3 py-2", className)}>
      {onSearchChange && (
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue || ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {onStatusChange && (
        <select
          value={statusFilter || ""}
          onChange={(e) => onStatusChange(e.target.value)}
          className={selectClassName}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          {resolvedStatusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {onDepartmentChange && (
        <select
          value={departmentFilter || ""}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className={selectClassName}
          aria-label="Filter by department"
        >
          <option value="">All Departments</option>
          {(departmentOptions || []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {onSubjectChange && (
        <select
          value={subjectFilter || ""}
          onChange={(e) => onSubjectChange(e.target.value)}
          className={selectClassName}
          aria-label="Filter by subject"
        >
          <option value="">All Subjects</option>
          {(subjectOptions || []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {onBatchChange && batchOptions && batchOptions.length > 0 ? (
        <select
          value={batchFilter || ""}
          onChange={(e) => onBatchChange(e.target.value)}
          className={selectClassName}
          aria-label="Filter by batch"
        >
          <option value="">All Batches</option>
          {batchOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : onBatchChange ? (
        <Input
          placeholder="Filter by batch"
          value={batchFilter || ""}
          onChange={(e) => onBatchChange?.(e.target.value)}
          className="w-40"
        />
      ) : null}

      {hasActiveFilters && onClearFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
