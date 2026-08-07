"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Power } from "lucide-react";
import {
  getHodAccounts,
  getDepartments,
  createHodAccount,
  setHodAccountStatus,
} from "@/features/super-admin/services/superAdmin";
import { ColumnDef } from "@tanstack/react-table";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { toast } from "sonner";
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
import type { HodAccount } from "@/features/super-admin/services/superAdmin";

type HodRow = {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  departmentName: string;
  status: string;
};

export default function HodAccountsPage() {
  const [data, setData] = useState<HodRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    departmentId: "",
  });

  const [statusTarget, setStatusTarget] = useState<HodRow | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [hods, depts] = await Promise.all([getHodAccounts(), getDepartments()]);
      const rows: HodRow[] = hods.map((h: HodAccount) => {
        const dept = depts.find((d) => d.id === h.departmentId);
        return {
          id: h.id,
          name: `${h.firstName} ${h.lastName}`,
          email: h.email,
          departmentId: h.departmentId ?? "",
          departmentName: dept?.name ?? "Unassigned",
          status: h.status,
        };
      });
      setData(rows);
      setDepartments(depts.map((d) => ({ id: d.id, name: d.name })));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load HOD accounts"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns: ColumnDef<AppTableFeatures, HodRow>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "departmentName", header: "Department" },
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStatusTarget(hod)}
            aria-label={hod.status === "ACTIVE" ? "Deactivate" : "Activate"}
          >
            <Power className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.departmentId) {
      toast.error("All fields are required");
      return;
    }
    setSubmitting(true);
    try {
      await createHodAccount({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        departmentId: form.departmentId,
      });
      toast.success("HOD account created successfully");
      setDialogOpen(false);
      setForm({ firstName: "", lastName: "", email: "", password: "", departmentId: "" });
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create HOD account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async () => {
    if (!statusTarget) return;
    setStatusUpdating(true);
    try {
      const nextStatus = statusTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await setHodAccountStatus(statusTarget.id, nextStatus);
      toast.success(nextStatus === "ACTIVE" ? "HOD account activated" : "HOD account deactivated");
      setStatusTarget(null);
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update HOD account");
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="HOD Accounts"
        description="Create and manage HOD accounts"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create HOD Account
          </Button>
        }
      />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No HOD accounts"
        emptyDescription="No HOD accounts have been created yet."
        loadingColumns={5}
      >
        {(hods) => (
          <DataTable
            columns={columns}
            data={hods}
            searchPlaceholder="Search HOD accounts..."
          />
        )}
      </AsyncContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create HOD Account</DialogTitle>
            <DialogDescription>
              Create a new Head of Department account and assign a department.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hod-first">First Name *</Label>
                <Input
                  id="hod-first"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="e.g. Meera"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hod-last">Last Name *</Label>
                <Input
                  id="hod-last"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="e.g. Reddy"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hod-email">Email *</Label>
              <Input
                id="hod-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="hod.anatomy@medtrack.ed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hod-password">Temporary Password *</Label>
              <Input
                id="hod-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Set a temporary password"
              />
            </div>
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select
                value={form.departmentId}
                onValueChange={(value) => setForm({ ...form, departmentId: value ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating..." : "Create Account"}
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
          title={statusTarget.status === "ACTIVE" ? "Deactivate HOD Account" : "Activate HOD Account"}
          description={
            statusTarget.status === "ACTIVE"
              ? `Deactivate ${statusTarget.name}? They will lose access to the department dashboard.`
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