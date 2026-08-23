import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { institutions } from "@/db/schema";

export async function GET() {
  const rows = await db.select().from(institutions);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const [row] = await db
    .insert(institutions)
    .values({
      name: body.name,
      code: body.code,
      address: body.address,
      city: body.city,
      state: body.state,
      country: body.country,
      email: body.email,
      phone: body.phone,
      status: body.status ?? "ACTIVE",
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
