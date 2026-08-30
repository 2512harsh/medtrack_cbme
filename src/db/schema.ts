import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------- enums (mirrors src/types/index.ts) ----------

export const userRoleEnum = pgEnum("user_role", [
  "Super Admin",
  "Dean",
  "HOD",
  "Faculty",
  "Student",
]);

export const userStatusEnum = pgEnum("user_status", ["ACTIVE", "INACTIVE"]);

export const assessmentStatusEnum = pgEnum("assessment_status", [
  "Draft",
  "Assigned",
  "In Progress",
  "Submitted",
  "Faculty Reviewed",
  "Waiting for Student Acknowledgement",
  "Completed",
  "Reattempt Scheduled",
]);

export const assessmentDecisionEnum = pgEnum("assessment_decision", [
  "Meets Expectations",
  "Exceeds Expectations",
  "Needs Remediation",
]);

// ---------- core org structure ----------

export const institutions = pgTable("institutions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  email: text("email"),
  phone: text("phone"),
  status: userStatusEnum("status").default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Departments are a global catalog (Anatomy, Physiology, ...), not owned by
// any one institution — every MBBS college uses the same set of department
// names. Institution + Department only come together on a person's account
// (see users.institutionId below), since each institution has its own
// Dean/HOD/faculty for "its" Anatomy department, not the department itself.
export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  status: userStatusEnum("status").default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull(),
  status: userStatusEnum("status").default("ACTIVE").notNull(),
  institutionId: uuid("institution_id").references(() => institutions.id, {
    onDelete: "set null",
  }),
  departmentId: uuid("department_id").references(() => departments.id, {
    onDelete: "set null",
  }),
  // Base64 data URL (PNG/JPEG) of the user's signature — reused on certificates
  // and official logbook documents so it isn't re-drawn per document.
  signatureImage: text("signature_image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  // Role/institution/department scoping runs on almost every list endpoint.
  index("users_role_institution_idx").on(t.role, t.institutionId),
  index("users_role_department_idx").on(t.role, t.departmentId),
]);

export const faculty = pgTable("faculty", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
  designation: text("designation").notNull(),
  employeeCode: text("employee_code").notNull().unique(),
  specialization: text("specialization"),
}, (t) => [
  index("faculty_user_idx").on(t.userId),
  index("faculty_department_idx").on(t.departmentId),
]);

export const streams = pgTable("streams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
});

export const professionalYears = pgTable("professional_years", {
  id: uuid("id").primaryKey().defaultRandom(),
  streamId: uuid("stream_id")
    .notNull()
    .references(() => streams.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sequence: integer("sequence").notNull(),
});

export const batches = pgTable("batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  streamId: uuid("stream_id")
    .notNull()
    .references(() => streams.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  admissionYear: integer("admission_year").notNull(),
  status: userStatusEnum("status").default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("batches_institution_idx").on(t.institutionId)]);

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rollNumber: text("roll_number").notNull(),
  registrationNumber: text("registration_number").notNull().unique(),
  streamId: uuid("stream_id")
    .notNull()
    .references(() => streams.id, { onDelete: "restrict" }),
  professionalYearId: uuid("professional_year_id")
    .notNull()
    .references(() => professionalYears.id, { onDelete: "restrict" }),
  batchId: uuid("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "restrict" }),
  admissionYear: integer("admission_year").notNull(),
}, (t) => [index("students_batch_idx").on(t.batchId)]);

// ---------- curriculum ----------

export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  professionalYearId: uuid("professional_year_id")
    .notNull()
    .references(() => professionalYears.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
}, (t) => [index("subjects_department_idx").on(t.departmentId)]);

export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  displayOrder: integer("display_order"),
}, (t) => [index("topics_subject_idx").on(t.subjectId)]);

export const subtopics = pgTable("subtopics", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  displayOrder: integer("display_order"),
}, (t) => [index("subtopics_topic_idx").on(t.topicId)]);

export const competencies = pgTable("competencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  subtopicId: uuid("subtopic_id")
    .notNull()
    .references(() => subtopics.id, { onDelete: "cascade" }),
  competencyCode: text("competency_code").notNull().unique(),
  competencyTitle: text("competency_title").notNull(),
  competencyDescription: text("competency_description"),
  competencyLevel: text("competency_level"),
  core: boolean("core").default(false),
  status: text("status").notNull(),
}, (t) => [index("competencies_subtopic_idx").on(t.subtopicId)]);

