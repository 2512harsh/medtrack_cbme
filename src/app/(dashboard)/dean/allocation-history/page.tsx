"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { getAllocationHistory } from "@/features/dean/services/dean";
import { ColumnDef } from "@tanstack/react-table";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import type { StudentAllocation } from "@/types";

type AllocationHistoryRow = {
  id: string;
  studentName: string;
  facultyName: string;
  subject: string;
  allocatedDate: string;
  status: string;
};

const columns: ColumnDef<AppTableFeatures, AllocationHistoryRow>[] = [
  {
    accessorKey: "studentName",
    header: "Student",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("studentName")}</span>
    ),
  },
  { accessorKey: "facultyName", header: "Faculty" },
  { accessorKey: "subject", header: "Subject" },
  {
    accessorKey: "allocatedDate",
    header: "Allocated Date",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.getValue("allocatedDate")).toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 text-xs rounded-full ${
          row.getValue("status") === "Active"
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-700"
        }`}
      >
        {row.getValue("status")}
      </span>
    ),
  },
];

async function getHistoryData(departmentId?: string): Promise<AllocationHistoryRow[]> {
  const allocations = await getAllocationHistory(departmentId);
  return allocations.map((a: StudentAllocation) => ({
    id: a.id,
    studentName: a.student
      ? `${a.student.user?.firstName ?? ""} ${a.student.user?.lastName ?? ""}`.trim()
      : "Unknown",
    facultyName: a.faculty
      ? `${a.faculty.user?.firstName ?? ""} ${a.faculty.user?.lastName ?? ""}`.trim()
      : "Unknown",
    subject: a.subject?.name ?? "Unknown",
    allocatedDate: a.allocatedDate,
    status: a.active ? "Active" : "Inactive",
  }));
}

export default function AllocationHistoryPage() {
  const { user } = useAuth();
  const departmentId = user?.departmentId;
  const [data, setData] = useState<AllocationHistoryRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const history = await getHistoryData(departmentId);
      setData(history);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load allocation history"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

  return (
    <div className="space-y-6">
      <PageHeader title="Allocation History" description="Read-only history of student allocations" />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No allocation history"
        emptyDescription="No student allocations have been recorded."
        loadingColumns={5}
      >
        {(history) => (
          <DataTable columns={columns} data={history} searchPlaceholder="Search allocation history..." />
        )}
      </AsyncContent>
    </div>
  );
}