"use client";

import { SectionTabs } from "@/components/layout/SectionTabs";
import { Clock, RefreshCw, ArrowRightLeft, Shield } from "lucide-react";

const navigation = [
  { href: "/assessment/attempt-timeline", label: "Attempt Timeline", icon: Clock },
  { href: "/assessment/remediation-workflow", label: "Remediation Workflow", icon: RefreshCw },
  { href: "/assessment/status-transitions", label: "Status Transitions", icon: ArrowRightLeft },
  { href: "/assessment/audit-display", label: "Audit Display", icon: Shield },
];

export default function AssessmentLayout({
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
