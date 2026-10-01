CREATE TABLE `file_presence` (
	`id` text PRIMARY KEY NOT NULL,
	`file_id` text NOT NULL,
	`user_id` text NOT NULL,
	`mode` text NOT NULL,
	`seen_at` integer NOT NULL,
	FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `file_presence_file_idx` ON `file_presence` (`file_id`,`seen_at`);--> statement-breakpoint
CREATE INDEX `file_presence_seen_idx` ON `file_presence` (`seen_at`);--> statement-breakpoint
ALTER TABLE `file_notes` ADD `anchor` text;--> statement-breakpoint
ALTER TABLE `file_notes` ADD `parent_id` text;--> statement-breakpoint
ALTER TABLE `file_notes` ADD `resolved_at` integer;--> statement-breakpoint
ALTER TABLE `file_notes` ADD `resolved_by` text;