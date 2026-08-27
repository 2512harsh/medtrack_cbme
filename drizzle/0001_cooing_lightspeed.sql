ALTER TABLE "competency_assignments" ALTER COLUMN "batch_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "batch_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "competency_assignments" DROP COLUMN "batch";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "batch";