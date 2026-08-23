import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";
import { hashPassword } from "@/lib/password";

function toDean(row: typeof users.$inferSelect) {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    role: row.role,
    status: row.status,
    institutionId: row.institutionId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  const institutionId = request.nextUrl.searchParams.get("institutionId");

  const conditions = [eq(users.role, "Dean")];
  if (institutionId) conditions.push(eq(users.institutionId, institutionId));

  const rows = await db.select().from(users).where(and(...conditions));
  return NextResponse.json(rows.map(toDean));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { firstName, lastName, email, password, institutionId, status } = body as {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    institutionId: string;
    status?: "ACTIVE" | "INACTIVE";
  };

  if (!firstName || !lastName || !email || !password || !institutionId) {
    return NextResponse.json(
      { message: "firstName, lastName, email, password, and institutionId are required" },
      { status: 400 }
    );
  }

  try {
    const [user] = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email,
        passwordHash: hashPassword(password),
        role: "Dean",
        status: status ?? "ACTIVE",
        institutionId,
      })
      .returning();

    return NextResponse.json(toDean(user), { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json({ message: `Email "${email}" is already in use.` }, { status: 409 });
    }
    throw err;
  }
}
