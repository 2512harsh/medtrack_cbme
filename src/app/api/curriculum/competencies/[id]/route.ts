import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { competencies, subtopics, topics, subjects } from "@/db/schema";
import { requireRole } from "@/lib/api-auth";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/curriculum/competencies/[id]">) {
  const auth = await requireRole(request, ["Super Admin", "Dean", "HOD"]);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const body = await request.json();

  if (auth.user.role === "HOD") {
    const [existing] = await db
      .select()
      .from(competencies)
      .innerJoin(subtopics, eq(competencies.subtopicId, subtopics.id))
      .innerJoin(topics, eq(subtopics.topicId, topics.id))
      .innerJoin(subjects, eq(topics.subjectId, subjects.id))
      .where(eq(competencies.id, id));
    if (!existing || existing.subjects.departmentId !== auth.user.departmentId) {
      return NextResponse.json({ message: "Competency not found" }, { status: 404 });
    }
    // HOD cannot move a competency to a subtopic outside their own department.
    delete body.subtopicId;
  }

  const [row] = await db
    .update(competencies)
    .set(body)
    .where(eq(competencies.id, id))
    .returning();
  if (!row) {
    return NextResponse.json({ message: "Competency not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}
