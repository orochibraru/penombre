CREATE TABLE `file_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`file_id` text NOT NULL,
	`user_id` text NOT NULL,
	`body` text NOT NULL,
	`timestamp_seconds` real,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `file_notes_fileId_idx` ON `file_notes` (`file_id`);--> statement-breakpoint
CREATE INDEX `file_notes_userId_idx` ON `file_notes` (`user_id`);