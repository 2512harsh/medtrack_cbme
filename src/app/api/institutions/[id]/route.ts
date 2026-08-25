import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { institutions } from "@/db/schema";
import { requireRole } from "@/lib/api-auth";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/institutions/[id]">) {
  const auth = await requireRole(request, ["Super Admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const body = await request.json();
  const [row] = await db
    .update(institutions)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(institutions.id, id))
    .returning();
  if (!row) {
    return NextResponse.json({ message: "Institution not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}
