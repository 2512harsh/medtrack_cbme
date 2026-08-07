import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertTriangle } from "lucide-react";
import { getRemediationWorkflow } from "@/features/assessment/services/assessment";

export default async function RemediationWorkflowPage() {
  let remediations: Awaited<ReturnType<typeof getRemediationWorkflow>> = [];
  let error: string | null = null;
  try {
    remediations = await getRemediationWorkflow();
  } catch {
    error = "Failed to load remediation workflow.";
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Remediation Workflow" description="Track remediation paths for students" />

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      ) : remediations.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No remediation cases yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {remediations.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-lg">{item.competencyCode} - {item.competencyTitle}</CardTitle>
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
                    <p className="font-medium">{item.remediationDate}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.status === "Completed" ? "bg-green-100 text-green-700" :
                      item.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                      item.status === "Scheduled" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>{item.status}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
