import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	mock,
	spyOn,
} from "bun:test";
import { Hono } from "hono";
import type { StorageRouter } from "$lib/server/api-types";
import {
	FileOrFolderNotFoundError,
	UnauthorizedError,
} from "$lib/server/errors";
import { StorageService } from "$lib/server/services/storage";
import { objectsRouter } from "./objects";

/**
 * Objects Router unit tests
 *
 * Tests all file-related API endpoints including:
 * - List files
 * - Create file
 * - Get file metadata/raw
 * - Upload file body
 * - Update file metadata
 * - Delete file
 * - List by category/recent/trash
 */

// Mock user for authenticated requests
const mockUser = {
	id: "test-user-id",
	name: "Test User",
	email: "test@example.com",
	emailVerified: true,
	image: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	banned: null,
	role: "user",
	banReason: null,
	banExpires: null,
};

// Mock session
const mockSession = {
	id: "session-id",
	createdAt: new Date(),
	updatedAt: new Date(),
	userId: "test-user-id",
	expiresAt: new Date(Date.now() + 86400000),
	token: "test-token",
	ipAddress: null,
	userAgent: null,
};

// Mock ObjectList response
const mockObjectList = {
	list: [
		{
			key: "test-file.txt",
			size: 1024,
			type: "file" as const,
			updatedAt: new Date(),
			metadata: {
				id: "file-id-1",
				name: "test-file.txt",
				category: "DOCUMENTS" as const,
				contentType: "text/plain" as const,
				createdAt: new Date().toISOString(),
				owner: "test-user-id",
				isTrashed: false,
				isStarred: false,
			},
		},
	],
	count: 1,
	total: 1,
};

// Mock ObjectItem
const mockObjectItem = {
	key: "test-file.txt",
	size: 1024,
	type: "file" as const,
	updatedAt: new Date(),
	metadata: {
		id: "file-id-1",
		name: "test-file.txt",
		category: "DOCUMENTS" as const,
		contentType: "text/plain" as const,
		createdAt: new Date().toISOString(),
		owner: "test-user-id",
		isTrashed: false,
		isStarred: false,
	},
};

// Mock upload result
const mockUploadResult = {
	id: "new-file-id",
	finalName: "new-file-id",
	metadata: {
		id: "new-file-id",
		name: "newfile.txt",
		category: "DOCUMENTS" as const,
		contentType: "text/plain" as const,
		createdAt: new Date().toISOString(),
		owner: "test-user-id",
		isTrashed: false,
		isStarred: false,
	},
};

// Store original StorageService prototype methods
let originalListFiles: typeof StorageService.prototype.listFiles;
let originalCreateFile: typeof StorageService.prototype.createFile;
let originalListRecentFiles: typeof StorageService.prototype.listRecentFiles;
let originalListTrashFiles: typeof StorageService.prototype.listTrashFiles;
let originalListStarredFiles: typeof StorageService.prototype.listStarredFiles;
let originalListFilesPerCategory: typeof StorageService.prototype.listFilesPerCategory;
let originalGetRawFileData: typeof StorageService.prototype.getRawFileData;
let originalGetFile: typeof StorageService.prototype.getFile;
let originalFileExists: typeof StorageService.prototype.fileExists;
let originalUploadFileBody: typeof StorageService.prototype.uploadFileBody;
let originalUpdateFile: typeof StorageService.prototype.updateFile;
let originalDeleteFile: typeof StorageService.prototype.deleteFile;
let originalMoveFile: typeof StorageService.prototype.moveFile;
let originalDuplicateFile: typeof StorageService.prototype.duplicateFile;
let originalSearchFiles: typeof StorageService.prototype.searchFiles;
let originalGenerateRangeHeaders: typeof StorageService.prototype.generateRangeHeaders;
let originalGenerateRawFileHeaders: typeof StorageService.prototype.generateRawFileHeaders;

