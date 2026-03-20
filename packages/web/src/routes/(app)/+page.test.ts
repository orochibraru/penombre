import { describe, expect, test } from "bun:test";

const { load } = await import("./+page");

describe("load", () => {
	test("redirects to /browse", () => {
		expect(() => load({} as never)).toThrow();
	});
});
