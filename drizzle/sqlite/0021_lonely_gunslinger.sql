CREATE TABLE `file_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`file_id` text NOT NULL,
	`seq` integer NOT NULL,
	`size` integer DEFAULT 0 NOT NULL,
	`content_type` text DEFAULT 'application/octet-stream' NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `file_versions_file_seq_idx` ON `file_versions` (`file_id`,`seq`);--> statement-breakpoint
ALTER TABLE `folders` ADD `settings` text;