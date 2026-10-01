import { describe, expect, test } from "bun:test";
import { colourFor, faces, initials } from "./presence";

describe("presence faces", () => {
	test("initials take first and last names", () => {
		expect(initials("Ada Lovelace")).toBe("AL");
		expect(initials("  jean  paul  sartre ")).toBe("JS");
		expect(initials("Cher")).toBe("CH");
		expect(initials("")).toBe("?");
	});

	test("a person keeps one colour", () => {
		expect(colourFor("user-1")).toBe(colourFor("user-1"));
		expect(colourFor("user-1")).toMatch(/^bg-/);
	});

	test("a crowd collapses into +N, never hiding just one face", () => {
		expect(faces([1, 2, 3], 3)).toEqual({ shown: [1, 2, 3], more: 0 });
		expect(faces([1, 2, 3, 4, 5], 3)).toEqual({ shown: [1, 2], more: 3 });
	});
});
