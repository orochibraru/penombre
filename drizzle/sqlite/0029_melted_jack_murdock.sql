CREATE TABLE `signature_events` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`signer_id` text,
	`type` text NOT NULL,
	`actor` text,
	`detail` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `signature_requests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `signature_events_request_idx` ON `signature_events` (`request_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `signature_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`file_id` text,
	`document_name` text NOT NULL,
	`message` text,
	`sequential` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`document_hash` text NOT NULL,
	`page_count` integer NOT NULL,
	`signed_hash` text,
	`expires_at` integer NOT NULL,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `signature_requests_owner_idx` ON `signature_requests` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `signature_requests_file_idx` ON `signature_requests` (`file_id`);--> statement-breakpoint
CREATE TABLE `signature_signers` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`position` integer NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`user_id` text,
	`token_hash` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`signature` text,
	`decline_reason` text,
	`ip_address` text,
	`user_agent` text,
	`time_zone` text,
	`viewed_at` integer,
	`responded_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `signature_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `signature_signers_token_hash_unique` ON `signature_signers` (`token_hash`);--> statement-breakpoint
CREATE INDEX `signature_signers_request_idx` ON `signature_signers` (`request_id`);--> statement-breakpoint
CREATE INDEX `signature_signers_user_idx` ON `signature_signers` (`user_id`);