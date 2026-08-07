"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getStreams } from "@/features/curriculum/services/curriculum";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { BookOpen } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import type { Stream } from "@/types";

type StreamRow = {
  id: string;
  name: string;
};

const columns: ColumnDef<AppTableFeatures, StreamRow>[] = [
  {
    accessorKey: "name",
    header: "Stream Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.getValue("name")}</span>
      </div>
    ),
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground font-mono">{row.getValue("id")}</span>
    ),
  },
];

export default function StreamsPage() {
  const [data, setData] = useState<StreamRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const streams = await getStreams();
      setData(streams.map((s: Stream) => ({ id: s.id, name: s.name })));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load streams"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Streams" description="Manage medical program streams" />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No streams found"
        emptyDescription="No medical program streams have been created yet."
        loadingColumns={2}
      >
        {(streams) => (
          <DataTable
            columns={columns}
            data={streams}
            searchPlaceholder="Search streams..."
          />
        )}
      </AsyncContent>
    </div>
  );
}
