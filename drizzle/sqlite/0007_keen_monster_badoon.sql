CREATE TABLE `drive_members` (
	`id` text PRIMARY KEY NOT NULL,
	`drive_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`drive_id`) REFERENCES `drives`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `driveMembers_driveId_idx` ON `drive_members` (`drive_id`);--> statement-breakpoint
CREATE INDEX `driveMembers_userId_idx` ON `drive_members` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `driveMembers_drive_user_idx` ON `drive_members` (`drive_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `drives` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `drives_ownerId_idx` ON `drives` (`owner_id`);