import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { competencyAssignments, faculty, users, competencies, subtopics, topics, subjects, batches, students } from "@/db/schema";
import { requireRole, requireInstitution, type SessionUser } from "@/lib/api-auth";

async function embedAssignment(row: typeof competencyAssignments.$inferSelect) {
  const [facultyRow] = await db
    .select()
    .from(faculty)
    .innerJoin(users, eq(faculty.userId, users.id))
    .where(eq(faculty.id, row.facultyId));
  const [competency] = await db.select().from(competencies).where(eq(competencies.id, row.competencyId));
  const [batchRow] = await db.select().from(batches).where(eq(batches.id, row.batchId));

  let subjectName: string | undefined;
  if (competency) {
    const [subtopic] = await db.select().from(subtopics).where(eq(subtopics.id, competency.subtopicId));
    const topicId = subtopic?.topicId;
    const [topic] = topicId ? await db.select().from(topics).where(eq(topics.id, topicId)) : [];
    const subjectId = topic?.subjectId;
    const [subject] = subjectId ? await db.select().from(subjects).where(eq(subjects.id, subjectId)) : [];
    subjectName = subject?.name;
  }

  return {
    ...row,
    batch: batchRow?.name ?? "",
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
  };
}

async function facultyInScope(facultyId: string, user: SessionUser): Promise<boolean> {
  const [row] = await db.select().from(faculty).innerJoin(users, eq(faculty.userId, users.id)).where(eq(faculty.id, facultyId));
  if (!row || row.users.institutionId !== user.institutionId) return false;
  if (user.role === "HOD" && row.faculty.departmentId !== user.departmentId) return false;
  return true;
}

async function assignmentInScope(row: typeof competencyAssignments.$inferSelect, user: SessionUser): Promise<boolean> {
  if (user.role === "Faculty") {
    const [ownFaculty] = await db.select({ id: faculty.id }).from(faculty).where(eq(faculty.userId, user.id));
    return !!ownFaculty && ownFaculty.id === row.facultyId;
  }
  if (user.role === "Student") {
    const [ownStudent] = await db.select({ batchId: students.batchId }).from(students).where(eq(students.userId, user.id));
    return !!ownStudent && ownStudent.batchId === row.batchId;
  }
  return facultyInScope(row.facultyId, user);
}

export async function GET(request: NextRequest, ctx: RouteContext<"/api/dean/competency-assignments/[id]">) {
  const auth = await requireRole(request, ["Dean", "HOD", "Faculty", "Student"]);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const [row] = await db.select().from(competencyAssignments).where(eq(competencyAssignments.id, id));
  if (!row || !(await assignmentInScope(row, auth.user))) {
    return NextResponse.json({ message: "Competency assignment not found" }, { status: 404 });
  }

  return NextResponse.json(await embedAssignment(row));
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/dean/competency-assignments/[id]">) {
  const auth = await requireRole(request, ["Dean", "HOD"]);
  if (!auth.ok) return auth.response;
  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

  const { id } = await ctx.params;
  const [existing] = await db.select().from(competencyAssignments).where(eq(competencyAssignments.id, id));
  if (!existing || !(await facultyInScope(existing.facultyId, auth.user))) {
    return NextResponse.json({ message: "Competency assignment not found" }, { status: 404 });
  }

  const body = await request.json();
  const { facultyId, competencyId, batchId } = body as {
    facultyId?: string;
    competencyId?: string;
    batchId?: string;
  };

  if (facultyId && !(await facultyInScope(facultyId, auth.user))) {
    return NextResponse.json({ message: "Faculty not found" }, { status: 404 });
  }

  if (batchId) {
    const [batchRow] = await db.select().from(batches).where(eq(batches.id, batchId));
    if (!batchRow || batchRow.institutionId !== auth.user.institutionId) {
      return NextResponse.json({ message: "Batch not found" }, { status: 404 });
    }
  }

  const updates: Partial<typeof competencyAssignments.$inferInsert> = {};
  if (facultyId) updates.facultyId = facultyId;
  if (competencyId) updates.competencyId = competencyId;
  if (batchId) updates.batchId = batchId;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: "No fields to update" }, { status: 400 });
  }

  const [row] = await db
    .update(competencyAssignments)
    .set(updates)
    .where(eq(competencyAssignments.id, id))
    .returning();

  if (!row) {
    return NextResponse.json({ message: "Competency assignment not found" }, { status: 404 });
  }

  return NextResponse.json(await embedAssignment(row));
}
