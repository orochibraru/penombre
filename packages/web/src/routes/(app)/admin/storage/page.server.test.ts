import type { Mock } from "bun:test";
import { describe, expect, mock, test } from "bun:test";

mock.module("$lib/server/services/storage", () => ({
	StorageService: {
		getAvailableStorageSize: mock(() => 1073741824),
	},
}));

const { StorageService } = await import("$lib/server/services/storage");

const mockGetAvailableStorageSize =
	StorageService.getAvailableStorageSize as unknown as Mock<
		typeof StorageService.getAvailableStorageSize
	>;

const { load } = await import("./+page.server");

describe("load", () => {
	test("returns storageSize", async () => {
		mockGetAvailableStorageSize.mockReturnValueOnce(2147483648);

		const result = await load();
		expect(result).toEqual({ storageSize: 2147483648 });
	});

	test("returns zero when no storage available", async () => {
		mockGetAvailableStorageSize.mockReturnValueOnce(0);

		const result = await load();
		expect(result).toEqual({ storageSize: 0 });
	});
});
