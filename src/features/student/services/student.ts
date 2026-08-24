import type {
  Student,
  CompetencyAssignment,
  Assessment,
  AssessmentAttempt,
  AssessmentStatus,
} from "@/types";

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

export function getStudent(): Promise<Student> {
  return apiGet<Student>("/api/student/me");
}

export async function getMyCompetencies(): Promise<CompetencyAssignment[]> {
  const student = await getStudent();
  return apiGet<CompetencyAssignment[]>(
    `/api/dean/competency-assignments?batch=${encodeURIComponent(student.batch)}`
  );
}

export async function getMyAssessments(): Promise<Assessment[]> {
  const student = await getStudent();
  return apiGet<Assessment[]>(`/api/assessments?studentId=${encodeURIComponent(student.id)}`);
}

export async function getMyAssessmentAttempts(): Promise<AssessmentAttempt[]> {
  const student = await getStudent();
  return apiGet<AssessmentAttempt[]>(`/api/assessment-attempts?studentId=${encodeURIComponent(student.id)}`);
}

export async function getCompetencyAssignmentById(id: string): Promise<CompetencyAssignment | undefined> {
  const res = await fetch(`/api/dean/competency-assignments/${id}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Failed to load competency assignment ${id}`);
  return res.json();
}

export async function getAssessmentById(id: string): Promise<Assessment | undefined> {
  const res = await fetch(`/api/assessments/${id}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Failed to load assessment ${id}`);
  return res.json();
}

export async function getOrCreateMyAssessment(competencyAssignmentId: string): Promise<Assessment> {
  const student = await getStudent();
  return apiSend<Assessment>("/api/assessments", "POST", {
    studentId: student.id,
    competencyAssignmentId,
  });
}

export function getAssessmentAttemptsByAssessmentId(assessmentId: string): Promise<AssessmentAttempt[]> {
  return apiGet<AssessmentAttempt[]>(`/api/assessment-attempts?assessmentId=${encodeURIComponent(assessmentId)}`);
}

export function acknowledgeAssessment(assessmentId: string, signature: string): Promise<AssessmentAttempt> {
  return apiSend<AssessmentAttempt>(`/api/assessments/${assessmentId}/acknowledge`, "POST", { signature });
}

export async function acknowledgeAssessments(
  assessmentIds: string[],
  signature: string
): Promise<AssessmentAttempt[]> {
  const updated: AssessmentAttempt[] = [];
  for (const assessmentId of assessmentIds) {
    updated.push(await acknowledgeAssessment(assessmentId, signature));
  }
  return updated;
}

const FEEDBACK_VIEWED_KEY = "medtrack_feedback_viewed";

function getViewedAssessmentIds(): Set<string> {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = localStorage.getItem(FEEDBACK_VIEWED_KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set<string>();
  }
}

function persistViewedAssessmentIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FEEDBACK_VIEWED_KEY, JSON.stringify([...ids]));
  } catch {
    // storage unavailable — tracking is best-effort
  }
}

export function markFeedbackViewed(assessmentId: string): Promise<void> {
  const ids = getViewedAssessmentIds();
  ids.add(assessmentId);
  persistViewedAssessmentIds(ids);
  return Promise.resolve();
}

export function hasViewedFeedback(assessmentId: string): boolean {
  return getViewedAssessmentIds().has(assessmentId);
}

export function getProgress(): Promise<{ subject: string; completed: number; total: number }[]> {
  return apiGet<{ subject: string; completed: number; total: number }[]>("/api/student/progress");
}

interface StudentResponseAnswer {
  questionId: string;
  answerText: string;
}

export interface SubmitStudentResponsePayload {
  questionTemplateId: string;
  answers: StudentResponseAnswer[];
}

export async function getStudentResponse(
  assessmentId: string
): Promise<SubmitStudentResponsePayload | undefined> {
  const res = await fetch(`/api/assessments/${assessmentId}/response`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Failed to load response for assessment ${assessmentId}`);
  return res.json();
}

export function saveStudentResponse(
  assessmentId: string,
  payload: SubmitStudentResponsePayload
): Promise<SubmitStudentResponsePayload> {
  return apiSend<SubmitStudentResponsePayload>(`/api/assessments/${assessmentId}/response`, "POST", payload);
}

export async function submitStudentResponse(
  assessmentId: string,
  payload: SubmitStudentResponsePayload
): Promise<Assessment> {
  await saveStudentResponse(assessmentId, payload);
  return apiSend<Assessment>(`/api/assessments/${assessmentId}`, "PATCH", {
    currentStatus: "Submitted" satisfies AssessmentStatus,
  });
}
