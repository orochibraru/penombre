CREATE TABLE `app_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`settings` text DEFAULT '{}',
	`updated_at` integer NOT NULL
);
