import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { faculty, users } from "@/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";
import { hashPassword } from "@/lib/password";
import { requireRole, requireInstitution, type SessionUser } from "@/lib/api-auth";

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

function inScope(row: { faculty: typeof faculty.$inferSelect; users: typeof users.$inferSelect }, user: SessionUser) {
  if (row.users.institutionId !== user.institutionId) return false;
  if (user.role === "HOD" && row.faculty.departmentId !== user.departmentId) return false;
  return true;
}

export async function GET(request: NextRequest, ctx: RouteContext<"/api/dean/faculty/[id]">) {
  const auth = await requireRole(request, ["Dean", "HOD"]);
  if (!auth.ok) return auth.response;
  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

  const { id } = await ctx.params;
  const [row] = await db.select().from(faculty).innerJoin(users, eq(faculty.userId, users.id)).where(eq(faculty.id, id));
  if (!row || !inScope(row, auth.user)) {
    return NextResponse.json({ message: "Faculty not found" }, { status: 404 });
  }
  return NextResponse.json(toFaculty(row));
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/dean/faculty/[id]">) {
  const auth = await requireRole(request, ["Dean", "HOD"]);
  if (!auth.ok) return auth.response;
  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

  const { id } = await ctx.params;
  const body = await request.json();
  const { firstName, lastName, email, password, departmentId, designation, employeeCode, specialization, status } = body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    departmentId?: string;
    designation?: string;
    employeeCode?: string;
    specialization?: string;
    status?: "ACTIVE" | "INACTIVE";
  };

  const [existingRow] = await db.select().from(faculty).innerJoin(users, eq(faculty.userId, users.id)).where(eq(faculty.id, id));
  if (!existingRow || !inScope(existingRow, auth.user)) {
    return NextResponse.json({ message: "Faculty not found" }, { status: 404 });
  }
  const existing = existingRow.faculty;

  // HOD cannot move faculty out of their own department. inScope() already
  // guarantees auth.user.departmentId matches the existing row for an HOD,
  // so it's never null here.
  const nextDepartmentId = auth.user.role === "HOD" ? auth.user.departmentId! : departmentId;

  try {
    const facultyUpdates: Partial<typeof faculty.$inferInsert> = {};
    if (nextDepartmentId !== undefined) facultyUpdates.departmentId = nextDepartmentId;
    if (designation !== undefined) facultyUpdates.designation = designation;
    if (employeeCode !== undefined) facultyUpdates.employeeCode = employeeCode;
    if (specialization !== undefined) facultyUpdates.specialization = specialization || null;

    const [facultyRow] = Object.keys(facultyUpdates).length
      ? await db.update(faculty).set(facultyUpdates).where(eq(faculty.id, id)).returning()
      : [existing];

    const userUpdates: Partial<typeof users.$inferInsert> = {};
    if (firstName !== undefined) userUpdates.firstName = firstName;
    if (lastName !== undefined) userUpdates.lastName = lastName;
    if (email !== undefined) userUpdates.email = email;
    if (password) userUpdates.passwordHash = hashPassword(password);
    if (nextDepartmentId !== undefined) userUpdates.departmentId = nextDepartmentId;
    if (status !== undefined) userUpdates.status = status;

    const [userRow] = Object.keys(userUpdates).length
      ? await db.update(users).set(userUpdates).where(eq(users.id, existing.userId)).returning()
      : await db.select().from(users).where(eq(users.id, existing.userId));

    return NextResponse.json(toFaculty({ faculty: facultyRow, users: userRow }));
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json({ message: "That email or employee code is already in use." }, { status: 409 });
    }
    throw err;
  }
}
