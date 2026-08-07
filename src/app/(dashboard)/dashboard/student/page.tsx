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
  FileText,
  CheckCircle2,
  Hourglass,
  ShieldCheck,
  Bell,
  CalendarClock,
  XCircle,
  Megaphone,
  PenLine,
  AlertTriangle,
  GraduationCap,
  TrendingUp,
  Timer,
  Target,
  ListChecks,
  ArrowRight,
  Play,
} from "lucide-react";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { ErrorState } from "@/components/shared/ErrorState";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  AnalyticsWidget,
  ActivityTimeline,
  NotificationWidget,
  EmptyWidget,
  DashboardSkeleton,
} from "@/components/dashboard";
import type {
  PriorityTask,
  CompetencyItem,
  ActivityItem,
  NotificationItem,
} from "@/components/dashboard";

interface StudentDashboardData {
  identity: {
    batch: string;
    academicYear: string;
    semester: string;
    department: string;
    mentor: string;
    rotation: string;
    gpa?: string;
  };
  kpis: {
    assignedCompetencies: string;
    completed: string;
    pendingAssessment: string;
    awaitingReview: string;
    awaitingSignature: string;
    remediationRequired: string;
    averageScore: string;
    weeklyHours: string;
  };
  tasks: PriorityTask[];
  competencies: CompetencyItem[];
  progress: {
    overall: number;
    subjects: { subject: string; completed: number; total: number; color?: "blue" | "green" | "purple" | "orange" | "primary" }[];
    distribution: { label: string; value: number; className: string }[];
  };
  analytics: {
    trend: { label: string; value: number }[];
    stats: { label: string; value: string | number; icon?: React.ReactNode; hint?: string }[];
  };
  activity: ActivityItem[];
  notifications: NotificationItem[];
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = () => {
    setIsLoading(true);
    setError(null);
    try {
      setData({
        identity: {
          batch: "MBBS 2024",
          academicYear: "2025-2026",
          semester: "Semester 3",
          department: "Pre-Clinical",
          mentor: "Dr. Rajesh Kumar",
          rotation: "Anatomy · Unit 2",
          gpa: "8.4",
        },
        kpis: {
          assignedCompetencies: "18",
          completed: "12",
          pendingAssessment: "3",
          awaitingReview: "2",
          awaitingSignature: "2",
          remediationRequired: "1",
          averageScore: "82%",
          weeklyHours: "14h",
        },
        tasks: [
          {
            id: "t1",
            action: "Review Remediation",
            competency: "BI2.1 - Protein Structure",
            subject: "Biochemistry",
            dueLabel: "Aug 8, 2026",
            urgency: "overdue",
            attempt: "Attempt 2",
            actionLabel: "Review",
            actionHref: "/student/my-competencies",
          },
          {
            id: "t2",
            action: "Complete Assessment",
            competency: "PY5.1 - Cardiac Cycle",
            subject: "Physiology",
            dueLabel: "Today",
            urgency: "today",
            attempt: "Attempt 1",
            actionLabel: "Resume",
            actionHref: "/student/my-competencies",
          },
          {
            id: "t3",
            action: "Acknowledge Feedback",
            competency: "PY3.2 - Nerve Physiology",
            subject: "Physiology",
            dueLabel: "Tomorrow",
            urgency: "tomorrow",
            attempt: "Feedback ready",
            actionLabel: "Acknowledge",
            actionHref: "/student/feedback",
          },
          {
            id: "t4",
            action: "Upload Evidence",
            competency: "AN8.2 - Upper Limb",
            subject: "Anatomy",
            dueLabel: "Aug 14, 2026",
            urgency: "upcoming",
            attempt: "Attempt 1",
            actionLabel: "Upload",
            actionHref: "/student/evidence",
          },
        ],
        competencies: [
          { id: "c1", code: "AN8.2", title: "Upper Limb - Bones & Joints", subject: "Anatomy", status: "Completed", progress: 100, href: "/student/my-competencies" },
          { id: "c2", code: "AN12.3", title: "Hand Anatomy", subject: "Anatomy", status: "Approved", progress: 100, href: "/student/my-competencies" },
          { id: "c3", code: "PY3.2", title: "Nerve Physiology", subject: "Physiology", status: "In Progress", progress: 60, href: "/student/my-competencies" },
          { id: "c4", code: "PY5.1", title: "Cardiac Cycle", subject: "Physiology", status: "Awaiting Review", progress: 85, href: "/student/my-competencies" },
          { id: "c5", code: "BI2.1", title: "Protein Structure", subject: "Biochemistry", status: "Overdue", progress: 40, href: "/student/my-competencies" },
          { id: "c6", code: "BI3.4", title: "Enzyme Kinetics", subject: "Biochemistry", status: "Pending", progress: 0, href: "/student/my-competencies" },
        ],
        progress: {
          overall: 67,
          subjects: [
            { subject: "Anatomy", completed: 8, total: 10, color: "blue" },
            { subject: "Physiology", completed: 3, total: 8, color: "green" },
            { subject: "Biochemistry", completed: 2, total: 7, color: "purple" },
          ],
          distribution: [
            { label: "Completed", value: 12, className: "bg-green-500" },
            { label: "In Progress", value: 3, className: "bg-blue-500" },
            { label: "Pending", value: 1, className: "bg-orange-500" },
            { label: "Awaiting Review", value: 2, className: "bg-purple-500" },
          ],
        },
        analytics: {
          trend: [
            { label: "W1", value: 2 },
            { label: "W2", value: 3 },
            { label: "W3", value: 2 },
            { label: "W4", value: 5 },
            { label: "W5", value: 4 },
            { label: "W6", value: 6 },
            { label: "W7", value: 5 },
            { label: "W8", value: 7 },
          ],
          stats: [
            { label: "Avg. Score", value: "82%", icon: <TrendingUp className="h-3.5 w-3.5" />, hint: "+4% vs last week" },
            { label: "Weekly Hours", value: "14h", icon: <Clock className="h-3.5 w-3.5" />, hint: "Target 12h" },
            { label: "This Week", value: "3", icon: <Target className="h-3.5 w-3.5" />, hint: "competencies" },
            { label: "Velocity", value: "2.1/wk", icon: <Timer className="h-3.5 w-3.5" />, hint: "completion rate" },
            { label: "Completed", value: "12", icon: <CheckCircle2 className="h-3.5 w-3.5" />, hint: "of 18 assigned" },
            { label: "Awaiting Review", value: "2", icon: <Hourglass className="h-3.5 w-3.5" />, hint: "faculty review" },
          ],
        },
        activity: [
          { id: "a1", title: "Assessment submitted", timestamp: "Today · 09:41 AM", icon: <ClipboardCheck className="h-4 w-4" />, status: "Submitted", statusVariant: "info" },
          { id: "a2", title: "Evidence approved by Dr. Rajesh Kumar", timestamp: "Yesterday · 04:12 PM", icon: <ShieldCheck className="h-4 w-4" />, status: "Approved", statusVariant: "success" },
          { id: "a3", title: "Feedback received for Nerve Physiology", timestamp: "Aug 4, 2026 · 11:03 AM", icon: <MessageSquare className="h-4 w-4" />, status: "New" },
          { id: "a4", title: "Competency completed: Hand Anatomy", timestamp: "Aug 2, 2026 · 03:47 PM", icon: <CheckCircle2 className="h-4 w-4" />, status: "Completed", statusVariant: "success" },
        ],
        notifications: [
          { id: "n1", type: "deadline", title: "Assessment due today", message: "PY5.1 Cardiac Cycle assessment closes at 11:59 PM tonight.", timestamp: "2 hours ago", unread: true, icon: <CalendarClock className="h-4 w-4" /> },
          { id: "n2", type: "feedback", title: "New faculty feedback", message: "Dr. Sunita Devi posted feedback on Nerve Physiology.", timestamp: "5 hours ago", unread: true, icon: <MessageSquare className="h-4 w-4" /> },
          { id: "n3", type: "evidence", title: "Evidence rejected", message: "The uploaded evidence for AN8.2 needs revision.", timestamp: "Yesterday", unread: true, icon: <XCircle className="h-4 w-4" /> },
          { id: "n4", type: "assessment", title: "Assessment reminder", message: "Enzyme Kinetics assessment starts next week.", timestamp: "2 days ago", unread: false, icon: <Bell className="h-4 w-4" /> },
          { id: "n5", type: "announcement", title: "Platform announcement", message: "New learning resources are available in the library.", timestamp: "3 days ago", unread: false, icon: <Megaphone className="h-4 w-4" /> },
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
            <IdentityItem label="Batch" value={data.identity.batch} />
            <IdentityItem label="Academic Year" value={data.identity.academicYear} />
            <IdentityItem label="Semester" value={data.identity.semester} />
            <IdentityItem label="Department" value={data.identity.department} />
            <IdentityItem label="Assigned Mentor" value={data.identity.mentor} />
            <IdentityItem label="Current Rotation" value={data.identity.rotation} />
            {data.identity.gpa && <IdentityItem label="Current GPA" value={data.identity.gpa} />}
            <IdentityItem label="Completion" value={`${data.progress.overall}%`} />
          </>
        }
      />

      {/* KPI row — 6 cards on desktop */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Assigned Competencies" value={data.kpis.assignedCompetencies} icon={<BookOpen className="h-5 w-5" />} color="blue" sub="12 completed · 6 pending" />
        <MetricCard label="Completed" value={data.kpis.completed} icon={<CheckCircle2 className="h-5 w-5" />} color="green" trend="+3 this month" trendUp />
        <MetricCard label="Pending Assessment" value={data.kpis.pendingAssessment} icon={<Clock className="h-5 w-5" />} color="orange" sub="1 due today" />
        <MetricCard label="Awaiting Faculty Review" value={data.kpis.awaitingReview} icon={<Hourglass className="h-5 w-5" />} color="purple" sub="2 in review" />
        <MetricCard label="Awaiting My Signature" value={data.kpis.awaitingSignature} icon={<PenLine className="h-5 w-5" />} color="yellow" sub="Acknowledge feedback" />
        <MetricCard label="Remediation Required" value={data.kpis.remediationRequired} icon={<AlertTriangle className="h-5 w-5" />} color="red" sub="Schedule a session" />
      </div>

      <DashboardGrid>
        {/* Priority Tasks (8 cols) + Progress Overview (4 cols) */}
        <DashboardCol span={8}>
          <SectionCard
            title="Priority Tasks"
            description="Sorted by urgency — overdue, due today, due tomorrow"
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

        {/* Competencies (8 cols) + Notifications (4 cols) */}
        <DashboardCol span={8}>
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

        <DashboardCol span={4}>
          <SectionCard
            title="Notifications"
            description="Alerts, feedback and reminders"
            action={
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Bell className="h-3.5 w-3.5" />
                {data.notifications.filter((n) => n.unread).length} unread
              </span>
            }
          >
            <NotificationWidget
              items={data.notifications}
              onViewAll={() => router.push("/assessment/notifications")}
              onOpen={() => router.push("/assessment/notifications")}
            />
          </SectionCard>
        </DashboardCol>

        {/* Activity Timeline (6 cols) + Analytics (6 cols) */}
        <DashboardCol span={6}>
          <SectionCard
            title="Recent Activity"
            description="Your latest learning activity"
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

        <DashboardCol span={6}>
          <SectionCard
            title="Analytics"
            description="Weekly progress trend and key insights"
            action={
              <Link href="/student/progress" className="text-xs font-medium text-primary hover:underline">
                Insights
              </Link>
            }
          >
            <AnalyticsWidget trend={data.analytics.trend} stats={data.analytics.stats} />
          </SectionCard>
        </DashboardCol>

        {/* Quick Actions — full width at the bottom */}
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
