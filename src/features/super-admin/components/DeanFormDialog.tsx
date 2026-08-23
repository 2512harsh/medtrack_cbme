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
import type { Institution } from "@/types";
import type { DeanAccount } from "@/features/super-admin/mock/superAdmin";

export interface DeanFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  institutionId: string;
  status: "ACTIVE" | "INACTIVE";
}

interface DeanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dean?: DeanAccount | null;
  institutions: Institution[];
  isSaving: boolean;
  onSave: (values: DeanFormValues) => void | Promise<void>;
}

export function DeanFormDialog({
  open,
  onOpenChange,
  dean,
  institutions,
  isSaving,
  onSave,
}: DeanFormDialogProps) {
  const [values, setValues] = useState<DeanFormValues>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    institutionId: "",
    status: "ACTIVE",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues({
        firstName: dean?.firstName ?? "",
        lastName: dean?.lastName ?? "",
        email: dean?.email ?? "",
        password: "",
        institutionId: dean?.institutionId ?? institutions[0]?.id ?? "",
        status: dean?.status ?? "ACTIVE",
      });
      setError(null);
    }
  }, [open, dean, institutions]);

  const set = (key: keyof DeanFormValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.firstName || !values.lastName || !values.email || (!dean && !values.password) || !values.institutionId) {
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
          <DialogTitle>{dean ? "Edit Dean" : "Add Dean"}</DialogTitle>
          <DialogDescription>
            {dean
              ? "Update the dean's details below."
              : "A Dean oversees an entire institution, across every department."}
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
              placeholder="name@medtrack.edu"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{dean ? "New Password" : "Password *"}</Label>
            <Input
              id="password"
              type="password"
              placeholder={dean ? "Leave blank to keep current password" : "Set a login password"}
              value={values.password}
              onChange={(e) => set("password", e.target.value)}
              disabled={isSaving}
              autoComplete="new-password"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="institution">Institution *</Label>
              <Select
                items={institutions.map((i) => ({ value: i.id, label: i.name }))}
                value={values.institutionId}
                onValueChange={(v) => set("institutionId", v ?? "")}
                disabled={isSaving}
              >
                <SelectTrigger id="institution">
                  <SelectValue placeholder="Select an institution" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
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
              ) : dean ? (
                "Save Changes"
              ) : (
                "Add Dean"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
