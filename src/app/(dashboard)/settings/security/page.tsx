"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, KeyRound, MonitorSmartphone, Fingerprint, ShieldAlert, LogOut, Smartphone, Clock } from "lucide-react";
import { SettingRow } from "@/components/shared/SettingRow";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { toast } from "sonner";

type Preferences = Record<string, boolean>;

const defaultPreferences: Preferences = {
  "two-factor": false,
  "security-notifications": true,
};

const initialSessions = [
  {
    id: "current",
    device: "Chrome · Windows",
    location: "Mumbai, IN",
    ip: "103.21.44.100",
    current: true,
    lastActive: "Active now",
  },
  {
    id: "mobile",
    device: "Safari · iPhone",
    location: "Pune, IN",
    ip: "117.214.9.14",
    current: false,
    lastActive: "2 hours ago",
  },
  {
    id: "laptop",
    device: "Firefox · macOS",
    location: "Bengaluru, IN",
    ip: "49.207.180.55",
    current: false,
    lastActive: "3 days ago",
  },
];

const loginActivity = [
  { id: "1", event: "Password changed", date: "Aug 5, 2026 · 10:42 AM", location: "Mumbai, IN", status: "Successful" },
  { id: "2", event: "Sign-in from new device", date: "Aug 3, 2026 · 6:15 PM", location: "Pune, IN", status: "Successful" },
  { id: "3", event: "Password changed", date: "Jul 28, 2026 · 9:30 AM", location: "Mumbai, IN", status: "Successful" },
];

const initialTrustedDevices = [
  { id: "1", device: "Chrome · Windows", added: "Added Jun 12, 2026" },
  { id: "2", device: "Safari · iPhone", added: "Added May 30, 2026" },
];

export default function SecurityPage() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [sessions, setSessions] = useState(initialSessions);
  const [trustedDevices, setTrustedDevices] = useState(initialTrustedDevices);
  const [saving, setSaving] = useState(false);
  const [terminateOpen, setTerminateOpen] = useState(false);
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
      setMessage({ type: "success", text: "Security settings saved" });
    } catch {
      setMessage({ type: "error", text: "Failed to save security settings. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPreferences(defaultPreferences);
    setMessage({ type: "success", text: "Security preferences reset to defaults" });
  };

  const handleSignOutSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success("Session signed out");
  };

  const handleTerminateAll = () => {
    setTerminateOpen(false);
    setSessions((prev) => prev.filter((s) => s.current));
    toast.success("All other sessions terminated");
  };

  const handleRemoveTrustedDevice = (id: string) => {
    setTrustedDevices((prev) => prev.filter((d) => d.id !== id));
    toast.success("Trusted device removed");
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading font-semibold">Authentication</CardTitle>
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account
          </p>
        </CardHeader>
        <CardContent>
          <SettingRow
            icon={Fingerprint}
            label="Two-Factor Authentication"
            description="Require a verification code in addition to your password when signing in"
            control={
              <Switch
                checked={preferences["two-factor"] ?? false}
                onCheckedChange={() => toggle("two-factor")}
                aria-label="Two-Factor Authentication"
              />
            }
          />
          <SettingRow
            icon={KeyRound}
            label="Password Management"
            description="Update your account password"
            action={
              <Link href="/settings/profile">
                <Button type="button" variant="outline" size="sm">
                  Change Password
                </Button>
              </Link>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading font-semibold">Sessions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage devices where you&apos;re currently signed in
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MonitorSmartphone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{session.device}</p>
                  <p className="text-[13px] text-muted-foreground">
                    {session.location} · {session.ip} · {session.lastActive}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {session.current ? (
                  <Badge variant="outline">This device</Badge>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Sign out ${session.device}`}
                    onClick={() => handleSignOutSession(session.id)}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <Button type="button" variant="destructive" size="sm" onClick={() => setTerminateOpen(true)}>
              Terminate All Sessions
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading font-semibold">Recent Login Activity</CardTitle>
          <p className="text-sm text-muted-foreground">A record of recent sign-in activity</p>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {loginActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{activity.event}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {activity.date} · {activity.location}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {activity.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading font-semibold">Trusted Devices</CardTitle>
          <p className="text-sm text-muted-foreground">
            Devices that have been verified on your account
          </p>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {trustedDevices.map((device) => (
              <div key={device.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{device.device}</p>
                    <p className="text-[13px] text-muted-foreground">{device.added}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => handleRemoveTrustedDevice(device.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading font-semibold">Security Notifications</CardTitle>
          <p className="text-sm text-muted-foreground">
            Alerts for unusual activity and security events
          </p>
        </CardHeader>
        <CardContent>
          <SettingRow
            icon={ShieldAlert}
            label="Security Alerts"
            description="Get notified about new sign-ins and security-related changes"
            control={
              <Switch
                checked={preferences["security-notifications"] ?? false}
                onCheckedChange={() => toggle("security-notifications")}
                aria-label="Security Alerts"
              />
            }
          />
        </CardContent>
        <CardFooter className="border-t bg-muted/30 px-4 py-3">
          <div className="flex w-full items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
            <Button type="button" size="sm" disabled={saving} onClick={handleSave}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <ConfirmationDialog
        open={terminateOpen}
        onOpenChange={setTerminateOpen}
        onConfirm={handleTerminateAll}
        title="Terminate all sessions?"
        description="This will sign you out of every device except your current one. You will need to sign in again on those devices."
        confirmLabel="Terminate All"
        variant="destructive"
      />
    </div>
  );
}
