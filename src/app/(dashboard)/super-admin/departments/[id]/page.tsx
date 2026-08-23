"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getDepartmentById, getInstitutionById } from "@/features/super-admin/services/superAdmin";
import { getHodAccounts } from "@/features/dean/services/dean";
import { PageLoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChevronRight, UserCheck } from "lucide-react";

export default function DepartmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [department, setDepartment] = useState<Awaited<
    ReturnType<typeof getDepartmentById>
  >>(undefined);
  type HodRow = { id: string; firstName: string; lastName: string; email: string; institutionName: string };
  const [hods, setHods] = useState<HodRow[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const dept = await getDepartmentById(params.id);
      if (!dept) {
        setNotFound(true);
        return;
      }
      setDepartment(dept);

      const hodAccounts = await getHodAccounts({ departmentId: dept.id });
      const institutions = await Promise.all(
        hodAccounts.map((h) => (h.institutionId ? getInstitutionById(h.institutionId) : Promise.resolve(undefined)))
      );
      setHods(
        hodAccounts.map((h, i) => ({
          id: h.id,
          firstName: h.firstName,
          lastName: h.lastName,
          email: h.email,
          institutionName: institutions[i]?.name ?? "Unassigned institution",
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load department"));
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message="Unable to load department details. Please try again."
        onRetry={fetchData}
      />
    );
  }

  if (notFound || !department) {
    return (
      <EmptyState
        title="Department not found"
        description="The department you are looking for does not exist."
        actionLabel="Back to Departments"
        onAction={() => router.push("/super-admin/departments")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/super-admin/departments" className="hover:text-foreground">
            Departments
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{department.name}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <PageHeader
            title={department.name}
            description={department.description ?? "Shared across every institution"}
          />
          <StatusBadge
            variant={department.status === "ACTIVE" ? "success" : "gray"}
          >
            {department.status ?? "ACTIVE"}
          </StatusBadge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            HODs by Institution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hods.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No HOD has been assigned to this department at any institution yet.
            </p>
          ) : (
            <div className="space-y-3">
              {hods.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-lg border px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{h.firstName} {h.lastName}</p>
                    <p className="text-xs text-muted-foreground">{h.email}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{h.institutionName}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
