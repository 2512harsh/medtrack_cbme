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
import { getStreams, getProfessionalYears } from "@/features/curriculum/services/curriculum";
import type { ProfessionalYear, Stream, Student } from "@/types";

export interface StudentFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  rollNumber: string;
  registrationNumber: string;
  streamId: string;
  professionalYearId: string;
  batch: string;
  admissionYear: number;
  status: "ACTIVE" | "INACTIVE";
}

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  isSaving: boolean;
  onSave: (values: StudentFormValues) => void | Promise<void>;
}

export function StudentFormDialog({
  open,
  onOpenChange,
  student,
  isSaving,
  onSave,
}: StudentFormDialogProps) {
  const [values, setValues] = useState<StudentFormValues>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    rollNumber: "",
    registrationNumber: "",
    streamId: "",
    professionalYearId: "",
    batch: "",
    admissionYear: new Date().getFullYear(),
    status: "ACTIVE",
  });
  const [streams, setStreams] = useState<Stream[]>([]);
  const [professionalYears, setProfessionalYears] = useState<ProfessionalYear[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [s, py] = await Promise.all([getStreams(), getProfessionalYears()]);
      setStreams(s);
      setProfessionalYears(py);
    })();
  }, []);

  useEffect(() => {
    if (open) {
      setValues({
        firstName: student?.user?.firstName ?? "",
        lastName: student?.user?.lastName ?? "",
        email: student?.user?.email ?? "",
        password: "",
        rollNumber: student?.rollNumber ?? "",
        registrationNumber: student?.registrationNumber ?? "",
        streamId: student?.streamId ?? "",
        professionalYearId: student?.professionalYearId ?? "",
        batch: student?.batch ?? "",
        admissionYear: student?.admissionYear ?? new Date().getFullYear(),
        status: student?.user?.status ?? "ACTIVE",
      });
      setError(null);
    }
  }, [open, student]);

  const set = <K extends keyof StudentFormValues>(key: K, value: StudentFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !values.firstName ||
      !values.lastName ||
      !values.email ||
      (!student && !values.password) ||
      !values.rollNumber ||
      !values.registrationNumber ||
      !values.streamId ||
      !values.professionalYearId ||
      !values.batch ||
      !values.admissionYear
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
          <DialogTitle>{student ? "Edit Student" : "Add Student"}</DialogTitle>
          <DialogDescription>
            {student
              ? "Update the student's details below."
              : "Create a new student record manually."}
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
            <Label htmlFor="password">{student ? "New Password" : "Password *"}</Label>
            <Input
              id="password"
              type="password"
              placeholder={student ? "Leave blank to keep current password" : "Set a login password"}
              value={values.password}
              onChange={(e) => set("password", e.target.value)}
              disabled={isSaving}
              autoComplete="new-password"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rollNumber">Roll Number *</Label>
              <Input
                id="rollNumber"
                placeholder="MBBS2024-006"
                value={values.rollNumber}
                onChange={(e) => set("rollNumber", e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration Number *</Label>
              <Input
                id="registrationNumber"
                placeholder="REG2024-006"
                value={values.registrationNumber}
                onChange={(e) => set("registrationNumber", e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stream">Stream *</Label>
              <Select
                items={streams.map((s) => ({ value: s.id, label: s.name }))}
                value={values.streamId}
                onValueChange={(v) => {
                  set("streamId", v ?? "");
                  const py = professionalYears.filter((p) => p.streamId === v);
                  if (py.length > 0 && !py.some((p) => p.id === values.professionalYearId)) {
                    set("professionalYearId", py[0].id);
                  }
                }}
                disabled={isSaving}
              >
                <SelectTrigger id="stream">
                  <SelectValue placeholder="Select a stream" />
                </SelectTrigger>
                <SelectContent>
                  {streams.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="professionalYear">Professional Year *</Label>
              <Select
                items={professionalYears
                  .filter((p) => !values.streamId || p.streamId === values.streamId)
                  .map((p) => ({ value: p.id, label: p.name }))}
                value={values.professionalYearId}
                onValueChange={(v) => set("professionalYearId", v ?? "")}
                disabled={isSaving}
              >
                <SelectTrigger id="professionalYear">
                  <SelectValue placeholder="Select a year" />
                </SelectTrigger>
                <SelectContent>
                  {professionalYears
                    .filter((p) => !values.streamId || p.streamId === values.streamId)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batch">Batch *</Label>
              <Input
                id="batch"
                placeholder="MBBS-2024"
                value={values.batch}
                onChange={(e) => set("batch", e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admissionYear">Admission Year *</Label>
              <Input
                id="admissionYear"
                type="number"
                min={2000}
                max={2100}
                value={values.admissionYear}
                onChange={(e) => set("admissionYear", Number(e.target.value))}
                disabled={isSaving}
              />
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
              ) : student ? (
                "Save Changes"
              ) : (
                "Add Student"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
