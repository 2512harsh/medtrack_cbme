import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { studentAllocations, faculty, students, subjects, users } from "@/db/schema";

async function embedAllocations(rows: (typeof studentAllocations.$inferSelect)[]) {
  if (rows.length === 0) return [];

  const facultyIds = [...new Set(rows.map((r) => r.facultyId))];
  const studentIds = [...new Set(rows.map((r) => r.studentId))];
  const subjectIds = [...new Set(rows.map((r) => r.subjectId))];

  const facultyRows = await db
    .select()
    .from(faculty)
    .innerJoin(users, eq(faculty.userId, users.id))
    .where(inArray(faculty.id, facultyIds));
  const studentRows = await db
    .select()
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(inArray(students.id, studentIds));
  const subjectRows = await db.select().from(subjects).where(inArray(subjects.id, subjectIds));

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
        batch: r.students.batch,
        admissionYear: r.students.admissionYear,
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
  const subjectById = new Map(subjectRows.map((s) => [s.id, s]));

  return rows.map((r) => ({
    ...r,
    faculty: facultyById.get(r.facultyId),
    student: studentById.get(r.studentId),
    subject: subjectById.get(r.subjectId),
  }));
}

export async function GET(request: NextRequest) {
  const departmentId = request.nextUrl.searchParams.get("departmentId");
  const facultyId = request.nextUrl.searchParams.get("facultyId");
  const studentId = request.nextUrl.searchParams.get("studentId");
  const rows = await db.select().from(studentAllocations);

  let filtered = rows;
  if (departmentId) {
    const deptFaculty = await db.select({ id: faculty.id }).from(faculty).where(eq(faculty.departmentId, departmentId));
    const deptFacultyIds = new Set(deptFaculty.map((f) => f.id));
    filtered = filtered.filter((r) => deptFacultyIds.has(r.facultyId));
  }
  if (facultyId) {
    filtered = filtered.filter((r) => r.facultyId === facultyId);
  }
  if (studentId) {
    filtered = filtered.filter((r) => r.studentId === studentId);
  }

  return NextResponse.json(await embedAllocations(filtered));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { facultyId, studentId, subjectId, active } = body as {
    facultyId?: string;
    studentId?: string;
    subjectId?: string;
    active?: boolean;
  };

  if (!facultyId || !studentId || !subjectId) {
    return NextResponse.json({ message: "facultyId, studentId, and subjectId are required" }, { status: 400 });
  }

  const [deanUser] = await db.select({ id: users.id }).from(users).where(eq(users.role, "Dean")).limit(1);
  if (!deanUser) {
    return NextResponse.json(
      { message: "No Dean account exists to attribute this allocation to. Create one under Super Admin → Deans first." },
      { status: 500 }
    );
  }

  const [row] = await db
    .insert(studentAllocations)
    .values({ facultyId, studentId, subjectId, allocatedBy: deanUser.id, active: active ?? true })
    .returning();

  const [embedded] = await embedAllocations([row]);
  return NextResponse.json(embedded, { status: 201 });
}
