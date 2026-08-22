"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Power } from "lucide-react";
import {
  getDepartments,
  getInstitutionById,
  getDeanAccounts,
  getHodAccounts,
  createDepartment,
  setDepartmentStatus,
  createDeanAccount,
  createHodAccount,
  updateDepartment,
} from "@/features/super-admin/services/superAdmin";
import { ColumnDef } from "@tanstack/react-table";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { toast } from "sonner";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

type DepartmentRow = {
  id: string;
  name: string;
  description: string;
  institutionId: string;
  institutionName: string;
  deanName: string;
  hodName: string;
  status: string;
};

export default function DepartmentsPage() {
  const [data, setData] = useState<DepartmentRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    institutionId: "",
    createDean: false,
    deanFirstName: "",
    deanLastName: "",
    deanEmail: "",
    deanPassword: "",
    createHod: false,
    hodFirstName: "",
    hodLastName: "",
    hodEmail: "",
    hodPassword: "",
  });

  const [statusTarget, setStatusTarget] = useState<DepartmentRow | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [departments, deans, hods] = await Promise.all([
        getDepartments(),
        getDeanAccounts(),
        getHodAccounts(),
      ]);
      const institutions = await Promise.all(
        departments.map((d) => getInstitutionById(d.institutionId))
      );
      const rows: DepartmentRow[] = departments.map((d, index) => {
        const inst = institutions[index];
        const dean = deans.find((h) => h.id === d.deanId);
        const hod = hods.find((h) => h.id === d.hodId);
        return {
          id: d.id,
          name: d.name,
          description: d.description ?? "-",
          institutionId: d.institutionId,
          institutionName: inst?.name ?? "Unknown",
          deanName: dean ? `${dean.firstName} ${dean.lastName}` : "Unassigned",
          hodName: hod ? `${hod.firstName} ${hod.lastName}` : "Unassigned",
          status: d.status ?? "ACTIVE",
        };
      });
      setData(rows);

      const allInst = await Promise.all(
        Array.from(new Set(departments.map((d) => d.institutionId))).map((id) =>
          getInstitutionById(id)
        )
      );
      setInstitutions(
        allInst
          .filter((i) => i)
          .map((i) => ({ id: i!.id, name: i!.name }))
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
    { accessorKey: "institutionName", header: "Institution" },
    { accessorKey: "deanName", header: "Dean" },
    { accessorKey: "hodName", header: "HOD" },
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStatusTarget(department)}
            aria-label={department.status === "ACTIVE" ? "Deactivate" : "Activate"}
          >
            <Power className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  const handleCreate = async () => {
    if (!form.name || !form.institutionId) {
      toast.error("Name and institution are required");
      return;
    }

    if (form.createDean) {
      if (!form.deanFirstName || !form.deanLastName || !form.deanEmail || !form.deanPassword) {
        toast.error("All Dean fields are required if creating a Dean account");
        return;
      }
    }

    if (form.createHod) {
      if (!form.hodFirstName || !form.hodLastName || !form.hodEmail || !form.hodPassword) {
        toast.error("All HOD fields are required if creating an HOD account");
        return;
      }
    }

    setSubmitting(true);
    try {
      const department = await createDepartment({
        name: form.name,
        description: form.description || undefined,
        institutionId: form.institutionId,
        status: "ACTIVE",
      });

      if (form.createDean) {
        const dean = await createDeanAccount({
          firstName: form.deanFirstName,
          lastName: form.deanLastName,
          email: form.deanEmail,
          password: form.deanPassword,
          departmentId: department.id,
        });
        await updateDepartment(department.id, { deanId: dean.id });
      }

      if (form.createHod) {
        const hod = await createHodAccount({
          firstName: form.hodFirstName,
          lastName: form.hodLastName,
          email: form.hodEmail,
          password: form.hodPassword,
          departmentId: department.id,
        });
        await updateDepartment(department.id, { hodId: hod.id });
      }

      toast.success("Department created successfully");
      setDialogOpen(false);
      setForm({
        name: "",
        description: "",
        institutionId: "",
        createDean: false,
        deanFirstName: "",
        deanLastName: "",
        deanEmail: "",
        deanPassword: "",
        createHod: false,
        hodFirstName: "",
        hodLastName: "",
        hodEmail: "",
        hodPassword: "",
      });
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create department");
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
        description="Manage departments across institutions"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
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
        loadingColumns={5}
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
            <DialogTitle>Add Department</DialogTitle>
            <DialogDescription>
              Create a new department under an institution.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dept-name">Name *</Label>
              <Input
                id="dept-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Anatomy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-desc">Description</Label>
              <Input
                id="dept-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Department of Anatomy"
              />
            </div>
            <div className="space-y-2">
              <Label>Institution *</Label>
              <Select
                items={institutions.map((inst) => ({ value: inst.id, label: inst.name }))}
                value={form.institutionId}
                onValueChange={(value) => setForm({ ...form, institutionId: value ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select institution" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pt-2 border-t mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create-dean"
                  checked={form.createDean}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, createDean: checked === true })
                  }
                />
                <Label htmlFor="create-dean">Create Dean Account for this Department</Label>
              </div>
            </div>

            {form.createDean && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="dean-firstName">First Name *</Label>
                  <Input
                    id="dean-firstName"
                    value={form.deanFirstName}
                    onChange={(e) => setForm({ ...form, deanFirstName: e.target.value })}
                    placeholder="First Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dean-lastName">Last Name *</Label>
                  <Input
                    id="dean-lastName"
                    value={form.deanLastName}
                    onChange={(e) => setForm({ ...form, deanLastName: e.target.value })}
                    placeholder="Last Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dean-email">Email *</Label>
                  <Input
                    id="dean-email"
                    type="email"
                    value={form.deanEmail}
                    onChange={(e) => setForm({ ...form, deanEmail: e.target.value })}
                    placeholder="dean@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dean-password">Password *</Label>
                  <Input
                    id="dean-password"
                    type="password"
                    value={form.deanPassword}
                    onChange={(e) => setForm({ ...form, deanPassword: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create-hod"
                  checked={form.createHod}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, createHod: checked === true })
                  }
                />
                <Label htmlFor="create-hod">Create HOD Account for this Department</Label>
              </div>
            </div>

            {form.createHod && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="hod-firstName">First Name *</Label>
                  <Input
                    id="hod-firstName"
                    value={form.hodFirstName}
                    onChange={(e) => setForm({ ...form, hodFirstName: e.target.value })}
                    placeholder="First Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hod-lastName">Last Name *</Label>
                  <Input
                    id="hod-lastName"
                    value={form.hodLastName}
                    onChange={(e) => setForm({ ...form, hodLastName: e.target.value })}
                    placeholder="Last Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hod-email">Email *</Label>
                  <Input
                    id="hod-email"
                    type="email"
                    value={form.hodEmail}
                    onChange={(e) => setForm({ ...form, hodEmail: e.target.value })}
                    placeholder="hod@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hod-password">Password *</Label>
                  <Input
                    id="hod-password"
                    type="password"
                    value={form.hodPassword}
                    onChange={(e) => setForm({ ...form, hodPassword: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating..." : "Create Department"}
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
