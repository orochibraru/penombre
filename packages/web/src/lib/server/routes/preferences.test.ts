import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { Hono } from "hono";
import type { CustomRouter } from "$lib/server/api-types";
import type { UserPreferencesData } from "$lib/server/db/schema";
import preferencesRouter from "./preferences";

/**
 * Preferences Router unit tests
 *
 * Tests the preferences endpoints for getting and updating user preferences.
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

// Default preferences
const defaultPreferences: UserPreferencesData = {
	layout: "list",
	sortColumn: "name",
	sortDirection: "asc",
};

// Mock preferences module
const mockGetUserPreferences = mock(() => Promise.resolve(defaultPreferences));
const mockUpdateUserPreferences = mock(
	(_userId: string, updates: Partial<UserPreferencesData>) =>
		Promise.resolve({ ...defaultPreferences, ...updates }),
);

mock.module("$lib/server/dto/preferences", () => ({
	getUserPreferences: mockGetUserPreferences,
	updateUserPreferences: mockUpdateUserPreferences,
}));

// Create test app with user context
function createTestApp(user: typeof mockUser | null = mockUser) {
	const app = new Hono<CustomRouter>();

	// Inject user into context before router
	app.use("*", async (c, next) => {
		c.set("user", user);
		c.set("session", user ? mockSession : null);
		await next();
	});

	app.route("/preferences", preferencesRouter);

	return app;
}

describe("Preferences Router - Authentication", () => {
	beforeEach(() => {
		mockGetUserPreferences.mockReset();
		mockUpdateUserPreferences.mockReset();
		mockGetUserPreferences.mockResolvedValue(defaultPreferences);
	});

	afterEach(() => {
		mock.restore();
	});

	it("should reject unauthenticated GET requests", async () => {
		const app = createTestApp(null);

		const res = await app.request("/preferences");

		expect(res.status).toBe(401);
		const body = await res.json();
		expect(body.error).toBe("Unauthorized");
	});

	it("should reject unauthenticated PUT requests", async () => {
		const app = createTestApp(null);

		const res = await app.request("/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ layout: "grid" }),
		});

		expect(res.status).toBe(401);
	});

	it("should allow authenticated GET requests", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences");

		expect(res.status).toBe(200);
	});

	it("should allow authenticated PUT requests", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ layout: "grid" }),
		});

		expect(res.status).toBe(200);
	});
});

describe("GET /preferences", () => {
	beforeEach(() => {
		mockGetUserPreferences.mockReset();
		mockGetUserPreferences.mockResolvedValue(defaultPreferences);
	});

	it("should return user preferences", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual(defaultPreferences);
	});

	it("should call getUserPreferences with user id", async () => {
		const app = createTestApp();

		await app.request("/preferences");

		expect(mockGetUserPreferences).toHaveBeenCalledWith("test-user-id");
	});

	it("should return custom preferences when set", async () => {
		const customPrefs: UserPreferencesData = {
			layout: "grid",
			sortColumn: "size",
			sortDirection: "desc",
		};
		mockGetUserPreferences.mockResolvedValue(customPrefs);
		const app = createTestApp();

		const res = await app.request("/preferences");
		const body = await res.json();

		expect(body).toEqual(customPrefs);
	});
});

describe("PUT /preferences", () => {
	beforeEach(() => {
		mockUpdateUserPreferences.mockReset();
		mockUpdateUserPreferences.mockImplementation(
			(_userId: string, updates: Partial<UserPreferencesData>) =>
				Promise.resolve({ ...defaultPreferences, ...updates }),
		);
	});

	it("should update layout preference", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ layout: "grid" }),
		});
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.layout).toBe("grid");
	});

	it("should update sortColumn preference", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sortColumn: "size" }),
		});
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.sortColumn).toBe("size");
	});

	it("should update sortDirection preference", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sortDirection: "desc" }),
		});
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.sortDirection).toBe("desc");
	});

	it("should validate layout values", async () => {
		const app = createTestApp();

		// Invalid layout should not be passed to update
		const res = await app.request("/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ layout: "invalid-layout" }),
		});

		expect(res.status).toBe(200);
		// Invalid value should not be included in updates
		expect(mockUpdateUserPreferences).toHaveBeenCalledWith("test-user-id", {});
	});

	it("should validate sortColumn values", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sortColumn: "invalid-column" }),
		});

		expect(res.status).toBe(200);
		expect(mockUpdateUserPreferences).toHaveBeenCalledWith("test-user-id", {});
	});

	it("should validate sortDirection values", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sortDirection: "invalid" }),
		});

		expect(res.status).toBe(200);
		expect(mockUpdateUserPreferences).toHaveBeenCalledWith("test-user-id", {});
	});

	it("should allow null sortColumn", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sortColumn: null }),
		});

		expect(res.status).toBe(200);
		expect(mockUpdateUserPreferences).toHaveBeenCalledWith("test-user-id", {
			sortColumn: null,
		});
	});

	it("should update multiple preferences at once", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				layout: "grid",
				sortColumn: "updatedAt",
				sortDirection: "desc",
			}),
		});

		expect(res.status).toBe(200);
		expect(mockUpdateUserPreferences).toHaveBeenCalledWith("test-user-id", {
			layout: "grid",
			sortColumn: "updatedAt",
			sortDirection: "desc",
		});
	});
});
