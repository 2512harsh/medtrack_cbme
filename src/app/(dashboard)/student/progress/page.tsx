"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/shared/StatCard";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { getProgress, getMyCompetencies } from "@/features/student/services/student";
import type { CompetencyAssignment } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";

type ProgressItem = {
  subject: string;
  completed: number;
  total: number;
};

export default function StudentProgressPage() {
  const [progress, setProgress] = useState<ProgressItem[] | undefined>(undefined);
  const [competencies, setCompetencies] = useState<CompetencyAssignment[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [progressData, compData] = await Promise.all([
        getProgress(),
        getMyCompetencies(),
      ]);
      setProgress(progressData);
      setCompetencies(compData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load progress"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
return (
    <div className="space-y-6">
      <PageHeader
        title="My Progress"
        description="Track your competency completion and remediation progress"
      />

      <AsyncContent
        data={progress}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No progress data"
        emptyDescription="Progress information is not available yet."
        loadingColumns={4}
      >
        {(items) => {
          const completed = items.reduce((sum, p) => sum + p.completed, 0);
          const total = items.reduce((sum, p) => sum + p.total, 0);
          return (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Overall Completion</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {total > 0 ? Math.round((completed / total) * 100) : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {completed} of {total} competencies completed
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Competencies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{competencies?.length ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Across all subjects</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Subjects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{items.length}</p>
                    <p className="text-sm text-muted-foreground">Active subjects</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Subject-wise Progress</CardTitle>
                  <CardDescription>Completion by subject</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((p) => (
                    <div key={p.subject}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{p.subject}</span>
                        <span className="text-sm text-muted-foreground">
                          {p.completed} / {p.total} ({Math.round((p.completed / p.total) * 100)}%)
                        </span>
                      </div>
                      <ProgressBar completed={p.completed} total={p.total} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          );
        }}
      </AsyncContent>
    </div>
  );
}