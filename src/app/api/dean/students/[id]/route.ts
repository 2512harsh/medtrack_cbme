import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { students, users, batches } from "@/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";
import { hashPassword } from "@/lib/password";
import { requireRole, requireInstitution, type SessionUser } from "@/lib/api-auth";

async function toStudent(row: { students: typeof students.$inferSelect; users: typeof users.$inferSelect }) {
  const [batchRow] = await db.select().from(batches).where(eq(batches.id, row.students.batchId));
  return {
    id: row.students.id,
    userId: row.students.userId,
    rollNumber: row.students.rollNumber,
    registrationNumber: row.students.registrationNumber,
    streamId: row.students.streamId,
    professionalYearId: row.students.professionalYearId,
    batchId: row.students.batchId,
    batch: batchRow?.name ?? "",
    admissionYear: row.students.admissionYear,
    user: {
      id: row.users.id,
      firstName: row.users.firstName,
      lastName: row.users.lastName,
      email: row.users.email,
      role: row.users.role,
      status: row.users.status,
      createdAt: row.users.createdAt,
      updatedAt: row.users.updatedAt,
    },
  };
}

function inScope(row: { students: typeof students.$inferSelect; users: typeof users.$inferSelect }, user: SessionUser) {
  // Students are institution-scoped only — not tied to a department — so Dean
  // and HOD reach every student in their own institution.
  return row.users.institutionId === user.institutionId;
}

export async function GET(request: NextRequest, ctx: RouteContext<"/api/dean/students/[id]">) {
  const auth = await requireRole(request, ["Dean", "HOD"]);
  if (!auth.ok) return auth.response;
  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

  const { id } = await ctx.params;
  const [row] = await db.select().from(students).innerJoin(users, eq(students.userId, users.id)).where(eq(students.id, id));
  if (!row || !inScope(row, auth.user)) {
    return NextResponse.json({ message: "Student not found" }, { status: 404 });
  }
  return NextResponse.json(await toStudent(row));
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/dean/students/[id]">) {
  const auth = await requireRole(request, ["Dean", "HOD"]);
  if (!auth.ok) return auth.response;
  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

  const { id } = await ctx.params;
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
    batchId,
    admissionYear,
    status,
  } = body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    rollNumber?: string;
    registrationNumber?: string;
    streamId?: string;
    professionalYearId?: string;
    batchId?: string;
    admissionYear?: number;
    status?: "ACTIVE" | "INACTIVE";
  };

  const [existingRow] = await db.select().from(students).innerJoin(users, eq(students.userId, users.id)).where(eq(students.id, id));
  if (!existingRow || !inScope(existingRow, auth.user)) {
    return NextResponse.json({ message: "Student not found" }, { status: 404 });
  }
  const existing = existingRow.students;

  if (batchId !== undefined) {
    const [batchRow] = await db.select().from(batches).where(eq(batches.id, batchId));
    if (!batchRow || batchRow.institutionId !== auth.user.institutionId) {
      return NextResponse.json({ message: "Batch not found" }, { status: 404 });
    }
  }

  try {
    const studentUpdates: Partial<typeof students.$inferInsert> = {};
    if (rollNumber !== undefined) studentUpdates.rollNumber = rollNumber;
    if (registrationNumber !== undefined) studentUpdates.registrationNumber = registrationNumber;
    if (streamId !== undefined) studentUpdates.streamId = streamId;
    if (professionalYearId !== undefined) studentUpdates.professionalYearId = professionalYearId;
    if (batchId !== undefined) studentUpdates.batchId = batchId;
    if (admissionYear !== undefined) studentUpdates.admissionYear = admissionYear;

    const [studentRow] = Object.keys(studentUpdates).length
      ? await db.update(students).set(studentUpdates).where(eq(students.id, id)).returning()
      : [existing];

    const userUpdates: Partial<typeof users.$inferInsert> = {};
    if (firstName !== undefined) userUpdates.firstName = firstName;
    if (lastName !== undefined) userUpdates.lastName = lastName;
    if (email !== undefined) userUpdates.email = email;
    if (password) userUpdates.passwordHash = hashPassword(password);
    if (status !== undefined) userUpdates.status = status;

    const [userRow] = Object.keys(userUpdates).length
      ? await db.update(users).set(userUpdates).where(eq(users.id, existing.userId)).returning()
      : await db.select().from(users).where(eq(users.id, existing.userId));

    return NextResponse.json(await toStudent({ students: studentRow, users: userRow }));
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json({ message: "That email or registration number is already in use." }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/dean/students/[id]">) {
  const auth = await requireRole(request, ["Dean", "HOD"]);
  if (!auth.ok) return auth.response;
  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

  const { id } = await ctx.params;
  const [existingRow] = await db.select().from(students).innerJoin(users, eq(students.userId, users.id)).where(eq(students.id, id));
  if (!existingRow || !inScope(existingRow, auth.user)) {
    return NextResponse.json({ message: "Student not found" }, { status: 404 });
  }
  await db.delete(users).where(eq(users.id, existingRow.students.userId));
  return NextResponse.json({ ok: true });
}
