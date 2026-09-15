CREATE TABLE "drive_members" (
	"id" text PRIMARY KEY NOT NULL,
	"drive_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drives" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drive_members" ADD CONSTRAINT "drive_members_drive_id_drives_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."drives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_members" ADD CONSTRAINT "drive_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drives" ADD CONSTRAINT "drives_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "driveMembers_driveId_idx" ON "drive_members" USING btree ("drive_id");--> statement-breakpoint
CREATE INDEX "driveMembers_userId_idx" ON "drive_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "driveMembers_drive_user_idx" ON "drive_members" USING btree ("drive_id","user_id");--> statement-breakpoint
CREATE INDEX "drives_ownerId_idx" ON "drives" USING btree ("owner_id");