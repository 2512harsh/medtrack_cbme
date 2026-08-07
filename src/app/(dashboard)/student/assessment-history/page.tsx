"use client";

import React, { useState, useEffect } from "react";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { getMyAssessmentAttempts } from "@/features/student/services/student";
import type { AssessmentAttempt } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { PageHeader } from "@/components/layout/PageHeader";

type HistoryRow = {
  id: string;
  attemptNumber: number;
  rating: string;
  decision: string;
  remarks: string;
  facultySignature: string;
  facultySignedAt: string;
  studentSignature?: string;
  studentSignedAt?: string;
  status: string;
};

const columns: ColumnDef<AppTableFeatures, HistoryRow>[] = [
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
      return <span className={`px-2 py-1 text-xs rounded-full ${variant}`}>{decision}</span>;
    },
  },
  {
    accessorKey: "remarks",
    header: "Remarks",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground max-w-xs truncate block">
        {row.getValue("remarks")}
      </span>
    ),
  },
  {
    accessorKey: "facultySignature",
    header: "Faculty Signature",
    cell: ({ row }) => (
      <div className="max-w-[140px]">
        <p className="text-sm truncate">{row.getValue("facultySignature")}</p>
        <p className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(row.getValue("facultySignedAt") as string).toLocaleDateString()}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "studentSignature",
    header: "Student Signature",
    cell: ({ row }) => {
      const signature = row.getValue("studentSignature") as string | undefined;
      const signedAt = row.getValue("studentSignedAt") as string | undefined;
      return signature ? (
        <div className="max-w-[140px]">
          <p className="text-sm truncate">{signature}</p>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            {signedAt ? new Date(signedAt).toLocaleDateString() : ""}
          </p>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">Not signed</span>
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
      return <span className={`px-2 py-1 text-xs rounded-full ${variant}`}>{status}</span>;
    },
  },
  {
    accessorKey: "signedAt",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.getValue("signedAt")).toLocaleDateString()}
      </span>
    ),
  },
];

async function getData(): Promise<HistoryRow[]> {
  const attempts = await getMyAssessmentAttempts();
  return attempts.map((a: AssessmentAttempt) => ({
    id: a.id,
    attemptNumber: a.attemptNumber,
    rating: a.rating,
    decision: a.decision,
    remarks: a.remarks,
    facultySignature: a.facultySignature,
    facultySignedAt: a.facultySignedAt,
    studentSignature: a.studentSignature,
    studentSignedAt: a.studentSignedAt,
    status: a.status,
    signedAt: a.facultySignedAt,
  }));
}

export default function AssessmentHistoryPage() {
  const [data, setData] = useState<HistoryRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const attempts = await getData();
      setData(attempts);
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
      <PageHeader title="Assessment History" description="View your complete assessment history" />
      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No assessment history"
        emptyDescription="You have no assessment records yet."
        loadingColumns={5}
      >
        {(attempts) => (
          <DataTable columns={columns} data={attempts} searchPlaceholder="Search assessments..." />
        )}
      </AsyncContent>
    </div>
  );
}
