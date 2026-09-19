CREATE TABLE `workers` (
	`id` text PRIMARY KEY NOT NULL,
	`seen_at` integer NOT NULL
);
--> statement-breakpoint
DROP INDEX `jobs_dedupe_idx`;--> statement-breakpoint
DROP INDEX `jobs_claim_idx`;--> statement-breakpoint
UPDATE `jobs` SET `status` = 'failed', `error` = 'superseded by a duplicate' WHERE `status` IN ('queued', 'running') AND `dedupe_key` IS NOT NULL AND `id` NOT IN (SELECT min(`id`) FROM `jobs` WHERE `status` IN ('queued', 'running') AND `dedupe_key` IS NOT NULL GROUP BY `dedupe_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `jobs_dedupe_pending_idx` ON `jobs` (`dedupe_key`) WHERE status in ('queued', 'running');--> statement-breakpoint
CREATE INDEX `jobs_claim_idx` ON `jobs` (`status`,"priority" desc,`created_at`);