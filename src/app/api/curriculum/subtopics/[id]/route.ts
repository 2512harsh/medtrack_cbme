import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subtopics, topics, subjects } from "@/db/schema";
import { requireRole } from "@/lib/api-auth";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/curriculum/subtopics/[id]">) {
  const auth = await requireRole(request, ["Super Admin", "Dean", "HOD"]);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const body = await request.json();

  if (auth.user.role === "HOD") {
    const [existing] = await db
      .select()
      .from(subtopics)
      .innerJoin(topics, eq(subtopics.topicId, topics.id))
      .innerJoin(subjects, eq(topics.subjectId, subjects.id))
      .where(eq(subtopics.id, id));
    if (!existing || existing.subjects.departmentId !== auth.user.departmentId) {
      return NextResponse.json({ message: "Subtopic not found" }, { status: 404 });
    }
    // HOD cannot move a subtopic to a topic outside their own department.
    delete body.topicId;
  }

  const [row] = await db
    .update(subtopics)
    .set(body)
    .where(eq(subtopics.id, id))
    .returning();
  if (!row) {
    return NextResponse.json({ message: "Subtopic not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}
