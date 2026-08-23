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
import type { Department, Faculty } from "@/types";

export interface FacultyFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  departmentId: string;
  designation: string;
  employeeCode: string;
  specialization: string;
  status: "ACTIVE" | "INACTIVE";
}

interface FacultyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faculty?: Faculty | null;
  departments: Department[];
  isSaving: boolean;
  onSave: (values: FacultyFormValues) => void | Promise<void>;
}

export function FacultyFormDialog({
  open,
  onOpenChange,
  faculty,
  departments,
  isSaving,
  onSave,
}: FacultyFormDialogProps) {
  const [values, setValues] = useState<FacultyFormValues>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    departmentId: "",
    designation: "",
    employeeCode: "",
    specialization: "",
    status: "ACTIVE",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues({
        firstName: faculty?.user?.firstName ?? "",
        lastName: faculty?.user?.lastName ?? "",
        email: faculty?.user?.email ?? "",
        password: "",
        departmentId: faculty?.departmentId ?? departments[0]?.id ?? "",
        designation: faculty?.designation ?? "",
        employeeCode: faculty?.employeeCode ?? "",
        specialization: faculty?.specialization ?? "",
        status: faculty?.user?.status ?? "ACTIVE",
      });
      setError(null);
    }
  }, [open, faculty, departments]);

  const set = (key: keyof FacultyFormValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !values.firstName ||
      !values.lastName ||
      !values.email ||
      !values.departmentId ||
      !values.designation ||
      !values.employeeCode ||
      (!faculty && !values.password)
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
          <DialogTitle>{faculty ? "Edit Faculty" : "Add Faculty"}</DialogTitle>
          <DialogDescription>
            {faculty
              ? "Update the faculty member's details below."
              : "Create a new faculty member in your department."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              placeholder="name@medtrack.ed"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{faculty ? "New Password" : "Password *"}</Label>
            <Input
              id="password"
              type="password"
              placeholder={faculty ? "Leave blank to keep current password" : "Set a login password"}
              value={values.password}
              onChange={(e) => set("password", e.target.value)}
              disabled={isSaving}
              autoComplete="new-password"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="designation">Designation *</Label>
              <Input
                id="designation"
                placeholder="e.g., Professor"
                value={values.designation}
                onChange={(e) => set("designation", e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeCode">Employee Code *</Label>
              <Input
                id="employeeCode"
                placeholder="e.g., EMP005"
                value={values.employeeCode}
                onChange={(e) => set("employeeCode", e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              id="specialization"
              placeholder="e.g., Gross Anatomy"
              value={values.specialization}
              onChange={(e) => set("specialization", e.target.value)}
              disabled={isSaving}
            />
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
              ) : faculty ? (
                "Save Changes"
              ) : (
                "Add Faculty"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
