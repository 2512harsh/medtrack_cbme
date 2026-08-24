"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { getCompetencyAssignments, assignCompetency, updateCompetencyAssignment } from "@/features/dean/services/dean";
import {
  CompetencyAssignmentDialog,
  type CompetencyAssignmentFormValues,
} from "@/features/dean/components/CompetencyAssignmentDialog";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
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
  const [assignments, setAssignments] = useState<CompetencyAssignment[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<CompetencyAssignment | null>(null);

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

  const data = assignments ? rowsFrom(assignments) : undefined;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Not filtered by departmentId: the mock logged-in user's departmentId
      // ("dept-1") doesn't match real department ids now that this is DB-backed.
      const result = await getCompetencyAssignments();
      setAssignments(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load competency assignments"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshList = async () => {
    const result = await getCompetencyAssignments();
    setAssignments(result);
  };

  const openCreateDialog = () => {
    setEditingAssignment(null);
    setDialogOpen(true);
  };

  const openEditDialog = (assignment: CompetencyAssignment) => {
    setEditingAssignment(assignment);
    setDialogOpen(true);
  };

  const handleSave = async (values: CompetencyAssignmentFormValues) => {
    setIsSaving(true);
    try {
      if (editingAssignment) {
        await updateCompetencyAssignment(editingAssignment.id, {
          facultyId: values.facultyId,
          competencyId: values.competencyId,
          batch: values.batch,
        });
        toast.success("Competency assignment updated");
      } else {
        await assignCompetency({
          facultyId: values.facultyId,
          competencyId: values.competencyId,
          batch: values.batch,
        });
        toast.success("Competency assigned to faculty");
      }
      setDialogOpen(false);
      setEditingAssignment(null);
      await refreshList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save competency assignment");
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
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const assignment = assignments?.find((a) => a.id === row.original.id);
        return (
          <Button
            variant="ghost"
            size="icon"
            title="Edit assignment"
            onClick={() => assignment && openEditDialog(assignment)}
            disabled={!assignment}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competency Assignment"
        description="Assign competency templates to faculty"
        actions={
          <Button onClick={openCreateDialog}>
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
        {(rows) => (
          <DataTable columns={columns} data={rows} searchPlaceholder="Search assignments..." />
        )}
      </AsyncContent>

      <CompetencyAssignmentDialog
        open={dialogOpen}
        onOpenChange={(nextOpen) => {
          setDialogOpen(nextOpen);
          if (!nextOpen) setEditingAssignment(null);
        }}
        isSaving={isSaving}
        onSave={handleSave}
        assignment={editingAssignment}
      />
    </div>
  );
}
