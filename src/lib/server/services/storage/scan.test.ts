import { describe, expect, test } from "bun:test";
import { ancestorFolders, isScannable } from "./scan";

describe("isScannable", () => {
	test("accepts ordinary files at any depth", () => {
		expect(isScannable("notes.md")).toBe(true);
		expect(isScannable("Music/Album/track1.mp3")).toBe(true);
	});

	test("skips hidden entries at any depth", () => {
		expect(isScannable(".DS_Store")).toBe(false);
		expect(isScannable(".thumbnails/abc.webp")).toBe(false);
		expect(isScannable("Music/.hidden/track.mp3")).toBe(false);
	});

	test("skips legacy metadata sidecars", () => {
		expect(isScannable("file.txt.meta.json")).toBe(false);
	});
});

describe("ancestorFolders", () => {
	test("returns every parent, shallowest first", () => {
		expect(ancestorFolders("a/b/c.mp3")).toEqual(["a", "a/b"]);
	});

	test("returns nothing for a root-level file", () => {
		expect(ancestorFolders("notes.md")).toEqual([]);
	});
});
