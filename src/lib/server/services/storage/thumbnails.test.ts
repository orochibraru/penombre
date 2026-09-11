import { describe, expect, test } from "bun:test";
import { bucketPeaks } from "./thumbnails";

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
