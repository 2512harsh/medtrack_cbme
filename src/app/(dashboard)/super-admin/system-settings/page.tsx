"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  getSystemSettings,
  updateSystemSettings,
} from "@/features/super-admin/services/superAdmin";
import { PageLoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { SettingsCard } from "@/components/shared/SettingsCard";
import { SettingRow } from "@/components/shared/SettingRow";
import { toast } from "sonner";
import { Save, Loader2, Building2, ClipboardList, GitBranch, ShieldCheck } from "lucide-react";

type SettingsForm = Awaited<ReturnType<typeof getSystemSettings>>;

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SettingsForm | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const s = await getSystemSettings();
      setSettings(s);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load settings"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateSystemSettings(settings);
      toast.success("Settings saved successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (error || !settings) {
    return (
      <ErrorState
        message="Unable to load system settings. Please try again."
        onRetry={fetchData}
      />
    );
  }

  const set = (patch: Partial<SettingsForm>) =>
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));

  return (
    <div className="max-w-[1100px] space-y-6">
      <PageHeader
        title="System Settings"
        description="Manage platform-level configuration"
        actions={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        }
      />

      <SettingsCard
        title="Platform Identity"
        description="Information that identifies your institution"
        icon={<Building2 className="h-5 w-5 text-primary" />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="inst-name">Institution Name</Label>
            <Input
              id="inst-name"
              value={settings.institutionName}
              onChange={(e) => set({ institutionName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="support-email">Support Email</Label>
            <Input
              id="support-email"
              type="email"
              value={settings.supportEmail}
              onChange={(e) => set({ supportEmail: e.target.value })}
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Assessment Configuration"
        description="Limits that govern assessment attempts"
        icon={<ClipboardList className="h-5 w-5 text-primary" />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="max-attempts">Maximum Assessment Attempts</Label>
            <Input
              id="max-attempts"
              type="number"
              min={1}
              value={settings.maxAssessmentAttempts}
              onChange={(e) =>
                set({ maxAssessmentAttempts: parseInt(e.target.value) || 1 })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="remediation-attempts">
              Attempts Before Remediation
            </Label>
            <Input
              id="remediation-attempts"
              type="number"
              min={1}
              value={settings.remediationRequiredAttempts}
              onChange={(e) =>
                set({ remediationRequiredAttempts: parseInt(e.target.value) || 1 })
              }
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Workflow Requirements"
        description="Enforcement rules for the assessment workflow"
        icon={<GitBranch className="h-5 w-5 text-primary" />}
      >
        <div className="divide-y divide-border">
          <SettingRow
            label="Require Faculty Signature"
            description="Faculty must sign assessments before submission"
            control={
              <Switch
                checked={settings.requireFacultySignature}
                onCheckedChange={(checked) => set({ requireFacultySignature: checked })}
                aria-label="Require Faculty Signature"
              />
            }
          />
          <SettingRow
            label="Require Student Acknowledgement"
            description="Students must acknowledge feedback before completing"
            control={
              <Switch
                checked={settings.requireStudentAcknowledgement}
                onCheckedChange={(checked) => set({ requireStudentAcknowledgement: checked })}
                aria-label="Require Student Acknowledgement"
              />
            }
          />
          <SettingRow
            label="Allow Registration"
            description="Permit new user registration on the platform"
            control={
              <Switch
                checked={settings.allowRegistration}
                onCheckedChange={(checked) => set({ allowRegistration: checked })}
                aria-label="Allow Registration"
              />
            }
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Security & Notifications"
        description="Session, retention and notification preferences"
        icon={<ShieldCheck className="h-5 w-5 text-primary" />}
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input
                id="session-timeout"
                type="number"
                min={5}
                value={settings.sessionTimeoutMinutes}
                onChange={(e) =>
                  set({ sessionTimeoutMinutes: parseInt(e.target.value) || 5 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="audit-retention">Audit Log Retention (days)</Label>
              <Input
                id="audit-retention"
                type="number"
                min={30}
                value={settings.auditRetentionDays}
                onChange={(e) =>
                  set({ auditRetentionDays: parseInt(e.target.value) || 30 })
                }
              />
            </div>
          </div>
          <Separator />
          <div className="divide-y divide-border">
            <SettingRow
              label="Email Notifications"
              description="Send assessment updates via email"
              control={
                <Switch
                  checked={settings.notificationEmails}
                  onCheckedChange={(checked) => set({ notificationEmails: checked })}
                  aria-label="Email Notifications"
                />
              }
            />
            <SettingRow
              label="SMS Notifications"
              description="Send assessment updates via SMS"
              control={
                <Switch
                  checked={settings.notificationSms}
                  onCheckedChange={(checked) => set({ notificationSms: checked })}
                  aria-label="SMS Notifications"
                />
              }
            />
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
