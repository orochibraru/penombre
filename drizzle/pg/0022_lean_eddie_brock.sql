-- Orphaned notes (their file already deleted, back when nothing cascaded
-- this) would otherwise fail the new constraint below.
DELETE FROM "file_notes" n WHERE NOT EXISTS (SELECT 1 FROM "files" f WHERE f."id" = n."file_id");
--> statement-breakpoint
ALTER TABLE "file_notes" ADD CONSTRAINT "file_notes_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;