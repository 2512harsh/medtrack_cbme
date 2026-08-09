"use client";

import { SectionTabs } from "@/components/layout/SectionTabs";
import {
  LayoutDashboard,
  Building2,
  Users,
  Network,
  FileSpreadsheet,
  Activity,
  Settings2,
  Palette,
} from "lucide-react";

const navigation = [
  { href: "/dashboard/super-admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super-admin/institutions", label: "Institutions", icon: Building2 },
  { href: "/super-admin/departments", label: "Departments", icon: Network },
  { href: "/super-admin/competency-import", label: "Competency Import", icon: FileSpreadsheet },
  { href: "/super-admin/monitoring", label: "Platform Monitoring", icon: Activity },
  { href: "/super-admin/system-settings", label: "System Settings", icon: Settings2 },
  { href: "/super-admin/branding", label: "Branding", icon: Palette },
];

export default function SuperAdminLayout({
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
