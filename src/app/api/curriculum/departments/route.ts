import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { departments } from "@/db/schema";
import { requireRole } from "@/lib/api-auth";

export async function GET() {
  const rows = await db.select().from(departments);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["Super Admin"]);
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const [row] = await db
    .insert(departments)
    .values({
      name: body.name,
      description: body.description,
      status: body.status ?? "ACTIVE",
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
