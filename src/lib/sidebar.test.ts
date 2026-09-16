import { describe, expect, test } from "bun:test";
import { SIDEBAR_GROUP_LIMIT, sidebarItems } from "./sidebar";

const make = (count: number) =>
	Array.from({ length: count }, (_, i) => ({ id: `d${i}` }));

describe("sidebarItems", () => {
	test("lists every item up to the limit", () => {
		const items = make(SIDEBAR_GROUP_LIMIT);
		expect(sidebarItems(items)).toEqual({ shown: items, hidden: 0 });
	});

	test("truncates 200 items to the limit", () => {
		const { shown, hidden } = sidebarItems(make(200));
		expect(shown).toHaveLength(SIDEBAR_GROUP_LIMIT);
		expect(hidden).toBe(200 - SIDEBAR_GROUP_LIMIT);
	});

	test("keeps the item on screen even past the limit", () => {
		const { shown, hidden } = sidebarItems(make(200), "d150");
		expect(shown.map((d) => d.id)).toContain("d150");
		expect(shown).toHaveLength(SIDEBAR_GROUP_LIMIT + 1);
		expect(hidden).toBe(200 - SIDEBAR_GROUP_LIMIT - 1);
	});
});
