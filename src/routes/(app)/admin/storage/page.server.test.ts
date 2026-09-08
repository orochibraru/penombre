import type { Mock } from "bun:test";
import { describe, expect, test } from "bun:test";
import { StorageService } from "$lib/server/services/storage";

const mockGetAvailableStorageSize =
	StorageService.getAvailableStorageSize as unknown as Mock<
		typeof StorageService.getAvailableStorageSize
	>;

const { load } = await import("./+page.server");

describe("load", () => {
	test("returns storageSize", async () => {
		mockGetAvailableStorageSize.mockReturnValueOnce(2_147_483_648);

		const result = await load();
		expect(result).toEqual({ storageSize: 2_147_483_648 });
	});

	test("returns zero when no storage available", async () => {
		mockGetAvailableStorageSize.mockReturnValueOnce(0);

		const result = await load();
		expect(result).toEqual({ storageSize: 0 });
	});
});
