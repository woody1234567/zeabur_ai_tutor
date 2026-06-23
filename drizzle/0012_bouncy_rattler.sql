CREATE TABLE "testbank_classrooms" (
	"id" text PRIMARY KEY NOT NULL,
	"testbank_id" text NOT NULL,
	"classroom_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testbank_problems" (
	"id" text PRIMARY KEY NOT NULL,
	"testbank_id" text NOT NULL,
	"problem_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testbanks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner_id" text NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "testbank_classrooms" ADD CONSTRAINT "testbank_classrooms_testbank_id_testbanks_id_fk" FOREIGN KEY ("testbank_id") REFERENCES "public"."testbanks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testbank_classrooms" ADD CONSTRAINT "testbank_classrooms_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testbank_problems" ADD CONSTRAINT "testbank_problems_testbank_id_testbanks_id_fk" FOREIGN KEY ("testbank_id") REFERENCES "public"."testbanks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testbank_problems" ADD CONSTRAINT "testbank_problems_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testbanks" ADD CONSTRAINT "testbanks_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "testbank_classrooms_unique" ON "testbank_classrooms" USING btree ("testbank_id","classroom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "testbank_problems_unique" ON "testbank_problems" USING btree ("testbank_id","problem_id");