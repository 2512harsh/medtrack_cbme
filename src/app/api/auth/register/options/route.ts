import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { institutions, batches, professionalYears } from "@/db/schema";

export async function GET() {
  const [institutionRows, batchRows, yearRows] = await Promise.all([
    db
      .select({ id: institutions.id, name: institutions.name })
      .from(institutions)
      .where(eq(institutions.status, "ACTIVE")),
    db
      .select({
        id: batches.id,
        name: batches.name,
        institutionId: batches.institutionId,
        streamId: batches.streamId,
      })
      .from(batches)
      .where(eq(batches.status, "ACTIVE")),
    db
      .select({
        id: professionalYears.id,
        name: professionalYears.name,
        streamId: professionalYears.streamId,
        sequence: professionalYears.sequence,
      })
      .from(professionalYears),
  ]);

  return NextResponse.json({
    institutions: institutionRows,
    batches: batchRows,
    professionalYears: yearRows.sort((a, b) => a.sequence - b.sequence),
  });
}
