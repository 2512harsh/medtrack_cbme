"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import {
  getInstitutions,
  createInstitution,
  updateInstitution,
  setInstitutionStatus,
} from "@/features/super-admin/services/superAdmin";
import type { Institution } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { toast } from "sonner";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Power } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type InstitutionRow = {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  status: string;
};

async function getInstitutionData(): Promise<InstitutionRow[]> {
  const institutions = await getInstitutions();
  return institutions.map((i: Institution) => ({
    id: i.id,
    name: i.name,
    code: i.code,
    city: i.city ?? "-",
    state: i.state ?? "-",
    email: i.email ?? "-",
    phone: i.phone ?? "-",
    status: i.status ?? "ACTIVE",
  }));
}

export default function InstitutionsPage() {
  const [data, setData] = useState<InstitutionRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<InstitutionRow | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    city: "",
    state: "",
    email: "",
    phone: "",
  });

  const [deactivateTarget, setDeactivateTarget] = useState<InstitutionRow | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const openCreate = () => {
    setEditingInstitution(null);
    setForm({ name: "", code: "", city: "", state: "", email: "", phone: "" });
    setDialogOpen(true);
  };

  const openEdit = (institution: InstitutionRow) => {
    setEditingInstitution(institution);
    setForm({
      name: institution.name,
      code: institution.code,
      city: institution.city === "-" ? "" : institution.city,
      state: institution.state === "-" ? "" : institution.state,
      email: institution.email === "-" ? "" : institution.email,
      phone: institution.phone === "-" ? "" : institution.phone,
    });
    setDialogOpen(true);
  };

  const columns: ColumnDef<AppTableFeatures, InstitutionRow>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <Link
          href={`/super-admin/institutions/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.getValue("name")}
        </Link>
      ),
    },
    { accessorKey: "code", header: "Code" },
    { accessorKey: "city", header: "City" },
    { accessorKey: "state", header: "State" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
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
        const institution = row.original as InstitutionRow;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEdit(institution)}
              aria-label="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeactivateTarget(institution)}
              aria-label={
                institution.status === "ACTIVE" ? "Deactivate" : "Activate"
              }
            >
              <Power className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const institutions = await getInstitutionData();
      setData(institutions);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load institutions"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.code) {
      toast.error("Name and code are required");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        city: form.city || undefined,
        state: form.state || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
      };
      if (editingInstitution) {
        await updateInstitution(editingInstitution.id, payload);
        toast.success("Institution updated successfully");
      } else {
        await createInstitution({ ...payload, status: "ACTIVE" });
        toast.success("Institution created successfully");
      }
      setDialogOpen(false);
      setEditingInstitution(null);
      setForm({ name: "", code: "", city: "", state: "", email: "", phone: "" });
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save institution");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      const nextStatus = deactivateTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await setInstitutionStatus(deactivateTarget.id, nextStatus);
      toast.success(
        nextStatus === "ACTIVE"
          ? "Institution activated"
          : "Institution deactivated"
      );
      setDeactivateTarget(null);
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update institution");
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutions"
        description="Manage medical colleges on the platform"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Institution
          </Button>
        }
      />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No institutions found"
        emptyDescription="No medical colleges have been onboarded yet."
        loadingColumns={5}
      >
        {(institutions) => (
          <DataTable
            columns={columns}
            data={institutions}
            searchPlaceholder="Search institutions..."
          />
        )}
      </AsyncContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingInstitution ? "Edit Institution" : "Add Institution"}</DialogTitle>
            <DialogDescription>
              {editingInstitution
                ? "Update this medical college's details."
                : "Onboard a new medical college to the platform."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="inst-name">Name *</Label>
                <Input
                  id="inst-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. AIIMS Delhi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inst-code">Code *</Label>
                <Input
                  id="inst-code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. AIIMS-DEL"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="inst-city">City</Label>
                <Input
                  id="inst-city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. New Delhi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inst-state">State</Label>
                <Input
                  id="inst-state"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="e.g. Delhi"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="inst-email">Email</Label>
                <Input
                  id="inst-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@college.edu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inst-phone">Phone</Label>
                <Input
                  id="inst-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 ..."
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setEditingInstitution(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting
                ? editingInstitution
                  ? "Saving..."
                  : "Creating..."
                : editingInstitution
                  ? "Save Changes"
                  : "Create Institution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deactivateTarget && (
        <ConfirmationDialog
          open={!!deactivateTarget}
          onOpenChange={(open) => {
            if (!open) setDeactivateTarget(null);
          }}
          onConfirm={handleDeactivate}
          title={
            deactivateTarget.status === "ACTIVE"
              ? "Deactivate Institution"
              : "Activate Institution"
          }
          description={
            deactivateTarget.status === "ACTIVE"
              ? `Deactivate ${deactivateTarget.name}? Deans, HODs, faculty, and students at this institution will be affected.`
              : `Activate ${deactivateTarget.name}?`
          }
          confirmLabel={
            deactivateTarget.status === "ACTIVE" ? "Deactivate" : "Activate"
          }
          variant={deactivateTarget.status === "ACTIVE" ? "destructive" : "default"}
          isLoading={deactivating}
        />
      )}
    </div>
  );
}