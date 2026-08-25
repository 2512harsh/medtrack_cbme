import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";
import { hashPassword } from "@/lib/password";
import { requireRole, requireInstitution } from "@/lib/api-auth";

function toHod(row: typeof users.$inferSelect) {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    role: row.role,
    status: row.status,
    institutionId: row.institutionId ?? undefined,
    departmentId: row.departmentId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  // Super Admin sees HODs across every institution (e.g. the platform
  // dashboard's HOD count); Dean is scoped to their own institution only.
  const auth = await requireRole(request, ["Dean", "Super Admin"]);
  if (!auth.ok) return auth.response;

  const departmentId = request.nextUrl.searchParams.get("departmentId");
  const conditions = [eq(users.role, "HOD")];

  if (auth.user.role === "Dean") {
    const institutionError = requireInstitution(auth.user);
    if (institutionError) return institutionError;
    conditions.push(eq(users.institutionId, auth.user.institutionId!));
  } else {
    const institutionId = request.nextUrl.searchParams.get("institutionId");
    if (institutionId) conditions.push(eq(users.institutionId, institutionId));
  }
  if (departmentId) conditions.push(eq(users.departmentId, departmentId));

  const rows = await db.select().from(users).where(and(...conditions));
  return NextResponse.json(rows.map(toHod));
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["Dean"]);
  if (!auth.ok) return auth.response;
  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

  const body = await request.json();
  const { firstName, lastName, email, password, departmentId, status } = body as {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    departmentId: string;
    status?: "ACTIVE" | "INACTIVE";
  };

  if (!firstName || !lastName || !email || !password || !departmentId) {
    return NextResponse.json(
      { message: "firstName, lastName, email, password, and departmentId are required" },
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
        role: "HOD",
        status: status ?? "ACTIVE",
        // Institution is never taken from the client — an HOD is always
        // created under the creating Dean's own institution.
        institutionId: auth.user.institutionId,
        departmentId,
      })
      .returning();

    return NextResponse.json(toHod(user), { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json({ message: `Email "${email}" is already in use.` }, { status: 409 });
    }
    throw err;
  }
}
