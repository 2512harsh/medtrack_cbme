"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, UserCheck } from "lucide-react";
import {
  getFaculty,
  deactivateFaculty,
  createFaculty,
  updateFaculty,
} from "@/features/dean/services/dean";
import { getCurriculumDepartments } from "@/features/curriculum/services/curriculum";
import {
  FacultyFormDialog,
  type FacultyFormValues,
} from "@/features/dean/components/FacultyFormDialog";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { toast } from "sonner";
import type { Department, Faculty } from "@/types";

type FacultyRow = {
  id: string;
  name: string;
  designation: string;
  employeeCode: string;
  specialization: string;
  status: string;
};

export default function FacultyManagementPage() {
  const [data, setData] = useState<FacultyRow[] | undefined>(undefined);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyRow | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Not filtered by departmentId: the mock logged-in user's departmentId
      // ("dept-1") doesn't match real department ids now that this is DB-backed.
      const [faculty, depts] = await Promise.all([getFaculty(), getCurriculumDepartments()]);
      setFacultyList(faculty);
      setDepartments(depts);
      setData(
        faculty.map((f) => ({
          id: f.id,
          name: f.user ? `${f.user.firstName} ${f.user.lastName}` : "Unknown",
          designation: f.designation,
          employeeCode: f.employeeCode,
          specialization: f.specialization ?? "General",
          status: f.user?.status ?? "ACTIVE",
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load faculty"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshList = async () => {
    const faculty = await getFaculty();
    setFacultyList(faculty);
    setData(
      faculty.map((f) => ({
        id: f.id,
        name: f.user ? `${f.user.firstName} ${f.user.lastName}` : "Unknown",
        designation: f.designation,
        employeeCode: f.employeeCode,
        specialization: f.specialization ?? "General",
        status: f.user?.status ?? "ACTIVE",
      }))
    );
  };

  const openCreate = () => {
    setEditingFaculty(null);
    setFormOpen(true);
  };

  const openEdit = (facultyId: string) => {
    const target = facultyList.find((f) => f.id === facultyId);
    if (!target) return;
    setEditingFaculty(target);
    setFormOpen(true);
  };

  const handleSave = async (values: FacultyFormValues) => {
    setIsSaving(true);
    try {
      if (editingFaculty) {
        await updateFaculty(editingFaculty.id, values);
        toast.success("Faculty updated successfully");
      } else {
        await createFaculty(values);
        toast.success("Faculty added successfully");
      }
      setFormOpen(false);
      await refreshList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save faculty");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = (faculty: FacultyRow) => {
    setSelectedFaculty(faculty);
    setDialogOpen(true);
  };

  const confirmDeactivate = async () => {
    if (!selectedFaculty) return;
    setIsDeactivating(true);
    try {
      await deactivateFaculty(selectedFaculty.id);
      await refreshList();
      setDialogOpen(false);
      toast.success(`${selectedFaculty.name} has been deactivated`);
    } catch {
      toast.error("Failed to deactivate faculty. Please try again.");
    } finally {
      setIsDeactivating(false);
      setSelectedFaculty(null);
    }
  };

  const columns: ColumnDef<AppTableFeatures, FacultyRow>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/dean/faculty/${row.original.id}`}
            className="font-medium text-primary hover:underline"
          >
            {row.getValue("name")}
          </Link>
        </div>
      ),
    },
    { accessorKey: "designation", header: "Designation" },
    { accessorKey: "employeeCode", header: "Employee Code" },
    { accessorKey: "specialization", header: "Specialization" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            row.getValue("status") === "ACTIVE"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {row.getValue("status")}
        </span>
      ),
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const faculty = row.original as FacultyRow;
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(faculty.id)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Link href={`/dean/faculty/${faculty.id}`}>
              <Button
                variant="ghost"
                size="icon"
                title="View"
                disabled={faculty.status === "INACTIVE"}
              >
                <UserCheck className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              title="Deactivate"
              disabled={faculty.status === "INACTIVE"}
              onClick={() => handleDeactivate(faculty)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Management"
        description="Create, edit, and deactivate faculty members"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Faculty
          </Button>
        }
      />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No faculty found"
        emptyDescription="No faculty members have been added yet."
        loadingColumns={5}
      >
        {(faculty) => (
          <DataTable columns={columns} data={faculty} searchPlaceholder="Search faculty..." />
        )}
      </AsyncContent>

      <FacultyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        faculty={editingFaculty}
        departments={departments}
        isSaving={isSaving}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={confirmDeactivate}
        title="Deactivate Faculty"
        description={
          selectedFaculty
            ? `Are you sure you want to deactivate ${selectedFaculty.name}? They will lose access to the system.`
            : "Are you sure you want to deactivate this faculty member?"
        }
        confirmLabel="Deactivate"
        variant="destructive"
        isLoading={isDeactivating}
      />
    </div>
  );
}
