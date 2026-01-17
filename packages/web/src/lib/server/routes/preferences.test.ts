import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import type { CustomRouter } from "$lib/server/api-types";
import { db } from "$lib/server/db";
import type { UserPreferencesData } from "$lib/server/db/schema";
import { user, userPreferences } from "$lib/server/db/schema";
import preferencesRouter from "./preferences";

/**
 * Preferences Router integration tests
 *
 * Tests the preferences endpoints with real database.
 */

// Mock user for authenticated requests
const mockUser = {
	id: "test-prefs-router-user",
	name: "Test User",
	email: "test-router@example.com",
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
	userId: mockUser.id,
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
	beforeEach(async () => {
		// Create test user in DB
		await db
			.insert(user)
			.values({
				id: mockUser.id,
				email: mockUser.email,
				emailVerified: mockUser.emailVerified,
				name: mockUser.name,
			})
			.onConflictDoNothing();

		// Clean up any existing preferences
		await db
			.delete(userPreferences)
			.where(eq(userPreferences.userId, mockUser.id));
	});

	afterEach(async () => {
		// Clean up
		await db
			.delete(userPreferences)
			.where(eq(userPreferences.userId, mockUser.id));
		await db.delete(user).where(eq(user.id, mockUser.id));
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
	beforeEach(async () => {
		await db
			.insert(user)
			.values({
				id: mockUser.id,
				email: mockUser.email,
				emailVerified: mockUser.emailVerified,
				name: mockUser.name,
			})
			.onConflictDoNothing();

		await db
			.delete(userPreferences)
			.where(eq(userPreferences.userId, mockUser.id));
	});

	afterEach(async () => {
		await db
			.delete(userPreferences)
			.where(eq(userPreferences.userId, mockUser.id));
		await db.delete(user).where(eq(user.id, mockUser.id));
	});

	it("should return user preferences", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual(defaultPreferences);
	});

	it("should return custom preferences when set", async () => {
		const customPrefs: UserPreferencesData = {
			layout: "grid",
			sortColumn: "size",
			sortDirection: "desc",
		};
		await db.insert(userPreferences).values({
			userId: mockUser.id,
			preferences: customPrefs,
		});

		const app = createTestApp();

		const res = await app.request("/preferences");
		const body = await res.json();

		expect(body).toEqual(customPrefs);
	});
});

describe("PUT /preferences", () => {
	beforeEach(async () => {
		await db
			.insert(user)
			.values({
				id: mockUser.id,
				email: mockUser.email,
				emailVerified: mockUser.emailVerified,
				name: mockUser.name,
			})
			.onConflictDoNothing();

		await db
			.delete(userPreferences)
			.where(eq(userPreferences.userId, mockUser.id));
	});

	afterEach(async () => {
		await db
			.delete(userPreferences)
			.where(eq(userPreferences.userId, mockUser.id));
		await db.delete(user).where(eq(user.id, mockUser.id));
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
		const body = await res.json();
		// Invalid value should not change layout - should remain default
		expect(body.layout).toBe("list");
	});

	it("should validate sortColumn values", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sortColumn: "invalid-column" }),
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		// Invalid value should not change sortColumn - should remain default
		expect(body.sortColumn).toBe("name");
	});

	it("should validate sortDirection values", async () => {
		const app = createTestApp();

		const res = await app.request("/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sortDirection: "invalid" }),
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		// Invalid value should not change sortDirection - should remain default
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
				sortColumn: "updatedAt",
				sortDirection: "desc",
			}),
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toEqual({
			layout: "grid",
			sortColumn: "updatedAt",
			sortDirection: "desc",
		});
	});
});
