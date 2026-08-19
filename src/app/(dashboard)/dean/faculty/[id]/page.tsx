"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ProgressBar } from "@/components/shared/StatCard";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { ChevronRight, Mail, Briefcase, BookOpen, Users, Award } from "lucide-react";
import {
  getFacultyById,
  getCompetencyAssignments,
  getStudentAllocations,
} from "@/features/dean/services/dean";
import type { Faculty, CompetencyAssignment, StudentAllocation } from "@/types";

export default function FacultyDetailPage() {
  const params = useParams();
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [assignments, setAssignments] = useState<CompetencyAssignment[] | undefined>(undefined);
  const [allocations, setAllocations] = useState<StudentAllocation[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const found = await getFacultyById(String(params.id));
      setFaculty(found || null);
      if (found) {
        const [compData, allocData] = await Promise.all([
          getCompetencyAssignments(),
          getStudentAllocations(),
        ]);
        setAssignments(compData.filter((a) => a.facultyId === found.id));
        setAllocations(allocData.filter((a) => a.facultyId === found.id));
      } else {
        setAssignments([]);
        setAllocations([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load faculty details"));
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Unable to load faculty details. Please try again.</p>
        <button onClick={fetchData} className="mt-4 text-primary hover:underline">
          Try Again
        </button>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium">Faculty not found</p>
        <p className="text-sm text-muted-foreground mt-2">The requested faculty member could not be found.</p>
        <Link href="/dean/faculty" className="mt-4 text-primary hover:underline">
          Back to Faculty Management
        </Link>
      </div>
    );
  }

  const fullName = faculty.user ? `${faculty.user.firstName} ${faculty.user.lastName}` : "Unknown";

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dean/faculty" className="hover:text-foreground">Faculty Management</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{fullName}</span>
        </div>
        <PageHeader
          className="mt-2"
          title={fullName}
          description={`${faculty.designation} • ${faculty.employeeCode}`}
          actions={
            faculty.user && (
              <StatusBadge variant={faculty.user.status === "ACTIVE" ? "success" : "gray"}>
                {faculty.user.status}
              </StatusBadge>
            )
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{faculty.user?.email ?? "N/A"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Specialization</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{faculty.specialization ?? "General"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Competencies</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{assignments?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allocated Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{allocations?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Competencies</CardTitle>
          <CardDescription>Competency templates assigned to this faculty member</CardDescription>
        </CardHeader>
        <CardContent>
          <AsyncContent
            data={assignments}
            isLoading={false}
            error={null}
            emptyTitle="No competencies assigned"
            emptyDescription="No competency templates have been assigned to this faculty member."
            loadingColumns={4}
          >
            {(items) => (
              <div className="space-y-2">
                {items.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{a.competency?.competencyTitle ?? "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">
                        {a.competency?.competencyCode} • {a.batch}
                      </p>
                    </div>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </AsyncContent>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Allocated Students</CardTitle>
          <CardDescription>Students currently allocated to this faculty member</CardDescription>
        </CardHeader>
        <CardContent>
          <AsyncContent
            data={allocations}
            isLoading={false}
            error={null}
            emptyTitle="No students allocated"
            emptyDescription="No students have been allocated to this faculty member."
            loadingColumns={4}
          >
            {(items) => (
              <div className="space-y-2">
                {items.map((a) => (
                  <Link
                    key={a.id}
                    href={`/dean/students/${a.studentId}`}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="font-medium">
                        {a.student?.user
                          ? `${a.student.user.firstName} ${a.student.user.lastName}`
                          : "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {a.student?.rollNumber} • {a.subject?.name ?? "Unknown Subject"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </AsyncContent>
        </CardContent>
      </Card>

      {assignments && assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Competency Coverage</CardTitle>
            <CardDescription>Assigned competencies across subjects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Assigned Competencies</span>
                <span className="text-sm text-muted-foreground">
                  {assignments.filter((a) => a.competency?.subtopicId).length} covered
                </span>
              </div>
              <ProgressBar completed={assignments.length} total={assignments.length} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
