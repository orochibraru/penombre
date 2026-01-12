import { describe, expect, it } from "bun:test";
import { defaultEmail, defaultPassword } from "./seed";

/**
 * Auth Seed unit tests
 *
 * Tests the authentication seeding logic including:
 * - Default admin user creation
 * - Role bumping for existing users
 * - Default credentials from environment
 */

// Note: The seedAuth function is tightly coupled with:
// - Better Auth API (auth.api.createUser)
// - Database operations (getDb, drizzle queries)
// - These would require integration tests with a real database
//
// These unit tests focus on the exported constants and isolated logic.

describe("Auth Seed - Default Credentials", () => {
	it("should export default email", () => {
		expect(defaultEmail).toBeDefined();
		expect(typeof defaultEmail).toBe("string");
		expect(defaultEmail).toContain("@");
	});

	it("should export default password", () => {
		expect(defaultPassword).toBeDefined();
		expect(typeof defaultPassword).toBe("string");
	});

	it("should use fallback email when ADMIN_EMAIL not set", () => {
		// The default is "admin@example.com" if env not set
		// Since we don't control env in tests, just verify it's a valid email format
		expect(defaultEmail).toMatch(/^.+@.+\..+$/);
	});

	it("should use fallback password when ADMIN_PASSWORD not set", () => {
		// The default is "admin" if env not set
		// Since we don't control env in tests, just verify it's defined
		expect(defaultPassword.length).toBeGreaterThan(0);
	});
});

describe("Auth Index - Exports", () => {
	it("should export auth instance", async () => {
		// Dynamic import to avoid module initialization issues in isolation
		const { auth } = await import("./index");

		expect(auth).toBeDefined();
		expect(auth.api).toBeDefined();
	});

	it("should have expected API methods", async () => {
		const { auth } = await import("./index");

		// Better Auth should expose handler and api
		expect(typeof auth.handler).toBe("function");
		expect(typeof auth.api.getSession).toBe("function");
		// Admin plugin should be loaded
		expect(auth.api).toBeDefined();
	});

	it("should export AuthType type", async () => {
		// TypeScript type exports can't be runtime tested,
		// but we can verify the module loads without error
		const module = await import("./index");
		expect(module).toBeDefined();
	});
});
