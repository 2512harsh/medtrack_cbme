"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { getSubjects, getProfessionalYears, getCurriculumDepartments, getTopics, getSubtopics, getCompetencies, createSubject, updateSubject } from "@/features/curriculum/services/curriculum";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BookOpen, Edit, Plus } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { toast } from "sonner";
import {
  SubjectFormDialog,
  type SubjectFormValues,
} from "@/features/curriculum/components/SubjectFormDialog";
import type { Subject, ProfessionalYear, Department, Topic, Subtopic, Competency } from "@/types";

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

export default function SubjectsPage() {
  const { user } = useAuth();
  const lockedDepartmentId = user?.role === "HOD" ? user.departmentId : undefined;
  const [data, setData] = useState<SubjectRow[] | undefined>(undefined);
  const [subjectList, setSubjectList] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [professionalYears, setProfessionalYears] = useState<ProfessionalYear[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const toRows = (
    subjects: Subject[],
    years: ProfessionalYear[],
    topics: Topic[],
    subtopics: Subtopic[],
    competencies: Competency[]
  ): SubjectRow[] => {
    const yearName = (id: string) => years.find((y) => y.id === id)?.name ?? "Unknown Year";
    return subjects.map((s) => {
      const subjectTopicIds = new Set(topics.filter((t) => t.subjectId === s.id).map((t) => t.id));
      const subjectSubtopicIds = new Set(subtopics.filter((st) => subjectTopicIds.has(st.topicId)).map((st) => st.id));
      return {
        id: s.id,
        name: s.name,
        code: s.code,
        professionalYear: yearName(s.professionalYearId),
        professionalYearId: s.professionalYearId,
        departmentId: s.departmentId,
        topicCount: subjectTopicIds.size,
        competencyCount: competencies.filter((c) => subjectSubtopicIds.has(c.subtopicId)).length,
      };
    });
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subjects, years, depts, topics, subtopics, competencies] = await Promise.all([
        getSubjects(),
        getProfessionalYears(),
        getCurriculumDepartments(),
        getTopics(),
        getSubtopics(),
        getCompetencies(),
      ]);
      setProfessionalYears(years);
      setDepartments(depts);
      setSubjectList(subjects);
      setData(toRows(subjects, years, topics, subtopics, competencies));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load subjects"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshList = async () => {
    const [subjects, topics, subtopics, competencies] = await Promise.all([
      getSubjects(),
      getTopics(),
      getSubtopics(),
      getCompetencies(),
    ]);
    setSubjectList(subjects);
    setData(toRows(subjects, professionalYears, topics, subtopics, competencies));
  };

  const openCreate = () => {
    setEditingSubject(null);
    setFormOpen(true);
  };

  const openEdit = (subjectId: string) => {
    const target = subjectList.find((s) => s.id === subjectId);
    if (!target) return;
    setEditingSubject(target);
    setFormOpen(true);
  };

  const handleSave = async (values: SubjectFormValues) => {
    setIsSaving(true);
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, values);
        toast.success("Subject updated successfully");
      } else {
        await createSubject(values);
        toast.success("Subject added successfully");
      }
      setFormOpen(false);
      await refreshList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save subject");
    } finally {
      setIsSaving(false);
    }
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
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(row.original.id)}>
          <Edit className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const filteredRows = useMemo(() => {
    if (!data) return undefined;
    // HOD's data is already department-scoped server-side, so the
    // department filter would only ever be a no-op or an empty result for
    // them — apply it only when the caller isn't locked to one department.
    const effectiveDepartmentFilter = lockedDepartmentId ?? departmentFilter;
    return data.filter((row) => {
      if (yearFilter !== "all" && row.professionalYearId !== yearFilter) return false;
      if (effectiveDepartmentFilter !== "all" && row.departmentId !== effectiveDepartmentFilter) return false;
      return true;
    });
  }, [data, yearFilter, departmentFilter, lockedDepartmentId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        description="Manage subjects within professional years"
        dataSource="live"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </Button>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1.5 w-full sm:w-64">
          <Label htmlFor="year-filter">Professional Year</Label>
          <Select
            items={[{ value: "all", label: "All years" }, ...professionalYears.map((y) => ({ value: y.id, label: y.name }))]}
            value={yearFilter}
            onValueChange={(v) => setYearFilter(v ?? "all")}
          >
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

        {!lockedDepartmentId && (
        <div className="space-y-1.5 w-full sm:w-64">
          <Label htmlFor="department-filter">Department</Label>
          <Select
            items={[{ value: "all", label: "All departments" }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
            value={departmentFilter}
            onValueChange={(v) => setDepartmentFilter(v ?? "all")}
          >
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
        )}
      </div>

      <AsyncContent
        data={filteredRows}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No subjects found"
        emptyDescription="No subjects match the selected filters."
        loadingColumns={6}
      >
        {(subjects) => (
          <DataTable
            columns={columns}
            data={subjects}
            searchPlaceholder="Search subjects..."
          />
        )}
      </AsyncContent>

      <SubjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        subject={editingSubject}
        professionalYears={professionalYears}
        departments={departments}
        isSaving={isSaving}
        onSave={handleSave}
        lockedDepartmentId={lockedDepartmentId}
      />
    </div>
  );
}
