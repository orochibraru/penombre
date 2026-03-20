import type { Mock } from "bun:test";
import { describe, expect, test } from "bun:test";
import { api } from "$lib/api";

const mockGET = api.GET as unknown as Mock<typeof api.GET>;

const { load } = await import("./+page");

function createLoadEvent(path: string) {
	return {
		params: { path },
		fetch: globalThis.fetch,
		url: new URL("http://localhost"),
		depends: () => {},
	};
}

describe("load", () => {
	test("returns files and breadcrumbs for a single folder", async () => {
		// First call: folder metadata
		mockGET.mockResolvedValueOnce({
			data: { data: { name: "Documents" } },
			error: undefined,
		} as never);
		// Second call: list files
		mockGET.mockResolvedValueOnce({
			data: { data: [{ id: "file-1", name: "readme.md" }] },
			error: undefined,
		} as never);

		const result = await load(createLoadEvent("folder-abc") as never);
		expect(result).toEqual({
			files: {
				data: [{ id: "file-1", name: "readme.md" }],
				err: undefined,
			},
			title: "Documents",
			folders: ["folder-abc"],
			crumbs: [
				{ title: "My Drive", href: "/browse" },
				{ title: "Documents", href: "/browse//folder-abc" },
			],
		});
	});

	test("returns files and breadcrumbs for nested folders", async () => {
		// First folder metadata
		mockGET.mockResolvedValueOnce({
			data: { data: { name: "Projects" } },
			error: undefined,
		} as never);
		// Second folder metadata
		mockGET.mockResolvedValueOnce({
			data: { data: { name: "Web App" } },
			error: undefined,
		} as never);
		// List files
		mockGET.mockResolvedValueOnce({
			data: { data: [{ id: "file-2", name: "index.ts" }] },
			error: undefined,
		} as never);

		const result = await load(createLoadEvent("folder-a/folder-b") as never);
		expect(result).toEqual({
			files: {
				data: [{ id: "file-2", name: "index.ts" }],
				err: undefined,
			},
			title: "Web App",
			folders: ["folder-a", "folder-b"],
			crumbs: [
				{ title: "My Drive", href: "/browse" },
				{ title: "Projects", href: "/browse//folder-a" },
				{ title: "Web App", href: "/browse/folder-a/folder-b" },
			],
		});
	});

	test("falls back to folder ID when metadata fetch fails", async () => {
		// Metadata error
		mockGET.mockResolvedValueOnce({
			data: undefined,
			error: { message: "Not found" },
		} as never);
		// List files
		mockGET.mockResolvedValueOnce({
			data: { data: [] },
			error: undefined,
		} as never);

		const result = await load(createLoadEvent("folder-xyz") as never);
		expect(result).toEqual({
			files: { data: [], err: undefined },
			title: "folder-xyz",
			folders: ["folder-xyz"],
			crumbs: [
				{ title: "My Drive", href: "/browse" },
				{ title: "folder-xyz", href: "/browse//folder-xyz" },
			],
		});
	});

	test("falls back to folder ID when metadata fetch throws", async () => {
		// Metadata throws
		mockGET.mockRejectedValueOnce(new Error("Network error"));
		// List files
		mockGET.mockResolvedValueOnce({
			data: { data: [] },
			error: undefined,
		} as never);

		const result = await load(createLoadEvent("folder-err") as never);
		expect(result).toEqual({
			files: { data: [], err: undefined },
			title: "folder-err",
			folders: ["folder-err"],
			crumbs: [
				{ title: "My Drive", href: "/browse" },
				{ title: "folder-err", href: "/browse//folder-err" },
			],
		});
	});

	test("throws 500 when list files API returns error", async () => {
		// Metadata succeeds
		mockGET.mockResolvedValueOnce({
			data: { data: { name: "Folder" } },
			error: undefined,
		} as never);
		// List files fails
		mockGET.mockResolvedValueOnce({
			data: undefined,
			error: { message: "Internal error" },
		} as never);

		expect(load(createLoadEvent("folder-abc") as never)).rejects.toThrow();
	});
});
