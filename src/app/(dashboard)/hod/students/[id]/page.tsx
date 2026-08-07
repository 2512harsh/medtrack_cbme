"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ProgressBar } from "@/components/shared/StatCard";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { ChevronRight, GraduationCap, Calendar, Hash, UserCheck } from "lucide-react";
import {
  getStudentById,
  getStudentAllocations,
} from "@/features/hod/services/hod";
import type { Student, StudentAllocation } from "@/types";

export default function StudentDetailPage() {
  const params = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [allocations, setAllocations] = useState<StudentAllocation[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const found = await getStudentById(String(params.id));
      setStudent(found || null);
      if (found) {
        const allocData = await getStudentAllocations();
        setAllocations(allocData.filter((a) => a.studentId === found.id));
      } else {
        setAllocations([]);
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
        <Link href="/hod/students" className="mt-4 text-primary hover:underline">
          Back to Student Management
        </Link>
      </div>
    );
  }

  const fullName = student.user ? `${student.user.firstName} ${student.user.lastName}` : "Unknown";

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/hod/students" className="hover:text-foreground">Student Management</Link>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registration No</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{student.registrationNumber}</p>
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
            <CardTitle className="text-sm font-medium">Admission Year</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{student.admissionYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allocations</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{allocations?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faculty Allocations</CardTitle>
          <CardDescription>Faculty members this student is allocated to</CardDescription>
        </CardHeader>
        <CardContent>
          <AsyncContent
            data={allocations}
            isLoading={false}
            error={null}
            emptyTitle="No allocations"
            emptyDescription="This student is not allocated to any faculty member."
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
                        {a.faculty?.user
                          ? `${a.faculty.user.firstName} ${a.faculty.user.lastName}`
                          : "Unknown"}
                      </p>
<p className="text-sm text-muted-foreground">
                        {a.faculty?.designation} • {a.subject?.name ?? "Unknown Subject"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        a.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {a.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </AsyncContent>
        </CardContent>
      </Card>

      {allocations && allocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Allocation Coverage</CardTitle>
            <CardDescription>Active allocation ratio</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressBar
              completed={allocations.filter((a) => a.active).length}
              total={allocations.length}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}