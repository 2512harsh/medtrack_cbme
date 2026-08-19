"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  getSubjects,
  getTopics,
  getSubtopics,
  getCompetencies,
  createTopic,
  updateTopic,
  createSubtopic,
  updateSubtopic,
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
  SubtopicFormDialog,
  type SubtopicFormValues,
} from "@/features/curriculum/components/SubtopicFormDialog";
import {
  CompetencyFormDialog,
  type CompetencyFormValues,
} from "@/features/curriculum/components/CompetencyFormDialog";
import type { Subject, Topic, Subtopic, Competency } from "@/types";

export default function CompetenciesPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [subjectId, setSubjectId] = useState<string>("");
  const [openTopicIds, setOpenTopicIds] = useState<Set<string>>(new Set());

  const [topicFormOpen, setTopicFormOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isSavingTopic, setIsSavingTopic] = useState(false);

  const [subtopicFormOpen, setSubtopicFormOpen] = useState(false);
  const [editingSubtopic, setEditingSubtopic] = useState<Subtopic | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [isSavingSubtopic, setIsSavingSubtopic] = useState(false);

  const [competencyFormOpen, setCompetencyFormOpen] = useState(false);
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);
  const [competencyContext, setCompetencyContext] = useState<{
    subjectId?: string;
    topicId?: string;
    subtopicId?: string;
  }>({});
  const [isSavingCompetency, setIsSavingCompetency] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subs, allTopics, allSubtopics, allCompetencies] = await Promise.all([
        getSubjects(),
        getTopics(),
        getSubtopics(),
        getCompetencies(),
      ]);
      setSubjects(subs);
      setTopics(allTopics);
      setSubtopics(allSubtopics);
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

  const subtopicsByTopic = useMemo(() => {
    const map = new Map<string, Subtopic[]>();
    for (const s of subtopics) {
      const list = map.get(s.topicId) ?? [];
      list.push(s);
      map.set(s.topicId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    }
    return map;
  }, [subtopics]);

  const competenciesBySubtopic = useMemo(() => {
    const map = new Map<string, Competency[]>();
    for (const c of competencies) {
      const list = map.get(c.subtopicId) ?? [];
      list.push(c);
      map.set(c.subtopicId, list);
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

  const openCreateSubtopic = (topicId: string) => {
    setActiveTopicId(topicId);
    setEditingSubtopic(null);
    setSubtopicFormOpen(true);
  };

  const openEditSubtopic = (subtopic: Subtopic) => {
    setActiveTopicId(subtopic.topicId);
    setEditingSubtopic(subtopic);
    setSubtopicFormOpen(true);
  };

  const handleSaveSubtopic = async (values: SubtopicFormValues) => {
    if (!activeTopicId) return;
    setIsSavingSubtopic(true);
    try {
      if (editingSubtopic) {
        await updateSubtopic(editingSubtopic.id, values);
        toast.success("Subtopic updated successfully");
      } else {
        await createSubtopic({ topicId: activeTopicId, ...values });
        toast.success("Subtopic added successfully");
      }
      setSubtopicFormOpen(false);
      const allSubtopics = await getSubtopics();
      setSubtopics(allSubtopics);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save subtopic");
    } finally {
      setIsSavingSubtopic(false);
    }
  };

  const openCreateCompetency = (context: { subjectId?: string; topicId?: string; subtopicId?: string } = {}) => {
    setCompetencyContext({ subjectId, ...context });
    setEditingCompetency(null);
    setCompetencyFormOpen(true);
  };

  const openEditCompetency = (competency: Competency) => {
    setCompetencyContext({});
    setEditingCompetency(competency);
    setCompetencyFormOpen(true);
  };

  const handleSaveCompetency = async (values: CompetencyFormValues) => {
    setIsSavingCompetency(true);
    try {
      if (editingCompetency) {
        await updateCompetency(editingCompetency.id, values);
        toast.success("Competency updated successfully");
      } else {
        await createCompetency({
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
        description="Build the competency framework subject by topic by subtopic by competency"
        dataSource="live"
        actions={
          <Button onClick={() => openCreateCompetency()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Competency
          </Button>
        }
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
                  const topicSubtopics = subtopicsByTopic.get(topic.id) ?? [];
                  const topicCompetencyCount = topicSubtopics.reduce(
                    (sum, s) => sum + (competenciesBySubtopic.get(s.id)?.length ?? 0),
                    0
                  );
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
                            ({topicCompetencyCount} {topicCompetencyCount === 1 ? "competency" : "competencies"})
                          </span>
                        </button>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" title="Edit Topic" onClick={() => openEditTopic(topic)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openCreateSubtopic(topic.id)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Subtopic
                          </Button>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="space-y-4 border-t px-4 pb-4 pt-4">
                          {topicSubtopics.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No subtopics added to this topic yet.
                            </p>
                          ) : (
                            topicSubtopics.map((subtopic) => {
                              const subtopicCompetencies = competenciesBySubtopic.get(subtopic.id) ?? [];
                              return (
                                <div key={subtopic.id} className="rounded-md border">
                                  <div className="flex items-center justify-between gap-2 bg-muted/40 px-3 py-2">
                                    <span className="text-sm font-medium">{subtopic.title}</span>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Edit Subtopic"
                                        onClick={() => openEditSubtopic(subtopic)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          openCreateCompetency({
                                            subjectId: topic.subjectId,
                                            topicId: topic.id,
                                            subtopicId: subtopic.id,
                                          })
                                        }
                                      >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Competency
                                      </Button>
                                    </div>
                                  </div>

                                  {subtopicCompetencies.length === 0 ? (
                                    <p className="px-3 py-3 text-sm text-muted-foreground">
                                      No competencies added to this subtopic yet.
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
                                        {subtopicCompetencies.map((c) => (
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
                              );
                            })
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

      <SubtopicFormDialog
        open={subtopicFormOpen}
        onOpenChange={setSubtopicFormOpen}
        subtopic={editingSubtopic}
        nextDisplayOrder={(activeTopicId ? subtopicsByTopic.get(activeTopicId)?.length ?? 0 : 0) + 1}
        isSaving={isSavingSubtopic}
        onSave={handleSaveSubtopic}
      />

      <CompetencyFormDialog
        open={competencyFormOpen}
        onOpenChange={setCompetencyFormOpen}
        competency={editingCompetency}
        subjects={subjects}
        topics={topics}
        subtopics={subtopics}
        initialSubjectId={competencyContext.subjectId}
        initialTopicId={competencyContext.topicId}
        initialSubtopicId={competencyContext.subtopicId}
        isSaving={isSavingCompetency}
        onSave={handleSaveCompetency}
      />
    </div>
  );
}
