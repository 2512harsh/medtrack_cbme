import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subjects } from "@/db/schema";

export async function GET(request: NextRequest) {
  const professionalYearId = request.nextUrl.searchParams.get("professionalYearId");
  const rows = professionalYearId
    ? await db.select().from(subjects).where(eq(subjects.professionalYearId, professionalYearId))
    : await db.select().from(subjects);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const [row] = await db
    .insert(subjects)
    .values({
      professionalYearId: body.professionalYearId,
      departmentId: body.departmentId,
      name: body.name,
      code: body.code,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
