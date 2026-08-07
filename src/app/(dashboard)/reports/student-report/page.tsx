"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { getStudentReportData } from "@/features/reports/services/reports";
import { AsyncContent } from "@/components/shared/AsyncContent";
import type { mockStudentReportData } from "@/features/reports/mock/reports";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiGrid } from "@/components/layout/KpiGrid";
import { StatCard } from "@/components/shared/StatCard";
import { FilterBar } from "@/components/tables/FilterBar";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { ChartPanel } from "@/components/shared/ChartPanel";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type StudentReportData = typeof mockStudentReportData;

type StudentRow = {
  id: string;
  name: string;
  rollNumber: string;
  batch: string;
  completed: number;
  pending: number;
  remediation: number;
  overallProgress: number;
};

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">{payload[0].value}% overall progress</p>
    </div>
  );
}

export default function StudentReportPage() {
  const [data, setData] = useState<StudentReportData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getStudentReportData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load student report"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const batchOptions = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.students.map((s) => s.batch))].map((b) => ({ value: b, label: b }));
  }, [data]);

  const filteredRows: StudentRow[] = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.students
      .filter((s) => (batch ? s.batch === batch : true))
      .filter((s) =>
        q ? s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q) : true
      );
  }, [data, search, batch]);

  const clearFilters = () => {
    setSearch("");
    setBatch("");
  };

  const columns: ColumnDef<AppTableFeatures, StudentRow>[] = [
    { accessorKey: "name", header: "Student", cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span> },
    { accessorKey: "rollNumber", header: "Roll Number" },
    { accessorKey: "batch", header: "Batch" },
    { accessorKey: "completed", header: "Completed", cell: ({ row }) => <span className="text-green-600">{row.getValue("completed")}</span> },
    { accessorKey: "pending", header: "Pending", cell: ({ row }) => <span className="text-orange-600">{row.getValue("pending")}</span> },
    { accessorKey: "remediation", header: "Remediation", cell: ({ row }) => <span className="text-red-600">{row.getValue("remediation")}</span> },
    {
      accessorKey: "overallProgress",
      header: "Progress",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("overallProgress")}%</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Report"
        description="Overview of student progress and performance"
      />

      <AsyncContent
        data={data ? [data] : []}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No report data available"
        emptyDescription="Unable to load student report data."
      >
        {([reportData]) => (
          <>
            <KpiGrid>
              <StatCard title="Total Students" value={reportData.summary.totalStudents} icon={<Users className="h-4 w-4" />} bare iconClassName="text-muted-foreground" />
              <StatCard title="Completed" value={reportData.summary.completedAssessments} icon={<CheckCircle className="h-4 w-4" />} bare iconClassName="text-green-600" />
              <StatCard title="Pending" value={reportData.summary.pendingAssessments} icon={<Clock className="h-4 w-4" />} bare iconClassName="text-orange-600" />
              <StatCard title="Remediations" value={reportData.summary.remediationCases} icon={<AlertTriangle className="h-4 w-4" />} bare iconClassName="text-red-600" />
            </KpiGrid>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Student Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <FilterBar
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search by name or roll number..."
                    batchFilter={batch}
                    onBatchChange={setBatch}
                    batchOptions={batchOptions}
                    onClearFilters={clearFilters}
                  />
                  <DataTable columns={columns} data={filteredRows} />
                </CardContent>
              </Card>

              <ChartPanel
                title="Student Progress"
                description="Overall competency progress by student"
                className="lg:col-span-2"
              >
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={filteredRows} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} unit="%" />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
                    <Bar dataKey="overallProgress" name="Overall Progress" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartPanel>
            </div>
          </>
        )}
      </AsyncContent>
    </div>
  );
}
