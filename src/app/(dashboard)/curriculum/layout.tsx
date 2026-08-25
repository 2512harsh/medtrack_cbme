"use client";

import { SectionTabs } from "@/components/layout/SectionTabs";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { BookOpen, GraduationCap, BookText, FileText, Upload } from "lucide-react";
import type { UserRole } from "@/types";

const navigation = [
  { href: "/curriculum/streams", label: "Streams", icon: BookOpen },
  {
    href: "/curriculum/professional-years",
    label: "Professional Years",
    icon: GraduationCap,
    roles: ["Super Admin", "Dean"] as UserRole[],
  },
  { href: "/curriculum/subjects", label: "Subjects", icon: BookText },
  { href: "/curriculum/competencies", label: "Competencies", icon: FileText },
  {
    href: "/curriculum/import",
    label: "Excel Import",
    icon: Upload,
    // Not department-scoped, so kept off HOD's/Faculty's/Student's tab bar —
    // matches the Super Admin/Dean-only enforcement in proxy.ts and the API.
    roles: ["Super Admin", "Dean"] as UserRole[],
  },
];

export default function CurriculumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userRole } = useAuth();
  const visibleNavigation = navigation.filter((item) => !item.roles || (userRole && item.roles.includes(userRole)));

  return (
    <div className="space-y-4">
      <SectionTabs items={visibleNavigation} />
      {children}
    </div>
  );
}
