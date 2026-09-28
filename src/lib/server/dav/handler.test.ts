import { describe, expect, test } from "bun:test";
import type { UpdateFile } from "#lib/server/schema.js";
import type { TreeEntry } from "#lib/server/services/storage/listings.js";
import { type DavService, handleDav, newSaveMemo } from "./handler";
import { parseDavPath } from "./location";

function entry(
	type: "file" | "folder",
	path: string,
	extra: Partial<TreeEntry> = {},
): TreeEntry {
	return {
		type,
		id: path,
		name: path.split("/").pop() ?? path,
		path,
		size: type === "file" ? 5 : 0,
		updatedAt: new Date("2026-01-02T03:04:05Z"),
		contentType: type === "file" ? "text/plain" : "httpd/unix-directory",
		...extra,
	};
}

const parentOf = (p: string) =>
	p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : "";
const join = (parent: string | undefined, name: string) =>
	parent ? `${parent}/${name}` : name;

/** A named tree in memory: a path is its names joined, as on a volume. */
function fakeTree(
	initial: TreeEntry[],
	options: { createdName?: string } = {},
) {
	const entries = [...initial];
	const calls: string[] = [];
	const find = (path: string) => entries.find((e) => e.path === path);
	const children = (p: string) => entries.filter((e) => parentOf(e.path) === p);
	const drop = (path: string) => {
		const doomed = entries.filter(
			(e) => e.path === path || e.path.startsWith(`${path}/`),
		);
		for (const e of doomed) {
			entries.splice(entries.indexOf(e), 1);
		}
	};
	const relocate = (e: TreeEntry, path: string, name = e.name) => {
		e.name = name;
		e.path = path;
	};
	const service = {
		treeEntries: async (p: string) =>
			p === "" || find(p)?.type === "folder" ? children(p) : null,
		treeEntry: async (p: string, name: string) =>
			children(p).find((e) => e.name.toLowerCase() === name.toLowerCase()) ??
			null,
		treeEntryById: async (type: string, id: string) =>
			entries.find((e) => e.type === type && e.id === id) ?? null,
		handleRawFile: async (path: string) =>
			new Response(`bytes of ${path}`, {
				headers: { "content-length": String(`bytes of ${path}`.length) },
			}),
		createFile: async ({ name }: { name: string }, folder?: string) => {
			const finalName = options.createdName ?? name;
			const e = entry("file", join(folder, finalName), { size: 0 });
			entries.push(e);
			calls.push(`create ${e.path}`);
			return { id: e.id, finalName: e.path, metadata: { name: finalName } };
		},
		uploadFileBody: async (
			id: string,
			body: Uint8Array,
			opts?: { snapshot?: boolean; modifiedAt?: Date },
		) => {
			calls.push(
				`upload ${id} bytes=${body.byteLength} snapshot=${opts?.snapshot} mtime=${opts?.modifiedAt?.toISOString()}`,
			);
		},
		deleteFile: async (path: string) => {
			calls.push(`delete ${path}`);
			drop(path);
		},
		updateFile: async (path: string, data: UpdateFile) => {
			calls.push(`update ${path} ${JSON.stringify(data)}`);
			const e = find(path);
			if (e && data.isTrashed) {
				drop(path);
			} else if (e && data.key) {
				relocate(e, join(parentOf(path), data.key), data.key);
			}
		},
		trashFolder: async (path: string) => {
			calls.push(`trash ${path}`);
			drop(path);
		},
		createFolder: async (name: string, parent?: string) => {
			const e = entry("folder", join(parent, name));
			entries.push(e);
			calls.push(`mkdir ${e.path}`);
			return { id: e.id, name, path: e.path };
		},
		deleteFolder: async (path: string) => {
			calls.push(`rmdir ${path}`);
			drop(path);
		},
		moveFile: async (path: string, dest: string) => {
			calls.push(`move ${path} -> ${dest}`);
			const e = find(path);
			if (e) {
				relocate(e, join(dest, e.name));
			}
		},
		moveFolder: async (path: string, dest: string) => {
			calls.push(`move ${path} -> ${dest}`);
			const e = find(path);
			if (e) {
				relocate(e, join(dest, e.name));
			}
		},
		updateFolderMeta: async (path: string, data: { name?: string }) => {
			calls.push(`update ${path} ${JSON.stringify(data)}`);
			const e = find(path);
			if (e && data.name) {
				relocate(e, join(parentOf(path), data.name), data.name);
			}
		},
		replaceFile: async (targetId: string, sourceId: string) => {
			calls.push(`replace ${targetId} <- ${sourceId}`);
			const source = entries.find((e) => e.id === sourceId);
			if (source) {
				drop(source.path);
			}
			return true;
		},
	};
	return {
		service: service as unknown as DavService,
		calls,
		entries,
		memo: newSaveMemo(),
	};
}

