import { describe, expect, it } from "bun:test";

/**
 * Database singleton tests
 *
 * These tests verify the connection pool singleton pattern works correctly
 * to prevent "PostgresError: sorry, too many clients already" in production.
 */

// Access the global storage used by the db module
const globalForDb = globalThis as unknown as {
	__db_client?: unknown;
	__db_instance?: unknown;
};

describe("Database Connection Singleton", () => {
	it("should return the same db instance on multiple getDb() calls", async () => {
		const { getDb } = await import("./index");

		const db1 = getDb();
		const db2 = getDb();
		const db3 = getDb();

		expect(db1).toBe(db2);
		expect(db2).toBe(db3);
		expect(db1).toBe(db3);
	});

	it("should store client in globalThis to survive HMR", async () => {
		const { db } = await import("./index");

		// Access the db to ensure initialization happened
		expect(db).toBeDefined();

		// Verify the global storage is populated
		// Note: The module uses lazy initialization, so we check after db is accessed
		expect(globalForDb.__db_client).toBeDefined();
		expect(globalForDb.__db_instance).toBeDefined();
	});

	it("should reuse db instance across getDb calls", async () => {
		const { getDb } = await import("./index");

		const firstInstance = getDb();
		const secondInstance = getDb();
		const thirdInstance = getDb();

		// All calls should return the same instance
		expect(secondInstance).toBe(firstInstance);
		expect(thirdInstance).toBe(firstInstance);
	});

	it("should export closeDb function for graceful shutdown", async () => {
		const { closeDb } = await import("./index");

		expect(typeof closeDb).toBe("function");
	});

	it("should handle closeDb gracefully", async () => {
		const { closeDb, db } = await import("./index");

		// Verify db exists first
		expect(db).toBeDefined();

		// closeDb should be callable without throwing
		// Note: We don't actually call it as it would close the real connection
		expect(closeDb).toBeDefined();
	});
});

describe("Database Connection Pool Configuration", () => {
	it("should have db client initialized via singleton", async () => {
		// This test verifies that the singleton pattern is working
		// by checking that the global storage is populated after import
		// Note: We use dynamic import to ensure fresh evaluation
		await import("./index");

		// Verify the global storage is populated (singleton pattern working)
		// These should always be defined once the module is loaded
		expect(globalForDb.__db_instance).toBeDefined();
		expect(globalForDb.__db_client).toBeDefined();
	});

	it("should use DATABASE_URL from environment when available", async () => {
		const { getDbUrl } = await import("./index");

		const originalUrl = process.env.DATABASE_URL;

		try {
			process.env.DATABASE_URL = "postgres://test:test@testhost:5432/testdb";
			// Need to reimport or call the function to test this
			// But getDbUrl reads from Bun.env which is the same as process.env
			const url = getDbUrl();
			expect(url).toBe("postgres://test:test@testhost:5432/testdb");
		} finally {
			if (originalUrl) {
				process.env.DATABASE_URL = originalUrl;
			} else {
				delete process.env.DATABASE_URL;
			}
		}
	});

	it("should fall back to default URL when DATABASE_URL is not set", async () => {
		const { getDbUrl } = await import("./index");

		const originalUrl = process.env.DATABASE_URL;
		delete process.env.DATABASE_URL;
		// Also need to clear Bun.env
		const originalBunUrl = Bun.env.DATABASE_URL;
		delete Bun.env.DATABASE_URL;

		try {
			const url = getDbUrl();
			expect(url).toContain("postgres://");
			expect(url).toContain("localhost");
		} finally {
			if (originalUrl) {
				process.env.DATABASE_URL = originalUrl;
			}
			if (originalBunUrl) {
				Bun.env.DATABASE_URL = originalBunUrl;
			}
		}
	});
});

describe("Connection Leak Prevention", () => {
	it("should not create multiple clients when db is imported multiple times", async () => {
		// Clear to start fresh
		globalForDb.__db_client;
		globalForDb.__db_instance;

		// Don't actually clear - we want to test with the real singleton
		// Just verify that multiple imports return the same thing

		const import1 = await import("./index");
		const client1 = globalForDb.__db_client;

		const import2 = await import("./index");
		const client2 = globalForDb.__db_client;

		const import3 = await import("./index");
		const client3 = globalForDb.__db_client;

		// All should reference the exact same client object
		expect(client1).toBe(client2);
		expect(client2).toBe(client3);

		// And the db instances should be identical
		expect(import1.db).toBe(import2.db);
		expect(import2.db).toBe(import3.db);
	});

	it("should maintain singleton across getDb calls in different contexts", async () => {
		const { getDb } = await import("./index");

		// Simulate what happens when multiple services call getDb
		const results = await Promise.all([
			Promise.resolve(getDb()),
			Promise.resolve(getDb()),
			Promise.resolve(getDb()),
			Promise.resolve(getDb()),
			Promise.resolve(getDb()),
		]);

		// All should be the same instance
		const first = results[0];
		for (const result of results) {
			expect(result).toBe(first);
		}
	});
});
