"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, FileSpreadsheet } from "lucide-react";
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from "@/features/dean/services/dean";
import {
  StudentFormDialog,
  type StudentFormValues,
} from "@/features/dean/components/StudentFormDialog";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import Link from "next/link";
import type { Student } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { toast } from "sonner";

type StudentRow = {
  id: string;
  name: string;
  rollNumber: string;
  registrationNumber: string;
  batch: string;
  status: string;
};

export default function StudentManagementPage() {
  const { user } = useAuth();
  const departmentId = user?.departmentId;
  const [data, setData] = useState<StudentRow[] | undefined>(undefined);
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudentRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const rowsFrom = (students: Student[]): StudentRow[] =>
    students.map((s) => ({
      id: s.id,
      name: s.user ? `${s.user.firstName} ${s.user.lastName}` : "Unknown",
      rollNumber: s.rollNumber,
      registrationNumber: s.registrationNumber,
      batch: s.batch,
      status: s.user?.status ?? "ACTIVE",
    }));

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const students = await getStudents(departmentId);
      setStudentList(students);
      setData(rowsFrom(students));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load students"));
    } finally {
      setIsLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshList = async () => {
    const students = await getStudents(departmentId);
    setStudentList(students);
    setData(rowsFrom(students));
  };

  const openCreate = () => {
    setEditingStudent(null);
    setFormOpen(true);
  };

  const openEdit = (studentId: string) => {
    const target = studentList.find((s) => s.id === studentId);
    if (!target) return;
    setEditingStudent(target);
    setFormOpen(true);
  };

  const handleSave = async (values: StudentFormValues) => {
    setIsSaving(true);
    try {
      if (editingStudent) {
        const user = editingStudent.user ?? {
          id: editingStudent.userId,
          firstName: "",
          lastName: "",
          email: "",
          role: "Student" as const,
          status: "ACTIVE" as const,
          departmentId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await updateStudent(editingStudent.id, {
          rollNumber: values.rollNumber,
          registrationNumber: values.registrationNumber,
          streamId: values.streamId,
          professionalYearId: values.professionalYearId,
          batch: values.batch,
          admissionYear: values.admissionYear,
          user: {
            ...user,
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            status: values.status,
            updatedAt: new Date().toISOString(),
          },
        });
        toast.success("Student updated successfully");
      } else {
        const userId = `user-stu-${Date.now()}`;
        await createStudent({
          userId,
          rollNumber: values.rollNumber,
          registrationNumber: values.registrationNumber,
          streamId: values.streamId,
          professionalYearId: values.professionalYearId,
          batch: values.batch,
          admissionYear: values.admissionYear,
          user: {
            id: userId,
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            role: "Student",
            status: values.status,
            departmentId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
        toast.success("Student added successfully");
      }
      setFormOpen(false);
      await refreshList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save student");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteStudent(deleteTarget.id);
      toast.success(`${deleteTarget.name} has been deleted`);
      setDeleteTarget(null);
      await refreshList();
    } catch {
      toast.error("Failed to delete student. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<AppTableFeatures, StudentRow>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <Link
          href={`/dean/students/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.getValue("name")}
        </Link>
      ),
    },
    { accessorKey: "rollNumber", header: "Roll Number" },
    { accessorKey: "registrationNumber", header: "Registration Number" },
    { accessorKey: "batch", header: "Batch" },
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
        const student = row.original as StudentRow;
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(student.id)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Delete"
              onClick={() => setDeleteTarget(student)}
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
        title="Student Management"
        description="Import, view, and manage students"
        actions={
          <>
            <Link href="/dean/students/import">
              <Button variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Import
              </Button>
            </Link>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </>
        }
      />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No students found"
        emptyDescription="No students have been imported yet."
        loadingColumns={5}
      >
        {(students) => (
          <DataTable columns={columns} data={students} searchPlaceholder="Search students..." />
        )}
      </AsyncContent>

      <StudentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        student={editingStudent}
        isSaving={isSaving}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Student"
        description={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.name}? This action cannot be undone.`
            : "Are you sure you want to delete this student?"
        }
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
