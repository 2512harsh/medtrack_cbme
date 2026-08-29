import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { faculty, users, departments, assessments, assessmentAttempts, competencyAssignments } from "@/db/schema";
import { requireRole, requireInstitution } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  // Super Admin sees faculty across every institution; Dean sees their whole
  // institution; HOD is pinned to their own department, matching the scoping
  // in src/app/api/dean/faculty/route.ts. Faculty sees only their own row.
  const auth = await requireRole(request, ["Dean", "HOD", "Super Admin", "Faculty"]);
  if (!auth.ok) return auth.response;

  const conditions = [];
  let departmentId: string | null = null;

  if (auth.user.role === "Faculty") {
    conditions.push(eq(faculty.userId, auth.user.id));
  } else if (auth.user.role === "Super Admin") {
    const institutionId = request.nextUrl.searchParams.get("institutionId");
    if (institutionId) conditions.push(eq(users.institutionId, institutionId));
    departmentId = request.nextUrl.searchParams.get("departmentId");
    if (departmentId) conditions.push(eq(faculty.departmentId, departmentId));
  } else {
    const institutionError = requireInstitution(auth.user);
    if (institutionError) return institutionError;

    departmentId = auth.user.role === "HOD" ? auth.user.departmentId : request.nextUrl.searchParams.get("departmentId");
    if (auth.user.role === "HOD" && !departmentId) {
      return NextResponse.json({ message: "Your account has no department assigned." }, { status: 403 });
    }

    conditions.push(eq(users.institutionId, auth.user.institutionId!));
    if (departmentId) conditions.push(eq(faculty.departmentId, departmentId));
  }

  const facultyRows = await db
    .select({
      id: faculty.id,
      departmentName: departments.name,
      designation: faculty.designation,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(faculty)
    .innerJoin(users, eq(faculty.userId, users.id))
    .innerJoin(departments, eq(faculty.departmentId, departments.id))
    .where(and(...conditions));

  if (facultyRows.length === 0) {
    return NextResponse.json({
      summary: { totalFaculty: 0, completedReviews: 0, pendingReviews: 0 },
      faculty: [],
    });
  }

  // Assessments are attributed to faculty via the competency assignment that
  // created them, not the assessment row itself.
  const facultyIds = facultyRows.map((f) => f.id);
  const assignmentRows = await db
    .select({ id: competencyAssignments.id, facultyId: competencyAssignments.facultyId })
    .from(competencyAssignments)
    .where(inArray(competencyAssignments.facultyId, facultyIds));
  const facultyByAssignmentId = new Map(assignmentRows.map((a) => [a.id, a.facultyId]));
  const assignmentIds = assignmentRows.map((a) => a.id);

  const assessmentRows = assignmentIds.length
    ? await db
        .select({ competencyAssignmentId: assessments.competencyAssignmentId, currentStatus: assessments.currentStatus })
        .from(assessments)
        .where(inArray(assessments.competencyAssignmentId, assignmentIds))
    : [];

  const attemptRows = await db
    .select({ facultyId: assessmentAttempts.facultyId, decision: assessmentAttempts.decision })
    .from(assessmentAttempts)
    .where(inArray(assessmentAttempts.facultyId, facultyIds));

  const statsByFaculty = new Map<string, { completed: number; pending: number; total: number }>();
  for (const a of assessmentRows) {
    const fId = facultyByAssignmentId.get(a.competencyAssignmentId);
    if (!fId) continue;
    const entry = statsByFaculty.get(fId) ?? { completed: 0, pending: 0, total: 0 };
    entry.total += 1;
    if (a.currentStatus === "Completed") entry.completed += 1;
    else entry.pending += 1;
    statsByFaculty.set(fId, entry);
  }

  const ratingByFaculty = new Map<string, { exceeds: number; total: number }>();
  for (const a of attemptRows) {
    const entry = ratingByFaculty.get(a.facultyId) ?? { exceeds: 0, total: 0 };
    entry.total += 1;
    if (a.decision === "Exceeds Expectations") entry.exceeds += 1;
    ratingByFaculty.set(a.facultyId, entry);
  }

  const facultyReport = facultyRows.map((f) => {
    const stats = statsByFaculty.get(f.id) ?? { completed: 0, pending: 0, total: 0 };
    const rating = ratingByFaculty.get(f.id);
    return {
      id: f.id,
      name: `${f.firstName} ${f.lastName}`,
      designation: f.designation,
      department: f.departmentName,
      assessments: stats.total,
      completed: stats.completed,
      pending: stats.pending,
      percentExceeds: rating && rating.total > 0 ? Math.round((rating.exceeds / rating.total) * 100) : 0,
    };
  });

  const summary = {
    totalFaculty: facultyReport.length,
    completedReviews: facultyReport.reduce((sum, f) => sum + f.completed, 0),
    pendingReviews: facultyReport.reduce((sum, f) => sum + f.pending, 0),
  };

  return NextResponse.json({ summary, faculty: facultyReport });
}
