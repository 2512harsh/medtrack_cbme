import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { studentAllocations, faculty, students, subjects, users } from "@/db/schema";
import { requireRole, requireInstitution, type SessionUser } from "@/lib/api-auth";

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

// Faculty ids reachable by this dean/HOD: scoped to their institution, and to
// their own department if they're an HOD.
async function scopedFacultyIds(user: SessionUser): Promise<Set<string>> {
  const conditions = [eq(users.institutionId, user.institutionId!)];
  if (user.role === "HOD") conditions.push(eq(faculty.departmentId, user.departmentId!));

  const rows = await db
    .select({ id: faculty.id })
    .from(faculty)
    .innerJoin(users, eq(faculty.userId, users.id))
    .where(and(...conditions));
  return new Set(rows.map((r) => r.id));
}

export async function GET(request: NextRequest) {
  // Faculty only ever sees their own allocations, regardless of query params.
  const auth = await requireRole(request, ["Dean", "HOD", "Faculty"]);
  if (!auth.ok) return auth.response;

  if (auth.user.role === "Faculty") {
    const [ownFaculty] = await db.select({ id: faculty.id }).from(faculty).where(eq(faculty.userId, auth.user.id));
    if (!ownFaculty) return NextResponse.json([]);
    const rows = await db.select().from(studentAllocations).where(eq(studentAllocations.facultyId, ownFaculty.id));
    return NextResponse.json(await embedAllocations(rows));
  }

  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

  const departmentId =
    auth.user.role === "HOD" ? auth.user.departmentId : request.nextUrl.searchParams.get("departmentId");
  if (auth.user.role === "HOD" && !departmentId) {
    return NextResponse.json({ message: "Your account has no department assigned." }, { status: 403 });
  }
  const facultyId = request.nextUrl.searchParams.get("facultyId");
  const studentId = request.nextUrl.searchParams.get("studentId");

  const allowedFacultyIds = await scopedFacultyIds(auth.user);
  const rows = await db.select().from(studentAllocations);

  let filtered = rows.filter((r) => allowedFacultyIds.has(r.facultyId));
  if (departmentId && auth.user.role !== "HOD") {
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
  const auth = await requireRole(request, ["Dean", "HOD"]);
  if (!auth.ok) return auth.response;
  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

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

  const allowedFacultyIds = await scopedFacultyIds(auth.user);
  if (!allowedFacultyIds.has(facultyId)) {
    return NextResponse.json({ message: "Faculty not found" }, { status: 404 });
  }

  const [studentUser] = await db
    .select({ institutionId: users.institutionId })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(eq(students.id, studentId));
  if (!studentUser || studentUser.institutionId !== auth.user.institutionId) {
    return NextResponse.json({ message: "Student not found" }, { status: 404 });
  }

  const [row] = await db
    .insert(studentAllocations)
    .values({ facultyId, studentId, subjectId, allocatedBy: auth.user.id, active: active ?? true })
    .returning();

  const [embedded] = await embedAllocations([row]);
  return NextResponse.json(embedded, { status: 201 });
}