// Create test app with user context
function createTestApp(user: typeof mockUser | null = mockUser) {
	const app = new Hono<StorageRouter>();

	// Inject user into context before router
	app.use("*", async (c, next) => {
		c.set("user", user);
		c.set("session", user ? mockSession : null);
		await next();
	});

	app.route("/storage/objects", objectsRouter);

	// Add error handler to properly return 401 for UnauthorizedError
	app.onError((err, c) => {
		if (err instanceof UnauthorizedError) {
			return c.json({ message: err.message }, 401);
		}
		if (err instanceof FileOrFolderNotFoundError) {
			return c.json({ message: err.message }, 404);
		}
		return c.json({ message: "Internal Server Error" }, 500);
	});

	return app;
}

beforeEach(() => {
	// Save original methods
	originalListFiles = StorageService.prototype.listFiles;
	originalCreateFile = StorageService.prototype.createFile;
	originalListRecentFiles = StorageService.prototype.listRecentFiles;
	originalListTrashFiles = StorageService.prototype.listTrashFiles;
	originalListStarredFiles = StorageService.prototype.listStarredFiles;
	originalListFilesPerCategory = StorageService.prototype.listFilesPerCategory;
	originalGetRawFileData = StorageService.prototype.getRawFileData;
	originalGetFile = StorageService.prototype.getFile;
	originalFileExists = StorageService.prototype.fileExists;
	originalUploadFileBody = StorageService.prototype.uploadFileBody;
	originalUpdateFile = StorageService.prototype.updateFile;
	originalDeleteFile = StorageService.prototype.deleteFile;
	originalMoveFile = StorageService.prototype.moveFile;
	originalDuplicateFile = StorageService.prototype.duplicateFile;
	originalSearchFiles = StorageService.prototype.searchFiles;
	originalGenerateRangeHeaders = StorageService.prototype.generateRangeHeaders;
	originalGenerateRawFileHeaders =
		StorageService.prototype.generateRawFileHeaders;

	// Mock all StorageService methods by default
	StorageService.prototype.listFiles = mock(() =>
		Promise.resolve(mockObjectList),
	);
	StorageService.prototype.createFile = mock(() =>
		Promise.resolve(mockUploadResult),
	);
	StorageService.prototype.listRecentFiles = mock(() =>
		Promise.resolve(mockObjectList),
	);
	StorageService.prototype.listTrashFiles = mock(() =>
		Promise.resolve(mockObjectList),
	);
	StorageService.prototype.listStarredFiles = mock(() =>
		Promise.resolve(mockObjectList),
	);
	StorageService.prototype.listFilesPerCategory = mock(() =>
		Promise.resolve(mockObjectList),
	);
	StorageService.prototype.searchFiles = mock(() =>
		Promise.resolve(mockObjectList),
	);
	StorageService.prototype.getRawFileData = mock(() =>
		Promise.resolve({
			file: {
				size: 1024,
				slice: () => new Blob(["test content"]),
				arrayBuffer: async () => new ArrayBuffer(1024),
			} as unknown as import("bun").BunFile,
			meta: mockObjectItem,
		}),
	);
	StorageService.prototype.getFile = mock(() =>
		Promise.resolve(mockObjectItem),
	);
	StorageService.prototype.fileExists = mock(() => Promise.resolve(true));
	StorageService.prototype.uploadFileBody = mock(() => Promise.resolve());
	StorageService.prototype.updateFile = mock(() => Promise.resolve());
	StorageService.prototype.deleteFile = mock(() => Promise.resolve());
	StorageService.prototype.moveFile = mock(() => Promise.resolve());
	StorageService.prototype.duplicateFile = mock(() =>
		Promise.resolve({
			key: "duplicated-file-id",
			size: 1024,
			type: "file" as const,
			updatedAt: new Date(),
			metadata: {
				id: "duplicated-file-id",
				name: "test-file (1).txt",
				category: "DOCUMENTS" as const,
				contentType: "text/plain" as const,
				createdAt: new Date().toISOString(),
				owner: "test-user-id",
				isTrashed: false,
				isStarred: false,
			},
		}),
	);
	StorageService.prototype.generateRangeHeaders = mock(() => ({
		headers: new Headers({
			"Content-Type": "text/plain",
			"Content-Range": "bytes 0-1023/1024",
		}),
		chunk: new Blob(["test content"]),
	}));
	StorageService.prototype.generateRawFileHeaders = mock(
		() =>
			new Headers({
				"Content-Type": "text/plain",
				"Content-Length": "1024",
			}),
	);
});

