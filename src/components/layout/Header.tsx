"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bell, LogOut, User, Settings, ChevronLeft, Menu } from "lucide-react";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { user, userRole, logout } = useAuth();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogout = async () => {
    setLogoutDialogOpen(false);
    await logout();
  };

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return [{ title: "Dashboard", href: "/dashboard" }];

    const breadcrumbs =
      segments[0] === "dashboard"
        ? []
        : [{ title: "Dashboard", href: "/dashboard" }];
    let currentPath = "";

    const routeLabels: Record<string, string> = {
      dashboard: "Dashboard",
      curriculum: "Curriculum",
      streams: "Streams",
      "professional-years": "Professional Years",
      subjects: "Subjects",
      topics: "Topics",
      competencies: "Competencies",
      import: "Excel Import",
      faculty: "Faculty",
      management: "Management",
      "assigned-students": "Assigned Students",
      "assigned-competencies": "Assigned Competencies",
      students: "Students",
      allocation: "Student Allocation",
      "allocation-history": "Allocation History",
      "assessment-queue": "Assessment Queue",
      "my-competencies": "My Competencies",
      progress: "My Progress",
      assessments: "Assessments",
      queue: "Assessment Queue",
      history: "Assessment History",
      remediation: "Remediation",
      reports: "Reports",
      "student-report": "Student Report",
      "faculty-report": "Faculty Report",
      department: "Department Report",
      completion: "Competency Completion",
      audit: "Audit Report",
      response: "Answer Questions",
      notifications: "Notifications",
      settings: "Settings",
      profile: "Profile",
      system: "System Settings",
      "super-admin": "Platform Admin",
      institutions: "Institutions",
      departments: "Departments",
      "competency-import": "Competency Import",
      monitoring: "Platform Monitoring",
      "system-settings": "System Settings",
      evidence: "Evidence Upload",
      integrations: "Integrations",
      lms: "LMS Integration",
      billing: "Billing & Subscriptions",
      branding: "Institutional Branding",
    };

    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      const label =
        segment === "dean" && userRole === "HOD"
          ? "HOD"
          : routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      breadcrumbs.push({ title: label, href: currentPath });
    });

    return breadcrumbs;
  };

  const isExistingRoute = (href: string) => {
    const validRoutes = [
      "/dashboard",
      "/dashboard/super-admin",
      "/dashboard/dean",
      "/dashboard/faculty",
      "/dashboard/student",
      "/curriculum/streams",
      "/curriculum/professional-years",
      "/curriculum/subjects",
      "/curriculum/topics",
      "/curriculum/competencies",
      "/curriculum/import",
      "/dean/faculty",
      "/dean/students",
      "/dean/students/import",
      "/dean/allocations",
      "/dean/allocation-history",
      "/dean/competency-assignment",
      "/faculty/assigned-students",
      "/faculty/assigned-competencies",
      "/faculty/assessment-form",
      "/faculty/assessment-detail",
      "/faculty/assessment-queue",
      "/student/my-competencies",
      "/student/assessment-history",
      "/student/feedback",
      "/student/acknowledgement",
      "/student/competency-detail",
      "/student/progress",
      "/student/response",
      "/student/evidence",
      "/assessment/attempt-timeline",
      "/assessment/audit-display",
      "/assessment/notifications",
      "/assessment/remediation-workflow",
      "/assessment/status-transitions",
      "/reports/student-report",
      "/reports/faculty-report",
      "/reports/department-report",
      "/reports/competency-completion",
      "/reports/remediation-report",
      "/reports/audit-report",
      "/super-admin/institutions",
      "/super-admin/departments",
      "/super-admin/deans",
      "/settings/profile",
      "/settings/notifications",
      "/settings/appearance",
      "/settings/security",
    ];
    return validRoutes.includes(href);
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 h-14 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="mx-auto flex h-full w-full max-w-[1600px] items-center gap-3 px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-5 hidden sm:block" />

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto pb-1" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 whitespace-nowrap" role="list">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.href} className="flex items-center gap-1">
                {index > 0 && <ChevronLeft className="h-4 w-4 text-muted-foreground rotate-180" />}
                {index === breadcrumbs.length - 1 || !isExistingRoute(crumb.href) ? (
                  <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{crumb.title}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px]"
                  >
                    {crumb.title}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full" />}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="font-normal">Notifications</DropdownMenuLabel>
              <DropdownMenuItem className="text-sm text-muted-foreground">No new notifications</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/assessment/notifications" className="w-full flex items-center justify-between">
                  <span>View all notifications</span>
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label="User menu" />}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName}+${user?.lastName}`} alt={user?.firstName} />
                <AvatarFallback className="text-xs">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col">
                  <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                  <span className="text-xs text-muted-foreground capitalize">{userRole?.toLowerCase()}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/settings/profile" className="flex items-center gap-2 w-full">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/settings/profile" className="flex items-center gap-2 w-full">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setLogoutDialogOpen(true)}
                className="text-destructive focus:text-destructive flex items-center gap-2 w-full"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out? You will need to sign in again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster />
    </header>
  );
}
