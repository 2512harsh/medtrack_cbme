"use client";

import React, { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import {
  getQuestionTemplates,
  getQuestionTemplateById,
  getCompetencies,
} from "@/features/curriculum/services/curriculum";
import { TemplateEditDialog } from "@/features/dean/components/TemplateEditDialog";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import type { Competency, QuestionTemplate } from "@/types";

type TemplateRow = {
  id: string;
  title: string;
  competencyCode: string;
  competencyTitle: string;
  questionCount: number;
  instructions?: string;
};

export default function QuestionTemplatesPage() {
  const [templates, setTemplates] = useState<QuestionTemplate[] | undefined>(undefined);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuestionTemplate | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [templateList, competencyList] = await Promise.all([getQuestionTemplates(), getCompetencies()]);
      setTemplates(templateList);
      setCompetencies(competencyList);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load question templates"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openEditDialog = async (templateId: string) => {
    try {
      const full = await getQuestionTemplateById(templateId);
      setEditingTemplate(full);
      setDialogOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load template");
    }
  };

  const rows: TemplateRow[] | undefined = templates?.map((t) => {
    const competency = competencies.find((c) => c.id === t.competencyId);
    return {
      id: t.id,
      title: t.title,
      competencyCode: competency?.competencyCode ?? "Unknown",
      competencyTitle: competency?.competencyTitle ?? "Unknown",
      questionCount: t.questions?.length ?? 0,
      instructions: t.instructions,
    };
  });

  const columns: ColumnDef<AppTableFeatures, TemplateRow>[] = [
    {
      accessorKey: "title",
      header: "Template",
      cell: ({ row }) => <span className="font-medium">{row.getValue("title")}</span>,
    },
    { accessorKey: "competencyCode", header: "Competency Code" },
    { accessorKey: "competencyTitle", header: "Competency Title" },
    {
      accessorKey: "questionCount",
      header: "Questions",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.getValue("questionCount")}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          title="Edit template"
          onClick={() => openEditDialog(row.original.id)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question Templates"
        description="View and edit the question templates created for competency assignments"
      />

      <AsyncContent
        data={rows}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No question templates"
        emptyDescription="No templates have been created yet. Create one from the Competency Assignment page."
        loadingColumns={5}
      >
        {(data) => <DataTable columns={columns} data={data} searchPlaceholder="Search templates..." />}
      </AsyncContent>

      <TemplateEditDialog
        open={dialogOpen}
        onOpenChange={(nextOpen) => {
          setDialogOpen(nextOpen);
          if (!nextOpen) setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSaved={fetchData}
      />
    </div>
  );
}
