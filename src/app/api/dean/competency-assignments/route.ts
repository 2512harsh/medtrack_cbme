import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { competencyAssignments, faculty, users, competencies, subtopics, topics, subjects, students, assessments } from "@/db/schema";

async function embedAssignments(rows: (typeof competencyAssignments.$inferSelect)[]) {
  if (rows.length === 0) return [];

  const facultyIds = [...new Set(rows.map((r) => r.facultyId))];
  const competencyIds = [...new Set(rows.map((r) => r.competencyId))];
  const batches = [...new Set(rows.map((r) => r.batch))];

  const [
    facultyRows,
    competencyRows,
    subtopicRows,
    topicRows,
    subjectRows,
    studentRows,
    assessmentRows,
  ] = await Promise.all([
    db.select().from(faculty).innerJoin(users, eq(faculty.userId, users.id)).where(inArray(faculty.id, facultyIds)),
    db.select().from(competencies).where(inArray(competencies.id, competencyIds)),
    db.select().from(subtopics),
    db.select().from(topics),
    db.select().from(subjects),
    db.select().from(students).where(inArray(students.batch, batches)),
    db.select().from(assessments).where(inArray(assessments.competencyAssignmentId, rows.map((r) => r.id))),
  ]);

  const facultyById = new Map(
    facultyRows.map((r) => [
      r.faculty.id,
      {
        id: r.faculty.id,
        userId: r.faculty.userId,
        departmentId: r.faculty.departmentId,
        designation: r.faculty.designation,
        employeeCode: r.faculty.employeeCode,
        specialization: r.faculty.specialization ?? undefined,
        user: {
          id: r.users.id,
          firstName: r.users.firstName,
          lastName: r.users.lastName,
          email: r.users.email,
          role: r.users.role,
          status: r.users.status,
          departmentId: r.users.departmentId ?? undefined,
          createdAt: r.users.createdAt,
          updatedAt: r.users.updatedAt,
        },
      },
    ])
  );

  const topicIdBySubtopicId = new Map(subtopicRows.map((s) => [s.id, s.topicId]));
  const subjectIdByTopicId = new Map(topicRows.map((t) => [t.id, t.subjectId]));
  const subjectNameById = new Map(subjectRows.map((s) => [s.id, s.name]));

  function subjectNameForCompetency(subtopicId: string): string | undefined {
    const topicId = topicIdBySubtopicId.get(subtopicId);
    const subjectId = topicId ? subjectIdByTopicId.get(topicId) : undefined;
    return subjectId ? subjectNameById.get(subjectId) : undefined;
  }

  const competencyById = new Map(
    competencyRows.map((c) => [c.id, { ...c, subjectName: subjectNameForCompetency(c.subtopicId) }])
  );

  const studentCountByBatch = new Map<string, number>();
  for (const s of studentRows) {
    studentCountByBatch.set(s.batch, (studentCountByBatch.get(s.batch) ?? 0) + 1);
  }

  const completedCountByAssignmentId = new Map<string, number>();
  for (const a of assessmentRows) {
    if (a.currentStatus === "Completed") {
      completedCountByAssignmentId.set(
        a.competencyAssignmentId,
        (completedCountByAssignmentId.get(a.competencyAssignmentId) ?? 0) + 1
      );
    }
  }

  return rows.map((r) => {
    const totalStudents = studentCountByBatch.get(r.batch) ?? 0;
    const completed = completedCountByAssignmentId.get(r.id) ?? 0;
    return {
      ...r,
      faculty: facultyById.get(r.facultyId),
      competency: competencyById.get(r.competencyId),
      pendingCount: Math.max(totalStudents - completed, 0),
    };
  });
}

export async function GET(request: NextRequest) {
  const departmentId = request.nextUrl.searchParams.get("departmentId");
  const facultyId = request.nextUrl.searchParams.get("facultyId");
  const batch = request.nextUrl.searchParams.get("batch");
  const rows = await db.select().from(competencyAssignments);

  let filtered = rows;
  if (departmentId) {
    const deptFaculty = await db.select({ id: faculty.id }).from(faculty).where(eq(faculty.departmentId, departmentId));
    const deptFacultyIds = new Set(deptFaculty.map((f) => f.id));
    filtered = filtered.filter((r) => deptFacultyIds.has(r.facultyId));
  }
  if (facultyId) {
    filtered = filtered.filter((r) => r.facultyId === facultyId);
  }
  if (batch) {
    filtered = filtered.filter((r) => r.batch === batch);
  }

  return NextResponse.json(await embedAssignments(filtered));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { facultyId, competencyId, batch } = body as { facultyId?: string; competencyId?: string; batch?: string };

  if (!facultyId || !competencyId || !batch) {
    return NextResponse.json({ message: "facultyId, competencyId, and batch are required" }, { status: 400 });
  }

  const [deanUser] = await db.select({ id: users.id }).from(users).where(eq(users.role, "Dean")).limit(1);
  if (!deanUser) {
    return NextResponse.json(
      { message: "No Dean account exists to attribute this assignment to. Create one under Super Admin → Deans first." },
      { status: 500 }
    );
  }

  const [row] = await db
    .insert(competencyAssignments)
    .values({ facultyId, competencyId, batch, assignedBy: deanUser.id })
    .returning();

  const [embedded] = await embedAssignments([row]);
  return NextResponse.json(embedded, { status: 201 });
}
