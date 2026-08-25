import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { students, users } from "@/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";
import { hashPassword } from "@/lib/password";
import { requireRole, requireInstitution } from "@/lib/api-auth";

function toStudent(row: { students: typeof students.$inferSelect; users: typeof users.$inferSelect }) {
  return {
    id: row.students.id,
    userId: row.students.userId,
    rollNumber: row.students.rollNumber,
    registrationNumber: row.students.registrationNumber,
    streamId: row.students.streamId,
    professionalYearId: row.students.professionalYearId,
    batch: row.students.batch,
    admissionYear: row.students.admissionYear,
    user: {
      id: row.users.id,
      firstName: row.users.firstName,
      lastName: row.users.lastName,
      email: row.users.email,
      role: row.users.role,
      status: row.users.status,
      departmentId: row.users.departmentId ?? undefined,
      createdAt: row.users.createdAt,
      updatedAt: row.users.updatedAt,
    },
  };
}

export async function GET(request: NextRequest) {
  // Super Admin sees students across every institution (e.g. the audit
  // report); Dean/HOD are scoped to their own institution/department.
  const auth = await requireRole(request, ["Dean", "HOD", "Super Admin"]);
  if (!auth.ok) return auth.response;

  const conditions = [];

  if (auth.user.role === "Super Admin") {
    const institutionId = request.nextUrl.searchParams.get("institutionId");
    if (institutionId) conditions.push(eq(users.institutionId, institutionId));
    const departmentId = request.nextUrl.searchParams.get("departmentId");
    if (departmentId) conditions.push(eq(users.departmentId, departmentId));
  } else {
    const institutionError = requireInstitution(auth.user);
    if (institutionError) return institutionError;

    const departmentId =
      auth.user.role === "HOD" ? auth.user.departmentId : request.nextUrl.searchParams.get("departmentId");
    if (auth.user.role === "HOD" && !departmentId) {
      return NextResponse.json({ message: "Your account has no department assigned." }, { status: 403 });
    }

    conditions.push(eq(users.institutionId, auth.user.institutionId!));
    if (departmentId) conditions.push(eq(users.departmentId, departmentId));
  }

  const rows = await db
    .select()
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(and(...conditions));
  return NextResponse.json(rows.map(toStudent));
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["Dean", "HOD"]);
  if (!auth.ok) return auth.response;
  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

  const body = await request.json();
  const {
    firstName,
    lastName,
    email,
    password,
    rollNumber,
    registrationNumber,
    streamId,
    professionalYearId,
    batch,
    admissionYear,
    status,
  } = body as {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    departmentId?: string;
    rollNumber: string;
    registrationNumber: string;
    streamId: string;
    professionalYearId: string;
    batch: string;
    admissionYear: number;
    status?: "ACTIVE" | "INACTIVE";
  };

  // HOD's students always land in their own department; Dean may assign any
  // department (or leave unassigned).
  const departmentId = auth.user.role === "HOD" ? auth.user.departmentId : (body as { departmentId?: string }).departmentId;

  if (!firstName || !lastName || !email || !password || !rollNumber || !registrationNumber || !streamId || !professionalYearId || !batch || !admissionYear) {
    return NextResponse.json({ message: "Missing required student fields" }, { status: 400 });
  }

  try {
    const [user] = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email,
        passwordHash: hashPassword(password),
        role: "Student",
        status: status ?? "ACTIVE",
        // Institution is never taken from the client — a student is always
        // created under the creating Dean/HOD's own institution.
        institutionId: auth.user.institutionId,
        departmentId: departmentId || null,
      })
      .returning();

    const [studentRow] = await db
      .insert(students)
      .values({
        userId: user.id,
        rollNumber,
        registrationNumber,
        streamId,
        professionalYearId,
        batch,
        admissionYear,
      })
      .returning();

    return NextResponse.json(toStudent({ students: studentRow, users: user }), { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { message: `Email "${email}" or registration number "${registrationNumber}" is already in use.` },
        { status: 409 }
      );
    }
    throw err;
  }
}
