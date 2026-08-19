import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subjects, topics, subtopics, competencies } from "@/db/schema";

interface ImportRow {
  subject?: string;
  topic: string;
  subtopic: string;
  code: string;
  title: string;
  level?: string;
  core: boolean;
  sheet?: string;
  rowNumber?: number;
}

type ImportMode = "insert" | "update" | "upsert";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { defaultSubjectId, mode, rows } = body as {
    defaultSubjectId?: string;
    mode?: ImportMode;
    rows?: ImportRow[];
  };

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ message: "rows are required" }, { status: 400 });
  }
  const importMode: ImportMode = mode ?? "upsert";

  const allSubjects = await db.select().from(subjects);
  const subjectIdByName = new Map(allSubjects.map((s) => [s.name.trim().toLowerCase(), s.id]));

  const allTopics = await db.select().from(topics);
  const topicIdByKey = new Map(allTopics.map((t) => [`${t.subjectId}::${t.title.trim().toLowerCase()}`, t.id]));

  const allSubtopics = await db.select().from(subtopics);
  const subtopicIdByKey = new Map(
    allSubtopics.map((s) => [`${s.topicId}::${s.title.trim().toLowerCase()}`, s.id])
  );

  const allCompetencies = await db.select().from(competencies);
  const competencyByCode = new Map(allCompetencies.map((c) => [c.competencyCode.trim().toLowerCase(), c]));

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: { row: number; sheet: string; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const subjectName = row.subject?.trim();
      const topicTitle = row.topic?.trim();
      const subtopicTitle = row.subtopic?.trim();
      const code = row.code?.trim();
      const title = row.title?.trim();

      if (!topicTitle || !subtopicTitle || !code || !title) {
        throw new Error("Missing topic, subtopic, competency number, or competency text");
      }

      let subjectId: string | undefined;
      if (subjectName) {
        subjectId = subjectIdByName.get(subjectName.toLowerCase());
        if (!subjectId) {
          throw new Error(`Unknown subject "${subjectName}" — add it under Curriculum → Subjects first`);
        }
      } else {
        subjectId = defaultSubjectId;
        if (!subjectId) {
          throw new Error("No Subject column in the file and no default subject was selected");
        }
      }

      const topicKey = `${subjectId}::${topicTitle.toLowerCase()}`;
      let topicId = topicIdByKey.get(topicKey);
      if (!topicId) {
        const [newTopic] = await db.insert(topics).values({ subjectId, title: topicTitle }).returning();
        topicId = newTopic.id;
        topicIdByKey.set(topicKey, topicId);
      }

      const subtopicKey = `${topicId}::${subtopicTitle.toLowerCase()}`;
      let subtopicId = subtopicIdByKey.get(subtopicKey);
      if (!subtopicId) {
        const [newSubtopic] = await db.insert(subtopics).values({ topicId, title: subtopicTitle }).returning();
        subtopicId = newSubtopic.id;
        subtopicIdByKey.set(subtopicKey, subtopicId);
      }

      const existing = competencyByCode.get(code.toLowerCase());

      if (existing) {
        if (importMode === "insert") {
          skipped++;
          continue;
        }
        const [updatedRow] = await db
          .update(competencies)
          .set({
            subtopicId,
            competencyTitle: title,
            competencyLevel: row.level || null,
            core: row.core,
          })
          .where(eq(competencies.id, existing.id))
          .returning();
        competencyByCode.set(code.toLowerCase(), updatedRow);
        updated++;
      } else {
        if (importMode === "update") {
          skipped++;
          continue;
        }
        const [newRow] = await db
          .insert(competencies)
          .values({
            subtopicId,
            competencyCode: code,
            competencyTitle: title,
            competencyLevel: row.level || null,
            core: row.core,
            status: "Active",
          })
          .returning();
        competencyByCode.set(code.toLowerCase(), newRow);
        created++;
      }
    } catch (err) {
      errors.push({
        row: row.rowNumber ?? i + 1,
        sheet: row.sheet ?? "",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ created, updated, skipped, errors });
}
