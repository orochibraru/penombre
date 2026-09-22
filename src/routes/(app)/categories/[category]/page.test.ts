import type { Mock } from "bun:test";
import { describe, expect, test } from "bun:test";
import { api } from "#lib/api/index.js";

const mockGET = api.GET as unknown as Mock<typeof api.GET>;

const { load } = await import("./+page");

function createLoadEvent(
	category?: string,
	preferences: { sortColumn?: string | null; sortDirection?: string } = {},
) {
	return {
		params: { category },
		fetch: globalThis.fetch,
		url: new URL("http://localhost"),
		depends: () => {},
		parent: async () => ({ preferences }),
	};
}

describe("load", () => {
	test("returns files for a category", async () => {
		const fileData = [{ id: "file-1", name: "photo.jpg" }];
		mockGET.mockResolvedValueOnce({
			data: { data: fileData },
			error: undefined,
		} as never);

		const result = await load(createLoadEvent("IMAGES") as never);
		expect(result).toEqual({
			category: "IMAGES",
			files: { data: fileData, err: undefined },
		});
	});

	test("calls the category endpoint with correct path param and default sort", async () => {
		mockGET.mockResolvedValueOnce({
			data: { data: [] },
			error: undefined,
		} as never);

		await load(createLoadEvent("DOCUMENTS") as never);

		expect(mockGET).toHaveBeenLastCalledWith(
			"/api/v1/storage/file/category/{category}",
			expect.objectContaining({
				params: {
					path: { category: "DOCUMENTS" },
					query: { limit: "200", sort: "updatedAt", dir: "desc" },
				},
				baseUrl: "http://localhost",
			}),
		);
	});

	test("passes the user's sort preference through to the query", async () => {
		mockGET.mockResolvedValueOnce({
			data: { data: [] },
			error: undefined,
		} as never);

		await load(
			createLoadEvent("MUSIC", {
				sortColumn: "name",
				sortDirection: "asc",
			}) as never,
		);

		expect(mockGET).toHaveBeenLastCalledWith(
			"/api/v1/storage/file/category/{category}",
			expect.objectContaining({
				params: {
					path: { category: "MUSIC" },
					query: { limit: "200", sort: "name", dir: "asc" },
				},
			}),
		);
	});

	test("throws 400 when category param is missing", async () => {
		expect(load(createLoadEvent(undefined) as never)).rejects.toThrow();
	});

	test("throws 400 when category param is empty string", async () => {
		expect(load(createLoadEvent("") as never)).rejects.toThrow();
	});

	test("throws 500 when API returns error", async () => {
		mockGET.mockResolvedValueOnce({
			data: undefined,
			error: { message: "Server error" },
		} as never);

		expect(load(createLoadEvent("MUSIC") as never)).rejects.toThrow();
	});
});
