"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getProfessionalYears, getStreams } from "@/features/curriculum/services/curriculum";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { GraduationCap } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import type { ProfessionalYear } from "@/types";

type ProfessionalYearRow = {
  id: string;
  name: string;
  streamName: string;
  sequence: number;
};

const columns: ColumnDef<AppTableFeatures, ProfessionalYearRow>[] = [
  {
    accessorKey: "name",
    header: "Professional Year",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.getValue("name")}</span>
      </div>
    ),
  },
  {
    accessorKey: "streamName",
    header: "Stream",
  },
  {
    accessorKey: "sequence",
    header: "Sequence",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("sequence")}</span>
    ),
  },
];

export default function ProfessionalYearsPage() {
  const [data, setData] = useState<ProfessionalYearRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [years, streams] = await Promise.all([getProfessionalYears(), getStreams()]);
      setData(
        years.map((py: ProfessionalYear) => ({
          id: py.id,
          name: py.name,
          streamName: streams.find((s) => s.id === py.streamId)?.name ?? "Unassigned",
          sequence: py.sequence,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load professional years"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Professional Years" description="Manage academic years within streams" />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No professional years found"
        emptyDescription="No academic years have been defined yet."
        loadingColumns={3}
      >
        {(years) => (
          <DataTable
            columns={columns}
            data={years}
            searchPlaceholder="Search professional years..."
          />
        )}
      </AsyncContent>
    </div>
  );
}
