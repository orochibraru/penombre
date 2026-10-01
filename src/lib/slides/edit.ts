import {
	bounds,
	center,
	isLine,
	type Point,
	rotatePoint,
	union,
} from "./geometry";
import type { Box, GroupElement, SlideElement } from "./model";

/**
 * The geometry behind every drag in the editor, kept free of the DOM so it
 * can be tested: resizing in a rotated frame, rotating, snapping, aligning,
 * stacking and grouping.
 */

export type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export const HANDLES: Handle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

/** Where a handle sits on the unit square: 0, ½ or 1 on each axis. */
export function handleAnchor(handle: Handle): Point {
	const x = handle.includes("w") ? 0 : handle.includes("e") ? 1 : 0.5;
	const y = handle.includes("n") ? 0 : handle.includes("s") ? 1 : 0.5;
	return [x, y];
}

const MIN_SIZE = 12_700;

/**
 * The box after dragging `handle` to `pointer`, both in slide coordinates.
 * The opposite side stays where it is on the slide, rotation or not.
 */
export function resizeBox(
	start: Box,
	handle: Handle,
	pointer: Point,
	keepAspect: boolean,
): Box {
	const rot = start.rot ?? 0;
	const pivot = center(start);
	const local = rotatePoint(pointer, pivot, -rot);
	const [ax, ay] = handleAnchor(handle);
	// The fixed point: the handle's mirror image.
	const fixed: Point = [
		start.x + (1 - ax) * start.w,
		start.y + (1 - ay) * start.h,
	];
	let w = ax === 0.5 ? start.w : Math.abs(local[0] - fixed[0]);
	let h = ay === 0.5 ? start.h : Math.abs(local[1] - fixed[1]);
	w = Math.max(MIN_SIZE, w);
	h = Math.max(MIN_SIZE, h);
	if (keepAspect && start.w > 0 && start.h > 0) {
		const ratio = start.w / start.h;
		if (ax === 0.5) {
			w = h * ratio;
		} else if (ay === 0.5) {
			h = w / ratio;
		} else if (w / start.w > h / start.h) {
			h = w / ratio;
		} else {
			w = h * ratio;
		}
	}
	// Local centre of the new box, measured from the fixed point.
	const dirX = ax === 0.5 ? 0 : ax === 1 ? 1 : -1;
	const dirY = ay === 0.5 ? 0 : ay === 1 ? 1 : -1;
	const localCenter: Point = [
		ax === 0.5 ? start.x + start.w / 2 : fixed[0] + (dirX * w) / 2,
		ay === 0.5 ? start.y + start.h / 2 : fixed[1] + (dirY * h) / 2,
	];
	if (ax === 0.5 && keepAspect) {
		localCenter[0] = start.x + start.w / 2;
	}
	const globalCenter = rotatePoint(localCenter, pivot, rot);
	return {
		...start,
		x: globalCenter[0] - w / 2,
		y: globalCenter[1] - h / 2,
		w,
		h,
	};
}

/** The rotation that points the top handle at `pointer`, in degrees. */
export function rotationTo(start: Box, pointer: Point, step?: number): number {
	const [cx, cy] = center(start);
	let angle =
		(Math.atan2(pointer[1] - cy, pointer[0] - cx) * 180) / Math.PI + 90;
	if (step) {
		angle = Math.round(angle / step) * step;
	}
	return ((angle % 360) + 360) % 360;
}

// =========================================================================
// Lines
// =========================================================================

export function lineEnds(box: Box): [Point, Point] {
	const start: Point = [
		box.flipH ? box.x + box.w : box.x,
		box.flipV ? box.y + box.h : box.y,
	];
	const end: Point = [
		box.flipH ? box.x : box.x + box.w,
		box.flipV ? box.y : box.y + box.h,
	];
	const rot = box.rot ?? 0;
	if (rot === 0) {
		return [start, end];
	}
	const pivot = center(box);
	return [rotatePoint(start, pivot, rot), rotatePoint(end, pivot, rot)];
}

export function boxFromEnds(start: Point, end: Point): Box {
	return {
		x: Math.min(start[0], end[0]),
		y: Math.min(start[1], end[1]),
		w: Math.abs(end[0] - start[0]),
		h: Math.abs(end[1] - start[1]),
		rot: 0,
		flipH: end[0] < start[0] ? true : undefined,
		flipV: end[1] < start[1] ? true : undefined,
	};
}

export function isLineElement(element: SlideElement): boolean {
	return element.kind === "shape" && isLine(element.geometry);
}

// =========================================================================
// Snapping
// =========================================================================

export interface Guide {
	axis: "x" | "y";
	at: number;
}

interface Snap {
	delta: number;
	guides: Guide[];
}

