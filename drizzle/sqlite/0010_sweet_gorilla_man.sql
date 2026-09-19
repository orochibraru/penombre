CREATE TABLE `app_instances` (
	`id` text PRIMARY KEY NOT NULL,
	`seen_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `jobs` ADD `requested_by` text;