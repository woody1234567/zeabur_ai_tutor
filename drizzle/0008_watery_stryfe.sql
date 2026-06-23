CREATE TABLE "ai_interaction_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"event_key" text NOT NULL,
	"chat_id" text NOT NULL,
	"message_id" text,
	"tool_call_id" text,
	"user_id" text NOT NULL,
	"user_role" text NOT NULL,
	"event_type" text NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"content" text,
	"attachments" jsonb,
	"tool_name" text,
	"tool_input" jsonb,
	"tool_output" jsonb,
	"finish_reason" text,
	"duration_ms" integer,
	"error" text,
	"classroom_id" text,
	"project_id" text,
	"step_number" integer,
	"model_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_interaction_logs" ADD CONSTRAINT "ai_interaction_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_interaction_logs_event_key_unique" ON "ai_interaction_logs" USING btree ("event_key");--> statement-breakpoint
CREATE INDEX "ai_interaction_logs_chat_created_idx" ON "ai_interaction_logs" USING btree ("chat_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_interaction_logs_created_idx" ON "ai_interaction_logs" USING btree ("created_at");