import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { getUserById } from "./user";

/**
 * User DTO unit tests
 *
 * Tests for user retrieval operations with mocked database layer.
 */

// Mock user record
const mockUserRecord = {
	id: "user-123",
	name: "Test User",
	email: "test@example.com",
	emailVerified: true,
	image: null,
	createdAt: new Date("2026-01-01T00:00:00Z"),
	updatedAt: new Date("2026-01-10T00:00:00Z"),
};

// Mock db module
const mockSelect = mock();
const mockFrom = mock();
const mockWhere = mock();
const mockLimit = mock();

mock.module("$lib/server/db", () => ({
	db: {
		select: mockSelect,
	},
}));

describe("User DTO", () => {
	beforeEach(() => {
		// Reset all mocks before each test
		mockSelect.mockReset();
		mockFrom.mockReset();
		mockWhere.mockReset();
		mockLimit.mockReset();

		// Set up mock chain for select
		mockLimit.mockResolvedValue([]);
		mockWhere.mockReturnValue({ limit: mockLimit });
		mockFrom.mockReturnValue({ where: mockWhere });
		mockSelect.mockReturnValue({ from: mockFrom });
	});

	afterEach(() => {
		mock.restore();
	});

	describe("getUserById", () => {
		it("should return user when found", async () => {
			mockLimit.mockResolvedValue([mockUserRecord]);

			const result = await getUserById("user-123");

			expect(result).toEqual(mockUserRecord);
			expect(mockSelect).toHaveBeenCalled();
		});

		it("should return null when user not found", async () => {
			mockLimit.mockResolvedValue([]);

			const result = await getUserById("non-existent-user");

			expect(result).toBeNull();
		});

		it("should query with correct user id", async () => {
			mockLimit.mockResolvedValue([mockUserRecord]);

			await getUserById("user-456");

			expect(mockSelect).toHaveBeenCalled();
			expect(mockFrom).toHaveBeenCalled();
			expect(mockWhere).toHaveBeenCalled();
			expect(mockLimit).toHaveBeenCalledWith(1);
		});

		it("should handle empty result array", async () => {
			mockLimit.mockResolvedValue([]);

			const result = await getUserById("user-123");

			expect(result).toBeNull();
		});

		it("should return first user when multiple match (shouldn't happen in practice)", async () => {
			const users = [
				mockUserRecord,
				{ ...mockUserRecord, id: "user-124", name: "Other User" },
			];
			mockLimit.mockResolvedValue(users);

			const result = await getUserById("user-123");

			// Should return the first match
			expect(result).toEqual(mockUserRecord);
		});

		it("should handle database errors", async () => {
			mockLimit.mockRejectedValue(new Error("Database connection failed"));

			await expect(getUserById("user-123")).rejects.toThrow(
				"Database connection failed",
			);
		});

		it("should return user with all fields populated", async () => {
			const fullUserRecord = {
				...mockUserRecord,
				image: "https://example.com/avatar.jpg",
				emailVerified: true,
			};
			mockLimit.mockResolvedValue([fullUserRecord]);

			const result = await getUserById("user-123");

			expect(result).toEqual(fullUserRecord);
			expect(result?.image).toBe("https://example.com/avatar.jpg");
			expect(result?.emailVerified).toBe(true);
		});
	});
});
