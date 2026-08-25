import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
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

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/dean/hod/[id]">) {
  const auth = await requireRole(request, ["Dean"]);
  if (!auth.ok) return auth.response;
  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

  const { id } = await ctx.params;
  const body = await request.json();
  const { firstName, lastName, email, password, departmentId, status } = body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    departmentId?: string;
    status?: "ACTIVE" | "INACTIVE";
  };

  const [existing] = await db.select().from(users).where(eq(users.id, id));
  // 404 (not 403) for out-of-institution rows so we don't confirm to a caller
  // that an HOD with this id exists elsewhere.
  if (!existing || existing.role !== "HOD" || existing.institutionId !== auth.user.institutionId) {
    return NextResponse.json({ message: "HOD not found" }, { status: 404 });
  }

  try {
    const updates: Partial<typeof users.$inferInsert> = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (email !== undefined) updates.email = email;
    if (password) updates.passwordHash = hashPassword(password);
    // institutionId is intentionally never updatable here — an HOD cannot be
    // moved to another institution through this endpoint.
    if (departmentId !== undefined) updates.departmentId = departmentId;
    if (status !== undefined) updates.status = status;

    const [row] = Object.keys(updates).length
      ? await db.update(users).set(updates).where(eq(users.id, id)).returning()
      : [existing];

    return NextResponse.json(toHod(row));
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json({ message: "That email is already in use." }, { status: 409 });
    }
    throw err;
  }
}
