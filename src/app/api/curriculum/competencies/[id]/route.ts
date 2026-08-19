import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { competencies } from "@/db/schema";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/curriculum/competencies/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json();
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
