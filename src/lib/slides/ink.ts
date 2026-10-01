import type { Point } from "./geometry";
import type {
	Box,
	Color,
	PathCommand,
	ShapeElement,
	SlideElement,
} from "./model";

/**
 * Freehand strokes: a pointer's trail simplified, smoothed into cubic
 * curves and stored as a custom-geometry shape, which is what PowerPoint,
 * Keynote and LibreOffice all draw without knowing it was ink.
 */

function distanceToSegment(p: Point, a: Point, b: Point): number {
	const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
	const length = dx * dx + dy * dy;
	const t =
		length === 0
			? 0
			: Math.max(
					0,
					Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length),
				);
	return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** Ramer–Douglas–Peucker: drop points closer than `tolerance` to the line. */
export function simplify(points: Point[], tolerance: number): Point[] {
	if (points.length < 3) {
		return points;
	}
	const first = points[0] as Point;
	const last = points.at(-1) as Point;
	let furthest = 0;
	let index = 0;
	for (let i = 1; i < points.length - 1; i++) {
		const distance = distanceToSegment(points[i] as Point, first, last);
		if (distance > furthest) {
			furthest = distance;
			index = i;
		}
	}
	if (furthest <= tolerance) {
		return [first, last];
	}
	return [
		...simplify(points.slice(0, index + 1), tolerance).slice(0, -1),
		...simplify(points.slice(index), tolerance),
	];
}

/** Catmull–Rom through the points, as cubic Bézier commands. */
export function smoothPath(points: Point[]): PathCommand[] {
	const [start] = points;
	if (!start) {
		return [];
	}
	if (points.length === 1) {
		return [
			{ op: "M", v: start },
			{ op: "L", v: [start[0] + 1, start[1]] },
		];
	}
	const commands: PathCommand[] = [{ op: "M", v: [...start] }];
	for (let i = 0; i < points.length - 1; i++) {
		const p0 = points[i - 1] ?? (points[i] as Point);
		const p1 = points[i] as Point;
		const p2 = points[i + 1] as Point;
		const p3 = points[i + 2] ?? p2;
		commands.push({
			op: "C",
			v: [
				p1[0] + (p2[0] - p0[0]) / 6,
				p1[1] + (p2[1] - p0[1]) / 6,
				p2[0] - (p3[0] - p1[0]) / 6,
				p2[1] - (p3[1] - p1[1]) / 6,
				p2[0],
				p2[1],
			].map(Math.round),
		});
	}
	return commands;
}

export interface Pen {
	color: Color;
	/** EMU. */
	width: number;
	highlighter: boolean;
}

/** A finished stroke as a shape. `points` are in slide EMU. */
export function strokeShape(
	points: Point[],
	pen: Pen,
	id: string,
): ShapeElement {
	const kept = simplify(points, pen.width / 4);
	const xs = kept.map((point) => point[0]);
	const ys = kept.map((point) => point[1]);
	const x = Math.round(Math.min(...xs));
	const y = Math.round(Math.min(...ys));
	const w = Math.max(1, Math.round(Math.max(...xs) - x));
	const h = Math.max(1, Math.round(Math.max(...ys) - y));
	const local = kept.map(([px, py]): Point => [px - x, py - y]);
	return {
		kind: "shape",
		id,
		name: `${pen.highlighter ? "Highlighter" : "Ink"} ${id}`,
		x,
		y,
		w,
		h,
		geometry: {
			paths: [{ w, h, fill: false, commands: smoothPath(local) }],
		},
		fill: { type: "none" },
		line: {
			fill: { type: "solid", color: pen.color },
			width: pen.width,
			cap: "rnd",
		},
	};
}

/** Whether an element is a stroke the eraser may take: an unfilled path. */
export function isStroke(element: SlideElement): element is ShapeElement {
	return (
		element.kind === "shape" &&
		"paths" in element.geometry &&
		element.fill.type === "none" &&
		!element.text?.paragraphs.some((paragraph) => paragraph.runs.length > 0)
	);
}

function cubicAt(
	[a, b, c, d]: [number, number, number, number],
	t: number,
): number {
	const u = 1 - t;
	return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

/** A stroke flattened to slide coordinates, for hit tests. */
function strokePolyline(element: ShapeElement): Point[] {
	if (!("paths" in element.geometry)) {
		return [];
	}
	const out: Point[] = [];
	for (const path of element.geometry.paths) {
		const sx = path.w > 0 ? element.w / path.w : 1;
		const sy = path.h > 0 ? element.h / path.h : 1;
		const at = (x: number, y: number): Point => [
			element.x + x * sx,
			element.y + y * sy,
		];
		let current: Point = [0, 0];
		for (const command of path.commands) {
			const v = command.v;
			if (command.op === "C" && v.length >= 6) {
				for (let t = 0.25; t <= 1; t += 0.25) {
					out.push(
						at(
							cubicAt([current[0], v[0] ?? 0, v[2] ?? 0, v[4] ?? 0], t),
							cubicAt([current[1], v[1] ?? 0, v[3] ?? 0, v[5] ?? 0], t),
						),
					);
				}
				current = [v[4] ?? 0, v[5] ?? 0];
			} else if (command.op !== "Z" && command.op !== "A" && v.length >= 2) {
				current = [v.at(-2) ?? 0, v.at(-1) ?? 0];
				out.push(at(current[0], current[1]));
			}
		}
	}
	return out;
}

/** Whether `point` is within `radius` of the stroke's line. */
export function touchesStroke(
	element: ShapeElement,
	point: Point,
	radius: number,
): boolean {
	const line = strokePolyline(element);
	const reach = radius + element.line.width / 2;
	if (line.length === 1) {
		const only = line[0] as Point;
		return Math.hypot(point[0] - only[0], point[1] - only[1]) <= reach;
	}
	for (let i = 0; i < line.length - 1; i++) {
		if (
			distanceToSegment(point, line[i] as Point, line[i + 1] as Point) <= reach
		) {
			return true;
		}
	}
	return false;
}

export type { Box };
