import { describe, expect, test } from "bun:test";
import { TransferRate } from "./rate";

const MB = 1024 * 1024;

/** Feed `rate` a constant speed for `seconds`, one sample a second. */
function run(
	rate: TransferRate,
	from: number,
	seconds: number,
	perSecond: number,
) {
	let at = from;
	let bytes = 0;
	for (let i = 0; i <= seconds; i++) {
		rate.sample(bytes, at);
		at += 1000;
		bytes += perSecond;
	}
	return { at: at - 1000, bytes: bytes - perSecond };
}

describe("TransferRate", () => {
	test("knows nothing until it has warmed up", () => {
		const rate = new TransferRate();
		rate.sample(0, 0);
		rate.sample(10 * MB, 1000);
		expect(rate.speed(1000)).toBe(0);
		expect(rate.eta(100 * MB, 1000)).toBe(0);
	});

	test("a steady link reads its own speed and a matching eta", () => {
		const rate = new TransferRate();
		const end = run(rate, 0, 10, 5 * MB);
		expect(rate.speed(end.at)).toBeCloseTo(5 * MB, -3);
		expect(rate.eta(50 * MB, end.at)).toBe(10);
	});

	test("follows a slowdown within seconds, unlike a since-start average", () => {
		const rate = new TransferRate();
		let at = 0;
		let bytes = 0;
		for (; at <= 60_000; at += 1000, bytes += 10 * MB) {
			rate.sample(bytes, at);
		}
		for (let i = 0; i < 10; i++, at += 1000, bytes += 1 * MB) {
			rate.sample(bytes, at);
		}
		// A since-start average would still read ~8.7 MB/s here.
		expect(rate.speed(at)).toBeLessThan(2.5 * MB);
	});

	test("merges bursts closer than half a second", () => {
		const rate = new TransferRate();
		rate.sample(0, 0);
		rate.sample(50 * MB, 10);
		rate.sample(1 * MB, 1000);
		rate.sample(2 * MB, 2000);
		expect(rate.speed(2000)).toBeCloseTo(1 * MB, -3);
	});

	test("a retried file restarting from zero is not negative throughput", () => {
		const rate = new TransferRate();
		rate.sample(0, 0);
		rate.sample(4 * MB, 1000);
		rate.sample(1 * MB, 2000);
		rate.sample(3 * MB, 3000);
		expect(rate.speed(3000)).toBeGreaterThan(0);
	});
});
