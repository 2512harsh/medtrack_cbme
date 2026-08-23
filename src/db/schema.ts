import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

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
});

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
  batch: text("batch").notNull(),
  admissionYear: integer("admission_year").notNull(),
});

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
});

export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  displayOrder: integer("display_order"),
});

export const subtopics = pgTable("subtopics", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  displayOrder: integer("display_order"),
});

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
});

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
});

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
});

export const competencyAssignments = pgTable("competency_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  facultyId: uuid("faculty_id")
    .notNull()
    .references(() => faculty.id, { onDelete: "cascade" }),
  competencyId: uuid("competency_id")
    .notNull()
    .references(() => competencies.id, { onDelete: "cascade" }),
  batch: text("batch").notNull(),
  assignedBy: uuid("assigned_by")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  assignedDate: timestamp("assigned_date", { withTimezone: true }).defaultNow().notNull(),
});

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
});

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
});

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
});

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
