import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { requireRole } from "@/lib/api-auth";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/curriculum/subjects/[id]">) {
  const auth = await requireRole(request, ["Super Admin", "Dean", "HOD"]);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const body = await request.json();

  if (auth.user.role === "HOD") {
    const [existing] = await db.select().from(subjects).where(eq(subjects.id, id));
    if (!existing || existing.departmentId !== auth.user.departmentId) {
      return NextResponse.json({ message: "Subject not found" }, { status: 404 });
    }
    // HOD cannot move a subject to another department.
    delete body.departmentId;
  }

  const [row] = await db
    .update(subjects)
    .set(body)
    .where(eq(subjects.id, id))
    .returning();
  if (!row) {
    return NextResponse.json({ message: "Subject not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}
