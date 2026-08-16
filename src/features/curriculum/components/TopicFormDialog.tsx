"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Topic } from "@/types";

export interface TopicFormValues {
  title: string;
  displayOrder: number;
}

interface TopicFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic?: Topic | null;
  nextDisplayOrder: number;
  isSaving: boolean;
  onSave: (values: TopicFormValues) => void | Promise<void>;
}

export function TopicFormDialog({
  open,
  onOpenChange,
  topic,
  nextDisplayOrder,
  isSaving,
  onSave,
}: TopicFormDialogProps) {
  const [values, setValues] = useState<TopicFormValues>({ title: "", displayOrder: 1 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues({
        title: topic?.title ?? "",
        displayOrder: topic?.displayOrder ?? nextDisplayOrder,
      });
      setError(null);
    }
  }, [open, topic, nextDisplayOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.title.trim()) {
      setError("Please enter a topic title.");
      return;
    }
    setError(null);
    await onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{topic ? "Edit Topic" : "Add Topic"}</DialogTitle>
          <DialogDescription>
            {topic ? "Update this topic's details below." : "Add a new topic to this subject."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic-title">Topic Title *</Label>
            <Input
              id="topic-title"
              placeholder="e.g., Topic 1: Anatomical Terminology"
              value={values.title}
              onChange={(e) => setValues((prev) => ({ ...prev, title: e.target.value }))}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic-order">Display Order</Label>
            <Input
              id="topic-order"
              type="number"
              min={1}
              value={values.displayOrder}
              onChange={(e) => setValues((prev) => ({ ...prev, displayOrder: Number(e.target.value) || 1 }))}
              disabled={isSaving}
            />
          </div>

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : topic ? (
                "Save Changes"
              ) : (
                "Add Topic"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
