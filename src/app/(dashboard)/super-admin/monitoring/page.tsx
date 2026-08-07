"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/StatCard";
import { ProgressBar } from "@/components/shared/StatCard";
import {
  getPlatformMetrics,
  getRecentActivity,
} from "@/features/super-admin/services/superAdmin";
import { PageLoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  Activity,
  Users,
  Zap,
  AlertTriangle,
  Database,
  Cpu,
  HardDrive,
} from "lucide-react";

export default function PlatformMonitoringPage() {
  type Metrics = Awaited<ReturnType<typeof getPlatformMetrics>>;
  const [metrics, setMetrics] = useState<Metrics | undefined>(undefined);
  const [recentActivity, setRecentActivity] = useState<Awaited<
    ReturnType<typeof getRecentActivity>
  >>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [m, activity] = await Promise.all([
        getPlatformMetrics(),
        getRecentActivity(),
      ]);
      setMetrics(m);
      setRecentActivity(activity);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load platform metrics"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (error || !metrics) {
    return (
      <ErrorState
        message="Unable to load platform monitoring data. Please try again."
        onRetry={fetchData}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Monitoring"
        description="Monitor platform health and user activity"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Uptime"
          value={metrics.uptime}
          icon={<Activity className="h-5 w-5" />}
          trend="Stable"
          trendUp
          color="green"
        />
        <StatCard
          title="Active Users"
          value={metrics.activeUsers}
          icon={<Users className="h-5 w-5" />}
          trend="+12 today"
          trendUp
          color="blue"
        />
        <StatCard
          title="Avg Response Time"
          value={metrics.avgResponseTime}
          icon={<Zap className="h-5 w-5" />}
          trend="Healthy"
          trendUp
          color="purple"
        />
        <StatCard
          title="Error Rate"
          value={metrics.errorRate}
          icon={<AlertTriangle className="h-5 w-5" />}
          trend="Within range"
          trendUp
          color="orange"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>System Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  CPU Load
                </span>
                <span>{metrics.systemLoad}%</span>
              </div>
              <ProgressBar completed={metrics.systemLoad} total={100} color="blue" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  Memory Usage
                </span>
                <span>{metrics.memoryUsage}%</span>
              </div>
              <ProgressBar completed={metrics.memoryUsage} total={100} color="purple" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  Storage Usage
                </span>
                <span>{metrics.storageUsage}%</span>
              </div>
              <ProgressBar completed={metrics.storageUsage} total={100} color="green" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Active Sessions</span>
              <span className="font-medium">{metrics.activeSessions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Requests Today</span>
              <span className="font-medium">{metrics.requestsToday.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pending Imports</span>
              <span className="font-medium">{metrics.pendingImports}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Deployment</span>
              <span className="font-medium">
                {new Date(metrics.lastDeployment).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.user} • {activity.entity}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(activity.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}