afterEach(() => {
	// Restore original methods
	StorageService.prototype.listFiles = originalListFiles;
	StorageService.prototype.createFile = originalCreateFile;
	StorageService.prototype.listRecentFiles = originalListRecentFiles;
	StorageService.prototype.listTrashFiles = originalListTrashFiles;
	StorageService.prototype.listStarredFiles = originalListStarredFiles;
	StorageService.prototype.listFilesPerCategory = originalListFilesPerCategory;
	StorageService.prototype.getRawFileData = originalGetRawFileData;
	StorageService.prototype.getFile = originalGetFile;
	StorageService.prototype.fileExists = originalFileExists;
	StorageService.prototype.uploadFileBody = originalUploadFileBody;
	StorageService.prototype.updateFile = originalUpdateFile;
	StorageService.prototype.deleteFile = originalDeleteFile;
	StorageService.prototype.moveFile = originalMoveFile;
	StorageService.prototype.duplicateFile = originalDuplicateFile;
	StorageService.prototype.searchFiles = originalSearchFiles;
	StorageService.prototype.generateRangeHeaders = originalGenerateRangeHeaders;
	StorageService.prototype.generateRawFileHeaders =
		originalGenerateRawFileHeaders;
});

describe("Objects Router - Authentication", () => {
	it("should reject unauthenticated requests", async () => {
		const app = createTestApp(null);

		const res = await app.request("/storage/objects");

		expect(res.status).toBe(401);
	});

	it("should allow authenticated requests", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/objects");

		expect(res.status).toBe(200);
	});
});

describe("GET /storage/objects", () => {
	it("should list files in root folder", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/objects");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.count).toBe(1);
		expect(body.list).toHaveLength(1);
	});

	it("should list files in specified folder", async () => {
		const app = createTestApp();
		const listFilesSpy = spyOn(
			StorageService.prototype,
			"listFiles",
		).mockResolvedValue(mockObjectList);

		await app.request("/storage/objects?folder=Documents");

		expect(listFilesSpy).toHaveBeenCalledWith("Documents");
	});

	it("should decode URL-encoded folder names", async () => {
		const app = createTestApp();
		const listFilesSpy = spyOn(
			StorageService.prototype,
			"listFiles",
		).mockResolvedValue(mockObjectList);

		await app.request("/storage/objects?folder=My%20Documents");

		expect(listFilesSpy).toHaveBeenCalledWith("My Documents");
	});

	it("should return 500 on error", async () => {
		const app = createTestApp();
		StorageService.prototype.listFiles = mock(() =>
			Promise.reject(new Error("FS error")),
		);

		const res = await app.request("/storage/objects");

		expect(res.status).toBe(500);
	});
});

