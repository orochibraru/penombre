import { afterAll, afterEach, describe, expect, mock, test } from "bun:test";

import { getVolumes } from "#lib/server/config.js";
import {
	DriveAccessError,
	FileOrFolderNotFoundError,
	ReadOnlyVolumeError,
	StorageUnavailableError,
} from "#lib/server/errors.js";
import { wordDocument } from "#lib/server/office/test-utils.js";
import { drivesService } from "#lib/server/services/drives.js";
import * as storageFor from "#lib/server/services/storage-for.js";
import type { TreeEntry } from "#lib/server/services/storage/listings.js";
import { StorageService } from "#lib/server/services/storage/service.js";

const original = { ...storageFor };
let located: ((url: URL) => unknown) | undefined;

mock.module("#lib/server/services/storage-for.js", () => ({
	...original,
	storageServiceFor: (
		owner: Parameters<typeof original.storageServiceFor>[0],
		event: Parameters<typeof original.storageServiceFor>[1],
	) =>
		located
			? Promise.resolve(located(event.url))
			: original.storageServiceFor(owner, event),
}));

const { callTool, describeTools, refusalOf } = await import("./tools");
const { readGrant } = await import("./transfer");
const { ToolRefusal } = await import("./tool");
type Caller = import("./tool").Caller;

afterAll(() => {
	mock.module("#lib/server/services/storage-for.js", () => original);
});

const user = { id: "u1", name: "Ada" } as Caller["user"];
const caller: Caller = {
	user,
	owner: user,
	locals: { user } as App.Locals,
	url: new URL("http://penombre.test/mcp"),
};

const modified = new Date("2026-03-04T05:06:07Z");

function entry(
	type: "file" | "folder",
	path: string,
	contentType = type === "file" ? "text/plain" : "httpd/unix-directory",
): TreeEntry {
	return {
		type,
		id: `id:${path}`,
		name: path.split("/").pop() ?? path,
		path,
		size: 0,
		updatedAt: modified,
		contentType,
	};
}

const parentOf = (path: string) =>
	path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";

/** A named tree in memory, with each file's bytes. */
function fakeTree(
	files: Record<string, string | Uint8Array> = {},
	folders: string[] = [],
	types: Record<string, string> = {},
) {
	const entries: TreeEntry[] = folders.map((path) => entry("folder", path));
	const bytes = new Map<string, Uint8Array>();
	const calls: string[] = [];
	const put = (path: string, content: string | Uint8Array) => {
		const data =
			typeof content === "string" ? new TextEncoder().encode(content) : content;
		bytes.set(path, data);
		const existing = entries.find((candidate) => candidate.path === path);
		if (existing) {
			existing.size = data.byteLength;
			return existing;
		}
		const created = entry("file", path, types[path]);
		created.size = data.byteLength;
		entries.push(created);
		return created;
	};
	for (const [path, content] of Object.entries(files)) {
		put(path, content);
	}
	const children = (path: string) =>
		entries.filter((candidate) => parentOf(candidate.path) === path);
	const service = {
		treeEntries: async (path: string) => children(path),
		treeEntry: async (path: string, name: string) =>
			children(path).find(
				(candidate) => candidate.name.toLowerCase() === name.toLowerCase(),
			) ?? null,
		treeEntryById: async (type: string, id: string) =>
			entries.find(
				(candidate) => candidate.type === type && candidate.id === id,
			) ?? null,
		openRawFile: async (path: string) => {
			const data = bytes.get(path);
			if (!data) {
				return null;
			}
			return {
				size: data.byteLength,
				stream: async (start = 0, end = data.byteLength - 1) =>
					new Response(data.slice(start, end + 1)).body as ReadableStream,
			};
		},
		getRawFileData: async (path: string) => {
			const data = bytes.get(path);
			return data ? { buffer: data.buffer } : null;
		},
		createFile: async ({ name }: { name: string }, folder?: string) => {
			const path = folder ? `${folder}/${name}` : name;
			const created = put(path, new Uint8Array());
			calls.push(`create ${path}`);
			return { id: created.id, finalName: path, metadata: { name } };
		},
		uploadFileBody: async (id: string, body: Uint8Array) => {
			const target = entries.find((candidate) => candidate.id === id);
			if (target) {
				put(target.path, body);
			}
			calls.push(`upload ${target?.path} ${new TextDecoder().decode(body)}`);
		},
		deleteFile: async (path: string) => {
			calls.push(`delete ${path}`);
		},
		createFolder: async (name: string, parent?: string) => {
			const path = parent ? `${parent}/${name}` : name;
			entries.push(entry("folder", path));
			calls.push(`mkdir ${path}`);
			return { name, path };
		},
		deleteFolder: async (path: string) => {
			calls.push(`rmdir ${path}`);
		},
		moveFile: async (path: string, parent: string) => {
			const moved = entries.find((candidate) => candidate.path === path);
			if (moved) {
				moved.path = parent ? `${parent}/${moved.name}` : moved.name;
			}
			calls.push(`move ${path} -> ${parent}`);
		},
		moveFolder: async (path: string, parent: string) => {
			calls.push(`move folder ${path} -> ${parent}`);
		},
		updateFile: async (path: string, update: Record<string, unknown>) => {
			calls.push(`update ${path} ${JSON.stringify(update)}`);
		},
		updateFolderMeta: async (path: string, update: Record<string, unknown>) => {
			calls.push(`update folder ${path} ${JSON.stringify(update)}`);
		},
		trashFolder: async (path: string) => {
			calls.push(`trash folder ${path}`);
		},
	};
	return { service, calls, bytes };
}

