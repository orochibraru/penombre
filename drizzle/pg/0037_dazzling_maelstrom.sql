CREATE TABLE "signature_events" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"signer_id" text,
	"type" text NOT NULL,
	"actor" text,
	"detail" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signature_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"file_id" text,
	"document_name" text NOT NULL,
	"message" text,
	"sequential" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"document_hash" text NOT NULL,
	"page_count" integer NOT NULL,
	"signed_hash" text,
	"expires_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signature_signers" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"user_id" text,
	"token_hash" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"signature" text,
	"decline_reason" text,
	"ip_address" text,
	"user_agent" text,
	"time_zone" text,
	"viewed_at" timestamp,
	"responded_at" timestamp,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "signature_signers_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "signature_events" ADD CONSTRAINT "signature_events_request_id_signature_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."signature_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_requests" ADD CONSTRAINT "signature_requests_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_requests" ADD CONSTRAINT "signature_requests_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_signers" ADD CONSTRAINT "signature_signers_request_id_signature_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."signature_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_signers" ADD CONSTRAINT "signature_signers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "signature_events_request_idx" ON "signature_events" USING btree ("request_id","created_at");--> statement-breakpoint
CREATE INDEX "signature_requests_owner_idx" ON "signature_requests" USING btree ("owner_id","created_at");--> statement-breakpoint
CREATE INDEX "signature_requests_file_idx" ON "signature_requests" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "signature_signers_request_idx" ON "signature_signers" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "signature_signers_user_idx" ON "signature_signers" USING btree ("user_id");