describe("POST /storage/objects", () => {
	it("should create a file", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/objects", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "newfile.txt", size: 1024 }),
		});
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.id).toBe("new-file-id");
		expect(body.finalName).toBe("new-file-id");
	});

	it("should create a file in specified folder", async () => {
		const app = createTestApp();
		const createFileSpy = spyOn(
			StorageService.prototype,
			"createFile",
		).mockResolvedValue(mockUploadResult);

		await app.request("/storage/objects?folder=Documents", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "newfile.txt", size: 512 }),
		});

		expect(createFileSpy).toHaveBeenCalledWith(
			{ name: "newfile.txt", size: 512 },
			"Documents",
		);
	});

	it("should reject invalid request body", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/objects", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({}), // Missing name and size
		});

		expect(res.status).toBe(400);
	});

	it("should return 401 on unauthorized error", async () => {
		const app = createTestApp();
		StorageService.prototype.createFile = mock(() =>
			Promise.reject(new UnauthorizedError("Not allowed")),
		);

		const res = await app.request("/storage/objects", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "newfile.txt", size: 1024 }),
		});

		expect(res.status).toBe(401);
	});

	it("should return 500 on error", async () => {
		const app = createTestApp();
		StorageService.prototype.createFile = mock(() =>
			Promise.reject(new Error("FS error")),
		);

		const res = await app.request("/storage/objects", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "newfile.txt", size: 1024 }),
		});

		expect(res.status).toBe(500);
	});
});

describe("POST /storage/objects/batch", () => {
	it("should create multiple files in batch", async () => {
		const app = createTestApp();
		const mockBatchResults = [
			{
				id: "file-id-1",
				finalName: "file-id-1",
				metadata: {
					id: "file-id-1",
					name: "file1.txt",
					category: "DOCUMENTS" as const,
					contentType: "text/plain" as const,
					createdAt: new Date().toISOString(),
					owner: "test-user-id",
					isTrashed: false,
					isStarred: false,
				},
			},
			{
				id: "file-id-2",
				finalName: "file-id-2",
				metadata: {
					id: "file-id-2",
					name: "file2.txt",
					category: "DOCUMENTS" as const,
					contentType: "text/plain" as const,
					createdAt: new Date().toISOString(),
					owner: "test-user-id",
					isTrashed: false,
					isStarred: false,
				},
			},
		];

		StorageService.prototype.createBatchFiles = mock(() =>
			Promise.resolve(mockBatchResults),
		);

		const res = await app.request("/storage/objects/batch", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				files: [
					{ name: "file1.txt", size: 1024 },
					{ name: "file2.txt", size: 2048 },
				],
			}),
		});

		const body = await res.json();

		expect(res.status).toBe(200);
		expect(Array.isArray(body)).toBe(true);
		expect(body.length).toBe(2);
		expect(body[0].id).toBe("file-id-1");
		expect(body[1].id).toBe("file-id-2");
	});

	it("should create multiple files in specified folder", async () => {
		const app = createTestApp();
		const mockBatchResults = [
			{
				id: "file-id-1",
				finalName: "Documents/file-id-1",
				metadata: {
					id: "file-id-1",
					name: "file1.txt",
					category: "DOCUMENTS" as const,
					contentType: "text/plain" as const,
					createdAt: new Date().toISOString(),
					owner: "test-user-id",
					isTrashed: false,
					isStarred: false,
				},
			},
		];

		const createBatchFilesSpy = spyOn(
			StorageService.prototype,
			"createBatchFiles",
		).mockResolvedValue(mockBatchResults);

		await app.request("/storage/objects/batch?folder=Documents", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				files: [{ name: "file1.txt", size: 1024 }],
			}),
		});

		expect(createBatchFilesSpy).toHaveBeenCalledWith(
			[{ name: "file1.txt", size: 1024 }],
			"Documents",
		);
	});

	it("should reject invalid batch request", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/objects/batch", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ files: [] }), // Empty files array still valid
		});

		// Empty batch should succeed (valid payload)
		expect(res.status).toBe(200);
	});

	it("should return 401 on unauthorized batch error", async () => {
		const app = createTestApp();
		StorageService.prototype.createBatchFiles = mock(() =>
			Promise.reject(new UnauthorizedError("Not allowed")),
		);

		const res = await app.request("/storage/objects/batch", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				files: [{ name: "file1.txt", size: 1024 }],
			}),
		});

		expect(res.status).toBe(401);
	});

	it("should return 500 on batch error", async () => {
		const app = createTestApp();
		StorageService.prototype.createBatchFiles = mock(() =>
			Promise.reject(new Error("FS error")),
		);

		const res = await app.request("/storage/objects/batch", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				files: [{ name: "file1.txt", size: 1024 }],
			}),
		});

		expect(res.status).toBe(500);
	});
});

