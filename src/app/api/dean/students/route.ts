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

export async function GET(request: NextRequest) {
  const departmentId = request.nextUrl.searchParams.get("departmentId");
  const query = db.select().from(students).innerJoin(users, eq(students.userId, users.id));
  const rows = departmentId ? await query.where(eq(users.departmentId, departmentId)) : await query;
  return NextResponse.json(rows.map(toStudent));
}

export async function POST(request: NextRequest) {
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
