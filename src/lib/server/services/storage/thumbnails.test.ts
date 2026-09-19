import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const enqueueJob = mock(async () => "job-1");
const awaitJob = mock(async () => ({ status: "succeeded" }));
mock.module("#lib/server/services/jobs.js", () => ({ enqueueJob, awaitJob }));

const { ThumbnailService } = await import("./thumbnails");

describe("ThumbnailService", () => {
	let root = "";
	const service = () => new ThumbnailService({ storagePath: root } as never);

	beforeEach(async () => {
		root = await mkdtemp(join(tmpdir(), "penombre-thumbs-"));
		enqueueJob.mockClear();
		awaitJob.mockClear();
	});
	afterEach(async () => {
		await rm(root, { recursive: true, force: true });
	});

	test("a cache hit never enqueues", async () => {
		await mkdir(join(root, ".thumbnails"));
		await writeFile(join(root, ".thumbnails", "a_b.png_300.webp"), "cached");
		const result = await service().generateThumbnail(
			"a/b.png",
			"image/png",
			300,
		);
		expect(result?.buffer.toString()).toBe("cached");
		expect(enqueueJob).not.toHaveBeenCalled();
	});

	test("a miss enqueues a resolved spec and serves the worker's file", async () => {
		const output = join(root, ".thumbnails", "song.mp3_peaks.json");
		awaitJob.mockImplementationOnce(async () => {
			await mkdir(join(root, ".thumbnails"), { recursive: true });
			await writeFile(output, "[1]");
			return { status: "succeeded" };
		});
		const result = await service().generateThumbnail(
			"song.mp3",
			"audio/mpeg",
			300,
		);
		expect(result).toEqual({
			buffer: Buffer.from("[1]"),
			contentType: "application/json",
		});
		expect(enqueueJob.mock.calls[0]?.[0]).toMatchObject({
			type: "thumbnail",
			dedupeKey: output,
			priority: "interactive",
			spec: {
				kind: "audio",
				source: join(root, "song.mp3"),
				output,
				buckets: 400,
			},
		});
		// Other tiles or a warm-up may have joined this job.
		expect(awaitJob.mock.calls[0]?.[1]).toEqual({ cancelOnTimeout: false });
	});

	test("a failed job is a miss, not an error", async () => {
		awaitJob.mockImplementationOnce(async () => ({ status: "failed" }));
		expect(
			await service().generateThumbnail("x.png", "image/png", 100),
		).toBeNull();
	});

	test("unsupported types are never enqueued", async () => {
		expect(
			await service().generateThumbnail("x.zip", "application/zip", 100),
		).toBeNull();
		expect(enqueueJob).not.toHaveBeenCalled();
	});

	test("warm enqueues without waiting", async () => {
		await service().warm("v.mp4", "video/mp4");
		expect(enqueueJob).toHaveBeenCalledTimes(1);
		// Behind everything a person is waiting on.
		expect(enqueueJob.mock.calls[0]?.[0]).toMatchObject({
			priority: "background",
		});
		expect(awaitJob).not.toHaveBeenCalled();
	});
});
