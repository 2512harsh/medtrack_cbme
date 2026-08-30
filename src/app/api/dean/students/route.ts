import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { students, users, batches } from "@/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";
import { hashPassword } from "@/lib/password";
import { requireRole, requireInstitution } from "@/lib/api-auth";

function toStudent(
  row: { students: typeof students.$inferSelect; users: typeof users.$inferSelect },
  batchNameById: Map<string, string>
) {
  return {
    id: row.students.id,
    userId: row.students.userId,
    rollNumber: row.students.rollNumber,
    registrationNumber: row.students.registrationNumber,
    streamId: row.students.streamId,
    professionalYearId: row.students.professionalYearId,
    batchId: row.students.batchId,
    batch: batchNameById.get(row.students.batchId) ?? "",
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

async function batchNameMap(batchIds: string[]): Promise<Map<string, string>> {
  if (batchIds.length === 0) return new Map();
  const rows = await db.select().from(batches).where(inArray(batches.id, [...new Set(batchIds)]));
  return new Map(rows.map((b) => [b.id, b.name]));
}

export async function GET(request: NextRequest) {
  // Super Admin sees students across every institution (e.g. the audit
  // report); Dean/HOD are scoped to their own institution.
  const auth = await requireRole(request, ["Dean", "HOD", "Super Admin"]);
  if (!auth.ok) return auth.response;

  const conditions = [];

  if (auth.user.role === "Super Admin") {
    const institutionId = request.nextUrl.searchParams.get("institutionId");
    if (institutionId) conditions.push(eq(users.institutionId, institutionId));
  } else {
    const institutionError = requireInstitution(auth.user);
    if (institutionError) return institutionError;

    // Students belong to the institution, not a department — a student rotates
    // through many departments over their years — so Dean and HOD both see
    // every student in their institution.
    conditions.push(eq(users.institutionId, auth.user.institutionId!));
  }

  const rows = await db
    .select()
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(and(...conditions));
  const names = await batchNameMap(rows.map((r) => r.students.batchId));
  return NextResponse.json(rows.map((r) => toStudent(r, names)));
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
    batchId,
    admissionYear,
    status,
  } = body as {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    rollNumber: string;
    registrationNumber: string;
    streamId: string;
    professionalYearId: string;
    batchId: string;
    admissionYear: number;
    status?: "ACTIVE" | "INACTIVE";
  };

  if (!firstName || !lastName || !email || !password || !rollNumber || !registrationNumber || !streamId || !professionalYearId || !batchId || !admissionYear) {
    return NextResponse.json({ message: "Missing required student fields" }, { status: 400 });
  }

  const [batchRow] = await db.select().from(batches).where(eq(batches.id, batchId));
  if (!batchRow || batchRow.institutionId !== auth.user.institutionId) {
    return NextResponse.json({ message: "Batch not found" }, { status: 404 });
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
        // created under the creating Dean/HOD's own institution. No department:
        // a student's department link comes only from subject allocations.
        institutionId: auth.user.institutionId,
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
        batchId,
        admissionYear,
      })
      .returning();

    return NextResponse.json(
      toStudent({ students: studentRow, users: user }, new Map([[batchRow.id, batchRow.name]])),
      { status: 201 }
    );
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
