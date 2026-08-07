"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CheckCircle, Eye, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getMyAssessmentAttempts, markFeedbackViewed } from "@/features/student/services/student";
import { PageHeader } from "@/components/layout/PageHeader";
import type { AssessmentAttempt } from "@/types";

function hasViewedLocal(assessmentId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("medtrack_feedback_viewed");
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    return ids.includes(assessmentId);
  } catch {
    return false;
  }
}

export default function FeedbackViewPage() {
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMyAssessmentAttempts();
      setAttempts(data);
      setViewedIds(
        new Set(data.filter((a) => a.assessmentId && hasViewedLocal(a.assessmentId)).map((a) => a.assessmentId))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load feedback"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkViewed = async (assessmentId: string) => {
    setMarkingId(assessmentId);
    try {
      await markFeedbackViewed(assessmentId);
      setViewedIds((prev) => new Set(prev).add(assessmentId));
      toast.success("Feedback marked as reviewed");
    } catch {
      toast.error("Failed to mark feedback as reviewed");
    } finally {
      setMarkingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Feedback View" description="Review faculty feedback on your assessments" />
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading feedback...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Feedback View" description="Review faculty feedback on your assessments" />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button variant="outline" size="sm" onClick={fetchData}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Feedback View" description="Review faculty feedback on your assessments" />

      {attempts.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No feedback available yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => {
            const viewed = attempt.assessmentId ? viewedIds.has(attempt.assessmentId) : false;
            return (
              <Card key={attempt.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-lg">Assessment - Attempt {attempt.attemptNumber}</CardTitle>
                  {viewed && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      <CheckCircle className="h-3.5 w-3.5" /> Reviewed
                    </span>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Rating</p>
                      <p className="mt-1 text-lg font-semibold">{attempt.rating}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Decision</p>
                      <p className={`mt-1 font-medium ${
                        attempt.decision === "Exceeds Expectations" ? "text-blue-600" :
                        attempt.decision === "Meets Expectations" ? "text-green-600" : "text-red-600"
                      }`}>{attempt.decision}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Remarks</p>
                    <p className="mt-1">{attempt.remarks}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Faculty Signature</p>
                      <p className="mt-1">{attempt.facultySignature}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(attempt.facultySignedAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Student Signature</p>
                      {attempt.studentSignature ? (
                        <>
                          <p className="mt-1">{attempt.studentSignature}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {attempt.studentSignedAt ? new Date(attempt.studentSignedAt).toLocaleString() : ""}
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 text-sm text-muted-foreground">Not signed yet</p>
                      )}
                    </div>
                  </div>
                  {attempt.assessmentId && !attempt.studentAcknowledged && (
                    <div className="flex flex-wrap items-center gap-3">
                      {viewed ? (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Feedback reviewed. You can now acknowledge this assessment.
                          </p>
                          <Link href="/student/acknowledgement">
                            <Button variant="outline" size="sm">
                              Go to acknowledgement
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={markingId === attempt.assessmentId}
                          onClick={() => handleMarkViewed(attempt.assessmentId)}
                        >
                          {markingId === attempt.assessmentId ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4 mr-2" />
                          )}
                          I&apos;ve read this feedback
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
