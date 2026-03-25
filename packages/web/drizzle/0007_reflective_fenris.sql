ALTER TABLE "apikey" ADD CONSTRAINT "apikey_reference_id_user_id_fk" FOREIGN KEY ("reference_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_createdAt_idx" ON "activity" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sharings_resourceId_idx" ON "sharings" USING btree ("resource_id");