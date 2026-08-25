import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { professionalYears } from "@/db/schema";
import { requireRole } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  // Read stays open to every authenticated role — it backs reference
  // dropdowns elsewhere (e.g. the student form's professional year picker),
  // not just the Professional Years management page.
  const streamId = request.nextUrl.searchParams.get("streamId");
  const rows = streamId
    ? await db.select().from(professionalYears).where(eq(professionalYears.streamId, streamId))
    : await db.select().from(professionalYears);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["Super Admin", "Dean"]);
  if (!auth.ok) return auth.response;

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
