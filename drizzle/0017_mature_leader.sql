CREATE TABLE "problem_list_items" (
	"id" text PRIMARY KEY NOT NULL,
	"list_id" text NOT NULL,
	"problem_id" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_lists" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"share_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "problem_lists_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
ALTER TABLE "problem_list_items" ADD CONSTRAINT "problem_list_items_list_id_problem_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."problem_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_list_items" ADD CONSTRAINT "problem_list_items_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_lists" ADD CONSTRAINT "problem_lists_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "problem_list_items_unique" ON "problem_list_items" USING btree ("list_id","problem_id");