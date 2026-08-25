import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import type { UserRole } from "@/types";

export type SessionUser = {
  id: string;
  role: UserRole;
  institutionId: string | null;
  departmentId: string | null;
};

export type AuthResult = { ok: true; user: SessionUser } | { ok: false; response: NextResponse };

// Authenticates the request and checks the caller's role. API routes are not
// covered by proxy.ts (it explicitly skips /api/* — see proxy.ts), so every
// route that needs auth or role/institution scoping must call this itself.
export async function requireRole(request: NextRequest, allowedRoles: UserRole[]): Promise<AuthResult> {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!session) {
    return { ok: false, response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId));
  if (!user || user.status !== "ACTIVE") {
    return { ok: false, response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  if (!allowedRoles.includes(user.role as UserRole)) {
    return { ok: false, response: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      role: user.role as UserRole,
      institutionId: user.institutionId,
      departmentId: user.departmentId,
    },
  };
}

export function requireInstitution(user: SessionUser): NextResponse | null {
  if (!user.institutionId) {
    return NextResponse.json({ message: "Your account has no institution assigned." }, { status: 403 });
  }
  return null;
}
