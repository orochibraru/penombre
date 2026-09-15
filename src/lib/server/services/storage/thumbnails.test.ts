import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, readdirSync, statSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bucketPeaks, writeCacheAtomically } from "./thumbnails";

/** A buffer whose samples step through `values` (absolute, 0..32767). */
function samplesOf(values: number[], perBucket: number): Int16Array {
	const out = new Int16Array(values.length * perBucket);
	for (const [index, value] of values.entries()) {
		out.fill(value, index * perBucket, (index + 1) * perBucket);
	}
	return out;
}

describe("bucketPeaks", () => {
	test("scales the loudest bucket to 1", () => {
		const peaks = bucketPeaks(samplesOf([1000, 2000, 4000], 8), 3);
		expect(peaks).toEqual([0.25, 0.5, 1]);
	});

	test("a quiet file still fills the bar", () => {
		// 0.07 of full scale — the case that drew an unreadable two-pixel line
		// when peaks were absolute.
		const peaks = bucketPeaks(samplesOf([2300, 1150], 8), 2);
		expect(peaks).toEqual([1, 0.5]);
	});

	test("silence is not amplified into a block", () => {
		const peaks = bucketPeaks(samplesOf([100, 50], 8), 2);
		expect(peaks[0]).toBeLessThan(0.01);
	});

	test("returns one entry per bucket", () => {
		expect(bucketPeaks(samplesOf([1, 2, 3, 4], 4), 4)).toHaveLength(4);
	});
});

describe("writeCacheAtomically", () => {
	let dir = "";

	beforeEach(async () => {
		dir = await mkdtemp(join(tmpdir(), "penombre-thumbs-"));
	});

	afterEach(async () => {
		await rm(dir, { recursive: true, force: true });
	});

	test("writes the bytes under the final name", async () => {
		const path = join(dir, "peaks.json");
		await writeCacheAtomically(path, Buffer.from("[0.1,0.9]"));
		expect(await Bun.file(path).text()).toBe("[0.1,0.9]");
	});

	test("leaves no staging file behind", async () => {
		const path = join(dir, "peaks.json");
		await writeCacheAtomically(path, Buffer.from("[1]"));
		expect(readdirSync(dir)).toEqual(["peaks.json"]);
	});

	/**
	 * The bug this exists to prevent: `existsSync` is the cache check and it
	 * runs before the generation semaphore, so a reader that catches the
	 * destination mid-write reads a short file and serves it as the cached
	 * entry. Written straight to the destination, this observes sizes between
	 * zero and the total; renamed into place, it can only ever see absent or
	 * whole.
	 */
	test("a concurrent reader never sees a partial file", async () => {
		const path = join(dir, "big.json");
		// Large enough that the write is not over before the first poll.
		const bytes = Buffer.alloc(16 * 1024 * 1024, 0x61);

		const seen = new Set<number>();
		// A property rather than a local: the watcher and the write run
		// concurrently, and a plain `let` reads as never reassigned here.
		const state: { writing: boolean } = { writing: true };
		const watcher = (async () => {
			while (state.writing) {
				seen.add(existsSync(path) ? statSync(path).size : -1);
				await Bun.sleep(0);
			}
		})();

		await writeCacheAtomically(path, bytes);
		state.writing = false;
		await watcher;

		const partial = [...seen].filter(
			(size) => size !== -1 && size !== bytes.byteLength,
		);
		expect(partial).toEqual([]);
	});
});
