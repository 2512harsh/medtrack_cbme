"use client";

import { SectionTabs } from "@/components/layout/SectionTabs";
import { LayoutDashboard, BookOpen, FileText, MessageSquare, CheckCircle, Clock } from "lucide-react";

const navigation = [
  { href: "/dashboard/student", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/my-competencies", label: "My Competencies", icon: BookOpen },
  { href: "/student/competency-detail", label: "Competency Detail", icon: FileText },
  { href: "/student/feedback", label: "Feedback View", icon: MessageSquare },
  { href: "/student/acknowledgement", label: "Acknowledgement", icon: CheckCircle },
  { href: "/student/assessment-history", label: "Assessment History", icon: Clock },
];

export default function StudentLayout({
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
