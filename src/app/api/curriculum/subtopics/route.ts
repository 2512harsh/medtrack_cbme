import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subtopics } from "@/db/schema";

export async function GET(request: NextRequest) {
  const topicId = request.nextUrl.searchParams.get("topicId");
  const rows = topicId
    ? await db.select().from(subtopics).where(eq(subtopics.topicId, topicId))
    : await db.select().from(subtopics);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const [row] = await db
    .insert(subtopics)
    .values({
      topicId: body.topicId,
      title: body.title,
      displayOrder: body.displayOrder,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
