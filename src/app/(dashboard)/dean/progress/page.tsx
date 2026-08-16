"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDepartmentById, getDepartmentProgress, getDepartmentWiseProgress } from "@/features/dean/services/dean";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { useAuth } from "@/features/authentication/hooks/useAuth";

interface ProgressItem {
  label: string;
  completed: number;
  total: number;
}

function ProgressBar({ completed, total, color }: { completed: number; total: number; color: string }) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{completed}/{total} competencies</span>
        <span className="text-muted-foreground">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percentage}%`,
            backgroundColor: `var(--${color})`,
          }}
        />
      </div>
    </div>
  );
}

export default function DepartmentProgressPage() {
  const { user } = useAuth();
  const departmentId = user?.departmentId;
  const isDean = user?.role !== "HOD";
  const [progress, setProgress] = useState<ProgressItem[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isDean) {
        const department = departmentId ? await getDepartmentById(departmentId) : undefined;
        const data = await getDepartmentWiseProgress(department?.institutionId);
        setProgress(data.map((d) => ({ label: d.department, completed: d.completed, total: d.total })));
      } else {
        const data = await getDepartmentProgress(departmentId);
        setProgress(data.map((s) => ({ label: s.subject, completed: s.completed, total: s.total })));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load department progress"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Progress"
        description={isDean ? "Track competency completion across departments" : "Track competency completion across subjects"}
      />

      <AsyncContent
        data={progress}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No progress data available"
        emptyDescription="No department progress data is available yet."
      >
        {(items) => (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>{item.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProgressBar
                    completed={item.completed}
                    total={item.total}
                    color={i === 0 ? "blue" : i === 1 ? "green" : "purple"}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </AsyncContent>
    </div>
  );
}
