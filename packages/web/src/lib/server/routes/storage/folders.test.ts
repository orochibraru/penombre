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
import { UnauthorizedError } from "$lib/server/errors";
import { StorageService } from "$lib/server/services/storage";
import { foldersRouter } from "./folders";

/**
 * Folders Router unit tests
 *
 * Tests all folder-related API endpoints including:
 * - List folders
 * - Create folder
 * - Get folder
 * - Update folder metadata
 * - Delete folder
 * - Trash/restore operations
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

// Mock folder data - listFolders returns string[]
const mockFolderNames = ["Documents", "Photos"];

// Mock folder path returned by getFolder
const mockFolderPath = "Documents/";

const mockFolderMeta = {
	id: "folder-id",
	owner: "test-user-id",
	isTrashed: false,
	isStarred: false,
	tags: ["work"],
	createdAt: "2024-01-01T00:00:00.000Z",
	category: "UNKNOWN" as const,
	contentType: "application/octet-stream" as const,
};

// Store original StorageService prototype methods
let originalListFolders: typeof StorageService.prototype.listFolders;
let originalCreateFolder: typeof StorageService.prototype.createFolder;
let originalGetFolder: typeof StorageService.prototype.getFolder;
let originalGetFolderMeta: typeof StorageService.prototype.getFolderMeta;
let originalUpdateFolderMeta: typeof StorageService.prototype.updateFolderMeta;
let originalDeleteFolder: typeof StorageService.prototype.deleteFolder;
let originalTrashFolder: typeof StorageService.prototype.trashFolder;
let originalRestoreFolder: typeof StorageService.prototype.restoreFolder;

// Create test app with user context
function createTestApp(user: typeof mockUser | null = mockUser) {
	const app = new Hono<StorageRouter>();

	// Inject user into context before router
	app.use("*", async (c, next) => {
		c.set("user", user);
		c.set("session", user ? mockSession : null);
		await next();
	});

	app.route("/storage/folders", foldersRouter);

	// Add error handler to properly return 401 for UnauthorizedError
	app.onError((err, c) => {
		if (err instanceof UnauthorizedError) {
			return c.json({ message: err.message }, 401);
		}
		return c.json({ message: "Internal Server Error" }, 500);
	});

	return app;
}

beforeEach(() => {
	// Save original methods
	originalListFolders = StorageService.prototype.listFolders;
	originalCreateFolder = StorageService.prototype.createFolder;
	originalGetFolder = StorageService.prototype.getFolder;
	originalGetFolderMeta = StorageService.prototype.getFolderMeta;
	originalUpdateFolderMeta = StorageService.prototype.updateFolderMeta;
	originalDeleteFolder = StorageService.prototype.deleteFolder;
	originalTrashFolder = StorageService.prototype.trashFolder;
	originalRestoreFolder = StorageService.prototype.restoreFolder;

	// Mock all StorageService methods by default
	StorageService.prototype.listFolders = mock(() =>
		Promise.resolve(mockFolderNames),
	);
	StorageService.prototype.createFolder = mock(() => Promise.resolve());
	StorageService.prototype.getFolder = mock(() =>
		Promise.resolve(mockFolderPath),
	);
	StorageService.prototype.getFolderMeta = mock(() =>
		Promise.resolve(mockFolderMeta),
	);
	StorageService.prototype.updateFolderMeta = mock(() => Promise.resolve());
	StorageService.prototype.deleteFolder = mock(() => Promise.resolve());
	StorageService.prototype.trashFolder = mock(() => Promise.resolve());
	StorageService.prototype.restoreFolder = mock(() => Promise.resolve());
});

afterEach(() => {
	// Restore original methods
	StorageService.prototype.listFolders = originalListFolders;
	StorageService.prototype.createFolder = originalCreateFolder;
	StorageService.prototype.getFolder = originalGetFolder;
	StorageService.prototype.getFolderMeta = originalGetFolderMeta;
	StorageService.prototype.updateFolderMeta = originalUpdateFolderMeta;
	StorageService.prototype.deleteFolder = originalDeleteFolder;
	StorageService.prototype.trashFolder = originalTrashFolder;
	StorageService.prototype.restoreFolder = originalRestoreFolder;
});

describe("Folders Router - Authentication", () => {
	it("should reject unauthenticated requests", async () => {
		const app = createTestApp(null);

		const res = await app.request("/storage/folders");

		expect(res.status).toBe(401);
	});

	it("should allow authenticated requests", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/folders");

		expect(res.status).toBe(200);
	});
});

describe("GET /storage/folders", () => {
	it("should list folders", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/folders");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual(mockFolderNames);
	});

	it("should call listFolders with includeTrashed: false", async () => {
		const app = createTestApp();
		const listFoldersSpy = spyOn(
			StorageService.prototype,
			"listFolders",
		).mockResolvedValue(mockFolderNames);

		await app.request("/storage/folders");

		expect(listFoldersSpy).toHaveBeenCalledWith("", { includeTrashed: false });
	});

	it("should return 500 on error", async () => {
		const app = createTestApp();
		StorageService.prototype.listFolders = mock(() =>
			Promise.reject(new Error("DB error")),
		);

		const res = await app.request("/storage/folders");

		expect(res.status).toBe(500);
		const body = await res.json();
		expect(body.message).toBe("Internal Server Error");
	});
});

describe("GET /storage/folders/trash", () => {
	it("should list trashed folders", async () => {
		const app = createTestApp();
		const trashedFolders = ["OldDocs", "DeletedPhotos"];
		StorageService.prototype.listFolders = mock(() =>
			Promise.resolve(trashedFolders),
		);

		const res = await app.request("/storage/folders/trash");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual(trashedFolders);
	});

	it("should call listFolders with onlyTrashed: true", async () => {
		const app = createTestApp();
		const listFoldersSpy = spyOn(
			StorageService.prototype,
			"listFolders",
		).mockResolvedValue([]);

		await app.request("/storage/folders/trash");

		expect(listFoldersSpy).toHaveBeenCalledWith("", { onlyTrashed: true });
	});

	it("should return 500 on error", async () => {
		const app = createTestApp();
		StorageService.prototype.listFolders = mock(() =>
			Promise.reject(new Error("DB error")),
		);

		const res = await app.request("/storage/folders/trash");

		expect(res.status).toBe(500);
	});
});

describe("POST /storage/folders", () => {
	it("should create a folder", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/folders", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "NewFolder" }),
		});
		const body = await res.json();

		expect(res.status).toBe(201);
		expect(body.message).toBe("Folder created successfully.");
	});

	it("should create a folder with parent", async () => {
		const app = createTestApp();
		const createFolderSpy = spyOn(
			StorageService.prototype,
			"createFolder",
		).mockResolvedValue();

		const res = await app.request("/storage/folders", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "SubFolder", parent: "Documents" }),
		});

		expect(res.status).toBe(201);
		expect(createFolderSpy).toHaveBeenCalledWith("SubFolder", "Documents");
	});

	it("should reject invalid request body", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/folders", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({}), // Missing name
		});

		expect(res.status).toBe(400);
	});

	it("should return 500 on error", async () => {
		const app = createTestApp();
		StorageService.prototype.createFolder = mock(() =>
			Promise.reject(new Error("FS error")),
		);

		const res = await app.request("/storage/folders", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "NewFolder" }),
		});

		expect(res.status).toBe(500);
	});
});

describe("GET /storage/folders/folder/:folder", () => {
	it("should get a folder", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/folders/folder/Documents");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual(mockFolderPath);
	});

	it("should decode URL-encoded folder names", async () => {
		const app = createTestApp();
		const getFolderSpy = spyOn(
			StorageService.prototype,
			"getFolder",
		).mockResolvedValue("My Documents/");

		await app.request("/storage/folders/folder/My%20Documents");

		expect(getFolderSpy).toHaveBeenCalledWith("My Documents");
	});

	it("should return 500 on error", async () => {
		const app = createTestApp();
		StorageService.prototype.getFolder = mock(() =>
			Promise.reject(new Error("Not found")),
		);

		const res = await app.request("/storage/folders/folder/NonExistent");

		expect(res.status).toBe(500);
	});
});

describe("GET /storage/folders/folder/:folder/meta", () => {
	it("should get folder metadata", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/folders/folder/Documents/meta");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual(mockFolderMeta);
	});

	it("should get folder metadata with parent", async () => {
		const app = createTestApp();
		const getFolderMetaSpy = spyOn(
			StorageService.prototype,
			"getFolderMeta",
		).mockResolvedValue(mockFolderMeta);

		await app.request(
			"/storage/folders/folder/SubFolder/meta?parent=Documents",
		);

		expect(getFolderMetaSpy).toHaveBeenCalledWith("Documents/SubFolder/");
	});

	it("should return 404 when folder not found", async () => {
		const app = createTestApp();
		StorageService.prototype.getFolderMeta = mock(() => Promise.resolve(null));

		const res = await app.request("/storage/folders/folder/NonExistent/meta");

		expect(res.status).toBe(404);
		const body = await res.json();
		expect(body.message).toBe("Folder not found");
	});

	it("should return 500 on error", async () => {
		const app = createTestApp();
		StorageService.prototype.getFolderMeta = mock(() =>
			Promise.reject(new Error("FS error")),
		);

		const res = await app.request("/storage/folders/folder/Documents/meta");

		expect(res.status).toBe(500);
	});
});

describe("PUT /storage/folders/folder/:folder", () => {
	it("should update folder metadata", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/folders/folder/Documents", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ tags: ["important"] }),
		});
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.message).toBe("Folder metadata updated.");
	});

	it("should update folder with parent query param", async () => {
		const app = createTestApp();
		const updateFolderMetaSpy = spyOn(
			StorageService.prototype,
			"updateFolderMeta",
		).mockResolvedValue();

		await app.request("/storage/folders/folder/SubFolder", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ isTrashed: true, parentFolderId: "Documents" }),
		});

		expect(updateFolderMetaSpy).toHaveBeenCalledWith("Documents/SubFolder/", {
			isTrashed: true,
			parentFolderId: "Documents",
		});
	});

	it("should update isTrashed flag", async () => {
		const app = createTestApp();
		const updateFolderMetaSpy = spyOn(
			StorageService.prototype,
			"updateFolderMeta",
		).mockResolvedValue();

		await app.request("/storage/folders/folder/Documents", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ isTrashed: true }),
		});

		expect(updateFolderMetaSpy).toHaveBeenCalled();
	});

	it("should return 500 on error", async () => {
		const app = createTestApp();
		StorageService.prototype.updateFolderMeta = mock(() =>
			Promise.reject(new Error("FS error")),
		);

		const res = await app.request("/storage/folders/folder/Documents", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ tags: ["test"] }),
		});

		expect(res.status).toBe(500);
	});
});

describe("DELETE /storage/folders/folder/:folder", () => {
	it("should delete a folder", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/folders/folder/OldFolder", {
			method: "DELETE",
		});
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.message).toBe("Folder permanently deleted.");
	});

	it("should delete folder with parent query param", async () => {
		const app = createTestApp();
		const deleteFolderSpy = spyOn(
			StorageService.prototype,
			"deleteFolder",
		).mockResolvedValue();

		await app.request("/storage/folders/folder/SubFolder", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ parentFolderId: "Documents" }),
		});

		expect(deleteFolderSpy).toHaveBeenCalledWith("Documents/SubFolder/");
	});

	it("should return 500 on error", async () => {
		const app = createTestApp();
		StorageService.prototype.deleteFolder = mock(() =>
			Promise.reject(new Error("FS error")),
		);

		const res = await app.request("/storage/folders/folder/Documents", {
			method: "DELETE",
		});

		expect(res.status).toBe(500);
	});
});

describe("POST /storage/folders/folder/:folder/trash", () => {
	it("should trash a folder", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/folders/folder/Documents/trash", {
			method: "POST",
		});
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.message).toBe("Folder moved to trash.");
	});

	it("should trash folder with parent query param", async () => {
		const app = createTestApp();
		const trashFolderSpy = spyOn(
			StorageService.prototype,
			"trashFolder",
		).mockResolvedValue();

		await app.request("/storage/folders/folder/SubFolder/trash", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ parentFolderId: "Documents" }),
		});

		expect(trashFolderSpy).toHaveBeenCalledWith("Documents/SubFolder/");
	});

	it("should return 500 on error", async () => {
		const app = createTestApp();
		StorageService.prototype.trashFolder = mock(() =>
			Promise.reject(new Error("FS error")),
		);

		const res = await app.request("/storage/folders/folder/Documents/trash", {
			method: "POST",
		});

		expect(res.status).toBe(500);
	});
});

describe("POST /storage/folders/folder/:folder/restore", () => {
	it("should restore a trashed folder", async () => {
		const app = createTestApp();

		const res = await app.request("/storage/folders/folder/Documents/restore", {
			method: "POST",
		});
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.message).toBe("Folder restored from trash.");
	});

	it("should restore folder with parent query param", async () => {
		const app = createTestApp();
		const restoreFolderSpy = spyOn(
			StorageService.prototype,
			"restoreFolder",
		).mockResolvedValue();

		await app.request("/storage/folders/folder/SubFolder/restore", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ parentFolderId: "Documents" }),
		});

		expect(restoreFolderSpy).toHaveBeenCalledWith("Documents/SubFolder/");
	});

	it("should return 500 on error", async () => {
		const app = createTestApp();
		StorageService.prototype.restoreFolder = mock(() =>
			Promise.reject(new Error("FS error")),
		);

		const res = await app.request("/storage/folders/folder/Documents/restore", {
			method: "POST",
		});

		expect(res.status).toBe(500);
	});
});
