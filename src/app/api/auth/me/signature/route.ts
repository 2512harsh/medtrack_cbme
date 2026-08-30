import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

// The caller's own signature image, on demand. Kept out of /api/auth/me so the
// ~1 MB data URL isn't sent on every page load.
export async function GET(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json(null, { status: 401 });
  }

  const [user] = await db
    .select({ signatureImage: users.signatureImage })
    .from(users)
    .where(eq(users.id, session.userId));
  if (!user) {
    return NextResponse.json(null, { status: 401 });
  }

  return NextResponse.json({ signatureImage: user.signatureImage ?? null });
}
