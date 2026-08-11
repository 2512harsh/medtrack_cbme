"use client";

import React, { useState, useEffect } from "react";
import { Users, ClipboardCheck, TrendingUp, Clock, ClipboardList, BookOpen, ShieldCheck, ListChecks, Timer, ArrowRight } from "lucide-react";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { ErrorState } from "@/components/shared/ErrorState";
import Link from "next/link";
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
import type { PriorityTask, CompetencyItem, ActivityItem, QuickActionItem } from "@/components/dashboard";

interface DashboardData {
  stats: {
    assignedStudents: string;
    pendingReviews: string;
    completedReviews: string;
    awaitingSignature: string;
    remediationCases: string;
    overdueReviews: string;
  };
  queue: PriorityTask[];
  competencies: CompetencyItem[];
  activity: ActivityItem[];
}

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

  const fetchData = () => {
    setIsLoading(true);
    setError(null);
    try {
      setData({
        stats: {
          assignedStudents: "24",
          pendingReviews: "7",
          completedReviews: "89",
          awaitingSignature: "5",
          remediationCases: "3",
          overdueReviews: "2",
        },
        queue: [
          { id: "q1", action: "Review Assessment", competency: "PY3.2 - Nerve Physiology", subject: "Physiology", dueLabel: "Today", urgency: "today", attempt: "Attempt 1", actionLabel: "Review", actionHref: "/faculty/assessment-queue" },
          { id: "q2", action: "Review Assessment", competency: "AN8.2 - Upper Limb", subject: "Anatomy", dueLabel: "Yesterday", urgency: "overdue", attempt: "Attempt 1", actionLabel: "Review", actionHref: "/faculty/assessment-queue" },
          { id: "q3", action: "Complete Assessment", competency: "BI2.1 - Protein Structure", subject: "Biochemistry", dueLabel: "Tomorrow", urgency: "tomorrow", attempt: "Attempt 1", actionLabel: "Start", actionHref: "/faculty/assessment-queue" },
          { id: "q4", action: "Review Assessment", competency: "AN12.3 - Hand Anatomy", subject: "Anatomy", dueLabel: "Aug 14, 2026", urgency: "upcoming", attempt: "Attempt 2", actionLabel: "Review", actionHref: "/faculty/assessment-queue" },
        ],
        competencies: [
          { id: "fc1", code: "AN8.2", title: "Upper Limb - Bones & Joints", subject: "Anatomy", status: "Approved", progress: 100, href: "/faculty/assigned-competencies" },
          { id: "fc2", code: "AN12.3", title: "Hand Anatomy", subject: "Anatomy", status: "In Progress", progress: 65, href: "/faculty/assigned-competencies" },
          { id: "fc3", code: "PY3.2", title: "Nerve Physiology", subject: "Physiology", status: "Awaiting Review", progress: 80, href: "/faculty/assigned-competencies" },
          { id: "fc4", code: "PY5.1", title: "Cardiac Cycle", subject: "Physiology", status: "Overdue", progress: 40, href: "/faculty/assigned-competencies" },
          { id: "fc5", code: "BI2.1", title: "Protein Structure", subject: "Biochemistry", status: "Pending", progress: 0, href: "/faculty/assigned-competencies" },
        ],
        activity: [
          { id: "a1", title: "Aarav Patel assessed for AN8.1 - Meets Expectations", timestamp: "Aug 4, 2026", icon: <ClipboardCheck className="h-4 w-4" />, status: "Meets Expectations", statusVariant: "success" },
          { id: "a2", title: "Priya Sharma assessed for PY3.1 - Exceeds Expectations", timestamp: "Aug 3, 2026", icon: <TrendingUp className="h-4 w-4" />, status: "Exceeds Expectations", statusVariant: "info" },
          { id: "a3", title: "Rohan Verma assessed for BI1.1 - Meets Expectations", timestamp: "Aug 2, 2026", icon: <ClipboardCheck className="h-4 w-4" />, status: "Meets Expectations", statusVariant: "success" },
          { id: "a4", title: "Sneha Reddy assessed for AN12.1 - Needs Remediation", timestamp: "Aug 1, 2026", icon: <Clock className="h-4 w-4" />, status: "Needs Remediation", statusVariant: "danger" },
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
            <IdentityItem label="Department" value="Anatomy" />
            <IdentityItem label="Specialization" value="Gross Anatomy" />
            <IdentityItem label="Pending Reviews" value={data.stats.pendingReviews} />
            <IdentityItem label="Remediation Cases" value={data.stats.remediationCases} />
          </>
        }
      />

      {/* KPI row — 6 cards on desktop */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Assigned Students" value={data.stats.assignedStudents} icon={<Users className="h-5 w-5" />} color="blue" />
        <MetricCard label="Pending Reviews" value={data.stats.pendingReviews} icon={<ClipboardCheck className="h-5 w-5" />} color="orange" sub="2 overdue" />
        <MetricCard label="Completed Reviews" value={data.stats.completedReviews} icon={<TrendingUp className="h-5 w-5" />} color="green" trend="+12 this month" trendUp />
        <MetricCard label="Awaiting Signature" value={data.stats.awaitingSignature} icon={<ShieldCheck className="h-5 w-5" />} color="purple" sub="Student acknowledgment" />
        <MetricCard label="Remediation Cases" value={data.stats.remediationCases} icon={<Clock className="h-5 w-5" />} color="red" sub="1 due today" />
        <MetricCard label="Overdue Reviews" value={data.stats.overdueReviews} icon={<Timer className="h-5 w-5" />} color="yellow" sub="Review now" />
      </div>

      <DashboardGrid>
        {/* Assessment Queue (8 cols) + Assigned Competencies (4 cols) */}
        <DashboardCol span={8}>
          <SectionCard
            title="Assessment Queue"
            description="Pending and in-progress assessments, sorted by urgency"
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
