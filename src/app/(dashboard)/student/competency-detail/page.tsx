"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyCompetencies } from "@/features/student/services/student";
import { PageHeader } from "@/components/layout/PageHeader";
import { AsyncContent } from "@/components/shared/AsyncContent";
import type { CompetencyAssignment } from "@/types";

export default function CompetencyDetailPage() {
  const [competency, setCompetency] = useState<CompetencyAssignment | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const competencies = await getMyCompetencies();
      setCompetency(competencies[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load competency"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Competency Detail" description="View competency information" />

      <AsyncContent
        data={competency === undefined ? undefined : [competency]}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No competencies assigned"
        emptyDescription="You don't have any competencies assigned yet."
        loadingColumns={2}
      >
        {([comp]) => (
          <Card>
            <CardHeader>
              <CardTitle>
                {comp?.competency?.competencyCode} - {comp?.competency?.competencyTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="mt-1">{comp?.competency?.competencyDescription}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Level</p>
                  <p className="mt-1">{comp?.competency?.competencyLevel}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Core Status</p>
                  <p className="mt-1">{comp?.competency?.core ? "Core" : "Non-Core"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Batch</p>
                  <p className="mt-1">{comp?.batch}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assigned By</p>
                  <p className="mt-1">{comp?.assignedBy}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assigned Date</p>
                  <p className="mt-1">{new Date(comp?.assignedDate ?? "").toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </AsyncContent>
    </div>
  );
}
