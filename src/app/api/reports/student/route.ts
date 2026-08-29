import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { students, users, batches, assessments, faculty, competencyAssignments } from "@/db/schema";
import { requireRole, requireInstitution } from "@/lib/api-auth";
import { departmentAssignmentIds } from "@/lib/curriculum-scope";

type StudentRow = { id: string; rollNumber: string; firstName: string; lastName: string; batchName: string; batchId: string };
type AssignmentRow = { id: string; batchId: string };
type AssessmentRow = { studentId: string; currentStatus: string; competencyAssignmentId: string };

function buildReport(studentRows: StudentRow[], relevantAssignments: AssignmentRow[], assessmentRows: AssessmentRow[]) {
  const assignmentIdsByBatch = new Map<string, string[]>();
  for (const a of relevantAssignments) {
    const list = assignmentIdsByBatch.get(a.batchId) ?? [];
    list.push(a.id);
    assignmentIdsByBatch.set(a.batchId, list);
  }

  const statusByKey = new Map<string, string>();
  for (const a of assessmentRows) {
    statusByKey.set(`${a.studentId}:${a.competencyAssignmentId}`, a.currentStatus);
  }

  const studentReport = studentRows.map((s) => {
    const assignmentIds = assignmentIdsByBatch.get(s.batchId) ?? [];
    let completed = 0;
    let pending = 0;
    let remediation = 0;
    for (const assignmentId of assignmentIds) {
      const status = statusByKey.get(`${s.id}:${assignmentId}`);
      if (status === "Completed") completed += 1;
      else if (status === "Reattempt Scheduled") remediation += 1;
      else pending += 1;
    }
    const total = assignmentIds.length;
    return {
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      rollNumber: s.rollNumber,
      batch: s.batchName,
      completed,
      pending,
      remediation,
      overallProgress: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  const summary = {
    totalStudents: studentReport.length,
    completedAssessments: studentReport.reduce((sum, s) => sum + s.completed, 0),
    pendingAssessments: studentReport.reduce((sum, s) => sum + s.pending, 0),
    remediationCases: studentReport.reduce((sum, s) => sum + s.remediation, 0),
  };

  return { summary, students: studentReport };
}

const EMPTY_REPORT = { summary: { totalStudents: 0, completedAssessments: 0, pendingAssessments: 0, remediationCases: 0 }, students: [] };

async function assessmentsFor(studentIds: string[]) {
  return db
    .select({ studentId: assessments.studentId, currentStatus: assessments.currentStatus, competencyAssignmentId: assessments.competencyAssignmentId })
    .from(assessments)
    .where(inArray(assessments.studentId, studentIds));
}

export async function GET(request: NextRequest) {
  // Super Admin can see across institutions; Dean sees their whole
  // institution; HOD is limited to assignments under their own department's
  // curriculum; Faculty sees only students under their own competency
  // assignments; Student sees only their own row.
  const auth = await requireRole(request, ["Dean", "HOD", "Super Admin", "Faculty", "Student"]);
  if (!auth.ok) return auth.response;

  if (auth.user.role === "Student") {
    const [own] = await db
      .select({ id: students.id, rollNumber: students.rollNumber, firstName: users.firstName, lastName: users.lastName, batchName: batches.name, batchId: students.batchId })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .innerJoin(batches, eq(students.batchId, batches.id))
      .where(eq(students.userId, auth.user.id));
    if (!own) return NextResponse.json(EMPTY_REPORT);

    const relevantAssignments = await db
      .select({ id: competencyAssignments.id, batchId: competencyAssignments.batchId })
      .from(competencyAssignments)
      .where(eq(competencyAssignments.batchId, own.batchId));
    const assessmentRows = await assessmentsFor([own.id]);

    return NextResponse.json(buildReport([own], relevantAssignments, assessmentRows));
  }

  if (auth.user.role === "Faculty") {
    const [ownFaculty] = await db.select({ id: faculty.id }).from(faculty).where(eq(faculty.userId, auth.user.id));
    if (!ownFaculty) return NextResponse.json(EMPTY_REPORT);

    const relevantAssignments = await db
      .select({ id: competencyAssignments.id, batchId: competencyAssignments.batchId })
      .from(competencyAssignments)
      .where(eq(competencyAssignments.facultyId, ownFaculty.id));
    if (relevantAssignments.length === 0) return NextResponse.json(EMPTY_REPORT);

    const batchIds = [...new Set(relevantAssignments.map((a) => a.batchId))];
    const studentRows = await db
      .select({ id: students.id, rollNumber: students.rollNumber, firstName: users.firstName, lastName: users.lastName, batchName: batches.name, batchId: students.batchId })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .innerJoin(batches, eq(students.batchId, batches.id))
      .where(inArray(students.batchId, batchIds));
    if (studentRows.length === 0) return NextResponse.json(EMPTY_REPORT);

    const assessmentRows = await assessmentsFor(studentRows.map((s) => s.id));
    return NextResponse.json(buildReport(studentRows, relevantAssignments, assessmentRows));
  }

  let institutionId: string | null = null;
  if (auth.user.role === "Super Admin") {
    institutionId = request.nextUrl.searchParams.get("institutionId");
  } else {
    const institutionError = requireInstitution(auth.user);
    if (institutionError) return institutionError;
    institutionId = auth.user.institutionId;
  }

  const studentConditions = [];
  if (institutionId) studentConditions.push(eq(batches.institutionId, institutionId));

  const studentRows = await db
    .select({ id: students.id, rollNumber: students.rollNumber, firstName: users.firstName, lastName: users.lastName, batchName: batches.name, batchId: students.batchId })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .innerJoin(batches, eq(students.batchId, batches.id))
    .where(studentConditions.length ? and(...studentConditions) : undefined);

  if (studentRows.length === 0) return NextResponse.json(EMPTY_REPORT);

  const batchIds = [...new Set(studentRows.map((s) => s.batchId))];
  let relevantAssignments = await db
    .select({ id: competencyAssignments.id, batchId: competencyAssignments.batchId })
    .from(competencyAssignments)
    .where(inArray(competencyAssignments.batchId, batchIds));

  if (auth.user.role === "HOD") {
    if (!auth.user.departmentId) {
      return NextResponse.json({ message: "Your account has no department assigned." }, { status: 403 });
    }
    const allowed = new Set(await departmentAssignmentIds(auth.user.departmentId));
    relevantAssignments = relevantAssignments.filter((a) => allowed.has(a.id));
  }

  const assessmentRows = await assessmentsFor(studentRows.map((s) => s.id));
  return NextResponse.json(buildReport(studentRows, relevantAssignments, assessmentRows));
}
