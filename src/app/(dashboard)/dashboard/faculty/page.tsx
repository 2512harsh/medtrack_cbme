"use client";

import React, { useState, useEffect } from "react";
import { Users, ClipboardCheck, TrendingUp, Clock, ClipboardList, BookOpen, ShieldCheck, ListChecks, Timer, ArrowRight } from "lucide-react";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { ErrorState } from "@/components/shared/ErrorState";
import Link from "next/link";
import {
  getCurrentFaculty,
  getAssignedStudents,
  getAssignedCompetencies,
  getAssessments,
  getFacultyAssessmentHistory,
} from "@/features/faculty/services/faculty";
import { getCurriculumDepartments } from "@/features/curriculum/services/curriculum";
import {
  DashboardGrid,
  DashboardCol,
  DashboardHeader,
  IdentityItem,
  MetricCard,
  SectionCard,
  TaskCard,
  CompetencyCard,
  ActivityTimeline,
  QuickActions,
  EmptyWidget,
  DashboardSkeleton,
} from "@/components/dashboard";
import type { PriorityTask, CompetencyItem, ActivityItem, QuickActionItem, TaskUrgency } from "@/components/dashboard";
import type { AssessmentStatus, AssessmentDecision } from "@/types";
import type { StatusBadgeVariant } from "@/components/shared/StatusBadge";

interface DashboardData {
  stats: {
    assignedStudents: string;
    pendingReviews: string;
    completedReviews: string;
    awaitingSignature: string;
    remediationCases: string;
    assignedCompetencies: string;
  };
  department: string;
  specialization: string;
  queue: PriorityTask[];
  competencies: CompetencyItem[];
  activity: ActivityItem[];
}

const PENDING_STATUSES: AssessmentStatus[] = ["Draft", "Assigned", "In Progress", "Submitted"];

const decisionMeta: Record<AssessmentDecision, { icon: React.ReactNode; variant: StatusBadgeVariant }> = {
  "Meets Expectations": { icon: <ClipboardCheck className="h-4 w-4" />, variant: "success" },
  "Exceeds Expectations": { icon: <TrendingUp className="h-4 w-4" />, variant: "info" },
  "Needs Remediation": { icon: <Clock className="h-4 w-4" />, variant: "danger" },
};

