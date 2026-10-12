import { columnName } from "../formula";
import type { Rect } from "./selection";

/**
 * Merged cells, kept as Excel's `<mergeCell ref="A1:C2"/>` ranges so the
 * file's list round-trips as it is. The top-left cell holds the value; the
 * others are covered.
 */

const RANGE = /^([A-Z]{1,3})([1-9]\d{0,6}):([A-Z]{1,3})([1-9]\d{0,6})$/;

function columnIndex(letters: string): number {
	let index = 0;
	for (const char of letters) {
		index = index * 26 + (char.charCodeAt(0) - 64);
	}
	return index - 1;
}

export function parseRange(range: string): Rect | null {
	const match = RANGE.exec(range.replaceAll("$", "").toUpperCase());
	if (!match) {
		return null;
	}
	const [, c1 = "A", r1 = "1", c2 = "A", r2 = "1"] = match;
	const rect = {
		top: Math.min(Number(r1), Number(r2)) - 1,
		bottom: Math.max(Number(r1), Number(r2)) - 1,
		left: Math.min(columnIndex(c1), columnIndex(c2)),
		right: Math.max(columnIndex(c1), columnIndex(c2)),
	};
	return rect.top === rect.bottom && rect.left === rect.right ? null : rect;
}

export const rangeOf = (rect: Rect): string =>
	`${columnName(rect.left)}${rect.top + 1}:${columnName(rect.right)}${rect.bottom + 1}`;

export function mergeRects(merges: readonly string[] | undefined): Rect[] {
	return (merges ?? []).flatMap((range) => {
		const rect = parseRange(range);
		return rect ? [rect] : [];
	});
}

const overlaps = (a: Rect, b: Rect) =>
	a.left <= b.right &&
	b.left <= a.right &&
	a.top <= b.bottom &&
	b.top <= a.bottom;

/** `rect` merged whole, or one merge per row; what it overlapped is gone. */
export function addMerges(
	merges: readonly string[] | undefined,
	rect: Rect,
	across: boolean,
): string[] {
	const kept = mergeRects(merges).filter((m) => !overlaps(m, rect));
	const added = across
		? Array.from({ length: rect.bottom - rect.top + 1 }, (_, i) => ({
				...rect,
				top: rect.top + i,
				bottom: rect.top + i,
			}))
		: [rect];
	return [...kept, ...added]
		.filter((m) => m.left !== m.right || m.top !== m.bottom)
		.map(rangeOf);
}

export function removeMerges(
	merges: readonly string[] | undefined,
	rect: Rect,
): string[] {
	return mergeRects(merges)
		.filter((m) => !overlaps(m, rect))
		.map(rangeOf);
}

/** Merges after rows or columns are inserted (`count` > 0) or deleted. */
export function moveMerges(
	merges: readonly string[] | undefined,
	axis: "row" | "col",
	at: number,
	count: number,
): string[] {
	const [start, end] = axis === "row" ? ["top", "bottom"] : ["left", "right"];
	return mergeRects(merges).flatMap((rect) => {
		const next = { ...rect } as Record<string, number>;
		let from = next[start] ?? 0;
		let to = next[end] ?? 0;
		if (count > 0) {
			if (from >= at) {
				from += count;
			}
			if (to >= at) {
				to += count;
			}
		} else {
			const gone = -count;
			const shift = (n: number) =>
				n < at ? n : n >= at + gone ? n - gone : at;
			const emptied = from >= at && to < at + gone;
			if (emptied) {
				return [];
			}
			from = from >= at && from < at + gone ? at : shift(from);
			to = to >= at && to < at + gone ? at - 1 : shift(to);
		}
		next[start] = from;
		next[end] = to;
		const moved = next as unknown as Rect;
		return moved.top <= moved.bottom &&
			moved.left <= moved.right &&
			(moved.top !== moved.bottom || moved.left !== moved.right)
			? [rangeOf(moved)]
			: [];
	});
}

/** Where a cell sits in a merge, for drawing it. */
export interface MergeSpot {
	rect: Rect;
	/** The top-left cell, which draws the whole merge. */
	anchor: boolean;
}

/** Every merged cell by `row * 16384 + col`. */
export function mergeIndex(merges: readonly string[] | undefined) {
	const index = new Map<number, MergeSpot>();
	for (const rect of mergeRects(merges)) {
		for (let r = rect.top; r <= rect.bottom; r++) {
			for (let c = rect.left; c <= rect.right; c++) {
				index.set(r * 16_384 + c, {
					rect,
					anchor: r === rect.top && c === rect.left,
				});
			}
		}
	}
	return index;
}

/** Whether a value crossing the network is a list of merge ranges. */
export function isMergeList(value: unknown): value is string[] {
	return (
		Array.isArray(value) &&
		value.length <= 100_000 &&
		value.every((range) => typeof range === "string" && RANGE.test(range))
	);
}
