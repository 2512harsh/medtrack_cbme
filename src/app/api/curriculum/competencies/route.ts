import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { competencies } from "@/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";

export async function GET(request: NextRequest) {
  const subtopicId = request.nextUrl.searchParams.get("subtopicId");
  const rows = subtopicId
    ? await db.select().from(competencies).where(eq(competencies.subtopicId, subtopicId))
    : await db.select().from(competencies);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    const [row] = await db
      .insert(competencies)
      .values({
        subtopicId: body.subtopicId,
        competencyCode: body.competencyCode,
        competencyTitle: body.competencyTitle,
        competencyDescription: body.competencyDescription || null,
        competencyLevel: body.competencyLevel,
        core: body.core,
        status: body.status ?? "Active",
      })
      .returning();
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { message: `A competency with code "${body.competencyCode}" already exists.` },
        { status: 409 }
      );
    }
    throw err;
  }
}
