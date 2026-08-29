"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { getRemediationWorkflow } from "@/features/assessment/services/assessment";
import { AsyncContent } from "@/components/shared/AsyncContent";
import type { RemediationWorkflowCase } from "@/features/assessment/types";

export default function RemediationWorkflowPage() {
  const [remediations, setRemediations] = useState<RemediationWorkflowCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getRemediationWorkflow();
      setRemediations(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load remediation workflow"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Remediation Workflow" description="Track remediation paths for students" />

      <AsyncContent
        data={remediations}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No remediation cases yet"
        emptyDescription="Remediation cases will appear here once an assessment attempt is marked Needs Remediation."
      >
        {(items) => (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {item.competencyCode} - {item.competencyTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Student</p>
                      <p className="font-medium">{item.studentName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Faculty</p>
                      <p className="font-medium">{item.facultyName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Original Decision</p>
                      <p className="font-medium text-red-600">{item.originalDecision}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Attempt</p>
                      <p className="font-medium">Attempt {item.originalAttempt}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Remediation Date</p>
                      <p className="font-medium">{new Date(item.remediationDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          item.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : item.status === "In Progress"
                              ? "bg-blue-100 text-blue-700"
                              : item.status === "Scheduled"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </AsyncContent>
    </div>
  );
}
