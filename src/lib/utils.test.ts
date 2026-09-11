import { describe, expect, test } from "bun:test";
import {
	PARENT_KEY,
	resolveDropDestination,
	resolveParentPath,
} from "$lib/utils";

describe("resolveParentPath", () => {
	test("is undefined where there is nothing to go up to", () => {
		// No `path` param at all: /browse, and every non-browse listing.
		expect(resolveParentPath(undefined)).toBeUndefined();
		expect(resolveParentPath("")).toBeUndefined();
	});

	test("returns the drive root one level down", () => {
		expect(resolveParentPath("photos")).toBe("");
	});

	test("drops the last segment of a nested path", () => {
		expect(resolveParentPath("photos/2024/summer")).toBe("photos/2024");
	});
});

describe("resolveDropDestination", () => {
	test("resolves the parent row to the folder above", () => {
		expect(resolveDropDestination(PARENT_KEY, "photos/2024")).toBe("photos");
		expect(resolveDropDestination(PARENT_KEY, "photos")).toBe("");
		expect(resolveDropDestination(PARENT_KEY, undefined)).toBe("");
	});

	test("resolves a folder row to a child of the current folder", () => {
		expect(resolveDropDestination("summer/", "photos/2024")).toBe(
			"photos/2024/summer",
		);
		expect(resolveDropDestination("photos/", undefined)).toBe("photos");
	});
});
