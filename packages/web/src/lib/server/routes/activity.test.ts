import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { Hono } from "hono";
import type { CustomRouter } from "$lib/server/api-types";
import { ActivityService } from "$lib/server/services/activity";
import { activityRouter } from "./activity";

/**
 * Activity Router unit tests
 *
 * Tests the activity endpoint for retrieving user activity logs.
 */

// Mock activity data
const mockActivities = [
	{
		id: "activity-1",
		userId: "test-user-id",
		action: "create" as const,
		message: "Created file: test.txt",
		link: null,
		level: "info" as const,
		createdAt: new Date(),
	},
	{
		id: "activity-2",
		userId: "test-user-id",
		action: "delete" as const,
		message: "Deleted file: old.txt",
		link: null,
		level: "info" as const,
		createdAt: new Date(),
	},
];

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

// Store original ActivityService prototype methods
let originalGet: typeof ActivityService.prototype.get;

// Create test app with user context
function createTestApp(user: typeof mockUser | null = mockUser) {
	const app = new Hono<CustomRouter>();

	// Inject user into context before router
	app.use("*", async (c, next) => {
		c.set("user", user);
		c.set("session", user ? mockSession : null);
		await next();
	});

	app.route("/activity", activityRouter);

	return app;
}

beforeEach(() => {
	// Save original methods
	originalGet = ActivityService.prototype.get;

	// Mock ActivityService methods by default
	ActivityService.prototype.get = mock(() =>
		Promise.resolve(mockActivities),
	) as typeof ActivityService.prototype.get;
});

afterEach(() => {
	// Restore original methods
	ActivityService.prototype.get = originalGet;
});

describe("Activity Router - Authentication", () => {
	it("should reject unauthenticated requests", async () => {
		const app = createTestApp(null);

		const res = await app.request("/activity");

		expect(res.status).toBe(401);
		const body = await res.text();
		expect(body).toBe("Unauthorized");
	});

	it("should allow authenticated requests", async () => {
		const app = createTestApp();

		const res = await app.request("/activity");

		expect(res.status).toBe(200);
	});
});

describe("GET /activity", () => {
	it("should return user activities", async () => {
		const app = createTestApp();

		const res = await app.request("/activity");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toHaveLength(2);
		expect(body[0].action).toBe("create");
		expect(body[1].action).toBe("delete");
	});

	it("should call ActivityService.get with user id", async () => {
		const getSpy = mock(() =>
			Promise.resolve(mockActivities),
		) as typeof ActivityService.prototype.get;
		ActivityService.prototype.get = getSpy;
		const app = createTestApp();

		await app.request("/activity");

		expect(getSpy).toHaveBeenCalledWith("test-user-id");
	});

	it("should return empty array when no activities", async () => {
		ActivityService.prototype.get = mock(() =>
			Promise.resolve([]),
		) as typeof ActivityService.prototype.get;
		const app = createTestApp();

		const res = await app.request("/activity");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual([]);
	});
});
