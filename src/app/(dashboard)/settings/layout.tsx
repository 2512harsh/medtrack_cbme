"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { SectionTabs } from "@/components/layout/SectionTabs";
import { User, Shield, Bell, LayoutDashboard } from "lucide-react";

const settingsNavigation = [
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/appearance", label: "Appearance", icon: LayoutDashboard },
  { href: "/settings/security", label: "Security", icon: Shield },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences"
        titleClassName="text-[32px] leading-tight font-heading"
      />

      <div className="sticky top-0 z-20 -mx-4 bg-background/95 px-4 py-2 backdrop-blur md:-mx-6 md:px-6">
        <SectionTabs items={settingsNavigation} />
      </div>

      {children}
    </div>
  );
}
