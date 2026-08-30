import { NextRequest, NextResponse } from "next/server";
import { eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { users, students, institutions, batches, professionalYears } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { isUniqueViolation } from "@/lib/db-errors";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  const rollNumber = String(body.rollNumber ?? "").trim();
  const registrationNumber = String(body.registrationNumber ?? "").trim() || rollNumber;
  const institutionId = String(body.institutionId ?? "");
  const batchId = String(body.batchId ?? "");
  const professionalYearId = String(body.professionalYearId ?? "");

  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !rollNumber ||
    !institutionId ||
    !batchId ||
    !professionalYearId
  ) {
    return NextResponse.json({ message: "All fields are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ message: "Password must be at least 8 characters." }, { status: 400 });
  }

  const [institution] = await db.select().from(institutions).where(eq(institutions.id, institutionId));
  if (!institution || institution.status !== "ACTIVE") {
    return NextResponse.json({ message: "Select a valid institution." }, { status: 400 });
  }

  const [batch] = await db.select().from(batches).where(eq(batches.id, batchId));
  if (!batch || batch.institutionId !== institutionId || batch.status !== "ACTIVE") {
    return NextResponse.json({ message: "Select a valid batch for that institution." }, { status: 400 });
  }

  const [profYear] = await db
    .select()
    .from(professionalYears)
    .where(eq(professionalYears.id, professionalYearId));
  if (!profYear || profYear.streamId !== batch.streamId) {
    return NextResponse.json({ message: "Select a valid professional year for that batch." }, { status: 400 });
  }

  // Friendly, specific messages before hitting the unique constraints.
  const [emailTaken] = await db.select({ id: users.id }).from(users).where(ilike(users.email, email));
  if (emailTaken) {
    return NextResponse.json(
      { message: "An account with this email already exists — try signing in instead." },
      { status: 409 }
    );
  }
  const [regTaken] = await db
    .select({ id: students.id })
    .from(students)
    .where(ilike(students.registrationNumber, registrationNumber));
  if (regTaken) {
    return NextResponse.json(
      { message: "A student with this registration number is already registered." },
      { status: 409 }
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
        role: "Student",
        status: "ACTIVE",
        institutionId,
      })
      .returning();

    await db.insert(students).values({
      userId: user.id,
      rollNumber,
      registrationNumber,
      streamId: batch.streamId,
      professionalYearId,
      batchId,
      admissionYear: batch.admissionYear,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { message: "That email or registration number is already registered." },
        { status: 409 }
      );
    }
    throw err;
  }
}