type Tree = ReturnType<typeof fakeTree>;

function dav(tree: Tree, method: string, path: string, init: RequestInit = {}) {
	const url = `http://app.test${path}`;
	const loc = parseDavPath(new URL(url).pathname);
	if (!loc) {
		throw new Error(`not a DAV path: ${path}`);
	}
	return handleDav(
		new Request(url, { method, ...init }),
		tree.service,
		loc,
		tree.memo,
	);
}

const music = () =>
	fakeTree([entry("folder", "Music"), entry("file", "Music/Take 1+2.wav")]);

describe("OPTIONS", () => {
	test("advertises class 2", async () => {
		const res = await dav(music(), "OPTIONS", "/dav/me/");
		expect(res.status).toBe(200);
		expect(res.headers.get("dav")).toBe("1, 2");
		expect(res.headers.get("allow")).toContain("PROPFIND");
	});
});

describe("PROPFIND", () => {
	test("depth 1 lists the folder and its children, hrefs encoded", async () => {
		const res = await dav(music(), "PROPFIND", "/dav/me/Music", {
			headers: { depth: "1" },
		});
		expect(res.status).toBe(207);
		const body = await res.text();
		expect(body).toContain("<d:href>/dav/me/Music/</d:href>");
		expect(body).toContain("<d:href>/dav/me/Music/Take%201%2B2.wav</d:href>");
		expect(body).toContain("<d:getcontentlength>5</d:getcontentlength>");
		expect(body).toContain("<d:collection/>");
		expect(body).toContain("Fri, 02 Jan 2026 03:04:05 GMT");
	});

	test("a name resolves in any case; hrefs echo what the client asked", async () => {
		const res = await dav(music(), "PROPFIND", "/dav/me/music", {
			headers: { depth: "0" },
		});
		expect(res.status).toBe(207);
		expect(await res.text()).toContain("<d:href>/dav/me/music/</d:href>");
	});

	test("depth 0 is the item alone", async () => {
		const res = await dav(music(), "PROPFIND", "/dav/me/Music/", {
			headers: { depth: "0" },
		});
		expect(await res.text()).not.toContain("Take");
	});

	test("the root, infinity and a missing item", async () => {
		const tree = music();
		expect(
			(await dav(tree, "PROPFIND", "/dav/me/", { headers: { depth: "1" } }))
				.status,
		).toBe(207);
		expect(
			(
				await dav(tree, "PROPFIND", "/dav/me/", {
					headers: { depth: "infinity" },
				})
			).status,
		).toBe(403);
		expect((await dav(tree, "PROPFIND", "/dav/me/nope")).status).toBe(404);
	});
});

describe("GET and HEAD", () => {
	test("a file streams its bytes; HEAD sends the headers alone", async () => {
		const get = await dav(music(), "GET", "/dav/me/Music/Take%201%2B2.wav");
		expect(await get.text()).toBe("bytes of Music/Take 1+2.wav");

		const head = await dav(music(), "HEAD", "/dav/me/Music/Take%201%2B2.wav");
		expect(head.body).toBeNull();
		expect(head.headers.get("content-length")).toBe("27");
	});

	test("a folder is not a GET", async () => {
		expect((await dav(music(), "GET", "/dav/me/Music/")).status).toBe(405);
	});
});

describe("PUT", () => {
	test("a new file is created, then filled, dated from X-OC-Mtime", async () => {
		const tree = music();
		const res = await dav(tree, "PUT", "/dav/me/Music/new.txt", {
			body: "hello",
			headers: { "x-oc-mtime": "1767225600" },
		});
		expect(res.status).toBe(201);
		expect(res.headers.get("x-oc-mtime")).toBe("accepted");
		expect(tree.calls).toEqual([
			"create Music/new.txt",
			"upload Music/new.txt bytes=5 snapshot=false mtime=2026-01-01T00:00:00.000Z",
		]);
	});

	test("an existing name, in any case, is overwritten and versioned", async () => {
		const tree = music();
		const res = await dav(tree, "PUT", "/dav/me/Music/TAKE%201%2B2.WAV", {
			body: "new",
		});
		expect(res.status).toBe(204);
		expect(tree.calls).toEqual([
			"upload Music/Take 1+2.wav bytes=3 snapshot=true mtime=undefined",
		]);
	});

	test("a missing parent is a conflict", async () => {
		const tree = music();
		expect(
			(await dav(tree, "PUT", "/dav/me/Nope/a.txt", { body: "x" })).status,
		).toBe(409);
		expect(tree.calls).toEqual([]);
	});

	test("a name the service would have suffixed is undone", async () => {
		const tree = fakeTree([], { createdName: "a (1).txt" });
		expect(
			(await dav(tree, "PUT", "/dav/me/a.txt", { body: "x" })).status,
		).toBe(409);
		expect(tree.calls).toEqual(["create a (1).txt", "delete a (1).txt"]);
	});

	test("OS junk is accepted and dropped", async () => {
		const tree = music();
		expect(
			(await dav(tree, "PUT", "/dav/me/Music/._Take.wav", { body: "x" }))
				.status,
		).toBe(201);
		expect(
			(await dav(tree, "PUT", "/dav/me/.DS_Store", { body: "x" })).status,
		).toBe(201);
		expect(tree.calls).toEqual([]);
		expect((await dav(tree, "PROPFIND", "/dav/me/.DS_Store")).status).toBe(404);
	});
});

