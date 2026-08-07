import type { Student, CompetencyAssignment, Assessment, AssessmentAttempt } from "@/types";
import {
  mockAssignedStudents,
  mockAssignedCompetencies,
  mockAssessments,
  mockAssessmentAttempts,
} from "@/features/faculty/mock/faculty";

export function getAssignedStudents(): Promise<Student[]> {
  return Promise.resolve(mockAssignedStudents);
}

export function getAssignedCompetencies(): Promise<CompetencyAssignment[]> {
  return Promise.resolve(mockAssignedCompetencies);
}

export function getAssessments(): Promise<Assessment[]> {
  return Promise.resolve(mockAssessments);
}

export function getAssessmentAttempts(): Promise<AssessmentAttempt[]> {
  return Promise.resolve(mockAssessmentAttempts);
}

export function getAssessmentById(id: string): Promise<Assessment | undefined> {
  return Promise.resolve(mockAssessments.find((a) => a.id === id));
}

export function getAssessmentAttemptById(id: string): Promise<AssessmentAttempt | undefined> {
  return Promise.resolve(mockAssessmentAttempts.find((a) => a.id === id));
}

export function getAssessmentAttemptsByAssessmentId(assessmentId: string): Promise<AssessmentAttempt[]> {
  return Promise.resolve(mockAssessmentAttempts.filter((a) => a.assessmentId === assessmentId));
}

export function submitAssessment(data: {
  assessmentId: string;
  rating: string;
  decision: AssessmentAttempt["decision"];
  remarks: string;
  facultySignature: string;
}): Promise<AssessmentAttempt> {
  const priorAttempts = mockAssessmentAttempts.filter((a) => a.assessmentId === data.assessmentId);
  const attemptNumber = priorAttempts.length + 1;
  const newAttempt: AssessmentAttempt = {
    id: `attempt-${Date.now()}`,
    assessmentId: data.assessmentId,
    attemptNumber,
    facultyId: "fac-1",
    rating: data.rating,
    decision: data.decision,
    remarks: data.remarks,
    facultySignature: data.facultySignature,
    facultySignedAt: new Date().toISOString(),
    studentAcknowledged: false,
    status: "Submitted",
  };
  mockAssessmentAttempts.push(newAttempt);

  const assessment = mockAssessments.find((a) => a.id === data.assessmentId);
  if (assessment) {
    assessment.currentAttempt = attemptNumber;
    assessment.currentStatus =
      data.decision === "Needs Remediation"
        ? "Reattempt Scheduled"
        : "Waiting for Student Acknowledgement";
  }
  return Promise.resolve(newAttempt);
}

const draftStore = new Map<string, { rating: string; remarks: string; facultySignature: string }>();

export function saveAssessmentDraft(data: {
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
  const assessment = mockAssessments.find((a) => a.id === data.assessmentId);
  if (assessment) {
    assessment.currentStatus = "Draft";
  }
  return Promise.resolve();
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
  const existing = mockAssessments.find(
    (a) => a.studentId === studentId && a.competencyAssignmentId === competencyAssignmentId
  );
  if (existing) return Promise.resolve(existing);

  const assignment = mockAssignedCompetencies.find((c) => c.id === competencyAssignmentId);
  const student = mockAssignedStudents.find((s) => s.id === studentId);
  const assessment: Assessment = {
    id: `assess-${Date.now()}`,
    studentId,
    competencyAssignmentId,
    currentAttempt: 0,
    currentStatus: "Draft",
    createdAt: new Date().toISOString(),
    student,
    competencyAssignment: assignment,
  };
  mockAssessments.push(assessment);
  return Promise.resolve(assessment);
}

export function getStudentById(id: string): Promise<Student | undefined> {
  return Promise.resolve(mockAssignedStudents.find((s) => s.id === id));
}

export function getCompetencyAssignmentById(id: string): Promise<CompetencyAssignment | undefined> {
  return Promise.resolve(mockAssignedCompetencies.find((a) => a.id === id));
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

export function getFacultyAssessmentHistory(): Promise<FacultyAssessmentHistoryRow[]> {
  const rows = mockAssessmentAttempts
    .map((attempt) => {
      const assessment = mockAssessments.find((a) => a.id === attempt.assessmentId);
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
  return Promise.resolve(rows);
}