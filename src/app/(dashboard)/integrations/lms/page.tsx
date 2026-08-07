"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  getLmsIntegrations,
  connectLms,
  disconnectLms,
  syncLms,
} from "@/features/advanced/services/advanced";
import { toast } from "sonner";
import { Link2, Unlink, RefreshCw, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

type IntegrationRow = {
  id: string;
  name: string;
  status: string;
  baseUrl: string;
  syncSchedule: string;
  lastSyncedAt: string;
  syncedRecords: number;
  description: string;
  logo: string;
};

const statusColor = (status: string) =>
  status === "CONNECTED"
    ? "bg-green-100 text-green-700"
    : "bg-gray-100 text-gray-700";

function getSyncData(): Promise<IntegrationRow[]> {
  return getLmsIntegrations().then((list) =>
    list.map((i) => ({
      id: i.id,
      name: i.name,
      status: i.status,
      baseUrl: i.baseUrl || "-",
      syncSchedule: i.syncSchedule,
      lastSyncedAt: i.lastSyncedAt
        ? new Date(i.lastSyncedAt).toLocaleString()
        : "Never",
      syncedRecords: i.syncedRecords,
      description: i.description,
      logo: i.logo,
    }))
  );
}

export default function LmsIntegrationPage() {
  const [data, setData] = useState<IntegrationRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<IntegrationRow | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    baseUrl: "",
    description: "",
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await getSyncData();
      setData(list);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load LMS integrations"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConnect = async () => {
    if (!form.name || !form.baseUrl) {
      toast.error("Name and base URL are required");
      return;
    }
    setConnecting(true);
    try {
      await connectLms({
        name: form.name,
        baseUrl: form.baseUrl,
        description: form.description || "Connected via settings",
      });
      toast.success(`${form.name} connected`);
      setDialogOpen(false);
      setForm({ name: "", baseUrl: "", description: "" });
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to connect LMS");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectTarget) return;
    setDisconnecting(true);
    try {
      await disconnectLms(disconnectTarget.id);
      toast.success(`${disconnectTarget.name} disconnected`);
      setDisconnectTarget(null);
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect LMS");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSync = async (integration: IntegrationRow) => {
    setSyncingId(integration.id);
    try {
      await syncLms(integration.id);
      toast.success(`${integration.name} synced successfully`);
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sync LMS");
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="LMS Integration"
        description="Connect your learning management system for seamless content sync"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Connect LMS
          </Button>
        }
      />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No LMS integrations"
        emptyDescription="Connect an LMS to synchronize curriculum content."
        loadingColumns={3}
      >
        {(integrations) => (
          <div className="grid gap-4 md:grid-cols-2">
            {integrations.map((i) => (
              <Card key={i.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <span className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {i.logo}
                      </span>
                      {i.name}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${statusColor(i.status)}`}
                    >
                      {i.status}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">{i.description}</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Base URL</span>
                      <span className="font-medium">{i.baseUrl}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sync Schedule</span>
                      <span className="font-medium">{i.syncSchedule}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Synced</span>
                      <span className="font-medium">{i.lastSyncedAt}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Records</span>
                      <span className="font-medium">{i.syncedRecords}</span>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center gap-2">
                    {i.status === "CONNECTED" ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(i)}
                          disabled={syncingId === i.id}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${syncingId === i.id ? "animate-spin" : ""}`} />
                          {syncingId === i.id ? "Syncing..." : "Sync Now"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDisconnectTarget(i)}
                        >
                          <Unlink className="h-4 w-4 mr-2" />
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                        <Link2 className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </AsyncContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect LMS</DialogTitle>
            <DialogDescription>
              Enter the connection details for your learning management system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lms-name">LMS Name *</Label>
              <Input
                id="lms-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Moodle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lms-url">Base URL *</Label>
              <Input
                id="lms-url"
                value={form.baseUrl}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                placeholder="https://lms.example.edu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lms-desc">Description</Label>
              <Input
                id="lms-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={connecting}>
              Cancel
            </Button>
            <Button onClick={handleConnect} disabled={connecting}>
              <Link2 className="h-4 w-4 mr-2" />
              {connecting ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {disconnectTarget && (
        <ConfirmationDialog
          open={!!disconnectTarget}
          onOpenChange={(open) => {
            if (!open) setDisconnectTarget(null);
          }}
          onConfirm={handleDisconnect}
          title="Disconnect LMS"
          description={`Disconnect ${disconnectTarget.name}? Content synchronization will stop.`}
          confirmLabel="Disconnect"
          variant="destructive"
          isLoading={disconnecting}
        />
      )}
    </div>
  );
}