function serve(tree: ReturnType<typeof fakeTree>) {
	located = () => tree.service;
}

async function call(name: string, args: unknown) {
	const result = await callTool(name, args, caller);
	if (!result) {
		throw new Error(`no tool ${name}`);
	}
	return result;
}

function textOf(result: { content: { type: string; text?: string }[] }) {
	const [first] = result.content;
	return first?.type === "text" ? (first.text ?? "") : "";
}

const listForUser = drivesService.listForUser;
const requireAccess = drivesService.requireAccess;
const searchFiles = StorageService.prototype.searchFiles;
const folderNames = StorageService.prototype.folderNames;

afterEach(() => {
	located = undefined;
	drivesService.listForUser = listForUser;
	drivesService.requireAccess = requireAccess;
	StorageService.prototype.searchFiles = searchFiles;
	StorageService.prototype.folderNames = folderNames;
});

describe("the tool list", () => {
	test("describes every tool with a JSON schema and hints", () => {
		const tools = describeTools();
		expect(tools.map((tool) => tool.name)).toEqual([
			"list_places",
			"list_folder",
			"search",
			"read_file",
			"download_link",
			"write_file",
			"edit_file",
			"upload_link",
			"create_folder",
			"move",
			"trash",
		]);
		const write = tools.find((tool) => tool.name === "write_file");
		expect(write?.annotations.readOnlyHint).toBe(false);
		expect(write?.inputSchema).toMatchObject({
			type: "object",
			required: ["path", "content"],
		});
	});

	test("an unknown tool is undefined, bad arguments an error result", async () => {
		expect(await callTool("format_disk", {}, caller)).toBeUndefined();
		const result = await call("read_file", { path: 3 });
		expect(result.isError).toBe(true);
		expect(textOf(result)).toContain("path");
	});

	test("storage refusals read as messages, anything else does not", () => {
		expect(refusalOf(new ToolRefusal("nope"))).toBe("nope");
		expect(refusalOf(new DriveAccessError(404, "x"))).toStartWith(
			"No such place.",
		);
		expect(refusalOf(new FileOrFolderNotFoundError("x"))).toStartWith(
			"Nothing at that path.",
		);
		expect(refusalOf(new ReadOnlyVolumeError("x"))).toBe(
			"That place is read-only.",
		);
		expect(refusalOf(new StorageUnavailableError("x"))).toBe(
			"That place cannot be reached right now.",
		);
		expect(refusalOf(new Error("boom"))).toBeUndefined();
	});

	test("a crash inside a tool is an internal error, not a throw", async () => {
		located = () => {
			throw new Error("database down");
		};
		const result = await call("list_folder", { path: "/me" });
		expect(result).toEqual({
			content: [{ type: "text", text: "Internal error" }],
			isError: true,
		});
	});

	test("a place the caller cannot open is refused as a result", async () => {
		located = () => {
			throw new DriveAccessError(404, "No such drive");
		};
		const result = await call("list_folder", { path: "/drives/nope" });
		expect(result.isError).toBe(true);
		expect(textOf(result)).toStartWith("No such place.");
	});
});

