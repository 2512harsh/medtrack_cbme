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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { getFaculty } from "@/features/dean/services/dean";
import {
  getSubjects,
  getTopics,
  getSubtopics,
  getCompetencies,
  getQuestionTemplates,
  createQuestionTemplate,
} from "@/features/curriculum/services/curriculum";
import type { Competency, Faculty, QuestionTemplate, Subject, Topic, Subtopic } from "@/types";

interface DraftQuestion {
  questionText: string;
  required: boolean;
}

export interface CompetencyAssignmentFormValues {
  facultyId: string;
  competencyId: string;
  batch: string;
  templateId: string;
}

interface CompetencyAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaving: boolean;
  onSave: (values: CompetencyAssignmentFormValues) => void | Promise<void>;
}

export function CompetencyAssignmentDialog({
  open,
  onOpenChange,
  isSaving,
  onSave,
}: CompetencyAssignmentDialogProps) {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);

  const [facultyId, setFacultyId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [subtopicId, setSubtopicId] = useState("");
  const [competencyId, setCompetencyId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [batch, setBatch] = useState("MBBS-2024");
  const [error, setError] = useState<string | null>(null);

  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [newTemplateInstructions, setNewTemplateInstructions] = useState("");
  const [newQuestions, setNewQuestions] = useState<DraftQuestion[]>([{ questionText: "", required: true }]);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [templateFormError, setTemplateFormError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [f, s] = await Promise.all([getFaculty(), getSubjects()]);
      setFaculty(f);
      setSubjects(s);
    })();
  }, []);

  useEffect(() => {
    if (open) {
      setFacultyId(faculty[0]?.id ?? "");
      setSubjectId("");
      setTopicId("");
      setSubtopicId("");
      setCompetencyId("");
      setTemplateId("");
      setTopics([]);
      setSubtopics([]);
      setCompetencies([]);
      setTemplates([]);
      setError(null);
      setShowTemplateForm(false);
      resetTemplateDraft();
    }
  }, [open, faculty]);

  useEffect(() => {
    if (!subjectId) {
      setTopics([]);
      setTopicId("");
      setSubtopics([]);
      setSubtopicId("");
      setCompetencies([]);
      setCompetencyId("");
      setTemplates([]);
      setTemplateId("");
      return;
    }
    setTopicId("");
    setSubtopicId("");
    setCompetencyId("");
    setTemplateId("");
    setTopics([]);
    getTopics(subjectId).then(setTopics);
  }, [subjectId]);

  useEffect(() => {
    if (!topicId) {
      setSubtopics([]);
      setSubtopicId("");
      setCompetencies([]);
      setCompetencyId("");
      setTemplates([]);
      setTemplateId("");
      return;
    }
    setSubtopicId("");
    setCompetencyId("");
    setTemplateId("");
    setSubtopics([]);
    getSubtopics(topicId).then(setSubtopics);
  }, [topicId]);

  useEffect(() => {
    if (!subtopicId) {
      setCompetencies([]);
      setCompetencyId("");
      setTemplates([]);
      setTemplateId("");
      return;
    }
    setCompetencyId("");
    setTemplateId("");
    setCompetencies([]);
    getCompetencies(subtopicId).then(setCompetencies);
  }, [subtopicId]);

  useEffect(() => {
    if (!competencyId) {
      setTemplates([]);
      setTemplateId("");
      return;
    }
    setTemplateId("");
    setShowTemplateForm(false);
    getQuestionTemplates(competencyId).then(setTemplates);
  }, [competencyId]);

  function resetTemplateDraft() {
    setNewTemplateTitle("");
    setNewTemplateInstructions("");
    setNewQuestions([{ questionText: "", required: true }]);
    setTemplateFormError(null);
  }

  const updateDraftQuestion = (index: number, patch: Partial<DraftQuestion>) => {
    setNewQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const addDraftQuestion = () => {
    setNewQuestions((prev) => [...prev, { questionText: "", required: true }]);
  };

  const removeDraftQuestion = (index: number) => {
    setNewQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateTemplate = async () => {
    const cleanQuestions = newQuestions
      .map((q) => ({ ...q, questionText: q.questionText.trim() }))
      .filter((q) => q.questionText);

    if (!newTemplateTitle.trim() || cleanQuestions.length === 0) {
      setTemplateFormError("Give the template a title and at least one question.");
      return;
    }
    setTemplateFormError(null);
    setIsCreatingTemplate(true);
    try {
      const created = await createQuestionTemplate({
        competencyId,
        title: newTemplateTitle.trim(),
        instructions: newTemplateInstructions.trim() || undefined,
        questions: cleanQuestions,
      });
      const refreshed = await getQuestionTemplates(competencyId);
      setTemplates(refreshed);
      setTemplateId(created.id);
      setShowTemplateForm(false);
      resetTemplateDraft();
      toast.success("Template created");
    } catch (err) {
      setTemplateFormError(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyId || !competencyId || !batch) {
      setError("Faculty, competency, and batch are required.");
      return;
    }
    setError(null);
    await onSave({ facultyId, competencyId, batch, templateId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Competency Assignment</DialogTitle>
          <DialogDescription>
            Assign a competency template to a faculty member.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="faculty">Faculty *</Label>
            <Select
              items={faculty.map((f) => ({
                value: f.id,
                label: f.user ? `${f.user.firstName} ${f.user.lastName}` : f.employeeCode,
              }))}
              value={facultyId}
              onValueChange={(v) => setFacultyId(v ?? "")}
              disabled={isSaving}
            >
              <SelectTrigger id="faculty" className="w-full">
                <SelectValue placeholder="Select a faculty member" />
              </SelectTrigger>
              <SelectContent>
                {faculty.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.user ? `${f.user.firstName} ${f.user.lastName}` : f.employeeCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Select
              items={subjects.map((s) => ({ value: s.id, label: s.name }))}
              value={subjectId}
              onValueChange={(v) => setSubjectId(v ?? "")}
              disabled={isSaving}
            >
              <SelectTrigger id="subject" className="w-full">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Topic *</Label>
            <Select
              items={topics.map((t) => ({ value: t.id, label: t.title }))}
              value={topicId}
              onValueChange={(v) => setTopicId(v ?? "")}
              disabled={isSaving || !subjectId}
            >
              <SelectTrigger id="topic" className="w-full">
                <SelectValue placeholder={subjectId ? "Select a topic" : "Select a subject first"} />
              </SelectTrigger>
              <SelectContent>
                {topics.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtopic">Subtopic *</Label>
            <Select
              items={subtopics.map((s) => ({ value: s.id, label: s.title }))}
              value={subtopicId}
              onValueChange={(v) => setSubtopicId(v ?? "")}
              disabled={isSaving || !topicId}
            >
              <SelectTrigger id="subtopic" className="w-full">
                <SelectValue placeholder={topicId ? "Select a subtopic" : "Select a topic first"} />
              </SelectTrigger>
              <SelectContent>
                {subtopics.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="competency">Competency *</Label>
            <Select
              items={competencies.map((c) => ({ value: c.id, label: `${c.competencyCode} — ${c.competencyTitle}` }))}
              value={competencyId}
              onValueChange={(v) => setCompetencyId(v ?? "")}
              disabled={isSaving || !subtopicId}
            >
              <SelectTrigger
                id="competency"
                className="w-full"
                title={competencies.find((c) => c.id === competencyId)
                  ? `${competencies.find((c) => c.id === competencyId)?.competencyCode} — ${competencies.find((c) => c.id === competencyId)?.competencyTitle}`
                  : undefined}
              >
                <SelectValue
                  className="truncate"
                  placeholder={subtopicId ? "Select a competency" : "Select a subtopic first"}
                />
              </SelectTrigger>
              <SelectContent className="max-w-md">
                {competencies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.competencyCode} — {c.competencyTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="template">Template (optional)</Label>
              {competencyId && !showTemplateForm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplateForm(true)}
                  disabled={isSaving}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  New Template
                </Button>
              )}
            </div>
            {!showTemplateForm && (
              <Select
                items={templates.map((t) => ({ value: t.id, label: t.title }))}
                value={templateId}
                onValueChange={(v) => setTemplateId(v ?? "")}
                disabled={isSaving || !competencyId}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder={competencyId ? "Select a template" : "Select a competency first"} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {showTemplateForm && (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new-template-title">Template Title *</Label>
                  <Input
                    id="new-template-title"
                    placeholder="e.g., Upper Limb Bones and Joints"
                    value={newTemplateTitle}
                    onChange={(e) => setNewTemplateTitle(e.target.value)}
                    disabled={isCreatingTemplate}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-template-instructions">Instructions</Label>
                  <Textarea
                    id="new-template-instructions"
                    placeholder="Optional guidance for faculty"
                    rows={2}
                    value={newTemplateInstructions}
                    onChange={(e) => setNewTemplateInstructions(e.target.value)}
                    disabled={isCreatingTemplate}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Questions *</Label>
                  {newQuestions.map((q, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Input
                        placeholder={`Question ${i + 1}`}
                        value={q.questionText}
                        onChange={(e) => updateDraftQuestion(i, { questionText: e.target.value })}
                        disabled={isCreatingTemplate}
                      />
                      <div className="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
                        <Checkbox
                          checked={q.required}
                          onCheckedChange={(checked) => updateDraftQuestion(i, { required: checked === true })}
                          disabled={isCreatingTemplate}
                          aria-label="Required question"
                        />
                        Required
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeDraftQuestion(i)}
                        disabled={isCreatingTemplate || newQuestions.length === 1}
                        aria-label="Remove question"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addDraftQuestion} disabled={isCreatingTemplate}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add Question
                  </Button>
                </div>

                {templateFormError && (
                  <p className="text-sm text-destructive" role="alert">{templateFormError}</p>
                )}

                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" onClick={handleCreateTemplate} disabled={isCreatingTemplate}>
                    {isCreatingTemplate ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Template"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowTemplateForm(false);
                      resetTemplateDraft();
                    }}
                    disabled={isCreatingTemplate}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="batch">Batch *</Label>
            <Input
              id="batch"
              placeholder="MBBS-2024"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
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
                  Assigning...
                </>
              ) : (
                "Assign Template"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
