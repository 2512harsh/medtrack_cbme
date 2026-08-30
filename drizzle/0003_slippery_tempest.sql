CREATE TYPE "public"."certificate_signoff_role" AS ENUM('Faculty-in-charge', 'HOD', 'Dean');--> statement-breakpoint
CREATE TABLE "certificate_signoffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"role" "certificate_signoff_role" NOT NULL,
	"user_id" uuid,
	"signer_name" text NOT NULL,
	"signature_image" text,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "certificate_signoffs" ADD CONSTRAINT "certificate_signoffs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_signoffs" ADD CONSTRAINT "certificate_signoffs_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_signoffs" ADD CONSTRAINT "certificate_signoffs_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_signoffs" ADD CONSTRAINT "certificate_signoffs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "certificate_signoffs_student_dept_role_uq" ON "certificate_signoffs" USING btree ("student_id","department_id","role");--> statement-breakpoint
CREATE INDEX "assessment_attempts_assessment_idx" ON "assessment_attempts" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "assessments_student_assignment_idx" ON "assessments" USING btree ("student_id","competency_assignment_id");--> statement-breakpoint
CREATE INDEX "assessments_assignment_idx" ON "assessments" USING btree ("competency_assignment_id");--> statement-breakpoint
CREATE INDEX "batches_institution_idx" ON "batches" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "competencies_subtopic_idx" ON "competencies" USING btree ("subtopic_id");--> statement-breakpoint
CREATE INDEX "competency_assignments_batch_idx" ON "competency_assignments" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "competency_assignments_faculty_idx" ON "competency_assignments" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "competency_assignments_competency_idx" ON "competency_assignments" USING btree ("competency_id");--> statement-breakpoint
CREATE INDEX "faculty_user_idx" ON "faculty" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "faculty_department_idx" ON "faculty" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "questions_template_idx" ON "questions" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "student_allocations_student_idx" ON "student_allocations" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_allocations_faculty_idx" ON "student_allocations" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "student_response_answers_response_idx" ON "student_response_answers" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "student_responses_assessment_idx" ON "student_responses" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "students_batch_idx" ON "students" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "subjects_department_idx" ON "subjects" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "subtopics_topic_idx" ON "subtopics" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "topics_subject_idx" ON "topics" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "users_role_institution_idx" ON "users" USING btree ("role","institution_id");--> statement-breakpoint
CREATE INDEX "users_role_department_idx" ON "users" USING btree ("role","department_id");