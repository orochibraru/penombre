DROP INDEX "files_category_name_idx";--> statement-breakpoint
CREATE INDEX "files_folder_listing_idx" ON "files" USING btree ("owner_id","folder_id","is_trashed","updated_at");--> statement-breakpoint
CREATE INDEX "files_folder_name_idx" ON "files" USING btree ("owner_id","folder_id","is_trashed",lower("name"));--> statement-breakpoint
CREATE INDEX "files_folder_size_idx" ON "files" USING btree ("owner_id","folder_id","is_trashed","size");--> statement-breakpoint
CREATE INDEX "files_starred_idx" ON "files" USING btree ("owner_id","is_starred","is_trashed");--> statement-breakpoint
CREATE INDEX "folders_listing_idx" ON "folders" USING btree ("owner_id","parent_id","is_trashed","updated_at");--> statement-breakpoint
CREATE INDEX "folders_name_idx" ON "folders" USING btree ("owner_id","parent_id","is_trashed",lower("name"));--> statement-breakpoint
CREATE INDEX "folders_starred_idx" ON "folders" USING btree ("owner_id","is_starred","is_trashed");--> statement-breakpoint
CREATE INDEX "files_category_name_idx" ON "files" USING btree ("owner_id","category","is_trashed",lower("name"));