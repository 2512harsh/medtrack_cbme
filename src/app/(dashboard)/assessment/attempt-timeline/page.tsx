"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertTriangle } from "lucide-react";
import { getAssessmentAttempts } from "@/features/faculty/services/faculty";

export default function AttemptTimelinePage() {
  const [attempts, setAttempts] = useState<Awaited<ReturnType<typeof getAssessmentAttempts>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        setAttempts(await getAssessmentAttempts());
      } catch {
        setError("Failed to load the attempt timeline.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Attempt Timeline" description="View the timeline of assessment attempts" />

      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      ) : attempts.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No assessment attempts yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt, index) => (
            <div key={attempt.id} className="relative pl-8 pb-4">
              {index < attempts.length - 1 && (
                <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-border" />
              )}
              <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{attempt.attemptNumber}</span>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Attempt {attempt.attemptNumber} - {attempt.status}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Rating</p>
                      <p className="font-semibold">{attempt.rating}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Decision</p>
                      <p className={`font-medium ${
                        attempt.decision === "Exceeds Expectations" ? "text-blue-600" :
                        attempt.decision === "Meets Expectations" ? "text-green-600" : "text-red-600"
                      }`}>{attempt.decision}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date</p>
                      <p className="text-sm">{new Date(attempt.facultySignedAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Remarks</p>
                    <p className="text-sm">{attempt.remarks}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Signed by: {attempt.facultySignature}</span>
                    {attempt.studentAcknowledged && (
                      <span className="text-green-600">Acknowledged by student</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
