"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  getDepartmentById,
  getDepartments,
  getHodAccounts,
  createHodAccount,
  updateHodAccount,
  deactivateHodAccount,
} from "@/features/dean/services/dean";
import {
  HodFormDialog,
  type HodFormValues,
} from "@/features/dean/components/HodFormDialog";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { toast } from "sonner";
import type { Department } from "@/types";
import type { HodAccount } from "@/features/super-admin/mock/superAdmin";
import { ColumnDef } from "@tanstack/react-table";

type HodRow = {
  id: string;
  name: string;
  email: string;
  department: string;
  status: string;
};

export default function HodManagementPage() {
  const { user } = useAuth();
  const departmentId = user?.departmentId;
  const [data, setData] = useState<HodRow[] | undefined>(undefined);
  const [hodList, setHodList] = useState<HodAccount[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingHod, setEditingHod] = useState<HodAccount | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedHod, setSelectedHod] = useState<HodRow | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const toRows = (hods: HodAccount[], depts: Department[]): HodRow[] =>
    hods.map((h) => ({
      id: h.id,
      name: `${h.firstName} ${h.lastName}`,
      email: h.email,
      department: depts.find((d) => d.id === h.departmentId)?.name ?? "Unassigned",
      status: h.status,
    }));

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const department = departmentId ? await getDepartmentById(departmentId) : undefined;
      const [hods, allDepartments] = await Promise.all([
        getHodAccounts(department?.institutionId),
        getDepartments(),
      ]);
      const institutionDepartments = department
        ? allDepartments.filter((d) => d.institutionId === department.institutionId)
        : allDepartments;
      setHodList(hods);
      setDepartments(institutionDepartments);
      setData(toRows(hods, institutionDepartments));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load HOD accounts"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

  const refreshList = async () => {
    const department = departmentId ? await getDepartmentById(departmentId) : undefined;
    const hods = await getHodAccounts(department?.institutionId);
    setHodList(hods);
    setData(toRows(hods, departments));
  };

  const openCreate = () => {
    setEditingHod(null);
    setFormOpen(true);
  };

  const openEdit = (hodId: string) => {
    const target = hodList.find((h) => h.id === hodId);
    if (!target) return;
    setEditingHod(target);
    setFormOpen(true);
  };

  const handleSave = async (values: HodFormValues) => {
    setIsSaving(true);
    try {
      if (editingHod) {
        await updateHodAccount(editingHod.id, values);
        toast.success("HOD updated successfully");
      } else {
        await createHodAccount(values);
        toast.success("HOD added successfully");
      }
      setFormOpen(false);
      await refreshList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save HOD");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = (hod: HodRow) => {
    setSelectedHod(hod);
    setDialogOpen(true);
  };

  const confirmDeactivate = async () => {
    if (!selectedHod) return;
    setIsDeactivating(true);
    try {
      await deactivateHodAccount(selectedHod.id);
      await refreshList();
      setDialogOpen(false);
      toast.success(`${selectedHod.name} has been deactivated`);
    } catch {
      toast.error("Failed to deactivate HOD. Please try again.");
    } finally {
      setIsDeactivating(false);
      setSelectedHod(null);
    }
  };

  const columns: ColumnDef<AppTableFeatures, HodRow>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "department", header: "Department" },
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
        const hod = row.original as HodRow;
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(hod.id)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Deactivate"
              disabled={hod.status === "INACTIVE"}
              onClick={() => handleDeactivate(hod)}
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
        title="HOD Management"
        description="Assign, edit, and deactivate heads of department across your institution"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add HOD
          </Button>
        }
      />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No HODs found"
        emptyDescription="No heads of department have been assigned yet."
        loadingColumns={4}
      >
        {(hods) => (
          <DataTable columns={columns} data={hods} searchPlaceholder="Search HODs..." />
        )}
      </AsyncContent>

      <HodFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        hod={editingHod}
        departments={departments}
        isSaving={isSaving}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={confirmDeactivate}
        title="Deactivate HOD"
        description={
          selectedHod
            ? `Are you sure you want to deactivate ${selectedHod.name}? They will lose access to the system.`
            : "Are you sure you want to deactivate this HOD?"
        }
        confirmLabel="Deactivate"
        variant="destructive"
        isLoading={isDeactivating}
      />
    </div>
  );
}
