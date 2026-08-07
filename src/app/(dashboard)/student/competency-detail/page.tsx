import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyCompetencies } from "@/features/student/services/student";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function CompetencyDetailPage() {
  const competencies = await getMyCompetencies();
  const competency = competencies[0];

  return (
    <div className="space-y-6">
      <PageHeader title="Competency Detail" description="View competency information" />

      <Card>
        <CardHeader>
          <CardTitle>
            {competency?.competency?.competencyCode} - {competency?.competency?.competencyTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="mt-1">{competency?.competency?.competencyDescription}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Level</p>
              <p className="mt-1">{competency?.competency?.competencyLevel}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Core Status</p>
              <p className="mt-1">{competency?.competency?.core ? "Core" : "Non-Core"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Batch</p>
              <p className="mt-1">{competency?.batch}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assigned By</p>
              <p className="mt-1">{competency?.assignedBy}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assigned Date</p>
              <p className="mt-1">{new Date(competency?.assignedDate ?? "").toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}