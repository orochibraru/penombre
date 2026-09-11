CREATE TABLE `shares` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`owner_id` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text NOT NULL,
	`resource_name` text NOT NULL,
	`password_hash` text,
	`requires_auth` integer DEFAULT false NOT NULL,
	`expires_at` integer,
	`download_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shares_token_unique` ON `shares` (`token`);--> statement-breakpoint
CREATE INDEX `shares_ownerId_idx` ON `shares` (`owner_id`);--> statement-breakpoint
CREATE INDEX `shares_token_idx` ON `shares` (`token`);