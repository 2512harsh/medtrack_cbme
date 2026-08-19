import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { topics } from "@/db/schema";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/curriculum/topics/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json();
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
