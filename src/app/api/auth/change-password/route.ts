import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  }

  const body = await request.json();
  const { currentPassword, newPassword } = body as { currentPassword?: string; newPassword?: string };

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ message: "Current password and new password are required." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ message: "New password must be at least 8 characters." }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId));
  if (!user) {
    return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json({ message: "Current password is incorrect." }, { status: 400 });
  }

  await db.update(users).set({ passwordHash: hashPassword(newPassword) }).where(eq(users.id, user.id));

  return NextResponse.json({ message: "Password updated successfully." });
}
