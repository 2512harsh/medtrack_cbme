"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { updateQuestionTemplate } from "@/features/curriculum/services/curriculum";
import type { QuestionTemplate } from "@/types";

interface DraftQuestion {
  id?: string;
  questionText: string;
  required: boolean;
}

interface TemplateEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: QuestionTemplate | null;
  onSaved: () => void | Promise<void>;
}

export function TemplateEditDialog({ open, onOpenChange, template, onSaved }: TemplateEditDialogProps) {
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !template) return;
    setTitle(template.title);
    setInstructions(template.instructions ?? "");
    setDraftQuestions(
      (template.questions ?? []).map((q) => ({ id: q.id, questionText: q.questionText, required: q.required }))
    );
    setError(null);
  }, [open, template]);

  const updateDraftQuestion = (index: number, patch: Partial<DraftQuestion>) => {
    setDraftQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const addDraftQuestion = () => {
    setDraftQuestions((prev) => [...prev, { questionText: "", required: true }]);
  };

  const removeDraftQuestion = (index: number) => {
    setDraftQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;

    const cleanQuestions = draftQuestions
      .map((q) => ({ ...q, questionText: q.questionText.trim() }))
      .filter((q) => q.questionText);

    if (!title.trim() || cleanQuestions.length === 0) {
      setError("Give the template a title and at least one question.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await updateQuestionTemplate(template.id, {
        title: title.trim(),
        instructions: instructions.trim() || undefined,
        questions: cleanQuestions,
      });
      toast.success("Template updated");
      onOpenChange(false);
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Question Template</DialogTitle>
          <DialogDescription>Update the template title, instructions, and questions.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-template-title">Template Title *</Label>
            <Input
              id="edit-template-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-template-instructions">Instructions</Label>
            <Textarea
              id="edit-template-instructions"
              placeholder="Optional guidance for faculty"
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label>Questions *</Label>
            {draftQuestions.map((q, i) => (
              <div key={q.id ?? `new-${i}`} className="flex items-start gap-2">
                <Input
                  placeholder={`Question ${i + 1}`}
                  value={q.questionText}
                  onChange={(e) => updateDraftQuestion(i, { questionText: e.target.value })}
                  disabled={isSaving}
                />
                <div className="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
                  <Checkbox
                    checked={q.required}
                    onCheckedChange={(checked) => updateDraftQuestion(i, { required: checked === true })}
                    disabled={isSaving}
                    aria-label="Required question"
                  />
                  Required
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeDraftQuestion(i)}
                  disabled={isSaving || draftQuestions.length === 1}
                  aria-label="Remove question"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addDraftQuestion} disabled={isSaving}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Question
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

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
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
