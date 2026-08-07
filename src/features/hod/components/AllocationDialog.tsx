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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { getFaculty, getStudents } from "@/features/hod/services/hod";
import { getSubjects } from "@/features/curriculum/services/curriculum";
import type { Faculty, Student, StudentAllocation, Subject } from "@/types";

export interface AllocationFormValues {
  facultyId: string;
  studentIds: string[];
  subjectId: string;
}

interface AllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allocation?: StudentAllocation | null;
  isSaving: boolean;
  onSave: (values: AllocationFormValues) => void | Promise<void>;
}

export function AllocationDialog({
  open,
  onOpenChange,
  allocation,
  isSaving,
  onSave,
}: AllocationDialogProps) {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [facultyId, setFacultyId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [f, s, subj] = await Promise.all([getFaculty(), getStudents(), getSubjects()]);
      setFaculty(f);
      setStudents(s);
      setSubjects(subj);
    })();
  }, []);

  useEffect(() => {
    if (open) {
      setFacultyId(allocation?.facultyId ?? faculty[0]?.id ?? "");
      setSubjectId(allocation?.subjectId ?? subjects[0]?.id ?? "");
      setStudentIds(allocation?.studentId ? [allocation.studentId] : []);
      setError(null);
    }
  }, [open, allocation, faculty, subjects]);

  const toggleStudent = (id: string) => {
    setStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyId || !subjectId || studentIds.length === 0) {
      setError("Faculty, subject, and at least one student are required.");
      return;
    }
    setError(null);
    await onSave({ facultyId, studentIds, subjectId });
  };

  const isReassign = !!allocation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isReassign ? "Reassign Student" : "New Allocation"}</DialogTitle>
          <DialogDescription>
            {isReassign
              ? "Change the faculty assigned to this student allocation."
              : "Assign one or more students to a faculty member."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isReassign && allocation?.student?.user && (
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">
                {allocation.student.user.firstName} {allocation.student.user.lastName}
              </p>
              <p className="text-muted-foreground">{allocation.student.rollNumber}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="faculty">Faculty *</Label>
            <Select value={facultyId} onValueChange={(v) => setFacultyId(v ?? "")} disabled={isSaving}>
              <SelectTrigger id="faculty">
                <SelectValue placeholder="Select a faculty member" />
              </SelectTrigger>
              <SelectContent>
                {faculty.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.user ? `${f.user.firstName} ${f.user.lastName}` : f.employeeCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Select value={subjectId} onValueChange={(v) => setSubjectId(v ?? "")} disabled={isSaving}>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isReassign && (
            <div className="space-y-2">
              <Label>Students *</Label>
              <div className="max-h-48 overflow-y-auto rounded-md border p-2">
                {students.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">
                    No students available. Import students first.
                  </p>
                ) : (
                  students.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={studentIds.includes(s.id)}
                        onCheckedChange={() => toggleStudent(s.id)}
                        disabled={isSaving}
                      />
                      <span className="font-medium">
                        {s.user ? `${s.user.firstName} ${s.user.lastName}` : s.rollNumber}
                      </span>
                      <span className="text-muted-foreground">{s.rollNumber}</span>
                    </label>
                  ))
                )}
              </div>
              {studentIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {studentIds.length} student(s) selected
                </p>
              )}
            </div>
          )}

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
              ) : isReassign ? (
                "Reassign"
              ) : (
                "Allocate"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
