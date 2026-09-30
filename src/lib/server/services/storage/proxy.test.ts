import { describe, expect, test } from "bun:test";
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

		expect(
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
