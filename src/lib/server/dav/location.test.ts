import { describe, expect, test } from "bun:test";
import { hrefFor, parseDavPath } from "./location";

describe("parseDavPath", () => {
	test("the personal drive", () => {
		expect(parseDavPath("/dav/me/Music/Take%201%2B2.wav")).toEqual({
			base: "/dav/me",
			query: "",
			segments: ["Music", "Take 1+2.wav"],
		});
		expect(parseDavPath("/dav/me/")?.segments).toEqual([]);
		expect(parseDavPath("/dav/me")?.segments).toEqual([]);
	});

	test("drives and volumes carry their location as a query", () => {
		expect(parseDavPath("/dav/drives/abc/x")).toEqual({
			base: "/dav/drives/abc",
			query: "drive=abc",
			segments: ["x"],
		});
		expect(parseDavPath("/dav/volumes/media/")).toEqual({
			base: "/dav/volumes/media",
			query: "volume=media",
			segments: [],
		});
	});

	test("refuses traversal, encoded slashes, bad escapes and unknown scopes", () => {
		expect(parseDavPath("/dav/me/../x")).toBeNull();
		expect(parseDavPath("/dav/me/a%2Fb")).toBeNull();
		expect(parseDavPath("/dav/me/%E0%A4%A")).toBeNull();
		expect(parseDavPath("/dav/other/x")).toBeNull();
		expect(parseDavPath("/dav/drives/")).toBeNull();
		expect(parseDavPath("/api/v1/x")).toBeNull();
	});
});

describe("hrefFor", () => {
	test("encodes each segment and marks folders", () => {
		expect(hrefFor("/dav/me", ["Music", "Take 1+2 #é.wav"], false)).toBe(
			"/dav/me/Music/Take%201%2B2%20%23%C3%A9.wav",
		);
		expect(hrefFor("/dav/me", ["Music"], true)).toBe("/dav/me/Music/");
		expect(hrefFor("/dav/me", [], true)).toBe("/dav/me/");
	});
});
