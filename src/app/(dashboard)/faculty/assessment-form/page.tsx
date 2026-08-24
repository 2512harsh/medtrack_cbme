"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageLoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FileText, Users as UsersIcon, CheckCircle, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import {
  getAssignedStudents,
  getAssignedCompetencies,
  getOrCreateAssessment,
  submitAssessment,
  getAssessmentForStudentAndAssignment,
  getAssessmentResponse,
  type StudentResponseAnswer,
} from "@/features/faculty/services/faculty";
import { getQuestionTemplates } from "@/features/curriculum/services/curriculum";
import type { Student, CompetencyAssignment, QuestionTemplate, AssessmentDecision } from "@/types";

function assignmentLabel(a: CompetencyAssignment): string {
  const competency = a.competency;
  if (!competency) return "Unknown competency";
  const base = `${competency.competencyCode} — ${competency.competencyTitle}`;
  return competency.competencyLevel ? `${base} (Level: ${competency.competencyLevel})` : base;
}

const ratingToDecision: Record<string, AssessmentDecision> = {
  M: "Meets Expectations",
  E: "Exceeds Expectations",
  N: "Needs Remediation",
};

export default function AssessmentFormPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [assignedCompetencies, setAssignedCompetencies] = useState<CompetencyAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Table State
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [studentResponse, setStudentResponse] = useState<
    { templateId: string; answers: StudentResponseAnswer[] } | undefined
  >(undefined);
  const [responseLoading, setResponseLoading] = useState(false);
  const [attempt, setAttempt] = useState("First Attempt");
  const [rating, setRating] = useState("");
  const [decision, setDecision] = useState("Completed");
  const [remarks, setRemarks] = useState("");
  const [facultySignature, setFacultySignature] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, assignments] = await Promise.all([getAssignedStudents(), getAssignedCompetencies()]);
      setStudents(s);
      setAssignedCompetencies(assignments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedStudents = useMemo(
    () => students.filter((s) => selectedStudentIds.has(s.id)),
    [students, selectedStudentIds]
  );

  // Only show competencies actually assigned (via Competency Assignment) for the
  // batch(es) the selected student(s) belong to - not the whole curriculum tree.
  const availableAssignments = useMemo(() => {
    const batches = new Set(selectedStudents.map((s) => s.batch));
    return assignedCompetencies.filter((a) => batches.has(a.batch));
  }, [assignedCompetencies, selectedStudents]);

  const selectedAssignment = availableAssignments.find((a) => a.id === selectedAssignmentId);

  useEffect(() => {
    if (!selectedAssignment) {
      setTemplates([]);
      return;
    }
    setTemplatesLoading(true);
    getQuestionTemplates(selectedAssignment.competencyId)
      .then(setTemplates)
      .finally(() => setTemplatesLoading(false));
  }, [selectedAssignment?.competencyId]);

  // Only meaningful for a single selected student - a response belongs to one
  // student's own assessment, not a batch of them.
  const responseStudentId = selectedStudents.length === 1 ? selectedStudents[0].id : undefined;

  useEffect(() => {
    if (!selectedAssignment || !responseStudentId) {
      setStudentResponse(undefined);
      return;
    }
    let cancelled = false;
    setResponseLoading(true);
    getAssessmentForStudentAndAssignment(responseStudentId, selectedAssignment.id)
      .then((assessment) => (assessment ? getAssessmentResponse(assessment.id) : undefined))
      .then((response) => {
        if (!cancelled) setStudentResponse(response);
      })
      .finally(() => {
        if (!cancelled) setResponseLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedAssignment?.id, responseStudentId]);

  // First Attempt only ever ends in a completed decision (Exceeds/Meets
  // Expectations); Repeat always means the student still needs remediation.
  const handleAttemptChange = (value: string | null) => {
    const next = value ?? "";
    setAttempt(next);
    if (next === "First Attempt") {
      setRating("");
      setDecision("Completed");
    } else if (next === "Repeat") {
      setRating("N");
      setDecision("Not Completed");
    } else {
      setRating("");
      setDecision("");
    }
  };

  const resetForm = () => {
    setSelectedAssignmentId("");
    setTemplates([]);
    setStudentResponse(undefined);
    setAttempt("First Attempt");
    setRating("");
    setDecision("Completed");
    setRemarks("");
    setFacultySignature("");
  };

  const toggleStudentSelection = (studentId: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(studentId)) {
      next.delete(studentId);
    } else {
      next.add(studentId);
    }
    setSelectedStudentIds(next);
  };

  const toggleAllStudents = () => {
    if (selectedStudentIds.size === students.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(students.map((s) => s.id)));
    }
  };

  const columns: ColumnDef<AppTableFeatures, Student>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={students.length > 0 && selectedStudentIds.size === students.length}
          onCheckedChange={toggleAllStudents}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedStudentIds.has(row.original.id)}
          onCheckedChange={() => toggleStudentSelection(row.original.id)}
          aria-label="Select row"
        />
      ),
    },
    {
      id: "student",
      header: "Student",
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {student.user ? `${student.user.firstName} ${student.user.lastName}` : "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground">{student.rollNumber}</span>
          </div>
        );
      },
    },
    {
      id: "batch",
      header: "Batch",
      cell: ({ row }) => <span>{row.original.batch}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedStudentIds(new Set([row.original.id]));
            setIsModalOpen(true);
          }}
        >
          Evaluate
        </Button>
      ),
    },
  ];

  const handleSubmit = async () => {
    if (!selectedAssignmentId || !attempt || !rating || !decision || !facultySignature.trim()) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const studentIds = Array.from(selectedStudentIds);
      const results = await Promise.allSettled(
        studentIds.map(async (studentId) => {
          const assessment = await getOrCreateAssessment(studentId, selectedAssignmentId);
          await submitAssessment({
            assessmentId: assessment.id,
            rating,
            decision: ratingToDecision[rating],
            remarks: remarks.trim(),
            facultySignature: facultySignature.trim(),
          });
        })
      );

      const failedCount = results.filter((r) => r.status === "rejected").length;
      if (failedCount > 0) {
        toast.error(`${failedCount} of ${studentIds.length} submission(s) failed. Please retry those students.`);
      } else {
        toast.success(`Successfully submitted assessments for ${studentIds.length} student(s)`);
      }

      setIsModalOpen(false);
      setSelectedStudentIds(new Set());
      resetForm();
    } catch {
      toast.error("An error occurred while submitting assessments");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Pending Assessments" description="Select students to evaluate" />
        <PageLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Assessments"
        description="Select one or multiple students to evaluate them together"
        actions={
          <Button
            onClick={() => {
              if (selectedStudentIds.size === 0) {
                toast.error("Please select at least one student from the table");
                return;
              }
              setIsModalOpen(true);
            }}
            disabled={selectedStudentIds.size === 0}
          >
            <FileText className="mr-2 h-4 w-4" />
            Bulk Evaluate ({selectedStudentIds.size})
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>Select students below to begin assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={students}
            searchPlaceholder="Search students..."
          />
        </CardContent>
      </Card>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (isSubmitting) return;
          setIsModalOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Evaluate Students</DialogTitle>
            <DialogDescription>
              Fill out the assessment details below for the selected student(s).
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
                <UsersIcon className="h-4 w-4 text-primary" />
                Selected Students ({selectedStudentIds.size})
              </h3>
              <div className="max-h-32 overflow-y-auto space-y-2 border rounded-md p-3 bg-muted/20">
                {selectedStudents.map((s) => (
                  <div key={s.id} className="flex justify-between items-center text-sm">
                    <span className="font-medium">
                      {s.user ? `${s.user.firstName} ${s.user.lastName}` : "Unknown"}
                    </span>
                    <span className="text-muted-foreground">{s.rollNumber}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold">Competency Selection</h3>
              <div className="space-y-2">
                <Label htmlFor="assignment">Competency Assignment *</Label>
                <Select
                  items={availableAssignments.map((a) => ({ value: a.id, label: assignmentLabel(a) }))}
                  value={selectedAssignmentId}
                  onValueChange={(v) => setSelectedAssignmentId(v ?? "")}
                  disabled={availableAssignments.length === 0}
                >
                  <SelectTrigger id="assignment" className="w-full">
                    <SelectValue
                      placeholder={
                        availableAssignments.length === 0
                          ? "No competencies assigned for this batch"
                          : "Select a competency"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-w-md">
                    {availableAssignments.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {assignmentLabel(a)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAssignment?.competency?.competencyDescription && (
                  <p className="text-sm text-muted-foreground whitespace-normal break-words">
                    {selectedAssignment.competency.competencyDescription}
                  </p>
                )}
              </div>

              {selectedAssignmentId && (
                <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" />
                    Question Template &amp; Student Response
                  </h4>
                  {!responseStudentId && (
                    <p className="text-xs text-muted-foreground italic">
                      Select a single student to view their submitted response.
                    </p>
                  )}
                  {templatesLoading ? (
                    <p className="text-sm text-muted-foreground">Loading template...</p>
                  ) : templates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No question template for this competency yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {templates.map((t) => {
                        const responseForTemplate =
                          studentResponse?.templateId === t.id ? studentResponse : undefined;
                        return (
                          <div key={t.id} className="space-y-2">
                            <p className="text-sm font-medium">{t.title}</p>
                            {t.instructions && (
                              <p className="text-xs text-muted-foreground">{t.instructions}</p>
                            )}
                            <div className="space-y-2.5">
                              {(t.questions ?? []).map((q, index) => {
                                const answer = responseForTemplate?.answers.find(
                                  (a) => a.questionId === q.id
                                )?.answerText;
                                return (
                                  <div key={q.id} className="text-sm">
                                    <p>
                                      <span className="text-muted-foreground">{index + 1}.</span> {q.questionText}
                                      {q.required && (
                                        <span className="ml-1 text-xs text-muted-foreground">(required)</span>
                                      )}
                                    </p>
                                    <p className="mt-0.5 pl-4 text-muted-foreground">
                                      {responseStudentId ? (
                                        responseLoading ? (
                                          "Loading response..."
                                        ) : answer ? (
                                          <span className="text-foreground">{answer}</span>
                                        ) : (
                                          <span className="italic">No answer provided</span>
                                        )
                                      ) : (
                                        <span className="italic">—</span>
                                      )}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold">Evaluation Details</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Attempt *</Label>
                  <Select value={attempt} onValueChange={handleAttemptChange} disabled={!selectedAssignmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select attempt type">
                        {attempt}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First Attempt">First Attempt</SelectItem>
                      <SelectItem value="Repeat">Repeat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Rating *</Label>
                  {attempt === "Repeat" ? (
                    <div className="flex h-8 items-center rounded-lg border border-input bg-muted/40 px-2.5 text-sm text-muted-foreground">
                      Needs Remediation (N)
                    </div>
                  ) : (
                    <Select
                      value={rating}
                      onValueChange={(v) => setRating(v ?? "")}
                      disabled={!selectedAssignmentId || !attempt}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rating">
                          {rating === "M" ? "Meets Expectations (M)" : rating === "E" ? "Exceeds Expectations (E)" : ""}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="E">Exceeds Expectations (E)</SelectItem>
                        <SelectItem value="M">Meets Expectations (M)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Decision *</Label>
                <div className="flex h-8 items-center rounded-lg border border-input bg-muted/40 px-2.5 text-sm text-muted-foreground">
                  {decision || "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Set automatically from the attempt type — Completed for a First Attempt, Not Completed for a Repeat.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter final remarks for the selected students..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={!rating}
                />
              </div>

              <div className="text-xs text-muted-foreground pt-2">
                Created At: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="facultySignature">Digital Signature *</Label>
              <Input
                id="facultySignature"
                placeholder="Enter your full name"
                value={facultySignature}
                onChange={(e) => setFacultySignature(e.target.value)}
                disabled={!rating}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submit Assessment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
