"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle, Clock, XCircle } from "lucide-react";
import { getCompetencyCompletionData } from "@/features/reports/services/reports";
import { AsyncContent } from "@/components/shared/AsyncContent";
import type { mockCompetencyCompletionData } from "@/features/reports/mock/reports";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiGrid } from "@/components/layout/KpiGrid";
import { StatCard } from "@/components/shared/StatCard";
import { FilterBar } from "@/components/tables/FilterBar";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ChartPanel } from "@/components/shared/ChartPanel";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type CompetencyCompletionData = typeof mockCompetencyCompletionData;

type CompetencyRow = {
  code: string;
  title: string;
  subject: string;
  status: string;
  attempts: number;
};

const statusVariant: Record<string, "success" | "warning" | "gray"> = {
  Completed: "success",
  "In Progress": "warning",
  "Not Started": "gray",
};

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-medium">{payload[0].name}</p>
      <p className="text-muted-foreground">{payload[0].value} competencies</p>
    </div>
  );
}

export default function CompetencyCompletionPage() {
  const [data, setData] = useState<CompetencyCompletionData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getCompetencyCompletionData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load competency completion report"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const subjectOptions = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.competencies.map((c) => c.subject))].map((s) => ({ value: s, label: s }));
  }, [data]);

  const statusOptions = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.competencies.map((c) => c.status))].map((s) => ({ value: s, label: s }));
  }, [data]);

  const filteredRows: CompetencyRow[] = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.competencies
      .filter((c) => (subject ? c.subject === subject : true))
      .filter((c) => (status ? c.status === status : true))
      .filter((c) =>
        q ? c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) : true
      );
  }, [data, search, subject, status]);

  const clearFilters = () => {
    setSearch("");
    setSubject("");
    setStatus("");
  };

  const pieData = data
    ? [
        { name: "Completed", value: data.summary.completed, color: "var(--chart-2)" },
        { name: "In Progress", value: data.summary.inProgress, color: "var(--chart-4)" },
        { name: "Not Started", value: data.summary.notStarted, color: "var(--chart-5)" },
      ]
    : [];

  const columns: ColumnDef<AppTableFeatures, CompetencyRow>[] = [
    { accessorKey: "code", header: "Code", cell: ({ row }) => <span className="font-medium">{row.getValue("code")}</span> },
    { accessorKey: "title", header: "Competency" },
    { accessorKey: "subject", header: "Subject" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge variant={statusVariant[row.getValue("status") as string] ?? "gray"}>{(row.getValue("status") as string) || "—"}</StatusBadge>,
    },
    { accessorKey: "attempts", header: "Attempts" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competency Completion Report"
        description="Track competency completion across subjects"
      />

      <AsyncContent
        data={data ? [data] : []}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No report data available"
        emptyDescription="Unable to load competency completion data."
      >
        {([reportData]) => (
          <>
            <KpiGrid>
              <StatCard title="Total" value={reportData.summary.totalCompetencies} icon={<BookOpen className="h-4 w-4" />} bare iconClassName="text-muted-foreground" />
              <StatCard title="Completed" value={reportData.summary.completed} icon={<CheckCircle className="h-4 w-4" />} bare iconClassName="text-green-600" />
              <StatCard title="In Progress" value={reportData.summary.inProgress} icon={<Clock className="h-4 w-4" />} bare iconClassName="text-orange-600" />
              <StatCard title="Not Started" value={reportData.summary.notStarted} icon={<XCircle className="h-4 w-4" />} bare iconClassName="text-gray-600" />
            </KpiGrid>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Completion by Subject</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.bySubject.map((subjectItem) => (
                      <div key={subjectItem.subject}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{subjectItem.subject}</span>
                          <span className="text-muted-foreground">{subjectItem.completed}/{subjectItem.total} ({subjectItem.rate}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${subjectItem.rate}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Competency Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <FilterBar
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search by code or title..."
                    subjectFilter={subject}
                    onSubjectChange={setSubject}
                    subjectOptions={subjectOptions}
                    statusFilter={status}
                    onStatusChange={setStatus}
                    statusOptions={statusOptions}
                    onClearFilters={clearFilters}
                  />
                  <DataTable columns={columns} data={filteredRows} />
                </CardContent>
              </Card>

              <ChartPanel title="Status Distribution" description="Competencies by completion status">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartPanel>
            </div>
          </>
        )}
      </AsyncContent>
    </div>
  );
}
