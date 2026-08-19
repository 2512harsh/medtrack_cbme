import { NextResponse } from "next/server";
import { db } from "@/db";
import { departments } from "@/db/schema";

export async function GET() {
  const rows = await db.select().from(departments);
  return NextResponse.json(rows);
}