describe("locating a path", () => {
	test("a path outside the three places is refused", async () => {
		serve(fakeTree());
		for (const path of ["/elsewhere/a", "/drives", "/me/../x"]) {
			const result = await call("list_folder", { path });
			expect(result.isError).toBe(true);
			expect(textOf(result)).toStartWith("Not a Penombre path");
		}
	});

	test("the place's query reaches the storage factory", async () => {
		const seen: string[] = [];
		const tree = fakeTree({ "a.txt": "hi" });
		located = (url) => {
			seen.push(url.search);
			return tree.service;
		};
		await call("list_folder", { path: "/drives/d%201" });
		await call("list_folder", { path: "volumes/music/" });
		await call("list_folder", { path: "/me" });
		expect(seen).toEqual(["?drive=d%201", "?volume=music", ""]);
	});
});

describe("list_places", () => {
	test("lists the drive, each shared drive and each volume", async () => {
		drivesService.listForUser = (async () => [
			{ id: "d1", name: "Band" },
		]) as never;
		(
			getVolumes as unknown as { mockReturnValueOnce: (value: unknown) => void }
		).mockReturnValueOnce([
			{ name: "music", label: "Music library", path: "/mnt/music" },
		]);
		const result = await call("list_places", {});
		expect(JSON.parse(textOf(result))).toEqual([
			{ path: "/me", name: "My Drive" },
			{ path: "/drives/d1", name: "Band" },
			{ path: "/volumes/music", name: "Music library" },
		]);
	});
});

describe("list_folder", () => {
	test("lists children with sizes for files only", async () => {
		serve(
			fakeTree({ "Music/take.wav": "RIFF" }, ["Music", "Music/Stems"], {
				"Music/take.wav": "audio/wav",
			}),
		);
		const result = await call("list_folder", { path: "/me/Music/" });
		expect(JSON.parse(textOf(result))).toEqual([
			{
				path: "/me/Music/Stems",
				type: "folder",
				modified: modified.toISOString(),
			},
			{
				path: "/me/Music/take.wav",
				type: "file",
				size: 4,
				contentType: "audio/wav",
				modified: modified.toISOString(),
			},
		]);
	});

	test("refuses a file, a missing path and app internals", async () => {
		serve(fakeTree({ "a.txt": "hi" }, [".versions"]));
		expect(textOf(await call("list_folder", { path: "/me/a.txt" }))).toBe(
			"That is a file; use read_file.",
		);
		expect(
			textOf(await call("list_folder", { path: "/me/missing" })),
		).toStartWith("Nothing at that path.");
		expect(
			textOf(await call("list_folder", { path: "/me/.versions" })),
		).toStartWith("Nothing at that path.");
	});
});

