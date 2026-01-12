import { beforeEach, describe, expect, it, mock } from "bun:test";
import { ActivityService } from "./activity";

/**
 * ActivityService unit tests
 *
 * These tests mock the database layer to test the service logic in isolation.
 */

// Mock activity data
const mockActivities = [
	{
		id: "activity-1",
		userId: "user-123",
		action: "create" as const,
		message: "Created file test.txt",
		link: "/files/test.txt",
		level: "info" as const,
		createdAt: new Date("2026-01-10T10:00:00Z"),
	},
	{
		id: "activity-2",
		userId: "user-123",
		action: "update" as const,
		message: "Updated file test.txt",
		link: "/files/test.txt",
		level: "info" as const,
		createdAt: new Date("2026-01-11T10:00:00Z"),
	},
	{
		id: "activity-3",
		userId: "user-456",
		action: "delete" as const,
		message: "Deleted file other.txt",
		link: null,
		level: "warning" as const,
		createdAt: new Date("2026-01-12T10:00:00Z"),
	},
];

// Create mock database functions
function createMockDb() {
	const mockOrderBy = mock(() => Promise.resolve(mockActivities));
	const mockWhere = mock(() => ({
		orderBy: mock(() =>
			Promise.resolve(mockActivities.filter((a) => a.userId === "user-123")),
		),
	}));
	const mockFrom = mock(() => ({
		orderBy: mockOrderBy,
		where: mockWhere,
	}));
	const mockSelect = mock(() => ({
		from: mockFrom,
	}));

	const mockExecute = mock(() => Promise.resolve({}));
	const mockPrepare = mock(() => ({
		execute: mockExecute,
	}));
	const mockValues = mock(() => ({
		prepare: mockPrepare,
	}));
	const mockInsert = mock(() => ({
		values: mockValues,
	}));

	const mockTx = {
		insert: mockInsert,
	};

	const mockTransaction = mock(
		(callback: (tx: typeof mockTx) => Promise<unknown>) => callback(mockTx),
	);

	return {
		select: mockSelect,
		transaction: mockTransaction,
		// Expose inner mocks for assertions
		_mocks: {
			select: mockSelect,
			from: mockFrom,
			orderBy: mockOrderBy,
			where: mockWhere,
			transaction: mockTransaction,
			insert: mockInsert,
			values: mockValues,
			prepare: mockPrepare,
			execute: mockExecute,
		},
	};
}

// Mock the getDb function
let mockDb: ReturnType<typeof createMockDb>;

mock.module("$lib/server/db", () => ({
	getDb: () => mockDb,
}));

