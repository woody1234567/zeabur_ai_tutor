ALTER TABLE "problems" ADD COLUMN "ai_generated" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "problems" ADD CONSTRAINT "problems_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;