describe("MKCOL", () => {
	test("creates, refuses an existing name, a missing parent and a body", async () => {
		const tree = music();
		expect((await dav(tree, "MKCOL", "/dav/me/Music/Live")).status).toBe(201);
		expect(tree.calls).toEqual(["mkdir Music/Live"]);
		expect((await dav(tree, "MKCOL", "/dav/me/music")).status).toBe(405);
		expect((await dav(tree, "MKCOL", "/dav/me/Nope/x")).status).toBe(409);
		expect(
			(await dav(tree, "MKCOL", "/dav/me/y", { body: "<x/>" })).status,
		).toBe(415);
	});
});

describe("DELETE", () => {
	test("files and folders go to the trash", async () => {
		const tree = music();
		expect(
			(await dav(tree, "DELETE", "/dav/me/Music/Take%201%2B2.wav")).status,
		).toBe(204);
		expect((await dav(tree, "DELETE", "/dav/me/Music/")).status).toBe(204);
		expect(tree.calls).toEqual([
			'update Music/Take 1+2.wav {"isTrashed":true}',
			"trash Music",
		]);
	});

	test("the root is refused, a missing item is 404", async () => {
		expect((await dav(music(), "DELETE", "/dav/me/")).status).toBe(403);
		expect((await dav(music(), "DELETE", "/dav/me/nope")).status).toBe(404);
	});
});

const two = () =>
	fakeTree([
		entry("folder", "Music"),
		entry("file", "a.txt"),
		entry("file", "Music/a.txt"),
	]);

function move(
	tree: Tree,
	from: string,
	to: string,
	headers: Record<string, string> = {},
) {
	return dav(tree, "MOVE", from, { headers: { destination: to, ...headers } });
}

describe("MOVE", () => {
	test("a rename in place is a rename, not a move", async () => {
		const tree = two();
		expect(
			(await move(tree, "/dav/me/a.txt", "http://app.test/dav/me/b.txt"))
				.status,
		).toBe(201);
		expect(tree.calls).toEqual(['update a.txt {"key":"b.txt"}']);
	});

	test("onto an existing file is a save: the destination keeps its row", async () => {
		const tree = two();
		const res = await move(tree, "/dav/me/a.txt", "/dav/me/Music/a.txt");
		expect(res.status).toBe(204);
		expect(tree.calls).toEqual(["replace Music/a.txt <- a.txt"]);
	});

	test("onto a folder, or a folder onto anything, trashes the destination", async () => {
		const tree = fakeTree([
			entry("folder", "Music"),
			entry("folder", "Old"),
			entry("folder", "Music/Old"),
			entry("file", "x"),
		]);
		expect(
			(await move(tree, "/dav/me/Old/", "/dav/me/Music/Old/")).status,
		).toBe(204);
		expect(tree.calls).toEqual(["trash Music/Old", "move Old -> Music"]);
	});

	test("into a folder, renamed on the way", async () => {
		const again = fakeTree([entry("folder", "Music"), entry("file", "a.txt")]);
		await move(again, "/dav/me/a.txt", "/dav/me/Music/c%20d.txt");
		expect(again.calls).toEqual([
			"move a.txt -> Music",
			'update Music/a.txt {"key":"c d.txt"}',
		]);
	});

	test("Overwrite: F keeps the destination", async () => {
		const tree = two();
		const res = await move(tree, "/dav/me/a.txt", "/dav/me/Music/a.txt", {
			overwrite: "F",
		});
		expect(res.status).toBe(412);
		expect(tree.calls).toEqual([]);
	});

	test("a case-only rename does not trash the file it renames", async () => {
		const tree = two();
		expect((await move(tree, "/dav/me/a.txt", "/dav/me/A.txt")).status).toBe(
			201,
		);
		expect(tree.calls).toEqual(['update a.txt {"key":"A.txt"}']);
	});

	test("a folder moves and renames through the folder calls", async () => {
		const tree = fakeTree([entry("folder", "Music"), entry("folder", "Old")]);
		await move(tree, "/dav/me/Old/", "/dav/me/Music/New/");
		expect(tree.calls).toEqual([
			"move Old -> Music",
			'update Music/Old {"name":"New"}',
		]);
	});

	test("refusals", async () => {
		const tree = fakeTree([entry("folder", "Music"), entry("file", "a.txt")]);
		expect(
			(await move(tree, "/dav/me/Music/", "/dav/me/Music/Sub/")).status,
		).toBe(403);
		expect(
			(await move(tree, "/dav/me/a.txt", "/dav/drives/x/a.txt")).status,
		).toBe(502);
		expect(
			(await move(tree, "/dav/me/a.txt", "/dav/me/Nope/a.txt")).status,
		).toBe(409);
		expect((await move(tree, "/dav/me/nope", "/dav/me/b")).status).toBe(404);
		expect((await dav(tree, "MOVE", "/dav/me/a.txt")).status).toBe(400);
		expect(tree.calls).toEqual([]);
	});

	test("the Destination's host is not compared: ORIGIN names one host, clients use others", async () => {
		const https = two();
		expect(
			(await move(https, "/dav/me/a.txt", "https://app.test/dav/me/b.txt"))
				.status,
		).toBe(201);
		const lan = two();
		expect(
			(
				await move(
					lan,
					"/dav/me/a.txt",
					"http://192.168.1.20:3000/dav/me/b.txt",
				)
			).status,
		).toBe(201);
	});
});

