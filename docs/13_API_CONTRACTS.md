# MedTrack CBME Frontend Payload Contracts

Version: 1.0

> Source basis: MedTrack CBME full document prompt. This frontend suite preserves frontend-relevant requirements from the source and excludes backend implementation details.


## Purpose

This document defines frontend-facing payload shapes only. It does not define backend implementation, database access, validation internals, rate limiting, or security infrastructure.

## Base Response Shape

```ts
type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

type ApiError = {
  success: false;
  message: string;
  errors?: unknown[];
};
```

## Pagination Query

```ts
type PaginationQuery = {
  page?: number; // default 1
  limit?: number; // default 20, maximum 100
};
```

## Sorting and Filtering

```ts
type SortQuery = {
  sort?: string;
  order?: "asc" | "desc";
};

type CommonFilters = {
  search?: string;
  department?: string;
  status?: string;
  batch?: string;
};
```

## User

```ts
type UserRole = "Super Admin" | "HOD" | "Faculty" | "Student";

type UserStatus = "ACTIVE" | "INACTIVE";

type UserSummary = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  departmentId?: string;
  createdAt: string;
  updatedAt: string;
};
```

## Institution

```ts
type Institution = {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
};
```

## Department

```ts
type Department = {
  id: string;
  institutionId: string;
  name: string;
  description?: string;
  hodId?: string;
  createdAt: string;
  updatedAt: string;
};
```

## Faculty

```ts
type Faculty = {
  id: string;
  userId: string;
  departmentId: string;
  designation: string;
  employeeCode: string;
  specialization?: string;
  user?: UserSummary;
};
```

## Student

```ts
type Student = {
  id: string;
  userId: string;
  rollNumber: string;
  registrationNumber: string;
  streamId: string;
  professionalYearId: string;
  batch: string;
  admissionYear: number;
  user?: UserSummary;
};
```

## Curriculum

```ts
type Stream = {
  id: string;
  name: string;
};

type ProfessionalYear = {
  id: string;
  streamId: string;
  name: string;
  sequence: number;
};

type Subject = {
  id: string;
  professionalYearId: string;
  departmentId: string;
  name: string;
  code: string;
};

type Topic = {
  id: string;
  subjectId: string;
  title: string;
  displayOrder?: number;
};

type Competency = {
  id: string;
  topicId: string;
  competencyCode: string;
  competencyTitle: string;
  competencyDescription?: string;
  competencyLevel?: string;
  core?: boolean;
  status: string;
};
```

## Question Template

```ts
type QuestionTemplate = {
  id: string;
  competencyId: string;
  title: string;
  instructions?: string;
  questions?: Question[];
};

type Question = {
  id: string;
  templateId: string;
  questionText: string;
  displayOrder: number;
  required: boolean;
};
```

## Student Allocation

```ts
type StudentAllocation = {
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
};
```

## Competency Assignment

```ts
type CompetencyAssignment = {
  id: string;
  facultyId: string;
  competencyId: string;
  batch: string;
  assignedBy: string;
  assignedDate: string;
  faculty?: Faculty;
  competency?: Competency;
};
```

## Assessment

```ts
type AssessmentStatus =
  | "Draft"
  | "Assigned"
  | "In Progress"
  | "Submitted"
  | "Reviewed"
  | "Waiting for Student Acknowledgement"
  | "Completed"
  | "Repeat Scheduled";

type AssessmentDecision =
  | "Meets Expectations"
  | "Exceeds Expectations"
  | "Needs Remediation";

type Assessment = {
  id: string;
  studentId: string;
  competencyAssignmentId: string;
  currentAttempt: number;
  currentStatus: AssessmentStatus;
  createdAt: string;
  student?: Student;
  competencyAssignment?: CompetencyAssignment;
};
```

## Assessment Attempt

```ts
type AssessmentAttempt = {
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
};
```

## Assessment Review Payload

```ts
type SubmitFacultyReviewPayload = {
  rating: string;
  decision: AssessmentDecision;
  remarks: string;
  facultySignature: string;
};
```

## Student Acknowledgement Payload

```ts
type StudentAcknowledgementPayload = {
  acknowledgementChecked: true;
  studentSignature: string;
};
```

## Notification

```ts
type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};
```

## Audit Log

```ts
type AuditLog = {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  createdAt: string;
};
```

## Endpoint Groups for Frontend Services

The frontend may organize service functions around these groups:

- `/api/v1/auth/login`
- `/api/v1/auth/logout`
- `/api/v1/auth/me`
- `/api/v1/users`
- `/api/v1/departments`
- `/api/v1/faculty`
- `/api/v1/students`
- `/api/v1/students/import`
- Curriculum resources: streams, professional years, subjects, topics, competencies, question templates.
- `/api/v1/student-allocations`
- `/api/v1/student-allocations/history`
- `/api/v1/student-allocations/reassign`
- `/api/v1/competency-assignments`
- `/api/v1/assessments`
- `/api/v1/assessments/{id}`
- `/api/v1/assessments/{id}/review`
- `/api/v1/assessments/{id}/acknowledge`
- `/api/v1/assessments/{id}/history`
- `/api/v1/notifications`
- `/api/v1/dashboard/hod`
- `/api/v1/dashboard/faculty`
- `/api/v1/dashboard/student`
- `/api/v1/audit`

These are consumption contracts for the frontend and should not be treated as backend implementation instructions.
