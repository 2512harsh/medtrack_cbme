import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { students, users, streams, professionalYears, batches } from "@/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";
import { hashPassword } from "@/lib/password";
import { requireRole, requireInstitution } from "@/lib/api-auth";

interface ImportRow {
  firstName: string;
  lastName?: string;
  email: string;
  rollNumber: string;
  registrationNumber: string;
  stream: string;
  professionalYear: string;
  batch: string;
  admissionYear?: string;
  password?: string;
  sheet?: string;
  rowNumber?: number;
}

type ImportMode = "insert" | "update" | "upsert";

function generatePassword(): string {
  return `Med${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 90 + 10)}`;
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["Dean", "HOD"]);
  if (!auth.ok) return auth.response;
  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

  const body = await request.json();
  const { mode, rows } = body as {
    mode?: ImportMode;
    rows?: ImportRow[];
  };

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ message: "rows are required" }, { status: 400 });
  }
  const importMode: ImportMode = mode ?? "upsert";

  const allStreams = await db.select().from(streams);
  const streamIdByName = new Map(allStreams.map((s) => [s.name.trim().toLowerCase(), s.id]));

  const allProfessionalYears = await db.select().from(professionalYears);
  const professionalYearIdByKey = new Map(
    allProfessionalYears.map((p) => [`${p.streamId}::${p.name.trim().toLowerCase()}`, p.id])
  );

  const institutionBatches = await db.select().from(batches).where(eq(batches.institutionId, auth.user.institutionId!));
  const batchByName = new Map(institutionBatches.map((b) => [b.name.trim().toLowerCase(), b]));

  // Scoped to the caller's institution so an "update" row can never edit a
  // student outside it — registrationNumber is unique DB-wide, but a match in
  // another institution should still error out, not silently update someone
  // else's student.
  const scopedStudentRows = await db
    .select()
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(eq(users.institutionId, auth.user.institutionId!));
  const existingByRegistrationNumber = new Map(
    scopedStudentRows.map((r) => [r.students.registrationNumber.trim().toLowerCase(), r.students])
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: { row: number; sheet: string; message: string }[] = [];
  const credentials: { email: string; password: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const firstName = row.firstName?.trim();
      const lastName = row.lastName?.trim() || "";
      const email = row.email?.trim();
      const rollNumber = row.rollNumber?.trim();
      const registrationNumber = row.registrationNumber?.trim() || rollNumber;
      const streamName = row.stream?.trim();
      const professionalYearName = row.professionalYear?.trim();
      const batchName = row.batch?.trim();

      if (!firstName || !email || !rollNumber || !registrationNumber) {
        throw new Error("Missing name, email, roll number, or registration number");
      }
      if (!streamName || !professionalYearName || !batchName) {
        throw new Error("Missing stream, professional year, or batch");
      }

      const streamId = streamIdByName.get(streamName.toLowerCase());
      if (!streamId) {
        throw new Error(`Unknown stream "${streamName}" — add it under Curriculum → Streams first`);
      }

      const professionalYearId = professionalYearIdByKey.get(`${streamId}::${professionalYearName.toLowerCase()}`);
      if (!professionalYearId) {
        throw new Error(`Unknown professional year "${professionalYearName}" for stream "${streamName}"`);
      }

      const batchRow = batchByName.get(batchName.toLowerCase());
      if (!batchRow) {
        throw new Error(`Unknown batch "${batchName}" — add it under Curriculum → Batches first`);
      }

      const admissionYear = row.admissionYear?.trim() ? Number(row.admissionYear) : batchRow.admissionYear;
      if (!admissionYear || Number.isNaN(admissionYear)) {
        throw new Error("Invalid admission year");
      }

      const existing = existingByRegistrationNumber.get(registrationNumber.toLowerCase());

      if (existing) {
        if (importMode === "insert") {
          skipped++;
          continue;
        }
        const [updatedUser] = await db
          .update(users)
          .set({
            firstName,
            lastName,
            email,
            ...(row.password?.trim() ? { passwordHash: hashPassword(row.password.trim()) } : {}),
          })
          .where(eq(users.id, existing.userId))
          .returning();
        const [updatedStudent] = await db
          .update(students)
          .set({ rollNumber, streamId, professionalYearId, batchId: batchRow.id, admissionYear })
          .where(eq(students.id, existing.id))
          .returning();
        existingByRegistrationNumber.set(registrationNumber.toLowerCase(), updatedStudent);
        updated++;
        if (row.password?.trim()) credentials.push({ email: updatedUser.email, password: row.password.trim() });
      } else {
        if (importMode === "update") {
          skipped++;
          continue;
        }
        const password = row.password?.trim() || generatePassword();
        const [newUser] = await db
          .insert(users)
          .values({
            firstName,
            lastName,
            email,
            passwordHash: hashPassword(password),
            role: "Student",
            status: "ACTIVE",
            institutionId: auth.user.institutionId,
          })
          .returning();
        const [newStudent] = await db
          .insert(students)
          .values({
            userId: newUser.id,
            rollNumber,
            registrationNumber,
            streamId,
            professionalYearId,
            batchId: batchRow.id,
            admissionYear,
          })
          .returning();
        existingByRegistrationNumber.set(registrationNumber.toLowerCase(), newStudent);
        created++;
        credentials.push({ email: newUser.email, password });
      }
    } catch (err) {
      errors.push({
        row: row.rowNumber ?? i + 1,
        sheet: row.sheet ?? "",
        message: isUniqueViolation(err)
          ? "Email or registration number is already in use by a different student"
          : err instanceof Error
            ? err.message
            : "Unknown error",
      });
    }
  }

  return NextResponse.json({ created, updated, skipped, errors, credentials });
}
