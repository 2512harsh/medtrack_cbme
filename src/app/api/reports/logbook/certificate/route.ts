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
  certificateSignoffs,
} from "@/db/schema";
import { requireRole, requireInstitution, type SessionUser } from "@/lib/api-auth";
import { departmentAssignmentIds } from "@/lib/curriculum-scope";

// Single-student logbook payload for the printable Certificate A + competency
// detail, plus the three-way sign-off (Faculty-in-charge / HOD / Dean).

const COMPLETED_STATUS = "Completed";
const SIGNOFF_ROLES = ["Faculty-in-charge", "HOD", "Dean"] as const;
type SignoffRole = (typeof SIGNOFF_ROLES)[number];

type Scope = {
  batch: typeof batches.$inferSelect;
  department: typeof departments.$inferSelect;
  studentRow: { students: typeof students.$inferSelect; users: typeof users.$inferSelect };
  departmentId: string;
};

// Shared validation for every verb on this route.
async function resolveScope(
  request: NextRequest,
  auth: { user: SessionUser }
): Promise<{ ok: true; scope: Scope } | { ok: false; response: NextResponse }> {
  const batchId = request.nextUrl.searchParams.get("batchId");
  const studentId = request.nextUrl.searchParams.get("studentId");
  if (!batchId || !studentId) {
    return { ok: false, response: NextResponse.json({ message: "batchId and studentId are required" }, { status: 400 }) };
  }

  const departmentId =
    auth.user.role === "HOD" ? auth.user.departmentId : request.nextUrl.searchParams.get("departmentId");
  if (!departmentId) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          message:
            auth.user.role === "HOD" ? "Your account has no department assigned." : "departmentId is required.",
        },
        { status: auth.user.role === "HOD" ? 403 : 400 }
      ),
    };
  }

  const [batch] = await db.select().from(batches).where(eq(batches.id, batchId));
  if (!batch || batch.institutionId !== auth.user.institutionId) {
    return { ok: false, response: NextResponse.json({ message: "Batch not found" }, { status: 404 }) };
  }

  const [department] = await db.select().from(departments).where(eq(departments.id, departmentId));
  if (!department) {
    return { ok: false, response: NextResponse.json({ message: "Department not found" }, { status: 404 }) };
  }

  const [studentRow] = await db
    .select()
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(and(eq(students.id, studentId), eq(students.batchId, batchId)));
  if (!studentRow || studentRow.users.institutionId !== auth.user.institutionId) {
    return { ok: false, response: NextResponse.json({ message: "Student not found" }, { status: 404 }) };
  }

  return { ok: true, scope: { batch, department, studentRow, departmentId } };
}

// department competency assignments for a batch — scoped, never a whole-table read
async function deptBatchAssignments(departmentId: string, batchId: string) {
  const allowed = new Set(await departmentAssignmentIds(departmentId));
  const rows = await db
    .select()
    .from(competencyAssignments)
    .where(eq(competencyAssignments.batchId, batchId));
  return rows.filter((a) => allowed.has(a.id));
}

// completed / total for this student across the department's assignments
async function completionFor(studentId: string, assignmentIds: string[]) {
  if (assignmentIds.length === 0) return { completed: 0, total: 0 };
  const rows = await db
    .select({ status: assessments.currentStatus, aid: assessments.competencyAssignmentId })
    .from(assessments)
    .where(
      and(eq(assessments.studentId, studentId), inArray(assessments.competencyAssignmentId, assignmentIds))
    );
  const statusByAssignment = new Map(rows.map((r) => [r.aid, r.status]));
  let completed = 0;
  for (const id of assignmentIds) {
    if (statusByAssignment.get(id) === COMPLETED_STATUS) completed += 1;
  }
  return { completed, total: assignmentIds.length };
}

async function loadSignoffs(studentId: string, departmentId: string) {
  const rows = await db
    .select()
    .from(certificateSignoffs)
    .where(
      and(eq(certificateSignoffs.studentId, studentId), eq(certificateSignoffs.departmentId, departmentId))
    );
  return new Map(rows.map((r) => [r.role as SignoffRole, r]));
}

