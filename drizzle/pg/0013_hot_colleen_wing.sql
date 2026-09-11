CREATE TABLE "file_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"file_id" text NOT NULL,
	"user_id" text NOT NULL,
	"body" text NOT NULL,
	"timestamp_seconds" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "file_notes" ADD CONSTRAINT "file_notes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "file_notes_fileId_idx" ON "file_notes" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "file_notes_userId_idx" ON "file_notes" USING btree ("user_id");