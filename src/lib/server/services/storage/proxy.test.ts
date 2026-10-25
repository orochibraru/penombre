import { describe, expect, test } from "bun:test";

import {
	FileOrFolderNotFoundError,
	UnauthorizedError,
} from "#lib/server/errors.js";

import { ProxyService } from "./proxy";

/**
 * The row's size is client-declared on create and only corrected once the body
 * lands, so it can outlive the truth. These pin the response to the bytes.
 */
function proxyFor(
	dbSize: number,
	diskSize: number,
	renditions: { exists: () => boolean; key: () => string } = {
		exists: () => false,
		key: () => "",
	},
	opened: string[] = [],
) {
	const ctx = {
		user: { id: "u1" },
		db: {
			select: () => ({
				from: () => ({
					where: async () => [
						{
							name: "track.wav",
							path: "track.wav",
							size: dbSize,
							contentType: "audio/wav",
							updatedAt: new Date(0),
						},
					],
				}),
			}),
		},
		driver: {
			getObjectSize: async () => diskSize,
			getObjectStream: async (key: string) => {
				opened.push(key);
				return new ReadableStream<Uint8Array>();
			},
		},
	};
	return new ProxyService(
		ctx as never,
		{} as never,
		renditions as never,
		(() => {}) as never,
	);
}

describe("handleRawFile framing", () => {
	test("advertises the real byte size, not the stale row", async () => {
		const res = await proxyFor(85_600_000, 7_000_000).handleRawFile(
			"track.wav",
		);

		expect(res.headers.get("Content-Length")).toBe("7000000");
	});

	test("clamps an over-long range to the real end of the file", async () => {
		const res = await proxyFor(85_600_000, 7_000_000).handleRawFile(
			"track.wav",
			undefined,
			"bytes=0-85599999",
		);

		expect(res.status).toBe(206);
		expect(res.headers.get("Content-Range")).toBe("bytes 0-6999999/7000000");
		expect(res.headers.get("Content-Length")).toBe("7000000");
	});

	test("forces revalidation so a stale body cannot be replayed", async () => {
		const res = await proxyFor(7_000_000, 7_000_000).handleRawFile("track.wav");

		expect(res.headers.get("Cache-Control")).toBe("private, no-cache");
	});

	test("a suffix range is the file's tail, not its head", async () => {
		const res = await proxyFor(1000, 1000).handleRawFile(
			"track.wav",
			undefined,
			"bytes=-100",
		);

		expect(res.headers.get("Content-Range")).toBe("bytes 900-999/1000");
		expect(res.headers.get("Content-Length")).toBe("100");
	});
});

describe("handleRawFile renditions", () => {
	test("a rendition that was never prepared is not found", async () => {
		const proxy = proxyFor(1000, 1000);

		await expect(
			proxy.handleRawFile("clip.avi", undefined, undefined, 480),
		).rejects.toThrow("No 480p");
	});

	test("a prepared one is served as MP4 from the render cache", async () => {
		const opened: string[] = [];
		const proxy = proxyFor(
			1000,
			400,
			{ exists: () => true, key: () => ".thumbnails/clip.avi_480p.mp4" },
			opened,
		);

		const res = await proxy.handleRawFile(
			"clip.avi",
			undefined,
			"bytes=0-",
			480,
		);

		expect(opened).toEqual([".thumbnails/clip.avi_480p.mp4"]);
		expect(res.headers.get("Content-Type")).toBe("video/mp4");
		expect(res.headers.get("Content-Range")).toBe("bytes 0-399/400");
	});
});

const ownRow = {
	name: "page.html",
	path: "page.html",
	size: 10,
	contentType: "text/html",
	updatedAt: new Date(0),
};

function proxyWith(
	options: {
		rows?: unknown[];
		thumbnail?: { buffer?: Buffer; etag: string; contentType: string } | null;
		owner?: string;
	} = {},
) {
	const thumbnailCalls: unknown[][] = [];
	const ctx = {
		user: { id: "u1" },
		db: {
			select: () => ({
				from: () => ({ where: async () => options.rows ?? [ownRow] }),
			}),
		},
		driver: {
			getObjectSize: async () => 10,
			getObjectStream: async () =>
				new ReadableStream<Uint8Array>({
					start(controller) {
						controller.enqueue(new TextEncoder().encode("0123456789"));
						controller.close();
					},
				}),
		},
	};
	const thumbnails = {
		getThumbnail: async (...args: unknown[]) => {
			thumbnailCalls.push(args);
			return options.thumbnail ?? null;
		},
	};
	const proxy = new ProxyService(
		ctx as never,
		thumbnails as never,
		{ exists: () => false, key: () => "" } as never,
		async (path: string) =>
			({
				key: path,
				metadata: { owner: options.owner ?? "u1" },
			}) as never,
	);
	return { proxy, thumbnailCalls };
}

