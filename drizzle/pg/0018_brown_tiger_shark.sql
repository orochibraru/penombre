CREATE TABLE "app_instances" (
	"id" text PRIMARY KEY NOT NULL,
	"seen_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "requested_by" text;