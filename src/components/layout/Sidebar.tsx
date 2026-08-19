"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  ClipboardList,
  BarChart3,
  Bell,
  Settings,
  ChevronRight,
  X,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/features/authentication/hooks/useAuth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["Super Admin", "Dean", "HOD", "Faculty", "Student"],
  },
  {
    title: "Platform Admin",
    href: "/super-admin/institutions",
    icon: ShieldCheck,
    roles: ["Super Admin"],
    children: [
      { title: "Institutions", href: "/super-admin/institutions", roles: ["Super Admin"] },
      { title: "Departments", href: "/super-admin/departments", roles: ["Super Admin"] },
      { title: "Competency Import", href: "/super-admin/competency-import", roles: ["Super Admin"] },
      { title: "Platform Monitoring", href: "/super-admin/monitoring", roles: ["Super Admin"] },
      { title: "LMS Integration", href: "/integrations/lms", roles: ["Super Admin"] },
      { title: "Billing & Subscriptions", href: "/billing", roles: ["Super Admin"] },
      { title: "Institutional Branding", href: "/super-admin/branding", roles: ["Super Admin"] },
      { title: "System Settings", href: "/super-admin/system-settings", roles: ["Super Admin"] },
    ],
  },
  {
    title: "Curriculum",
    href: "/curriculum",
    icon: BookOpen,
    roles: ["Super Admin", "Dean", "HOD", "Faculty", "Student"],
    children: [
      { title: "Streams", href: "/curriculum/streams", roles: ["Super Admin"] },
      { title: "Professional Years", href: "/curriculum/professional-years", roles: ["Super Admin", "Dean", "HOD"] },
      { title: "Subjects", href: "/curriculum/subjects", roles: ["Super Admin", "Dean", "HOD", "Faculty", "Student"] },
      { title: "Topics", href: "/curriculum/topics", roles: ["Super Admin", "Dean", "HOD", "Faculty", "Student"] },
      { title: "Competencies", href: "/curriculum/competencies", roles: ["Super Admin", "Dean", "HOD", "Faculty", "Student"] },
      { title: "Excel Import", href: "/curriculum/import", roles: ["Super Admin"] },
    ],
  },
  {
    title: "Faculty",
    href: "/dean/faculty",
    icon: Users,
    roles: ["Super Admin", "Dean", "HOD", "Faculty"],
    children: [
      { title: "Faculty Management", href: "/dean/faculty", roles: ["Dean", "HOD"] },
      { title: "HOD Management", href: "/dean/hod", roles: ["Dean"] },
      { title: "Assigned Students", href: "/faculty/assigned-students", roles: ["Faculty"] },
      { title: "Assigned Competencies", href: "/faculty/assigned-competencies", roles: ["Faculty"] },
      { title: "Assessment Queue", href: "/faculty/assessment-queue", roles: ["Faculty"] },
      { title: "Assessment Form", href: "/faculty/assessment-form", roles: ["Faculty"] },
    ],
  },
  {
    title: "Students",
    href: "/dean/students",
    icon: GraduationCap,
    roles: ["Super Admin", "Dean", "HOD", "Faculty", "Student"],
    children: [
      { title: "Student Management", href: "/dean/students", roles: ["Dean", "HOD"] },
      { title: "Student Import", href: "/dean/students/import", roles: ["Dean", "HOD"] },
      { title: "Student Allocation", href: "/dean/allocations", roles: ["Dean", "HOD"] },
      { title: "Allocation History", href: "/dean/allocation-history", roles: ["Dean", "HOD"] },
      { title: "My Competencies", href: "/student/my-competencies", roles: ["Student"] },
      { title: "My Progress", href: "/student/progress", roles: ["Student"] },
      { title: "Evidence Upload", href: "/student/evidence", roles: ["Student"] },
    ],
  },
  {
    title: "Assessments",
    href: "/assessment/attempt-timeline",
    icon: ClipboardList,
    roles: ["Dean", "HOD", "Faculty", "Student"],
    children: [
      { title: "Assessment History", href: "/student/assessment-history", roles: ["Student"] },
      { title: "Assessment History", href: "/faculty/assessment-history", roles: ["Faculty"] },
      { title: "Remediation", href: "/assessment/remediation-workflow", roles: ["Faculty", "HOD"] },
      { title: "Feedback", href: "/student/feedback", roles: ["Student"] },
      { title: "Acknowledgement", href: "/student/acknowledgement", roles: ["Student"] },
    ],
  },
  {
    title: "Reports",
    href: "/reports/student-report",
    icon: BarChart3,
    roles: ["Super Admin", "Dean", "HOD", "Faculty", "Student"],
    children: [
      { title: "Student Report", href: "/reports/student-report", roles: ["Dean", "HOD", "Faculty", "Student"] },
      { title: "Faculty Report", href: "/reports/faculty-report", roles: ["Dean", "HOD", "Faculty"] },
      { title: "Department Report", href: "/reports/department-report", roles: ["Dean", "HOD", "Super Admin"] },
      { title: "Competency Completion", href: "/reports/competency-completion", roles: ["Faculty"] },
      { title: "Remediation Report", href: "/reports/remediation-report", roles: ["Faculty"] },
      { title: "Audit Report", href: "/reports/audit-report", roles: ["Super Admin"] },
    ],
  },
  {
    title: "Dean Management",
    href: "/dean/faculty-assignment",
    icon: UserCheck,
    roles: ["Dean", "HOD"],
    children: [
      { title: "Faculty Assignment", href: "/dean/faculty-assignment", roles: ["Dean", "HOD"] },
      { title: "Competency Assignment", href: "/dean/competency-assignment", roles: ["Dean", "HOD"] },
    ],
  },
  {
    title: "Notifications",
    href: "/assessment/notifications",
    icon: Bell,
    roles: ["Super Admin", "HOD", "Faculty", "Student"],
  },
  {
    title: "Settings",
    href: "/settings/profile",
    icon: Settings,
    roles: ["Super Admin", "Dean", "HOD", "Faculty", "Student"],
    children: [
      { title: "Profile", href: "/settings/profile", roles: ["Super Admin", "Dean", "HOD", "Faculty", "Student"] },
    ],
  },
];

