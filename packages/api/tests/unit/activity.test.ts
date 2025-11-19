import { beforeEach, describe, expect, it, mock } from "bun:test";
import {
	getUserActivities,
	listAllActivities,
	registerActivity,
} from "@lib/activity";
import { activity } from "@lib/db/schema";
import { MockDrizzle } from "../mocks/db";

// Mock logger
const mockLogger = {
	error: mock(),
	info: mock(),
	warn: mock(),
};

mock.module("@lib/logger", () => ({
	logger: mockLogger,
}));

describe("Activity Service", () => {
	const mockDb = new MockDrizzle();

	beforeEach(() => {
		mockDb.reset();
		global.db = mockDb.getDb();
		mockLogger.error.mockClear();
	});

	describe("registerActivity", () => {
		it("should register a new activity successfully", async () => {
			const newActivity = {
				userId: "user-123",
				action: "create" as const,
				message: "Uploaded file",
				level: "info" as const,
			};

			mockDb.setResolvedValue([{ id: "1" }]);

			await registerActivity(newActivity);

			expect(mockDb.mocks.transaction).toHaveBeenCalled();
			expect(mockDb.mocks.insert).toHaveBeenCalledWith(activity);
			expect(mockDb.mocks.values).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: newActivity.userId,
					action: newActivity.action,
					message: newActivity.message,
					level: newActivity.level,
				}),
			);
			expect(mockDb.mocks.prepare).toHaveBeenCalledWith(
				"insert-activity-transaction",
			);
			expect(mockDb.mocks.execute).toHaveBeenCalled();
		});

		it("should log error and throw if registration fails", async () => {
			const error = new Error("DB Error");
			mockDb.mocks.execute.mockImplementation(() => Promise.reject(error));

			const newActivity = {
				userId: "user-123",
				action: "create" as const,
				message: "Uploaded file",
				level: "info" as const,
			};

			try {
				await registerActivity(newActivity);
				expect(true).toBe(false); // Should not reach here
			} catch (e) {
				expect(e).toBe(error);
				expect(mockLogger.error).toHaveBeenCalledWith(
					"Failed to save activity:",
					error,
				);
			}
		});
	});

	describe("getUserActivities", () => {
		it("should fetch activities for a specific user", async () => {
			const userId = "user-123";
			const mockData = [
				{
					id: "1",
					userId,
					action: "create" as const,
					message: "test",
					level: "info" as const,
					link: null,
					createdAt: new Date(),
				},
			];
			mockDb.setResolvedValue(mockData);

			const result = await getUserActivities(userId);

			expect(result).toEqual(mockData);
			expect(mockDb.mocks.select).toHaveBeenCalled();
			expect(mockDb.mocks.from).toHaveBeenCalledWith(activity);
			expect(mockDb.mocks.where).toHaveBeenCalled();
			expect(mockDb.mocks.orderBy).toHaveBeenCalled();
		});
	});

	describe("listAllActivities", () => {
		it("should fetch all activities", async () => {
			const mockData = [
				{
					id: "1",
					userId: "user-1",
					action: "create" as const,
					message: "test",
					level: "info" as const,
					link: null,
					createdAt: new Date(),
				},
				{
					id: "2",
					userId: "user-2",
					action: "delete" as const,
					message: "test 2",
					level: "warning" as const,
					link: null,
					createdAt: new Date(),
				},
			];
			mockDb.setResolvedValue(mockData);

			const result = await listAllActivities();

			expect(result).toEqual(mockData);
			expect(mockDb.mocks.select).toHaveBeenCalled();
			expect(mockDb.mocks.from).toHaveBeenCalledWith(activity);
			expect(mockDb.mocks.orderBy).toHaveBeenCalled();
		});
	});
});
