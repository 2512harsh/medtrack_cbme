"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getBatches, createBatch } from "@/features/dean/services/dean";
import { getStreams } from "@/features/curriculum/services/curriculum";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Layers, Plus } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import type { Batch, Stream } from "@/types";
import { toast } from "sonner";

type BatchRow = {
  id: string;
  name: string;
  streamName: string;
  admissionYear: number;
  status: string;
};

export default function BatchesPage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [data, setData] = useState<BatchRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [streamId, setStreamId] = useState("");
  const [admissionYear, setAdmissionYear] = useState(new Date().getFullYear());

  const rowsFrom = (batchList: Batch[], streamList: Stream[]): BatchRow[] => {
    const streamNameById = new Map(streamList.map((s) => [s.id, s.name]));
    return batchList.map((b) => ({
      id: b.id,
      name: b.name,
      streamName: streamNameById.get(b.streamId) ?? "Unknown",
      admissionYear: b.admissionYear,
      status: b.status ?? "ACTIVE",
    }));
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [b, s] = await Promise.all([getBatches(), getStreams()]);
      setStreams(s);
      setData(rowsFrom(b, s));
      setStreamId((prev) => prev || s[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load batches"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !streamId || !admissionYear) {
      toast.error("Batch name, stream, and admission year are required");
      return;
    }
    setSubmitting(true);
    try {
      await createBatch({ name: name.trim(), streamId, admissionYear });
      toast.success("Batch created successfully");
      setDialogOpen(false);
      setName("");
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create batch");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<AppTableFeatures, BatchRow>[] = [
    {
      accessorKey: "name",
      header: "Batch Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      ),
    },
    { accessorKey: "streamName", header: "Stream" },
    { accessorKey: "admissionYear", header: "Admission Year" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            row.getValue("status") === "ACTIVE"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {row.getValue("status")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batches"
        description="Manage the admitted student cohorts (batches) used across student records and competency assignments"
        dataSource="live"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Batch
          </Button>
        }
      />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No batches found"
        emptyDescription="No batches have been created yet. Add one to start assigning students and competencies to it."
        loadingColumns={4}
      >
        {(rows) => (
          <DataTable columns={columns} data={rows} searchPlaceholder="Search batches..." />
        )}
      </AsyncContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Batch</DialogTitle>
            <DialogDescription>Create a new admitted cohort, e.g. &quot;MBBS 2024&quot;.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="batch-name">Name *</Label>
              <Input
                id="batch-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. MBBS 2024"
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-stream">Stream *</Label>
              <Select
                items={streams.map((s) => ({ value: s.id, label: s.name }))}
                value={streamId}
                onValueChange={(v) => setStreamId(v ?? "")}
                disabled={submitting}
              >
                <SelectTrigger id="batch-stream">
                  <SelectValue placeholder="Select a stream" />
                </SelectTrigger>
                <SelectContent>
                  {streams.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-year">Admission Year *</Label>
              <Input
                id="batch-year"
                type="number"
                min={2000}
                max={2100}
                value={admissionYear}
                onChange={(e) => setAdmissionYear(Number(e.target.value))}
                disabled={submitting}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating..." : "Create Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
