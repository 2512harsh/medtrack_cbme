"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Power, Edit } from "lucide-react";
import { getDepartments, createDepartment, updateDepartment, setDepartmentStatus } from "@/features/super-admin/services/superAdmin";
import { ColumnDef } from "@tanstack/react-table";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { toast } from "sonner";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DepartmentRow = {
  id: string;
  name: string;
  description: string;
  status: string;
};

export default function DepartmentsPage() {
  const [data, setData] = useState<DepartmentRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentRow | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const [statusTarget, setStatusTarget] = useState<DepartmentRow | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const openCreate = () => {
    setEditingDepartment(null);
    setForm({ name: "", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (department: DepartmentRow) => {
    setEditingDepartment(department);
    setForm({
      name: department.name,
      description: department.description === "-" ? "" : department.description,
    });
    setDialogOpen(true);
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const departments = await getDepartments();
      setData(
        departments.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description ?? "-",
          status: d.status ?? "ACTIVE",
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load departments"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns: ColumnDef<AppTableFeatures, DepartmentRow>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <Link
          href={`/super-admin/departments/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.getValue("name")}
        </Link>
      ),
    },
    { accessorKey: "description", header: "Description" },
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
        const department = row.original as DepartmentRow;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => openEdit(department)} aria-label="Edit">
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStatusTarget(department)}
              aria-label={department.status === "ACTIVE" ? "Deactivate" : "Activate"}
            >
              <Power className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, {
          name: form.name.trim(),
          description: form.description || undefined,
        });
        toast.success("Department updated successfully");
      } else {
        await createDepartment({
          name: form.name.trim(),
          description: form.description || undefined,
          status: "ACTIVE",
        });
        toast.success("Department created successfully");
      }

      setDialogOpen(false);
      setEditingDepartment(null);
      setForm({ name: "", description: "" });
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save department");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async () => {
    if (!statusTarget) return;
    setStatusUpdating(true);
    try {
      const nextStatus = statusTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await setDepartmentStatus(statusTarget.id, nextStatus);
      toast.success(nextStatus === "ACTIVE" ? "Department activated" : "Department deactivated");
      setStatusTarget(null);
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update department");
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="The shared department list used across every institution on the platform"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        }
      />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No departments found"
        emptyDescription="No departments have been created yet."
        loadingColumns={3}
      >
        {(departments) => (
          <DataTable
            columns={columns}
            data={departments}
            searchPlaceholder="Search departments..."
          />
        )}
      </AsyncContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDepartment ? "Edit Department" : "Add Department"}</DialogTitle>
            <DialogDescription>
              {editingDepartment
                ? "Update this department's details."
                : "Departments are shared across every institution — a Dean or HOD is assigned to a department at a specific institution from the Dean/HOD Management pages."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dept-name">Name *</Label>
              <Input
                id="dept-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Orthopedics"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-desc">Description</Label>
              <Input
                id="dept-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Department of Orthopedics"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setEditingDepartment(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting
                ? editingDepartment
                  ? "Saving..."
                  : "Creating..."
                : editingDepartment
                  ? "Save Changes"
                  : "Create Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {statusTarget && (
        <ConfirmationDialog
          open={!!statusTarget}
          onOpenChange={(open) => {
            if (!open) setStatusTarget(null);
          }}
          onConfirm={handleStatusChange}
          title={statusTarget.status === "ACTIVE" ? "Deactivate Department" : "Activate Department"}
          description={
            statusTarget.status === "ACTIVE"
              ? `Deactivate ${statusTarget.name}? Related assignments and users may be affected.`
              : `Activate ${statusTarget.name}?`
          }
          confirmLabel={statusTarget.status === "ACTIVE" ? "Deactivate" : "Activate"}
          variant={statusTarget.status === "ACTIVE" ? "destructive" : "default"}
          isLoading={statusUpdating}
        />
      )}
    </div>
  );
}
