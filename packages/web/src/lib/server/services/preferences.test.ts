import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import type { UserPreferencesData } from "$lib/server/db/schema";
import { user, userPreferences } from "$lib/server/db/schema";
import { getUserPreferences, updateUserPreferences } from "./preferences";

/**
 * Preferences Service integration tests
 *
 * Tests for user preferences CRUD operations with real database.
 */

// Test user ID
const TEST_USER_ID = "test-prefs-user-123";

// Default preferences as defined in the source
const defaultPreferences: UserPreferencesData = {
	layout: "list",
	sortColumn: "name",
	sortDirection: "asc",
};

describe("Preferences Service", () => {
	beforeEach(async () => {
		// Create test user
		await db
			.insert(user)
			.values({
				id: TEST_USER_ID,
				email: "test-prefs@example.com",
				emailVerified: false,
				name: "Test Prefs User",
			})
			.onConflictDoNothing();

		// Clean up any existing preferences
		await db
			.delete(userPreferences)
			.where(eq(userPreferences.userId, TEST_USER_ID));
	});

	afterEach(async () => {
		// Clean up test data
		await db
			.delete(userPreferences)
			.where(eq(userPreferences.userId, TEST_USER_ID));
		await db.delete(user).where(eq(user.id, TEST_USER_ID));
	});

	describe("getUserPreferences", () => {
		it("should return default preferences when user has no saved preferences", async () => {
			const result = await getUserPreferences(TEST_USER_ID);

			expect(result).toEqual(defaultPreferences);
		});

		it("should return saved preferences merged with defaults", async () => {
			// Save partial preferences
			await db.insert(userPreferences).values({
				userId: TEST_USER_ID,
				preferences: { layout: "grid", sortColumn: "size" },
			});

			const result = await getUserPreferences(TEST_USER_ID);

			expect(result).toEqual({
				layout: "grid",
				sortColumn: "size",
				sortDirection: "asc", // from defaults
			});
		});

		it("should return defaults when preferences is null", async () => {
			await db.insert(userPreferences).values({
				userId: TEST_USER_ID,
				preferences: null,
			});

			const result = await getUserPreferences(TEST_USER_ID);

			expect(result).toEqual(defaultPreferences);
		});

		it("should handle partial saved preferences", async () => {
			await db.insert(userPreferences).values({
				userId: TEST_USER_ID,
				preferences: { sortDirection: "desc" },
			});

			const result = await getUserPreferences(TEST_USER_ID);

			expect(result).toEqual({
				layout: "list",
				sortColumn: "name",
				sortDirection: "desc",
			});
		});
	});

	describe("updateUserPreferences", () => {
		it("should merge updates with existing preferences", async () => {
			// Create existing preferences
			await db.insert(userPreferences).values({
				userId: TEST_USER_ID,
				preferences: {
					layout: "list",
					sortColumn: "name",
					sortDirection: "asc",
				},
			});

			const result = await updateUserPreferences(TEST_USER_ID, {
				layout: "grid",
			});

			expect(result).toEqual({
				layout: "grid",
				sortColumn: "name",
				sortDirection: "asc",
			});
		});

		it("should use upsert pattern for new users", async () => {
			const result = await updateUserPreferences(TEST_USER_ID, {
				layout: "grid",
				sortColumn: "size",
			});

			expect(result).toEqual({
				layout: "grid",
				sortColumn: "size",
				sortDirection: "asc",
			});

			// Verify it was saved
			const saved = await getUserPreferences(TEST_USER_ID);
			expect(saved).toEqual(result);
		});

		it("should handle updating multiple preferences at once", async () => {
			const result = await updateUserPreferences(TEST_USER_ID, {
				layout: "grid",
				sortColumn: "updatedAt",
				sortDirection: "desc",
			});

			expect(result).toEqual({
				layout: "grid",
				sortColumn: "updatedAt",
				sortDirection: "desc",
			});
		});

		it("should return merged preferences after update", async () => {
			await db.insert(userPreferences).values({
				userId: TEST_USER_ID,
				preferences: { layout: "grid" },
			});

			const result = await updateUserPreferences(TEST_USER_ID, {
				sortDirection: "desc",
			});

			expect(result.layout).toBe("grid");
			expect(result.sortDirection).toBe("desc");
		});
	});
});
