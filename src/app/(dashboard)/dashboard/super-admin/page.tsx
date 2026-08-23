"use client";

import React, { useState, useEffect } from "react";
import { Users, Building2, UserCheck, TrendingUp, Activity, Building, Landmark, FileText } from "lucide-react";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { ErrorState } from "@/components/shared/ErrorState";
import { getDashboardStats } from "@/features/super-admin/services/superAdmin";
import Link from "next/link";
import {
  DashboardGrid,
  DashboardCol,
  DashboardHeader,
  IdentityItem,
  MetricCard,
  SectionCard,
  ActivityTimeline,
  QuickActions,
  EmptyWidget,
  DashboardSkeleton,
} from "@/components/dashboard";
import type { ActivityItem, QuickActionItem } from "@/components/dashboard";

interface DashboardData {
  stats: {
    totalInstitutions: string;
    totalDepartments: string;
    activeDeans: string;
    activeHods: string;
    platformHealth: string;
  };
}

const quickActions: QuickActionItem[] = [
  { label: "Manage Institutions", href: "/super-admin/institutions", icon: <Landmark className="h-4 w-4" />, accent: "primary" },
  { label: "Manage Departments", href: "/super-admin/departments", icon: <Building className="h-4 w-4" />, accent: "blue" },
  { label: "Import Competency Library", href: "/curriculum/import", icon: <FileText className="h-4 w-4" />, accent: "orange" },
  { label: "Manage Deans", href: "/super-admin/deans", icon: <UserCheck className="h-4 w-4" />, accent: "purple" },
];

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [institutions, setInstitutions] = useState<Awaited<
    ReturnType<typeof getDashboardStats>
  >["institutions"]>([]);
  const [recentActivity, setRecentActivity] = useState<Awaited<
    ReturnType<typeof getDashboardStats>
  >["recentActivity"]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stats = await getDashboardStats();
      setData({
        stats: {
          totalInstitutions: String(stats.totalInstitutions),
          totalDepartments: String(stats.totalDepartments),
          activeDeans: String(stats.activeDeans),
          activeHods: String(stats.activeHods),
          platformHealth: stats.platformHealth,
        },
      });
      setInstitutions(stats.institutions);
      setRecentActivity(stats.recentActivity);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load dashboard data"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message="Unable to load dashboard data. Please try again."
        onRetry={fetchData}
      />
    );
  }

  if (!data) {
    return <DashboardSkeleton />;
  }

  const activityItems: ActivityItem[] = recentActivity.slice(0, 4).map((activity) => ({
    id: activity.id,
    title: `${activity.action} · ${activity.entity}`,
    timestamp: new Date(activity.createdAt).toLocaleDateString(),
    icon: <Activity className="h-4 w-4" />,
    status: activity.user,
  }));

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Super Admin Dashboard"
        description={`Welcome back, ${user?.firstName}`}
        identity={
          <>
            <IdentityItem label="Platform" value="MedTrack CBME" />
            <IdentityItem label="Total Institutions" value={data.stats.totalInstitutions} />
            <IdentityItem label="Total Departments" value={data.stats.totalDepartments} />
            <IdentityItem label="Active Deans" value={data.stats.activeDeans} />
            <IdentityItem label="Active HODs" value={data.stats.activeHods} />
            <IdentityItem label="Platform Health" value={data.stats.platformHealth} />
          </>
        }
      />

      {/* KPI row — 6 cards on desktop */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Total Institutions" value={data.stats.totalInstitutions} icon={<Landmark className="h-5 w-5" />} color="blue" trend="+2 this month" trendUp />
        <MetricCard label="Total Departments" value={data.stats.totalDepartments} icon={<Building className="h-5 w-5" />} color="green" trend="+5 this month" trendUp />
        <MetricCard label="Active Deans" value={data.stats.activeDeans} icon={<UserCheck className="h-5 w-5" />} color="purple" trend="+3 this month" trendUp />
        <MetricCard label="Platform Health" value={data.stats.platformHealth} icon={<TrendingUp className="h-5 w-5" />} color="orange" sub="Stable" />
        <MetricCard label="Institutions Active" value={institutions.filter((i) => i.status === "ACTIVE").length} icon={<Building2 className="h-5 w-5" />} color="green" sub="Across platform" />
        <MetricCard label="Avg Departments" value={Math.round(Number(data.stats.totalDepartments) / Math.max(Number(data.stats.totalInstitutions), 1))} icon={<Users className="h-5 w-5" />} color="yellow" sub="Per institution" />
      </div>

      <DashboardGrid>
        {/* Institutions Overview (8 cols) + Recent Activity (4 cols) */}
        <DashboardCol span={8}>
          <SectionCard
            title="Institutions Overview"
            description="Medical colleges on the platform"
            action={
              <Link href="/super-admin/institutions" className="text-xs font-medium text-primary hover:underline">
                View all
              </Link>
            }
          >
            {institutions.length === 0 ? (
              <EmptyWidget title="No institutions" description="Institutions will appear here." icon={<Landmark className="h-5 w-5" />} />
            ) : (
              <div className="space-y-2">
                {institutions.slice(0, 5).map((inst) => (
                  <div key={inst.id} className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{inst.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {inst.code} · {inst.status === "ACTIVE" ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2 py-1 text-xs rounded-full ${inst.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                      {inst.status ?? "ACTIVE"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </DashboardCol>

        <DashboardCol span={4}>
          <SectionCard
            title="Recent Activity"
            description="Latest platform events"
            action={
              <Link href="/reports/audit-report" className="text-xs font-medium text-primary hover:underline">
                Audit report
              </Link>
            }
          >
            {activityItems.length === 0 ? (
              <EmptyWidget title="No recent activity" description="Platform events will appear here." icon={<Activity className="h-5 w-5" />} />
            ) : (
              <ActivityTimeline items={activityItems} />
            )}
          </SectionCard>
        </DashboardCol>

        {/* Quick Actions — full width */}
        <DashboardCol span={12}>
          <SectionCard title="Quick Actions" description="Common workflows you can jump into" bodyClassName="pt-2">
            <QuickActions items={quickActions} />
          </SectionCard>
        </DashboardCol>
      </DashboardGrid>
    </div>
  );
}
