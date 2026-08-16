"use client";

import { SectionTabs } from "@/components/layout/SectionTabs";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileSpreadsheet,
  Link2,
  Award,
} from "lucide-react";

const navigation = [
  { href: "/dashboard/dean", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dean/faculty", label: "Faculty", icon: Users },
  { href: "/dean/students", label: "Students", icon: UserPlus },
  { href: "/dean/students/import", label: "Student Import", icon: FileSpreadsheet },
  { href: "/dean/allocations", label: "Student Allocation", icon: Link2 },
  { href: "/dean/faculty-assignment", label: "Faculty Assignment", icon: Award },
  { href: "/dean/competency-assignment", label: "Competency Assignment", icon: Award },
];

export default function DeanLayout({
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
