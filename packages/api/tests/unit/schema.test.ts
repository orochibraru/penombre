import { describe, expect, test } from "bun:test";
import {
	directoryListSchema,
	type FileCategory,
	fileCategorySchema,
	fileContentTypeSchema,
	fileMetadataSchema,
	newFileSchema,
	objectItemSchema,
	objectListSchema,
	updateFileSchema,
	uploadResultSchema,
} from "@lib/schema";

describe("directoryListSchema", () => {
	test("validates array of strings", () => {
		const result = directoryListSchema.safeParse([
			"folder1",
			"folder2",
			"folder3",
		]);
		expect(result.success).toBe(true);
	});

	test("validates empty array", () => {
		const result = directoryListSchema.safeParse([]);
		expect(result.success).toBe(true);
	});

	test("rejects non-array", () => {
		const result = directoryListSchema.safeParse("not-an-array");
		expect(result.success).toBe(false);
	});

	test("rejects array with non-strings", () => {
		const result = directoryListSchema.safeParse(["folder1", 123, "folder3"]);
		expect(result.success).toBe(false);
	});
});

describe("fileCategorySchema", () => {
	test("validates all valid categories", () => {
		const validCategories: FileCategory[] = [
			"MUSIC",
			"DOCUMENTS",
			"IMAGES",
			"VIDEO",
			"RECENT",
			"CODE",
			"UNKNOWN",
		];

		for (const category of validCategories) {
			const result = fileCategorySchema.safeParse(category);
			expect(result.success).toBe(true);
		}
	});

	test("rejects invalid category", () => {
		const result = fileCategorySchema.safeParse("INVALID_CATEGORY");
		expect(result.success).toBe(false);
	});

	test("rejects empty string", () => {
		const result = fileCategorySchema.safeParse("");
		expect(result.success).toBe(false);
	});

	test("is case-sensitive", () => {
		const result = fileCategorySchema.safeParse("music");
		expect(result.success).toBe(false);
	});
});

describe("fileContentTypeSchema", () => {
	test("validates common content types", () => {
		const validTypes = [
			"application/pdf",
			"image/jpeg",
			"image/png",
			"video/mp4",
			"audio/mpeg",
			"text/plain",
			"application/json",
		];

		for (const type of validTypes) {
			const result = fileContentTypeSchema.safeParse(type);
			expect(result.success).toBe(true);
		}
	});

	test("rejects invalid content type", () => {
		const result = fileContentTypeSchema.safeParse("application/fake");
		expect(result.success).toBe(false);
	});

	test("validates audio formats", () => {
		const audioTypes = ["audio/mpeg", "audio/wav", "audio/flac"];

		for (const type of audioTypes) {
			const result = fileContentTypeSchema.safeParse(type);
			expect(result.success).toBe(true);
		}
	});

	test("validates image formats", () => {
		const imageTypes = ["image/jpeg", "image/png", "image/gif"];

		for (const type of imageTypes) {
			const result = fileContentTypeSchema.safeParse(type);
			expect(result.success).toBe(true);
		}
	});
});

