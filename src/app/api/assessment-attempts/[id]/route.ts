import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assessmentAttempts } from "@/db/schema";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/assessment-attempts/[id]">) {
  const { id } = await ctx.params;
  const [row] = await db.select().from(assessmentAttempts).where(eq(assessmentAttempts.id, id));
  if (!row) {
    return NextResponse.json({ message: "Assessment attempt not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}
