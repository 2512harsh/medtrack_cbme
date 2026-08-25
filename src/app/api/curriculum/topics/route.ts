import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { topics, subjects } from "@/db/schema";
import { requireRole } from "@/lib/api-auth";
import { isDepartmentScoped, departmentSubjectIds } from "@/lib/curriculum-scope";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["Super Admin", "Dean", "HOD", "Faculty", "Student"]);
  if (!auth.ok) return auth.response;

  const subjectId = request.nextUrl.searchParams.get("subjectId");
  const conditions = [];
  if (subjectId) conditions.push(eq(topics.subjectId, subjectId));

  if (isDepartmentScoped(auth.user)) {
    if (!auth.user.departmentId) return NextResponse.json([]);
    const subjectIds = await departmentSubjectIds(auth.user.departmentId);
    if (subjectIds.length === 0) return NextResponse.json([]);
    conditions.push(inArray(topics.subjectId, subjectIds));
  }

  const rows = conditions.length
    ? await db.select().from(topics).where(and(...conditions))
    : await db.select().from(topics);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["Super Admin", "Dean", "HOD"]);
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { subjectId, title, displayOrder } = body as { subjectId?: string; title?: string; displayOrder?: number };
  if (!subjectId || !title) {
    return NextResponse.json({ message: "subjectId and title are required" }, { status: 400 });
  }

  if (auth.user.role === "HOD") {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, subjectId));
    if (!subject || subject.departmentId !== auth.user.departmentId) {
      return NextResponse.json({ message: "Subject not found" }, { status: 404 });
    }
  }

  const [row] = await db.insert(topics).values({ subjectId, title, displayOrder }).returning();
  return NextResponse.json(row, { status: 201 });
}
