"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, CheckCircle, Clock, Star } from "lucide-react";
import { getFacultyReportData } from "@/features/reports/services/reports";
import { AsyncContent } from "@/components/shared/AsyncContent";
import type { FacultyReportData } from "@/features/reports/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiGrid } from "@/components/layout/KpiGrid";
import { StatCard } from "@/components/shared/StatCard";
import { FilterBar } from "@/components/tables/FilterBar";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { ChartPanel } from "@/components/shared/ChartPanel";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type FacultyRow = {
  id: string;
  name: string;
  designation: string;
  department: string;
  assessments: number;
  completed: number;
  pending: number;
  percentExceeds: number;
};

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-muted-foreground">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function FacultyReportPage() {
  const [data, setData] = useState<FacultyReportData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getFacultyReportData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load faculty report"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const departmentOptions = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.faculty.map((f) => f.department).filter(Boolean))].map((d) => ({ value: d, label: d }));
  }, [data]);

  const filteredRows: FacultyRow[] = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.faculty
      .filter((f) => (department ? f.department === department : true))
      .filter((f) =>
        q ? f.name.toLowerCase().includes(q) || f.designation.toLowerCase().includes(q) : true
      );
  }, [data, search, department]);

  const clearFilters = () => {
    setSearch("");
    setDepartment("");
  };

  const avgPercentExceeds = useMemo(() => {
    if (!data) return 0;
    const rated = data.faculty.filter((f) => f.assessments > 0);
    if (rated.length === 0) return 0;
    return Math.round(rated.reduce((sum, f) => sum + f.percentExceeds, 0) / rated.length);
  }, [data]);

  const columns: ColumnDef<AppTableFeatures, FacultyRow>[] = [
    { accessorKey: "name", header: "Faculty", cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span> },
    { accessorKey: "designation", header: "Designation" },
    { accessorKey: "department", header: "Department" },
    { accessorKey: "assessments", header: "Assessments", cell: ({ row }) => <span className="text-blue-600">{row.getValue("assessments")}</span> },
    { accessorKey: "completed", header: "Completed", cell: ({ row }) => <span className="text-green-600">{row.getValue("completed")}</span> },
    { accessorKey: "pending", header: "Pending", cell: ({ row }) => <span className="text-orange-600">{row.getValue("pending")}</span> },
    {
      accessorKey: "percentExceeds",
      header: "% Exceeds Expectations",
      cell: ({ row }) => {
        const value = row.getValue("percentExceeds") as number;
        return <span className="text-yellow-600">{value}%</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Report"
        description="Overview of faculty assessment activity"
      />

      <AsyncContent
        data={data ? [data] : []}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No report data available"
        emptyDescription="Unable to load faculty report data."
      >
        {([reportData]) => (
          <>
            <KpiGrid>
              <StatCard title="Total Faculty" value={reportData.summary.totalFaculty} icon={<GraduationCap className="h-4 w-4" />} bare iconClassName="text-muted-foreground" />
              <StatCard title="Completed Reviews" value={reportData.summary.completedReviews} icon={<CheckCircle className="h-4 w-4" />} bare iconClassName="text-green-600" />
              <StatCard title="Pending Reviews" value={reportData.summary.pendingReviews} icon={<Clock className="h-4 w-4" />} bare iconClassName="text-orange-600" />
              <StatCard title="Avg % Exceeds Expectations" value={`${avgPercentExceeds}%`} icon={<Star className="h-4 w-4" />} bare iconClassName="text-yellow-600" />
            </KpiGrid>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Faculty Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <FilterBar
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search by name or designation..."
                    departmentFilter={department}
                    onDepartmentChange={setDepartment}
                    departmentOptions={departmentOptions}
                    onClearFilters={clearFilters}
                  />
                  <DataTable columns={columns} data={filteredRows} />
                </CardContent>
              </Card>

              <ChartPanel
                title="Assessment Activity"
                description="Completed and pending assessments by faculty"
                className="lg:col-span-2"
              >
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={filteredRows} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="completed" name="Completed" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" name="Pending" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
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
