"use client";

import { SectionTabs } from "@/components/layout/SectionTabs";
import { BookOpen, GraduationCap, BookText, FileText, Upload } from "lucide-react";

const navigation = [
  { href: "/curriculum/streams", label: "Streams", icon: BookOpen },
  { href: "/curriculum/professional-years", label: "Professional Years", icon: GraduationCap },
  { href: "/curriculum/subjects", label: "Subjects", icon: BookText },
  { href: "/curriculum/competencies", label: "Competencies", icon: FileText },
  { href: "/curriculum/import", label: "Excel Import", icon: Upload },
];

export default function CurriculumLayout({
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