function NavItem({
  item,
  pathname,
  userRole,
  isMobile = false,
  onNavigate,
}: {
  item: (typeof navigation)[0];
  pathname: string;
  userRole: string | null;
  isMobile?: boolean;
  onNavigate?: () => void;
}) {
  const hasAccess = item.roles.includes(userRole || "");
  if (!hasAccess) return null;

  const displayTitle =
    item.title === "Dean Management" && userRole === "HOD" ? "HOD Management" : item.title;

  const isChildActive = item.children?.some((c) => {
    if (c.href.includes("[id]")) {
      const basePath = c.href.replace("/[id]", "");
      return pathname.startsWith(basePath + "/") || pathname === basePath;
    }
    return pathname === c.href || pathname.startsWith(c.href + "/");
  }) ?? false;

  const isActive = pathname === item.href || isChildActive;
  const hasChildren = item.children && item.children.some((c) => c.roles.includes(userRole || ""));

  // Some sections list a role at the top level for visibility even though none of
  // their children apply to it (e.g. "Students" lists Faculty/Super Admin, but every
  // child there is Dean/HOD/Student-only). With no reachable child, there's nothing
  // to show and the group's own href is often role-restricted - hide it entirely
  // rather than falling through to a link that would 403.
  if (item.children && !hasChildren) {
    return null;
  }

  if (hasChildren) {
    // The parent href is often only valid for a subset of the roles that can see
    // this section (e.g. "/dean/students" is Dean/HOD-only, but Faculty/Student can
    // also see the "Students" section for their own child links). Only make the
    // header itself clickable when one of the visible children actually points there
    // - otherwise it's just a non-interactive grouping label.
    const parentHrefIsNavigable = item.children?.some(
      (c) => c.roles.includes(userRole || "") && c.href === item.href
    );
    const parentLink = parentHrefIsNavigable ? (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <span>{displayTitle}</span>
        {isMobile && <ChevronRight className="ml-auto h-4 w-4" />}
      </Link>
    ) : (
      <span
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <span>{displayTitle}</span>
        {isMobile && <ChevronRight className="ml-auto h-4 w-4" />}
      </span>
    );
    return (
      <div className="space-y-0.5">
        {parentLink}
        <div className="ml-4 space-y-0.5 border-l border-border pl-3">
          {item.children
            ?.filter((c) => c.roles.includes(userRole || ""))
            .map((child) => {
              const isNestedActive = child.href.includes("[id]")
                ? pathname.startsWith(child.href.replace("/[id]", "") + "/") || pathname === child.href.replace("/[id]", "")
                : pathname === child.href || pathname.startsWith(child.href + "/");

              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors",
                    isNestedActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {child.title}
                </Link>
              );
            })}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span>{displayTitle}</span>
    </Link>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { userRole, user } = useAuth();

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="left" className="w-72 p-0 max-h-screen">
          <div className="flex h-full flex-col">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <Link href="/dashboard" className="flex items-center gap-2 font-bold text-base">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>MedTrack CBME</span>
              </Link>
              <SheetTrigger
                render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Close sidebar" />}
              >
                <X className="h-5 w-5" />
              </SheetTrigger>
            </div>

            <nav className="flex-1 space-y-4 overflow-y-auto p-3" aria-label="Main navigation">
              <div>
                <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Navigation
                </h3>
                <div className="space-y-1">
                  {navigation.map((item) => (
                    <NavItem
                      key={item.title}
                      item={item}
                      pathname={pathname}
                      userRole={userRole}
                      isMobile
                      onNavigate={onClose}
                    />
                  ))}
                </div>
              </div>
            </nav>

            <div className="border-t p-3">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-medium text-xs">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate capitalize">{userRole?.toLowerCase()}</p>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <aside className="hidden md:flex md:w-56 md:flex-col bg-sidebar border-r h-screen sticky top-0 z-40">
        <div className="flex h-14 items-center px-3 border-b">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-base">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>MedTrack CBME</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto p-3" aria-label="Main navigation">
          <div>
            <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Navigation
            </h3>
            <div className="space-y-1">
              {navigation.map((item) => (
                <NavItem
                  key={item.title}
                  item={item}
                  pathname={pathname}
                  userRole={userRole}
                />
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t p-3">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-medium text-xs">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{userRole?.toLowerCase()}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
