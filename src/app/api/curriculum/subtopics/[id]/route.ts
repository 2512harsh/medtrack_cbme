import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subtopics } from "@/db/schema";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/curriculum/subtopics/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json();
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
