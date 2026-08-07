"use client";

import { SectionTabs } from "@/components/layout/SectionTabs";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileSpreadsheet,
  Link2,
  Award,
  BarChart3,
} from "lucide-react";

const navigation = [
  { href: "/dashboard/hod", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hod/faculty", label: "Faculty", icon: Users },
  { href: "/hod/students", label: "Students", icon: UserPlus },
  { href: "/hod/students/import", label: "Student Import", icon: FileSpreadsheet },
  { href: "/hod/allocations", label: "Student Allocation", icon: Link2 },
  { href: "/hod/faculty-assignment", label: "Faculty Assignment", icon: Award },
  { href: "/hod/competency-assignment", label: "Competency Assignment", icon: Award },
  { href: "/hod/progress", label: "Department Progress", icon: BarChart3 },
];

export default function HODLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <SectionTabs items={navigation} />
      {children}
    </div>
  );
}
