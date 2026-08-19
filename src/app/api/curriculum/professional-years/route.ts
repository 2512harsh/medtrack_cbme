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
