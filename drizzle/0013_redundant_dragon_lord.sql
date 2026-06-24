CREATE TABLE "teacher_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"gender" text,
	"bio" text,
	"interests" text,
	"teaching_areas" text,
	"teaching_experience" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_availability" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "teacher_availability" DROP COLUMN "max_students";