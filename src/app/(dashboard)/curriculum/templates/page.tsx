"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getQuestionTemplates } from "@/features/curriculum/services/curriculum";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { FileText } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import type { QuestionTemplate } from "@/types";

type TemplateRow = {
  id: string;
  title: string;
  competencyCode: string;
  competencyTitle: string;
  questionCount: number;
  instructions: string;
};

const columns: ColumnDef<AppTableFeatures, TemplateRow>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.getValue("title")}</span>
      </div>
    ),
  },
  {
    accessorKey: "competencyCode",
    header: "Competency Code",
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground">
        {row.getValue("competencyCode")}
      </span>
    ),
  },
  {
    accessorKey: "competencyTitle",
    header: "Competency",
  },
  {
    accessorKey: "questionCount",
    header: "Questions",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("questionCount")}</span>
    ),
  },
  {
    accessorKey: "instructions",
    header: "Instructions",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground truncate max-w-xs block">
        {row.getValue("instructions")}
      </span>
    ),
  },
];

export default function TemplatesPage() {
  const [data, setData] = useState<TemplateRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const templates = await getQuestionTemplates();
      setData(
        templates.map((qt: QuestionTemplate) => ({
          id: qt.id,
          title: qt.title,
          competencyCode: "AN8.1",
          competencyTitle: "Upper Limb Overview",
          questionCount: qt.questions?.length || 0,
          instructions: qt.instructions || "",
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load templates"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Question Templates" description="Manage assessment question templates" />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No templates found"
        emptyDescription="No question templates have been created yet."
        loadingColumns={5}
      >
        {(templates) => (
          <DataTable
            columns={columns}
            data={templates}
            searchPlaceholder="Search templates..."
          />
        )}
      </AsyncContent>
    </div>
  );
}
