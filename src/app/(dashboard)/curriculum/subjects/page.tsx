"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getSubjects, getProfessionalYears } from "@/features/curriculum/services/curriculum";
import { getDepartments } from "@/features/super-admin/services/superAdmin";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BookOpen } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { Subject, ProfessionalYear, Department } from "@/types";

type SubjectRow = {
  id: string;
  name: string;
  code: string;
  professionalYear: string;
  professionalYearId: string;
  departmentId: string;
  topicCount: number;
  competencyCount: number;
};

const columns: ColumnDef<AppTableFeatures, SubjectRow>[] = [
  {
    accessorKey: "name",
    header: "Subject",
    cell: ({ row }) => (
      <Link
        href={`/curriculum/subjects/${row.original.id}`}
        className="flex items-center gap-2 font-medium text-primary hover:underline"
      >
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span>{row.getValue("name")}</span>
      </Link>
    ),
  },
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => (
      <span className="text-sm font-mono text-muted-foreground">{row.getValue("code")}</span>
    ),
  },
  {
    accessorKey: "professionalYear",
    header: "Professional Year",
  },
  {
    accessorKey: "topicCount",
    header: "Topics",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("topicCount")}</span>
    ),
  },
  {
    accessorKey: "competencyCount",
    header: "Competencies",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("competencyCount")}</span>
    ),
  },
];

export default function SubjectsPage() {
  const [data, setData] = useState<SubjectRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [professionalYears, setProfessionalYears] = useState<ProfessionalYear[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subjects, years, depts] = await Promise.all([
        getSubjects(),
        getProfessionalYears(),
        getDepartments(),
      ]);
      setProfessionalYears(years);
      setDepartments(depts);
      const yearName = (id: string) => years.find((y) => y.id === id)?.name ?? "Unknown Year";
      const countBySubject = (subjectId: string, target: "topics" | "competencies") => {
        // Mock counts kept simple; derived deterministically per subject.
        const base = parseInt(subjectId.replace(/\D/g, ""), 10) || 1;
        return target === "topics" ? ((base % 4) + 2) : ((base % 5) + 3);
      };
      setData(
        subjects.map((s: Subject) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          professionalYear: yearName(s.professionalYearId),
          professionalYearId: s.professionalYearId,
          departmentId: s.departmentId,
          topicCount: countBySubject(s.id, "topics"),
          competencyCount: countBySubject(s.id, "competencies"),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load subjects"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRows = useMemo(() => {
    if (!data) return undefined;
    return data.filter((row) => {
      if (yearFilter !== "all" && row.professionalYearId !== yearFilter) return false;
      if (departmentFilter !== "all" && row.departmentId !== departmentFilter) return false;
      return true;
    });
  }, [data, yearFilter, departmentFilter]);

  return (
    <div className="space-y-6">
      <PageHeader title="Subjects" description="Manage subjects within professional years" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1.5 w-full sm:w-64">
          <Label htmlFor="year-filter">Professional Year</Label>
          <Select value={yearFilter} onValueChange={(v) => setYearFilter(v ?? "all")}>
            <SelectTrigger className="w-full" id="year-filter">
              <SelectValue placeholder="All years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {professionalYears.map((y) => (
                <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 w-full sm:w-64">
          <Label htmlFor="department-filter">Department</Label>
          <Select value={departmentFilter} onValueChange={(v) => setDepartmentFilter(v ?? "all")}>
            <SelectTrigger className="w-full" id="department-filter">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <AsyncContent
        data={filteredRows}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No subjects found"
        emptyDescription="No subjects match the selected filters."
        loadingColumns={5}
      >
        {(subjects) => (
          <DataTable
            columns={columns}
            data={subjects}
            searchPlaceholder="Search subjects..."
          />
        )}
      </AsyncContent>
    </div>
  );
}
