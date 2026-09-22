-- Orphaned notes (their file already deleted, back when nothing cascaded
-- this) would otherwise silently violate the new constraint below.
DELETE FROM `file_notes` WHERE `file_id` NOT IN (SELECT `id` FROM `files`);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_file_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`file_id` text NOT NULL,
	`user_id` text NOT NULL,
	`body` text NOT NULL,
	`timestamp_seconds` real,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_file_notes`("id", "file_id", "user_id", "body", "timestamp_seconds", "created_at", "updated_at") SELECT "id", "file_id", "user_id", "body", "timestamp_seconds", "created_at", "updated_at" FROM `file_notes`;--> statement-breakpoint
DROP TABLE `file_notes`;--> statement-breakpoint
ALTER TABLE `__new_file_notes` RENAME TO `file_notes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `file_notes_fileId_idx` ON `file_notes` (`file_id`);--> statement-breakpoint
CREATE INDEX `file_notes_userId_idx` ON `file_notes` (`user_id`);