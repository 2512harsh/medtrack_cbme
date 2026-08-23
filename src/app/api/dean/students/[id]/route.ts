import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { students, users } from "@/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";
import { hashPassword } from "@/lib/password";

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

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/dean/students/[id]">) {
  const { id } = await ctx.params;
  const [row] = await db.select().from(students).innerJoin(users, eq(students.userId, users.id)).where(eq(students.id, id));
  if (!row) {
    return NextResponse.json({ message: "Student not found" }, { status: 404 });
  }
  return NextResponse.json(toStudent(row));
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/dean/students/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json();
  const {
    firstName,
    lastName,
    email,
    password,
    departmentId,
    rollNumber,
    registrationNumber,
    streamId,
    professionalYearId,
    batch,
    admissionYear,
    status,
  } = body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    departmentId?: string;
    rollNumber?: string;
    registrationNumber?: string;
    streamId?: string;
    professionalYearId?: string;
    batch?: string;
    admissionYear?: number;
    status?: "ACTIVE" | "INACTIVE";
  };

  const [existing] = await db.select().from(students).where(eq(students.id, id));
  if (!existing) {
    return NextResponse.json({ message: "Student not found" }, { status: 404 });
  }

  try {
    const studentUpdates: Partial<typeof students.$inferInsert> = {};
    if (rollNumber !== undefined) studentUpdates.rollNumber = rollNumber;
    if (registrationNumber !== undefined) studentUpdates.registrationNumber = registrationNumber;
    if (streamId !== undefined) studentUpdates.streamId = streamId;
    if (professionalYearId !== undefined) studentUpdates.professionalYearId = professionalYearId;
    if (batch !== undefined) studentUpdates.batch = batch;
    if (admissionYear !== undefined) studentUpdates.admissionYear = admissionYear;

    const [studentRow] = Object.keys(studentUpdates).length
      ? await db.update(students).set(studentUpdates).where(eq(students.id, id)).returning()
      : [existing];

    const userUpdates: Partial<typeof users.$inferInsert> = {};
    if (firstName !== undefined) userUpdates.firstName = firstName;
    if (lastName !== undefined) userUpdates.lastName = lastName;
    if (email !== undefined) userUpdates.email = email;
    if (password) userUpdates.passwordHash = hashPassword(password);
    if (departmentId !== undefined) userUpdates.departmentId = departmentId || null;
    if (status !== undefined) userUpdates.status = status;

    const [userRow] = Object.keys(userUpdates).length
      ? await db.update(users).set(userUpdates).where(eq(users.id, existing.userId)).returning()
      : await db.select().from(users).where(eq(users.id, existing.userId));

    return NextResponse.json(toStudent({ students: studentRow, users: userRow }));
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json({ message: "That email or registration number is already in use." }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/dean/students/[id]">) {
  const { id } = await ctx.params;
  const [existing] = await db.select().from(students).where(eq(students.id, id));
  if (!existing) {
    return NextResponse.json({ message: "Student not found" }, { status: 404 });
  }
  await db.delete(users).where(eq(users.id, existing.userId));
  return NextResponse.json({ ok: true });
}
