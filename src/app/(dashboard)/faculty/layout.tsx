"use client";

import { SectionTabs } from "@/components/layout/SectionTabs";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  ClipboardCheck,
} from "lucide-react";

const navigation = [
  { href: "/dashboard/faculty", label: "Dashboard", icon: LayoutDashboard },
  { href: "/faculty/assigned-students", label: "Assigned Students", icon: Users },
  { href: "/faculty/assigned-competencies", label: "Assigned Competencies", icon: BookOpen },
  { href: "/faculty/assessment-form", label: "Assessment Form", icon: FileText },
  { href: "/faculty/assessment-detail", label: "Assessment Detail", icon: ClipboardCheck },
];

export default function FacultyLayout({
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
