CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"spec" text NOT NULL,
	"result" text,
	"error" text,
	"dedupe_key" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"worker_id" text,
	"heartbeat_at" bigint,
	"created_at" bigint NOT NULL,
	"started_at" bigint,
	"finished_at" bigint
);
--> statement-breakpoint
CREATE INDEX "jobs_claim_idx" ON "jobs" USING btree ("status","priority","created_at");--> statement-breakpoint
CREATE INDEX "jobs_dedupe_idx" ON "jobs" USING btree ("dedupe_key");