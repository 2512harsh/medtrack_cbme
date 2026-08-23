import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  students,
  assessments,
  competencyAssignments,
  competencies,
  subtopics,
  topics,
  subjects,
} from "@/db/schema";

export async function GET() {
  const [student] = await db.select().from(students).limit(1);
  if (!student) {
    return NextResponse.json([]);
  }

  const studentAssessments = await db.select().from(assessments).where(eq(assessments.studentId, student.id));
  if (studentAssessments.length === 0) {
    return NextResponse.json([]);
  }

  const assignmentIds = [...new Set(studentAssessments.map((a) => a.competencyAssignmentId))];
  const assignmentRows = await db
    .select()
    .from(competencyAssignments)
    .where(inArray(competencyAssignments.id, assignmentIds));

  const competencyIds = [...new Set(assignmentRows.map((a) => a.competencyId))];
  const competencyRows = await db.select().from(competencies).where(inArray(competencies.id, competencyIds));

  const subtopicIds = [...new Set(competencyRows.map((c) => c.subtopicId))];
  const subtopicRows = await db.select().from(subtopics).where(inArray(subtopics.id, subtopicIds));

  const topicIds = [...new Set(subtopicRows.map((s) => s.topicId))];
  const topicRows = await db.select().from(topics).where(inArray(topics.id, topicIds));

  const subjectIds = [...new Set(topicRows.map((t) => t.subjectId))];
  const subjectRows = await db.select().from(subjects).where(inArray(subjects.id, subjectIds));

  const assignmentById = new Map(assignmentRows.map((a) => [a.id, a]));
  const competencyById = new Map(competencyRows.map((c) => [c.id, c]));
  const subtopicById = new Map(subtopicRows.map((s) => [s.id, s]));
  const topicById = new Map(topicRows.map((t) => [t.id, t]));
  const subjectById = new Map(subjectRows.map((s) => [s.id, s]));

  const totals = new Map<string, { completed: number; total: number }>();
  for (const a of studentAssessments) {
    const assignment = assignmentById.get(a.competencyAssignmentId);
    const competency = assignment && competencyById.get(assignment.competencyId);
    const subtopic = competency && subtopicById.get(competency.subtopicId);
    const topic = subtopic && topicById.get(subtopic.topicId);
    const subject = topic && subjectById.get(topic.subjectId);
    const subjectName = subject?.name ?? "Unknown Subject";

    const entry = totals.get(subjectName) ?? { completed: 0, total: 0 };
    entry.total += 1;
    if (a.currentStatus === "Completed") entry.completed += 1;
    totals.set(subjectName, entry);
  }

  return NextResponse.json(
    [...totals.entries()].map(([subject, t]) => ({ subject, ...t }))
  );
}
