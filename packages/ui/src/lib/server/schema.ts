import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { activity, sharedWith, sharings } from "$lib/server/db/schema";

export const directoryListSchema: z.ZodType<string[]> = z.array(z.string());

export const fileCategorySchema = z.enum([
	"MUSIC",
	"DOCUMENTS",
	"IMAGES",
	"VIDEO",
	"RECENT",
	"CODE",
	"UNKNOWN",
]);

export const allowedFileCategories = [
	"MUSIC",
	"DOCUMENTS",
	"IMAGES",
	"VIDEO",
	"RECENT",
	"CODE",
	"UNKNOWN",
];

export const fileContentTypeSchema = z.enum([
	"application/pdf",
	"image/jpeg",
	"image/png",
	"image/gif",
	"video/mp4",
	"audio/mpeg",
	"audio/wav",
	"audio/flac",
	"text/plain",
	"application/zip",
	"application/json",
	"text/html",
	"application/octet-stream",
]);

export const fileMetadataSchema = z.object({
	id: z.string(),
	category: fileCategorySchema,
	tags: z.array(z.string()).optional(),
	contentType: fileContentTypeSchema,
	createdAt: z.date(),
	owner: z.string(),
	isTrashed: z.boolean().default(false),
	music: z
		.object({
			duration: z.number().optional(),
		})
		.optional(),
	video: z
		.object({
			duration: z.number().optional(),
		})
		.optional(),
});

export const objectItemSchema = z.object({
	key: z.string(),
	updatedAt: z.date().optional(),
	size: z.number().optional(),
	metadata: fileMetadataSchema,
	type: z.enum(["file", "folder"]),
});

export const objectListSchema = z.object({
	list: z.array(objectItemSchema),
	count: z.number().default(0),
	total: z.number().default(0),
});

export const newFileSchema = z.object({
	name: z.string(),
	size: z.number(),
});

export const updateFileSchema = z.object({
	type: z.string().optional(),
	category: fileCategorySchema.optional(),
	tags: z.array(z.string()).optional(),
	key: z.string().optional(),
	contentType: fileContentTypeSchema.optional(),
	isTrashed: z.boolean().optional(),
});

export const uploadResultSchema = z.object({
	id: z.string().optional(),
	finalName: z.string(),
	metadata: fileMetadataSchema,
});

export const activitySchema = createSelectSchema(activity);
export const newActivitySchema = createInsertSchema(activity);

export const sharingSchema = createSelectSchema(sharings);
export const newSharingSchema = createInsertSchema(sharings);

export const sharedWithSchema = createSelectSchema(sharedWith);
export const newSharedWithSchema = createInsertSchema(sharedWith);

export type Activity = z.infer<typeof activitySchema>;
export type NewActivity = z.infer<typeof newActivitySchema>;

export type Sharing = z.infer<typeof sharingSchema>;
export type NewSharing = z.infer<typeof newSharingSchema>;
export type SharedWith = z.infer<typeof sharedWithSchema>;
export type NewSharedWith = z.infer<typeof newSharedWithSchema>;

export type ObjectList = z.infer<typeof objectListSchema>;
export type ObjectItem = z.infer<typeof objectItemSchema>;

export type DirectoryList = z.infer<typeof directoryListSchema>;

export type FileCategory = z.infer<typeof fileCategorySchema>;
export type FileContentType = z.infer<typeof fileContentTypeSchema>;
export type FileMetadata = z.infer<typeof fileMetadataSchema>;

export type NewFile = z.infer<typeof newFileSchema>;

export type UpdateFile = z.infer<typeof updateFileSchema>;
export type UploadResult = z.infer<typeof uploadResultSchema>;
