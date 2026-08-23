import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { faculty, users } from "@/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";
import { hashPassword } from "@/lib/password";

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

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/dean/faculty/[id]">) {
  const { id } = await ctx.params;
  const [row] = await db.select().from(faculty).innerJoin(users, eq(faculty.userId, users.id)).where(eq(faculty.id, id));
  if (!row) {
    return NextResponse.json({ message: "Faculty not found" }, { status: 404 });
  }
  return NextResponse.json(toFaculty(row));
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/dean/faculty/[id]">) {
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

  const [existing] = await db.select().from(faculty).where(eq(faculty.id, id));
  if (!existing) {
    return NextResponse.json({ message: "Faculty not found" }, { status: 404 });
  }

  try {
    const facultyUpdates: Partial<typeof faculty.$inferInsert> = {};
    if (departmentId !== undefined) facultyUpdates.departmentId = departmentId;
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
    if (departmentId !== undefined) userUpdates.departmentId = departmentId;
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
