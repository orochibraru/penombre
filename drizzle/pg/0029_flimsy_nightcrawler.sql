CREATE TABLE "file_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"file_id" text NOT NULL,
	"seq" integer NOT NULL,
	"size" bigint DEFAULT 0 NOT NULL,
	"content_type" text DEFAULT 'application/octet-stream' NOT NULL,
	"created_by" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "folders" ADD COLUMN "settings" jsonb;--> statement-breakpoint
ALTER TABLE "file_versions" ADD CONSTRAINT "file_versions_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_versions" ADD CONSTRAINT "file_versions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "file_versions_file_seq_idx" ON "file_versions" USING btree ("file_id","seq");