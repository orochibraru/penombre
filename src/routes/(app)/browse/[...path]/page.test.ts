import type { Mock } from "bun:test";
import { describe, expect, test } from "bun:test";
import { api } from "#lib/api/index.js";

const mockGET = api.GET as unknown as Mock<typeof api.GET>;

const { load } = await import("./+page");

function createLoadEvent(path: string) {
	return {
		params: { path },
		fetch: globalThis.fetch,
		url: new URL("http://localhost"),
		depends: () => {},
		parent: async () => ({
			preferences: { sortColumn: "name", sortDirection: "asc" },
		}),
	};
}

describe("load", () => {
	test("returns files and breadcrumbs for a single folder", async () => {
		mockGET.mockResolvedValueOnce({
			data: {
				data: {
					list: [{ id: "file-1", name: "readme.md" }],
					ancestorNames: ["Documents"],
				},
			},
			error: undefined,
		} as never);

		const result = await load(createLoadEvent("folder-abc") as never);
		expect(result).toEqual({
			files: {
				data: {
					list: [{ id: "file-1", name: "readme.md" }],
					ancestorNames: ["Documents"],
				},
				err: undefined,
			},
			title: "Documents",
			folders: ["folder-abc"],
			crumbs: [
				{ title: "My Drive", href: "/browse" },
				{ title: "Documents", href: "/browse/folder-abc" },
			],
		});
	});

	test("returns files and breadcrumbs for nested folders", async () => {
		mockGET.mockResolvedValueOnce({
			data: {
				data: {
					list: [{ id: "file-2", name: "index.ts" }],
					ancestorNames: ["Projects", "Web App"],
				},
			},
			error: undefined,
		} as never);

		const result = await load(createLoadEvent("folder-a/folder-b") as never);
		expect(result).toEqual({
			files: {
				data: {
					list: [{ id: "file-2", name: "index.ts" }],
					ancestorNames: ["Projects", "Web App"],
				},
				err: undefined,
			},
			title: "Web App",
			folders: ["folder-a", "folder-b"],
			crumbs: [
				{ title: "My Drive", href: "/browse" },
				{ title: "Projects", href: "/browse/folder-a" },
				{ title: "Web App", href: "/browse/folder-a/folder-b" },
			],
		});
	});

	test("falls back to the folder id when its ancestor name is null", async () => {
		mockGET.mockResolvedValueOnce({
			data: { data: { list: [], ancestorNames: [null] } },
			error: undefined,
		} as never);

		const result = await load(createLoadEvent("folder-xyz") as never);
		expect(result).toEqual({
			files: { data: { list: [], ancestorNames: [null] }, err: undefined },
			title: "folder-xyz",
			folders: ["folder-xyz"],
			crumbs: [
				{ title: "My Drive", href: "/browse" },
				{ title: "folder-xyz", href: "/browse/folder-xyz" },
			],
		});
	});

	test("asks for the first page in the user's sort order", async () => {
		mockGET.mockResolvedValueOnce({
			data: { data: { list: [], ancestorNames: [null] } },
			error: undefined,
		} as never);

		await load(createLoadEvent("folder-a/folder-b") as never);
		expect(mockGET).toHaveBeenLastCalledWith(
			"/api/v1/storage/list/{path}",
			expect.objectContaining({
				params: {
					path: { path: "folder-a/folder-b" },
					query: { limit: "200", sort: "name", dir: "asc" },
				},
			}),
		);
	});

	test("throws 500 when list files API returns error", async () => {
		mockGET.mockResolvedValueOnce({
			data: undefined,
			error: { message: "Internal error" },
		} as never);

		expect(load(createLoadEvent("folder-abc") as never)).rejects.toThrow();
	});
});
