import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Hono } from "hono";
import type { CustomRouter } from "$lib/server/api-types";
import type { UserPreferencesData } from "$lib/server/db/schema";

/**
 * Preferences Router unit tests
 *
 * Tests the preferences API endpoints for GET and PUT operations.
 * Uses mocks to avoid database dependencies.
 */

// Default preferences
const defaultPreferences: UserPreferencesData = {
	layout: "list",
	sortColumn: "name",
	sortDirection: "asc",
};

// Mocked preferences state - this simulates the DB
let mockedPreferences: UserPreferencesData = { ...defaultPreferences };

// Mock the preferences service module BEFORE importing the router
// This is critical for ESM module mocking to work
mock.module("$lib/server/services/preferences", () => ({
	getUserPreferences: (_userId: string) =>
		Promise.resolve({ ...mockedPreferences }),
	updateUserPreferences: (
		_userId: string,
		updates: Partial<UserPreferencesData>,
	) => {
		mockedPreferences = { ...mockedPreferences, ...updates };
		return Promise.resolve({ ...mockedPreferences });
	},
}));

// Import router AFTER mocking - critical for module mocking to work
const preferencesRouterModule = await import("./preferences");
const preferencesRouter = preferencesRouterModule.default;

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

beforeEach(() => {
	// Reset preferences state before each test
	mockedPreferences = { ...defaultPreferences };
});

describe("Preferences Router - Authentication", () => {
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
	it("should return user preferences", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences");

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.layout).toBe("list");
		expect(body.sortColumn).toBe("name");
		expect(body.sortDirection).toBe("asc");
	});

	it("should return custom preferences when set", async () => {
		// Set custom preferences in mock state
		mockedPreferences = {
			layout: "grid",
			sortColumn: "size",
			sortDirection: "desc",
		};

		const app = createTestApp();

		const res = await app.request("/preferences");

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.layout).toBe("grid");
		expect(body.sortColumn).toBe("size");
		expect(body.sortDirection).toBe("desc");
	});
});

describe("PUT /preferences", () => {
	it("should update layout preference", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ layout: "grid" }),
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.layout).toBe("grid");
		// Other preferences should remain unchanged
		expect(body.sortColumn).toBe("name");
		expect(body.sortDirection).toBe("asc");
	});

	it("should update sortColumn preference", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sortColumn: "updatedAt" }),
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.sortColumn).toBe("updatedAt");
	});

	it("should update sortDirection preference", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sortDirection: "desc" }),
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.sortDirection).toBe("desc");
	});

	it("should ignore invalid layout values", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ layout: "invalid" }),
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		// Should keep the default since invalid was rejected
		expect(body.layout).toBe("list");
	});

	it("should ignore invalid sortColumn values", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sortColumn: "invalid" }),
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		// Should keep the default since invalid was rejected
		expect(body.sortColumn).toBe("name");
	});

	it("should ignore invalid sortDirection values", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sortDirection: "invalid" }),
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		// Should keep the default since invalid was rejected
		expect(body.sortDirection).toBe("asc");
	});

	it("should allow null sortColumn", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sortColumn: null }),
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.sortColumn).toBe(null);
	});

	it("should update multiple preferences at once", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				layout: "grid",
				sortColumn: "size",
				sortDirection: "desc",
			}),
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.layout).toBe("grid");
		expect(body.sortColumn).toBe("size");
		expect(body.sortDirection).toBe("desc");
	});
});
