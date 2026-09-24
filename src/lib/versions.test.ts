import { describe, expect, test } from "bun:test";
import type { ObjectItem } from "#lib/api/index.js";
import {
	displayTitle,
	type ListedVersion,
	mergedName,
	mergeOrder,
	withVersions,
} from "./versions";

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

describe("mergedName", () => {
	test("strips counters, copy suffixes and date stamps", () => {
		expect(
			mergedName([
				"Dystopian Fantasies-001 (1).wav",
				"Dystopian Fantasies-008.wav",
				"Dystopian Fantasies-2026-09-10-17_34_14.wav",
			]),
		).toBe("Dystopian Fantasies.wav");
	});

	test("drops a tag after the date stamp", () => {
		expect(
			mergedName([
				"Questionable Strategies-2026-09-20-11_58_41-notes-nico.wav",
				"Questionable Strategies-2026-09-20-19_20_47.wav",
			]),
		).toBe("Questionable Strategies.wav");
	});

	test("keeps the common prefix of unrelated names", () => {
		expect(mergedName(["mix final.wav", "mix final really.wav"])).toBe(
			"mix final.wav",
		);
	});

	test("falls back to the last name when nothing is shared", () => {
		expect(mergedName(["a.wav", "b.wav"])).toBe("b.wav");
	});
});

describe("mergeOrder", () => {
	const take = (name: string, updatedAt: string) =>
		({ key: name, updatedAt, metadata: { name } }) as unknown as ObjectItem;
	const names = (items: ObjectItem[]) => items.map((i) => i.metadata.name);
	const takes = [
		take("Song-2026-09-07-23_26_16.mp3", "2026-09-07T21:27:00Z"),
		take("Song-010.mp3", "2026-03-13T10:00:00Z"),
		take("Song-002.mp3", "2026-02-24T19:05:00Z"),
	];

	test("by date follows the files' own dates", () => {
		expect(names(mergeOrder(takes, "date"))).toEqual([
			"Song-002.mp3",
			"Song-010.mp3",
			"Song-2026-09-07-23_26_16.mp3",
		]);
	});

	test("by name compares numbers as numbers", () => {
		expect(
			names(
				mergeOrder([take("Song-10.mp3", ""), take("Song-9.mp3", "")], "name"),
			),
		).toEqual(["Song-9.mp3", "Song-10.mp3"]);
	});
});
