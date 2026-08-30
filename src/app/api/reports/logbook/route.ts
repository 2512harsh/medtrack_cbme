import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  students,
  users,
  batches,
  departments,
  faculty,
  competencyAssignments,
  competencies,
  subtopics,
  topics,
  subjects,
  assessments,
  assessmentAttempts,
  studentResponses,
  studentResponseAnswers,
  questions,
} from "@/db/schema";
import { requireRole, requireInstitution } from "@/lib/api-auth";
import { departmentAssignmentIds } from "@/lib/curriculum-scope";

// The HOD Logbook: for one batch, every competency under this department's
// curriculum, and for every student in the batch the attempts, faculty remarks
// and the student's own written responses. A student who has Completed every
// competency is flagged eligible for Certificate A.

const COMPLETED_STATUS = "Completed";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["Dean", "HOD"]);
  if (!auth.ok) return auth.response;
  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

  const batchId = request.nextUrl.searchParams.get("batchId");
  if (!batchId) {
    return NextResponse.json({ message: "batchId is required" }, { status: 400 });
  }

  // HOD is pinned to their own department; Dean must name one — the logbook is
  // always a single department's view.
  const departmentId =
    auth.user.role === "HOD" ? auth.user.departmentId : request.nextUrl.searchParams.get("departmentId");
  if (!departmentId) {
    return NextResponse.json(
      {
        message:
          auth.user.role === "HOD"
            ? "Your account has no department assigned."
            : "departmentId is required.",
      },
      { status: auth.user.role === "HOD" ? 403 : 400 }
    );
  }

  const [batch] = await db.select().from(batches).where(eq(batches.id, batchId));
  if (!batch || batch.institutionId !== auth.user.institutionId) {
    return NextResponse.json({ message: "Batch not found" }, { status: 404 });
  }

  const [department] = await db.select().from(departments).where(eq(departments.id, departmentId));
  if (!department) {
    return NextResponse.json({ message: "Department not found" }, { status: 404 });
  }

  // Assignments for this batch whose competency belongs to this department's
  // subjects.
  const deptAssignmentIds = new Set(await departmentAssignmentIds(departmentId));
  const batchAssignments = (
    await db.select().from(competencyAssignments).where(eq(competencyAssignments.batchId, batchId))
  ).filter((a) => deptAssignmentIds.has(a.id));

  const emptyResponse = {
    batch: { id: batch.id, name: batch.name },
    department: { id: department.id, name: department.name },
    competencies: [],
    students: [],
  };

  if (batchAssignments.length === 0) {
    return NextResponse.json(emptyResponse);
  }

  const assignmentIds = batchAssignments.map((a) => a.id);
  const competencyIds = [...new Set(batchAssignments.map((a) => a.competencyId))];
  const facultyIds = [...new Set(batchAssignments.map((a) => a.facultyId))];

  const [competencyRows, subtopicRows, topicRows, subjectRows, facultyRows] = await Promise.all([
    db.select().from(competencies).where(inArray(competencies.id, competencyIds)),
    db.select().from(subtopics),
    db.select().from(topics),
    db.select().from(subjects),
    db
      .select()
      .from(faculty)
      .innerJoin(users, eq(faculty.userId, users.id))
      .where(inArray(faculty.id, facultyIds)),
  ]);

  const topicIdBySubtopicId = new Map(subtopicRows.map((s) => [s.id, s.topicId]));
  const subjectIdByTopicId = new Map(topicRows.map((t) => [t.id, t.subjectId]));
  const subjectNameById = new Map(subjectRows.map((s) => [s.id, s.name]));
  const subjectNameForSubtopic = (subtopicId: string) => {
    const topicId = topicIdBySubtopicId.get(subtopicId);
    const subjectId = topicId ? subjectIdByTopicId.get(topicId) : undefined;
    return subjectId ? subjectNameById.get(subjectId) : undefined;
  };
  const competencyById = new Map(competencyRows.map((c) => [c.id, c]));
  const facultyNameById = new Map(
    facultyRows.map((r) => [r.faculty.id, `${r.users.firstName} ${r.users.lastName}`.trim()])
  );

  const competencyList = batchAssignments.map((a) => {
    const c = competencyById.get(a.competencyId);
    return {
      assignmentId: a.id,
      competencyCode: c?.competencyCode ?? "",
      competencyTitle: c?.competencyTitle ?? "",
      subjectName: c ? subjectNameForSubtopic(c.subtopicId) ?? "" : "",
      facultyName: facultyNameById.get(a.facultyId) ?? "",
    };
  });

  // Students in the batch (batch already implies the institution, but keep the
  // guard so a mismatched row can never leak in).
  const studentRows = await db
    .select()
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(and(eq(students.batchId, batchId), eq(users.institutionId, auth.user.institutionId!)));

  const studentIds = studentRows.map((r) => r.students.id);
  if (studentIds.length === 0) {
    return NextResponse.json({ ...emptyResponse, competencies: competencyList });
  }

  const assessmentRows = await db
    .select()
    .from(assessments)
    .where(
      and(
        inArray(assessments.studentId, studentIds),
        inArray(assessments.competencyAssignmentId, assignmentIds)
      )
    );
  const assessmentIds = assessmentRows.map((a) => a.id);

  const [attemptRows, allFacultyRows, responseRows] = await Promise.all([
    assessmentIds.length
      ? db.select().from(assessmentAttempts).where(inArray(assessmentAttempts.assessmentId, assessmentIds))
      : Promise.resolve([] as (typeof assessmentAttempts.$inferSelect)[]),
    db.select().from(faculty).innerJoin(users, eq(faculty.userId, users.id)),
    assessmentIds.length
      ? db.select().from(studentResponses).where(inArray(studentResponses.assessmentId, assessmentIds))
      : Promise.resolve([] as (typeof studentResponses.$inferSelect)[]),
  ]);

  const attemptFacultyName = new Map(
    allFacultyRows.map((r) => [r.faculty.id, `${r.users.firstName} ${r.users.lastName}`.trim()])
  );

  const responseIds = responseRows.map((r) => r.id);
  const answerRows = responseIds.length
    ? await db
        .select()
        .from(studentResponseAnswers)
        .where(inArray(studentResponseAnswers.responseId, responseIds))
    : [];
  const questionIds = [...new Set(answerRows.map((a) => a.questionId))];
  const questionRows = questionIds.length
    ? await db.select().from(questions).where(inArray(questions.id, questionIds))
    : [];
  const questionTextById = new Map(questionRows.map((q) => [q.id, q.questionText]));

  const answersByResponseId = new Map<string, { question: string; answer: string }[]>();
  for (const a of answerRows) {
    const list = answersByResponseId.get(a.responseId) ?? [];
    list.push({ question: questionTextById.get(a.questionId) ?? "", answer: a.answerText });
    answersByResponseId.set(a.responseId, list);
  }
  const responseByAssessmentId = new Map(
    responseRows.map((r) => [
      r.assessmentId,
      { submittedAt: r.submittedAt, answers: answersByResponseId.get(r.id) ?? [] },
    ])
  );

  const attemptsByAssessmentId = new Map<string, typeof attemptRows>();
  for (const t of attemptRows) {
    const list = attemptsByAssessmentId.get(t.assessmentId) ?? [];
    list.push(t);
    attemptsByAssessmentId.set(t.assessmentId, list);
  }

  const assessmentByKey = new Map(
    assessmentRows.map((a) => [`${a.studentId}:${a.competencyAssignmentId}`, a])
  );

  const studentList = studentRows.map((r) => {
    const s = r.students;
    const entries = batchAssignments.map((a) => {
      const assessment = assessmentByKey.get(`${s.id}:${a.id}`);
      const attempts = assessment ? attemptsByAssessmentId.get(assessment.id) ?? [] : [];
      attempts.sort((x, y) => x.attemptNumber - y.attemptNumber);
      return {
        assignmentId: a.id,
        status: assessment?.currentStatus ?? "Not Started",
        attemptCount: attempts.length,
        attempts: attempts.map((t) => ({
          attemptNumber: t.attemptNumber,
          rating: t.rating,
          decision: t.decision,
          remarks: t.remarks,
          facultyName: attemptFacultyName.get(t.facultyId) ?? "",
          facultySignedAt: t.facultySignedAt,
          studentAcknowledged: t.studentAcknowledged,
        })),
        response: assessment ? responseByAssessmentId.get(assessment.id) ?? null : null,
      };
    });
    const completedCount = entries.filter((e) => e.status === COMPLETED_STATUS).length;
    const totalCount = entries.length;
    return {
      id: s.id,
      name: `${r.users.firstName} ${r.users.lastName}`.trim(),
      rollNumber: s.rollNumber,
      registrationNumber: s.registrationNumber,
      completedCount,
      totalCount,
      eligibleForCertificate: totalCount > 0 && completedCount === totalCount,
      entries,
    };
  });

  studentList.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }));

  return NextResponse.json({
    batch: { id: batch.id, name: batch.name },
    department: { id: department.id, name: department.name },
    competencies: competencyList,
    students: studentList,
  });
}