const quickActions: QuickActionItem[] = [
  { label: "Assessment Queue", href: "/faculty/assessment-queue", icon: <ListChecks className="h-4 w-4" />, accent: "primary" },
  { label: "Assigned Students", href: "/faculty/assigned-students", icon: <Users className="h-4 w-4" />, accent: "blue" },
  { label: "Assigned Competencies", href: "/faculty/assigned-competencies", icon: <BookOpen className="h-4 w-4" />, accent: "green" },
  { label: "Remediation Workflow", href: "/assessment/remediation-workflow", icon: <Timer className="h-4 w-4" />, accent: "orange" },
  { label: "Assessment History", href: "/faculty/assessment-history", icon: <ClipboardList className="h-4 w-4" />, accent: "primary" },
];

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [me, departments, students, competencyAssignments, assessments, history] = await Promise.all([
        getCurrentFaculty(),
        getCurriculumDepartments(),
        getAssignedStudents(),
        getAssignedCompetencies(),
        getAssessments(),
        getFacultyAssessmentHistory(),
      ]);

      const department = departments.find((d) => d.id === me.departmentId)?.name ?? "—";

      const pending = assessments.filter((a) => PENDING_STATUSES.includes(a.currentStatus));
      const awaitingSignature = assessments.filter((a) => a.currentStatus === "Waiting for Student Acknowledgement");
      const remediation = assessments.filter((a) => a.currentStatus === "Reattempt Scheduled");

      const queue: PriorityTask[] = pending
        .slice()
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(0, 4)
        .map((a) => {
          const daysWaiting = Math.max(0, Math.floor((Date.now() - new Date(a.createdAt).getTime()) / 86400000));
          const urgency: TaskUrgency = daysWaiting >= 3 ? "overdue" : daysWaiting >= 1 ? "today" : "upcoming";
          const competency = a.competencyAssignment?.competency;
          return {
            id: a.id,
            action: "Complete Assessment",
            competency: competency ? `${competency.competencyCode} - ${competency.competencyTitle}` : "Unknown Competency",
            subject: competency?.subjectName ?? "—",
            dueLabel: daysWaiting === 0 ? "Assigned today" : `Waiting ${daysWaiting} day${daysWaiting === 1 ? "" : "s"}`,
            urgency,
            attempt: `Attempt ${a.currentAttempt}`,
            actionLabel: "Review",
            actionHref: `/faculty/assessment-form?assessmentId=${a.id}`,
          };
        });

      const competencies: CompetencyItem[] = competencyAssignments
        .map((a) => {
          const total = a.totalStudents ?? 0;
          const completedCount = Math.max(total - (a.pendingCount ?? 0), 0);
          const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;
          const status: CompetencyItem["status"] =
            total === 0 || completedCount === 0 ? "Pending" : (a.pendingCount ?? 0) === 0 ? "Completed" : "In Progress";
          return {
            id: a.id,
            code: a.competency?.competencyCode ?? "—",
            title: a.competency?.competencyTitle ?? "Unknown",
            subject: a.competency?.subjectName ?? "—",
            status,
            progress,
            href: "/faculty/assigned-competencies",
          };
        })
        .sort((a, b) => a.progress - b.progress)
        .slice(0, 5);

      const activity: ActivityItem[] = history.slice(0, 4).map((h) => {
        const meta = decisionMeta[h.decision];
        return {
          id: h.id,
          title: `${h.studentName} assessed for ${h.competencyCode} - ${h.decision}`,
          timestamp: new Date(h.facultySignedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          icon: meta.icon,
          status: h.decision,
          statusVariant: meta.variant,
        };
      });

      setData({
        stats: {
          assignedStudents: String(students.length),
          pendingReviews: String(pending.length),
          completedReviews: String(history.length),
          awaitingSignature: String(awaitingSignature.length),
          remediationCases: String(remediation.length),
          assignedCompetencies: String(competencyAssignments.length),
        },
        department,
        specialization: me.specialization ?? "—",
        queue,
        competencies,
        activity,
      });
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

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Faculty Dashboard"
        description={`Welcome back, Dr. ${user?.lastName}`}
        identity={
          <>
            <IdentityItem label="Assigned Students" value={data.stats.assignedStudents} />
            <IdentityItem label="Department" value={data.department} />
            <IdentityItem label="Specialization" value={data.specialization} />
            <IdentityItem label="Pending Reviews" value={data.stats.pendingReviews} />
            <IdentityItem label="Remediation Cases" value={data.stats.remediationCases} />
          </>
        }
      />

      {/* KPI row — 6 cards on desktop */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Assigned Students" value={data.stats.assignedStudents} icon={<Users className="h-5 w-5" />} color="blue" />
        <MetricCard label="Pending Reviews" value={data.stats.pendingReviews} icon={<ClipboardCheck className="h-5 w-5" />} color="orange" />
        <MetricCard label="Completed Reviews" value={data.stats.completedReviews} icon={<TrendingUp className="h-5 w-5" />} color="green" />
        <MetricCard label="Awaiting Signature" value={data.stats.awaitingSignature} icon={<ShieldCheck className="h-5 w-5" />} color="purple" sub="Student acknowledgment" />
        <MetricCard label="Remediation Cases" value={data.stats.remediationCases} icon={<Clock className="h-5 w-5" />} color="red" />
        <MetricCard label="Assigned Competencies" value={data.stats.assignedCompetencies} icon={<BookOpen className="h-5 w-5" />} color="yellow" />
      </div>

      <DashboardGrid>
        {/* Assessment Queue (8 cols) + Assigned Competencies (4 cols) */}
        <DashboardCol span={8}>
          <SectionCard
            title="Assessment Queue"
            description="Pending and in-progress assessments, sorted by how long they've been waiting"
            action={
              <Link href="/faculty/assessment-queue" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            {data.queue.length === 0 ? (
              <EmptyWidget title="No pending assessments" description="New assessments will appear here." icon={<ListChecks className="h-5 w-5" />} />
            ) : (
              <div className="space-y-2">
                {data.queue.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </SectionCard>
        </DashboardCol>

        <DashboardCol span={4}>
          <SectionCard
            title="Assigned Competencies"
            description="Your competency assignments and status"
            action={
              <Link href="/faculty/assigned-competencies" className="text-xs font-medium text-primary hover:underline">
                View all
              </Link>
            }
          >
            {data.competencies.length === 0 ? (
              <EmptyWidget title="No competencies" description="Competencies assigned to you will appear here." icon={<BookOpen className="h-5 w-5" />} />
            ) : (
              <div className="space-y-2">
                {data.competencies.map((comp) => (
                  <CompetencyCard key={comp.id} competency={comp} />
                ))}
              </div>
            )}
          </SectionCard>
        </DashboardCol>

        {/* Recent Activity (6 cols) + Quick Actions (6 cols) */}
        <DashboardCol span={6}>
          <SectionCard
            title="Recent Completed Assessments"
            description="Latest assessment decisions you recorded"
          >
            {data.activity.length === 0 ? (
              <EmptyWidget title="No recent activity" description="Your recorded assessments will appear here." icon={<ClipboardList className="h-5 w-5" />} />
            ) : (
              <ActivityTimeline items={data.activity} />
            )}
          </SectionCard>
        </DashboardCol>

        <DashboardCol span={6}>
          <SectionCard title="Quick Actions" description="Common workflows you can jump into" bodyClassName="pt-2">
            <QuickActions items={quickActions} />
          </SectionCard>
        </DashboardCol>
      </DashboardGrid>
    </div>
  );
}
