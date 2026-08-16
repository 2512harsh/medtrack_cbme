"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  getSubjects,
  getTopics,
  getCompetencies,
  createTopic,
  updateTopic,
  createCompetency,
  updateCompetency,
} from "@/features/curriculum/services/curriculum";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, Edit, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  TopicFormDialog,
  type TopicFormValues,
} from "@/features/curriculum/components/TopicFormDialog";
import {
  CompetencyFormDialog,
  type CompetencyFormValues,
} from "@/features/curriculum/components/CompetencyFormDialog";
import type { Subject, Topic, Competency } from "@/types";

export default function CompetenciesPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [subjectId, setSubjectId] = useState<string>("");
  const [openTopicIds, setOpenTopicIds] = useState<Set<string>>(new Set());

  const [topicFormOpen, setTopicFormOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isSavingTopic, setIsSavingTopic] = useState(false);

  const [competencyFormOpen, setCompetencyFormOpen] = useState(false);
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [isSavingCompetency, setIsSavingCompetency] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subs, allTopics, allCompetencies] = await Promise.all([
        getSubjects(),
        getTopics(),
        getCompetencies(),
      ]);
      setSubjects(subs);
      setTopics(allTopics);
      setCompetencies(allCompetencies);
      setSubjectId((prev) => prev || subs[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load competencies"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const subjectTopics = useMemo(
    () => topics.filter((t) => t.subjectId === subjectId).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [topics, subjectId]
  );

  const competenciesByTopic = useMemo(() => {
    const map = new Map<string, Competency[]>();
    for (const c of competencies) {
      const list = map.get(c.topicId) ?? [];
      list.push(c);
      map.set(c.topicId, list);
    }
    return map;
  }, [competencies]);

  const toggleTopic = (topicId: string) => {
    setOpenTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const openCreateTopic = () => {
    setEditingTopic(null);
    setTopicFormOpen(true);
  };

  const openEditTopic = (topic: Topic) => {
    setEditingTopic(topic);
    setTopicFormOpen(true);
  };

  const handleSaveTopic = async (values: TopicFormValues) => {
    setIsSavingTopic(true);
    try {
      if (editingTopic) {
        await updateTopic(editingTopic.id, values);
        toast.success("Topic updated successfully");
      } else {
        await createTopic({ subjectId, ...values });
        toast.success("Topic added successfully");
      }
      setTopicFormOpen(false);
      const allTopics = await getTopics();
      setTopics(allTopics);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save topic");
    } finally {
      setIsSavingTopic(false);
    }
  };

  const openCreateCompetency = (topicId: string) => {
    setActiveTopicId(topicId);
    setEditingCompetency(null);
    setCompetencyFormOpen(true);
  };

  const openEditCompetency = (competency: Competency) => {
    setActiveTopicId(competency.topicId);
    setEditingCompetency(competency);
    setCompetencyFormOpen(true);
  };

  const handleSaveCompetency = async (values: CompetencyFormValues) => {
    if (!activeTopicId) return;
    setIsSavingCompetency(true);
    try {
      if (editingCompetency) {
        await updateCompetency(editingCompetency.id, values);
        toast.success("Competency updated successfully");
      } else {
        await createCompetency({
          topicId: activeTopicId,
          status: "Active",
          ...values,
        });
        toast.success("Competency added successfully");
      }
      setCompetencyFormOpen(false);
      const allCompetencies = await getCompetencies();
      setCompetencies(allCompetencies);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save competency");
    } finally {
      setIsSavingCompetency(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competencies"
        description="Build the competency framework subject by topic by competency"
      />

      <AsyncContent
        data={subjects.length ? subjects : undefined}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No subjects found"
        emptyDescription="Add a subject first before building its competencies."
      >
        {() => (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1.5 w-full sm:w-72">
                <Label htmlFor="subject-select">Subject</Label>
                <Select
                  items={subjects.map((s) => ({ value: s.id, label: s.name }))}
                  value={subjectId}
                  onValueChange={(v) => setSubjectId(v ?? "")}
                >
                  <SelectTrigger className="w-full" id="subject-select">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={openCreateTopic} disabled={!subjectId}>
                <Plus className="h-4 w-4 mr-2" />
                Add Topic
              </Button>
            </div>

            {subjectTopics.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No topics yet for this subject. Add a topic to start building competencies.
              </div>
            ) : (
              <div className="space-y-3">
                {subjectTopics.map((topic) => {
                  const topicCompetencies = competenciesByTopic.get(topic.id) ?? [];
                  const isOpen = openTopicIds.has(topic.id);
                  return (
                    <div key={topic.id} className="rounded-lg border bg-card">
                      <div className="flex items-center justify-between gap-2 px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleTopic(topic.id)}
                          className="flex flex-1 items-center gap-2 text-left"
                        >
                          <ChevronDown
                            className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                          />
                          <span className="font-medium">{topic.title}</span>
                          <span className="text-xs text-muted-foreground">
                            ({topicCompetencies.length} {topicCompetencies.length === 1 ? "competency" : "competencies"})
                          </span>
                        </button>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" title="Edit Topic" onClick={() => openEditTopic(topic)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openCreateCompetency(topic.id)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Competency
                          </Button>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="border-t px-4 pb-4">
                          {topicCompetencies.length === 0 ? (
                            <p className="py-4 text-sm text-muted-foreground">
                              No competencies added to this topic yet.
                            </p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Number</TableHead>
                                  <TableHead>Competency</TableHead>
                                  <TableHead>Level</TableHead>
                                  <TableHead>Core</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {topicCompetencies.map((c) => (
                                  <TableRow key={c.id}>
                                    <TableCell className="font-mono text-sm text-muted-foreground">
                                      {c.competencyCode}
                                    </TableCell>
                                    <TableCell>
                                      <Link
                                        href={`/curriculum/competencies/${c.id}`}
                                        className="font-medium text-primary hover:underline"
                                      >
                                        {c.competencyTitle}
                                      </Link>
                                    </TableCell>
                                    <TableCell>{c.competencyLevel}</TableCell>
                                    <TableCell>
                                      <StatusBadge variant={c.core ? "success" : "default"}>
                                        {c.core ? "Yes" : "No"}
                                      </StatusBadge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="icon" title="Edit" onClick={() => openEditCompetency(c)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </AsyncContent>

      <TopicFormDialog
        open={topicFormOpen}
        onOpenChange={setTopicFormOpen}
        topic={editingTopic}
        nextDisplayOrder={subjectTopics.length + 1}
        isSaving={isSavingTopic}
        onSave={handleSaveTopic}
      />

      <CompetencyFormDialog
        open={competencyFormOpen}
        onOpenChange={setCompetencyFormOpen}
        competency={editingCompetency}
        isSaving={isSavingCompetency}
        onSave={handleSaveCompetency}
      />
    </div>
  );
}
