"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/layout/PageHeader";
import { Loader2, AlertTriangle, CheckCircle, AlertCircle, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  getMyAssessmentAttempts,
  acknowledgeAssessments,
  hasViewedFeedback,
} from "@/features/student/services/student";
import type { AssessmentAttempt } from "@/types";

export default function AcknowledgementPage() {
  const [acknowledged, setAcknowledged] = useState(false);
  const [signature, setSignature] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMyAssessmentAttempts();
      setAttempts(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load pending acknowledgements"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pendingAttempts = useMemo(
    () => attempts.filter((a) => a.status === "Submitted" && !a.studentAcknowledged),
    [attempts]
  );

  useEffect(() => {
    const validIds = new Set(pendingAttempts.map((a) => a.id));
    setSelectedIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [pendingAttempts]);

  const selectedAttempts = pendingAttempts.filter((a) => selectedIds.includes(a.id));
  const allSelected = pendingAttempts.length > 0 && selectedIds.length === pendingAttempts.length;
  const someSelected = selectedIds.length > 0 && !allSelected;
  const unviewedSelected = selectedAttempts.filter((a) => !hasViewedFeedback(a.assessmentId));
  const anyUnviewed = unviewedSelected.length > 0;

  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAll = () =>
    setSelectedIds(allSelected ? [] : pendingAttempts.map((a) => a.id));

  const canSubmit =
    selectedAttempts.length > 0 && acknowledged && signature.trim() !== "" && !anyUnviewed && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus("idle");
    if (selectedAttempts.length === 0) {
      setSubmitStatus("error");
      toast.error("Select at least one assessment to acknowledge");
      return;
    }
    if (!acknowledged || !signature.trim()) {
      setSubmitStatus("error");
      toast.error("Please check the box and enter your signature");
      return;
    }
    if (anyUnviewed) {
      setSubmitStatus("error");
      toast.error("Please review the feedback for all selected assessments first");
      return;
    }
    const selectedAssessmentIds = selectedAttempts.map((a) => a.assessmentId);
    setIsSubmitting(true);
    try {
      const updated = await acknowledgeAssessments(selectedAssessmentIds, signature);
      const acked = new Set(updated.map((u) => u.assessmentId));
      setAttempts((prev) =>
        prev.map((a) =>
          acked.has(a.assessmentId)
            ? {
                ...a,
                studentAcknowledged: true,
                studentSignature: signature,
                studentSignedAt: new Date().toISOString(),
                status: "Completed",
              }
            : a
        )
      );
      setSubmitStatus("success");
      setAcknowledged(false);
      setSignature("");
    } catch {
      setSubmitStatus("error");
      toast.error("Failed to submit acknowledgements. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading pending acknowledgements...</p>
          </CardContent>
        </Card>
      );
    }

    if (error) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button variant="outline" size="sm" onClick={fetchData}>
              Retry
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (pendingAttempts.length === 0) {
      return (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No pending acknowledgements. All feedback has been acknowledged.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Acknowledgements</CardTitle>
          <CardDescription>
            {pendingAttempts.length} assessment(s) awaiting your acknowledgement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <Checkbox
                id="select-all"
                checked={allSelected}
                indeterminate={someSelected}
                disabled={isSubmitting}
                onCheckedChange={toggleAll}
              />
              <Label htmlFor="select-all" className="text-sm font-medium">
                Select all
              </Label>
              <span className="ml-auto text-sm text-muted-foreground">
                {selectedIds.length} of {pendingAttempts.length} selected
              </span>
            </div>
            <ul className="divide-y">
              {pendingAttempts.map((a) => {
                const viewed = hasViewedFeedback(a.assessmentId);
                return (
                  <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                    <Checkbox
                      id={`attempt-${a.id}`}
                      checked={selectedIds.includes(a.id)}
                      disabled={isSubmitting}
                      onCheckedChange={() => toggle(a.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`attempt-${a.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        Attempt {a.attemptNumber} — {a.decision}
                      </label>
                      <p className="text-sm text-muted-foreground">Rating: {a.rating}</p>
                      {a.remarks && (
                        <p className="text-sm text-muted-foreground">Faculty remarks: {a.remarks}</p>
                      )}
                      {!viewed && (
                        <p className="mt-1 text-xs text-amber-600">
                          <Eye className="mr-1 inline h-3.5 w-3.5" />
                          Feedback not viewed yet
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {anyUnviewed && (
            <Alert>
              <Eye className="h-4 w-4" />
              <AlertDescription>
                You must read the faculty feedback before acknowledging{" "}
                {unviewedSelected.length === 1 ? "the selected assessment" : `${unviewedSelected.length} selected assessments`}.{" "}
                <Link href="/student/feedback" className="font-medium underline">
                  View feedback
                </Link>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="acknowledge"
                checked={acknowledged}
                disabled={anyUnviewed || isSubmitting || selectedAttempts.length === 0}
                onCheckedChange={(checked) => setAcknowledged(checked === true)}
              />
              <Label htmlFor="acknowledge" className={anyUnviewed ? "text-muted-foreground" : ""}>
                I confirm that I have reviewed the faculty feedback for all selected assessments
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature">Digital Signature</Label>
              <Input
                id="signature"
                placeholder="Enter your full name"
                value={signature}
                disabled={anyUnviewed || isSubmitting || selectedAttempts.length === 0}
                onChange={(e) => setSignature(e.target.value)}
              />
            </div>

            {submitStatus === "success" && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Acknowledgements submitted successfully</AlertDescription>
              </Alert>
            )}

            {submitStatus === "error" && anyUnviewed && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please review the faculty feedback first, then acknowledge.
                </AlertDescription>
              </Alert>
            )}

            {submitStatus === "error" && !anyUnviewed && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Please check the box and enter your signature</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : selectedAttempts.length > 1 ? (
                `Submit Acknowledgement (${selectedAttempts.length})`
              ) : (
                "Submit Acknowledgement"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Digital Acknowledgement"
        description="Confirm you have reviewed the faculty feedback"
      />
      {renderBody()}
    </div>
  );
}
