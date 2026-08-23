"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getProfessionalYears, getStreams, createProfessionalYear } from "@/features/curriculum/services/curriculum";
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
import { GraduationCap, Plus } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import type { ProfessionalYear, Stream } from "@/types";
import { toast } from "sonner";

type ProfessionalYearRow = {
  id: string;
  name: string;
  streamName: string;
  sequence: number;
};

const columns: ColumnDef<AppTableFeatures, ProfessionalYearRow>[] = [
  {
    accessorKey: "name",
    header: "Professional Year",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.getValue("name")}</span>
      </div>
    ),
  },
  {
    accessorKey: "streamName",
    header: "Stream",
  },
  {
    accessorKey: "sequence",
    header: "Sequence",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("sequence")}</span>
    ),
  },
];

export default function ProfessionalYearsPage() {
  const [data, setData] = useState<ProfessionalYearRow[] | undefined>(undefined);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ streamId: "", name: "" });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [years, allStreams] = await Promise.all([getProfessionalYears(), getStreams()]);
      setStreams(allStreams);
      setForm((prev) => ({ ...prev, streamId: prev.streamId || allStreams[0]?.id || "" }));
      setData(
        years
          .map((py: ProfessionalYear) => ({
            id: py.id,
            name: py.name,
            streamName: allStreams.find((s) => s.id === py.streamId)?.name ?? "Unassigned",
            sequence: py.sequence,
          }))
          .sort((a, b) => a.sequence - b.sequence)
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load professional years"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!form.streamId || !form.name.trim()) {
      toast.error("Stream and name are required");
      return;
    }
    setSubmitting(true);
    try {
      await createProfessionalYear({ streamId: form.streamId, name: form.name.trim() });
      toast.success("Professional year created successfully");
      setDialogOpen(false);
      setForm((prev) => ({ ...prev, name: "" }));
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create professional year");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Professional Years"
        description="Manage academic years within streams"
        dataSource="live"
        actions={
          <Button onClick={() => setDialogOpen(true)} disabled={streams.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Add Professional Year
          </Button>
        }
      />

      {streams.length === 0 && (
        <p className="text-sm text-muted-foreground">
          You need a Stream first — go to Curriculum → Streams and add one (e.g. &quot;MBBS&quot;) before adding a professional year.
        </p>
      )}

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No professional years found"
        emptyDescription="No academic years have been defined yet."
        loadingColumns={3}
      >
        {(years) => (
          <DataTable
            columns={columns}
            data={years}
            searchPlaceholder="Search professional years..."
          />
        )}
      </AsyncContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Professional Year</DialogTitle>
            <DialogDescription>Create a new academic year within a stream.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="py-stream">Stream *</Label>
              <Select
                items={streams.map((s) => ({ value: s.id, label: s.name }))}
                value={form.streamId}
                onValueChange={(v) => setForm({ ...form, streamId: v ?? "" })}
              >
                <SelectTrigger id="py-stream">
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
              <Label htmlFor="py-name">Name *</Label>
              <Input
                id="py-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. First Professional MBBS"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating..." : "Create Professional Year"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
