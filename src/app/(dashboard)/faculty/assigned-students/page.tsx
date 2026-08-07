"use client";

import React, { useState, useEffect } from "react";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Eye, FileText } from "lucide-react";
import { getAssignedStudents } from "@/features/faculty/services/faculty";
import Link from "next/link";
import type { Student } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { PageHeader } from "@/components/layout/PageHeader";

type AssignedStudentRow = {
  id: string;
  name: string;
  rollNumber: string;
  batch: string;
  status: string;
};

const columns: ColumnDef<AppTableFeatures, AssignedStudentRow>[] = [
  {
    accessorKey: "name",
    header: "Student",
    cell: ({ row }) => (
      <Link
        href={`/faculty/assigned-students/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.getValue("name")}
      </Link>
    ),
  },
  { accessorKey: "rollNumber", header: "Roll Number" },
  { accessorKey: "batch", header: "Batch" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 text-xs rounded-full ${
          row.getValue("status") === "ACTIVE"
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-700"
        }`}
      >
        {row.getValue("status")}
      </span>
    ),
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Link href={`/faculty/assigned-students/${row.original.id}`} title="View student">
          <Button variant="ghost" size="icon">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
        <Link href={`/faculty/assessment-form?studentId=${row.original.id}`} title="Start assessment">
          <Button variant="ghost" size="icon">
            <FileText className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    ),
  },
];

async function getAssignedStudentData(): Promise<AssignedStudentRow[]> {
  const students = await getAssignedStudents();
  return students.map((s: Student) => ({
    id: s.id,
    name: s.user ? `${s.user.firstName} ${s.user.lastName}` : "Unknown",
    rollNumber: s.rollNumber,
    batch: s.batch,
    status: s.user?.status ?? "ACTIVE",
  }));
}

export default function AssignedStudentsPage() {
  const [data, setData] = useState<AssignedStudentRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const students = await getAssignedStudentData();
      setData(students);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load assigned students"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Students"
        description="View and assess your assigned students"
      />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No students assigned"
        emptyDescription="No students have been assigned to you yet."
        loadingColumns={4}
      >
        {(students) => (
          <DataTable
            columns={columns}
            data={students}
            searchPlaceholder="Search students..."
          />
        )}
      </AsyncContent>
    </div>
  );
}
