import { describe, expect, type Mock, mock, test } from "bun:test";
import { db } from "$lib/server/db";

const mockSelect = db.select as Mock<typeof db.select>;
const mockInsert = db.insert as Mock<typeof db.insert>;

const { getUserPreferences, updateUserPreferences } = await import(
	"./preferences"
);

describe("getUserPreferences", () => {
	test("returns default preferences when user has none", async () => {
		const mockLimit = mock(() => Promise.resolve([]));
		const mockWhere = mock(() => ({ limit: mockLimit }));
		const mockFrom = mock(() => ({ where: mockWhere }));
		mockSelect.mockReturnValueOnce({ from: mockFrom } as never);

		const result = await getUserPreferences("user-1");
		expect(result).toEqual({
			layout: "list",
			sortColumn: "name",
			sortDirection: "asc",
		});
	});

	test("returns stored preferences merged with defaults", async () => {
		const stored = {
			userId: "user-1",
			preferences: { layout: "grid" as const },
			updatedAt: new Date(),
		};
		const mockLimit = mock(() => Promise.resolve([stored]));
		const mockWhere = mock(() => ({ limit: mockLimit }));
		const mockFrom = mock(() => ({ where: mockWhere }));
		mockSelect.mockReturnValueOnce({ from: mockFrom } as never);

		const result = await getUserPreferences("user-1");
		expect(result).toEqual({
			layout: "grid",
			sortColumn: "name",
			sortDirection: "asc",
		});
	});

	test("returns stored preferences with null preferences field", async () => {
		const stored = {
			userId: "user-1",
			preferences: null,
			updatedAt: new Date(),
		};
		const mockLimit = mock(() => Promise.resolve([stored]));
		const mockWhere = mock(() => ({ limit: mockLimit }));
		const mockFrom = mock(() => ({ where: mockWhere }));
		mockSelect.mockReturnValueOnce({ from: mockFrom } as never);

		const result = await getUserPreferences("user-1");
		expect(result).toEqual({
			layout: "list",
			sortColumn: "name",
			sortDirection: "asc",
		});
	});
});

describe("updateUserPreferences", () => {
	test("merges updates with existing preferences and upserts", async () => {
		// First call: getUserPreferences (select)
		const mockLimit = mock(() => Promise.resolve([]));
		const mockWhere = mock(() => ({ limit: mockLimit }));
		const mockFrom = mock(() => ({ where: mockWhere }));
		mockSelect.mockReturnValueOnce({ from: mockFrom } as never);

		// Second call: insert...onConflictDoUpdate
		const mockOnConflict = mock(() => Promise.resolve());
		const mockValues = mock(() => ({ onConflictDoUpdate: mockOnConflict }));
		mockInsert.mockReturnValueOnce({ values: mockValues } as never);

		const result = await updateUserPreferences("user-1", {
			layout: "grid",
		});

		expect(result).toEqual({
			layout: "grid",
			sortColumn: "name",
			sortDirection: "asc",
		});
		expect(mockValues).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "user-1",
				preferences: {
					layout: "grid",
					sortColumn: "name",
					sortDirection: "asc",
				},
			}),
		);
	});

	test("merges with existing stored preferences", async () => {
		// getUserPreferences returns existing prefs
		const stored = {
			userId: "user-1",
			preferences: { layout: "grid" as const, sortColumn: "size" as const },
			updatedAt: new Date(),
		};
		const mockLimit = mock(() => Promise.resolve([stored]));
		const mockWhere = mock(() => ({ limit: mockLimit }));
		const mockFrom = mock(() => ({ where: mockWhere }));
		mockSelect.mockReturnValueOnce({ from: mockFrom } as never);

		// Insert upsert
		const mockOnConflict = mock(() => Promise.resolve());
		const mockValues = mock(() => ({ onConflictDoUpdate: mockOnConflict }));
		mockInsert.mockReturnValueOnce({ values: mockValues } as never);

		const result = await updateUserPreferences("user-1", {
			sortDirection: "desc",
		});

		expect(result).toEqual({
			layout: "grid",
			sortColumn: "size",
			sortDirection: "desc",
		});
	});
});
