"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, GraduationCap } from "lucide-react";
import { getDepartmentReport, type DepartmentReportRow } from "@/features/dean/services/dean";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiGrid } from "@/components/layout/KpiGrid";
import { StatCard } from "@/components/shared/StatCard";
import { FilterBar } from "@/components/tables/FilterBar";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";

type DepartmentReportData = Awaited<ReturnType<typeof getDepartmentReport>>;
type DepartmentRow = DepartmentReportRow;

export default function DepartmentReportPage() {
  const [data, setData] = useState<DepartmentReportData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Faculty/students/assignments underneath are already scoped server-side
      // (Dean -> own institution, HOD -> own department), so an HOD here
      // naturally only ever sees their own department's row.
      const result = await getDepartmentReport();
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
        dataSource="live"
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
            </KpiGrid>

            <Card>
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
          </>
        )}
      </AsyncContent>
    </div>
  );
}
