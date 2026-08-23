"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  getCompetencyAssignmentById,
  getMyAssessments,
  getOrCreateMyAssessment,
  submitStudentResponse,
  saveStudentResponse,
} from "@/features/student/services/student";
import { getQuestionTemplates } from "@/features/curriculum/services/curriculum";
import { PageLoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, Send, Save, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { Question } from "@/types";

interface DraftState {
  [questionId: string]: string;
}

type Template = Awaited<ReturnType<typeof getQuestionTemplates>>[number];
type AssessmentRow = Awaited<ReturnType<typeof getMyAssessments>>[number];

export default function StudentResponseFormPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [assignment, setAssignment] = useState<Awaited<
    ReturnType<typeof getCompetencyAssignmentById>
  >>(undefined);
  const [template, setTemplate] = useState<Template | undefined>(undefined);
  const [assessment, setAssessment] = useState<AssessmentRow | undefined>(undefined);
  const [answers, setAnswers] = useState<DraftState>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const [assignmentData, assessments] = await Promise.all([
        getCompetencyAssignmentById(params.id),
        getMyAssessments(),
      ]);
      if (!assignmentData) {
        setNotFound(true);
        return;
      }
      setAssignment(assignmentData);
      const existing = assessments.find((a) => a.competencyAssignmentId === assignmentData.id);
      setAssessment(existing ?? (await getOrCreateMyAssessment(assignmentData.id)));

      const competencyId = assignmentData.competencyId;
      const templates = await getQuestionTemplates(competencyId);
      const template = templates?.find((t) => t.competencyId === competencyId);
      setTemplate(template);
      if (template?.questions?.length) {
        const initial: DraftState = {};
        template.questions.forEach((q) => {
          initial[q.id] = "";
        });
        setAnswers(initial);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load response form"));
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const validate = (): boolean => {
    const errors: string[] = [];
    template?.questions?.forEach((q) => {
      const value = (answers[q.id] ?? "").trim();
      if (q.required && !value) {
        errors.push(q.questionText);
      }
    });
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    if (!template || !assessment) {
      toast.error("Unable to submit response");
      return;
    }
    if (!validate()) {
      toast.error("Please answer all required questions");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        questionTemplateId: template.id,
        answers: (template.questions ?? []).map((q: Question) => ({
          questionId: q.id,
          answerText: answers[q.id] ?? "",
        })),
      };
      await submitStudentResponse(assessment.id, payload);
      setSubmitted(true);
      toast.success("Response submitted for review");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!template) {
      toast.error("Unable to save draft");
      return;
    }
    setSavingDraft(true);
    try {
      const payload = {
        questionTemplateId: template.id,
        answers: (template.questions ?? []).map((q: Question) => ({
          questionId: q.id,
          answerText: answers[q.id] ?? "",
        })),
      };
      await saveStudentResponse(payload);
      setValidationErrors([]);
      toast.success("Draft saved locally");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  };

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message="Unable to load the response form. Please try again."
        onRetry={fetchData}
      />
    );
  }

  if (notFound || !assignment) {
    return (
      <EmptyState
        title="Competency not found"
        description="The competency you are looking for does not exist."
        actionLabel="Back to My Competencies"
        onAction={() => router.push("/student/my-competencies")}
      />
    );
  }

  const competency = assignment.competency;

  if (submitted) {
    return (
      <EmptyState
        title="Response Submitted"
        description="Your responses have been submitted for faculty review. You will be notified once reviewed."
        actionLabel="View My Competencies"
        onAction={() => router.push("/student/my-competencies")}
        icon={<CheckCircle2 />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/student/my-competencies" className="hover:text-foreground">
            My Competencies
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Answer Questions</span>
        </div>
        <PageHeader
          title={competency?.competencyTitle ?? "Competency Response"}
          description={
            <>
              {competency?.competencyCode} • Assigned by {assignment.faculty?.user?.firstName}{" "}
              {assignment.faculty?.user?.lastName}
            </>
          }
          actions={
            <StatusBadge
              variant={
                assessment?.currentStatus === "In Progress" ? "warning" : "default"
              }
            >
              {assessment?.currentStatus ?? "Assigned"}
            </StatusBadge>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{template?.title ?? "Questions"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {template?.instructions && (
            <p className="text-sm text-muted-foreground border-l-2 border-primary pl-3">
              {template.instructions}
            </p>
          )}

          {(!template || !template.questions || template.questions.length === 0) && (
            <p className="text-sm text-muted-foreground">
              No questions have been defined for this competency.
            </p>
          )}

          {template?.questions?.map((q: Question, index: number) => {
            const hasError = q.required && !(answers[q.id] ?? "").trim();
            return (
              <div key={q.id} className="space-y-2">
                <Label htmlFor={`question-${q.id}`} className="font-medium">
                  <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                  {q.questionText}
                  {q.required && <span className="ml-1 text-destructive">*</span>}
                </Label>
                <textarea
                  id={`question-${q.id}`}
                  rows={4}
                  value={answers[q.id] ?? ""}
                  onChange={(e) =>
                    setAnswers({ ...answers, [q.id]: e.target.value })
                  }
                  placeholder="Type your response here..."
                  className={`flex w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 ${
                    hasError && validationErrors.length > 0
                      ? "border-destructive focus-visible:border-destructive"
                      : "border-input focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
                  }`}
                />
              </div>
            );
          })}

          {validationErrors.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div>
                <p className="font-medium">Please answer the following required questions:</p>
                <ul className="list-disc ml-5 mt-1">
                  {validationErrors.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t">
            <Button onClick={handleSubmit} disabled={submitting || !template}>
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "Submitting..." : "Submit Response"}
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={savingDraft || !template}
            >
              <Save className="h-4 w-4 mr-2" />
              {savingDraft ? "Saving..." : "Save Draft"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}