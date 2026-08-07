"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, GraduationCap, MessagesSquare, ServerCog } from "lucide-react";
import { SettingRow } from "@/components/shared/SettingRow";

type Preferences = Record<string, boolean>;

const defaultPreferences: Preferences = {
  "assessment-updates": true,
  "competency-updates": true,
  "remediation-alerts": true,
  "email-digest": false,
  "announcements": true,
  "platform-updates": true,
  "security-alerts": true,
};

interface NotificationGroup {
  title: string;
  description: string;
  icon: React.ElementType;
  items: { key: string; label: string; description: string }[];
}

const groups: NotificationGroup[] = [
  {
    title: "Academic",
    description: "Updates related to assessments, competencies and remediation",
    icon: GraduationCap,
    items: [
      { key: "assessment-updates", label: "Assessment Updates", description: "New assessments and result changes" },
      { key: "competency-updates", label: "Competency Updates", description: "Competency levels and progress changes" },
      { key: "remediation-alerts", label: "Remediation Alerts", description: "Remediation plans and follow-up tasks" },
    ],
  },
  {
    title: "Communication",
    description: "Digest and announcement preferences",
    icon: MessagesSquare,
    items: [
      { key: "email-digest", label: "Email Digest", description: "Daily summary of your activity" },
      { key: "announcements", label: "Announcements", description: "Important notices from the institution" },
    ],
  },
  {
    title: "System",
    description: "Platform and security notifications",
    icon: ServerCog,
    items: [
      { key: "platform-updates", label: "Platform Updates", description: "Feature releases and maintenance" },
      { key: "security-alerts", label: "Security Alerts", description: "Login and security-related activity" },
    ],
  },
];

export default function NotificationsPage() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const toggle = (key: string) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setMessage({ type: "success", text: "Notification preferences saved" });
    } catch {
      setMessage({ type: "error", text: "Failed to save preferences. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[1000px] space-y-6">
      {message && (
        <div
          className={
            message.type === "success"
              ? "rounded-lg border bg-card px-4 py-3 text-sm"
              : "rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          }
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <group.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-heading font-semibold">{group.title}</CardTitle>
                  <p className="text-[13px] text-muted-foreground">{group.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {group.items.map((item) => (
                <SettingRow
                  key={item.key}
                  label={item.label}
                  description={item.description}
                  control={
                    <Switch
                      checked={preferences[item.key] ?? false}
                      onCheckedChange={() => toggle(item.key)}
                      aria-label={item.label}
                    />
                  }
                />
              ))}
            </CardContent>
            <CardFooter className="border-t bg-muted/30 px-4 py-3">
              <div className="flex w-full items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {Object.entries(preferences)
                    .filter(([, v]) => v)
                    .filter(([k]) => group.items.some((i) => i.key === k)).length}
                  /{group.items.length} enabled
                </p>
                <Button
                  type="button"
                  size="sm"
                  disabled={saving}
                  onClick={handleSave}
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
