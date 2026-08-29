import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { students, users, batches, assessments, faculty, competencyAssignments } from "@/db/schema";
import { requireRole, requireInstitution } from "@/lib/api-auth";
import { departmentAssignmentIds } from "@/lib/curriculum-scope";

type StudentRow = { id: string; rollNumber: string; firstName: string; lastName: string; batchName: string };
type AssessmentRow = { studentId: string; currentStatus: string; competencyAssignmentId: string };

function buildReport(studentRows: StudentRow[], assessmentRows: AssessmentRow[]) {
  const statsByStudent = new Map<string, { completed: number; pending: number; remediation: number; total: number }>();
  for (const a of assessmentRows) {
    const entry = statsByStudent.get(a.studentId) ?? { completed: 0, pending: 0, remediation: 0, total: 0 };
    entry.total += 1;
    if (a.currentStatus === "Completed") entry.completed += 1;
    else if (a.currentStatus === "Reattempt Scheduled") entry.remediation += 1;
    else entry.pending += 1;
    statsByStudent.set(a.studentId, entry);
  }

  const studentReport = studentRows.map((s) => {
    const stats = statsByStudent.get(s.id) ?? { completed: 0, pending: 0, remediation: 0, total: 0 };
    return {
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      rollNumber: s.rollNumber,
      batch: s.batchName,
      completed: stats.completed,
      pending: stats.pending,
      remediation: stats.remediation,
      overallProgress: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
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

export async function GET(request: NextRequest) {
  // Super Admin can see across institutions; Dean sees their whole
  // institution; HOD is limited to students with assessments under their own
  // department's curriculum; Faculty sees only students under their own
  // competency assignments; Student sees only their own row.
  const auth = await requireRole(request, ["Dean", "HOD", "Super Admin", "Faculty", "Student"]);
  if (!auth.ok) return auth.response;

  if (auth.user.role === "Student") {
    const [own] = await db
      .select({ id: students.id, rollNumber: students.rollNumber, firstName: users.firstName, lastName: users.lastName, batchName: batches.name })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .innerJoin(batches, eq(students.batchId, batches.id))
      .where(eq(students.userId, auth.user.id));
    if (!own) return NextResponse.json(EMPTY_REPORT);

    const assessmentRows = await db
      .select({ studentId: assessments.studentId, currentStatus: assessments.currentStatus, competencyAssignmentId: assessments.competencyAssignmentId })
      .from(assessments)
      .where(eq(assessments.studentId, own.id));

    return NextResponse.json(buildReport([own], assessmentRows));
  }

  if (auth.user.role === "Faculty") {
    const [ownFaculty] = await db.select({ id: faculty.id }).from(faculty).where(eq(faculty.userId, auth.user.id));
    if (!ownFaculty) return NextResponse.json(EMPTY_REPORT);

    const assignmentRows = await db
      .select({ id: competencyAssignments.id })
      .from(competencyAssignments)
      .where(eq(competencyAssignments.facultyId, ownFaculty.id));
    const assignmentIds = assignmentRows.map((r) => r.id);
    if (assignmentIds.length === 0) return NextResponse.json(EMPTY_REPORT);

    const assessmentRows = await db
      .select({ studentId: assessments.studentId, currentStatus: assessments.currentStatus, competencyAssignmentId: assessments.competencyAssignmentId })
      .from(assessments)
      .where(inArray(assessments.competencyAssignmentId, assignmentIds));
    if (assessmentRows.length === 0) return NextResponse.json(EMPTY_REPORT);

    const studentIds = [...new Set(assessmentRows.map((a) => a.studentId))];
    const studentRows = await db
      .select({ id: students.id, rollNumber: students.rollNumber, firstName: users.firstName, lastName: users.lastName, batchName: batches.name })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .innerJoin(batches, eq(students.batchId, batches.id))
      .where(inArray(students.id, studentIds));

    return NextResponse.json(buildReport(studentRows, assessmentRows));
  }

  let institutionId: string | null = null;
  if (auth.user.role === "Super Admin") {
    institutionId = request.nextUrl.searchParams.get("institutionId");
  } else {
    const institutionError = requireInstitution(auth.user);
    if (institutionError) return institutionError;
    institutionId = auth.user.institutionId;
  }

  let scopedAssignmentIds: string[] | null = null;
  if (auth.user.role === "HOD") {
    if (!auth.user.departmentId) {
      return NextResponse.json({ message: "Your account has no department assigned." }, { status: 403 });
    }
    scopedAssignmentIds = await departmentAssignmentIds(auth.user.departmentId);
  }

  const studentConditions = [];
  if (institutionId) studentConditions.push(eq(batches.institutionId, institutionId));

  const studentRows = await db
    .select({ id: students.id, rollNumber: students.rollNumber, firstName: users.firstName, lastName: users.lastName, batchName: batches.name })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .innerJoin(batches, eq(students.batchId, batches.id))
    .where(studentConditions.length ? and(...studentConditions) : undefined);

  if (studentRows.length === 0) return NextResponse.json(EMPTY_REPORT);

  const studentIds = studentRows.map((s) => s.id);
  let assessmentRows = await db
    .select({ studentId: assessments.studentId, currentStatus: assessments.currentStatus, competencyAssignmentId: assessments.competencyAssignmentId })
    .from(assessments)
    .where(inArray(assessments.studentId, studentIds));

  if (scopedAssignmentIds !== null) {
    const allowed = new Set(scopedAssignmentIds);
    assessmentRows = assessmentRows.filter((a) => allowed.has(a.competencyAssignmentId));
  }

  return NextResponse.json(buildReport(studentRows, assessmentRows));
}
