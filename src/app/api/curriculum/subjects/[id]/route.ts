import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subjects } from "@/db/schema";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/curriculum/subjects/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json();
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
