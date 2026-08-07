"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { getRemediationReportData } from "@/features/reports/services/reports";
import { AsyncContent } from "@/components/shared/AsyncContent";
import type { mockRemediationReportData } from "@/features/reports/mock/reports";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiGrid } from "@/components/layout/KpiGrid";
import { StatCard } from "@/components/shared/StatCard";
import { FilterBar } from "@/components/tables/FilterBar";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ChartPanel } from "@/components/shared/ChartPanel";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type RemediationReportData = typeof mockRemediationReportData;

type RemediationRow = {
  id: string;
  student: string;
  competency: string;
  faculty: string;
  date: string;
  status: string;
};

const statusVariant: Record<string, "success" | "warning" | "info" | "default"> = {
  Completed: "success",
  "In Progress": "warning",
  Scheduled: "info",
  Pending: "default",
};

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-medium">{payload[0].name}</p>
      <p className="text-muted-foreground">{payload[0].value} case(s)</p>
    </div>
  );
}

export default function RemediationReportPage() {
  const [data, setData] = useState<RemediationReportData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getRemediationReportData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load remediation report"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statusOptions = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.remediations.map((r) => r.status))].map((s) => ({ value: s, label: s }));
  }, [data]);

  const filteredRows: RemediationRow[] = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.remediations
      .filter((r) => (status ? r.status === status : true))
      .filter((r) =>
        q
          ? r.student.toLowerCase().includes(q) ||
            r.competency.toLowerCase().includes(q) ||
            r.faculty.toLowerCase().includes(q)
          : true
      );
  }, [data, search, status]);

  const clearFilters = () => {
    setSearch("");
    setStatus("");
  };

  const pieData = data
    ? [
        { name: "Scheduled", value: data.summary.scheduled, color: "var(--chart-3)" },
        { name: "In Progress", value: data.summary.inProgress, color: "var(--chart-4)" },
        { name: "Completed", value: data.summary.completed, color: "var(--chart-2)" },
        { name: "Pending", value: data.summary.pending, color: "var(--chart-5)" },
      ]
    : [];

  const columns: ColumnDef<AppTableFeatures, RemediationRow>[] = [
    { accessorKey: "student", header: "Student", cell: ({ row }) => <span className="font-medium">{row.getValue("student")}</span> },
    { accessorKey: "competency", header: "Competency" },
    { accessorKey: "faculty", header: "Faculty" },
    { accessorKey: "date", header: "Date" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge variant={statusVariant[row.getValue("status") as string] ?? "default"}>{(row.getValue("status") as string) || "—"}</StatusBadge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Remediation Report"
        description="Track remediation cases and progress"
      />

      <AsyncContent
        data={data ? [data] : []}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No report data available"
        emptyDescription="Unable to load remediation report data."
      >
        {([reportData]) => (
          <>
            <KpiGrid className="lg:grid-cols-5">
              <StatCard title="Total" value={reportData.summary.totalRemediations} icon={<AlertTriangle className="h-4 w-4" />} bare iconClassName="text-muted-foreground" />
              <StatCard title="Scheduled" value={reportData.summary.scheduled} icon={<Calendar className="h-4 w-4" />} bare iconClassName="text-blue-600" />
              <StatCard title="In Progress" value={reportData.summary.inProgress} icon={<Clock className="h-4 w-4" />} bare iconClassName="text-orange-600" />
              <StatCard title="Completed" value={reportData.summary.completed} icon={<CheckCircle className="h-4 w-4" />} bare iconClassName="text-green-600" />
              <StatCard title="Pending" value={reportData.summary.pending} icon={<XCircle className="h-4 w-4" />} bare iconClassName="text-red-600" />
            </KpiGrid>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Remediation Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <FilterBar
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search by student, competency, or faculty..."
                    statusFilter={status}
                    onStatusChange={setStatus}
                    statusOptions={statusOptions}
                    onClearFilters={clearFilters}
                  />
                  <DataTable columns={columns} data={filteredRows} />
                </CardContent>
              </Card>

              <ChartPanel title="Case Distribution" description="Remediation cases by status">
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
