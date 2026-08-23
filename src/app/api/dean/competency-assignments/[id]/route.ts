import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { competencyAssignments, faculty, users, competencies, subtopics, topics, subjects } from "@/db/schema";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/dean/competency-assignments/[id]">) {
  const { id } = await ctx.params;
  const [row] = await db.select().from(competencyAssignments).where(eq(competencyAssignments.id, id));
  if (!row) {
    return NextResponse.json({ message: "Competency assignment not found" }, { status: 404 });
  }

  const [facultyRow] = await db
    .select()
    .from(faculty)
    .innerJoin(users, eq(faculty.userId, users.id))
    .where(eq(faculty.id, row.facultyId));
  const [competency] = await db.select().from(competencies).where(eq(competencies.id, row.competencyId));

  let subjectName: string | undefined;
  if (competency) {
    const [subtopic] = await db.select().from(subtopics).where(eq(subtopics.id, competency.subtopicId));
    const topicId = subtopic?.topicId;
    const [topic] = topicId ? await db.select().from(topics).where(eq(topics.id, topicId)) : [];
    const subjectId = topic?.subjectId;
    const [subject] = subjectId ? await db.select().from(subjects).where(eq(subjects.id, subjectId)) : [];
    subjectName = subject?.name;
  }

  return NextResponse.json({
    ...row,
    faculty: facultyRow && {
      id: facultyRow.faculty.id,
      userId: facultyRow.faculty.userId,
      departmentId: facultyRow.faculty.departmentId,
      designation: facultyRow.faculty.designation,
      employeeCode: facultyRow.faculty.employeeCode,
      specialization: facultyRow.faculty.specialization ?? undefined,
      user: {
        id: facultyRow.users.id,
        firstName: facultyRow.users.firstName,
        lastName: facultyRow.users.lastName,
        email: facultyRow.users.email,
        role: facultyRow.users.role,
        status: facultyRow.users.status,
        departmentId: facultyRow.users.departmentId ?? undefined,
        createdAt: facultyRow.users.createdAt,
        updatedAt: facultyRow.users.updatedAt,
      },
    },
    competency: competency && { ...competency, subjectName },
  });
}
