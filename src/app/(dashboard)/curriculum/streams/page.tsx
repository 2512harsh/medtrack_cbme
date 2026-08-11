"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getStreams, createStream } from "@/features/curriculum/services/curriculum";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, Plus } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import type { Stream } from "@/types";
import { toast } from "sonner";

type StreamRow = {
  id: string;
  name: string;
};

const columns: ColumnDef<AppTableFeatures, StreamRow>[] = [
  {
    accessorKey: "name",
    header: "Stream Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.getValue("name")}</span>
      </div>
    ),
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground font-mono">{row.getValue("id")}</span>
    ),
  },
];

export default function StreamsPage() {
  const [data, setData] = useState<StreamRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const streams = await getStreams();
      setData(streams.map((s: Stream) => ({ id: s.id, name: s.name })));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load streams"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Stream name is required");
      return;
    }
    setSubmitting(true);
    try {
      await createStream({ name: name.trim() });
      toast.success("Stream created successfully");
      setDialogOpen(false);
      setName("");
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create stream");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Streams"
        description="Manage medical program streams"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Stream
          </Button>
        }
      />

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No streams found"
        emptyDescription="No medical program streams have been created yet."
        loadingColumns={2}
      >
        {(streams) => (
          <DataTable
            columns={columns}
            data={streams}
            searchPlaceholder="Search streams..."
          />
        )}
      </AsyncContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Stream</DialogTitle>
            <DialogDescription>Create a new medical program stream.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stream-name">Name *</Label>
              <Input
                id="stream-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. MBBS"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating..." : "Create Stream"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
