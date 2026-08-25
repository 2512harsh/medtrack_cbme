import { inArray, eq } from "drizzle-orm";
import { db } from "@/db";
import { subjects, topics, subtopics } from "@/db/schema";
import type { SessionUser } from "@/lib/api-auth";

// Subjects/topics/subtopics/competencies are a shared curriculum library (like
// departments — see the comment on `departments` in schema.ts), not owned by
// one institution. Dean and Super Admin see the whole library; HOD/Faculty/
// Student are limited to their own department's slice of it.
const DEPARTMENT_SCOPED_ROLES = ["HOD", "Faculty", "Student"];

export function isDepartmentScoped(user: SessionUser): boolean {
  return DEPARTMENT_SCOPED_ROLES.includes(user.role);
}

export async function departmentSubjectIds(departmentId: string): Promise<string[]> {
  const rows = await db.select({ id: subjects.id }).from(subjects).where(eq(subjects.departmentId, departmentId));
  return rows.map((r) => r.id);
}

export async function departmentTopicIds(departmentId: string): Promise<string[]> {
  const subjectIds = await departmentSubjectIds(departmentId);
  if (subjectIds.length === 0) return [];
  const rows = await db.select({ id: topics.id }).from(topics).where(inArray(topics.subjectId, subjectIds));
  return rows.map((r) => r.id);
}

export async function departmentSubtopicIds(departmentId: string): Promise<string[]> {
  const topicIds = await departmentTopicIds(departmentId);
  if (topicIds.length === 0) return [];
  const rows = await db.select({ id: subtopics.id }).from(subtopics).where(inArray(subtopics.topicId, topicIds));
  return rows.map((r) => r.id);
}
