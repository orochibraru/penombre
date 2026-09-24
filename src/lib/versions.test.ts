import { describe, expect, test } from "bun:test";
import type { ObjectItem } from "#lib/api/index.js";
import { displayTitle, type ListedVersion, withVersions } from "./versions";

const file = (id: string) =>
	({
		key: `${id}.wav`,
		updatedAt: "2026-01-02T00:00:00.000Z",
		type: "file",
		metadata: { id, name: `${id}.wav`, category: "MUSIC" },
	}) as unknown as ObjectItem;

const version = (id: string, seq: number): ListedVersion => ({
	id,
	seq,
	size: 1,
	contentType: "audio/wav",
	authorName: "Ana",
	createdAt: "2026-01-01T00:00:00.000Z",
});

describe("withVersions", () => {
	test("nothing unfolded is the same array", () => {
		const items = [file("a")];
		expect(withVersions(items, {})).toBe(items);
	});

	test("an unfolded file is followed by its versions, with ids of their own", () => {
		const rows = withVersions([file("a"), file("b")], {
			a: [version("v2", 2), version("v1", 1)],
		});
		expect(rows.map((row) => row.metadata.id)).toEqual([
			"a",
			"a:v:v2",
			"a:v:v1",
			"b",
		]);
		expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
		expect(displayTitle(rows[1] as ObjectItem, "sequential")).toBe(
			"a.wav · v2",
		);
		expect(displayTitle(rows[0] as ObjectItem, "sequential")).toBe("a.wav");
	});
});
