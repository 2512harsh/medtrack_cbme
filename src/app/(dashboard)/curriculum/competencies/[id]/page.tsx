"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { getCompetencies, getQuestionTemplates } from "@/features/curriculum/services/curriculum";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { BookOpen } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import type { Competency, QuestionTemplate } from "@/types";

type QuestionTemplateRow = {
  id: string;
  title: string;
  competencyCode: string;
  questionCount: number;
  instructions?: string;
};

const columns: ColumnDef<AppTableFeatures, QuestionTemplateRow>[] = [
  {
    accessorKey: "title",
    header: "Template",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.getValue("title")}</span>
      </div>
    ),
  },
  {
    accessorKey: "competencyCode",
    header: "Competency",
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground">
        {row.getValue("competencyCode")}
      </span>
    ),
  },
  {
    accessorKey: "questionCount",
    header: "Questions",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("questionCount")}</span>
    ),
  },
];

export default function CompetencyDetailPage() {
  const params = useParams();
  const [competency, setCompetency] = useState<Competency | null>(null);
  const [templates, setTemplates] = useState<QuestionTemplateRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const competencies = await getCompetencies();
      const found = competencies.find((c: Competency) => c.id === params.id);
      setCompetency(found || null);
      
      if (found) {
        const templateData = await getQuestionTemplates(found.id);
        setTemplates(
          templateData.map((t: QuestionTemplate) => ({
            id: t.id,
            title: t.title,
            competencyCode: found.competencyCode || "",
            questionCount: t.questions?.length || 0,
            instructions: t.instructions,
          }))
        );
      } else {
        setTemplates([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load competency details"));
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
        <p className="text-muted-foreground">Unable to load competency details. Please try again.</p>
        <button onClick={fetchData} className="mt-4 text-primary hover:underline">
          Try Again
        </button>
      </div>
    );
  }

  if (!competency) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium">Competency not found</p>
        <p className="text-sm text-muted-foreground mt-2">The requested competency could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <PageHeader
          title={<>{competency.competencyCode} - {competency.competencyTitle}</>}
          description={competency.competencyDescription}
        />
        <div className="mt-2 flex items-center gap-2">
          <StatusBadge variant="success">{competency.status}</StatusBadge>
          <StatusBadge variant={competency.core ? "info" : "default"}>
            {competency.core ? "Core" : "Non-Core"}
          </StatusBadge>
        </div>
      </div>

      <h2 className="text-xl font-semibold">Question Templates</h2>

      <AsyncContent
        data={templates}
        isLoading={false}
        error={null}
        emptyTitle="No question templates"
        emptyDescription="No templates have been created for this competency yet."
        loadingColumns={3}
      >
        {(data) => (
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Search templates..."
          />
        )}
      </AsyncContent>
    </div>
  );
}
