CREATE TABLE "shares" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"owner_id" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"resource_name" text NOT NULL,
	"password_hash" text,
	"requires_auth" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"download_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "shares_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shares_ownerId_idx" ON "shares" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "shares_token_idx" ON "shares" USING btree ("token");