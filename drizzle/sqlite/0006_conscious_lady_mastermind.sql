CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`actor_name` text,
	`resource_name` text,
	`link` text,
	`read_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_userId_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `notifications_readAt_idx` ON `notifications` (`read_at`);--> statement-breakpoint
CREATE INDEX `notifications_createdAt_idx` ON `notifications` (`created_at`);