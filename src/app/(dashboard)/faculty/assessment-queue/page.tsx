"use client";

import React, { useState, useEffect } from "react";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Clock, CheckCircle2 } from "lucide-react";
import { getAssessments } from "@/features/faculty/services/faculty";
import { ColumnDef } from "@tanstack/react-table";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge, type StatusBadgeVariant } from "@/components/shared/StatusBadge";
import type { Assessment } from "@/types";

type QueueRow = {
  id: string;
  studentName: string;
  competency: string;
  attempt: number;
  status: string;
  createdAt: string;
};

const PENDING_STATUSES = ["Draft", "Assigned", "In Progress", "Submitted"];

const statusVariant: Record<string, StatusBadgeVariant> = {
  Draft: "gray",
  Assigned: "default",
  "In Progress": "warning",
  Submitted: "info",
  Completed: "success",
  "Waiting for Student Acknowledgement": "info",
  "Reattempt Scheduled": "purple",
};

const statusLabel: Record<string, { label: string; icon?: "clock" | "check" }> = {
  Draft: { label: "Draft", icon: "clock" },
  Assigned: { label: "Assigned", icon: "clock" },
  "In Progress": { label: "In Progress", icon: "clock" },
  Submitted: { label: "Submitted", icon: "clock" },
  Completed: { label: "Reviewed", icon: "check" },
  "Waiting for Student Acknowledgement": { label: "Awaiting Acknowledgement", icon: "check" },
  "Reattempt Scheduled": { label: "Reattempt Scheduled" },
};

const columns: ColumnDef<AppTableFeatures, QueueRow>[] = [
  {
    accessorKey: "studentName",
    header: "Student",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("studentName")}</span>
    ),
  },
  {
    accessorKey: "competency",
    header: "Competency",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("competency")}</span>
    ),
  },
  {
    accessorKey: "attempt",
    header: "Attempt",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">Attempt {row.getValue("attempt")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const meta = statusLabel[status] ?? { label: status };
      return (
        <StatusBadge variant={statusVariant[status] ?? "gray"}>
          <span className="inline-flex items-center gap-1">
            {meta.icon === "check" && <CheckCircle2 className="h-3 w-3" />}
            {meta.icon === "clock" && <Clock className="h-3 w-3" />}
            {meta.label}
          </span>
        </StatusBadge>
      );
    },
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Link href={`/faculty/assessment-form?assessmentId=${row.original.id}`}>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Review
        </Button>
      </Link>
    ),
  },
];

async function getQueueData(): Promise<QueueRow[]> {
  const assessments = await getAssessments();
  return assessments
    .filter((a) => PENDING_STATUSES.includes(a.currentStatus))
    .map((a: Assessment) => ({
      id: a.id,
      studentName: a.student?.user
        ? `${a.student.user.firstName} ${a.student.user.lastName}`
        : "Unknown",
      competency:
        a.competencyAssignment?.competency?.competencyTitle ?? "Unknown Competency",
      attempt: a.currentAttempt,
      status: a.currentStatus,
      createdAt: a.createdAt,
    }));
}

export default function AssessmentQueuePage() {
  const [data, setData] = useState<QueueRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queue = await getQueueData();
      setData(queue);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load assessment queue"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessment Queue"
        description="Pending competency assessments awaiting review"
      />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No assessments pending"
        emptyDescription="There are no assessments awaiting review."
        loadingColumns={5}
      >
        {(queue) => (
          <DataTable columns={columns} data={queue} searchPlaceholder="Search assessments..." />
        )}
      </AsyncContent>
    </div>
  );
}
