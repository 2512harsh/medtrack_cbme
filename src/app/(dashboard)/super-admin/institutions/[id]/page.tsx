"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AsyncContent } from "@/components/shared/AsyncContent";
import {
  getInstitutionById,
  getDepartmentsByInstitutionId,
} from "@/features/super-admin/services/superAdmin";
import { PageLoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  ChevronRight,
  MapPin,
  Mail,
  Phone,
  Building2,
  Users,
  Hash,
} from "lucide-react";

export default function InstitutionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [institution, setInstitution] = useState<Awaited<
    ReturnType<typeof getInstitutionById>
  >>(undefined);
  const [departments, setDepartments] = useState<Awaited<
    ReturnType<typeof getDepartmentsByInstitutionId>
  >>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const [inst, depts] = await Promise.all([
        getInstitutionById(params.id),
        getDepartmentsByInstitutionId(params.id),
      ]);
      if (!inst) {
        setNotFound(true);
        return;
      }
      setInstitution(inst);
      setDepartments(depts);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load institution"));
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
        message="Unable to load institution details. Please try again."
        onRetry={fetchData}
      />
    );
  }

  if (notFound || !institution) {
    return (
      <EmptyState
        title="Institution not found"
        description="The institution you are looking for does not exist."
        actionLabel="Back to Institutions"
        onAction={() => router.push("/super-admin/institutions")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/super-admin/institutions" className="hover:text-foreground">
            Institutions
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{institution.name}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <PageHeader
            title={institution.name}
            description={`${institution.code} • ${institution.city ?? "No city"} ${institution.state ?? ""}`}
          />
          <StatusBadge
            variant={institution.status === "ACTIVE" ? "success" : "gray"}
          >
            {institution.status ?? "ACTIVE"}
          </StatusBadge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{departments.length}</p>
            <p className="text-xs text-muted-foreground">
              {departments.filter((d) => d.status === "ACTIVE").length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Code</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{institution.code}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium break-all">{institution.email ?? "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phone</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{institution.phone ?? "-"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact & Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p>{institution.address ?? "No address on file"}</p>
                <p className="text-muted-foreground">
                  {[institution.city, institution.state, institution.country]
                    .filter(Boolean)
                    .join(", ") || "Location not specified"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <p>{institution.email ?? "-"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <p>{institution.phone ?? "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <AsyncContent
              data={departments}
              isLoading={false}
              error={null}
              emptyTitle="No departments"
              emptyDescription="No departments have been added to this institution."
              loadingColumns={2}
            >
              {(items) => (
                <div className="space-y-2">
                  {items.map((d) => (
                    <Link
                      key={d.id}
                      href={`/super-admin/departments/${d.id}`}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{d.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {d.description ?? "No description"}
                          </p>
                        </div>
                      </div>
                      <StatusBadge
                        variant={d.status === "ACTIVE" ? "success" : "gray"}
                      >
                        {d.status ?? "ACTIVE"}
                      </StatusBadge>
                    </Link>
                  ))}
                </div>
              )}
            </AsyncContent>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}