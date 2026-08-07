"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AsyncContent } from "@/components/shared/AsyncContent";
import {
  getAttendanceSessions,
  createAttendanceSession,
  toggleQrActive,
} from "@/features/advanced/services/advanced";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { QrCode, Play, Square, CalendarPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

type SessionRow = {
  id: string;
  subject: string;
  competencyCode: string;
  competencyTitle: string;
  batch: string;
  sessionTitle: string;
  startAt: string;
  qrActive: boolean;
  presentCount: number;
  totalStudents: number;
};

async function getSessionData(): Promise<SessionRow[]> {
  const sessions = await getAttendanceSessions();
  return sessions.map((s) => ({
    id: s.id,
    subject: s.subject,
    competencyCode: s.competencyCode,
    competencyTitle: s.competencyTitle,
    batch: s.batch,
    sessionTitle: s.sessionTitle,
    startAt: new Date(s.startAt).toLocaleString(),
    qrActive: s.qrActive,
    presentCount: s.presentCount,
    totalStudents: s.totalStudents,
  }));
}

export default function QrAttendancePage() {
  const [data, setData] = useState<SessionRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [stopTarget, setStopTarget] = useState<SessionRow | null>(null);
  const [stopping, setStopping] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    competencyCode: "",
    competencyTitle: "",
    batch: "",
    sessionTitle: "",
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sessions = await getSessionData();
      setData(sessions);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load attendance sessions"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!form.sessionTitle || !form.subject || !form.batch) {
      toast.error("Session title, subject, and batch are required");
      return;
    }
    setCreating(true);
    try {
      await createAttendanceSession({
        subject: form.subject,
        competencyCode: form.competencyCode || "GENERAL",
        competencyTitle: form.competencyTitle || "General Session",
        batch: form.batch,
        sessionTitle: form.sessionTitle,
      });
      toast.success("Attendance session created. QR code is now active.");
      setDialogOpen(false);
      setForm({
        subject: "",
        competencyCode: "",
        competencyTitle: "",
        batch: "",
        sessionTitle: "",
      });
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleQr = async (row: SessionRow) => {
    try {
      await toggleQrActive(row.id);
      toast.success(row.qrActive ? "QR code deactivated" : "QR code activated");
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update QR status");
    }
  };

  const handleConfirmStop = async () => {
    if (!stopTarget) return;
    setStopping(true);
    try {
      await toggleQrActive(stopTarget.id);
      toast.success("QR code stopped. No further check-ins will be accepted.");
      setStopTarget(null);
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to stop QR code");
    } finally {
      setStopping(false);
    }
  };

  const activeSession = data?.find((s) => s.qrActive);

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR Attendance"
        description="Create sessions and generate QR codes for student attendance"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <CalendarPlus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        }
      />

      {activeSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Live QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-40 w-40 rounded-xl border bg-muted/50 flex items-center justify-center">
              <QrCode className="h-28 w-28 text-foreground" />
            </div>
            <div className="space-y-1 text-sm flex-1">
              <p className="font-medium text-lg">{activeSession.sessionTitle}</p>
              <p className="text-muted-foreground">
                {activeSession.subject} • {activeSession.competencyCode} •{" "}
                {activeSession.batch}
              </p>
              <p className="text-muted-foreground">
                Started {activeSession.startAt} • {activeSession.presentCount} /{" "}
                {activeSession.totalStudents} present
              </p>
              <div className="pt-2">
                <Button variant="destructive" size="sm" onClick={() => setStopTarget(activeSession)}>
                  <Square className="h-4 w-4 mr-2" />
                  Stop QR
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No attendance sessions"
        emptyDescription="Create a session to start collecting attendance via QR code."
        loadingColumns={5}
      >
        {(sessions) => (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="min-w-0">
                  <p className="font-medium">{s.sessionTitle}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {s.subject} • {s.competencyCode} • {s.batch} • Started {s.startAt}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      s.qrActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {s.presentCount} present
                  </span>
                  <Button
                    variant={s.qrActive ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => (s.qrActive ? setStopTarget(s) : handleToggleQr(s))}
                  >
                    {s.qrActive ? (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Activate QR
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AsyncContent>

      {stopTarget && (
        <ConfirmationDialog
          open={!!stopTarget}
          onOpenChange={(open) => {
            if (!open) setStopTarget(null);
          }}
          onConfirm={handleConfirmStop}
          title="Stop QR code?"
          description={`Stop attendance for "${stopTarget.sessionTitle}"? Students will no longer be able to check in.`}
          confirmLabel="Stop QR"
          variant="destructive"
          isLoading={stopping}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Attendance Session</DialogTitle>
            <DialogDescription>
              Start a new session with an active QR code for student sign-in.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="att-title">Session Title *</Label>
              <Input
                id="att-title"
                value={form.sessionTitle}
                onChange={(e) => setForm({ ...form, sessionTitle: e.target.value })}
                placeholder="e.g. Upper Limb Dissection Practical"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="att-subject">Subject *</Label>
                <Input
                  id="att-subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Anatomy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="att-batch">Batch *</Label>
                <Input
                  id="att-batch"
                  value={form.batch}
                  onChange={(e) => setForm({ ...form, batch: e.target.value })}
                  placeholder="e.g. MBBS-2024"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="att-code">Competency Code</Label>
                <Input
                  id="att-code"
                  value={form.competencyCode}
                  onChange={(e) => setForm({ ...form, competencyCode: e.target.value })}
                  placeholder="e.g. AN8.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="att-title2">Competency Title</Label>
                <Input
                  id="att-title2"
                  value={form.competencyTitle}
                  onChange={(e) => setForm({ ...form, competencyTitle: e.target.value })}
                  placeholder="e.g. Upper Limb Overview"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : "Create Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}