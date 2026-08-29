import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  assessments,
  assessmentAttempts,
  competencyAssignments,
  competencies,
  students,
  users,
  faculty,
} from "@/db/schema";
import { requireRole } from "@/lib/api-auth";
import { departmentAssignmentIds } from "@/lib/curriculum-scope";

type WorkflowStatus = "Scheduled" | "In Progress" | "Pending" | "Completed";

export async function GET(request: NextRequest) {
  // Faculty see only remediation cases from competency assignments they
  // created; HOD sees every case under their own department's curriculum
  // (matches the Sidebar entry, which limits this page to Faculty/HOD).
  const auth = await requireRole(request, ["Faculty", "HOD"]);
  if (!auth.ok) return auth.response;

  let assignmentIds: string[];
  if (auth.user.role === "Faculty") {
    const [facultyRow] = await db.select({ id: faculty.id }).from(faculty).where(eq(faculty.userId, auth.user.id));
    if (!facultyRow) {
      return NextResponse.json({ message: "No faculty profile found for your account." }, { status: 403 });
    }
    const rows = await db
      .select({ id: competencyAssignments.id })
      .from(competencyAssignments)
      .where(eq(competencyAssignments.facultyId, facultyRow.id));
    assignmentIds = rows.map((r) => r.id);
  } else {
    if (!auth.user.departmentId) {
      return NextResponse.json({ message: "Your account has no department assigned." }, { status: 403 });
    }
    assignmentIds = await departmentAssignmentIds(auth.user.departmentId);
  }

  if (assignmentIds.length === 0) {
    return NextResponse.json([]);
  }

  const assessmentRows = await db
    .select({
      id: assessments.id,
      studentId: assessments.studentId,
      currentStatus: assessments.currentStatus,
      competencyAssignmentId: assessments.competencyAssignmentId,
    })
    .from(assessments)
    .where(inArray(assessments.competencyAssignmentId, assignmentIds));

  if (assessmentRows.length === 0) {
    return NextResponse.json([]);
  }

  const assessmentIds = assessmentRows.map((a) => a.id);
  const attemptRows = await db
    .select()
    .from(assessmentAttempts)
    .where(inArray(assessmentAttempts.assessmentId, assessmentIds));

  const attemptsByAssessment = new Map<string, typeof attemptRows>();
  for (const attempt of attemptRows) {
    const list = attemptsByAssessment.get(attempt.assessmentId) ?? [];
    list.push(attempt);
    attemptsByAssessment.set(attempt.assessmentId, list);
  }

  const remediationAssessments = assessmentRows.filter((a) =>
    (attemptsByAssessment.get(a.id) ?? []).some((attempt) => attempt.decision === "Needs Remediation")
  );
  if (remediationAssessments.length === 0) {
    return NextResponse.json([]);
  }

  const studentIds = [...new Set(remediationAssessments.map((a) => a.studentId))];
  const studentRows = await db
    .select({ id: students.id, firstName: users.firstName, lastName: users.lastName })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(inArray(students.id, studentIds));
  const studentById = new Map(studentRows.map((s) => [s.id, `${s.firstName} ${s.lastName}`]));

  const relevantAssignmentIds = [...new Set(remediationAssessments.map((a) => a.competencyAssignmentId))];
  const assignmentRows = await db
    .select({ id: competencyAssignments.id, competencyId: competencyAssignments.competencyId })
    .from(competencyAssignments)
    .where(inArray(competencyAssignments.id, relevantAssignmentIds));
  const competencyIdByAssignment = new Map(assignmentRows.map((a) => [a.id, a.competencyId]));

  const competencyIds = [...new Set(assignmentRows.map((a) => a.competencyId))];
  const competencyRows = await db
    .select({ id: competencies.id, code: competencies.competencyCode, title: competencies.competencyTitle })
    .from(competencies)
    .where(inArray(competencies.id, competencyIds));
  const competencyById = new Map(competencyRows.map((c) => [c.id, c]));

  const facultyIds = [...new Set(attemptRows.map((a) => a.facultyId))];
  const facultyRows = facultyIds.length
    ? await db
        .select({ id: faculty.id, firstName: users.firstName, lastName: users.lastName })
        .from(faculty)
        .innerJoin(users, eq(faculty.userId, users.id))
        .where(inArray(faculty.id, facultyIds))
    : [];
  const facultyById = new Map(facultyRows.map((f) => [f.id, `${f.firstName} ${f.lastName}`]));

  const result = remediationAssessments.map((a) => {
    const attempts = (attemptsByAssessment.get(a.id) ?? []).slice().sort((x, y) => x.attemptNumber - y.attemptNumber);
    const remediationAttempt = [...attempts].reverse().find((attempt) => attempt.decision === "Needs Remediation")!;
    const latestAttempt = attempts[attempts.length - 1];

    let status: WorkflowStatus;
    if (a.currentStatus === "Reattempt Scheduled") {
      status = "Scheduled";
    } else if (latestAttempt.id === remediationAttempt.id) {
      status = "In Progress";
    } else if (latestAttempt.status === "Completed" || latestAttempt.studentAcknowledged) {
      status = "Completed";
    } else {
      status = "Pending";
    }

    const competencyId = competencyIdByAssignment.get(a.competencyAssignmentId);
    const competency = competencyId ? competencyById.get(competencyId) : undefined;

    return {
      id: a.id,
      studentName: studentById.get(a.studentId) ?? "Unknown Student",
      competencyCode: competency?.code ?? "",
      competencyTitle: competency?.title ?? "Unknown Competency",
      facultyName: facultyById.get(remediationAttempt.facultyId) ?? "Unknown Faculty",
      originalDecision: remediationAttempt.decision,
      originalAttempt: remediationAttempt.attemptNumber,
      remediationDate: remediationAttempt.facultySignedAt,
      status,
    };
  });

  return NextResponse.json(result);
}
