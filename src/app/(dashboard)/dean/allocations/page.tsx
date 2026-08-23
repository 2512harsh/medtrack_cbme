"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRightLeft } from "lucide-react";
import {
  getStudentAllocations,
  allocateStudent,
  reassignStudentAllocation,
} from "@/features/dean/services/dean";
import {
  AllocationDialog,
  type AllocationFormValues,
} from "@/features/dean/components/AllocationDialog";
import type { StudentAllocation } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { toast } from "sonner";

type AllocationRow = {
  id: string;
  studentName: string;
  facultyName: string;
  subject: string;
  allocatedDate: string;
  active: boolean;
};

export default function StudentAllocationPage() {
  // Not filtered by departmentId: the mock logged-in user's departmentId
  // doesn't match real department ids now that this is DB-backed.
  const [data, setData] = useState<AllocationRow[] | undefined>(undefined);
  const [allocationList, setAllocationList] = useState<StudentAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<StudentAllocation | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const rowsFrom = (allocations: StudentAllocation[]): AllocationRow[] =>
    allocations.map((a) => ({
      id: a.id,
      studentName: a.student
        ? `${a.student.user?.firstName ?? ""} ${a.student.user?.lastName ?? ""}`.trim()
        : "Unknown",
      facultyName: a.faculty
        ? `${a.faculty.user?.firstName ?? ""} ${a.faculty.user?.lastName ?? ""}`.trim()
        : "Unknown",
      subject: a.subject?.name ?? "Unknown",
      allocatedDate: a.allocatedDate,
      active: a.active,
    }));

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allocations = await getStudentAllocations();
      setAllocationList(allocations);
      setData(rowsFrom(allocations));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load allocations"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshList = async () => {
    const allocations = await getStudentAllocations();
    setAllocationList(allocations);
    setData(rowsFrom(allocations));
  };

  const openCreate = () => {
    setEditingAllocation(null);
    setDialogOpen(true);
  };

  const openReassign = (allocationId: string) => {
    const target = allocationList.find((a) => a.id === allocationId);
    if (!target) return;
    setEditingAllocation(target);
    setDialogOpen(true);
  };

  const handleSave = async (values: AllocationFormValues) => {
    setIsSaving(true);
    try {
      if (editingAllocation) {
        await reassignStudentAllocation(editingAllocation.id, values.facultyId);
        toast.success("Allocation reassigned");
      } else {
        for (const studentId of values.studentIds) {
          await allocateStudent({
            facultyId: values.facultyId,
            studentId,
            subjectId: values.subjectId,
            active: true,
          });
        }
        toast.success(`${values.studentIds.length} student(s) allocated`);
      }
      setDialogOpen(false);
      await refreshList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save allocation");
    } finally {
      setIsSaving(false);
    }
  };

  const columns: ColumnDef<AppTableFeatures, AllocationRow>[] = [
    {
      accessorKey: "studentName",
      header: "Student",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("studentName")}</span>
      ),
    },
    { accessorKey: "facultyName", header: "Faculty" },
    { accessorKey: "subject", header: "Subject" },
    {
      accessorKey: "allocatedDate",
      header: "Allocated Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.getValue("allocatedDate")).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            row.getValue("active")
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {row.getValue("active") ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const allocation = row.original as AllocationRow;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              title="Reassign"
              onClick={() => openReassign(allocation.id)}
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Allocation"
        description="Assign students to faculty members"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Allocation
          </Button>
        }
      />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No allocations found"
        emptyDescription="No students have been allocated to faculty yet."
        loadingColumns={5}
      >
        {(allocations) => (
          <DataTable columns={columns} data={allocations} searchPlaceholder="Search allocations..." />
        )}
      </AsyncContent>

      <AllocationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        allocation={editingAllocation}
        isSaving={isSaving}
        onSave={handleSave}
      />
    </div>
  );
}
