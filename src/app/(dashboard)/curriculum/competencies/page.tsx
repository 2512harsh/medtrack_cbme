"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { getCompetencies } from "@/features/curriculum/services/curriculum";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ColumnDef } from "@tanstack/react-table";
import type { Competency } from "@/types";

type CompetencyRow = {
  id: string;
  competencyCode: string;
  competencyTitle: string;
  subject: string;
  topic: string;
  level: string;
  core: boolean;
  status: string;
};

const columns: ColumnDef<AppTableFeatures, CompetencyRow>[] = [
  {
    accessorKey: "competencyCode",
    header: "Code",
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground">
        {row.getValue("competencyCode")}
      </span>
    ),
  },
  {
    accessorKey: "competencyTitle",
    header: "Competency",
    cell: ({ row }) => (
      <Link
        href={`/curriculum/competencies/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.getValue("competencyTitle")}
      </Link>
    ),
  },
  {
    accessorKey: "subject",
    header: "Subject",
  },
  {
    accessorKey: "topic",
    header: "Topic",
  },
  {
    accessorKey: "level",
    header: "Level",
  },
  {
    accessorKey: "core",
    header: "Core",
    cell: ({ row }) => (
      <StatusBadge variant={row.getValue("core") ? "success" : "default"}>
        {row.getValue("core") ? "Yes" : "No"}
      </StatusBadge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge variant="success">{row.getValue("status")}</StatusBadge>
    ),
  },
];

export default function CompetenciesPage() {
  const [data, setData] = useState<CompetencyRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const competencies = await getCompetencies();
      setData(
        competencies.map((c: Competency) => ({
          id: c.id,
          competencyCode: c.competencyCode,
          competencyTitle: c.competencyTitle,
          subject: "Anatomy",
          topic: "Upper Limb",
          level: c.competencyLevel || "Know",
          core: c.core || false,
          status: c.status,
        }))
      );
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
      <PageHeader title="Competencies" description="Manage official competency list" />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No competencies found"
        emptyDescription="No competencies have been imported yet."
        loadingColumns={7}
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
