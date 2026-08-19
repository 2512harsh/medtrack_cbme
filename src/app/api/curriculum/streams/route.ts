import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { streams } from "@/db/schema";

export async function GET() {
  const rows = await db.select().from(streams);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const [row] = await db.insert(streams).values({ name: body.name }).returning();
  return NextResponse.json(row, { status: 201 });
}
