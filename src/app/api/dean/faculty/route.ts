import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { faculty, users } from "@/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";
import { hashPassword } from "@/lib/password";
import { requireRole, requireInstitution } from "@/lib/api-auth";

function toFaculty(row: { faculty: typeof faculty.$inferSelect; users: typeof users.$inferSelect }) {
  return {
    id: row.faculty.id,
    userId: row.faculty.userId,
    departmentId: row.faculty.departmentId,
    designation: row.faculty.designation,
    employeeCode: row.faculty.employeeCode,
    specialization: row.faculty.specialization ?? undefined,
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
  // Super Admin sees faculty across every institution (e.g. the audit
  // report); Dean/HOD are scoped to their own institution/department.
  const auth = await requireRole(request, ["Dean", "HOD", "Super Admin"]);
  if (!auth.ok) return auth.response;

  const conditions = [];

  if (auth.user.role === "Super Admin") {
    const institutionId = request.nextUrl.searchParams.get("institutionId");
    if (institutionId) conditions.push(eq(users.institutionId, institutionId));
    const departmentId = request.nextUrl.searchParams.get("departmentId");
    if (departmentId) conditions.push(eq(faculty.departmentId, departmentId));
  } else {
    const institutionError = requireInstitution(auth.user);
    if (institutionError) return institutionError;

    // HOD is always pinned to their own department; Dean may optionally
    // narrow to one department within their institution via the query param.
    const departmentId =
      auth.user.role === "HOD" ? auth.user.departmentId : request.nextUrl.searchParams.get("departmentId");
    if (auth.user.role === "HOD" && !departmentId) {
      return NextResponse.json({ message: "Your account has no department assigned." }, { status: 403 });
    }

    conditions.push(eq(users.institutionId, auth.user.institutionId!));
    if (departmentId) conditions.push(eq(faculty.departmentId, departmentId));
  }

  const rows = await db
    .select()
    .from(faculty)
    .innerJoin(users, eq(faculty.userId, users.id))
    .where(and(...conditions));
  return NextResponse.json(rows.map(toFaculty));
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["Dean", "HOD"]);
  if (!auth.ok) return auth.response;
  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

  const body = await request.json();
  const { firstName, lastName, email, password, designation, employeeCode, specialization, status } = body as {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    departmentId?: string;
    designation: string;
    employeeCode: string;
    specialization?: string;
    status?: "ACTIVE" | "INACTIVE";
  };

  // HOD can only create faculty in their own department; Dean must choose one.
  const departmentId = auth.user.role === "HOD" ? auth.user.departmentId : (body as { departmentId?: string }).departmentId;

  if (!firstName || !lastName || !email || !password || !departmentId || !designation || !employeeCode) {
    return NextResponse.json({ message: "Missing required faculty fields" }, { status: 400 });
  }

  try {
    const [user] = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email,
        passwordHash: hashPassword(password),
        role: "Faculty",
        status: status ?? "ACTIVE",
        // Institution is never taken from the client — faculty is always
        // created under the creating Dean/HOD's own institution.
        institutionId: auth.user.institutionId,
        departmentId,
      })
      .returning();

    const [facultyRow] = await db
      .insert(faculty)
      .values({
        userId: user.id,
        departmentId,
        designation,
        employeeCode,
        specialization: specialization || null,
      })
      .returning();

    return NextResponse.json(toFaculty({ faculty: facultyRow, users: user }), { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { message: `Email "${email}" or employee code "${employeeCode}" is already in use.` },
        { status: 409 }
      );
    }
    throw err;
  }
}