export const questionTemplates = pgTable("question_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  competencyId: uuid("competency_id")
    .notNull()
    .references(() => competencies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  instructions: text("instructions"),
});

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id")
    .notNull()
    .references(() => questionTemplates.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  displayOrder: integer("display_order").notNull(),
  required: boolean("required").default(true).notNull(),
}, (t) => [index("questions_template_idx").on(t.templateId)]);

// ---------- allocation & assignment ----------

export const studentAllocations = pgTable("student_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  facultyId: uuid("faculty_id")
    .notNull()
    .references(() => faculty.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  allocatedBy: uuid("allocated_by")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  allocatedDate: timestamp("allocated_date", { withTimezone: true }).defaultNow().notNull(),
  active: boolean("active").default(true).notNull(),
}, (t) => [
  index("student_allocations_student_idx").on(t.studentId),
  index("student_allocations_faculty_idx").on(t.facultyId),
]);

export const competencyAssignments = pgTable("competency_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  facultyId: uuid("faculty_id")
    .notNull()
    .references(() => faculty.id, { onDelete: "cascade" }),
  competencyId: uuid("competency_id")
    .notNull()
    .references(() => competencies.id, { onDelete: "cascade" }),
  batchId: uuid("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "restrict" }),
  assignedBy: uuid("assigned_by")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  assignedDate: timestamp("assigned_date", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("competency_assignments_batch_idx").on(t.batchId),
  index("competency_assignments_faculty_idx").on(t.facultyId),
  index("competency_assignments_competency_idx").on(t.competencyId),
]);

// ---------- assessment ----------

export const assessments = pgTable("assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  competencyAssignmentId: uuid("competency_assignment_id")
    .notNull()
    .references(() => competencyAssignments.id, { onDelete: "cascade" }),
  currentAttempt: integer("current_attempt").default(1).notNull(),
  currentStatus: assessmentStatusEnum("current_status").default("Draft").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("assessments_student_assignment_idx").on(t.studentId, t.competencyAssignmentId),
  index("assessments_assignment_idx").on(t.competencyAssignmentId),
]);

export const assessmentAttempts = pgTable("assessment_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentId: uuid("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  attemptNumber: integer("attempt_number").notNull(),
  facultyId: uuid("faculty_id")
    .notNull()
    .references(() => faculty.id, { onDelete: "set null" }),
  rating: text("rating").notNull(),
  decision: assessmentDecisionEnum("decision").notNull(),
  remarks: text("remarks").notNull(),
  facultySignature: text("faculty_signature").notNull(),
  facultySignedAt: timestamp("faculty_signed_at", { withTimezone: true }).notNull(),
  studentAcknowledged: boolean("student_acknowledged").default(false).notNull(),
  studentSignature: text("student_signature"),
  studentSignedAt: timestamp("student_signed_at", { withTimezone: true }),
  status: assessmentStatusEnum("status").notNull(),
}, (t) => [index("assessment_attempts_assessment_idx").on(t.assessmentId)]);

export const studentResponses = pgTable("student_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentId: uuid("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  templateId: uuid("template_id")
    .notNull()
    .references(() => questionTemplates.id, { onDelete: "cascade" }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("student_responses_assessment_idx").on(t.assessmentId)]);

export const studentResponseAnswers = pgTable("student_response_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  responseId: uuid("response_id")
    .notNull()
    .references(() => studentResponses.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  answerText: text("answer_text").notNull().default(""),
}, (t) => [index("student_response_answers_response_idx").on(t.responseId)]);

export const certificateSignoffRoleEnum = pgEnum("certificate_signoff_role", [
  "Faculty-in-charge",
  "HOD",
  "Dean",
]);

export const certificateSignoffs = pgTable("certificate_signoffs", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
  batchId: uuid("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  role: certificateSignoffRoleEnum("role").notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  signerName: text("signer_name").notNull(),
  signatureImage: text("signature_image"),
  signedAt: timestamp("signed_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  // One sign-off per (student, department, role) — the DELETE-then-INSERT in the
  // route keeps this true; the constraint makes it impossible to break.
  uniqueIndex("certificate_signoffs_student_dept_role_uq").on(t.studentId, t.departmentId, t.role),
]);

// ---------- notifications & audit ----------

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("notifications_user_idx").on(t.userId)]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
