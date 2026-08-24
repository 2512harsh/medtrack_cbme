import type { Faculty, Student, CompetencyAssignment, Assessment, AssessmentAttempt } from "@/types";

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}`);
  }
  return res.json();
}

async function apiSend<T>(url: string, method: "POST" | "PATCH", body: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.message ?? `Failed to save (${url})`);
  }
  return res.json();
}

export function getCurrentFaculty(): Promise<Faculty> {
  return apiGet<Faculty>("/api/faculty/me");
}

async function getCurrentFacultyId(): Promise<string> {
  const me = await getCurrentFaculty();
  return me.id;
}

function getAllAssessments(): Promise<Assessment[]> {
  return apiGet<Assessment[]>("/api/assessments");
}

export async function getAssignedStudents(): Promise<Student[]> {
  const facultyId = await getCurrentFacultyId();
  const allocations = await apiGet<{ student: Student }[]>(
    `/api/dean/student-allocations?facultyId=${encodeURIComponent(facultyId)}`
  );
  const byId = new Map(allocations.filter((a) => a.student).map((a) => [a.student.id, a.student]));
  return [...byId.values()];
}

export async function getAssignedCompetencies(): Promise<CompetencyAssignment[]> {
  const facultyId = await getCurrentFacultyId();
  return apiGet<CompetencyAssignment[]>(
    `/api/dean/competency-assignments?facultyId=${encodeURIComponent(facultyId)}`
  );
}

export async function getAssessments(): Promise<Assessment[]> {
  const facultyId = await getCurrentFacultyId();
  const all = await getAllAssessments();
  return all.filter((a) => a.competencyAssignment?.facultyId === facultyId);
}

export function getAssessmentAttempts(): Promise<AssessmentAttempt[]> {
  return apiGet<AssessmentAttempt[]>("/api/assessment-attempts");
}

export async function getAssessmentById(id: string): Promise<Assessment | undefined> {
  const res = await fetch(`/api/assessments/${id}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Failed to load assessment ${id}`);
  return res.json();
}

export async function getAssessmentForStudentAndAssignment(
  studentId: string,
  competencyAssignmentId: string
): Promise<Assessment | undefined> {
  const assessments = await apiGet<Assessment[]>(`/api/assessments?studentId=${encodeURIComponent(studentId)}`);
  return assessments.find((a) => a.competencyAssignmentId === competencyAssignmentId);
}

export interface StudentResponseAnswer {
  questionId: string;
  answerText: string;
}

export async function getAssessmentResponse(
  assessmentId: string
): Promise<{ templateId: string; answers: StudentResponseAnswer[] } | undefined> {
  const res = await fetch(`/api/assessments/${assessmentId}/response`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Failed to load response for assessment ${assessmentId}`);
  return res.json();
}

export async function getAssessmentAttemptById(id: string): Promise<AssessmentAttempt | undefined> {
  const res = await fetch(`/api/assessment-attempts/${id}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Failed to load assessment attempt ${id}`);
  return res.json();
}

export function getAssessmentAttemptsByAssessmentId(assessmentId: string): Promise<AssessmentAttempt[]> {
  return apiGet<AssessmentAttempt[]>(`/api/assessment-attempts?assessmentId=${encodeURIComponent(assessmentId)}`);
}

export function submitAssessment(data: {
  assessmentId: string;
  rating: string;
  decision: AssessmentAttempt["decision"];
  remarks: string;
  facultySignature: string;
}): Promise<AssessmentAttempt> {
  return apiSend<AssessmentAttempt>("/api/assessment-attempts", "POST", data);
}

const draftStore = new Map<string, { rating: string; remarks: string; facultySignature: string }>();

export async function saveAssessmentDraft(data: {
  assessmentId: string;
  rating: string;
  remarks: string;
  facultySignature: string;
}): Promise<void> {
  draftStore.set(data.assessmentId, {
    rating: data.rating,
    remarks: data.remarks,
    facultySignature: data.facultySignature,
  });
  await apiSend<Assessment>(`/api/assessments/${data.assessmentId}`, "PATCH", { currentStatus: "Draft" });
}

export function getAssessmentDraft(
  assessmentId: string
): Promise<{ rating: string; remarks: string; facultySignature: string } | undefined> {
  return Promise.resolve(draftStore.get(assessmentId));
}

export function getOrCreateAssessment(
  studentId: string,
  competencyAssignmentId: string
): Promise<Assessment> {
  return apiSend<Assessment>("/api/assessments", "POST", { studentId, competencyAssignmentId });
}

export async function getStudentById(id: string): Promise<Student | undefined> {
  const res = await fetch(`/api/dean/students/${id}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Failed to load student ${id}`);
  return res.json();
}

export async function getCompetencyAssignmentById(id: string): Promise<CompetencyAssignment | undefined> {
  const res = await fetch(`/api/dean/competency-assignments/${id}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Failed to load competency assignment ${id}`);
  return res.json();
}

export interface FacultyAssessmentHistoryRow {
  id: string;
  assessmentId: string;
  attemptNumber: number;
  studentName: string;
  competencyCode: string;
  competencyTitle: string;
  rating: string;
  decision: AssessmentAttempt["decision"];
  remarks: string;
  facultySignature: string;
  facultySignedAt: string;
  studentSignature?: string;
  studentSignedAt?: string;
  studentAcknowledged: boolean;
  status: AssessmentAttempt["status"];
}

export async function getFacultyAssessmentHistory(): Promise<FacultyAssessmentHistoryRow[]> {
  const facultyId = await getCurrentFacultyId();
  const [attempts, assessments] = await Promise.all([getAssessmentAttempts(), getAllAssessments()]);
  const assessmentById = new Map(assessments.map((a) => [a.id, a]));

  const rows = attempts
    .filter((attempt) => attempt.facultyId === facultyId)
    .map((attempt) => {
      const assessment = assessmentById.get(attempt.assessmentId);
      const student = assessment?.student;
      const competency = assessment?.competencyAssignment?.competency;
      return {
        id: attempt.id,
        assessmentId: attempt.assessmentId,
        attemptNumber: attempt.attemptNumber,
        studentName: student?.user
          ? `${student.user.firstName} ${student.user.lastName}`
          : "Unknown Student",
        competencyCode: competency?.competencyCode ?? "—",
        competencyTitle: competency?.competencyTitle ?? "Unknown Competency",
        rating: attempt.rating,
        decision: attempt.decision,
        remarks: attempt.remarks,
        facultySignature: attempt.facultySignature,
        facultySignedAt: attempt.facultySignedAt,
        studentSignature: attempt.studentSignature,
        studentSignedAt: attempt.studentSignedAt,
        studentAcknowledged: attempt.studentAcknowledged,
        status: attempt.status,
      };
    })
    .sort((a, b) => b.facultySignedAt.localeCompare(a.facultySignedAt));
  return rows;
}