// ---------------------------------------------------------------- GET

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["Dean", "HOD"]);
  if (!auth.ok) return auth.response;
  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

  const resolved = await resolveScope(request, auth);
  if (!resolved.ok) return resolved.response;
  const { batch, department, studentRow, departmentId } = resolved.scope;

  const [institution] = await db.select().from(institutions).where(eq(institutions.id, batch.institutionId));
  const [profYear] = await db
    .select()
    .from(professionalYears)
    .where(eq(professionalYears.id, studentRow.students.professionalYearId));

  const batchAssignments = await deptBatchAssignments(departmentId, batch.id);

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

  // HOD + Dean of record (for the "who signs" name when not yet signed).
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

  const signoffs = await loadSignoffs(student.id, departmentId);

  if (batchAssignments.length === 0) {
    const emptySlots = buildSlots(signoffs, {
      "Faculty-in-charge": { name: "", signatureImage: null },
      HOD: userSignatory(hodUser),
      Dean: userSignatory(deanUser),
    });
    return NextResponse.json({
      institution: { name: institution?.name ?? "" },
      department: { name: department.name },
      subjectLabel: department.name,
      student,
      slots: emptySlots,
      certified: false,
      eligibility: { eligible: false, completedCount: 0, totalCount: 0, pendingCount: 0 },
      competencies: [],
    });
  }

  const assignmentIds = batchAssignments.map((a) => a.id);
  const competencyIds = [...new Set(batchAssignments.map((a) => a.competencyId))];
  const assignmentFacultyIds = [...new Set(batchAssignments.map((a) => a.facultyId))];

  const [competencyRows, assignmentFacultyRows, assessmentRows] = await Promise.all([
    db.select().from(competencies).where(inArray(competencies.id, competencyIds)),
    db
      .select()
      .from(faculty)
      .innerJoin(users, eq(faculty.userId, users.id))
      .where(inArray(faculty.id, assignmentFacultyIds)),
    db
      .select()
      .from(assessments)
      .where(
        and(eq(assessments.studentId, student.id), inArray(assessments.competencyAssignmentId, assignmentIds))
      ),
  ]);

  // competency -> subtopic -> topic -> subject, each step scoped.
  const subtopicIdsNeeded = [...new Set(competencyRows.map((c) => c.subtopicId))];
  const subtopicRows = subtopicIdsNeeded.length
    ? await db.select().from(subtopics).where(inArray(subtopics.id, subtopicIdsNeeded))
    : [];
  const topicIdsNeeded = [...new Set(subtopicRows.map((s) => s.topicId))];
  const topicRows = topicIdsNeeded.length
    ? await db.select().from(topics).where(inArray(topics.id, topicIdsNeeded))
    : [];
  const subjectIdsNeeded = [...new Set(topicRows.map((t) => t.subjectId))];
  const subjectRows = subjectIdsNeeded.length
    ? await db.select().from(subjects).where(inArray(subjects.id, subjectIdsNeeded))
    : [];

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
    assignmentFacultyRows.map((r) => [r.faculty.id, `${r.users.firstName} ${r.users.lastName}`.trim()])
  );
  const facultySignatureById = new Map(
    assignmentFacultyRows.map((r) => [r.faculty.id, r.users.signatureImage ?? null])
  );

  const distinctSubjects = [
    ...new Set(competencyRows.map((c) => subjectNameForSubtopic(c.subtopicId)).filter((n): n is string => !!n)),
  ];
  const subjectLabel = distinctSubjects.length === 1 ? distinctSubjects[0] : department.name;

  const assessmentIds = assessmentRows.map((a) => a.id);
  const [attemptRows, responseRows] = await Promise.all([
    assessmentIds.length
      ? db.select().from(assessmentAttempts).where(inArray(assessmentAttempts.assessmentId, assessmentIds))
      : Promise.resolve([] as (typeof assessmentAttempts.$inferSelect)[]),
    assessmentIds.length
      ? db.select().from(studentResponses).where(inArray(studentResponses.assessmentId, assessmentIds))
      : Promise.resolve([] as (typeof studentResponses.$inferSelect)[]),
  ]);

  // Attempt authors that aren't in the assignment faculty set — fetch the extras only.
  const extraFacultyIds = [...new Set(attemptRows.map((t) => t.facultyId))].filter(
    (id) => !facultyNameById.has(id)
  );
  if (extraFacultyIds.length) {
    const extra = await db
      .select()
      .from(faculty)
      .innerJoin(users, eq(faculty.userId, users.id))
      .where(inArray(faculty.id, extraFacultyIds));
    for (const r of extra) {
      facultyNameById.set(r.faculty.id, `${r.users.firstName} ${r.users.lastName}`.trim());
      facultySignatureById.set(r.faculty.id, r.users.signatureImage ?? null);
    }
  }

  const responseIds = responseRows.map((r) => r.id);
  const answerRows = responseIds.length
    ? await db.select().from(studentResponseAnswers).where(inArray(studentResponseAnswers.responseId, responseIds))
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
  for (const list of attemptsByAssessmentId.values()) list.sort((x, y) => x.attemptNumber - y.attemptNumber);
  const assessmentByAssignmentId = new Map(assessmentRows.map((a) => [a.competencyAssignmentId, a]));

  // Faculty-in-charge of record = whoever signed the most attempts; fall back
  // to the first department assignment's faculty.
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

  const competencyDetail = batchAssignments.map((a) => {
    const c = competencyById.get(a.competencyId);
    const assessment = assessmentByAssignmentId.get(a.id);
    const attempts = assessment ? attemptsByAssessmentId.get(assessment.id) ?? [] : [];
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

  const slots = buildSlots(signoffs, {
    "Faculty-in-charge": {
      name: facultyInChargeId ? facultyNameById.get(facultyInChargeId) ?? "" : "",
      signatureImage: null,
    },
    HOD: userSignatory(hodUser),
    Dean: userSignatory(deanUser),
  });

  return NextResponse.json({
    institution: { name: institution?.name ?? "" },
    department: { name: department.name },
    subjectLabel,
    student,
    slots,
    // HOD signature is optional — a certificate is CERTIFIED once the
    // Faculty-in-charge and the Dean have both signed.
    certified: slots.filter((s) => s.role !== "HOD").every((s) => s.signed),
    eligibility: {
      eligible: totalCount > 0 && completedCount === totalCount,
      completedCount,
      totalCount,
      pendingCount: totalCount - completedCount,
    },
    competencies: competencyDetail,
  });
}

function userSignatory(u: typeof users.$inferSelect | undefined) {
  return u ? { name: `${u.firstName} ${u.lastName}`.trim(), signatureImage: null } : { name: "", signatureImage: null };
}

function buildSlots(
  signoffs: Map<SignoffRole, typeof certificateSignoffs.$inferSelect>,
  ofRecord: Record<SignoffRole, { name: string; signatureImage: string | null }>
) {
  return SIGNOFF_ROLES.map((role) => {
    const signed = signoffs.get(role);
    if (signed) {
      return {
        role,
        signed: true as const,
        name: signed.signerName,
        signatureImage: signed.signatureImage,
        signedAt: signed.signedAt,
      };
    }
    return {
      role,
      signed: false as const,
      name: ofRecord[role].name,
      signatureImage: null,
      signedAt: null,
    };
  });
}

// ---------------------------------------------------------------- POST (sign)

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["Dean", "HOD", "Faculty"]);
  if (!auth.ok) return auth.response;
  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

  const body = (await request.json().catch(() => ({}))) as { role?: string };
  const role = body.role as SignoffRole | undefined;
  if (!role || !SIGNOFF_ROLES.includes(role)) {
    return NextResponse.json({ message: "A valid role is required." }, { status: 400 });
  }

  const resolved = await resolveScope(request, auth);
  if (!resolved.ok) return resolved.response;
  const { batch, studentRow, departmentId } = resolved.scope;
  const studentId = studentRow.students.id;

  // Only the right person may sign each slot.
  const roleError = await authorizeSigner(role, auth.user, departmentId, studentId, batch.id);
  if (roleError) return roleError;

  // Student must have completed every competency in the department.
  const batchAssignments = await deptBatchAssignments(departmentId, batch.id);
  const { completed, total } = await completionFor(
    studentId,
    batchAssignments.map((a) => a.id)
  );
  if (total === 0 || completed !== total) {
    return NextResponse.json(
      { message: `Student has ${total - completed} of ${total} competencies still pending.` },
      { status: 409 }
    );
  }

  const [me] = await db.select().from(users).where(eq(users.id, auth.user.id));
  if (!me?.signatureImage) {
    return NextResponse.json(
      { message: "Upload your signature under Settings → Profile before signing." },
      { status: 400 }
    );
  }

  await db
    .delete(certificateSignoffs)
    .where(
      and(
        eq(certificateSignoffs.studentId, studentId),
        eq(certificateSignoffs.departmentId, departmentId),
        eq(certificateSignoffs.role, role)
      )
    );
  await db.insert(certificateSignoffs).values({
    studentId,
    departmentId,
    batchId: batch.id,
    role,
    userId: me.id,
    signerName: `${me.firstName} ${me.lastName}`.trim(),
    signatureImage: me.signatureImage,
  });

  return NextResponse.json({ ok: true });
}

