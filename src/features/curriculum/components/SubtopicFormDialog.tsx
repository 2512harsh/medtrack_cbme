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
import type { Subtopic } from "@/types";

export interface SubtopicFormValues {
  title: string;
  displayOrder: number;
}

interface SubtopicFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtopic?: Subtopic | null;
  nextDisplayOrder: number;
  isSaving: boolean;
  onSave: (values: SubtopicFormValues) => void | Promise<void>;
}

export function SubtopicFormDialog({
  open,
  onOpenChange,
  subtopic,
  nextDisplayOrder,
  isSaving,
  onSave,
}: SubtopicFormDialogProps) {
  const [values, setValues] = useState<SubtopicFormValues>({ title: "", displayOrder: 1 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues({
        title: subtopic?.title ?? "",
        displayOrder: subtopic?.displayOrder ?? nextDisplayOrder,
      });
      setError(null);
    }
  }, [open, subtopic, nextDisplayOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.title.trim()) {
      setError("Please enter a subtopic title.");
      return;
    }
    setError(null);
    await onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{subtopic ? "Edit Subtopic" : "Add Subtopic"}</DialogTitle>
          <DialogDescription>
            {subtopic ? "Update this subtopic's details below." : "Add a new subtopic to this topic."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subtopic-title">Subtopic Title *</Label>
            <Input
              id="subtopic-title"
              placeholder="e.g., General features of bones & Joints"
              value={values.title}
              onChange={(e) => setValues((prev) => ({ ...prev, title: e.target.value }))}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtopic-order">Display Order</Label>
            <Input
              id="subtopic-order"
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
              ) : subtopic ? (
                "Save Changes"
              ) : (
                "Add Subtopic"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
