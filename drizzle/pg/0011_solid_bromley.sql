CREATE TABLE "app_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
