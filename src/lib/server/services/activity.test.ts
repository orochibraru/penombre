import { describe, expect, type Mock, mock, test } from "bun:test";
import { getDb } from "$lib/server/db";

const mockDb = getDb();
const mockSelect = mockDb.select as Mock<typeof mockDb.select>;
const mockInsert = mockDb.insert as unknown as Mock<
	(table: unknown) => { values: (data: unknown) => Promise<unknown> }
>;

const { ActivityService } = await import("./activity");

describe("ActivityService", () => {
	describe("list", () => {
		test("returns all activities", async () => {
			const activities = [
				{
					id: "act-1",
					userId: "user-1",
					action: "create",
					message: "Created file",
					link: null,
					level: "info",
					createdAt: new Date(),
				},
			];
			const mockOrderBy = mock(() => Promise.resolve(activities));
			const mockFrom = mock(() => ({ orderBy: mockOrderBy }));
			mockSelect.mockReturnValueOnce({ from: mockFrom } as never);

			const service = new ActivityService();
			const result = await service.list();
			expect(result).toEqual(activities);
		});

		test("throws when DB query fails", async () => {
			const mockFrom = mock(() => ({
				orderBy: mock(() => Promise.reject(new Error("DB error"))),
			}));
			mockSelect.mockReturnValueOnce({ from: mockFrom } as never);

			const service = new ActivityService();
			expect(service.list()).rejects.toThrow("DB error");
		});
	});

	describe("register", () => {
		test("inserts the activity", async () => {
			const mockValues = mock(() => Promise.resolve({}));
			mockInsert.mockReturnValueOnce({ values: mockValues });

			const service = new ActivityService();
			await service.register({
				userId: "user-1",
				action: "create",
				message: "Created file test.txt",
				link: "/browse/test.txt",
				level: "info",
			});

			expect(mockInsert).toHaveBeenCalled();
			expect(mockValues).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: "user-1",
					action: "create",
					message: "Created file test.txt",
					link: "/browse/test.txt",
					level: "info",
				}),
			);
		});

		test("throws when the insert fails", async () => {
			mockInsert.mockReturnValueOnce({
				values: mock(() => Promise.reject(new Error("TX error"))),
			});

			const service = new ActivityService();
			expect(
				service.register({
					userId: "user-1",
					action: "delete",
					message: "Deleted file",
					link: null,
					level: "warning",
				}),
			).rejects.toThrow("TX error");
		});
	});

	describe("get", () => {
		test("returns activities for a specific user", async () => {
			const activities = [
				{
					id: "act-1",
					userId: "user-1",
					action: "create",
					message: "Created file",
					link: null,
					level: "info",
					createdAt: new Date(),
				},
			];
			const mockLimit = mock(() => Promise.resolve(activities));
			const mockOrderBy = mock(() => ({ limit: mockLimit }));
			const mockWhere = mock(() => ({ orderBy: mockOrderBy }));
			const mockFrom = mock(() => ({ where: mockWhere }));
			mockSelect.mockReturnValueOnce({ from: mockFrom } as never);

			const service = new ActivityService();
			const result = await service.get("user-1");
			expect(result).toEqual(activities);
		});

		test("returns empty array when user has no activities", async () => {
			const mockLimit = mock(() => Promise.resolve([]));
			const mockOrderBy = mock(() => ({ limit: mockLimit }));
			const mockWhere = mock(() => ({ orderBy: mockOrderBy }));
			const mockFrom = mock(() => ({ where: mockWhere }));
			mockSelect.mockReturnValueOnce({ from: mockFrom } as never);

			const service = new ActivityService();
			const result = await service.get("user-2");
			expect(result).toEqual([]);
		});

		test("throws when DB query fails", async () => {
			const mockLimit = mock(() =>
				Promise.reject(new Error("Connection lost")),
			);
			const mockOrderBy = mock(() => ({ limit: mockLimit }));
			const mockWhere = mock(() => ({ orderBy: mockOrderBy }));
			const mockFrom = mock(() => ({ where: mockWhere }));
			mockSelect.mockReturnValueOnce({ from: mockFrom } as never);

			const service = new ActivityService();
			expect(service.get("user-1")).rejects.toThrow("Connection lost");
		});
	});
});