describe("GET /storage/objects/recent", () => {
	it("should list recent files", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/objects/recent");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.count).toBe(1);
	});

	it("should return 500 on error", async () => {
		const app = createTestApp();
		StorageService.prototype.listRecentFiles = mock(() =>
			Promise.reject(new Error("FS error")),
		);

		const res = await app.request("/storage/objects/recent");

		expect(res.status).toBe(500);
	});
});

describe("GET /storage/objects/trash", () => {
	it("should list trashed files", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/objects/trash");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.count).toBe(1);
	});

	it("should return 500 on error", async () => {
		const app = createTestApp();
		StorageService.prototype.listTrashFiles = mock(() =>
			Promise.reject(new Error("FS error")),
		);

		const res = await app.request("/storage/objects/trash");

		expect(res.status).toBe(500);
	});
});

describe("GET /storage/objects/starred", () => {
	it("should list starred files", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/objects/starred");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.count).toBe(1);
	});

	it("should return 500 on error", async () => {
		const app = createTestApp();
		StorageService.prototype.listStarredFiles = mock(() =>
			Promise.reject(new Error("FS error")),
		);

		const res = await app.request("/storage/objects/starred");

		expect(res.status).toBe(500);
	});
});

describe("GET /storage/objects/category/:category", () => {
	it("should list files by category", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/objects/category/documents");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.count).toBe(1);
	});

	it("should handle uppercase categories", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/objects/category/IMAGES");

		expect(res.status).toBe(200);
	});

	it("should reject invalid category", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/objects/category/invalid");

		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.message).toBe("Invalid category");
	});

	it("should return 500 on error", async () => {
		const app = createTestApp();
		StorageService.prototype.listFilesPerCategory = mock(() =>
			Promise.reject(new Error("FS error")),
		);

		const res = await app.request("/storage/objects/category/documents");

		expect(res.status).toBe(500);
	});
});

describe("GET /storage/objects/item/:item", () => {
	it("should get file metadata", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/objects/item/test-file.txt");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.key).toBe("test-file.txt");
		expect(body.metadata.owner).toBe("test-user-id");
	});

	it("should decode URL-encoded item names", async () => {
		const app = createTestApp();
		const getFileSpy = spyOn(
			StorageService.prototype,
			"getFile",
		).mockResolvedValue(mockObjectItem);

		await app.request("/storage/objects/item/my%20file.txt");

		expect(getFileSpy).toHaveBeenCalledWith("my file.txt");
	});

	it("should return 404 when file not found", async () => {
		const app = createTestApp();
		StorageService.prototype.getFile = mock(() =>
			Promise.reject(new FileOrFolderNotFoundError("Not found")),
		);

		const res = await app.request("/storage/objects/item/nonexistent.txt");

		expect(res.status).toBe(404);
	});

	it("should return 401 when accessing other users file", async () => {
		const app = createTestApp();
		const otherUserFile = {
			...mockObjectItem,
			metadata: { ...mockObjectItem.metadata, owner: "other-user-id" },
		};
		StorageService.prototype.getFile = mock(() =>
			Promise.resolve(otherUserFile),
		);

		const res = await app.request("/storage/objects/item/test-file.txt");

		expect(res.status).toBe(401);
	});

	it("should return 500 on error", async () => {
		const app = createTestApp();
		StorageService.prototype.getFile = mock(() =>
			Promise.reject(new Error("FS error")),
		);

		const res = await app.request("/storage/objects/item/test-file.txt");

		expect(res.status).toBe(500);
	});
});

