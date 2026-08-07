"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { getTopics, getCompetencies } from "@/features/curriculum/services/curriculum";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { ColumnDef } from "@tanstack/react-table";
import type { Topic, Competency } from "@/types";

type CompetencyRow = {
  id: string;
  competencyCode: string;
  competencyTitle: string;
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

export default function TopicDetailPage() {
  const params = useParams();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [competencies, setCompetencies] = useState<CompetencyRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const topics = await getTopics();
      const found = topics.find((t: Topic) => t.id === params.id);
      setTopic(found || null);
      
      if (found) {
        const competencyData = await getCompetencies(found.id);
        setCompetencies(
          competencyData.map((c: Competency) => ({
            id: c.id,
            competencyCode: c.competencyCode,
            competencyTitle: c.competencyTitle,
            level: c.competencyLevel || "Know",
            core: c.core || false,
            status: c.status,
          }))
        );
      } else {
        setCompetencies([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load topic details"));
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Unable to load topic details. Please try again.</p>
        <button onClick={fetchData} className="mt-4 text-primary hover:underline">
          Try Again
        </button>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium">Topic not found</p>
        <p className="text-sm text-muted-foreground mt-2">The requested topic could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={topic.title} description="Competencies under this topic" />

      <AsyncContent
        data={competencies}
        isLoading={false}
        error={null}
        emptyTitle="No competencies found"
        emptyDescription="No competencies have been added to this topic yet."
        loadingColumns={5}
      >
        {(data) => (
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Search competencies..."
          />
        )}
      </AsyncContent>
    </div>
  );
}