describe("handleRawFile responses", () => {
	test("an unknown file is not found", async () => {
		const { proxy } = proxyWith({ rows: [] });

		await expect(proxy.handleRawFile("ghost.wav")).rejects.toThrow(
			FileOrFolderNotFoundError,
		);
	});

	test("a matching ETag is answered with 304 and no body", async () => {
		const { proxy } = proxyWith();
		const first = await proxy.handleRawFile("page.html");
		const etag = first.headers.get("ETag") ?? "";

		const second = await proxy.handleRawFile("page.html", etag);

		expect(second.status).toBe(304);
		expect(second.headers.get("ETag")).toBe(etag);
		expect(await second.text()).toBe("");
	});

	test("active content is always a download, sandboxed", async () => {
		const { proxy } = proxyWith();

		const res = await proxy.handleRawFile("page.html");

		expect(res.headers.get("Content-Disposition")).toBe(
			"attachment; filename*=UTF-8''page.html",
		);
		expect(res.headers.get("Content-Security-Policy")).toBe("sandbox");
		expect(await res.text()).toBe("0123456789");
	});

	test("passive content is shown inline under its encoded name", async () => {
		const { proxy } = proxyWith({
			rows: [{ ...ownRow, name: "take one.wav", contentType: "audio/wav" }],
		});

		const res = await proxy.handleRawFile("take one.wav");

		expect(res.headers.get("Content-Disposition")).toBe(
			"inline; filename*=UTF-8''take%20one.wav",
		);
	});

	test("a range that is not a number is refused", async () => {
		const { proxy } = proxyWith();

		await expect(
			proxy.handleRawFile("page.html", undefined, "bytes=abc-"),
		).rejects.toThrow("Invalid range");
	});
});

describe("handleThumbnailRequest", () => {
	test("no render is no response", async () => {
		const { proxy, thumbnailCalls } = proxyWith();

		expect(await proxy.handleThumbnailRequest("take.wav")).toBeNull();
		expect(thumbnailCalls).toEqual([["take.wav", 200, undefined]]);
	});

	test("a revalidated render is a 304 that still revalidates", async () => {
		const { proxy } = proxyWith({
			thumbnail: { etag: '"same"', contentType: "image/webp" },
		});

		const res = await proxy.handleThumbnailRequest(
			"take.wav",
			"small",
			'"same"',
		);

		expect(res?.status).toBe(304);
		expect(res?.headers.get("Cache-Control")).toBe("private, no-cache");
	});

	test("a render is served with its type and length", async () => {
		const { proxy, thumbnailCalls } = proxyWith({
			thumbnail: {
				buffer: Buffer.from("webp"),
				etag: '"render"',
				contentType: "image/webp",
			},
		});

		const res = await proxy.handleThumbnailRequest("photo.jpg", "preview");

		expect(res?.status).toBe(200);
		expect(res?.headers.get("Content-Type")).toBe("image/webp");
		expect(res?.headers.get("Content-Length")).toBe("4");
		expect(res?.headers.get("ETag")).toBe('"render"');
		expect(thumbnailCalls[0]?.[1]).toBe(1600);
	});
});

describe("handleMetadata", () => {
	test("the owner gets the item", async () => {
		const { proxy } = proxyWith();

		expect((await proxy.handleMetadata("page.html")).key).toBe("page.html");
	});

	test("anyone else is refused", async () => {
		const { proxy } = proxyWith({ owner: "someone-else" });

		await expect(proxy.handleMetadata("page.html")).rejects.toThrow(
			UnauthorizedError,
		);
	});
});

describe("handleProxyRequest", () => {
	test("a thumbnail request answers the render", async () => {
		const { proxy } = proxyWith({
			thumbnail: {
				buffer: Buffer.from("webp"),
				etag: '"render"',
				contentType: "image/webp",
			},
		});

		const res = (await proxy.handleProxyRequest({
			itemName: "photo.jpg",
			thumbnail: true,
		})) as Response;

		expect(res.status).toBe(200);
	});

	test("a thumbnail request never falls back to the original", async () => {
		const { proxy } = proxyWith();

		await expect(
			proxy.handleProxyRequest({ itemName: "take.wav", thumbnail: true }),
		).rejects.toThrow("No thumbnail available for: take.wav");
	});

	test("a raw request answers the bytes", async () => {
		const { proxy } = proxyWith();

		const res = (await proxy.handleProxyRequest({
			itemName: "page.html",
			raw: true,
			rangeHeader: "bytes=0-3",
		})) as Response;

		expect(res.status).toBe(206);
		expect(res.headers.get("Content-Range")).toBe("bytes 0-3/10");
	});

	test("anything else answers the metadata", async () => {
		const { proxy } = proxyWith();

		const item = await proxy.handleProxyRequest({ itemName: "page.html" });

		expect((item as { key: string }).key).toBe("page.html");
	});
});
