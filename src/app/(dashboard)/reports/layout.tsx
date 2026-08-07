"use client";

import { SectionTabs } from "@/components/layout/SectionTabs";
import { Users, GraduationCap, Building2, BookOpen, AlertTriangle, Shield } from "lucide-react";

const navigation = [
  { href: "/reports/student-report", label: "Student Report", icon: Users },
  { href: "/reports/faculty-report", label: "Faculty Report", icon: GraduationCap },
  { href: "/reports/department-report", label: "Department Report", icon: Building2 },
  { href: "/reports/competency-completion", label: "Competency Completion", icon: BookOpen },
  { href: "/reports/remediation-report", label: "Remediation Report", icon: AlertTriangle },
  { href: "/reports/audit-report", label: "Audit Report", icon: Shield },
];

export default function ReportsLayout({
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
