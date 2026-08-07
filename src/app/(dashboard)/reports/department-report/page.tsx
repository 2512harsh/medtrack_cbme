"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, GraduationCap } from "lucide-react";
import { getDepartmentReportData } from "@/features/reports/services/reports";
import { AsyncContent } from "@/components/shared/AsyncContent";
import type { mockDepartmentReportData } from "@/features/reports/mock/reports";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiGrid } from "@/components/layout/KpiGrid";
import { StatCard } from "@/components/shared/StatCard";
import { FilterBar } from "@/components/tables/FilterBar";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { ChartPanel } from "@/components/shared/ChartPanel";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type DepartmentReportData = typeof mockDepartmentReportData;

type DepartmentRow = {
  id: string;
  name: string;
  faculty: number;
  students: number;
  completed: number;
  total: number;
  progress: number;
};

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">{payload[0].value}% completion</p>
    </div>
  );
}

export default function DepartmentReportPage() {
  const [data, setData] = useState<DepartmentReportData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDepartmentReportData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load department report"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRows: DepartmentRow[] = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.departments.filter((d) => (q ? d.name.toLowerCase().includes(q) : true));
  }, [data, search]);

  const columns: ColumnDef<AppTableFeatures, DepartmentRow>[] = [
    { accessorKey: "name", header: "Department", cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span> },
    { accessorKey: "faculty", header: "Faculty" },
    { accessorKey: "students", header: "Students" },
    {
      accessorKey: "completed",
      header: "Completed",
      cell: ({ row }) => <span className="text-green-600">{row.getValue("completed")}</span>,
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("total")}</span>,
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const progress = row.getValue("progress") as number;
        return (
          <div className="flex items-center gap-2 min-w-[140px]">
            <div className="h-2 bg-muted rounded-full overflow-hidden flex-1">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-sm font-medium w-9 text-right">{progress}%</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Report"
        description="Overview of department performance"
      />

      <AsyncContent
        data={data ? [data] : []}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No report data available"
        emptyDescription="Unable to load department report data."
      >
        {([reportData]) => (
          <>
            <KpiGrid>
              <StatCard title="Departments" value={reportData.summary.totalDepartments} icon={<Building2 className="h-4 w-4" />} bare iconClassName="text-muted-foreground" />
              <StatCard title="Faculty" value={reportData.summary.totalFaculty} icon={<GraduationCap className="h-4 w-4" />} bare iconClassName="text-muted-foreground" />
              <StatCard title="Students" value={reportData.summary.totalStudents} icon={<Users className="h-4 w-4" />} bare iconClassName="text-muted-foreground" />
              <StatCard title="Completion" value={`${reportData.summary.overallCompletion}%`} icon={<Building2 className="h-4 w-4" />} bare iconClassName="text-green-600" />
            </KpiGrid>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Department Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <FilterBar
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search departments..."
                    onClearFilters={() => setSearch("")}
                  />
                  <DataTable columns={columns} data={filteredRows} />
                </CardContent>
              </Card>

              <ChartPanel
                title="Completion by Department"
                description="Competency completion rate per department"
                className="lg:col-span-2"
              >
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={filteredRows} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} unit="%" />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
                    <Bar dataKey="progress" name="Completion" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
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