describe("read_file", () => {
	test("returns text as text", async () => {
		serve(fakeTree({ "Notes/todo.md": "# Todo\n- milk" }, ["Notes"]));
		const result = await call("read_file", { path: "/me/Notes/todo.md" });
		expect(result.isError).toBeUndefined();
		expect(textOf(result)).toBe("# Todo\n- milk");
	});

	test("an empty file is empty text", async () => {
		serve(fakeTree({ "empty.txt": "" }));
		expect(textOf(await call("read_file", { path: "/me/empty.txt" }))).toBe("");
	});

	test("truncates text past a megabyte and says so", async () => {
		serve(fakeTree({ "big.log": "x".repeat(1024 * 1024 + 10) }));
		const shown = textOf(await call("read_file", { path: "/me/big.log" }));
		expect(shown).toEndWith(
			`[Truncated: first ${1024 * 1024} of ${1024 * 1024 + 10} bytes]`,
		);
		expect(shown.startsWith("x".repeat(1024 * 1024))).toBe(true);
	});

	test("describes a binary file instead of returning it", async () => {
		serve(
			fakeTree({ "clip.bin": new Uint8Array([1, 0, 2]) }, [], {
				"clip.bin": "application/octet-stream",
			}),
		);
		expect(textOf(await call("read_file", { path: "/me/clip.bin" }))).toBe(
			"clip.bin: application/octet-stream, 3 bytes. Binary; use download_link for its bytes.",
		);
	});

	test("returns a picture as an image", async () => {
		const png = new Uint8Array([137, 80, 78, 71]);
		serve(fakeTree({ "pic.png": png }, [], { "pic.png": "image/png" }));
		const result = await call("read_file", { path: "/me/pic.png" });
		expect(result.content).toEqual([
			{
				type: "image",
				data: Buffer.from(png).toString("base64"),
				mimeType: "image/png",
			},
		]);
	});

	test("a picture over 5 MB is described, not sent", async () => {
		const tree = fakeTree({ "huge.jpg": "" }, [], { "huge.jpg": "image/jpeg" });
		const [only] = await tree.service.treeEntries("");
		if (only) {
			only.size = 6 * 1024 * 1024;
		}
		serve(tree);
		expect(textOf(await call("read_file", { path: "/me/huge.jpg" }))).toBe(
			`huge.jpg: image/jpeg, ${6 * 1024 * 1024} bytes. Too large to return; use download_link.`,
		);
	});

	test("a picture whose bytes vanished is refused", async () => {
		const tree = fakeTree({ "pic.png": "x" }, [], { "pic.png": "image/png" });
		tree.bytes.clear();
		serve(tree);
		expect(
			textOf(await call("read_file", { path: "/me/pic.png" })),
		).toStartWith("Nothing at that path.");
	});

	test("a text file whose bytes vanished is refused", async () => {
		const tree = fakeTree({ "a.txt": "x" });
		tree.bytes.clear();
		serve(tree);
		expect(textOf(await call("read_file", { path: "/me/a.txt" }))).toStartWith(
			"Nothing at that path.",
		);
	});

	test("reads a Word document as HTML", async () => {
		serve(
			fakeTree({
				"Report.docx": new Uint8Array(
					wordDocument({ body: "<w:p><w:r><w:t>Hello Word</w:t></w:r></w:p>" }),
				),
			}),
		);
		const shown = textOf(await call("read_file", { path: "/me/Report.docx" }));
		expect(shown).toContain("Hello Word");
		expect(shown).toContain("<p");
	});

	test("refuses a folder", async () => {
		serve(fakeTree({}, ["Docs"]));
		expect(textOf(await call("read_file", { path: "/me/Docs" }))).toBe(
			"That is a folder; use list_folder.",
		);
	});
});

describe("download_link and upload_link", () => {
	test("a download link carries a GET grant for the file", async () => {
		serve(
			fakeTree({ "Videos/clip.mp4": "data" }, ["Videos"], {
				"Videos/clip.mp4": "video/mp4",
			}),
		);
		const answer = JSON.parse(
			textOf(await call("download_link", { path: "me/Videos/clip.mp4/" })),
		);
		expect(answer).toMatchObject({ size: 4, contentType: "video/mp4" });
		const token = new URL(answer.url).searchParams.get("token");
		expect(readGrant(token, "GET")).toMatchObject({
			user: "u1",
			owner: "u1",
			path: "/me/Videos/clip.mp4",
			method: "GET",
		});
	});

	test("an upload link needs an existing folder and a name", async () => {
		serve(fakeTree({}, ["Videos"]));
		const answer = JSON.parse(
			textOf(await call("upload_link", { path: "/me/Videos/edit.mp4" })),
		);
		const token = new URL(answer.url).searchParams.get("token");
		expect(readGrant(token, "PUT")).toMatchObject({
			path: "/me/Videos/edit.mp4",
			method: "PUT",
		});
		expect(
			textOf(await call("upload_link", { path: "/me/Nope/edit.mp4" })),
		).toBe("The parent folder does not exist.");
		expect(textOf(await call("upload_link", { path: "/me" }))).toBe(
			"The path must end with a name.",
		);
	});
});

