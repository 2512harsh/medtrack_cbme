"use client";

import React, { useState, useEffect } from "react";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { getFacultyAssessmentHistory, type FacultyAssessmentHistoryRow } from "@/features/faculty/services/faculty";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<AppTableFeatures, FacultyAssessmentHistoryRow>[] = [
  {
    accessorKey: "attemptNumber",
    header: "Attempt",
    cell: ({ row }) => (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
        {row.getValue("attemptNumber")}
      </span>
    ),
  },
  {
    accessorKey: "studentName",
    header: "Student",
    cell: ({ row }) => <span className="font-medium">{row.getValue("studentName")}</span>,
  },
  {
    accessorKey: "competencyCode",
    header: "Competency",
    cell: ({ row }) => (
      <div className="max-w-[240px]">
        <p className="text-sm font-medium">{row.getValue("competencyCode")}</p>
        <p className="text-xs text-muted-foreground truncate">{row.getValue("competencyTitle")}</p>
      </div>
    ),
  },
  {
    accessorKey: "rating",
    header: "Rating",
  },
  {
    accessorKey: "decision",
    header: "Decision",
    cell: ({ row }) => {
      const decision = row.getValue("decision") as string;
      const variant =
        decision === "Exceeds Expectations"
          ? "bg-blue-100 text-blue-700"
          : decision === "Meets Expectations"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700";
      return <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${variant}`}>{decision}</span>;
    },
  },
  {
    accessorKey: "studentAcknowledged",
    header: "Student Signature",
    cell: ({ row }) => {
      const acknowledged = row.getValue("studentAcknowledged") as boolean;
      return acknowledged ? (
        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full whitespace-nowrap">
          Acknowledged
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full whitespace-nowrap">
          Awaiting
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variant =
        status === "Completed"
          ? "bg-green-100 text-green-700"
          : status === "Reattempt Scheduled"
          ? "bg-red-100 text-red-700"
          : "bg-yellow-100 text-yellow-700";
      return <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${variant}`}>{status}</span>;
    },
  },
  {
    accessorKey: "facultySignedAt",
    header: "Submitted On",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {new Date(row.getValue("facultySignedAt") as string).toLocaleDateString()}
      </span>
    ),
  },
  {
    accessorKey: "facultySignature",
    header: "Faculty Signature",
    cell: ({ row }) => <span className="text-sm whitespace-nowrap">{row.getValue("facultySignature")}</span>,
  },
];

export default function FacultyAssessmentHistoryPage() {
  const [data, setData] = useState<FacultyAssessmentHistoryRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await getFacultyAssessmentHistory();
      setData(rows);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load assessment history"));
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
        title="Assessment History"
        description="Attempts and remediation history across your assigned students"
      />
      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No assessment history"
        emptyDescription="No assessments have been submitted for your assigned students yet."
        loadingColumns={5}
      >
        {(rows) => <DataTable columns={columns} data={rows} searchPlaceholder="Search by student name..." />}
      </AsyncContent>
    </div>
  );
}
