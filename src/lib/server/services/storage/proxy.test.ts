import { describe, expect, test } from "bun:test";
import { ProxyService } from "./proxy";

/**
 * The row's size is client-declared on create and only corrected once the body
 * lands, so it can outlive the truth. These pin the response to the bytes.
 */
function proxyFor(dbSize: number, diskSize: number) {
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
			getObjectStream: async () => new ReadableStream<Uint8Array>(),
		},
	};
	return new ProxyService(ctx as never, {} as never, (() => {}) as never);
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
});
