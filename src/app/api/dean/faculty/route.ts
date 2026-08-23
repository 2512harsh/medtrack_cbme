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

export async function GET(request: NextRequest) {
  const departmentId = request.nextUrl.searchParams.get("departmentId");
  const query = db.select().from(faculty).innerJoin(users, eq(faculty.userId, users.id));
  const rows = departmentId ? await query.where(eq(faculty.departmentId, departmentId)) : await query;
  return NextResponse.json(rows.map(toFaculty));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { firstName, lastName, email, password, departmentId, designation, employeeCode, specialization, status } = body as {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    departmentId: string;
    designation: string;
    employeeCode: string;
    specialization?: string;
    status?: "ACTIVE" | "INACTIVE";
  };

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
