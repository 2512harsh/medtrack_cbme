import type {
  Student,
  CompetencyAssignment,
  Assessment,
  AssessmentAttempt,
  AssessmentStatus,
} from "@/types";
import {
  mockStudent,
  mockMyCompetencies,
  mockAssessments,
  mockAssessmentAttempts,
} from "@/features/student/mock/student";

export function getStudent(): Promise<Student> {
  return Promise.resolve(mockStudent);
}

export function getMyCompetencies(): Promise<CompetencyAssignment[]> {
  return Promise.resolve(mockMyCompetencies);
}

export function getMyAssessments(): Promise<Assessment[]> {
  return Promise.resolve(mockAssessments);
}

export function getMyAssessmentAttempts(): Promise<AssessmentAttempt[]> {
  return Promise.resolve(mockAssessmentAttempts);
}

export function getCompetencyAssignmentById(id: string): Promise<CompetencyAssignment | undefined> {
  return Promise.resolve(mockMyCompetencies.find((a) => a.id === id));
}

export function getAssessmentById(id: string): Promise<Assessment | undefined> {
  return Promise.resolve(mockAssessments.find((a) => a.id === id));
}

export function getAssessmentAttemptsByAssessmentId(assessmentId: string): Promise<AssessmentAttempt[]> {
  return Promise.resolve(mockAssessmentAttempts.filter((a) => a.assessmentId === assessmentId));
}

export function acknowledgeAssessment(assessmentId: string, signature: string): Promise<AssessmentAttempt> {
  const index = mockAssessmentAttempts.findIndex((a) => a.assessmentId === assessmentId);
  if (index === -1) {
    return Promise.reject(new Error("Assessment attempt not found"));
  }
  mockAssessmentAttempts[index] = {
    ...mockAssessmentAttempts[index],
    studentAcknowledged: true,
    studentSignature: signature,
    studentSignedAt: new Date().toISOString(),
    status: "Completed",
  };
  return Promise.resolve(mockAssessmentAttempts[index]);
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
  return Promise.resolve([
    { subject: "Anatomy", completed: 8, total: 10 },
    { subject: "Physiology", completed: 3, total: 8 },
    { subject: "Biochemistry", completed: 2, total: 7 },
  ]);
}

interface StudentResponseAnswer {
  questionId: string;
  answerText: string;
}

export interface SubmitStudentResponsePayload {
  questionTemplateId: string;
  answers: StudentResponseAnswer[];
}

const mockStudentResponses = new Map<string, SubmitStudentResponsePayload>();

export function getStudentResponse(
  questionTemplateId: string
): Promise<SubmitStudentResponsePayload | undefined> {
  return Promise.resolve(mockStudentResponses.get(questionTemplateId));
}

export function saveStudentResponse(
  payload: SubmitStudentResponsePayload
): Promise<SubmitStudentResponsePayload> {
  mockStudentResponses.set(payload.questionTemplateId, payload);
  return Promise.resolve(payload);
}

export function submitStudentResponse(
  assessmentId: string,
  payload: SubmitStudentResponsePayload
): Promise<Assessment> {
  mockStudentResponses.set(payload.questionTemplateId, payload);
  const index = mockAssessments.findIndex((a) => a.id === assessmentId);
  if (index === -1) {
    return Promise.reject(new Error("Assessment not found"));
  }
  mockAssessments[index] = {
    ...mockAssessments[index],
    currentStatus: "Submitted" as AssessmentStatus,
  };
  return Promise.resolve(mockAssessments[index]);
}