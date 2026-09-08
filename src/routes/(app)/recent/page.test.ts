import type { Mock } from "bun:test";
import { describe, expect, test } from "bun:test";
import { api } from "$lib/api";

const mockGET = api.GET as unknown as Mock<typeof api.GET>;

const { load } = await import("./+page");

function createLoadEvent() {
	return {
		fetch: globalThis.fetch,
		url: new URL("http://localhost"),
		depends: () => {},
	};
}

describe("load", () => {
	test("returns recent files on success", async () => {
		const fileData = [{ id: "file-1", name: "recent.txt" }];
		mockGET.mockResolvedValueOnce({
			data: { data: fileData },
			error: undefined,
		} as never);

		const result = await load(createLoadEvent() as never);
		expect(result).toEqual({
			files: { data: fileData, err: undefined },
		});
	});

	test("calls the recent files endpoint", async () => {
		mockGET.mockResolvedValueOnce({
			data: { data: [] },
			error: undefined,
		} as never);

		await load(createLoadEvent() as never);

		expect(mockGET).toHaveBeenLastCalledWith(
			"/api/v1/storage/list/recent",
			expect.objectContaining({ baseUrl: "http://localhost" }),
		);
	});

	test("throws 500 when API returns error", async () => {
		mockGET.mockResolvedValueOnce({
			data: undefined,
			error: { message: "Server error" },
		} as never);

		expect(load(createLoadEvent() as never)).rejects.toThrow();
	});
});