// ---------------------------------------------------------------- DELETE (revoke)

export async function DELETE(request: NextRequest) {
  const auth = await requireRole(request, ["Dean", "HOD", "Faculty"]);
  if (!auth.ok) return auth.response;
  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

  const role = request.nextUrl.searchParams.get("role") as SignoffRole | null;
  if (!role || !SIGNOFF_ROLES.includes(role)) {
    return NextResponse.json({ message: "A valid role is required." }, { status: 400 });
  }

  const resolved = await resolveScope(request, auth);
  if (!resolved.ok) return resolved.response;
  const { studentRow, departmentId } = resolved.scope;
  const studentId = studentRow.students.id;

  const [existing] = await db
    .select()
    .from(certificateSignoffs)
    .where(
      and(
        eq(certificateSignoffs.studentId, studentId),
        eq(certificateSignoffs.departmentId, departmentId),
        eq(certificateSignoffs.role, role)
      )
    );
  if (!existing) return NextResponse.json({ ok: true });

  // The signer can revoke their own; a Dean can revoke any.
  if (existing.userId !== auth.user.id && auth.user.role !== "Dean") {
    return NextResponse.json({ message: "Only the signer or a Dean can revoke this signature." }, { status: 403 });
  }

  await db.delete(certificateSignoffs).where(eq(certificateSignoffs.id, existing.id));
  return NextResponse.json({ ok: true });
}

