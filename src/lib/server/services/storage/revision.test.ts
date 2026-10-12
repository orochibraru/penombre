import { describe, expect, test } from "bun:test";
import { oneSaveAtATime, revisionOf } from "./revision.ts";

describe("revisionOf", () => {
	test("is the same for the same bytes, whatever holds them", () => {
		const bytes = new TextEncoder().encode("hello");
		expect(revisionOf(bytes)).toBe(revisionOf(bytes.slice().buffer));
		expect(revisionOf(bytes)).not.toBe(
			revisionOf(new TextEncoder().encode("hellO")),
		);
	});
});

describe("oneSaveAtATime", () => {
	test("a second save of the same file waits for the first", async () => {
		const order: string[] = [];
		const { promise: gate, resolve: release } = Promise.withResolvers<void>();
		const first = oneSaveAtATime("f", async () => {
			order.push("first:start");
			await gate;
			order.push("first:end");
		});
		const second = oneSaveAtATime("f", async () => {
			order.push("second");
		});
		await Bun.sleep(5);
		expect(order).toEqual(["first:start"]);
		release();
		await Promise.all([first, second]);
		expect(order).toEqual(["first:start", "first:end", "second"]);
	});

	test("a failed save does not block the next", async () => {
		const failed = oneSaveAtATime("g", () => Promise.reject(new Error("x")));
		await expect(failed).rejects.toThrow("x");
		expect(await oneSaveAtATime("g", async () => 1)).toBe(1);
	});
});
