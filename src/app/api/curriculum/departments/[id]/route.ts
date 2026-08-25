import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { departments } from "@/db/schema";
import { requireRole } from "@/lib/api-auth";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/curriculum/departments/[id]">) {
  const { id } = await ctx.params;
  const [row] = await db.select().from(departments).where(eq(departments.id, id));
  if (!row) {
    return NextResponse.json({ message: "Department not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/curriculum/departments/[id]">) {
  const auth = await requireRole(request, ["Super Admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const body = await request.json();
  const updates: Partial<typeof departments.$inferInsert> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.status !== undefined) updates.status = body.status;

  const [row] = await db
    .update(departments)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(departments.id, id))
    .returning();
  if (!row) {
    return NextResponse.json({ message: "Department not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}
