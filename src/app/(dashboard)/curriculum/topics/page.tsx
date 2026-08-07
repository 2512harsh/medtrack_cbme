"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getTopics } from "@/features/curriculum/services/curriculum";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { BookText } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import type { Topic } from "@/types";

type TopicRow = {
  id: string;
  title: string;
  subject: string;
  displayOrder: number;
  competencyCount: number;
};

const columns: ColumnDef<AppTableFeatures, TopicRow>[] = [
  {
    accessorKey: "title",
    header: "Topic",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <BookText className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.getValue("title")}</span>
      </div>
    ),
  },
  {
    accessorKey: "subject",
    header: "Subject",
  },
  {
    accessorKey: "displayOrder",
    header: "Order",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("displayOrder")}</span>
    ),
  },
  {
    accessorKey: "competencyCount",
    header: "Competencies",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("competencyCount")}</span>
    ),
  },
];

export default function TopicsPage() {
  const [data, setData] = useState<TopicRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const topics = await getTopics();
      setData(
        topics.map((t: Topic) => ({
          id: t.id,
          title: t.title,
          subject: "Anatomy",
          displayOrder: t.displayOrder || 1,
          competencyCount: 4,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load topics"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Topics" description="Manage topics within subjects" />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No topics found"
        emptyDescription="No topics have been added to the curriculum yet."
        loadingColumns={4}
      >
        {(topics) => (
          <DataTable
            columns={columns}
            data={topics}
            searchPlaceholder="Search topics..."
          />
        )}
      </AsyncContent>
    </div>
  );
}
