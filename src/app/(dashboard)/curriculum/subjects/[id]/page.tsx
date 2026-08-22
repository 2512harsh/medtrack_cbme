"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { getSubjects, getTopics, getSubtopics, getCompetencies } from "@/features/curriculum/services/curriculum";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { ChevronRight } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import type { Subject, Topic } from "@/types";

type TopicRow = {
  id: string;
  title: string;
  subjectName: string;
  competencyCount: number;
};

const columns: ColumnDef<AppTableFeatures, TopicRow>[] = [
  {
    accessorKey: "title",
    header: "Topic",
    cell: ({ row }) => (
      <Link
        href={`/curriculum/topics/${row.original.id}`}
        className="flex items-center gap-2 font-medium text-primary hover:underline"
      >
        {row.getValue("title")}
        <ChevronRight className="h-4 w-4" />
      </Link>
    ),
  },
  {
    accessorKey: "subjectName",
    header: "Subject",
  },
  {
    accessorKey: "competencyCount",
    header: "Competencies",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("competencyCount")}</span>
    ),
  },
];

export default function SubjectDetailPage() {
  const params = useParams();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<TopicRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const subjects = await getSubjects();
      const found = subjects.find((s: Subject) => s.id === params.id);
      setSubject(found || null);
      
      if (found) {
        const [topicData, subtopicData, competencyData] = await Promise.all([
          getTopics(found.id),
          getSubtopics(),
          getCompetencies(),
        ]);
        setTopics(
          topicData.map((t: Topic) => {
            const subtopicIds = new Set(subtopicData.filter((s) => s.topicId === t.id).map((s) => s.id));
            return {
              id: t.id,
              title: t.title,
              subjectName: found.name || "",
              competencyCount: competencyData.filter((c) => subtopicIds.has(c.subtopicId)).length,
            };
          })
        );
      } else {
        setTopics([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load subject details"));
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Unable to load subject details. Please try again.</p>
        <button onClick={fetchData} className="mt-4 text-primary hover:underline">
          Try Again
        </button>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium">Subject not found</p>
        <p className="text-sm text-muted-foreground mt-2">The requested subject could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={subject.name} description={<>{subject.code} • Topics and competencies</>} dataSource="live" />

      <AsyncContent
        data={topics}
        isLoading={false}
        error={null}
        emptyTitle="No topics found"
        emptyDescription="No topics have been added to this subject yet."
        loadingColumns={3}
      >
        {(data) => (
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Search topics..."
          />
        )}
      </AsyncContent>
    </div>
  );
}