describe("search", () => {
	test("finds across places, skips trash and a place that fails", async () => {
		drivesService.listForUser = (async () => [
			{ id: "d1", name: "Band" },
		]) as never;
		drivesService.requireAccess = (async () => {
			throw new DriveAccessError(404, "gone");
		}) as never;
		StorageService.prototype.searchFiles = (async () => ({
			list: [
				{
					key: "take.wav",
					type: "file",
					size: 9,
					parentKey: "f1/f2",
					updatedAt: "2026-01-01T00:00:00.000Z",
					metadata: { name: "take.wav", isTrashed: false },
				},
				{
					key: "Stems/",
					type: "folder",
					size: 0,
					updatedAt: "2026-01-02T00:00:00.000Z",
					metadata: { isTrashed: false },
				},
				{
					key: "old.wav",
					type: "file",
					size: 1,
					metadata: { name: "old.wav", isTrashed: true },
				},
			],
		})) as never;
		StorageService.prototype.folderNames = (async () =>
			new Map([
				["f1", "Music"],
				["f1/f2", "Live"],
			])) as never;
		const result = await call("search", { query: "a", limit: 5 });
		expect(JSON.parse(textOf(result))).toEqual([
			{
				path: "/me/Music/Live/take.wav",
				type: "file",
				size: 9,
				modified: "2026-01-01T00:00:00.000Z",
			},
			{
				path: "/me/Stems",
				type: "folder",
				modified: "2026-01-02T00:00:00.000Z",
			},
		]);
	});

	test("stops at the limit and refuses an empty query", async () => {
		drivesService.listForUser = (async () => []) as never;
		StorageService.prototype.searchFiles = (async () => ({
			list: ["a", "b", "c"].map((name) => ({
				key: name,
				type: "file",
				size: 1,
				metadata: { name, isTrashed: false },
			})),
		})) as never;
		StorageService.prototype.folderNames = (async () => new Map()) as never;
		const found = JSON.parse(
			textOf(await call("search", { query: "x", limit: 2 })),
		);
		expect(found.map((hit: { path: string }) => hit.path)).toEqual([
			"/me/a",
			"/me/b",
		]);
		expect((await call("search", { query: "" })).isError).toBe(true);
	});
});

describe("write_file", () => {
	test("creates a file, then replaces it", async () => {
		const tree = fakeTree({}, ["Notes"]);
		serve(tree);
		expect(
			textOf(
				await call("write_file", {
					path: "/me/Notes/todo.md",
					content: "one",
				}),
			),
		).toBe("Created /me/Notes/todo.md");
		expect(
			textOf(
				await call("write_file", {
					path: "/me/Notes/todo.md",
					content: "two",
				}),
			),
		).toBe("Replaced /me/Notes/todo.md");
		expect(new TextDecoder().decode(tree.bytes.get("Notes/todo.md"))).toBe(
			"two",
		);
	});

	test("decodes base64 content", async () => {
		const tree = fakeTree();
		serve(tree);
		await call("write_file", {
			path: "/me/pic.png",
			content: Buffer.from([1, 2, 3]).toString("base64"),
			encoding: "base64",
		});
		expect([...(tree.bytes.get("pic.png") ?? [])]).toEqual([1, 2, 3]);
	});

	test("refuses office text, a folder, a missing folder and big content", async () => {
		serve(fakeTree({}, ["Docs"]));
		const refusal = async (args: Record<string, string>) =>
			textOf(await call("write_file", args));
		expect(await refusal({ path: "/me/Docs/a.docx", content: "x" })).toBe(
			"Office files cannot be written as text; upload the file itself.",
		);
		expect(await refusal({ path: "/me/Docs", content: "x" })).toBe(
			"A folder already has that name.",
		);
		expect(await refusal({ path: "/me/Nope/a.txt", content: "x" })).toBe(
			"The folder does not exist, or the name is taken by another casing of it.",
		);
		expect(
			await refusal({
				path: "/me/a.bin",
				content: "x".repeat(10 * 1024 * 1024 + 1),
			}),
		).toBe("Too large to send inline; use upload_link.");
		expect(await refusal({ path: "/me/.DS_Store", content: "x" })).toBe(
			"The path must end with a name.",
		);
	});
});