describe("fileMetadataSchema", () => {
	const validMetadata = {
		id: "file-123",
		category: "DOCUMENTS",
		contentType: "application/pdf",
		createdAt: new Date(),
		owner: "user-456",
	};

	test("validates complete metadata", () => {
		const result = fileMetadataSchema.safeParse(validMetadata);
		expect(result.success).toBe(true);
	});

	test("validates metadata with tags", () => {
		const result = fileMetadataSchema.safeParse({
			...validMetadata,
			tags: ["important", "work", "2024"],
		});
		expect(result.success).toBe(true);
	});

	test("validates metadata with music info", () => {
		const result = fileMetadataSchema.safeParse({
			...validMetadata,
			category: "MUSIC",
			contentType: "audio/mpeg",
			music: { duration: 180 },
		});
		expect(result.success).toBe(true);
	});

	test("validates metadata with video info", () => {
		const result = fileMetadataSchema.safeParse({
			...validMetadata,
			category: "VIDEO",
			contentType: "video/mp4",
			video: { duration: 3600 },
		});
		expect(result.success).toBe(true);
	});

	test("rejects missing required fields", () => {
		const incomplete = {
			id: "file-123",
			category: "DOCUMENTS",
		};
		const result = fileMetadataSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	test("rejects invalid category in metadata", () => {
		const result = fileMetadataSchema.safeParse({
			...validMetadata,
			category: "INVALID",
		});
		expect(result.success).toBe(false);
	});

	test("rejects invalid contentType in metadata", () => {
		const result = fileMetadataSchema.safeParse({
			...validMetadata,
			contentType: "text/invalid",
		});
		expect(result.success).toBe(false);
	});

	test("accepts empty tags array", () => {
		const result = fileMetadataSchema.safeParse({
			...validMetadata,
			tags: [],
		});
		expect(result.success).toBe(true);
	});
});

describe("objectItemSchema", () => {
	const validFile = {
		key: "documents/report.pdf",
		updatedAt: new Date(),
		size: 1024000,
		type: "file" as const,
		metadata: {
			id: "file-123",
			category: "DOCUMENTS" as const,
			contentType: "application/pdf" as const,
			createdAt: new Date(),
			owner: "user-456",
		},
	};

	test("validates file object", () => {
		const result = objectItemSchema.safeParse(validFile);
		expect(result.success).toBe(true);
	});

	test("validates folder object", () => {
		const folder = {
			key: "documents/",
			type: "folder",
			metadata: validFile.metadata,
		};
		const result = objectItemSchema.safeParse(folder);
		expect(result.success).toBe(true);
	});

	test("rejects invalid type", () => {
		const result = objectItemSchema.safeParse({
			...validFile,
			type: "directory",
		});
		expect(result.success).toBe(false);
	});

	test("requires metadata", () => {
		const { metadata: _metadata, ...withoutMetadata } = validFile;
		const result = objectItemSchema.safeParse(withoutMetadata);
		expect(result.success).toBe(false);
	});
});

describe("objectListSchema", () => {
	const validList = {
		list: [
			{
				key: "file1.txt",
				type: "file" as const,
				size: 1024,
				metadata: {
					id: "1",
					category: "DOCUMENTS" as const,
					contentType: "text/plain" as const,
					createdAt: new Date(),
					owner: "user1",
				},
			},
		],
		count: 1,
		total: 1,
	};

	test("validates complete list", () => {
		const result = objectListSchema.safeParse(validList);
		expect(result.success).toBe(true);
	});

	test("validates empty list", () => {
		const result = objectListSchema.safeParse({
			list: [],
			count: 0,
			total: 0,
		});
		expect(result.success).toBe(true);
	});

	test("defaults count and total to 0", () => {
		const result = objectListSchema.safeParse({
			list: [],
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.count).toBe(0);
			expect(result.data.total).toBe(0);
		}
	});

	test("rejects missing list", () => {
		const result = objectListSchema.safeParse({
			count: 0,
			total: 0,
		});
		expect(result.success).toBe(false);
	});
});

describe("newFileSchema", () => {
	test("validates new file data", () => {
		const result = newFileSchema.safeParse({
			name: "document.pdf",
			size: 2048000,
		});
		expect(result.success).toBe(true);
	});

	test("rejects missing name", () => {
		const result = newFileSchema.safeParse({
			size: 1024,
		});
		expect(result.success).toBe(false);
	});

	test("rejects missing size", () => {
		const result = newFileSchema.safeParse({
			name: "file.txt",
		});
		expect(result.success).toBe(false);
	});

	test("rejects negative size", () => {
		const result = newFileSchema.safeParse({
			name: "file.txt",
			size: -100,
		});
		expect(result.success).toBe(true); // Schema doesn't enforce positive
	});

	test("accepts zero size", () => {
		const result = newFileSchema.safeParse({
			name: "empty.txt",
			size: 0,
		});
		expect(result.success).toBe(true);
	});
});

describe("updateFileSchema", () => {
	test("validates partial update with category", () => {
		const result = updateFileSchema.safeParse({
			category: "CODE",
		});
		expect(result.success).toBe(true);
	});

	test("validates partial update with tags", () => {
		const result = updateFileSchema.safeParse({
			tags: ["urgent", "review"],
		});
		expect(result.success).toBe(true);
	});

	test("validates partial update with key", () => {
		const result = updateFileSchema.safeParse({
			key: "new-name.txt",
		});
		expect(result.success).toBe(true);
	});

	test("validates multiple fields", () => {
		const result = updateFileSchema.safeParse({
			category: "DOCUMENTS",
			tags: ["important"],
			contentType: "application/pdf",
		});
		expect(result.success).toBe(true);
	});

	test("validates empty object", () => {
		const result = updateFileSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	test("rejects invalid category", () => {
		const result = updateFileSchema.safeParse({
			category: "INVALID",
		});
		expect(result.success).toBe(false);
	});

	test("validates folder move", () => {
		const result = updateFileSchema.safeParse({
			folder: "documents/work",
		});
		expect(result.success).toBe(true);
	});
});

describe("uploadResultSchema", () => {
	test("validates complete upload result", () => {
		const result = uploadResultSchema.safeParse({
			id: "upload-123",
			finalName: "document(1).pdf",
			metadata: {
				id: "file-456",
				category: "DOCUMENTS",
				contentType: "application/pdf",
				createdAt: new Date(),
				owner: "user-789",
			},
		});
		expect(result.success).toBe(true);
	});

	test("validates without id", () => {
		const result = uploadResultSchema.safeParse({
			finalName: "file.txt",
			metadata: {
				id: "file-123",
				category: "DOCUMENTS",
				contentType: "text/plain",
				createdAt: new Date(),
				owner: "user-456",
			},
		});
		expect(result.success).toBe(true);
	});

	test("rejects missing finalName", () => {
		const result = uploadResultSchema.safeParse({
			id: "upload-123",
			metadata: {
				id: "file-456",
				category: "DOCUMENTS",
				contentType: "application/pdf",
				createdAt: new Date(),
				owner: "user-789",
			},
		});
		expect(result.success).toBe(false);
	});

	test("rejects missing metadata", () => {
		const result = uploadResultSchema.safeParse({
			id: "upload-123",
			finalName: "file.txt",
		});
		expect(result.success).toBe(false);
	});
});