function nearest(
	lines: number[],
	candidates: number[],
	threshold: number,
	axis: "x" | "y",
): Snap {
	let best: number | null = null;
	for (const line of lines) {
		for (const candidate of candidates) {
			const delta = candidate - line;
			if (
				Math.abs(delta) <= threshold &&
				(best === null || Math.abs(delta) < Math.abs(best))
			) {
				best = delta;
			}
		}
	}
	if (best === null) {
		return { delta: 0, guides: [] };
	}
	const shift = best;
	const guides = candidates
		.filter((candidate) =>
			lines.some((line) => Math.abs(line + shift - candidate) < 1),
		)
		.map((at) => ({ axis, at }));
	return { delta: shift, guides };
}

/**
 * How far to nudge a moving box so one of its edges or its centre lands on
 * the slide's edges and centre or another object's. Guides are what to draw.
 */
export function snapBox(
	moving: Box,
	others: Box[],
	slide: { w: number; h: number },
	threshold: number,
): { dx: number; dy: number; guides: Guide[] } {
	const box = bounds(moving);
	const all = others.map(bounds);
	const xs = [
		0,
		slide.w / 2,
		slide.w,
		...all.flatMap((o) => [o.x, o.x + o.w / 2, o.x + o.w]),
	];
	const ys = [
		0,
		slide.h / 2,
		slide.h,
		...all.flatMap((o) => [o.y, o.y + o.h / 2, o.y + o.h]),
	];
	const x = nearest(
		[box.x, box.x + box.w / 2, box.x + box.w],
		xs,
		threshold,
		"x",
	);
	const y = nearest(
		[box.y, box.y + box.h / 2, box.y + box.h],
		ys,
		threshold,
		"y",
	);
	return { dx: x.delta, dy: y.delta, guides: [...x.guides, ...y.guides] };
}

// =========================================================================
// Moving, scaling, arranging
// =========================================================================

export function translate(
	element: SlideElement,
	dx: number,
	dy: number,
): SlideElement {
	const moved = { ...element, x: element.x + dx, y: element.y + dy };
	if (moved.kind === "group") {
		moved.children = moved.children.map((child) => translate(child, dx, dy));
	}
	return moved;
}

/** An element given a new box; a group's members scale with it. */
export function withBox(element: SlideElement, next: Box): SlideElement {
	const updated = { ...element, ...next };
	if (updated.kind === "group" && element.w > 0 && element.h > 0) {
		const sx = next.w / element.w;
		const sy = next.h / element.h;
		updated.children = updated.children.map((child) =>
			withBox(child, {
				...child,
				x: next.x + (child.x - element.x) * sx,
				y: next.y + (child.y - element.y) * sy,
				w: child.w * sx,
				h: child.h * sy,
			}),
		);
	}
	return updated;
}

/** EMU are integers in the file; drags are not. */
export function rounded(element: SlideElement): SlideElement {
	const out = {
		...element,
		x: Math.round(element.x),
		y: Math.round(element.y),
		w: Math.round(element.w),
		h: Math.round(element.h),
		rot: element.rot ? Math.round(element.rot * 100) / 100 : element.rot,
	};
	if (out.kind === "group") {
		out.children = out.children.map(rounded);
	}
	return out;
}

export type AlignMode =
	| "left"
	| "center"
	| "right"
	| "top"
	| "middle"
	| "bottom";

/** Align the chosen elements to each other, or to the slide when alone. */
export function align(
	elements: SlideElement[],
	ids: Set<string>,
	mode: AlignMode,
	slide: { w: number; h: number },
): SlideElement[] {
	const chosen = elements.filter((element) => ids.has(element.id));
	const target =
		chosen.length > 1 ? union(chosen) : { x: 0, y: 0, w: slide.w, h: slide.h };
	if (!target) {
		return elements;
	}
	return elements.map((element) => {
		if (!ids.has(element.id)) {
			return element;
		}
		const box = bounds(element);
		const dx =
			mode === "left"
				? target.x - box.x
				: mode === "center"
					? target.x + target.w / 2 - (box.x + box.w / 2)
					: mode === "right"
						? target.x + target.w - (box.x + box.w)
						: 0;
		const dy =
			mode === "top"
				? target.y - box.y
				: mode === "middle"
					? target.y + target.h / 2 - (box.y + box.h / 2)
					: mode === "bottom"
						? target.y + target.h - (box.y + box.h)
						: 0;
		return rounded(translate(element, dx, dy));
	});
}

