"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChevronRight, ClipboardList, FileText, Mail, GraduationCap } from "lucide-react";
import { getStudentById, getAssessments } from "@/features/faculty/services/faculty";
import type { Student, Assessment } from "@/types";

export default function AssignedStudentDetailPage() {
  const params = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [assessments, setAssessments] = useState<Assessment[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const found = await getStudentById(String(params.id));
      setStudent(found || null);
      if (found) {
        const assessData = await getAssessments();
        setAssessments(assessData.filter((a) => a.studentId === found.id));
      } else {
        setAssessments([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load student details"));
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
        <p className="text-muted-foreground">Unable to load student details. Please try again.</p>
        <button onClick={fetchData} className="mt-4 text-primary hover:underline">
          Try Again
        </button>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium">Student not found</p>
        <p className="text-sm text-muted-foreground mt-2">The requested student could not be found.</p>
        <Link href="/faculty/assigned-students" className="mt-4 text-primary hover:underline">
          Back to Assigned Students
        </Link>
      </div>
    );
  }

  const fullName = student.user ? `${student.user.firstName} ${student.user.lastName}` : "Unknown";
  const completed = assessments?.filter((a) => a.currentStatus === "Completed").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/faculty/assigned-students" className="hover:text-foreground">Assigned Students</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{fullName}</span>
        </div>
        <PageHeader
          className="mt-2"
          title={fullName}
          description={student.rollNumber}
          actions={
            student.user && (
              <StatusBadge variant={student.user.status === "ACTIVE" ? "success" : "gray"}>
                {student.user.status}
              </StatusBadge>
            )
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{student.user?.email ?? "N/A"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Batch</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{student.batch}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{assessments?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">{completed} completed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessments</CardTitle>
          <CardDescription>Assessment status for this student</CardDescription>
        </CardHeader>
        <CardContent>
          <AsyncContent
            data={assessments}
            isLoading={false}
            error={null}
            emptyTitle="No assessments"
            emptyDescription="No assessments have been created for this student."
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
                      <p className="font-medium">
                        {a.competencyAssignment?.competency?.competencyTitle ?? "Assessment"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Attempt {a.currentAttempt} • Created {new Date(a.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          a.currentStatus === "Completed"
                            ? "bg-green-100 text-green-700"
                            : a.currentStatus === "Submitted"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {a.currentStatus}
                      </span>
                      <Link href={`/faculty/assessment-detail?id=${a.id}`}>
                        <Button variant="ghost" size="icon" title="View assessment">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AsyncContent>
        </CardContent>
      </Card>
    </div>
  );
}