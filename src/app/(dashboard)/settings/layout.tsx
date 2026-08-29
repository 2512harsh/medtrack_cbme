import { PageHeader } from "@/components/layout/PageHeader";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences"
        titleClassName="text-[32px] leading-tight font-heading"
      />

      {children}
    </div>
  );
}
