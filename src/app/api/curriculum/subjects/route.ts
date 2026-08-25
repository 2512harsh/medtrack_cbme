import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { requireRole } from "@/lib/api-auth";
import { isDepartmentScoped } from "@/lib/curriculum-scope";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["Super Admin", "Dean", "HOD", "Faculty", "Student"]);
  if (!auth.ok) return auth.response;

  const professionalYearId = request.nextUrl.searchParams.get("professionalYearId");
  const conditions = [];
  if (professionalYearId) conditions.push(eq(subjects.professionalYearId, professionalYearId));

  if (isDepartmentScoped(auth.user)) {
    if (!auth.user.departmentId) return NextResponse.json([]);
    conditions.push(eq(subjects.departmentId, auth.user.departmentId));
  }

  const rows = conditions.length
    ? await db.select().from(subjects).where(and(...conditions))
    : await db.select().from(subjects);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["Super Admin", "Dean", "HOD"]);
  if (!auth.ok) return auth.response;

  const body = await request.json();
  // HOD can only add subjects to their own department.
  const departmentId = auth.user.role === "HOD" ? auth.user.departmentId : body.departmentId;
  if (!departmentId) {
    return NextResponse.json({ message: "departmentId is required" }, { status: 400 });
  }

  const [row] = await db
    .insert(subjects)
    .values({
      professionalYearId: body.professionalYearId,
      departmentId,
      name: body.name,
      code: body.code,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
