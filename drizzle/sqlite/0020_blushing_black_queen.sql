-- Two scans racing inserted the same path twice. Keep the oldest row, move
-- everything pointing at the others onto it, then drop them. Rows only: every
-- duplicate names the same bytes.
CREATE TEMP TABLE "folders_dupes" AS
SELECT "id" AS "dup_id", first_value("id") OVER w AS "keep_id", row_number() OVER w AS "rn"
FROM "folders" WHERE "is_trashed" = false
WINDOW w AS (PARTITION BY "owner_id", coalesce("volume_id", ''), "path" ORDER BY "created_at", "id");--> statement-breakpoint
DELETE FROM "folders_dupes" WHERE "rn" = 1;--> statement-breakpoint
UPDATE "folders" SET "is_starred" = true WHERE "id" IN (SELECT "keep_id" FROM "folders_dupes" JOIN "folders" AS "dup" ON "dup"."id" = "folders_dupes"."dup_id" WHERE "dup"."is_starred" = true);--> statement-breakpoint
UPDATE "shares" SET "resource_id" = "folders_dupes"."keep_id" FROM "folders_dupes" WHERE "shares"."resource_type" = 'folder' AND "shares"."resource_id" = "folders_dupes"."dup_id";--> statement-breakpoint
UPDATE "sharings" SET "resource_id" = "folders_dupes"."keep_id" FROM "folders_dupes" WHERE "sharings"."resource_type" = 'folder' AND "sharings"."resource_id" = "folders_dupes"."dup_id";--> statement-breakpoint
UPDATE "files" SET "folder_id" = "folders_dupes"."keep_id" FROM "folders_dupes" WHERE "files"."folder_id" = "folders_dupes"."dup_id";--> statement-breakpoint
UPDATE "folders" SET "parent_id" = "folders_dupes"."keep_id" FROM "folders_dupes" WHERE "folders"."parent_id" = "folders_dupes"."dup_id";--> statement-breakpoint
DELETE FROM "folders" WHERE "id" IN (SELECT "dup_id" FROM "folders_dupes");--> statement-breakpoint
DROP TABLE "folders_dupes";--> statement-breakpoint
-- Two scans racing inserted the same path twice. Keep the oldest row, move
-- everything pointing at the others onto it, then drop them. Rows only: every
-- duplicate names the same bytes.
CREATE TEMP TABLE "files_dupes" AS
SELECT "id" AS "dup_id", first_value("id") OVER w AS "keep_id", row_number() OVER w AS "rn"
FROM "files" WHERE "is_trashed" = false
WINDOW w AS (PARTITION BY "owner_id", coalesce("volume_id", ''), "path" ORDER BY "created_at", "id");--> statement-breakpoint
DELETE FROM "files_dupes" WHERE "rn" = 1;--> statement-breakpoint
UPDATE "files" SET "is_starred" = true WHERE "id" IN (SELECT "keep_id" FROM "files_dupes" JOIN "files" AS "dup" ON "dup"."id" = "files_dupes"."dup_id" WHERE "dup"."is_starred" = true);--> statement-breakpoint
UPDATE "shares" SET "resource_id" = "files_dupes"."keep_id" FROM "files_dupes" WHERE "shares"."resource_type" = 'file' AND "shares"."resource_id" = "files_dupes"."dup_id";--> statement-breakpoint
UPDATE "sharings" SET "resource_id" = "files_dupes"."keep_id" FROM "files_dupes" WHERE "sharings"."resource_type" = 'file' AND "sharings"."resource_id" = "files_dupes"."dup_id";--> statement-breakpoint
UPDATE "file_notes" SET "file_id" = "files_dupes"."keep_id" FROM "files_dupes" WHERE "file_notes"."file_id" = "files_dupes"."dup_id";--> statement-breakpoint
DELETE FROM "files" WHERE "id" IN (SELECT "dup_id" FROM "files_dupes");--> statement-breakpoint
DROP TABLE "files_dupes";--> statement-breakpoint
CREATE UNIQUE INDEX `files_live_path_idx` ON `files` (`owner_id`,coalesce("volume_id", ''),`path`) WHERE is_trashed = 0;--> statement-breakpoint
CREATE UNIQUE INDEX `folders_live_path_idx` ON `folders` (`owner_id`,coalesce("volume_id", ''),`path`) WHERE is_trashed = 0;
