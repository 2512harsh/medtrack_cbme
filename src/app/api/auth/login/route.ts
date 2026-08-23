import { NextRequest, NextResponse } from "next/server";
import { ilike } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

function toUserSummary(row: typeof users.$inferSelect) {
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

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(ilike(users.email, email));

  if (!user || user.passwordHash === "unset" || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }
  if (user.status !== "ACTIVE") {
    return NextResponse.json({ message: "Account is inactive. Please contact administrator." }, { status: 403 });
  }

  const token = await createSessionToken({ userId: user.id, role: user.role });

  const res = NextResponse.json(toUserSummary(user));
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
