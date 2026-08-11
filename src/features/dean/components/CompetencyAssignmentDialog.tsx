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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { getFaculty } from "@/features/dean/services/dean";
import {
  getSubjects,
  getTopics,
  getCompetencies,
  getQuestionTemplates,
} from "@/features/curriculum/services/curriculum";
import type { Competency, Faculty, QuestionTemplate, Subject, Topic } from "@/types";

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
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);

  const [facultyId, setFacultyId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [competencyId, setCompetencyId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [batch, setBatch] = useState("MBBS-2024");
  const [error, setError] = useState<string | null>(null);

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
      setCompetencyId("");
      setTemplateId("");
      setTopics([]);
      setCompetencies([]);
      setTemplates([]);
      setError(null);
    }
  }, [open, faculty]);

  useEffect(() => {
    if (!subjectId) {
      setTopics([]);
      setTopicId("");
      setCompetencies([]);
      setCompetencyId("");
      setTemplates([]);
      setTemplateId("");
      return;
    }
    setTopicId("");
    setCompetencyId("");
    setTemplateId("");
    setTopics([]);
    getTopics(subjectId).then(setTopics);
  }, [subjectId]);

  useEffect(() => {
    if (!topicId) {
      setCompetencies([]);
      setCompetencyId("");
      setTemplates([]);
      setTemplateId("");
      return;
    }
    setCompetencyId("");
    setTemplateId("");
    setCompetencies([]);
    getCompetencies(topicId).then(setCompetencies);
  }, [topicId]);

  useEffect(() => {
    if (!competencyId) {
      setTemplates([]);
      setTemplateId("");
      return;
    }
    setTemplateId("");
    getQuestionTemplates(competencyId).then(setTemplates);
  }, [competencyId]);

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
            <Select value={facultyId} onValueChange={(v) => setFacultyId(v ?? "")} disabled={isSaving}>
              <SelectTrigger id="faculty">
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
            <Select value={subjectId} onValueChange={(v) => setSubjectId(v ?? "")} disabled={isSaving}>
              <SelectTrigger id="subject">
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
            <Select value={topicId} onValueChange={(v) => setTopicId(v ?? "")} disabled={isSaving || !subjectId}>
              <SelectTrigger id="topic">
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
            <Label htmlFor="competency">Competency *</Label>
            <Select value={competencyId} onValueChange={(v) => setCompetencyId(v ?? "")} disabled={isSaving || !topicId}>
              <SelectTrigger id="competency">
                <SelectValue placeholder={topicId ? "Select a competency" : "Select a topic first"} />
              </SelectTrigger>
              <SelectContent>
                {competencies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.competencyCode} — {c.competencyTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Template *</Label>
            <Select value={templateId} onValueChange={(v) => setTemplateId(v ?? "")} disabled={isSaving || !competencyId}>
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
