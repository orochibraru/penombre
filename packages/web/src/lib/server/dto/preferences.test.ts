import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { UserPreferencesData } from "$lib/server/db/schema";
import { getUserPreferences, updateUserPreferences } from "./preferences";

/**
 * Preferences DTO unit tests
 *
 * Tests for user preferences CRUD operations with mocked database layer.
 */

// Mock db module
const mockSelect = mock();
const mockFrom = mock();
const mockWhere = mock();
const mockLimit = mock();
const mockInsert = mock();
const mockValues = mock();
const mockOnConflictDoUpdate = mock();

mock.module("$lib/server/db", () => ({
	db: {
		select: mockSelect,
		insert: mockInsert,
	},
}));

// Default preferences as defined in the source
const defaultPreferences: UserPreferencesData = {
	layout: "list",
	sortColumn: "name",
	sortDirection: "asc",
};

describe("Preferences DTO", () => {
	beforeEach(() => {
		// Reset all mocks before each test
		mockSelect.mockReset();
		mockFrom.mockReset();
		mockWhere.mockReset();
		mockLimit.mockReset();
		mockInsert.mockReset();
		mockValues.mockReset();
		mockOnConflictDoUpdate.mockReset();

		// Set up mock chain for select
		mockLimit.mockResolvedValue([]);
		mockWhere.mockReturnValue({ limit: mockLimit });
		mockFrom.mockReturnValue({ where: mockWhere });
		mockSelect.mockReturnValue({ from: mockFrom });

		// Set up mock chain for insert
		mockOnConflictDoUpdate.mockResolvedValue(undefined);
		mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
		mockInsert.mockReturnValue({ values: mockValues });
	});

	afterEach(() => {
		mock.restore();
	});

	describe("getUserPreferences", () => {
		it("should return default preferences when user has no saved preferences", async () => {
			mockLimit.mockResolvedValue([]);

			const result = await getUserPreferences("user-123");

			expect(result).toEqual(defaultPreferences);
			expect(mockSelect).toHaveBeenCalled();
		});

		it("should return saved preferences merged with defaults", async () => {
			const savedPrefs = {
				userId: "user-123",
				preferences: { layout: "grid", sortColumn: "size" },
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockLimit.mockResolvedValue([savedPrefs]);

			const result = await getUserPreferences("user-123");

			expect(result).toEqual({
				layout: "grid",
				sortColumn: "size",
				sortDirection: "asc", // from defaults
			});
		});

		it("should return defaults when preferences is null", async () => {
			const savedPrefs = {
				userId: "user-123",
				preferences: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockLimit.mockResolvedValue([savedPrefs]);

			const result = await getUserPreferences("user-123");

			expect(result).toEqual(defaultPreferences);
		});

		it("should handle partial saved preferences", async () => {
			const savedPrefs = {
				userId: "user-123",
				preferences: { sortDirection: "desc" },
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockLimit.mockResolvedValue([savedPrefs]);

			const result = await getUserPreferences("user-123");

			expect(result).toEqual({
				layout: "list",
				sortColumn: "name",
				sortDirection: "desc",
			});
		});
	});

	describe("updateUserPreferences", () => {
		it("should merge updates with existing preferences", async () => {
			// Mock existing preferences
			const savedPrefs = {
				userId: "user-123",
				preferences: {
					layout: "list",
					sortColumn: "name",
					sortDirection: "asc",
				},
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockLimit.mockResolvedValue([savedPrefs]);

			const result = await updateUserPreferences("user-123", {
				layout: "grid",
			});

			expect(result).toEqual({
				layout: "grid",
				sortColumn: "name",
				sortDirection: "asc",
			});
			expect(mockInsert).toHaveBeenCalled();
			expect(mockValues).toHaveBeenCalled();
			expect(mockOnConflictDoUpdate).toHaveBeenCalled();
		});

		it("should use upsert pattern for new users", async () => {
			// No existing preferences
			mockLimit.mockResolvedValue([]);

			const result = await updateUserPreferences("new-user", {
				layout: "grid",
				sortColumn: "size",
			});

			expect(result).toEqual({
				layout: "grid",
				sortColumn: "size",
				sortDirection: "asc",
			});
			expect(mockInsert).toHaveBeenCalled();
		});

		it("should handle updating multiple preferences at once", async () => {
			mockLimit.mockResolvedValue([]);

			const result = await updateUserPreferences("user-123", {
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
			const savedPrefs = {
				userId: "user-123",
				preferences: { layout: "grid" },
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockLimit.mockResolvedValue([savedPrefs]);

			const result = await updateUserPreferences("user-123", {
				sortDirection: "desc",
			});

			expect(result.layout).toBe("grid");
			expect(result.sortDirection).toBe("desc");
		});
	});
});