async function authorizeSigner(
  role: SignoffRole,
  user: SessionUser,
  departmentId: string,
  studentId: string,
  batchId: string
): Promise<NextResponse | null> {
  if (role === "Dean") {
    if (user.role !== "Dean") {
      return NextResponse.json({ message: "Only the Dean can sign this line." }, { status: 403 });
    }
    return null;
  }
  if (role === "HOD") {
    if (user.role !== "HOD" || user.departmentId !== departmentId) {
      return NextResponse.json({ message: "Only this department's HOD can sign this line." }, { status: 403 });
    }
    return null;
  }
  // Faculty-in-charge: the caller must be a Faculty who is allocated to this
  // student for one of the department's subjects, or who signed an attempt.
  if (user.role !== "Faculty") {
    return NextResponse.json({ message: "Only the Faculty-in-charge can sign this line." }, { status: 403 });
  }
  const [ownFaculty] = await db.select({ id: faculty.id }).from(faculty).where(eq(faculty.userId, user.id));
  if (!ownFaculty) {
    return NextResponse.json({ message: "No faculty record for your account." }, { status: 403 });
  }
  const assignments = await deptBatchAssignments(departmentId, batchId);
  const isAssignmentFaculty = assignments.some((a) => a.facultyId === ownFaculty.id);
  let isAttemptFaculty = false;
  if (!isAssignmentFaculty && assignments.length) {
    const studentAssessments = await db
      .select({ id: assessments.id })
      .from(assessments)
      .where(
        and(
          eq(assessments.studentId, studentId),
          inArray(
            assessments.competencyAssignmentId,
            assignments.map((a) => a.id)
          )
        )
      );
    if (studentAssessments.length) {
      const signed = await db
        .select({ facultyId: assessmentAttempts.facultyId })
        .from(assessmentAttempts)
        .where(
          inArray(
            assessmentAttempts.assessmentId,
            studentAssessments.map((a) => a.id)
          )
        );
      isAttemptFaculty = signed.some((s) => s.facultyId === ownFaculty.id);
    }
  }
  if (!isAssignmentFaculty && !isAttemptFaculty) {
    return NextResponse.json(
      { message: "You are not the Faculty-in-charge for this student." },
      { status: 403 }
    );
  }
  return null;
}
