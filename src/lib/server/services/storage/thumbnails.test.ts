import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const enqueueJob = mock(async () => "job-1");
const awaitJob = mock(async () => ({ status: "succeeded" }));
const finishJob = mock(async (_id: string) => true);
const disownJob = mock(async (_id: string) => {});
mock.module("#lib/server/services/jobs.js", () => ({
	enqueueJob,
	awaitJob,
	finishJob,
	disownJob,
}));

const { ThumbnailService } = await import("./thumbnails");
const { LocalStorageDriver } = await import("./drivers/local");
const { seal } = await import("#lib/server/crypto/envelope.js");
const { migratedSqlite } = await import("#lib/server/db/test-utils.js");
const { files, user } = await import("#lib/server/db/schema.js");

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

	test("a version adopts the renders its bytes already have", async () => {
		await mkdir(join(root, ".thumbnails"));
		await writeFile(join(root, ".thumbnails", "d_f.wav_peaks.json"), "[1]");
		await service().adopt("d/f.wav", ".versions/f/v1");
		const result = await service().generateThumbnail(
			".versions/f/v1",
			"audio/wav",
		);
		expect(result?.buffer?.toString()).toBe("[1]");
		expect(enqueueJob).not.toHaveBeenCalled();
	});

	test("a cache hit never enqueues", async () => {
		await mkdir(join(root, ".thumbnails"));
		await writeFile(join(root, ".thumbnails", "a_b.png_300.webp"), "cached");
		const result = await service().generateThumbnail(
			"a/b.png",
			"image/png",
			300,
		);
		expect(result?.buffer?.toString()).toBe("cached");
		expect(enqueueJob).not.toHaveBeenCalled();
	});

	test("a matching ETag answers without reading the render", async () => {
		await mkdir(join(root, ".thumbnails"));
		await writeFile(join(root, ".thumbnails", "a.png_300.webp"), "cached");
		const first = await service().generateThumbnail("a.png", "image/png", 300);
		const again = await service().generateThumbnail(
			"a.png",
			"image/png",
			300,
			first?.etag,
		);
		expect(again).toEqual({
			buffer: null,
			contentType: "image/webp",
			etag: first?.etag ?? "",
		});
		await writeFile(
			join(root, ".thumbnails", "a.png_300.webp"),
			"a newer render",
		);
		const changed = await service().generateThumbnail(
			"a.png",
			"image/png",
			300,
			first?.etag,
		);
		expect(changed?.buffer?.toString()).toBe("a newer render");
	});

	test("a sealed cache entry is opened, and the job asks for a sealed render", async () => {
		const keys = { current: Buffer.alloc(32, 2), previous: [] };
		await mkdir(join(root, ".thumbnails"));
		await writeFile(
			join(root, ".thumbnails", "p.png_300.webp"),
			seal(keys.current, Buffer.from("sealed")),
		);
		const sealed = new ThumbnailService(
			{ storagePath: root, encrypted: true } as never,
			keys,
		);
		const hit = await sealed.generateThumbnail("p.png", "image/png", 300);
		expect(hit?.buffer?.toString()).toBe("sealed");

		await sealed.warm("q.png", "image/png");
		expect(enqueueJob.mock.calls[0]?.[0]).toMatchObject({
			spec: { encrypt: true },
		});
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
		expect(result).toMatchObject({
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

	test("a document is laid out as a one-page PDF for the worker", async () => {
		const docx = `${import.meta.dir}/../../../../../tests/e2e/fixtures/office-report.docx`;
		await writeFile(join(root, "r.docx"), await Bun.file(docx).bytes());
		const paged = new ThumbnailService({
			storagePath: root,
			driver: new LocalStorageDriver(root),
		} as never);
		const type =
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document";

		await paged.warm("r.docx", type);
		expect(enqueueJob).not.toHaveBeenCalled();

		await paged.generateThumbnail("r.docx", type, 300);
		const page = join(root, ".thumbnails", "r.docx_page.pdf");
		expect(enqueueJob.mock.calls[0]?.[0]).toMatchObject({
			spec: { kind: "pdf", source: page },
		});
		expect(await Bun.file(page).text()).toStartWith("%PDF");
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

describe("ThumbnailService renders on disk", () => {
	let root = "";
	const service = () => new ThumbnailService({ storagePath: root } as never);
	const thumbs = () => join(root, ".thumbnails");

	beforeEach(async () => {
		root = await mkdtemp(join(tmpdir(), "penombre-thumbs-"));
		enqueueJob.mockClear();
		awaitJob.mockClear();
	});
	afterEach(async () => {
		await rm(root, { recursive: true, force: true });
	});

	test("deleting a key's renders keeps every other key's", async () => {
		await mkdir(thumbs());
		for (const name of [
			"a_b.png_300.webp",
			"a_b.png_1600.webp",
			"a_b.png.old_300.webp",
			"c.png_300.webp",
		]) {
			await writeFile(join(thumbs(), name), "x");
		}
		await service().deleteThumbnails("a/b.png");
		expect((await readdir(thumbs())).toSorted()).toEqual([
			"a_b.png.old_300.webp",
			"c.png_300.webp",
		]);
	});

	test("deleting renders where there are none does nothing", async () => {
		await service().deleteThumbnails("a.png");
		expect(existsSync(thumbs())).toBe(false);
	});

	test("an unreadable cache never fails the delete", async () => {
		await writeFile(thumbs(), "not a directory");
		await expect(service().deleteThumbnails("a.png")).resolves.toBeUndefined();
	});

	test("adopting skips staged renders and renders already adopted", async () => {
		await mkdir(thumbs());
		await writeFile(join(thumbs(), "f.wav_peaks.json"), "[1]");
		await writeFile(join(thumbs(), "f.wav_300.webp.job.tmp"), "half");
		await writeFile(join(thumbs(), "g.wav_peaks.json"), "mine");
		await service().adopt("f.wav", "g.wav");
		expect((await readdir(thumbs())).toSorted()).toEqual([
			"f.wav_300.webp.job.tmp",
			"f.wav_peaks.json",
			"g.wav_peaks.json",
		]);
		expect(await Bun.file(join(thumbs(), "g.wav_peaks.json")).text()).toBe(
			"mine",
		);
	});

	test("adopting with no cache does nothing", async () => {
		await expect(service().adopt("f.wav", "g.wav")).resolves.toBeUndefined();
	});

	test("a PDF is rendered by the worker from the file itself", async () => {
		await service().warm("doc.pdf", "application/pdf");
		expect(enqueueJob.mock.calls[0]?.[0]).toMatchObject({
			spec: { kind: "pdf", source: join(root, "doc.pdf"), size: 300 },
		});
	});

	test("warming what is already rendered enqueues nothing", async () => {
		await mkdir(thumbs());
		await writeFile(join(thumbs(), "v.mp4_300.webp"), "x");
		await service().warm("v.mp4", "video/mp4");
		await service().warm("x.zip", "application/zip");
		expect(enqueueJob).not.toHaveBeenCalled();
	});

	test("a failed enqueue never fails the warm-up", async () => {
		enqueueJob.mockImplementationOnce(async () => {
			throw new Error("database is locked");
		});
		await expect(service().warm("v.mp4", "video/mp4")).resolves.toBeUndefined();
	});

	test("a job that succeeded without a render is a miss", async () => {
		expect(
			await service().generateThumbnail("x.png", "image/png", 100),
		).toBeNull();
		expect(enqueueJob).toHaveBeenCalledTimes(1);
	});

	test("a document laid out before is not laid out again", async () => {
		const readObject = mock(async () => new ArrayBuffer(0));
		await mkdir(thumbs());
		await writeFile(join(thumbs(), "r.docx_page.pdf"), "%PDF-1.7");
		const paged = new ThumbnailService({
			storagePath: root,
			driver: { readObject },
		} as never);
		await paged.generateThumbnail(
			"r.docx",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		);
		expect(readObject).not.toHaveBeenCalled();
		expect(enqueueJob).toHaveBeenCalledTimes(1);
	});

	test("a document that cannot be read has no thumbnail and no job", async () => {
		const paged = new ThumbnailService({
			storagePath: root,
			driver: {
				readObject: async () => {
					throw new Error("gone");
				},
			},
		} as never);
		expect(
			await paged.generateThumbnail(
				"r.docx",
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			),
		).toBeNull();
		expect(enqueueJob).not.toHaveBeenCalled();
	});
});

describe("ThumbnailService.getThumbnail", () => {
	let root = "";

	beforeEach(async () => {
		root = await mkdtemp(join(tmpdir(), "penombre-thumbs-"));
	});
	afterEach(async () => {
		await rm(root, { recursive: true, force: true });
	});

	async function context() {
		const db = migratedSqlite();
		await db.insert(user).values({
			id: "u",
			name: "u",
			email: "u@x",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		await db.insert(files).values({
			id: "f",
			name: "a.png",
			ownerId: "u",
			path: "a.png",
			contentType: "image/png",
		});
		return { user: { id: "u" }, volumeId: null, storagePath: root, db };
	}

	test("renders by the row's content type", async () => {
		await mkdir(join(root, ".thumbnails"));
		await writeFile(join(root, ".thumbnails", "a.png_300.webp"), "tile");
		const result = await new ThumbnailService(
			(await context()) as never,
		).getThumbnail("a.png");
		expect(result).toMatchObject({ contentType: "image/webp" });
		expect(result?.buffer?.toString()).toBe("tile");
	});

	test("a key with no row has no thumbnail", async () => {
		expect(
			await new ThumbnailService((await context()) as never).getThumbnail(
				"b.png",
			),
		).toBeNull();
	});
});
