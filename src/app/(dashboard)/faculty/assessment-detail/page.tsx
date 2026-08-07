"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  getAssessmentAttempts,
  getAssessmentAttemptsByAssessmentId,
  getAssessmentById,
} from "@/features/faculty/services/faculty";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge, type StatusBadgeVariant } from "@/components/shared/StatusBadge";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import type { Assessment, AssessmentAttempt } from "@/types";

type AttemptRow = {
  id: string;
  attemptNumber: number;
  studentName: string;
  competency: string;
  rating: string;
  decision: string;
  remarks: string;
  facultySignature: string;
  signedAt: string;
  studentAcknowledged: boolean;
  status: string;
};

const statusVariant: Record<string, StatusBadgeVariant> = {
  Draft: "gray",
  Submitted: "info",
  Completed: "success",
  "Reattempt Scheduled": "purple",
  "Waiting for Student Acknowledgement": "info",
};

const attemptColumns: ColumnDef<AppTableFeatures, AttemptRow>[] = [
  {
    accessorKey: "attemptNumber",
    header: "Attempt",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">Attempt {row.getValue("attemptNumber")}</span>
    ),
  },
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
      return (
        <span className={`px-2 py-1 text-xs rounded-full ${variant}`}>
          {decision}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <StatusBadge variant={statusVariant[status] ?? "gray"}>{status}</StatusBadge>;
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
  },
  {
    accessorKey: "signedAt",
    header: "Signed At",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {new Date(row.getValue("signedAt")).toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    ),
  },
  {
    accessorKey: "studentAcknowledged",
    header: "Student Acknowledged",
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 text-xs rounded-full ${
          row.getValue("studentAcknowledged")
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }`}
      >
        {row.getValue("studentAcknowledged") ? "Yes" : "No"}
      </span>
    ),
  },
];

export default function AssessmentDetailPage() {
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("id");

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [data, setData] = useState<AttemptRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const attempts = assessmentId
        ? await getAssessmentAttemptsByAssessmentId(assessmentId)
        : await getAssessmentAttempts();
      const current = assessmentId ? await getAssessmentById(assessmentId) : null;
      setAssessment(current ?? null);
      const student = current?.student;
      const competency = current?.competencyAssignment?.competency;
      setData(
        attempts.map((a: AssessmentAttempt) => ({
          id: a.id,
          attemptNumber: a.attemptNumber,
          studentName: student?.user
            ? `${student.user.firstName} ${student.user.lastName}`
            : "Unknown Student",
          competency: competency ? `${competency.competencyCode} — ${competency.competencyTitle}` : "—",
          rating: a.rating,
          decision: a.decision,
          remarks: a.remarks,
          facultySignature: a.facultySignature,
          signedAt: a.facultySignedAt,
          studentAcknowledged: a.studentAcknowledged,
          status: a.status,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load assessment details"));
    } finally {
      setIsLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessment Detail"
        description="View submitted assessments and student acknowledgements"
      />

      {assessment && (
        <Card>
          <CardHeader>
            <CardTitle>
              {assessment.competencyAssignment?.competency?.competencyCode ?? "Competency"} —{" "}
              {assessment.competencyAssignment?.competency?.competencyTitle ?? "Assessment"}
            </CardTitle>
            <CardDescription>
              {assessment.student?.user
                ? `${assessment.student.user.firstName} ${assessment.student.user.lastName} (${assessment.student.rollNumber})`
                : "Student"}{" "}
              — Attempt {assessment.currentAttempt} —{" "}
              <StatusBadge variant={statusVariant[assessment.currentStatus] ?? "gray"}>
                {assessment.currentStatus}
              </StatusBadge>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Attempt History</CardTitle>
        </CardHeader>
        <CardContent>
          <AsyncContent
            data={data}
            isLoading={isLoading}
            error={error}
            onRetry={fetchData}
            emptyTitle="No assessment history"
            emptyDescription="No attempts have been submitted for this assessment yet."
            loadingColumns={10}
          >
            {(attempts) => (
              <DataTable
                columns={attemptColumns}
                data={attempts}
                searchPlaceholder="Search attempts..."
              />
            )}
          </AsyncContent>
        </CardContent>
      </Card>
    </div>
  );
}
