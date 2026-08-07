"use client";

import React, { useState, useEffect } from "react";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { getMyCompetencies } from "@/features/student/services/student";
import type { CompetencyAssignment } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import Link from "next/link";

type CompRow = {
  id: string;
  code: string;
  title: string;
  status: string;
  attempt: number;
};

const columns: ColumnDef<AppTableFeatures, CompRow>[] = [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => (
      <Link
        href={`/student/response/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.getValue("code")}
      </Link>
    ),
  },
  { accessorKey: "title", header: "Title" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variant =
        status === "Completed"
          ? "bg-green-100 text-green-700"
          : status === "In Progress"
          ? "bg-blue-100 text-blue-700"
          : status === "Needs Remediation"
          ? "bg-red-100 text-red-700"
          : status === "Waiting for Student Acknowledgement"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-gray-100 text-gray-700";
      return <span className={`px-2 py-1 text-xs rounded-full ${variant}`}>{status}</span>;
    },
  },
  { accessorKey: "attempt", header: "Attempt" },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const comp = row.original as CompRow;
      return (
        <Link href={`/student/response/${comp.id}`}>
          <Button variant="ghost" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Answer
          </Button>
        </Link>
      );
    },
  },
];

async function getData(): Promise<CompRow[]> {
  const competencies = await getMyCompetencies();
  return competencies.map((c: CompetencyAssignment) => ({
    id: c.id,
    code: c.competency?.competencyCode ?? "",
    title: c.competency?.competencyTitle ?? "",
    status: "Assigned",
    attempt: 0,
  }));
}
export default function MyCompetenciesPage() {
  const [data, setData] = useState<CompRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const competencies = await getData();
      setData(competencies);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load competencies"));
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
        title="My Competencies"
        description="View your assigned competencies and their status"
      />
      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No competencies assigned"
        emptyDescription="No competencies have been assigned to you yet."
        loadingColumns={4}
      >
        {(competencies) => (
          <DataTable columns={columns} data={competencies} searchPlaceholder="Search competencies..." />
        )}
      </AsyncContent>
    </div>
  );
}