describe("edit_file", () => {
	test("replaces the one occurrence", async () => {
		const tree = fakeTree({ "main.ts": "const a = 1;\nconst b = 2;\n" });
		serve(tree);
		const result = await call("edit_file", {
			path: "/me/main.ts",
			old_text: "b = 2",
			new_text: "b = $&3",
		});
		expect(textOf(result)).toBe("Edited /me/main.ts");
		expect(new TextDecoder().decode(tree.bytes.get("main.ts"))).toBe(
			"const a = 1;\nconst b = $&3;\n",
		);
	});

	test("refuses missing, repeated and binary targets", async () => {
		serve(
			fakeTree({
				"a.txt": "one one",
				"b.bin": new Uint8Array([0, 1]),
			}),
		);
		const edit = async (path: string, before: string) =>
			textOf(
				await call("edit_file", { path, old_text: before, new_text: "z" }),
			);
		expect(await edit("/me/a.txt", "two")).toBe("old_text was not found.");
		expect(await edit("/me/a.txt", "one")).toBe(
			"old_text occurs 2 times; include more context.",
		);
		expect(await edit("/me/b.bin", "x")).toStartWith(
			"Only text files up to 1 MB",
		);
	});
});

describe("create_folder", () => {
	test("creates one folder and refuses what cannot be", async () => {
		const tree = fakeTree({}, ["Projects"]);
		serve(tree);
		expect(
			textOf(await call("create_folder", { path: "/me/Projects/2026" })),
		).toBe("Created /me/Projects/2026");
		expect(tree.calls).toContain("mkdir Projects/2026");
		expect(textOf(await call("create_folder", { path: "/me/projects" }))).toBe(
			"Something already has that name.",
		);
		expect(textOf(await call("create_folder", { path: "/me/Nope/2026" }))).toBe(
			"The parent folder does not exist.",
		);
	});
});

describe("move", () => {
	test("moves and renames within a place", async () => {
		const tree = fakeTree({ "Inbox/draft.txt": "x" }, ["Inbox", "Notes"]);
		serve(tree);
		const result = await call("move", {
			from: "/me/Inbox/draft.txt",
			to: "/me/Notes/final.txt",
		});
		expect(textOf(result)).toBe(
			"Moved /me/Inbox/draft.txt to /me/Notes/final.txt",
		);
		expect(tree.calls).toEqual([
			"move Inbox/draft.txt -> Notes",
			'update Notes/draft.txt {"key":"final.txt"}',
		]);
	});

	test("refuses across places, into itself and onto something", async () => {
		serve(fakeTree({ "a.txt": "x", "b.txt": "y" }, ["Folder"]));
		const moveOf = async (from: string, to: string) =>
			textOf(await call("move", { from, to }));
		expect(await moveOf("/me/a.txt", "/drives/d1/a.txt")).toStartWith(
			"Moving between places is not supported",
		);
		expect(await moveOf("/me/Folder", "/me/Folder/Inner")).toBe(
			"A folder cannot move into itself.",
		);
		expect(await moveOf("/me/a.txt", "/me/b.txt")).toBe(
			"Something is already at the destination.",
		);
		expect(await moveOf("/me/a.txt", "/me/Nope/a.txt")).toBe(
			"The parent folder does not exist.",
		);
	});

	test("a case-only rename of the same item is allowed", async () => {
		const tree = fakeTree({ "a.txt": "x" });
		serve(tree);
		await call("move", { from: "/me/a.txt", to: "/me/A.txt" });
		expect(tree.calls).toEqual(['update a.txt {"key":"A.txt"}']);
	});
});

describe("trash", () => {
	test("trashes a file or a folder", async () => {
		const tree = fakeTree({ "old.txt": "x" }, ["Old"]);
		serve(tree);
		expect(textOf(await call("trash", { path: "/me/old.txt" }))).toBe(
			"Trashed /me/old.txt",
		);
		await call("trash", { path: "/me/Old" });
		expect(tree.calls).toEqual([
			'update old.txt {"isTrashed":true}',
			"trash folder Old",
		]);
		expect((await call("trash", { path: "/me/missing" })).isError).toBe(true);
	});
});
