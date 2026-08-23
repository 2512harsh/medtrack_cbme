import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { assessmentAttempts } from "@/db/schema";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/assessments/[id]/acknowledge">) {
  const { id } = await ctx.params;
  const body = await request.json();
  const { signature } = body as { signature?: string };

  if (!signature) {
    return NextResponse.json({ message: "signature is required" }, { status: 400 });
  }

  const [latestAttempt] = await db
    .select()
    .from(assessmentAttempts)
    .where(eq(assessmentAttempts.assessmentId, id))
    .orderBy(desc(assessmentAttempts.attemptNumber))
    .limit(1);

  if (!latestAttempt) {
    return NextResponse.json({ message: "No assessment attempt found to acknowledge" }, { status: 404 });
  }

  const [updated] = await db
    .update(assessmentAttempts)
    .set({
      studentAcknowledged: true,
      studentSignature: signature,
      studentSignedAt: new Date(),
      status: "Completed",
    })
    .where(eq(assessmentAttempts.id, latestAttempt.id))
    .returning();

  return NextResponse.json(updated);
}
