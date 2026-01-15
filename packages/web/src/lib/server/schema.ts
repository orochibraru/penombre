import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { activity, sharedWith, sharings } from "$lib/server/db/schema";

export const directoryListSchema: z.ZodType<string[]> = z.array(z.string());

// Folder item with metadata for move dialog, etc.
export const folderItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	path: z.string(), // Full path with IDs
});

export const folderListSchema = z.array(folderItemSchema);

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
	// Documents
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/vnd.ms-powerpoint",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"application/vnd.oasis.opendocument.text",
	"application/rtf",
	"application/epub+zip",
	"text/plain",
	"text/csv",
	"text/html",
	"text/css",
	"text/yaml",
	// Images
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/svg+xml",
	"image/bmp",
	"image/x-icon",
	"image/tiff",
	"image/heic",
	// Video
	"video/mp4",
	"video/webm",
	"video/x-msvideo",
	"video/x-matroska",
	"video/quicktime",
	"video/x-ms-wmv",
	"video/x-flv",
	"video/mpeg",
	"video/3gpp",
	"video/ogg",
	// Audio
	"audio/mpeg",
	"audio/wav",
	"audio/flac",
	"audio/aac",
	"audio/ogg",
	"audio/mp4",
	"audio/x-ms-wma",
	"audio/aiff",
	// Code/Data
	"application/json",
	"application/xml",
	"application/javascript",
	// Archives
	"application/zip",
	"application/vnd.rar",
	"application/x-7z-compressed",
	"application/x-tar",
	"application/gzip",
	// Fallback
	"application/octet-stream",
]);

// Date fields can be Date (server-side) or string (JSON serialized)
const dateSchema = z.union([z.date(), z.string()]);

export const fileMetadataSchema = z.object({
	id: z.string(),
	name: z.string().optional(),
	category: fileCategorySchema,
	tags: z.array(z.string()).optional(),
	contentType: fileContentTypeSchema,
	createdAt: dateSchema,
	owner: z.string(),
	isTrashed: z.boolean().default(false),
	isStarred: z.boolean().default(false),
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
	updatedAt: dateSchema.optional(),
	size: z.number().optional(),
	metadata: fileMetadataSchema,
	type: z.enum(["file", "folder"]),
	parent: z.string().optional(), // Display-friendly folder path for recent files
	parentKey: z.string().optional(), // ID-based folder path for navigation
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

export const newFolderSchema = z.object({
	name: z.string(),
	parent: z.string().optional(),
});

export const updateFileSchema = z.object({
	type: z.string().optional(),
	category: fileCategorySchema.optional(),
	tags: z.array(z.string()).optional(),
	key: z.string().optional(),
	contentType: fileContentTypeSchema.optional(),
	isTrashed: z.boolean().optional(),
	isStarred: z.boolean().optional(),
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
export type FolderItem = z.infer<typeof folderItemSchema>;
export type FolderList = z.infer<typeof folderListSchema>;

export type FileCategory = z.infer<typeof fileCategorySchema>;
export type FileContentType = z.infer<typeof fileContentTypeSchema>;
export type FileMetadata = z.infer<typeof fileMetadataSchema>;

export type NewFile = z.infer<typeof newFileSchema>;

export type UpdateFile = z.infer<typeof updateFileSchema>;
export type UploadResult = z.infer<typeof uploadResultSchema>;
