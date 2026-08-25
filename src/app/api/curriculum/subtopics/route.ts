import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { subtopics, topics, subjects } from "@/db/schema";
import { requireRole } from "@/lib/api-auth";
import { isDepartmentScoped, departmentTopicIds } from "@/lib/curriculum-scope";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["Super Admin", "Dean", "HOD", "Faculty", "Student"]);
  if (!auth.ok) return auth.response;

  const topicId = request.nextUrl.searchParams.get("topicId");
  const conditions = [];
  if (topicId) conditions.push(eq(subtopics.topicId, topicId));

  if (isDepartmentScoped(auth.user)) {
    if (!auth.user.departmentId) return NextResponse.json([]);
    const topicIds = await departmentTopicIds(auth.user.departmentId);
    if (topicIds.length === 0) return NextResponse.json([]);
    conditions.push(inArray(subtopics.topicId, topicIds));
  }

  const rows = conditions.length
    ? await db.select().from(subtopics).where(and(...conditions))
    : await db.select().from(subtopics);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["Super Admin", "Dean", "HOD"]);
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { topicId, title, displayOrder } = body as { topicId?: string; title?: string; displayOrder?: number };
  if (!topicId || !title) {
    return NextResponse.json({ message: "topicId and title are required" }, { status: 400 });
  }

  if (auth.user.role === "HOD") {
    const [row] = await db
      .select()
      .from(topics)
      .innerJoin(subjects, eq(topics.subjectId, subjects.id))
      .where(eq(topics.id, topicId));
    if (!row || row.subjects.departmentId !== auth.user.departmentId) {
      return NextResponse.json({ message: "Topic not found" }, { status: 404 });
    }
  }

  const [row] = await db.insert(subtopics).values({ topicId, title, displayOrder }).returning();
  return NextResponse.json(row, { status: 201 });
}
