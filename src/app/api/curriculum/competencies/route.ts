import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { competencies, subtopics, topics, subjects } from "@/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";
import { requireRole } from "@/lib/api-auth";
import { isDepartmentScoped, departmentSubtopicIds } from "@/lib/curriculum-scope";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["Super Admin", "Dean", "HOD", "Faculty", "Student"]);
  if (!auth.ok) return auth.response;

  const subtopicId = request.nextUrl.searchParams.get("subtopicId");
  const conditions = [];
  if (subtopicId) conditions.push(eq(competencies.subtopicId, subtopicId));

  if (isDepartmentScoped(auth.user)) {
    if (!auth.user.departmentId) return NextResponse.json([]);
    const subtopicIds = await departmentSubtopicIds(auth.user.departmentId);
    if (subtopicIds.length === 0) return NextResponse.json([]);
    conditions.push(inArray(competencies.subtopicId, subtopicIds));
  }

  const rows = conditions.length
    ? await db.select().from(competencies).where(and(...conditions))
    : await db.select().from(competencies);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["Super Admin", "Dean", "HOD"]);
  if (!auth.ok) return auth.response;

  const body = await request.json();

  if (auth.user.role === "HOD") {
    const [row] = await db
      .select()
      .from(subtopics)
      .innerJoin(topics, eq(subtopics.topicId, topics.id))
      .innerJoin(subjects, eq(topics.subjectId, subjects.id))
      .where(eq(subtopics.id, body.subtopicId));
    if (!row || row.subjects.departmentId !== auth.user.departmentId) {
      return NextResponse.json({ message: "Subtopic not found" }, { status: 404 });
    }
  }

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