describe("ActivityService", () => {
	beforeEach(() => {
		mockDb = createMockDb();
	});

	describe("constructor", () => {
		it("should create an instance with db and logger", () => {
			const service = new ActivityService();
			expect(service).toBeDefined();
		});
	});

	describe("list", () => {
		it("should fetch all activities ordered by createdAt descending", async () => {
			const service = new ActivityService();

			const result = await service.list();

			expect(result).toEqual(mockActivities);
			expect(mockDb._mocks.select).toHaveBeenCalled();
			expect(mockDb._mocks.from).toHaveBeenCalled();
			expect(mockDb._mocks.orderBy).toHaveBeenCalled();
		});

		it("should return empty array when no activities exist", async () => {
			mockDb._mocks.orderBy.mockImplementation(() => Promise.resolve([]));

			const service = new ActivityService();
			const result = await service.list();

			expect(result).toEqual([]);
		});

		it("should throw error when database query fails", async () => {
			mockDb._mocks.orderBy.mockImplementation(() =>
				Promise.reject(new Error("Database connection failed")),
			);

			const service = new ActivityService();

			await expect(service.list()).rejects.toThrow(
				"Database connection failed",
			);
		});
	});

	describe("register", () => {
		it("should register a new activity", async () => {
			const service = new ActivityService();

			const newActivity = {
				userId: "user-123",
				action: "create" as const,
				message: "Created new file",
				link: "/files/new.txt",
				level: "info" as const,
			};

			await expect(service.register(newActivity)).resolves.toBeUndefined();
			expect(mockDb._mocks.transaction).toHaveBeenCalled();
			expect(mockDb._mocks.insert).toHaveBeenCalled();
			expect(mockDb._mocks.values).toHaveBeenCalled();
		});

		it("should register activity without optional link", async () => {
			const service = new ActivityService();

			const newActivity = {
				userId: "user-123",
				action: "delete" as const,
				message: "Deleted a file",
				level: "warning" as const,
			};

			await expect(service.register(newActivity)).resolves.toBeUndefined();
		});

		it("should throw error when registration fails", async () => {
			mockDb._mocks.execute.mockImplementation(() =>
				Promise.reject(new Error("Insert failed")),
			);

			const service = new ActivityService();

			const newActivity = {
				userId: "user-123",
				action: "create" as const,
				message: "Created new file",
				level: "info" as const,
			};

			await expect(service.register(newActivity)).rejects.toThrow(
				"Insert failed",
			);
		});

		it("should use transaction for activity registration", async () => {
			const service = new ActivityService();

			const newActivity = {
				userId: "user-123",
				action: "share" as const,
				message: "Shared file with team",
				link: "/files/shared.txt",
				level: "info" as const,
			};

			await service.register(newActivity);

			// Verify transaction was used
			expect(mockDb._mocks.transaction).toHaveBeenCalledTimes(1);
		});
	});

	describe("get", () => {
		it("should fetch activities for a specific user", async () => {
			const service = new ActivityService();

			const result = await service.get("user-123");

			// Should only return activities for user-123
			expect(result).toHaveLength(2);
			expect(result.every((a) => a.userId === "user-123")).toBe(true);
		});

		it("should return empty array for user with no activities", async () => {
			const mockWhereOrderBy = mock(() => Promise.resolve([]));
			mockDb._mocks.where.mockImplementation(() => ({
				orderBy: mockWhereOrderBy,
			}));

			const service = new ActivityService();
			const result = await service.get("user-with-no-activities");

			expect(result).toEqual([]);
		});

		it("should throw error when fetching user activities fails", async () => {
			mockDb._mocks.where.mockImplementation(() => ({
				orderBy: mock(() => Promise.reject(new Error("User lookup failed"))),
			}));

			const service = new ActivityService();

			await expect(service.get("user-123")).rejects.toThrow(
				"User lookup failed",
			);
		});
	});
});

describe("ActivityService - Activity Actions", () => {
	beforeEach(() => {
		mockDb = createMockDb();
	});

	it("should support create action", async () => {
		const service = new ActivityService();

		await expect(
			service.register({
				userId: "user-123",
				action: "create",
				message: "Created item",
				level: "info",
			}),
		).resolves.toBeUndefined();
	});

	it("should support update action", async () => {
		const service = new ActivityService();

		await expect(
			service.register({
				userId: "user-123",
				action: "update",
				message: "Updated item",
				level: "info",
			}),
		).resolves.toBeUndefined();
	});

	it("should support delete action", async () => {
		const service = new ActivityService();

		await expect(
			service.register({
				userId: "user-123",
				action: "delete",
				message: "Deleted item",
				level: "warning",
			}),
		).resolves.toBeUndefined();
	});

	it("should support share action", async () => {
		const service = new ActivityService();

		await expect(
			service.register({
				userId: "user-123",
				action: "share",
				message: "Shared item",
				level: "info",
			}),
		).resolves.toBeUndefined();
	});
});

describe("ActivityService - Activity Levels", () => {
	beforeEach(() => {
		mockDb = createMockDb();
	});

	it("should support info level", async () => {
		const service = new ActivityService();

		await expect(
			service.register({
				userId: "user-123",
				action: "create",
				message: "Info message",
				level: "info",
			}),
		).resolves.toBeUndefined();
	});

	it("should support warning level", async () => {
		const service = new ActivityService();

		await expect(
			service.register({
				userId: "user-123",
				action: "delete",
				message: "Warning message",
				level: "warning",
			}),
		).resolves.toBeUndefined();
	});

	it("should support error level", async () => {
		const service = new ActivityService();

		await expect(
			service.register({
				userId: "user-123",
				action: "update",
				message: "Error message",
				level: "error",
			}),
		).resolves.toBeUndefined();
	});
});
