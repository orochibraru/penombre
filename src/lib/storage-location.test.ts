import { describe, expect, test } from "bun:test";

import {
	locationFrom,
	locationOf,
	locationQuery,
} from "#lib/storage-location.js";

describe("locationOf", () => {
	test("is the personal drive without a location param", () => {
		expect(locationOf(undefined)).toEqual({});
		expect(locationOf(null)).toEqual({});
		expect(locationOf({ path: "photos/2024" })).toEqual({});
		expect(locationOf({ drive: "" })).toEqual({});
	});

	test("reads a drive, a volume or a share", () => {
		expect(locationOf({ drive: "d1", path: "a" })).toEqual({ drive: "d1" });
		expect(locationOf({ volume: "music" })).toEqual({ volume: "music" });
		expect(locationOf({ share: "s1" })).toEqual({ share: "s1" });
	});

	test("a drive wins over a volume, a volume over a share", () => {
		expect(locationOf({ drive: "d1", volume: "music", share: "s1" })).toEqual({
			drive: "d1",
		});
		expect(locationOf({ volume: "music", share: "s1" })).toEqual({
			volume: "music",
		});
	});
});

describe("locationFrom", () => {
	test("prefers the route's own params over the query", () => {
		expect(
			locationFrom({ drive: "d1" }, new URL("http://x/view/1?volume=music")),
		).toEqual({ drive: "d1" });
	});

	test("reads the query a /view or /edit link carried", () => {
		expect(
			locationFrom(
				{ fileId: "1" },
				new URL("http://x/view/1?volume=music&share=s1"),
			),
		).toEqual({ drive: undefined, volume: "music", share: "s1" });
		expect(locationFrom(undefined, new URL("http://x/edit/1"))).toEqual({
			drive: undefined,
			volume: undefined,
			share: undefined,
		});
	});
});

describe("locationQuery", () => {
	test("is empty for the personal drive", () => {
		expect(locationQuery({})).toBe("");
	});

	test("names one location, encoded", () => {
		expect(locationQuery({ drive: "d1", volume: "music" })).toBe("drive=d1");
		expect(locationQuery({ volume: "my music" })).toBe("volume=my%20music");
		expect(locationQuery({ share: "a&b" })).toBe("share=a%26b");
	});
});
