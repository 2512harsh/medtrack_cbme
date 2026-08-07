"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageLoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  FileText,
  Calendar,
  User as UserIcon,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAssignedStudents,
  getAssignedCompetencies,
  getAssessmentById,
  getAssessmentDraft,
  getOrCreateAssessment,
  saveAssessmentDraft,
  submitAssessment,
} from "@/features/faculty/services/faculty";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import type { Assessment, AssessmentAttempt, CompetencyAssignment, Student } from "@/types";

const decisions: AssessmentAttempt["decision"][] = [
  "Meets Expectations",
  "Exceeds Expectations",
  "Needs Remediation",
];

function statusPill(status?: string) {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-700";
    case "Reattempt Scheduled":
      return "bg-orange-100 text-orange-700";
    case "Waiting for Student Acknowledgement":
    case "Submitted":
      return "bg-blue-100 text-blue-700";
    case "In Progress":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function AssessmentFormPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const assessmentId = searchParams.get("assessmentId");
  const studentParam = searchParams.get("studentId");
  const assignmentParam = searchParams.get("assignmentId");

  const [students, setStudents] = useState<Student[]>([]);
  const [competencies, setCompetencies] = useState<CompetencyAssignment[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  const [studentId, setStudentId] = useState("");
  const [competencyId, setCompetencyId] = useState("");
  const [rating, setRating] = useState("");
  const [decision, setDecision] = useState<AssessmentAttempt["decision"] | "">("");
  const [remarks, setRemarks] = useState("");
  const [signature, setSignature] = useState(user ? `${user.firstName} ${user.lastName}` : "");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error" | "remediation">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [s, c] = await Promise.all([getAssignedStudents(), getAssignedCompetencies()]);
        setStudents(s);
        setCompetencies(c);
        if (studentParam && !assessmentId) {
          setStudentId(studentParam);
        }
        if (assignmentParam && !assessmentId) {
          setCompetencyId(assignmentParam);
        }
        if (assessmentId) {
          const a = await getAssessmentById(assessmentId);
          if (a) {
            setAssessment(a);
            setStudentId(a.studentId);
            setCompetencyId(a.competencyAssignmentId);
            const draft = await getAssessmentDraft(assessmentId);
            if (draft) {
              setRating(draft.rating);
              setRemarks(draft.remarks);
              if (draft.facultySignature) setSignature(draft.facultySignature);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [assessmentId, studentParam, assignmentParam]);

  const resolveAssessment = async (): Promise<Assessment> => {
    if (assessment) return assessment;
    return getOrCreateAssessment(studentId, competencyId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus("idle");
    if (!studentId || !rating || !decision || !remarks || !signature) {
      setSubmitStatus("error");
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const resolved = await resolveAssessment();
      const attempt = await submitAssessment({
        assessmentId: resolved.id,
        rating,
        decision,
        remarks,
        facultySignature: signature,
      });
      setAssessment({ ...resolved, currentAttempt: attempt.attemptNumber });
      setSubmitStatus(decision === "Needs Remediation" ? "remediation" : "success");
      toast.success(
        decision === "Needs Remediation"
          ? "Assessment submitted. A reattempt has been scheduled."
          : "Assessment submitted successfully"
      );
    } catch {
      setSubmitStatus("error");
      toast.error("Failed to submit assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!studentId) {
      toast.error("Select a student before saving a draft");
      return;
    }
    setIsSavingDraft(true);
    try {
      const resolved = await resolveAssessment();
      await saveAssessmentDraft({
        assessmentId: resolved.id,
        rating,
        remarks,
        facultySignature: signature,
      });
      setAssessment(resolved);
      setSubmitStatus("idle");
      toast.success("Draft saved locally");
    } catch {
      toast.error("Failed to save draft. Please try again.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const resetForm = () => {
    setSubmitStatus("idle");
    setRating("");
    setDecision("");
    setRemarks("");
    setSignature(user ? `${user.firstName} ${user.lastName}` : "");
    setStudentId("");
    setCompetencyId("");
    setAssessment(null);
  };

  const isFormDisabled = isSubmitting || isSavingDraft;
  const facultyName = user ? `${user.firstName} ${user.lastName}` : "Faculty";
  const currentCompetency = assessment?.competencyAssignment?.competency;
  const currentStudent = assessment?.student;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assessment Form" description="Record your evaluation for a student" />
        <PageLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessment Form"
        description="Record your evaluation for a student"
      />

      {assessment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {currentCompetency?.competencyCode ?? "Competency"} — {currentCompetency?.competencyTitle ?? "Assessment"}
            </CardTitle>
            <CardDescription>
              Review context for this assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-2">
              <UserIcon className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Student</p>
                <p className="font-medium">
                  {currentStudent?.user
                    ? `${currentStudent.user.firstName} ${currentStudent.user.lastName}`
                    : "—"}
                </p>
                <p className="text-muted-foreground text-xs">{currentStudent?.rollNumber}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <RotateCcw className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Attempt</p>
                <p className="font-medium">Attempt {assessment.currentAttempt}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Status</p>
                <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${statusPill(assessment.currentStatus)}`}>
                  {assessment.currentStatus}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Created</p>
                <p className="font-medium">
                  {new Date(assessment.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Faculty Evaluation</CardTitle>
          <CardDescription>
            Fill in the assessment details below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student">Student</Label>
              {assessment ? (
                <Input value={currentStudent?.user ? `${currentStudent.user.firstName} ${currentStudent.user.lastName} (${currentStudent.rollNumber})` : ""} disabled readOnly />
              ) : (
                <Select value={studentId} onValueChange={(v) => setStudentId(v ?? "")} disabled={isFormDisabled}>
                  <SelectTrigger id="student">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.user ? `${s.user.firstName} ${s.user.lastName} (${s.rollNumber})` : s.rollNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {!assessment && (
              <div className="space-y-2">
                <Label htmlFor="competency">Competency</Label>
                <Select value={competencyId} onValueChange={(v) => setCompetencyId(v ?? "")} disabled={isFormDisabled}>
                  <SelectTrigger id="competency">
                    <SelectValue placeholder="Select a competency" />
                  </SelectTrigger>
                  <SelectContent>
                    {competencies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.competency?.competencyCode ?? ""} — {c.competency?.competencyTitle ?? c.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <Input
                id="rating"
                placeholder="e.g., 4/5"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                disabled={isFormDisabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="decision">Decision</Label>
              <Select value={decision} onValueChange={(v) => setDecision(v as AssessmentAttempt["decision"])} disabled={isFormDisabled}>
                <SelectTrigger id="decision">
                  <SelectValue placeholder="Select a decision" />
                </SelectTrigger>
                <SelectContent>
                  {decisions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <textarea
                id="remarks"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter your remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={isFormDisabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature">Faculty Signature</Label>
              <Input
                id="signature"
                placeholder="Enter your name"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                disabled={isFormDisabled}
              />
              <p className="text-xs text-muted-foreground">
                Signing as {facultyName}
              </p>
            </div>

            {submitStatus === "success" && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Assessment submitted successfully. It is now waiting for student acknowledgement.
                </AlertDescription>
              </Alert>
            )}

            {submitStatus === "remediation" && (
              <Alert className="border-orange-200 text-orange-800">
                <RotateCcw className="h-4 w-4" />
                <AlertDescription>
                  Assessment marked as Needs Remediation. The student will review the feedback and a reattempt
                  will be scheduled automatically.
                </AlertDescription>
              </Alert>
            )}

            {submitStatus === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Submission failed. Please check your input and try again.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isFormDisabled}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Assessment"
                )}
              </Button>
              <Button type="button" variant="outline" disabled={isFormDisabled} onClick={handleSaveDraft}>
                {isSavingDraft ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Draft
              </Button>
              {(submitStatus === "success" || submitStatus === "remediation") && (
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Evaluate another assessment
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
