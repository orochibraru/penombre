CREATE TABLE `sidebar_shortcuts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`folder_id` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sidebar_shortcuts_owner_folder_idx` ON `sidebar_shortcuts` (`owner_id`,`folder_id`);