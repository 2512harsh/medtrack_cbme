import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { isUniqueViolation } from "@/lib/db-errors";

function toResponse(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    status: user.status,
    institutionId: user.institutionId ?? undefined,
    departmentId: user.departmentId ?? undefined,
    signatureImage: user.signatureImage ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

const SIGNATURE_DATA_URL = /^data:image\/(png|jpeg);base64,/;
const SIGNATURE_MAX_LENGTH = 1_000_000;

export async function GET(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json(null, { status: 401 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId));
  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json(null, { status: 401 });
  }

  return NextResponse.json(toResponse(user));
}

export async function PATCH(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  }

  const body = await request.json();
  const { firstName, lastName, email, signatureImage } = body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    signatureImage?: string | null;
  };

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return NextResponse.json({ message: "First name, last name, and email are required." }, { status: 400 });
  }

  const updates: Partial<typeof users.$inferInsert> = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
  };

  // Only touch the signature when the client sends the key: "" / null clears it,
  // a data URL replaces it, anything else is rejected.
  if (signatureImage !== undefined) {
    if (signatureImage === null || signatureImage === "") {
      updates.signatureImage = null;
    } else if (
      typeof signatureImage === "string" &&
      SIGNATURE_DATA_URL.test(signatureImage) &&
      signatureImage.length <= SIGNATURE_MAX_LENGTH
    ) {
      updates.signatureImage = signatureImage;
    } else {
      return NextResponse.json(
        { message: "Signature must be a PNG or JPEG image under ~700 KB." },
        { status: 400 }
      );
    }
  }

  try {
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, session.userId))
      .returning();
    if (!updated) {
      return NextResponse.json({ message: "Not signed in." }, { status: 401 });
    }
    return NextResponse.json(toResponse(updated));
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json({ message: `Email "${email}" is already in use.` }, { status: 409 });
    }
    throw err;
  }
}
