export type UserRole = "Super Admin" | "Dean" | "HOD" | "Faculty" | "Student";

export type UserStatus = "ACTIVE" | "INACTIVE";

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  institutionId?: string;
  departmentId?: string;
  signatureImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Institution {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  email?: string;
  phone?: string;
  status?: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  status?: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface Faculty {
  id: string;
  userId: string;
  departmentId: string;
  designation: string;
  employeeCode: string;
  specialization?: string;
  user?: UserSummary;
}

export interface Student {
  id: string;
  userId: string;
  rollNumber: string;
  registrationNumber: string;
  streamId: string;
  professionalYearId: string;
  batchId: string;
  batch: string;
  admissionYear: number;
  user?: UserSummary;
}

export interface Batch {
  id: string;
  institutionId: string;
  streamId: string;
  name: string;
  admissionYear: number;
  status?: "ACTIVE" | "INACTIVE";
}

export interface Stream {
  id: string;
  name: string;
}

export interface ProfessionalYear {
  id: string;
  streamId: string;
  name: string;
  sequence: number;
}

export interface Subject {
  id: string;
  professionalYearId: string;
  departmentId: string;
  name: string;
  code: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  title: string;
  displayOrder?: number;
}

export interface Subtopic {
  id: string;
  topicId: string;
  title: string;
  displayOrder?: number;
}

export interface Competency {
  id: string;
  subtopicId: string;
  competencyCode: string;
  competencyTitle: string;
  competencyDescription?: string;
  competencyLevel?: string;
  core?: boolean;
  status: string;
  subjectName?: string;
}

export interface QuestionTemplate {
  id: string;
  competencyId: string;
  title: string;
  instructions?: string;
  questions?: Question[];
}

export interface Question {
  id: string;
  templateId: string;
  questionText: string;
  displayOrder: number;
  required: boolean;
}

export interface StudentAllocation {
  id: string;
  facultyId: string;
  studentId: string;
  subjectId: string;
  allocatedBy: string;
  allocatedDate: string;
  active: boolean;
  faculty?: Faculty;
  student?: Student;
  subject?: Subject;
}

export interface CompetencyAssignment {
  id: string;
  facultyId: string;
  competencyId: string;
  batchId: string;
  batch: string;
  assignedBy: string;
  assignedDate: string;
  faculty?: Faculty;
  competency?: Competency;
  pendingCount?: number;
  totalStudents?: number;
}

export type AssessmentStatus =
  | "Draft"
  | "Assigned"
  | "In Progress"
  | "Submitted"
  | "Faculty Reviewed"
  | "Waiting for Student Acknowledgement"
  | "Completed"
  | "Reattempt Scheduled";

export type AssessmentDecision =
  | "Meets Expectations"
  | "Exceeds Expectations"
  | "Needs Remediation";

export interface Assessment {
  id: string;
  studentId: string;
  competencyAssignmentId: string;
  currentAttempt: number;
  currentStatus: AssessmentStatus;
  createdAt: string;
  student?: Student;
  competencyAssignment?: CompetencyAssignment;
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  attemptNumber: number;
  facultyId: string;
  rating: string;
  decision: AssessmentDecision;
  remarks: string;
  facultySignature: string;
  facultySignedAt: string;
  studentAcknowledged: boolean;
  studentSignature?: string;
  studentSignedAt?: string;
  status: AssessmentStatus;
}

export interface SubmitFacultyReviewPayload {
  rating: string;
  decision: AssessmentDecision;
  remarks: string;
  facultySignature: string;
}

export interface StudentAcknowledgementPayload {
  acknowledgementChecked: true;
  studentSignature: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  createdAt: string;
}

export type PaginationQuery = {
  page?: number;
  limit?: number;
};

export type SortQuery = {
  sort?: string;
  order?: "asc" | "desc";
};

export type CommonFilters = {
  search?: string;
  department?: string;
  status?: string;
  batch?: string;
};

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiError = {
  success: false;
  message: string;
  errors?: unknown[];
};