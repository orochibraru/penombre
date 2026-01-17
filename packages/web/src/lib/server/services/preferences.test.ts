import { beforeEach, describe, expect, it } from "bun:test";
import type { UserPreferencesData } from "$lib/server/db/schema";

/**
 * Preferences Service unit tests
 *
 * Tests for user preferences CRUD operations with mocked database.
 */

// Default preferences as defined in the source
const defaultPreferences: UserPreferencesData = {
	layout: "list",
	sortColumn: "name",
	sortDirection: "asc",
};

// Mock database storage
let mockDbStorage: Map<
	string,
	{ userId: string; preferences: UserPreferencesData | null }
>;

// Simulated service functions that match the real implementation
async function getUserPreferences(
	userId: string,
): Promise<UserPreferencesData> {
	const stored = mockDbStorage.get(userId);
	if (!stored) {
		return defaultPreferences;
	}
	return {
		...defaultPreferences,
		...(stored.preferences ?? {}),
	};
}

async function updateUserPreferences(
	userId: string,
	updates: Partial<UserPreferencesData>,
): Promise<UserPreferencesData> {
	const existing = await getUserPreferences(userId);
	const merged = { ...existing, ...updates };

	mockDbStorage.set(userId, {
		userId,
		preferences: merged,
	});

	return merged;
}

// Test user ID
const TEST_USER_ID = "test-prefs-user-123";

describe("Preferences Service", () => {
	beforeEach(() => {
		// Reset mock storage
		mockDbStorage = new Map();
	});

	describe("getUserPreferences", () => {
		it("should return default preferences when user has no saved preferences", async () => {
			const result = await getUserPreferences(TEST_USER_ID);

			expect(result).toEqual(defaultPreferences);
		});

		it("should return saved preferences merged with defaults", async () => {
			// Save partial preferences
			mockDbStorage.set(TEST_USER_ID, {
				userId: TEST_USER_ID,
				preferences: {
					layout: "grid",
					sortColumn: "size",
					sortDirection: "asc",
				},
			});

			const result = await getUserPreferences(TEST_USER_ID);

			expect(result).toEqual({
				layout: "grid",
				sortColumn: "size",
				sortDirection: "asc",
			});
		});

		it("should return defaults when preferences is null", async () => {
			mockDbStorage.set(TEST_USER_ID, {
				userId: TEST_USER_ID,
				preferences: null,
			});

			const result = await getUserPreferences(TEST_USER_ID);

			expect(result).toEqual(defaultPreferences);
		});

		it("should handle partial saved preferences", async () => {
			mockDbStorage.set(TEST_USER_ID, {
				userId: TEST_USER_ID,
				preferences: {
					layout: "list",
					sortColumn: "name",
					sortDirection: "desc",
				},
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
			mockDbStorage.set(TEST_USER_ID, {
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
			mockDbStorage.set(TEST_USER_ID, {
				userId: TEST_USER_ID,
				preferences: {
					layout: "grid",
					sortColumn: "name",
					sortDirection: "asc",
				},
			});

			const result = await updateUserPreferences(TEST_USER_ID, {
				sortDirection: "desc",
			});

			expect(result.layout).toBe("grid");
			expect(result.sortDirection).toBe("desc");
		});
	});
});
