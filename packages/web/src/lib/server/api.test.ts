import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { Hono } from "hono";

/**
 * API base router unit tests
 *
 * Tests the core API endpoints and middlewares:
 * - Health check endpoint
 * - Session middleware
 * - CORS configuration
 * - Route mounting
 */

// Mock auth module
const mockGetSession = mock(
	() =>
		Promise.resolve(null) as Promise<{
			user: typeof mockUser;
			session: typeof mockSession;
		} | null>,
);
const mockAuthHandler = mock(() => new Response(JSON.stringify({ ok: true })));

mock.module("$lib/server/auth", () => ({
	auth: {
		api: {
			getSession: mockGetSession,
		},
		handler: mockAuthHandler,
	},
}));

// Mock the sub-routers to isolate API tests - but NOT the activity router
// to avoid conflicts with activity.test.ts
mock.module("$lib/server/routes/storage", () => ({
	foldersRouter: new Hono().get("/", (c) => c.json({ mocked: "folders" })),
	objectsRouter: new Hono().get("/", (c) => c.json({ mocked: "objects" })),
}));

// Mock user/session for authenticated tests
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

beforeEach(() => {
	mockGetSession.mockClear();
	mockAuthHandler.mockClear();
	mockGetSession.mockResolvedValue(null);
});

afterEach(() => {
	mockGetSession.mockReset();
	mockAuthHandler.mockReset();
});

describe("API - Health Endpoint", () => {
	it("should return ok status on GET /api/health", async () => {
		const { api } = await import("./api");

		const res = await api.request("/api/health");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.status).toBe("ok");
	});

	it("should return ok status on HEAD /api/health", async () => {
		const { api } = await import("./api");

		const res = await api.request("/api/health", { method: "HEAD" });

		expect(res.status).toBe(200);
	});
});

describe("API - Session Middleware", () => {
	it("should set user to null when no session", async () => {
		mockGetSession.mockResolvedValue(null);
		const { api } = await import("./api");

		const res = await api.request("/api/health");

		expect(res.status).toBe(200);
		expect(mockGetSession).toHaveBeenCalled();
	});

	it("should set user when session exists", async () => {
		mockGetSession.mockResolvedValue({
			user: mockUser,
			session: mockSession,
		});
		const { api } = await import("./api");

		const res = await api.request("/api/health");

		expect(res.status).toBe(200);
		expect(mockGetSession).toHaveBeenCalled();
	});

	it("should pass headers to getSession", async () => {
		const { api } = await import("./api");

		await api.request("/api/health", {
			headers: { Authorization: "Bearer test-token" },
		});

		expect(mockGetSession).toHaveBeenCalled();
		// Access the raw calls array with proper typing
		const calls = mockGetSession.mock.calls as unknown as Array<
			[{ headers: Headers }]
		>;
		expect(calls.length).toBeGreaterThan(0);
		expect(calls[0]?.[0]?.headers).toBeDefined();
	});
});

describe("API - CORS", () => {
	it("should handle OPTIONS preflight for /api/auth/*", async () => {
		const { api } = await import("./api");

		const res = await api.request("/api/auth/test", {
			method: "OPTIONS",
			headers: {
				Origin: "http://localhost:5173",
				"Access-Control-Request-Method": "POST",
			},
		});

		// CORS middleware should respond to OPTIONS
		expect(res.status).toBeLessThan(500);
	});

	it("should include CORS headers for auth routes", async () => {
		const { api } = await import("./api");

		const res = await api.request("/api/auth/test", {
			method: "OPTIONS",
			headers: {
				Origin: "http://localhost:5173",
				"Access-Control-Request-Method": "POST",
			},
		});

		const corsHeader = res.headers.get("Access-Control-Allow-Origin");
		expect(corsHeader).toBe("http://localhost:5173");
	});
});

describe("API - Auth Routes", () => {
	it("should delegate POST /api/auth/* to auth handler", async () => {
		mockAuthHandler.mockReturnValue(
			new Response(JSON.stringify({ handled: true })),
		);
		const { api } = await import("./api");

		await api.request("/api/auth/signin", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "test@test.com" }),
		});

		expect(mockAuthHandler).toHaveBeenCalled();
	});

	it("should delegate GET /api/auth/* to auth handler", async () => {
		mockAuthHandler.mockReturnValue(
			new Response(JSON.stringify({ session: null })),
		);
		const { api } = await import("./api");

		await api.request("/api/auth/session");

		expect(mockAuthHandler).toHaveBeenCalled();
	});
});

describe("API - Route Mounting", () => {
	it("should mount activity router at /api/activity", async () => {
		const { api } = await import("./api");

		const res = await api.request("/api/activity");

		// Without auth, the real activity router returns 401
		// This proves the route is mounted and responding
		expect(res.status).toBe(401);
	});

	it("should mount folders router at /api/storage/folders", async () => {
		const { api } = await import("./api");

		const res = await api.request("/api/storage/folders");

		expect(res.status).toBe(200);
	});

	it("should mount objects router at /api/storage/objects", async () => {
		const { api } = await import("./api");

		const res = await api.request("/api/storage/objects");

		expect(res.status).toBe(200);
	});
});

describe("API - Exports", () => {
	it("should export api instance", async () => {
		const { api } = await import("./api");

		expect(api).toBeDefined();
		expect(typeof api.request).toBe("function");
	});

	it("should export AppType for RPC client", async () => {
		const module = await import("./api");

		// TypeScript type can't be tested at runtime, but module should load
		expect(module).toBeDefined();
	});
});
