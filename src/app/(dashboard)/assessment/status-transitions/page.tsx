import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertTriangle } from "lucide-react";
import { getStatusTransitions } from "@/features/assessment/services/assessment";

export default async function StatusTransitionsPage() {
  let transitions: Awaited<ReturnType<typeof getStatusTransitions>> = [];
  let error: string | null = null;
  try {
    transitions = await getStatusTransitions();
  } catch {
    error = "Failed to load status transitions.";
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Status Transitions" description="View assessment status transition history" />

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      ) : transitions.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No status transitions recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {transitions.map((transition) => (
            <Card key={transition.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {transition.entityId}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                      {transition.fromStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">→</span>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                      {transition.toStatus}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{transition.changedBy}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transition.changedAt).toLocaleString()}
                    </p>
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
