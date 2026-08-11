"use client";

import React, { useState, useEffect } from "react";
import { Users, GraduationCap, ClipboardCheck, TrendingUp, AlertTriangle, Activity, UserCheck, BookOpen, BarChart3, ShieldAlert, FileBarChart } from "lucide-react";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  getDepartmentById,
  getFaculty,
  getStudents,
  getDepartmentProgress,
} from "@/features/dean/services/dean";
import Link from "next/link";
import {
  DashboardGrid,
  DashboardCol,
  DashboardHeader,
  IdentityItem,
  MetricCard,
  SectionCard,
  ProgressWidget,
  ActivityTimeline,
  QuickActions,
  EmptyWidget,
  DashboardSkeleton,
} from "@/components/dashboard";
import type { ActivityItem, QuickActionItem } from "@/components/dashboard";

interface DashboardData {
  departmentName: string;
  stats: {
    totalFaculty: string;
    totalStudents: string;
    pendingAssessments: string;
    completedCompetencies: string;
    remedialCases: string;
    urgentReviews: string;
  };
  progress: {
    overall: number;
    subjects: { subject: string; completed: number; total: number; color?: "blue" | "green" | "purple" | "orange" | "primary" }[];
    distribution: { label: string; value: number; className: string }[];
  };
  activity: ActivityItem[];
}

const progressColors: ("blue" | "green" | "purple" | "orange" | "primary")[] = [
  "blue",
  "green",
  "purple",
  "orange",
  "primary",
];

const quickActions: QuickActionItem[] = [
  { label: "Faculty Management", href: "/dean/faculty", icon: <Users className="h-4 w-4" />, accent: "primary" },
  { label: "Student Management", href: "/dean/students", icon: <GraduationCap className="h-4 w-4" />, accent: "blue" },
  { label: "Student Allocation", href: "/dean/allocations", icon: <UserCheck className="h-4 w-4" />, accent: "green" },
  { label: "Competency Assignment", href: "/dean/competency-assignment", icon: <BookOpen className="h-4 w-4" />, accent: "orange" },
  { label: "Department Progress", href: "/dean/progress", icon: <BarChart3 className="h-4 w-4" />, accent: "purple" },
  { label: "Import Students", href: "/dean/students/import", icon: <FileBarChart className="h-4 w-4" />, accent: "primary" },
];

export default function DeanDashboard() {
  const { user } = useAuth();
  const departmentId = user?.departmentId;
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [department, faculty, students, subjectProgress] = await Promise.all([
        departmentId ? getDepartmentById(departmentId) : Promise.resolve(undefined),
        getFaculty(departmentId),
        getStudents(departmentId),
        getDepartmentProgress(departmentId),
      ]);

      const totalCompleted = subjectProgress.reduce((sum, s) => sum + s.completed, 0);
      const totalCompetencies = subjectProgress.reduce((sum, s) => sum + s.total, 0);
      const overall = totalCompetencies > 0 ? Math.round((totalCompleted / totalCompetencies) * 100) : 0;

      setData({
        departmentName: department?.name ?? "Unassigned",
        stats: {
          totalFaculty: String(faculty.length),
          totalStudents: String(students.length),
          pendingAssessments: "23",
          completedCompetencies: String(totalCompleted),
          remedialCases: "5",
          urgentReviews: "6",
        },
        progress: {
          overall,
          subjects: subjectProgress.map((s, i) => ({
            ...s,
            color: progressColors[i % progressColors.length],
          })),
          distribution: [
            { label: "Completed", value: 125, className: "bg-green-500" },
            { label: "In Progress", value: 45, className: "bg-blue-500" },
            { label: "Pending", value: 18, className: "bg-orange-500" },
            { label: "Awaiting Review", value: 23, className: "bg-purple-500" },
          ],
        },
        activity: [
          { id: "h1", title: "Department progress updated - 42 competencies completed this week", timestamp: "Aug 13, 2026", icon: <TrendingUp className="h-4 w-4" />, status: "Progress", statusVariant: "success" },
          { id: "h2", title: "Dr. Sunita Devi scheduled a remediation session for PY1.1", timestamp: "Aug 14, 2026", icon: <AlertTriangle className="h-4 w-4" />, status: "Remediation", statusVariant: "warning" },
          { id: "h3", title: "Dr. Priya Nair went on leave", timestamp: "Aug 12, 2026", icon: <Activity className="h-4 w-4" />, status: "Faculty", statusVariant: "info" },
          { id: "h4", title: "5 faculty assessments awaiting review across the department", timestamp: "Aug 12, 2026", icon: <ClipboardCheck className="h-4 w-4" />, status: "Pending", statusVariant: "purple" },
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load dashboard data"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

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

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={user?.role === "HOD" ? "HOD Dashboard" : "Dean Dashboard"}
        description={`Welcome back, Prof. ${user?.lastName}`}
        identity={
          <>
            <IdentityItem label="Department" value={data.departmentName} />
            <IdentityItem label="Total Faculty" value={data.stats.totalFaculty} />
            <IdentityItem label="Total Students" value={data.stats.totalStudents} />
            <IdentityItem label="Pending Assessments" value={data.stats.pendingAssessments} />
            <IdentityItem label="Completion Rate" value={`${data.progress.overall}%`} />
          </>
        }
      />

      {/* KPI row — 6 cards on desktop */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Total Faculty" value={data.stats.totalFaculty} icon={<Users className="h-5 w-5" />} color="blue" trend="+1 this month" trendUp />
        <MetricCard label="Total Students" value={data.stats.totalStudents} icon={<GraduationCap className="h-5 w-5" />} color="green" trend="+24 this batch" trendUp />
        <MetricCard label="Pending Assessments" value={data.stats.pendingAssessments} icon={<ClipboardCheck className="h-5 w-5" />} color="orange" sub="6 urgent" />
        <MetricCard label="Completed Competencies" value={data.stats.completedCompetencies} icon={<TrendingUp className="h-5 w-5" />} color="purple" trend="+89 this month" trendUp />
        <MetricCard label="Remediation Cases" value={data.stats.remedialCases} icon={<ShieldAlert className="h-5 w-5" />} color="red" sub="2 due soon" />
        <MetricCard label="Urgent Reviews" value={data.stats.urgentReviews} icon={<AlertTriangle className="h-5 w-5" />} color="yellow" sub="Review now" />
      </div>

      <DashboardGrid>
        {/* Department Progress (8 cols) + Faculty Activity (4 cols) */}
        <DashboardCol span={8}>
          <SectionCard
            title="Department Progress"
            description="Completion across subjects in your department"
            action={
              <Link href="/dean/progress" className="text-xs font-medium text-primary hover:underline">
                View details
              </Link>
            }
          >
            <ProgressWidget
              overall={data.progress.overall}
              subjects={data.progress.subjects}
              distribution={data.progress.distribution}
            />
          </SectionCard>
        </DashboardCol>

        <DashboardCol span={4}>
          <SectionCard
            title="Faculty Activity"
            description="Latest faculty and department events"
          >
            {data.activity.length === 0 ? (
              <EmptyWidget title="No recent activity" description="Department events will appear here." icon={<Activity className="h-5 w-5" />} />
            ) : (
              <ActivityTimeline items={data.activity} />
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
