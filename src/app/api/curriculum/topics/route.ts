import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { topics } from "@/db/schema";

export async function GET(request: NextRequest) {
  const subjectId = request.nextUrl.searchParams.get("subjectId");
  const rows = subjectId
    ? await db.select().from(topics).where(eq(topics.subjectId, subjectId))
    : await db.select().from(topics);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const [row] = await db
    .insert(topics)
    .values({
      subjectId: body.subjectId,
      title: body.title,
      displayOrder: body.displayOrder,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
