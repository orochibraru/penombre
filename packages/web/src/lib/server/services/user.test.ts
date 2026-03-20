import { describe, expect, type Mock, mock, test } from "bun:test";
import { db } from "$lib/server/db";

const mockSelect = db.select as Mock<typeof db.select>;

const { getUserById } = await import("./user");

describe("getUserById", () => {
	test("returns user when found", async () => {
		const userRecord = {
			id: "user-1",
			name: "John Doe",
			email: "john@example.com",
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			image: null,
			role: "user",
			banned: false,
			banReason: null,
			banExpires: null,
		};

		// Mock the chainable select().from().where().limit() to resolve with [userRecord]
		const mockLimit = mock(() => Promise.resolve([userRecord]));
		const mockWhere = mock(() => ({ limit: mockLimit }));
		const mockFrom = mock(() => ({ where: mockWhere }));
		mockSelect.mockReturnValueOnce({ from: mockFrom } as never);

		const result = await getUserById("user-1");
		expect(result).toEqual(userRecord);
	});

	test("returns null when user not found", async () => {
		const mockLimit = mock(() => Promise.resolve([]));
		const mockWhere = mock(() => ({ limit: mockLimit }));
		const mockFrom = mock(() => ({ where: mockWhere }));
		mockSelect.mockReturnValueOnce({ from: mockFrom } as never);

		const result = await getUserById("nonexistent");
		expect(result).toBeNull();
	});
});