/** Equal gaps between three or more elements, along one axis. */
export function distribute(
	elements: SlideElement[],
	ids: Set<string>,
	axis: "x" | "y",
): SlideElement[] {
	const size = axis === "x" ? "w" : "h";
	const chosen = elements
		.filter((element) => ids.has(element.id))
		.map((element) => ({ element, box: bounds(element) }))
		.sort((a, b) => a.box[axis] - b.box[axis]);
	const first = chosen[0];
	const last = chosen.at(-1);
	if (chosen.length < 3 || !first || !last) {
		return elements;
	}
	const span = last.box[axis] + last.box[size] - first.box[axis];
	const filled = chosen.reduce((sum, item) => sum + item.box[size], 0);
	const gap = (span - filled) / (chosen.length - 1);
	const shifts = new Map<string, number>();
	let at = first.box[axis];
	for (const item of chosen) {
		shifts.set(item.element.id, at - item.box[axis]);
		at += item.box[size] + gap;
	}
	return elements.map((element) => {
		const shift = shifts.get(element.id);
		if (shift === undefined) {
			return element;
		}
		return rounded(
			axis === "x"
				? translate(element, shift, 0)
				: translate(element, 0, shift),
		);
	});
}

export type Order = "forward" | "backward" | "front" | "back";

/** Restack: the array order is the z-order, first at the back. */
export function restack(
	elements: SlideElement[],
	ids: Set<string>,
	order: Order,
): SlideElement[] {
	const chosen = elements.filter((element) => ids.has(element.id));
	const rest = elements.filter((element) => !ids.has(element.id));
	if (order === "front") {
		return [...rest, ...chosen];
	}
	if (order === "back") {
		return [...chosen, ...rest];
	}
	const list = [...elements];
	const indices = list
		.map((element, index) => (ids.has(element.id) ? index : -1))
		.filter((index) => index !== -1);
	const step = order === "forward" ? 1 : -1;
	for (const index of step === 1 ? indices.reverse() : indices) {
		const swap = index + step;
		const neighbour = list[swap];
		const element = list[index];
		if (!neighbour || !element || ids.has(neighbour.id)) {
			continue;
		}
		list[swap] = element;
		list[index] = neighbour;
	}
	return list;
}

/** The chosen elements as one group, where the frontmost of them was. */
export function group(
	elements: SlideElement[],
	ids: Set<string>,
	id: string,
): SlideElement[] {
	// PowerPoint does not group placeholders: they stay where the layout put them.
	const chosen = elements.filter(
		(element) => ids.has(element.id) && !element.placeholder,
	);
	const area = union(chosen);
	if (chosen.length < 2 || !area) {
		return elements;
	}
	const members = new Set(chosen.map((element) => element.id));
	const grouped: GroupElement = {
		kind: "group",
		id,
		name: `Group ${id}`,
		...area,
		children: chosen,
	};
	const at = elements.findLastIndex((element) => members.has(element.id));
	const out: SlideElement[] = [];
	elements.forEach((element, index) => {
		if (index === at) {
			out.push(grouped);
		} else if (!members.has(element.id)) {
			out.push(element);
		}
	});
	return out;
}

/** A group's members back on the slide, keeping where they appear. */
export function ungroup(
	elements: SlideElement[],
	ids: Set<string>,
): SlideElement[] {
	return elements.flatMap((element) => {
		if (element.kind !== "group" || !ids.has(element.id)) {
			return [element];
		}
		const rot = element.rot ?? 0;
		const pivot = center(element);
		return element.children.map((child) => {
			if (rot === 0) {
				return child;
			}
			const [cx, cy] = rotatePoint(center(child), pivot, rot);
			return rounded({
				...translate(
					child,
					cx - (child.x + child.w / 2),
					cy - (child.y + child.h / 2),
				),
				rot: ((child.rot ?? 0) + rot) % 360,
			});
		});
	});
}

// =========================================================================
// History
// =========================================================================

/** Undo and redo over serialised snapshots, oldest dropped first. */
export class History<T> {
	private past: string[] = [];
	private future: string[] = [];

	constructor(private readonly limit = 100) {}

	/** Remember `state` as the one to go back to. */
	record(state: T): void {
		this.past.push(JSON.stringify(state));
		if (this.past.length > this.limit) {
			this.past.shift();
		}
		this.future = [];
	}

	undo(current: T): T | null {
		const previous = this.past.pop();
		if (previous === undefined) {
			return null;
		}
		this.future.push(JSON.stringify(current));
		return JSON.parse(previous) as T;
	}

	redo(current: T): T | null {
		const next = this.future.pop();
		if (next === undefined) {
			return null;
		}
		this.past.push(JSON.stringify(current));
		return JSON.parse(next) as T;
	}

	get canUndo(): boolean {
		return this.past.length > 0;
	}

	get canRedo(): boolean {
		return this.future.length > 0;
	}
}
