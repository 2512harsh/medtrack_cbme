"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  getInstitutions,
  getDeanAccounts,
  createDeanAccount,
  updateDeanAccount,
  deactivateDeanAccount,
} from "@/features/super-admin/services/superAdmin";
import {
  DeanFormDialog,
  type DeanFormValues,
} from "@/features/super-admin/components/DeanFormDialog";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { toast } from "sonner";
import type { Institution } from "@/types";
import type { DeanAccount } from "@/features/super-admin/mock/superAdmin";
import { ColumnDef } from "@tanstack/react-table";

type DeanRow = {
  id: string;
  name: string;
  email: string;
  institution: string;
  status: string;
};

export default function DeanManagementPage() {
  const [data, setData] = useState<DeanRow[] | undefined>(undefined);
  const [deanList, setDeanList] = useState<DeanAccount[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingDean, setEditingDean] = useState<DeanAccount | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDean, setSelectedDean] = useState<DeanRow | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const toRows = (deans: DeanAccount[], insts: Institution[]): DeanRow[] =>
    deans.map((d) => ({
      id: d.id,
      name: `${d.firstName} ${d.lastName}`,
      email: d.email,
      institution: insts.find((i) => i.id === d.institutionId)?.name ?? "Unassigned",
      status: d.status,
    }));

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [deans, allInstitutions] = await Promise.all([getDeanAccounts(), getInstitutions()]);
      setDeanList(deans);
      setInstitutions(allInstitutions);
      setData(toRows(deans, allInstitutions));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load Dean accounts"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshList = async () => {
    const deans = await getDeanAccounts();
    setDeanList(deans);
    setData(toRows(deans, institutions));
  };

  const openCreate = () => {
    setEditingDean(null);
    setFormOpen(true);
  };

  const openEdit = (deanId: string) => {
    const target = deanList.find((d) => d.id === deanId);
    if (!target) return;
    setEditingDean(target);
    setFormOpen(true);
  };

  const handleSave = async (values: DeanFormValues) => {
    setIsSaving(true);
    try {
      if (editingDean) {
        await updateDeanAccount(editingDean.id, values);
        toast.success("Dean updated successfully");
      } else {
        await createDeanAccount(values);
        toast.success("Dean added successfully");
      }
      setFormOpen(false);
      await refreshList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save Dean");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = (dean: DeanRow) => {
    setSelectedDean(dean);
    setDialogOpen(true);
  };

  const confirmDeactivate = async () => {
    if (!selectedDean) return;
    setIsDeactivating(true);
    try {
      await deactivateDeanAccount(selectedDean.id);
      await refreshList();
      setDialogOpen(false);
      toast.success(`${selectedDean.name} has been deactivated`);
    } catch {
      toast.error("Failed to deactivate Dean. Please try again.");
    } finally {
      setIsDeactivating(false);
      setSelectedDean(null);
    }
  };

  const columns: ColumnDef<AppTableFeatures, DeanRow>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "institution", header: "Institution" },
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
        const dean = row.original as DeanRow;
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(dean.id)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Deactivate"
              disabled={dean.status === "INACTIVE"}
              onClick={() => handleDeactivate(dean)}
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
        title="Dean Management"
        description="Assign, edit, and deactivate deans across institutions"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Dean
          </Button>
        }
      />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No Deans found"
        emptyDescription="No deans have been assigned yet."
        loadingColumns={4}
      >
        {(deans) => (
          <DataTable columns={columns} data={deans} searchPlaceholder="Search deans..." />
        )}
      </AsyncContent>

      <DeanFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        dean={editingDean}
        institutions={institutions}
        isSaving={isSaving}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={confirmDeactivate}
        title="Deactivate Dean"
        description={
          selectedDean
            ? `Are you sure you want to deactivate ${selectedDean.name}? They will lose access to the system.`
            : "Are you sure you want to deactivate this Dean?"
        }
        confirmLabel="Deactivate"
        variant="destructive"
        isLoading={isDeactivating}
      />
    </div>
  );
}
