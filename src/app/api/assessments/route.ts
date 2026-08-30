import { NextRequest, NextResponse } from "next/server";
import { eq, inArray, and } from "drizzle-orm";
import { db } from "@/db";
import { assessments, students, users, competencyAssignments, competencies, batches } from "@/db/schema";

async function embedAssessments(rows: (typeof assessments.$inferSelect)[]) {
  if (rows.length === 0) return [];

  const studentIds = [...new Set(rows.map((r) => r.studentId))];
  const assignmentIds = [...new Set(rows.map((r) => r.competencyAssignmentId))];

  const [studentRows, assignmentRows] = await Promise.all([
    db
      .select()
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(inArray(students.id, studentIds)),
    db
      .select()
      .from(competencyAssignments)
      .where(inArray(competencyAssignments.id, assignmentIds)),
  ]);

  const competencyIds = [...new Set(assignmentRows.map((a) => a.competencyId))];

  const [batchRows, competencyRows] = await Promise.all([
    db
      .select()
      .from(batches)
      .where(inArray(batches.id, [...new Set(studentRows.map((r) => r.students.batchId))])),
    db.select().from(competencies).where(inArray(competencies.id, competencyIds)),
  ]);
  const batchNameById = new Map(batchRows.map((b) => [b.id, b.name]));

  const studentById = new Map(
    studentRows.map((r) => [
      r.students.id,
      {
        id: r.students.id,
        userId: r.students.userId,
        rollNumber: r.students.rollNumber,
        registrationNumber: r.students.registrationNumber,
        streamId: r.students.streamId,
        professionalYearId: r.students.professionalYearId,
        batchId: r.students.batchId,
        batch: batchNameById.get(r.students.batchId) ?? "",
        admissionYear: r.students.admissionYear,
        user: {
          id: r.users.id,
          firstName: r.users.firstName,
          lastName: r.users.lastName,
          email: r.users.email,
          role: r.users.role,
          status: r.users.status,
          createdAt: r.users.createdAt,
          updatedAt: r.users.updatedAt,
        },
      },
    ])
  );
  const competencyById = new Map(competencyRows.map((c) => [c.id, c]));
  const assignmentById = new Map(
    assignmentRows.map((a) => [a.id, { ...a, competency: competencyById.get(a.competencyId) }])
  );

  return rows.map((r) => ({
    ...r,
    student: studentById.get(r.studentId),
    competencyAssignment: assignmentById.get(r.competencyAssignmentId),
  }));
}

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get("studentId");
  const rows = studentId
    ? await db.select().from(assessments).where(eq(assessments.studentId, studentId))
    : await db.select().from(assessments);
  return NextResponse.json(await embedAssessments(rows));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { studentId, competencyAssignmentId } = body as { studentId?: string; competencyAssignmentId?: string };

  if (!studentId || !competencyAssignmentId) {
    return NextResponse.json({ message: "studentId and competencyAssignmentId are required" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.studentId, studentId), eq(assessments.competencyAssignmentId, competencyAssignmentId)));

  if (existing) {
    const [embedded] = await embedAssessments([existing]);
    return NextResponse.json(embedded);
  }

  const [row] = await db
    .insert(assessments)
    .values({ studentId, competencyAssignmentId, currentAttempt: 0, currentStatus: "Draft" })
    .returning();

  const [embedded] = await embedAssessments([row]);
  return NextResponse.json(embedded, { status: 201 });
}
