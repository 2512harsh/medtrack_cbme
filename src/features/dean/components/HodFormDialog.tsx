"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Department } from "@/types";
import type { HodAccount } from "@/features/super-admin/mock/superAdmin";

export interface HodFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  departmentId: string;
  status: "ACTIVE" | "INACTIVE";
}

interface HodFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hod?: HodAccount | null;
  departments: Department[];
  isSaving: boolean;
  onSave: (values: HodFormValues) => void | Promise<void>;
}

export function HodFormDialog({
  open,
  onOpenChange,
  hod,
  departments,
  isSaving,
  onSave,
}: HodFormDialogProps) {
  const [values, setValues] = useState<HodFormValues>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    departmentId: "",
    status: "ACTIVE",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues({
        firstName: hod?.firstName ?? "",
        lastName: hod?.lastName ?? "",
        email: hod?.email ?? "",
        password: "",
        departmentId: hod?.departmentId ?? departments[0]?.id ?? "",
        status: hod?.status ?? "ACTIVE",
      });
      setError(null);
    }
  }, [open, hod, departments]);

  const set = (key: keyof HodFormValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !values.firstName ||
      !values.lastName ||
      !values.email ||
      (!hod && !values.password) ||
      !values.departmentId
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    setError(null);
    await onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{hod ? "Edit HOD" : "Add HOD"}</DialogTitle>
          <DialogDescription>
            {hod
              ? "Update the head of department's details below."
              : "Assign a new head of department in your institution."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="First name"
                value={values.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Last name"
                value={values.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@medtrack.edu"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{hod ? "New Password" : "Password *"}</Label>
            <Input
              id="password"
              type="password"
              placeholder={hod ? "Leave blank to keep current password" : "Set a login password"}
              value={values.password}
              onChange={(e) => set("password", e.target.value)}
              disabled={isSaving}
              autoComplete="new-password"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                items={departments.map((d) => ({ value: d.id, label: d.name }))}
                value={values.departmentId}
                onValueChange={(v) => set("departmentId", v ?? "")}
                disabled={isSaving}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                items={{ ACTIVE: "Active", INACTIVE: "Inactive" }}
                value={values.status}
                onValueChange={(v) => set("status", v ?? "ACTIVE")}
                disabled={isSaving}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : hod ? (
                "Save Changes"
              ) : (
                "Add HOD"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
