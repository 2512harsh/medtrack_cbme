"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  ClipboardCheck,
  Clock,
  Upload,
  MessageSquare,
  History,
  Library,
  CheckCircle2,
  Hourglass,
  PenLine,
  AlertTriangle,
  GraduationCap,
  ListChecks,
  ArrowRight,
  Play,
  FileText,
} from "lucide-react";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { ErrorState } from "@/components/shared/ErrorState";
import Link from "next/link";
import {
  getStudent,
  getMyCompetencies,
  getMyAssessments,
  getMyAssessmentAttempts,
  getProgress,
} from "@/features/student/services/student";
import type { Assessment, AssessmentStatus } from "@/types";
import {
  DashboardGrid,
  DashboardCol,
  DashboardHeader,
  IdentityItem,
  MetricCard,
  SectionCard,
  QuickActions,
  TaskCard,
  CompetencyCard,
  ProgressWidget,
  ActivityTimeline,
  EmptyWidget,
  DashboardSkeleton,
} from "@/components/dashboard";
import type { PriorityTask, CompetencyItem, ActivityItem, CompetencyStatus, TaskUrgency } from "@/components/dashboard";

interface StudentDashboardData {
  batch: string;
  kpis: {
    assignedCompetencies: number;
    completed: number;
    pendingAssessment: number;
    awaitingReview: number;
    awaitingSignature: number;
    remediationRequired: number;
  };
  tasks: PriorityTask[];
  competencies: CompetencyItem[];
  progress: {
    overall: number;
    subjects: { subject: string; completed: number; total: number; color?: "blue" | "green" | "purple" | "orange" | "primary" }[];
    distribution: { label: string; value: number; className: string }[];
  };
  activity: ActivityItem[];
}

function competencyStatus(status: AssessmentStatus | undefined): CompetencyStatus {
  switch (status) {
    case "Completed":
      return "Completed";
    case "In Progress":
      return "In Progress";
    case "Submitted":
    case "Faculty Reviewed":
    case "Waiting for Student Acknowledgement":
      return "Awaiting Review";
    case "Reattempt Scheduled":
      return "Overdue";
    default:
      return "Pending";
  }
}

