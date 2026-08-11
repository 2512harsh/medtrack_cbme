"use client";

import React, { useState, useEffect } from "react";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { getAuditLogs } from "@/features/assessment/services/assessment";
import { getFaculty, getStudents } from "@/features/dean/services/dean";
import { getDeanAccounts, getHodAccounts } from "@/features/super-admin/services/superAdmin";
import { mockUsers } from "@/features/authentication/mock/users";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { ColumnDef } from "@tanstack/react-table";
import type { AuditLog } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";

type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  user: string;
  date: string;
  ipAddress: string;
};

const columns: ColumnDef<AppTableFeatures, AuditRow>[] = [
  { accessorKey: "action", header: "Action" },
  { accessorKey: "entity", header: "Entity" },
  { accessorKey: "entityId", header: "Entity ID" },
  { accessorKey: "user", header: "User" },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.getValue("date")).toLocaleString()}
      </span>
    ),
  },
  { accessorKey: "ipAddress", header: "IP Address" },
];

export default function AuditDisplayPage() {
  const [data, setData] = useState<AuditRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [logs, faculty, students, deans, hods] = await Promise.all([
        getAuditLogs(),
        getFaculty(),
        getStudents(),
        getDeanAccounts(),
        getHodAccounts(),
      ]);

      const userNames = new Map<string, string>();
      for (const u of mockUsers) {
        userNames.set(u.id, `${u.firstName} ${u.lastName}`);
      }
      for (const f of faculty) {
        if (f.user) userNames.set(f.userId, `${f.user.firstName} ${f.user.lastName}`);
      }
      for (const s of students) {
        if (s.user) userNames.set(s.userId, `${s.user.firstName} ${s.user.lastName}`);
      }
      for (const d of deans) {
        userNames.set(d.id, `${d.firstName} ${d.lastName}`);
      }
      for (const h of hods) {
        userNames.set(h.id, `${h.firstName} ${h.lastName}`);
      }

      setData(
        logs.map((log: AuditLog) => ({
          id: log.id,
          action: log.action,
          entity: log.entity,
          entityId: log.entityId,
          user: userNames.get(log.userId) ?? log.userId,
          date: log.createdAt,
          ipAddress: log.ipAddress ?? "N/A",
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load audit logs"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Display" description="View audit-relevant display states" />
      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No audit logs found"
        emptyDescription="No audit records are available yet."
        loadingColumns={6}
      >
        {(logs) => (
          <DataTable columns={columns} data={logs} searchPlaceholder="Search audit logs..." />
        )}
      </AsyncContent>
    </div>
  );
}
