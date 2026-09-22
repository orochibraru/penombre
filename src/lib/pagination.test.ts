import { describe, expect, test } from "bun:test";
import { fetchWindow, LISTING_MAX_PAGE_SIZE } from "./pagination";

describe("fetchWindow", () => {
	const rows = Array.from({ length: 1200 }, (_, i) => i);
	const fetchPage = async (cursor: string | null, limit: number) => {
		const start = cursor === null ? 0 : Number(cursor);
		const end = Math.min(start + Math.min(limit, LISTING_MAX_PAGE_SIZE), 1200);
		return {
			list: rows.slice(start, end),
			nextCursor: end < rows.length ? String(end) : null,
		};
	};

	test("covers a window larger than one page", async () => {
		const window = await fetchWindow(fetchPage, 1100);
		expect(window?.list).toEqual(rows.slice(0, 1100));
		expect(window?.nextCursor).toBe("1100");
	});

	test("stops at the end of the listing", async () => {
		const window = await fetchWindow(fetchPage, 5000);
		expect(window?.list).toHaveLength(1200);
		expect(window?.nextCursor).toBeNull();
	});

	test("a failed page fails the window", async () => {
		expect(await fetchWindow(async () => null, 10)).toBeNull();
	});
});