describe("locks and properties", () => {
	test("LOCK hands out a token, UNLOCK accepts it", async () => {
		const res = await dav(music(), "LOCK", "/dav/me/Music/new.txt", {
			body: '<?xml version="1.0"?><d:lockinfo xmlns:d="DAV:"/>',
		});
		expect(res.status).toBe(200);
		const token = res.headers.get("lock-token") ?? "";
		expect(token).toMatch(/^<opaquelocktoken:[0-9a-f-]+>$/);
		expect(await res.text()).toContain(token.slice(1, -1));
		expect((await dav(music(), "UNLOCK", "/dav/me/Music/new.txt")).status).toBe(
			204,
		);
	});

	test("PROPPATCH echoes each property as set, in the client's namespaces", async () => {
		const body =
			'<?xml version="1.0"?><D:propertyupdate xmlns:D="DAV:" xmlns:Z="urn:schemas-microsoft-com:"><D:set><D:prop><Z:Win32LastModifiedTime>Thu, 01 Jan 2026 00:00:00 GMT</Z:Win32LastModifiedTime></D:prop></D:set></D:propertyupdate>';
		const res = await dav(music(), "PROPPATCH", "/dav/me/Music/", { body });
		expect(res.status).toBe(207);
		const xml = await res.text();
		expect(xml).toContain('xmlns:Z="urn:schemas-microsoft-com:"');
		expect(xml).toContain("<Z:Win32LastModifiedTime/>");
		expect(xml).toContain("HTTP/1.1 200 OK");
	});

	test("PROPPATCH with a body that is not XML is a 400", async () => {
		expect(
			(await dav(music(), "PROPPATCH", "/dav/me/", { body: "not xml" })).status,
		).toBe(400);
	});

	test("PROPFIND advertises exclusive write locks", async () => {
		const res = await dav(music(), "PROPFIND", "/dav/me/", {
			headers: { depth: "0" },
		});
		expect(await res.text()).toContain("<d:supportedlock>");
	});
});

describe("Office's safe save", () => {
	test("rename away, temp moved in, backup deleted: the original keeps its row", async () => {
		const tree = fakeTree([
			entry("folder", "Music"),
			entry("file", "Music/Report.docx"),
		]);
		await dav(tree, "PUT", "/dav/me/Music/~WRD0000.tmp", { body: "new" });
		await move(tree, "/dav/me/Music/Report.docx", "/dav/me/Music/~WRL0001.tmp");
		await move(tree, "/dav/me/Music/~WRD0000.tmp", "/dav/me/Music/Report.docx");
		tree.calls.length = 0;

		expect(
			(await dav(tree, "DELETE", "/dav/me/Music/~WRL0001.tmp")).status,
		).toBe(204);
		expect(tree.calls).toEqual([
			"replace Music/Report.docx <- Music/~WRD0000.tmp",
			'update Music/~WRL0001.tmp {"key":"Report.docx"}',
		]);
		const files = tree.entries.filter((e) => e.type === "file");
		expect(files.map((e) => [e.id, e.path])).toEqual([
			["Music/Report.docx", "Music/Report.docx"],
		]);
	});

	test("a rename and a move without that delete are left alone", async () => {
		const tree = fakeTree([entry("file", "a.txt"), entry("file", "c.txt")]);
		await move(tree, "/dav/me/a.txt", "/dav/me/b.txt");
		await move(tree, "/dav/me/c.txt", "/dav/me/a.txt");
		tree.calls.length = 0;
		await dav(tree, "DELETE", "/dav/me/a.txt");
		expect(tree.calls).toEqual(['update a.txt {"isTrashed":true}']);
	});
});
