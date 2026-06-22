CREATE TABLE "ai_tool_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_role" text,
	"tool_name" text NOT NULL,
	"user_message" text,
	"args" jsonb,
	"result_summary" text,
	"result_count" integer,
	"duration_ms" integer,
	"error" text,
	"classroom_id" text,
	"project_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_tool_logs" ADD CONSTRAINT "ai_tool_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;