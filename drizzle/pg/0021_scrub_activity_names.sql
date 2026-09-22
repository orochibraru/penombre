-- files.ts/folders.ts used to write file and folder names into
-- activity.message ("Created file: foo.pdf", "Moved folder \"x\" to y",
-- "Created 3 files in Documents"), which the admin audit log renders to
-- every admin. Messages are name-free now; this scrubs rows written before
-- that fix. Every old template carried a name behind a colon or a quote, or
-- (the file-upload-count message) the word "in" after "file"; none of the
-- new name-free templates or trash's own "Emptied the trash: N item(s)" do.
UPDATE "activity"
SET "message" = CASE "action"
	WHEN 'create' THEN 'Created an item'
	WHEN 'update' THEN 'Updated an item'
	WHEN 'delete' THEN 'Deleted an item'
	ELSE 'Activity recorded'
END
WHERE "message" IS NOT NULL
	AND (
		("message" LIKE '%:%' AND "message" NOT LIKE 'Emptied the trash:%')
		OR "message" LIKE '%"%'
		OR "message" LIKE 'Created%file%in%'
	);
