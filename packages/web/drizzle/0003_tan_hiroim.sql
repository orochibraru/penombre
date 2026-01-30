CREATE INDEX "activity_userId_idx" ON "activity" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sharedWith_sharingId_idx" ON "shared_with" USING btree ("sharing_id");--> statement-breakpoint
CREATE INDEX "sharedWith_userId_idx" ON "shared_with" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sharings_ownerId_idx" ON "sharings" USING btree ("owner_id");