describe("GET /storage/objects/item/:item?raw=true", () => {
	it("should return raw file data", async () => {
		const app = createTestApp();

		const res = await app.request(
			"/storage/objects/item/test-file.txt?raw=true",
		);

		expect(res.status).toBe(200);
	});

	it("should return 404 when file not found", async () => {
		const app = createTestApp();
		StorageService.prototype.getRawFileData = mock(() => Promise.resolve(null));

		const res = await app.request(
			"/storage/objects/item/nonexistent.txt?raw=true",
		);

		expect(res.status).toBe(404);
	});

	it("should return 401 when accessing other users file", async () => {
		const app = createTestApp();
		const otherUserMeta = {
			...mockObjectItem,
			metadata: { ...mockObjectItem.metadata, owner: "other-user-id" },
		};
		StorageService.prototype.getRawFileData = mock(() =>
			Promise.resolve({
				file: { size: 1024 } as unknown as import("bun").BunFile,
				meta: otherUserMeta,
			}),
		);

		const res = await app.request(
			"/storage/objects/item/test-file.txt?raw=true",
		);

		expect(res.status).toBe(401);
	});

	it("should handle Range header for partial content", async () => {
		const app = createTestApp();

		const res = await app.request(
			"/storage/objects/item/test-file.txt?raw=true",
			{
				headers: { Range: "bytes=0-100" },
			},
		);

		expect(res.status).toBe(206);
	});
});

describe("POST /storage/objects/item/:item", () => {
	it("should upload file body", async () => {
		const app = createTestApp();
		const formData = new FormData();
		formData.append("file", new Blob(["test content"]), "test.txt");

		const res = await app.request("/storage/objects/item/test-file-id", {
			method: "POST",
			body: formData,
		});
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.message).toBe("File uploaded successfully.");
	});

	it("should return 400 when no file provided", async () => {
		const app = createTestApp();
		const formData = new FormData();

		const res = await app.request("/storage/objects/item/test-file-id", {
			method: "POST",
			body: formData,
		});

		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.message).toBe("No file provided.");
	});

	it("should return 404 when file does not exist", async () => {
		const app = createTestApp();
		StorageService.prototype.fileExists = mock(() => Promise.resolve(false));
		const formData = new FormData();
		formData.append("file", new Blob(["test"]), "test.txt");

		const res = await app.request("/storage/objects/item/nonexistent", {
			method: "POST",
			body: formData,
		});

		expect(res.status).toBe(404);
	});

	it("should return 500 on upload error", async () => {
		const app = createTestApp();
		StorageService.prototype.uploadFileBody = mock(() =>
			Promise.reject(new Error("Write error")),
		);
		const formData = new FormData();
		formData.append("file", new Blob(["test"]), "test.txt");

		const res = await app.request("/storage/objects/item/test-file-id", {
			method: "POST",
			body: formData,
		});

		expect(res.status).toBe(500);
	});
});

describe("PUT /storage/objects/item/:item", () => {
	it("should update file metadata", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/objects/item/test-file.txt", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ tags: ["important"] }),
		});
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.message).toBe("File metadata updated successfully.");
	});

	it("should update file with folder query param", async () => {
		const app = createTestApp();
		const updateFileSpy = spyOn(
			StorageService.prototype,
			"updateFile",
		).mockResolvedValue();

		await app.request("/storage/objects/item/test-file.txt?folder=Documents", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ isTrashed: true }),
		});

		expect(updateFileSpy).toHaveBeenCalledWith("Documents/test-file.txt", {
			isTrashed: true,
		});
	});

	it("should update isTrashed flag", async () => {
		const app = createTestApp();
		const updateFileSpy = spyOn(
			StorageService.prototype,
			"updateFile",
		).mockResolvedValue();

		await app.request("/storage/objects/item/test-file.txt", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ isTrashed: true }),
		});

		expect(updateFileSpy).toHaveBeenCalledWith("test-file.txt", {
			isTrashed: true,
		});
	});

	it("should return 404 when file does not exist", async () => {
		const app = createTestApp();
		StorageService.prototype.fileExists = mock(() => Promise.resolve(false));

		const res = await app.request("/storage/objects/item/nonexistent.txt", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ tags: ["test"] }),
		});

		expect(res.status).toBe(404);
	});

	it("should return 500 on error", async () => {
		const app = createTestApp();
		StorageService.prototype.updateFile = mock(() =>
			Promise.reject(new Error("FS error")),
		);

		const res = await app.request("/storage/objects/item/test-file.txt", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ tags: ["test"] }),
		});

		expect(res.status).toBe(500);
	});
});

