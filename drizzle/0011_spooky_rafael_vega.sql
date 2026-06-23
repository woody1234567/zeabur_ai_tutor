CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"availability_id" text NOT NULL,
	"student_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"student_note" text,
	"teacher_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_availability_id_teacher_availability_id_fk" FOREIGN KEY ("availability_id") REFERENCES "public"."teacher_availability"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_teacher_id_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;