ALTER TABLE "files" ADD COLUMN "volume_id" text;--> statement-breakpoint
ALTER TABLE "folders" ADD COLUMN "volume_id" text;--> statement-breakpoint
CREATE INDEX "files_volumeId_idx" ON "files" USING btree ("volume_id");--> statement-breakpoint
CREATE INDEX "folders_volumeId_idx" ON "folders" USING btree ("volume_id");