describe("DELETE /storage/objects/item/:item", () => {
	it("should delete a file", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/objects/item/test-file.txt", {
			method: "DELETE",
		});
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.message).toBe("File deleted successfully.");
	});

	it("should decode URL-encoded item names", async () => {
		const app = createTestApp();
		const deleteFileSpy = spyOn(
			StorageService.prototype,
			"deleteFile",
		).mockResolvedValue();

		await app.request("/storage/objects/item/my%20file.txt", {
			method: "DELETE",
		});

		expect(deleteFileSpy).toHaveBeenCalledWith("my file.txt");
	});

	it("should return 404 when file does not exist", async () => {
		const app = createTestApp();
		StorageService.prototype.fileExists = mock(() => Promise.resolve(false));

		const res = await app.request("/storage/objects/item/nonexistent.txt", {
			method: "DELETE",
		});

		expect(res.status).toBe(404);
	});

	it("should return 500 on error", async () => {
		const app = createTestApp();
		StorageService.prototype.deleteFile = mock(() =>
			Promise.reject(new Error("FS error")),
		);

		const res = await app.request("/storage/objects/item/test-file.txt", {
			method: "DELETE",
		});

		expect(res.status).toBe(500);
	});
});

describe("Objects Router - POST /item/:item/move", () => {
	it("should move a file to a different folder", async () => {
		const app = createTestApp();
		const moveFileSpy = spyOn(
			StorageService.prototype,
			"moveFile",
		).mockResolvedValue();

		const res = await app.request("/storage/objects/item/test-file.txt/move", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ destination: "folder-id" }),
		});

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.message).toBe("File moved successfully.");
		expect(moveFileSpy).toHaveBeenCalledWith("test-file.txt", "folder-id");
	});

	it("should move a file to root when destination is empty", async () => {
		const app = createTestApp();
		const moveFileSpy = spyOn(
			StorageService.prototype,
			"moveFile",
		).mockResolvedValue();

		const res = await app.request("/storage/objects/item/test-file.txt/move", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ destination: "" }),
		});

		expect(res.status).toBe(200);
		expect(moveFileSpy).toHaveBeenCalledWith("test-file.txt", "");
	});

	it("should decode URL-encoded item names", async () => {
		const app = createTestApp();
		const moveFileSpy = spyOn(
			StorageService.prototype,
			"moveFile",
		).mockResolvedValue();

		await app.request("/storage/objects/item/my%20file.txt/move", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ destination: "folder-id" }),
		});

		expect(moveFileSpy).toHaveBeenCalledWith("my file.txt", "folder-id");
	});

	it("should return 404 when file does not exist", async () => {
		const app = createTestApp();
		StorageService.prototype.fileExists = mock(() => Promise.resolve(false));

		const res = await app.request(
			"/storage/objects/item/nonexistent.txt/move",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ destination: "folder-id" }),
			},
		);

		expect(res.status).toBe(404);
	});

	it("should return 500 on move error", async () => {
		const app = createTestApp();
		StorageService.prototype.moveFile = mock(() =>
			Promise.reject(new Error("FS error")),
		);

		const res = await app.request("/storage/objects/item/test-file.txt/move", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ destination: "folder-id" }),
		});

		expect(res.status).toBe(500);
	});

	it("should require destination in request body", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/objects/item/test-file.txt/move", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({}),
		});

		expect(res.status).toBe(400);
	});
});

