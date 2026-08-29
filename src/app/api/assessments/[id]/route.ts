import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assessments, students, users, competencyAssignments, competencies, batches } from "@/db/schema";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/assessments/[id]">) {
  const { id } = await ctx.params;
  const [row] = await db.select().from(assessments).where(eq(assessments.id, id));
  if (!row) {
    return NextResponse.json({ message: "Assessment not found" }, { status: 404 });
  }

  const [studentRow] = await db
    .select()
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(eq(students.id, row.studentId));
  const [batchRow] = studentRow
    ? await db.select().from(batches).where(eq(batches.id, studentRow.students.batchId))
    : [];
  const [assignment] = await db
    .select()
    .from(competencyAssignments)
    .where(eq(competencyAssignments.id, row.competencyAssignmentId));
  const competency = assignment
    ? (await db.select().from(competencies).where(eq(competencies.id, assignment.competencyId)))[0]
    : undefined;

  return NextResponse.json({
    ...row,
    student: studentRow && {
      id: studentRow.students.id,
      userId: studentRow.students.userId,
      rollNumber: studentRow.students.rollNumber,
      registrationNumber: studentRow.students.registrationNumber,
      streamId: studentRow.students.streamId,
      professionalYearId: studentRow.students.professionalYearId,
      batchId: studentRow.students.batchId,
      batch: batchRow?.name ?? "",
      admissionYear: studentRow.students.admissionYear,
      user: {
        id: studentRow.users.id,
        firstName: studentRow.users.firstName,
        lastName: studentRow.users.lastName,
        email: studentRow.users.email,
        role: studentRow.users.role,
        status: studentRow.users.status,
        departmentId: studentRow.users.departmentId ?? undefined,
        createdAt: studentRow.users.createdAt,
        updatedAt: studentRow.users.updatedAt,
      },
    },
    competencyAssignment: assignment && { ...assignment, competency },
  });
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/assessments/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json();
  const { currentStatus } = body as { currentStatus?: string };

  const updates: Partial<typeof assessments.$inferInsert> = {};
  if (currentStatus !== undefined) updates.currentStatus = currentStatus as typeof assessments.$inferInsert.currentStatus;

  // Resubmitting after a "Needs Remediation" review is the start of a new
  // attempt from the student's side, even though faculty hasn't reviewed it
  // yet — bump currentAttempt here so the faculty queue reflects that this
  // is a resubmission, not attempt 1 again. The attempt count naturally
  // stays in sync once faculty reviews it (see assessment-attempts/route.ts,
  // which numbers a new review as priorAttempts.length + 1).
  if (currentStatus === "Submitted") {
    const [existing] = await db.select().from(assessments).where(eq(assessments.id, id));
    if (existing?.currentStatus === "Reattempt Scheduled") {
      updates.currentAttempt = existing.currentAttempt + 1;
    }
  }

  const [row] = await db.update(assessments).set(updates).where(eq(assessments.id, id)).returning();
  if (!row) {
    return NextResponse.json({ message: "Assessment not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}
