import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { faculty, users } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  }

  const [row] = await db
    .select()
    .from(faculty)
    .innerJoin(users, eq(faculty.userId, users.id))
    .where(eq(faculty.userId, session.userId));

  if (!row) {
    return NextResponse.json({ message: "No Faculty account is linked to this login." }, { status: 404 });
  }

  return NextResponse.json({
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
  });
}