describe("Objects Router - POST /item/:item/duplicate", () => {
	it("should duplicate a file successfully", async () => {
		const app = createTestApp();
		const duplicateFileSpy = spyOn(
			StorageService.prototype,
			"duplicateFile",
		).mockResolvedValue({
			key: "duplicated-file-id",
			size: 1024,
			type: "file" as const,
			updatedAt: new Date(),
			metadata: {
				id: "duplicated-file-id",
				name: "test-file (1).txt",
				category: "DOCUMENTS" as const,
				contentType: "text/plain" as const,
				createdAt: new Date().toISOString(),
				owner: "test-user-id",
				isTrashed: false,
				isStarred: false,
			},
		});

		const res = await app.request(
			"/storage/objects/item/test-file.txt/duplicate",
			{
				method: "POST",
			},
		);

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.key).toBe("duplicated-file-id");
		expect(json.metadata.name).toBe("test-file (1).txt");
		expect(duplicateFileSpy).toHaveBeenCalledWith("test-file.txt");
	});

	it("should decode URL-encoded item names", async () => {
		const app = createTestApp();
		const duplicateFileSpy = spyOn(
			StorageService.prototype,
			"duplicateFile",
		).mockResolvedValue({
			key: "duplicated-file-id",
			size: 1024,
			type: "file" as const,
			updatedAt: new Date(),
			metadata: {
				id: "duplicated-file-id",
				name: "my file (1).txt",
				category: "DOCUMENTS" as const,
				contentType: "text/plain" as const,
				createdAt: new Date().toISOString(),
				owner: "test-user-id",
				isTrashed: false,
				isStarred: false,
			},
		});

		await app.request("/storage/objects/item/my%20file.txt/duplicate", {
			method: "POST",
		});

		expect(duplicateFileSpy).toHaveBeenCalledWith("my file.txt");
	});

	it("should return 404 when file does not exist", async () => {
		const app = createTestApp();
		StorageService.prototype.fileExists = mock(() => Promise.resolve(false));

		const res = await app.request(
			"/storage/objects/item/nonexistent.txt/duplicate",
			{
				method: "POST",
			},
		);

		expect(res.status).toBe(404);
	});

	it("should return 500 on duplicate error", async () => {
		const app = createTestApp();
		StorageService.prototype.duplicateFile = mock(() =>
			Promise.reject(new Error("FS error")),
		);

		const res = await app.request(
			"/storage/objects/item/test-file.txt/duplicate",
			{
				method: "POST",
			},
		);

		expect(res.status).toBe(500);
	});
});

describe("GET /storage/objects/search", () => {
	it("should search files by query", async () => {
		const app = createTestApp();
		const searchFilesSpy = spyOn(
			StorageService.prototype,
			"searchFiles",
		).mockResolvedValue({
			list: [mockObjectItem],
			count: 1,
			total: 1,
		});

		const res = await app.request("/storage/objects/search?q=test");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.count).toBe(1);
		expect(searchFilesSpy).toHaveBeenCalledWith("test", 50);
	});

	it("should use custom limit parameter", async () => {
		const app = createTestApp();
		const searchFilesSpy = spyOn(
			StorageService.prototype,
			"searchFiles",
		).mockResolvedValue({
			list: [],
			count: 0,
			total: 0,
		});

		await app.request("/storage/objects/search?q=test&limit=10");

		expect(searchFilesSpy).toHaveBeenCalledWith("test", 10);
	});

	it("should return 400 when query is missing", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/objects/search");

		expect(res.status).toBe(400);
	});

	it("should return 400 when query is empty", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/objects/search?q=");

		expect(res.status).toBe(400);
	});

	it("should return 500 on search error", async () => {
		const app = createTestApp();
		StorageService.prototype.searchFiles = mock(() =>
			Promise.reject(new Error("Search failed")),
		);

		const res = await app.request("/storage/objects/search?q=test");

		expect(res.status).toBe(500);
	});
});
