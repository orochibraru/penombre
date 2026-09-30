import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RenditionService } from "./renditions";

let root: string;
let enqueued: unknown[];
let ended: { status: string; error?: string } | undefined;
const queue = {
	enqueueJob: async (input: unknown) => {
		enqueued.push(input);
		return "job-1";
	},
	awaitJob: async () => ended,
};

function service(contentType: string | null, encrypted = false) {
	const ctx = {
		user: { id: "u1" },
		storagePath: root,
		encrypted,
		db: {
			select: () => ({
				from: () => ({
					where: async () => (contentType ? [{ contentType }] : []),
				}),
			}),
		},
	};
	return new RenditionService(ctx as never, queue as never);
}

function outcome(job: { status: string; error?: string } | undefined) {
	ended = job;
}

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), "renditions-"));
	enqueued = [];
	ended = undefined;
});

afterEach(() => {
	rmSync(root, { recursive: true, force: true });
});

describe("RenditionService.ensure", () => {
	test("a file that is not a video has none, and starts no job", async () => {
		expect(await service("audio/wav").ensure("a.wav", 480)).toEqual({
			status: "unavailable",
		});
		expect(await service(null).ensure("gone.mp4", 480)).toEqual({
			status: "unavailable",
		});
		expect(enqueued).toEqual([]);
	});

	test("sealed drives have none", async () => {
		expect(await service("video/mp4", true).ensure("a.mp4", 480)).toEqual({
			status: "unavailable",
		});
		expect(enqueued).toEqual([]);
	});

	test("one already rendered is ready without a job", async () => {
		mkdirSync(join(root, ".thumbnails"));
		writeFileSync(join(root, ".thumbnails", "live_a.avi_720p.mp4"), "x");

		expect(await service("video/x-msvideo").ensure("live/a.avi", 720)).toEqual({
			status: "ready",
		});
		expect(enqueued).toEqual([]);
	});

	test("a missing one is rendered once for everyone asking", async () => {
		outcome(undefined);

		const state = await service("video/x-msvideo").ensure("live/a.avi", 480);

		expect(state).toEqual({ status: "preparing" });
		const output = join(root, ".thumbnails", "live_a.avi_480p.mp4");
		expect(enqueued).toEqual([
			{
				type: "transcode",
				dedupeKey: output,
				priority: "interactive",
				spec: { source: join(root, "live/a.avi"), output, height: 480 },
			},
		]);
	});

	test("the job's end is the answer", async () => {
		outcome({ status: "succeeded" });
		expect(await service("video/mp4").ensure("a.mp4", 480)).toEqual({
			status: "ready",
		});

		outcome({ status: "failed", error: "ffmpeg: no video stream" });
		expect(await service("video/mp4").ensure("a.mp4", 480)).toEqual({
			status: "failed",
			error: "ffmpeg: no video stream",
		});
	});
});