function progressFor(status: AssessmentStatus | undefined): number {
  switch (status) {
    case "Completed":
      return 100;
    case "Waiting for Student Acknowledgement":
    case "Faculty Reviewed":
    case "Submitted":
      return 85;
    case "In Progress":
      return 50;
    case "Reattempt Scheduled":
      return 40;
    default:
      return 0;
  }
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [student, myCompetencies, assessments, attempts, progressRows] = await Promise.all([
        getStudent(),
        getMyCompetencies(),
        getMyAssessments(),
        getMyAssessmentAttempts(),
        getProgress(),
      ]);

      const assessmentByAssignmentId = new Map<string, Assessment>(
        assessments.map((a) => [a.competencyAssignmentId, a])
      );

      const kpis = {
        assignedCompetencies: myCompetencies.length,
        completed: assessments.filter((a) => a.currentStatus === "Completed").length,
        pendingAssessment: myCompetencies.filter((c) => {
          const status = assessmentByAssignmentId.get(c.id)?.currentStatus;
          return !status || status === "Draft" || status === "Assigned" || status === "In Progress";
        }).length,
        awaitingReview: assessments.filter(
          (a) => a.currentStatus === "Submitted" || a.currentStatus === "Faculty Reviewed"
        ).length,
        awaitingSignature: assessments.filter((a) => a.currentStatus === "Waiting for Student Acknowledgement").length,
        remediationRequired: assessments.filter((a) => a.currentStatus === "Reattempt Scheduled").length,
      };

      const tasks: PriorityTask[] = [];
      for (const assignment of myCompetencies) {
        const assessment = assessmentByAssignmentId.get(assignment.id);
        const status = assessment?.currentStatus;
        const competencyLabel = assignment.competency
          ? `${assignment.competency.competencyCode} - ${assignment.competency.competencyTitle}`
          : "Competency";
        const subject = assignment.competency?.subjectName ?? "—";

        if (status === "Reattempt Scheduled") {
          tasks.push({
            id: `${assignment.id}-remediation`,
            action: "Review Remediation",
            competency: competencyLabel,
            subject,
            dueLabel: "Action needed",
            urgency: "overdue" as TaskUrgency,
            actionLabel: "Review",
            actionHref: "/student/my-competencies",
          });
        } else if (status === "Waiting for Student Acknowledgement") {
          tasks.push({
            id: `${assignment.id}-ack`,
            action: "Acknowledge Feedback",
            competency: competencyLabel,
            subject,
            dueLabel: "Feedback ready",
            urgency: "today" as TaskUrgency,
            actionLabel: "Acknowledge",
            actionHref: "/student/feedback",
          });
        } else if (status === "In Progress") {
          tasks.push({
            id: `${assignment.id}-inprogress`,
            action: "Complete Assessment",
            competency: competencyLabel,
            subject,
            dueLabel: "In progress",
            urgency: "upcoming" as TaskUrgency,
            actionLabel: "Resume",
            actionHref: "/student/my-competencies",
          });
        }
      }

      const competencies: CompetencyItem[] = myCompetencies.map((assignment) => {
        const assessment = assessmentByAssignmentId.get(assignment.id);
        return {
          id: assignment.id,
          code: assignment.competency?.competencyCode ?? "—",
          title: assignment.competency?.competencyTitle ?? "Untitled competency",
          subject: assignment.competency?.subjectName ?? "—",
          status: competencyStatus(assessment?.currentStatus),
          progress: progressFor(assessment?.currentStatus),
          href: "/student/my-competencies",
        };
      });

      const overall =
        progressRows.reduce((sum, r) => sum + r.total, 0) > 0
          ? Math.round(
              (progressRows.reduce((sum, r) => sum + r.completed, 0) /
                progressRows.reduce((sum, r) => sum + r.total, 0)) *
                100
            )
          : 0;

      const inProgressCount = myCompetencies.filter(
        (c) => assessmentByAssignmentId.get(c.id)?.currentStatus === "In Progress"
      ).length;

      const activity: ActivityItem[] = attempts
        .slice()
        .sort((a, b) => b.facultySignedAt.localeCompare(a.facultySignedAt))
        .slice(0, 6)
        .map((attempt) => ({
          id: attempt.id,
          title: attempt.studentAcknowledged
            ? `Feedback acknowledged — ${attempt.decision}`
            : `Faculty review received — ${attempt.decision}`,
          timestamp: new Date(attempt.facultySignedAt).toLocaleString(),
          icon: attempt.studentAcknowledged ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <ClipboardCheck className="h-4 w-4" />
          ),
          status: attempt.studentAcknowledged ? "Acknowledged" : "Awaiting your review",
          statusVariant: attempt.studentAcknowledged ? "success" : "info",
        }));

      setData({
        batch: student.batch,
        kpis,
        tasks,
        competencies,
        progress: {
          overall,
          subjects: progressRows.map((r, i) => ({
            subject: r.subject,
            completed: r.completed,
            total: r.total,
            color: (["blue", "green", "purple", "orange", "primary"] as const)[i % 5],
          })),
          distribution: [
            { label: "Completed", value: kpis.completed, className: "bg-green-500" },
            { label: "In Progress", value: inProgressCount, className: "bg-blue-500" },
            { label: "Awaiting Review", value: kpis.awaitingReview + kpis.awaitingSignature, className: "bg-purple-500" },
            { label: "Remediation", value: kpis.remediationRequired, className: "bg-red-500" },
          ],
        },
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

  if (!data) return null;

  const fullName = user ? `${user.firstName} ${user.lastName}` : "Student";

  const quickActions = [
    { label: "Resume Assessment", href: "/student/my-competencies", icon: <Play className="h-4 w-4" />, accent: "primary" as const },
    { label: "Upload Evidence", href: "/student/evidence", icon: <Upload className="h-4 w-4" />, accent: "blue" as const },
    { label: "View Competencies", href: "/student/my-competencies", icon: <BookOpen className="h-4 w-4" />, accent: "green" as const },
    { label: "View Feedback", href: "/student/feedback", icon: <MessageSquare className="h-4 w-4" />, accent: "orange" as const },
    { label: "Assessment History", href: "/student/assessment-history", icon: <History className="h-4 w-4" />, accent: "purple" as const },
    { label: "Learning Resources", href: "/student/my-competencies", icon: <Library className="h-4 w-4" />, accent: "primary" as const },
  ];

  const sortTasks = (tasks: PriorityTask[]) =>
    [...tasks].sort((a, b) => {
      const order = { overdue: 0, today: 1, tomorrow: 2, upcoming: 3 } as const;
      return order[a.urgency] - order[b.urgency];
    });

  const sortedTasks = sortTasks(data.tasks);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={`Welcome back, ${user?.firstName ?? "Student"}`}
        description="Here is your learning progress at a glance"
        actions={
          <a
            href="/student/my-competencies"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <GraduationCap className="h-4 w-4" />
            My Competencies
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        }
        identity={
          <>
            <IdentityItem label="Student" value={fullName} />
            <IdentityItem label="Batch" value={data.batch} />
            <IdentityItem label="Completion" value={`${data.progress.overall}%`} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Assigned Competencies" value={String(data.kpis.assignedCompetencies)} icon={<BookOpen className="h-5 w-5" />} color="blue" />
        <MetricCard label="Completed" value={String(data.kpis.completed)} icon={<CheckCircle2 className="h-5 w-5" />} color="green" />
        <MetricCard label="Pending Assessment" value={String(data.kpis.pendingAssessment)} icon={<Clock className="h-5 w-5" />} color="orange" />
        <MetricCard label="Awaiting Faculty Review" value={String(data.kpis.awaitingReview)} icon={<Hourglass className="h-5 w-5" />} color="purple" />
        <MetricCard label="Awaiting My Signature" value={String(data.kpis.awaitingSignature)} icon={<PenLine className="h-5 w-5" />} color="yellow" />
        <MetricCard label="Remediation Required" value={String(data.kpis.remediationRequired)} icon={<AlertTriangle className="h-5 w-5" />} color="red" />
      </div>

      <DashboardGrid>
        <DashboardCol span={8}>
          <SectionCard
            title="Priority Tasks"
            description="Things that need your action"
            action={
              <Link href="/student/my-competencies" className="text-xs font-medium text-primary hover:underline">
                View all
              </Link>
            }
          >
            {sortedTasks.length === 0 ? (
              <EmptyWidget
                title="No pending tasks"
                description="You're all caught up. New tasks will appear here."
                icon={<ListChecks className="h-5 w-5" />}
              />
            ) : (
              <div className="space-y-2">
                {sortedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </SectionCard>
        </DashboardCol>

        <DashboardCol span={4}>
          <SectionCard
            title="Learning Progress"
            description="Your completion across subjects"
            action={
              <Link href="/student/progress" className="text-xs font-medium text-primary hover:underline">
                Details
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

        <DashboardCol span={12}>
          <SectionCard
            title="Competencies"
            description="Your assigned competencies and their status"
            action={
              <Link href="/student/my-competencies" className="text-xs font-medium text-primary hover:underline">
                View all
              </Link>
            }
          >
            {data.competencies.length === 0 ? (
              <EmptyWidget
                title="No competencies yet"
                description="Competencies assigned to you will show up here."
                icon={<BookOpen className="h-5 w-5" />}
              />
            ) : (
              <div className="space-y-2">
                {data.competencies.map((comp) => (
                  <CompetencyCard key={comp.id} competency={comp} />
                ))}
              </div>
            )}
          </SectionCard>
        </DashboardCol>

        <DashboardCol span={12}>
          <SectionCard
            title="Recent Activity"
            description="Your latest faculty feedback"
            action={
              <Link href="/student/assessment-history" className="text-xs font-medium text-primary hover:underline">
                History
              </Link>
            }
          >
            {data.activity.length === 0 ? (
              <EmptyWidget
                title="No activity yet"
                description="Your assessment and evidence activity will appear here."
                icon={<FileText className="h-5 w-5" />}
              />
            ) : (
              <ActivityTimeline items={data.activity} />
            )}
          </SectionCard>
        </DashboardCol>

        <DashboardCol span={12}>
          <SectionCard
            title="Quick Actions"
            description="Common workflows you can jump into"
            bodyClassName="pt-2"
          >
            <QuickActions items={quickActions} />
          </SectionCard>
        </DashboardCol>
      </DashboardGrid>
    </div>
  );
}
