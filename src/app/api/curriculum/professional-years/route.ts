import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { professionalYears } from "@/db/schema";

export async function GET(request: NextRequest) {
  const streamId = request.nextUrl.searchParams.get("streamId");
  const rows = streamId
    ? await db.select().from(professionalYears).where(eq(professionalYears.streamId, streamId))
    : await db.select().from(professionalYears);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { streamId, name } = body as { streamId?: string; name?: string };

  if (!streamId || !name) {
    return NextResponse.json({ message: "streamId and name are required" }, { status: 400 });
  }

  const existing = await db.select().from(professionalYears).where(eq(professionalYears.streamId, streamId));
  const sequence = existing.reduce((max, y) => Math.max(max, y.sequence), 0) + 1;

  const [row] = await db.insert(professionalYears).values({ streamId, name, sequence }).returning();
  return NextResponse.json(row, { status: 201 });
}
