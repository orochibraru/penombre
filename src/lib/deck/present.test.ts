import { describe, expect, test } from "bun:test";
import { clock, readMessage, slideKey } from "./present";

describe("slideKey", () => {
	test("steps and clamps", () => {
		expect(slideKey("ArrowRight", 0, 3, "")).toEqual({ index: 1, typed: "" });
		expect(slideKey(" ", 2, 3, "")).toEqual({ index: 2, typed: "" });
		expect(slideKey("PageUp", 0, 3, "")).toEqual({ index: 0, typed: "" });
	});

	test("Home and End", () => {
		expect(slideKey("End", 0, 5, "")).toEqual({ index: 4, typed: "" });
		expect(slideKey("Home", 4, 5, "")).toEqual({ index: 0, typed: "" });
	});

	test("a number then Enter jumps", () => {
		const typed = slideKey("1", 0, 20, "");
		expect(typed).toEqual({ index: 0, typed: "1" });
		const both = slideKey("2", 0, 20, "1");
		expect(both).toEqual({ index: 0, typed: "12" });
		expect(slideKey("Enter", 0, 20, "12")).toEqual({ index: 11, typed: "" });
		expect(slideKey("Enter", 0, 5, "99")).toEqual({ index: 4, typed: "" });
	});

	test("Escape exits, f toggles full screen, the rest is ignored", () => {
		expect(slideKey("Escape", 0, 1, "")).toEqual({ exit: true });
		expect(slideKey("f", 0, 1, "")).toEqual({ fullscreen: true });
		expect(slideKey("x", 0, 1, "")).toBeNull();
	});
});

test("readMessage refuses what is not one", () => {
	expect(readMessage({ type: "go", index: 2 })).toEqual({
		type: "go",
		index: 2,
	});
	expect(readMessage({ type: "go", index: -1 })).toBeNull();
	expect(readMessage({ type: "state", index: 0 })).toBeNull();
	expect(readMessage("hello")).toBeNull();
	expect(readMessage({ type: "state", index: 1, markdown: "# A" })).toEqual({
		type: "state",
		index: 1,
		markdown: "# A",
	});
});

test("clock", () => {
	expect(clock(5)).toBe("0:05");
	expect(clock(754)).toBe("12:34");
	expect(clock(3723)).toBe("1:02:03");
});
