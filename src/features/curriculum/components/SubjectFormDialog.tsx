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
import type { Department, ProfessionalYear, Subject } from "@/types";

export interface SubjectFormValues {
  name: string;
  code: string;
  professionalYearId: string;
  departmentId: string;
}

interface SubjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: Subject | null;
  professionalYears: ProfessionalYear[];
  departments: Department[];
  isSaving: boolean;
  onSave: (values: SubjectFormValues) => void | Promise<void>;
}

export function SubjectFormDialog({
  open,
  onOpenChange,
  subject,
  professionalYears,
  departments,
  isSaving,
  onSave,
}: SubjectFormDialogProps) {
  const [values, setValues] = useState<SubjectFormValues>({
    name: "",
    code: "",
    professionalYearId: "",
    departmentId: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues({
        name: subject?.name ?? "",
        code: subject?.code ?? "",
        professionalYearId: subject?.professionalYearId ?? professionalYears[0]?.id ?? "",
        departmentId: subject?.departmentId ?? departments[0]?.id ?? "",
      });
      setError(null);
    }
  }, [open, subject, professionalYears, departments]);

  const set = (key: keyof SubjectFormValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name || !values.code || !values.professionalYearId || !values.departmentId) {
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
          <DialogTitle>{subject ? "Edit Subject" : "Add Subject"}</DialogTitle>
          <DialogDescription>
            {subject
              ? "Update the subject's details below."
              : "Create a new subject within a professional year and department."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Subject Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Anatomy"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                placeholder="e.g., AN"
                value={values.code}
                onChange={(e) => set("code", e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="professionalYear">Professional Year *</Label>
              <Select
                items={professionalYears.map((y) => ({ value: y.id, label: y.name }))}
                value={values.professionalYearId}
                onValueChange={(v) => set("professionalYearId", v ?? "")}
                disabled={isSaving}
              >
                <SelectTrigger id="professionalYear">
                  <SelectValue placeholder="Select a professional year" />
                </SelectTrigger>
                <SelectContent>
                  {professionalYears.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              ) : subject ? (
                "Save Changes"
              ) : (
                "Add Subject"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
