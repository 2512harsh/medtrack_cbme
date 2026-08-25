import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { topics, subjects } from "@/db/schema";
import { requireRole } from "@/lib/api-auth";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/curriculum/topics/[id]">) {
  const auth = await requireRole(request, ["Super Admin", "Dean", "HOD"]);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const body = await request.json();

  if (auth.user.role === "HOD") {
    const [existing] = await db
      .select()
      .from(topics)
      .innerJoin(subjects, eq(topics.subjectId, subjects.id))
      .where(eq(topics.id, id));
    if (!existing || existing.subjects.departmentId !== auth.user.departmentId) {
      return NextResponse.json({ message: "Topic not found" }, { status: 404 });
    }
    // HOD cannot move a topic to a subject outside their own department.
    delete body.subjectId;
  }

  const [row] = await db
    .update(topics)
    .set(body)
    .where(eq(topics.id, id))
    .returning();
  if (!row) {
    return NextResponse.json({ message: "Topic not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}
