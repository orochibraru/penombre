CREATE TABLE "file_presence" (
	"id" text PRIMARY KEY NOT NULL,
	"file_id" text NOT NULL,
	"user_id" text NOT NULL,
	"mode" text NOT NULL,
	"seen_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "file_notes" ADD COLUMN "anchor" text;--> statement-breakpoint
ALTER TABLE "file_notes" ADD COLUMN "parent_id" text;--> statement-breakpoint
ALTER TABLE "file_notes" ADD COLUMN "resolved_at" timestamp;--> statement-breakpoint
ALTER TABLE "file_notes" ADD COLUMN "resolved_by" text;--> statement-breakpoint
ALTER TABLE "file_presence" ADD CONSTRAINT "file_presence_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_presence" ADD CONSTRAINT "file_presence_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "file_presence_file_idx" ON "file_presence" USING btree ("file_id","seen_at");--> statement-breakpoint
CREATE INDEX "file_presence_seen_idx" ON "file_presence" USING btree ("seen_at");