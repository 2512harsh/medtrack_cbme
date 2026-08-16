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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Competency } from "@/types";

export interface CompetencyFormValues {
  competencyCode: string;
  competencyTitle: string;
  competencyDescription: string;
  competencyLevel: string;
  core: boolean;
}

const LEVEL_OPTIONS = [
  { value: "K", label: "K — Knows" },
  { value: "KH", label: "KH — Knows How" },
  { value: "SH", label: "SH — Shows How" },
  { value: "P", label: "P — Performs" },
];

const CORE_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

interface CompetencyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competency?: Competency | null;
  isSaving: boolean;
  onSave: (values: CompetencyFormValues) => void | Promise<void>;
}

export function CompetencyFormDialog({
  open,
  onOpenChange,
  competency,
  isSaving,
  onSave,
}: CompetencyFormDialogProps) {
  const [values, setValues] = useState<CompetencyFormValues>({
    competencyCode: "",
    competencyTitle: "",
    competencyDescription: "",
    competencyLevel: "K",
    core: true,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues({
        competencyCode: competency?.competencyCode ?? "",
        competencyTitle: competency?.competencyTitle ?? "",
        competencyDescription: competency?.competencyDescription ?? "",
        competencyLevel: competency?.competencyLevel ?? "K",
        core: competency?.core ?? true,
      });
      setError(null);
    }
  }, [open, competency]);

  const set = <K extends keyof CompetencyFormValues>(key: K, value: CompetencyFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.competencyCode.trim() || !values.competencyTitle.trim()) {
      setError("Please fill in the competency code and title.");
      return;
    }
    setError(null);
    await onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{competency ? "Edit Competency" : "Add Competency"}</DialogTitle>
          <DialogDescription>
            {competency
              ? "Update this competency's details below."
              : "Add a new competency to this topic."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="competency-code">Number *</Label>
              <Input
                id="competency-code"
                placeholder="e.g., AN1.2"
                value={values.competencyCode}
                onChange={(e) => set("competencyCode", e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="competency-level">Level *</Label>
              <Select
                items={LEVEL_OPTIONS}
                value={values.competencyLevel}
                onValueChange={(v) => set("competencyLevel", v ?? "K")}
                disabled={isSaving}
              >
                <SelectTrigger id="competency-level">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="competency-title">Competency *</Label>
            <Textarea
              id="competency-title"
              placeholder="e.g., Describe composition of bone and bone marrow"
              value={values.competencyTitle}
              onChange={(e) => set("competencyTitle", e.target.value)}
              disabled={isSaving}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="competency-description">Description</Label>
            <Textarea
              id="competency-description"
              placeholder="Optional additional detail"
              value={values.competencyDescription}
              onChange={(e) => set("competencyDescription", e.target.value)}
              disabled={isSaving}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="competency-core">Core *</Label>
            <Select
              items={CORE_OPTIONS}
              value={values.core ? "yes" : "no"}
              onValueChange={(v) => set("core", v === "yes")}
              disabled={isSaving}
            >
              <SelectTrigger id="competency-core" className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CORE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              ) : competency ? (
                "Save Changes"
              ) : (
                "Add Competency"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
