"use client";

import { SectionTabs } from "@/components/layout/SectionTabs";
import {
  LayoutDashboard,
  Building2,
  Network,
  UserCheck,
} from "lucide-react";

const navigation = [
  { href: "/dashboard/super-admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super-admin/institutions", label: "Institutions", icon: Building2 },
  { href: "/super-admin/departments", label: "Departments", icon: Network },
  { href: "/super-admin/deans", label: "Deans", icon: UserCheck },
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
