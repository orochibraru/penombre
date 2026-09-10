import type { Mock } from "bun:test";
import { describe, expect, mock, test } from "bun:test";
import { StorageService } from "$lib/server/services/storage";

const instanceStats = {
	userCount: 2,
	fileCount: 12,
	totalBytes: 4096,
	trashedBytes: 512,
	shareCount: 1,
	activityCount: 7,
	disk: { total: 2_147_483_648, available: 1_073_741_824 },
	perUser: [],
};

const mockForInstance = mock(async () => instanceStats);

mock.module("$lib/server/services/stats", () => ({
	StatsService: class {
		forInstance = mockForInstance;
	},
}));

const mockGetAdminStoragePath =
	StorageService.getAdminStoragePath as unknown as Mock<
		typeof StorageService.getAdminStoragePath
	>;

const { load } = await import("./+page.server");

describe("load", () => {
	test("returns the storage path and instance stats", async () => {
		mockGetAdminStoragePath.mockReturnValueOnce("/data/storage");

		const result = await load();

		expect(result).toEqual({
			storagePath: "/data/storage",
			stats: instanceStats,
		});
	});
});
