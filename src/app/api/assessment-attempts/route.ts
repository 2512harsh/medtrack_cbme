import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assessmentAttempts, assessments, users, faculty } from "@/db/schema";
import type { AssessmentStatus } from "@/types";

export async function GET(request: NextRequest) {
  const assessmentId = request.nextUrl.searchParams.get("assessmentId");
  const studentId = request.nextUrl.searchParams.get("studentId");

  if (assessmentId) {
    const rows = await db.select().from(assessmentAttempts).where(eq(assessmentAttempts.assessmentId, assessmentId));
    return NextResponse.json(rows);
  }

  if (studentId) {
    const studentAssessments = await db
      .select({ id: assessments.id })
      .from(assessments)
      .where(eq(assessments.studentId, studentId));
    const assessmentIds = new Set(studentAssessments.map((a) => a.id));
    const rows = await db.select().from(assessmentAttempts);
    return NextResponse.json(rows.filter((r) => assessmentIds.has(r.assessmentId)));
  }

  const rows = await db.select().from(assessmentAttempts);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { assessmentId, rating, decision, remarks, facultySignature } = body as {
    assessmentId?: string;
    rating?: string;
    decision?: "Meets Expectations" | "Exceeds Expectations" | "Needs Remediation";
    remarks?: string;
    facultySignature?: string;
  };

  if (!assessmentId || !rating || !decision || !remarks || !facultySignature) {
    return NextResponse.json(
      { message: "assessmentId, rating, decision, remarks, and facultySignature are required" },
      { status: 400 }
    );
  }

  const [assessment] = await db.select().from(assessments).where(eq(assessments.id, assessmentId));
  if (!assessment) {
    return NextResponse.json({ message: "Assessment not found" }, { status: 404 });
  }

  const [facultyUser] = await db
    .select({ id: faculty.id })
    .from(faculty)
    .innerJoin(users, eq(faculty.userId, users.id))
    .limit(1);
  if (!facultyUser) {
    return NextResponse.json(
      { message: "No Faculty account exists to attribute this review to. Create one under Dean → Faculty Management first." },
      { status: 500 }
    );
  }

  const priorAttempts = await db
    .select()
    .from(assessmentAttempts)
    .where(eq(assessmentAttempts.assessmentId, assessmentId));
  const attemptNumber = priorAttempts.length + 1;

  const [attempt] = await db
    .insert(assessmentAttempts)
    .values({
      assessmentId,
      attemptNumber,
      facultyId: facultyUser.id,
      rating,
      decision,
      remarks,
      facultySignature,
      facultySignedAt: new Date(),
      studentAcknowledged: false,
      status: "Submitted",
    })
    .returning();

  const nextStatus: AssessmentStatus =
    decision === "Needs Remediation" ? "Reattempt Scheduled" : "Waiting for Student Acknowledgement";
  await db
    .update(assessments)
    .set({ currentAttempt: attemptNumber, currentStatus: nextStatus })
    .where(eq(assessments.id, assessmentId));

  return NextResponse.json(attempt, { status: 201 });
}
