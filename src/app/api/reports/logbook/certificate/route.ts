import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  students,
  users,
  batches,
  institutions,
  departments,
  professionalYears,
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

// Single-student logbook payload for the printable Certificate A + competency
// detail. Reuses the batch/department scoping of the logbook list.

const COMPLETED_STATUS = "Completed";

type Signatory = { name: string; signatureImage: string | null };

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["Dean", "HOD"]);
  if (!auth.ok) return auth.response;
  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

  const batchId = request.nextUrl.searchParams.get("batchId");
  const studentId = request.nextUrl.searchParams.get("studentId");
  if (!batchId || !studentId) {
    return NextResponse.json({ message: "batchId and studentId are required" }, { status: 400 });
  }

  const departmentId =
    auth.user.role === "HOD" ? auth.user.departmentId : request.nextUrl.searchParams.get("departmentId");
  if (!departmentId) {
    return NextResponse.json(
      {
        message:
          auth.user.role === "HOD" ? "Your account has no department assigned." : "departmentId is required.",
      },
      { status: auth.user.role === "HOD" ? 403 : 400 }
    );
  }

  const [batch] = await db.select().from(batches).where(eq(batches.id, batchId));
  if (!batch || batch.institutionId !== auth.user.institutionId) {
    return NextResponse.json({ message: "Batch not found" }, { status: 404 });
  }

  const [institution] = await db.select().from(institutions).where(eq(institutions.id, batch.institutionId));
  const [department] = await db.select().from(departments).where(eq(departments.id, departmentId));
  if (!department) {
    return NextResponse.json({ message: "Department not found" }, { status: 404 });
  }

  const [studentRow] = await db
    .select()
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(and(eq(students.id, studentId), eq(students.batchId, batchId)));
  if (!studentRow || studentRow.users.institutionId !== auth.user.institutionId) {
    return NextResponse.json({ message: "Student not found" }, { status: 404 });
  }

  const [profYear] = await db
    .select()
    .from(professionalYears)
    .where(eq(professionalYears.id, studentRow.students.professionalYearId));

  // Department's competency assignments for this batch.
  const deptAssignmentIds = new Set(await departmentAssignmentIds(departmentId));
  const batchAssignments = (
    await db.select().from(competencyAssignments).where(eq(competencyAssignments.batchId, batchId))
  ).filter((a) => deptAssignmentIds.has(a.id));

  const student = {
    id: studentRow.students.id,
    name: `${studentRow.users.firstName} ${studentRow.users.lastName}`.trim(),
    rollNumber: studentRow.students.rollNumber,
    registrationNumber: studentRow.students.registrationNumber,
    email: studentRow.users.email,
    batch: batch.name,
    professionalYear: profYear?.name ?? "",
    admissionYear: studentRow.students.admissionYear,
  };

  // HOD + Dean signatories for this institution / department.
  const [hodUser] = await db
    .select()
    .from(users)
    .where(
      and(eq(users.role, "HOD"), eq(users.departmentId, departmentId), eq(users.institutionId, batch.institutionId))
    );
  const [deanUser] = await db
    .select()
    .from(users)
    .where(and(eq(users.role, "Dean"), eq(users.institutionId, batch.institutionId)));

  const hod: Signatory = hodUser
    ? { name: `${hodUser.firstName} ${hodUser.lastName}`.trim(), signatureImage: hodUser.signatureImage ?? null }
    : { name: "", signatureImage: null };
  const dean: Signatory = deanUser
    ? { name: `${deanUser.firstName} ${deanUser.lastName}`.trim(), signatureImage: deanUser.signatureImage ?? null }
    : { name: "", signatureImage: null };

  const emptyPayload = {
    institution: { name: institution?.name ?? "" },
    department: { name: department.name },
    subjectLabel: department.name,
    student,
    signatories: { facultyInCharge: { name: "", signatureImage: null }, hod, dean },
    eligibility: { eligible: false, completedCount: 0, totalCount: 0, pendingCount: 0 },
    competencies: [] as unknown[],
  };

  if (batchAssignments.length === 0) {
    return NextResponse.json(emptyPayload);
  }

  const assignmentIds = batchAssignments.map((a) => a.id);
  const competencyIds = [...new Set(batchAssignments.map((a) => a.competencyId))];
  const assignmentFacultyIds = [...new Set(batchAssignments.map((a) => a.facultyId))];

  const [competencyRows, subtopicRows, topicRows, subjectRows, facultyRows] = await Promise.all([
    db.select().from(competencies).where(inArray(competencies.id, competencyIds)),
    db.select().from(subtopics),
    db.select().from(topics),
    db.select().from(subjects),
    db.select().from(faculty).innerJoin(users, eq(faculty.userId, users.id)),
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
  const facultySignatureById = new Map(
    facultyRows.map((r) => [r.faculty.id, r.users.signatureImage ?? null])
  );

  // Cover title: single subject if the whole department maps to one, else the
  // department name.
  const distinctSubjects = [
    ...new Set(
      competencyRows.map((c) => subjectNameForSubtopic(c.subtopicId)).filter((n): n is string => !!n)
    ),
  ];
  const subjectLabel = distinctSubjects.length === 1 ? distinctSubjects[0] : department.name;

  const assessmentRows = await db
    .select()
    .from(assessments)
    .where(
      and(eq(assessments.studentId, studentId), inArray(assessments.competencyAssignmentId, assignmentIds))
    );
  const assessmentIds = assessmentRows.map((a) => a.id);

  const attemptRows = assessmentIds.length
    ? await db.select().from(assessmentAttempts).where(inArray(assessmentAttempts.assessmentId, assessmentIds))
    : [];
  const responseRows = assessmentIds.length
    ? await db.select().from(studentResponses).where(inArray(studentResponses.assessmentId, assessmentIds))
    : [];
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
  const assessmentByAssignmentId = new Map(assessmentRows.map((a) => [a.competencyAssignmentId, a]));

  // Faculty-in-charge = whoever signed the most of this student's attempts;
  // fall back to the faculty on the first department assignment.
  const signedCount = new Map<string, number>();
  for (const t of attemptRows) signedCount.set(t.facultyId, (signedCount.get(t.facultyId) ?? 0) + 1);
  let facultyInChargeId = assignmentFacultyIds[0];
  let best = -1;
  for (const [fid, count] of signedCount) {
    if (count > best) {
      best = count;
      facultyInChargeId = fid;
    }
  }
  const facultyInCharge: Signatory = {
    name: facultyInChargeId ? facultyNameById.get(facultyInChargeId) ?? "" : "",
    signatureImage: facultyInChargeId ? facultySignatureById.get(facultyInChargeId) ?? null : null,
  };

  const competencyDetail = batchAssignments.map((a) => {
    const c = competencyById.get(a.competencyId);
    const assessment = assessmentByAssignmentId.get(a.id);
    const attempts = assessment ? attemptsByAssessmentId.get(assessment.id) ?? [] : [];
    attempts.sort((x, y) => x.attemptNumber - y.attemptNumber);
    return {
      competencyCode: c?.competencyCode ?? "",
      competencyTitle: c?.competencyTitle ?? "",
      subjectName: c ? subjectNameForSubtopic(c.subtopicId) ?? "" : "",
      facultyName: facultyNameById.get(a.facultyId) ?? "",
      status: assessment?.currentStatus ?? "Not Started",
      attempts: attempts.map((t) => ({
        attemptNumber: t.attemptNumber,
        rating: t.rating,
        decision: t.decision,
        remarks: t.remarks,
        facultyName: facultyNameById.get(t.facultyId) ?? "",
        facultySignedAt: t.facultySignedAt,
        studentAcknowledged: t.studentAcknowledged,
      })),
      response: assessment ? responseByAssessmentId.get(assessment.id) ?? null : null,
    };
  });

  const totalCount = competencyDetail.length;
  const completedCount = competencyDetail.filter((c) => c.status === COMPLETED_STATUS).length;

  return NextResponse.json({
    institution: { name: institution?.name ?? "" },
    department: { name: department.name },
    subjectLabel,
    student,
    signatories: { facultyInCharge, hod, dean },
    eligibility: {
      eligible: totalCount > 0 && completedCount === totalCount,
      completedCount,
      totalCount,
      pendingCount: totalCount - completedCount,
    },
    competencies: competencyDetail,
  });
}
