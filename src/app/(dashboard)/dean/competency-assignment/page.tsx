"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getCompetencyAssignments, assignCompetency } from "@/features/dean/services/dean";
import {
  CompetencyAssignmentDialog,
  type CompetencyAssignmentFormValues,
} from "@/features/dean/components/CompetencyAssignmentDialog";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import type { CompetencyAssignment } from "@/types";

type CompAssignmentRow = {
  id: string;
  facultyName: string;
  competencyCode: string;
  competencyTitle: string;
  batch: string;
  assignedDate: string;
};

export default function CompetencyAssignmentPage() {
  const { user } = useAuth();
  const departmentId = user?.departmentId;
  const [data, setData] = useState<CompAssignmentRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const rowsFrom = (assignments: CompetencyAssignment[]): CompAssignmentRow[] =>
    assignments.map((a) => ({
      id: a.id,
      facultyName: a.faculty
        ? `${a.faculty.user?.firstName ?? ""} ${a.faculty.user?.lastName ?? ""}`.trim()
        : "Unknown",
      competencyCode: a.competency?.competencyCode ?? "Unknown",
      competencyTitle: a.competency?.competencyTitle ?? "Unknown",
      batch: a.batch,
      assignedDate: a.assignedDate,
    }));

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const assignments = await getCompetencyAssignments(departmentId);
      setData(rowsFrom(assignments));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load competency assignments"));
    } finally {
      setIsLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshList = async () => {
    const assignments = await getCompetencyAssignments(departmentId);
    setData(rowsFrom(assignments));
  };

  const handleSave = async (values: CompetencyAssignmentFormValues) => {
    setIsSaving(true);
    try {
      await assignCompetency({
        facultyId: values.facultyId,
        competencyId: values.competencyId,
        batch: values.batch,
      });
      toast.success("Competency assigned to faculty");
      setDialogOpen(false);
      await refreshList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign competency");
    } finally {
      setIsSaving(false);
    }
  };

  const columns: ColumnDef<AppTableFeatures, CompAssignmentRow>[] = [
    {
      accessorKey: "facultyName",
      header: "Faculty",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("facultyName")}</span>
      ),
    },
    { accessorKey: "competencyCode", header: "Competency Code" },
    { accessorKey: "competencyTitle", header: "Competency Title" },
    { accessorKey: "batch", header: "Batch" },
    {
      accessorKey: "assignedDate",
      header: "Assigned Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.getValue("assignedDate")).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competency Assignment"
        description="Assign competency templates to faculty"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Assignment
          </Button>
        }
      />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No competency assignments"
        emptyDescription="No competencies have been assigned to faculty yet."
        loadingColumns={6}
      >
        {(assignments) => (
          <DataTable columns={columns} data={assignments} searchPlaceholder="Search assignments..." />
        )}
      </AsyncContent>

      <CompetencyAssignmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isSaving={isSaving}
        onSave={handleSave}
      />
    </div>
  );
}
