"use client";

import React, { useState, useEffect } from "react";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Eye, FileText } from "lucide-react";
import { getAssignedCompetencies } from "@/features/faculty/services/faculty";
import type { CompetencyAssignment } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { PageHeader } from "@/components/layout/PageHeader";
import Link from "next/link";

type AssignedCompRow = {
  id: string;
  competencyId: string;
  competencyCode: string;
  competencyTitle: string;
  subject: string;
  batch: string;
  pendingCount: number;
};

const columns: ColumnDef<AppTableFeatures, AssignedCompRow>[] = [
  {
    accessorKey: "competencyCode",
    header: "Code",
    cell: ({ row }) => (
      <span className="font-medium font-mono">{row.getValue("competencyCode")}</span>
    ),
  },
  { accessorKey: "competencyTitle", header: "Title" },
  { accessorKey: "subject", header: "Subject" },
  { accessorKey: "batch", header: "Batch" },
  {
    accessorKey: "pendingCount",
    header: "Pending",
    cell: ({ row }) => {
      const pending = row.getValue("pendingCount") as number;
      return (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            pending > 0
              ? "bg-orange-100 text-orange-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {pending}
        </span>
      );
    },
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Link href={`/curriculum/competencies/${row.original.competencyId}`} title="View competency">
          <Button variant="ghost" size="icon">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
        <Link href={`/faculty/assessment-form?assignmentId=${row.original.id}`} title="Assess this competency">
          <Button variant="ghost" size="icon">
            <FileText className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    ),
  },
];

async function getAssignedCompData(): Promise<AssignedCompRow[]> {
  const assignments = await getAssignedCompetencies();
  return assignments.map((a: CompetencyAssignment) => ({
    id: a.id,
    competencyId: a.competency?.id ?? "",
    competencyCode: a.competency?.competencyCode ?? "Unknown",
    competencyTitle: a.competency?.competencyTitle ?? "Unknown",
    subject: a.competency?.subjectName ?? "Unknown",
    batch: a.batch,
    pendingCount: a.pendingCount ?? 0,
  }));
}

export default function AssignedCompetenciesPage() {
  const [data, setData] = useState<AssignedCompRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const competencies = await getAssignedCompData();
      setData(competencies);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load assigned competencies"));
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
        title="Assigned Competencies"
        description="View competencies assigned to you"
      />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No competencies assigned"
        emptyDescription="No competencies have been assigned to you yet."
        loadingColumns={5}
      >
        {(competencies) => (
          <DataTable
            columns={columns}
            data={competencies}
            searchPlaceholder="Search competencies..."
          />
        )}
      </AsyncContent>
    </div>
  );
}
