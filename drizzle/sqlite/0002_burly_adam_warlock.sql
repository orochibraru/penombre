ALTER TABLE `files` ADD `volume_id` text;--> statement-breakpoint
CREATE INDEX `files_volumeId_idx` ON `files` (`volume_id`);--> statement-breakpoint
ALTER TABLE `folders` ADD `volume_id` text;--> statement-breakpoint
CREATE INDEX `folders_volumeId_idx` ON `folders` (`volume_id`);