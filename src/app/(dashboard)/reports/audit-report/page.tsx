"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, CheckCircle, Users } from "lucide-react";
import { getAuditReportData } from "@/features/reports/services/reports";
import { AsyncContent } from "@/components/shared/AsyncContent";
import type { mockAuditReportData } from "@/features/reports/mock/reports";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiGrid } from "@/components/layout/KpiGrid";
import { StatCard } from "@/components/shared/StatCard";
import { FilterBar } from "@/components/tables/FilterBar";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { ChartPanel } from "@/components/shared/ChartPanel";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type AuditReportData = typeof mockAuditReportData;

type ActivityRow = {
  action: string;
  count: number;
  lastActivity: string;
};

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">{payload[0].value} action(s)</p>
    </div>
  );
}

export default function AuditReportPage() {
  const [data, setData] = useState<AuditReportData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAuditReportData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load audit report"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRows: ActivityRow[] = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.recentActivity.filter((a) => (q ? a.action.toLowerCase().includes(q) : true));
  }, [data, search]);

  const columns: ColumnDef<AppTableFeatures, ActivityRow>[] = [
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => <span className="font-medium">{(row.getValue("action") as string).replace(/_/g, " ")}</span>,
    },
    { accessorKey: "count", header: "Count", cell: ({ row }) => <span className="text-lg font-bold">{row.getValue("count")}</span> },
    { accessorKey: "lastActivity", header: "Last Activity", cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("lastActivity")}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Report"
        description="View audit-relevant activity and actions"
      />

      <AsyncContent
        data={data ? [data] : []}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No report data available"
        emptyDescription="Unable to load audit report data."
      >
        {([reportData]) => (
          <>
            <KpiGrid>
              <StatCard title="Total Actions" value={reportData.summary.totalActions} icon={<Shield className="h-4 w-4" />} bare iconClassName="text-muted-foreground" />
              <StatCard title="Submissions" value={reportData.summary.submissions} icon={<FileText className="h-4 w-4" />} bare iconClassName="text-blue-600" />
              <StatCard title="Acknowledgements" value={reportData.summary.acknowledgements} icon={<CheckCircle className="h-4 w-4" />} bare iconClassName="text-green-600" />
              <StatCard title="Assignments" value={reportData.summary.assignments} icon={<Users className="h-4 w-4" />} bare iconClassName="text-purple-600" />
            </KpiGrid>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <FilterBar
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search actions..."
                    onClearFilters={() => setSearch("")}
                  />
                  <DataTable columns={columns} data={filteredRows} />
                </CardContent>
              </Card>

              <ChartPanel title="Action Counts" description="Volume of audit actions">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={filteredRows} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="action" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
                    <Bar dataKey="count" name="Count" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
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
