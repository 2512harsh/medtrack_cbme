"use client";

import { useState, useEffect } from "react";
import { Users, GraduationCap, ClipboardCheck, TrendingUp, AlertTriangle, Activity, UserCheck, BookOpen, FileBarChart, Building2 } from "lucide-react";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  getDepartments,
  getFaculty,
  getStudents,
  getDepartmentProgress,
  getDepartmentWiseProgress,
} from "@/features/dean/services/dean";
import {
  DashboardGrid,
  DashboardCol,
  DashboardHeader,
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
  departmentCount: number;
  stats: {
    totalFaculty: string;
    totalStudents: string;
    pendingAssessments: string;
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
  { label: "Import Students", href: "/dean/students/import", icon: <FileBarChart className="h-4 w-4" />, accent: "primary" },
];

export default function DeanDashboard() {
  const { user } = useAuth();
  const departmentId = user?.departmentId;
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const isDean = user?.role !== "HOD";

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Not filtered by departmentId: faculty/students now come from the real DB, and
      // the mock logged-in user's departmentId doesn't match real department ids.
      // Departments are also global now (no institution scoping), so no institution filter either.
      const [allDepartments, faculty, students] = await Promise.all([
        getDepartments(),
        getFaculty(),
        getStudents(),
      ]);

      const progressRows = isDean
        ? (await getDepartmentWiseProgress()).map((r) => ({ label: r.department, completed: r.completed, total: r.total }))
        : (await getDepartmentProgress(departmentId)).map((r) => ({ label: r.subject, completed: r.completed, total: r.total }));

      const totalCompleted = progressRows.reduce((sum, s) => sum + s.completed, 0);
      const totalCompetencies = progressRows.reduce((sum, s) => sum + s.total, 0);
      const overall = totalCompetencies > 0 ? Math.round((totalCompleted / totalCompetencies) * 100) : 0;

      const remaining = Math.max(totalCompetencies - totalCompleted, 0);
      const inProgress = Math.round(remaining * 0.5);
      const pending = Math.round(remaining * 0.2);
      const awaitingReview = Math.max(remaining - inProgress - pending, 0);

      const departmentCount = allDepartments.length;

      setData({
        departmentCount,
        stats: {
          totalFaculty: String(faculty.length),
          totalStudents: String(students.length),
          pendingAssessments: "23",
        },
        progress: {
          overall,
          subjects: progressRows.map((s, i) => ({
            subject: s.label,
            completed: s.completed,
            total: s.total,
            color: progressColors[i % progressColors.length],
          })),
          distribution: [
            { label: "Completed", value: totalCompleted, className: "bg-green-500" },
            { label: "In Progress", value: inProgress, className: "bg-blue-500" },
            { label: "Pending", value: pending, className: "bg-orange-500" },
            { label: "Awaiting Review", value: awaitingReview, className: "bg-purple-500" },
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
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {user?.role !== "HOD" && (
          <MetricCard label="Departments" value={String(data.departmentCount)} icon={<Building2 className="h-5 w-5" />} color="primary" />
        )}
        <MetricCard label="Total Faculty" value={data.stats.totalFaculty} icon={<Users className="h-5 w-5" />} color="blue" trend="+1 this month" trendUp />
        <MetricCard label="Total Students" value={data.stats.totalStudents} icon={<GraduationCap className="h-5 w-5" />} color="green" trend="+24 this batch" trendUp />
        <MetricCard label="Pending Assessments" value={data.stats.pendingAssessments} icon={<ClipboardCheck className="h-5 w-5" />} color="orange" sub="6 urgent" />
      </div>

      <DashboardGrid>
        <DashboardCol span={12}>
          <SectionCard
            title={isDean ? "Department-wise Progress" : "Department Progress"}
            description={isDean ? "Completion across departments in your institution" : "Completion across subjects in your department"}
          >
            <ProgressWidget
              overall={data.progress.overall}
              subjects={data.progress.subjects}
              distribution={data.progress.distribution}
              itemVariant={isDean ? "circle" : "bar"}
            />
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
