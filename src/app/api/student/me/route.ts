import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { students, users, batches } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  }

  const [row] = await db
    .select()
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(eq(students.userId, session.userId));

  if (!row) {
    return NextResponse.json({ message: "No Student account is linked to this login." }, { status: 404 });
  }

  const [batchRow] = await db.select().from(batches).where(eq(batches.id, row.students.batchId));

  return NextResponse.json({
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
  });
}
