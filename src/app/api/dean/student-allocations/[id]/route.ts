import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { studentAllocations, faculty, students, subjects, users, batches } from "@/db/schema";
import { requireRole, requireInstitution, type SessionUser } from "@/lib/api-auth";

async function embedAllocation(row: typeof studentAllocations.$inferSelect) {
  const [facultyRow] = await db
    .select()
    .from(faculty)
    .innerJoin(users, eq(faculty.userId, users.id))
    .where(eq(faculty.id, row.facultyId));
  const [studentRow] = await db
    .select()
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(eq(students.id, row.studentId));
  const [subjectRow] = await db.select().from(subjects).where(eq(subjects.id, row.subjectId));
  const [batchRow] = studentRow
    ? await db.select().from(batches).where(eq(batches.id, studentRow.students.batchId))
    : [];

  return {
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
    subject: subjectRow,
  };
}

async function facultyInScope(facultyId: string, user: SessionUser): Promise<boolean> {
  const [row] = await db.select().from(faculty).innerJoin(users, eq(faculty.userId, users.id)).where(eq(faculty.id, facultyId));
  if (!row || row.users.institutionId !== user.institutionId) return false;
  if (user.role === "HOD" && row.faculty.departmentId !== user.departmentId) return false;
  return true;
}

export async function GET(request: NextRequest, ctx: RouteContext<"/api/dean/student-allocations/[id]">) {
  const auth = await requireRole(request, ["Dean", "HOD"]);
  if (!auth.ok) return auth.response;
  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

  const { id } = await ctx.params;
  const [row] = await db.select().from(studentAllocations).where(eq(studentAllocations.id, id));
  if (!row || !(await facultyInScope(row.facultyId, auth.user))) {
    return NextResponse.json({ message: "Allocation not found" }, { status: 404 });
  }
  return NextResponse.json(await embedAllocation(row));
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/dean/student-allocations/[id]">) {
  const auth = await requireRole(request, ["Dean", "HOD"]);
  if (!auth.ok) return auth.response;
  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

  const { id } = await ctx.params;
  const [existing] = await db.select().from(studentAllocations).where(eq(studentAllocations.id, id));
  if (!existing || !(await facultyInScope(existing.facultyId, auth.user))) {
    return NextResponse.json({ message: "Allocation not found" }, { status: 404 });
  }

  const body = await request.json();
  const { facultyId, active } = body as { facultyId?: string; active?: boolean };

  if (facultyId !== undefined && !(await facultyInScope(facultyId, auth.user))) {
    return NextResponse.json({ message: "Faculty not found" }, { status: 404 });
  }

  const updates: Partial<typeof studentAllocations.$inferInsert> = {};
  if (facultyId !== undefined) updates.facultyId = facultyId;
  if (active !== undefined) updates.active = active;

  const [row] = await db
    .update(studentAllocations)
    .set(updates)
    .where(eq(studentAllocations.id, id))
    .returning();
  if (!row) {
    return NextResponse.json({ message: "Allocation not found" }, { status: 404 });
  }

  return NextResponse.json(await embedAllocation(row));
}
