CREATE TABLE "chat_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"system_prompt" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_history" ADD COLUMN "project_id" text;--> statement-breakpoint
ALTER TABLE "teacher_chat_history" ADD COLUMN "project_id" text;--> statement-breakpoint
ALTER TABLE "chat_projects" ADD CONSTRAINT "chat_projects_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_history" ADD CONSTRAINT "chat_history_project_id_chat_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."chat_projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_chat_history" ADD CONSTRAINT "teacher_chat_history_project_id_chat_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."chat_projects"("id") ON DELETE set null ON UPDATE no action;