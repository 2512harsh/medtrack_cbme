"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  getDepartmentById,
  getInstitutionById,
  getDeanAccounts,
  getHodAccounts,
} from "@/features/super-admin/services/superAdmin";
import { PageLoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChevronRight, Building2, UserCheck, BookOpen } from "lucide-react";

export default function DepartmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [department, setDepartment] = useState<Awaited<
    ReturnType<typeof getDepartmentById>
  >>(undefined);
  const [institution, setInstitution] = useState<Awaited<
    ReturnType<typeof getInstitutionById>
  >>(undefined);
  type DeanAccountType = Awaited<ReturnType<typeof getDeanAccounts>>[number];
  const [dean, setDean] = useState<DeanAccountType | undefined>(undefined);
  type HodAccountType = Awaited<ReturnType<typeof getHodAccounts>>[number];
  const [hod, setHod] = useState<HodAccountType | undefined>(undefined);

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
      const [inst, deans, hods] = await Promise.all([
        getInstitutionById(dept.institutionId),
        getDeanAccounts(),
        getHodAccounts(),
      ]);
      setInstitution(inst);
      setDean(dept.deanId ? deans.find((h) => h.id === dept.deanId) : undefined);
      setHod(dept.hodId ? hods.find((h) => h.id === dept.hodId) : undefined);
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
            description={institution?.name ?? "Unknown institution"}
          />
          <StatusBadge
            variant={department.status === "ACTIVE" ? "success" : "gray"}
          >
            {department.status ?? "ACTIVE"}
          </StatusBadge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Institution</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {institution ? (
              <Link
                href={`/super-admin/institutions/${institution.id}`}
                className="text-lg font-medium text-primary hover:underline"
              >
                {institution.name}
              </Link>
            ) : (
              <p className="text-lg font-medium">Unassigned</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dean</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {dean ? `${dean.firstName} ${dean.lastName}` : "Unassigned"}
            </p>
            {dean && <p className="text-xs text-muted-foreground">{dean.email}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HOD</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {hod ? `${hod.firstName} ${hod.lastName}` : "Unassigned"}
            </p>
            {hod && <p className="text-xs text-muted-foreground">{hod.email}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{department.status ?? "ACTIVE"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {department.description ?? "No description provided."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}