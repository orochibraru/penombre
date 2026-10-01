import type { Box, Geometry, PathDef } from "./model";

/**
 * Shape outlines as SVG path data, in whatever unit the box is given in.
 *
 * DrawingML defines some two hundred preset shapes as formulas. These are the
 * ones the editor offers plus the ones decks commonly carry; anything else
 * draws as its bounding rectangle but keeps its preset in the file.
 */

export interface Outline {
	d: string;
	fill: boolean;
	stroke: boolean;
}

export const LINE_PRESETS = new Set([
	"line",
	"straightConnector1",
	"bentConnector2",
	"bentConnector3",
	"curvedConnector3",
]);

const DEFAULT_ADJUST: Record<string, Record<string, number>> = {
	roundRect: { adj: 16_667 },
	triangle: { adj: 50_000 },
	parallelogram: { adj: 25_000 },
	trapezoid: { adj: 25_000 },
	hexagon: { adj: 25_000 },
	octagon: { adj: 29_289 },
	star4: { adj: 12_500 },
	star5: { adj: 19_098 },
	star6: { adj: 28_868 },
	rightArrow: { adj1: 50_000, adj2: 50_000 },
	leftArrow: { adj1: 50_000, adj2: 50_000 },
	upArrow: { adj1: 50_000, adj2: 50_000 },
	downArrow: { adj1: 50_000, adj2: 50_000 },
	leftRightArrow: { adj1: 50_000, adj2: 50_000 },
	chevron: { adj: 50_000 },
	homePlate: { adj: 50_000 },
	plus: { adj: 25_000 },
	wedgeRectCallout: { adj1: -20_833, adj2: 62_500 },
	wedgeRoundRectCallout: { adj1: -20_833, adj2: 62_500, adj3: 16_667 },
	wedgeEllipseCallout: { adj1: -20_833, adj2: 62_500 },
	bentConnector3: { adj1: 50_000 },
};

/** A preset's adjust values, the file's over the defaults. */
export function adjustments(
	preset: string,
	adj?: Record<string, number>,
): Record<string, number> {
	const defaults = DEFAULT_ADJUST[preset] ?? {};
	const values = { ...defaults, ...adj };
	// `adj` and `adj1` name the same handle on single-handle shapes.
	if (adj?.adj1 !== undefined && "adj" in defaults && !("adj" in adj)) {
		values.adj = adj.adj1;
	}
	return values;
}

const round = (value: number) => Math.round(value * 100) / 100;

function polygon(points: [number, number][]): string {
	return `${points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${round(x)} ${round(y)}`).join(" ")} Z`;
}

function roundedRect(w: number, h: number, r: number): string {
	const radius = Math.max(0, Math.min(r, w / 2, h / 2));
	if (radius === 0) {
		return polygon([
			[0, 0],
			[w, 0],
			[w, h],
			[0, h],
		]);
	}
	const a = round(radius);
	return `M${a} 0 H${round(w - radius)} A${a} ${a} 0 0 1 ${round(w)} ${a} V${round(h - radius)} A${a} ${a} 0 0 1 ${round(w - radius)} ${round(h)} H${a} A${a} ${a} 0 0 1 0 ${round(h - radius)} V${a} A${a} ${a} 0 0 1 ${a} 0 Z`;
}

function ellipse(w: number, h: number): string {
	const rx = round(w / 2);
	const ry = round(h / 2);
	return `M0 ${ry} A${rx} ${ry} 0 1 1 ${round(w)} ${ry} A${rx} ${ry} 0 1 1 0 ${ry} Z`;
}

function star(w: number, h: number, points: number, inner: number): string {
	const vertices: [number, number][] = [];
	for (let i = 0; i < points * 2; i++) {
		const angle = (Math.PI * i) / points - Math.PI / 2;
		const ratio = i % 2 === 0 ? 1 : inner;
		vertices.push([
			w / 2 + (w / 2) * ratio * Math.cos(angle),
			h / 2 + (h / 2) * ratio * Math.sin(angle),
		]);
	}
	return polygon(vertices);
}

function regular(w: number, h: number, sides: number): string {
	const vertices: [number, number][] = [];
	for (let i = 0; i < sides; i++) {
		const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
		vertices.push([
			w / 2 + (w / 2) * Math.cos(angle),
			h / 2 + (h / 2) * Math.sin(angle),
		]);
	}
	return polygon(vertices);
}

function arrow(w: number, h: number, a: Record<string, number>): string {
	const shaft = (h * (a.adj1 ?? 50_000)) / 100_000;
	const head = Math.min(w, (Math.min(w, h) * (a.adj2 ?? 50_000)) / 100_000);
	const top = (h - shaft) / 2;
	return polygon([
		[0, top],
		[w - head, top],
		[w - head, 0],
		[w, h / 2],
		[w - head, h],
		[w - head, h - top],
		[0, h - top],
	]);
}

function doubleArrow(w: number, h: number, a: Record<string, number>): string {
	const shaft = (h * (a.adj1 ?? 50_000)) / 100_000;
	const head = Math.min(w / 2, (Math.min(w, h) * (a.adj2 ?? 50_000)) / 100_000);
	const top = (h - shaft) / 2;
	return polygon([
		[0, h / 2],
		[head, 0],
		[head, top],
		[w - head, top],
		[w - head, 0],
		[w, h / 2],
		[w - head, h],
		[w - head, h - top],
		[head, h - top],
		[head, h],
	]);
}

/** The same outline turned so it points another way, in a w×h box. */
function turned(
	d: (w: number, h: number) => string,
	w: number,
	h: number,
	quarterTurns: number,
): string {
	const swap = quarterTurns % 2 === 1;
	const source = d(swap ? h : w, swap ? w : h);
	return source.replace(
		/(-?[\d.]+) (-?[\d.]+)/g,
		(_whole, xs: string, ys: string) => {
			const x = Number(xs);
			const y = Number(ys);
			if (quarterTurns === 1) {
				return `${round(w - y)} ${round(x)}`;
			}
			if (quarterTurns === 2) {
				return `${round(w - x)} ${round(h - y)}`;
			}
			return `${round(y)} ${round(h - x)}`;
		},
	);
}

function callout(
	w: number,
	h: number,
	a: Record<string, number>,
	body: "rect" | "round" | "ellipse",
): string {
	const tipX = w / 2 + (w * (a.adj1 ?? 0)) / 100_000;
	const tipY = h / 2 + (h * (a.adj2 ?? 0)) / 100_000;
	const base =
		body === "ellipse"
			? ellipse(w, h)
			: roundedRect(
					w,
					h,
					body === "round"
						? (Math.min(w, h) * (a.adj3 ?? 16_667)) / 100_000
						: 0,
				);
	// The tail leaves the edge nearest the tip, from a base a fifth as wide.
	const horizontal = Math.abs(tipX - w / 2) / w > Math.abs(tipY - h / 2) / h;
	let tail: [number, number][];
	if (horizontal) {
		const x = tipX < w / 2 ? w * 0.1 : w * 0.9;
		tail = [
			[x, h * 0.4],
			[tipX, tipY],
			[x, h * 0.6],
		];
	} else {
		const y = tipY < h / 2 ? h * 0.1 : h * 0.9;
		tail = [
			[w * 0.35, y],
			[tipX, tipY],
			[w * 0.55, y],
		];
	}
	return `${base} ${polygon(tail)}`;
}

function heart(w: number, h: number): string {
	return `M${round(w / 2)} ${round(h * 0.25)} C${round(w / 2)} ${round(-h * 0.08)} ${round(-w * 0.05)} ${round(h * 0.05)} ${round(w * 0.05)} ${round(h * 0.4)} C${round(w * 0.14)} ${round(h * 0.65)} ${round(w * 0.4)} ${round(h * 0.8)} ${round(w / 2)} ${round(h)} C${round(w * 0.6)} ${round(h * 0.8)} ${round(w * 0.86)} ${round(h * 0.65)} ${round(w * 0.95)} ${round(h * 0.4)} C${round(w * 1.05)} ${round(h * 0.05)} ${round(w / 2)} ${round(-h * 0.08)} ${round(w / 2)} ${round(h * 0.25)} Z`;
}

type Builder = (w: number, h: number, a: Record<string, number>) => string;

const ss = (w: number, h: number) => Math.min(w, h);

const FILLED: Record<string, Builder> = {
	rect: (w, h) => roundedRect(w, h, 0),
	roundRect: (w, h, a) =>
		roundedRect(w, h, (ss(w, h) * (a.adj ?? 0)) / 100_000),
	ellipse,
	triangle: (w, h, a) =>
		polygon([
			[(w * (a.adj ?? 50_000)) / 100_000, 0],
			[w, h],
			[0, h],
		]),
	rtTriangle: (w, h) =>
		polygon([
			[0, 0],
			[w, h],
			[0, h],
		]),
	diamond: (w, h) =>
		polygon([
			[w / 2, 0],
			[w, h / 2],
			[w / 2, h],
			[0, h / 2],
		]),
	parallelogram: (w, h, a) => {
		const x = (ss(w, h) * (a.adj ?? 0)) / 100_000;
		return polygon([
			[x, 0],
			[w, 0],
			[w - x, h],
			[0, h],
		]);
	},
	trapezoid: (w, h, a) => {
		const x = (ss(w, h) * (a.adj ?? 0)) / 100_000;
		return polygon([
			[x, 0],
			[w - x, 0],
			[w, h],
			[0, h],
		]);
	},
	pentagon: (w, h) => regular(w, h, 5),
	hexagon: (w, h, a) => {
		const x = (ss(w, h) * (a.adj ?? 0)) / 100_000;
		return polygon([
			[x, 0],
			[w - x, 0],
			[w, h / 2],
			[w - x, h],
			[x, h],
			[0, h / 2],
		]);
	},
	octagon: (w, h, a) => {
		const x = (ss(w, h) * (a.adj ?? 0)) / 100_000;
		return polygon([
			[x, 0],
			[w - x, 0],
			[w, x],
			[w, h - x],
			[w - x, h],
			[x, h],
			[0, h - x],
			[0, x],
		]);
	},
	star4: (w, h, a) => star(w, h, 4, ((a.adj ?? 12_500) / 50_000) * 1.2),
	star5: (w, h, a) => star(w, h, 5, (a.adj ?? 19_098) / 50_000),
	star6: (w, h, a) => star(w, h, 6, (a.adj ?? 28_868) / 50_000),
	rightArrow: arrow,
	leftArrow: (w, h, a) => turned((ww, hh) => arrow(ww, hh, a), w, h, 2),
	upArrow: (w, h, a) => turned((ww, hh) => arrow(ww, hh, a), w, h, 3),
	downArrow: (w, h, a) => turned((ww, hh) => arrow(ww, hh, a), w, h, 1),
	leftRightArrow: doubleArrow,
	chevron: (w, h, a) => {
		const x = Math.min(w, (ss(w, h) * (a.adj ?? 0)) / 100_000);
		return polygon([
			[0, 0],
			[w - x, 0],
			[w, h / 2],
			[w - x, h],
			[0, h],
			[x, h / 2],
		]);
	},
	homePlate: (w, h, a) => {
		const x = Math.min(w, (ss(w, h) * (a.adj ?? 0)) / 100_000);
		return polygon([
			[0, 0],
			[w - x, 0],
			[w, h / 2],
			[w - x, h],
			[0, h],
		]);
	},
	plus: (w, h, a) => {
		const x = (ss(w, h) * (a.adj ?? 0)) / 100_000;
		return polygon([
			[x, 0],
			[w - x, 0],
			[w - x, x],
			[w, x],
			[w, h - x],
			[w - x, h - x],
			[w - x, h],
			[x, h],
			[x, h - x],
			[0, h - x],
			[0, x],
			[x, x],
		]);
	},
	heart,
	wedgeRectCallout: (w, h, a) => callout(w, h, a, "rect"),
	wedgeRoundRectCallout: (w, h, a) => callout(w, h, a, "round"),
	wedgeEllipseCallout: (w, h, a) => callout(w, h, a, "ellipse"),
	flowChartProcess: (w, h) => roundedRect(w, h, 0),
	flowChartAlternateProcess: (w, h) => roundedRect(w, h, ss(w, h) / 6),
	flowChartTerminator: (w, h) => roundedRect(w, h, h / 2),
	flowChartDecision: (w, h) =>
		polygon([
			[w / 2, 0],
			[w, h / 2],
			[w / 2, h],
			[0, h / 2],
		]),
};

const OPEN: Record<string, Builder> = {
	line: (w, h) => `M0 0 L${round(w)} ${round(h)}`,
	straightConnector1: (w, h) => `M0 0 L${round(w)} ${round(h)}`,
	bentConnector2: (w, h) => `M0 0 L${round(w)} 0 L${round(w)} ${round(h)}`,
	bentConnector3: (w, h, a) => {
		const x = round((w * (a.adj1 ?? 50_000)) / 100_000);
		return `M0 0 L${x} 0 L${x} ${round(h)} L${round(w)} ${round(h)}`;
	},
	curvedConnector3: (w, h) =>
		`M0 0 C${round(w / 2)} 0 ${round(w / 2)} ${round(h)} ${round(w)} ${round(h)}`,
};

/** Scale a custom path into the box, turning arcs into SVG arcs. */
function customPath(path: PathDef, w: number, h: number): string {
	const sx = path.w > 0 ? w / path.w : 1;
	const sy = path.h > 0 ? h / path.h : 1;
	let current: [number, number] = [0, 0];
	const parts: string[] = [];
	for (const command of path.commands) {
		const v = command.v;
		if (command.op === "Z") {
			parts.push("Z");
			continue;
		}
		if (command.op === "A") {
			const [wR = 0, hR = 0, start = 0, swing = 0] = v;
			const rx = wR * sx;
			const ry = hR * sy;
			const a0 = (start * Math.PI) / 180;
			const a1 = ((start + swing) * Math.PI) / 180;
			const cx = current[0] - rx * Math.cos(a0);
			const cy = current[1] - ry * Math.sin(a0);
			current = [cx + rx * Math.cos(a1), cy + ry * Math.sin(a1)];
			parts.push(
				`A${round(rx)} ${round(ry)} 0 ${Math.abs(swing) > 180 ? 1 : 0} ${swing > 0 ? 1 : 0} ${round(current[0])} ${round(current[1])}`,
			);
			continue;
		}
		const points: string[] = [];
		for (let i = 0; i + 1 < v.length; i += 2) {
			current = [(v[i] ?? 0) * sx, (v[i + 1] ?? 0) * sy];
			points.push(`${round(current[0])} ${round(current[1])}`);
		}
		parts.push(`${command.op}${points.join(" ")}`);
	}
	return parts.join(" ");
}

/** The outlines to draw for a geometry in a `w` × `h` box. */
export function outlines(
	geometry: Geometry | undefined,
	w: number,
	h: number,
): Outline[] {
	if (!geometry) {
		return [{ d: FILLED.rect?.(w, h, {}) ?? "", fill: true, stroke: true }];
	}
	if ("paths" in geometry) {
		return geometry.paths.map((path) => ({
			d: customPath(path, w, h),
			fill: path.fill !== false,
			stroke: path.stroke !== false,
		}));
	}
	const values = adjustments(geometry.preset, geometry.adj);
	const open = OPEN[geometry.preset];
	if (open) {
		return [{ d: open(w, h, values), fill: false, stroke: true }];
	}
	const build = FILLED[geometry.preset] ?? FILLED.rect;
	return [{ d: build?.(w, h, values) ?? "", fill: true, stroke: true }];
}

export function isLine(geometry: Geometry | undefined): boolean {
	return (
		!!geometry && "preset" in geometry && LINE_PRESETS.has(geometry.preset)
	);
}

/** An arrowhead at `tip`, pointing away from `from`, as a closed path. */
export function arrowHead(
	tip: [number, number],
	from: [number, number],
	width: number,
	type: string,
): string {
	const angle = Math.atan2(tip[1] - from[1], tip[0] - from[0]);
	const length = Math.max(width * 3, 4);
	const spread = type === "arrow" ? 0.5 : 0.45;
	const back = (a: number): [number, number] => [
		tip[0] - length * Math.cos(angle + a),
		tip[1] - length * Math.sin(angle + a),
	];
	if (type === "oval") {
		const r = round(length / 2.5);
		return `M${round(tip[0] - r)} ${round(tip[1])} a${r} ${r} 0 1 0 ${round(r * 2)} 0 a${r} ${r} 0 1 0 ${round(-r * 2)} 0 Z`;
	}
	if (type === "diamond") {
		const mid = back(0);
		const half = length / 2;
		return polygon([
			tip,
			[
				(tip[0] + mid[0]) / 2 + half * 0.5 * Math.cos(angle + Math.PI / 2),
				(tip[1] + mid[1]) / 2 + half * 0.5 * Math.sin(angle + Math.PI / 2),
			],
			mid,
			[
				(tip[0] + mid[0]) / 2 - half * 0.5 * Math.cos(angle + Math.PI / 2),
				(tip[1] + mid[1]) / 2 - half * 0.5 * Math.sin(angle + Math.PI / 2),
			],
		]);
	}
	if (type === "arrow") {
		const [a, b] = [back(spread), back(-spread)];
		return `M${round(a[0])} ${round(a[1])} L${round(tip[0])} ${round(tip[1])} L${round(b[0])} ${round(b[1])}`;
	}
	return polygon([tip, back(spread), back(-spread)]);
}

// =========================================================================
// Boxes
// =========================================================================

export type Point = [number, number];

export function center(box: Box): Point {
	return [box.x + box.w / 2, box.y + box.h / 2];
}

export function rotatePoint(
	point: Point,
	pivot: Point,
	degrees: number,
): Point {
	const angle = (degrees * Math.PI) / 180;
	const [dx, dy] = [point[0] - pivot[0], point[1] - pivot[1]];
	return [
		pivot[0] + dx * Math.cos(angle) - dy * Math.sin(angle),
		pivot[1] + dx * Math.sin(angle) + dy * Math.cos(angle),
	];
}

/** The four corners of a box, turned by its rotation. */
export function corners(box: Box): Point[] {
	const pivot = center(box);
	const rot = box.rot ?? 0;
	return (
		[
			[box.x, box.y],
			[box.x + box.w, box.y],
			[box.x + box.w, box.y + box.h],
			[box.x, box.y + box.h],
		] as Point[]
	).map((point) => rotatePoint(point, pivot, rot));
}

/** The axis-aligned rectangle a box covers once rotated. */
export function bounds(box: Box): Box {
	const points = corners(box);
	const xs = points.map((point) => point[0]);
	const ys = points.map((point) => point[1]);
	const x = Math.min(...xs);
	const y = Math.min(...ys);
	return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/** The rectangle around several boxes. */
export function union(boxes: Box[]): Box | null {
	if (boxes.length === 0) {
		return null;
	}
	const all = boxes.map(bounds);
	const x = Math.min(...all.map((box) => box.x));
	const y = Math.min(...all.map((box) => box.y));
	const right = Math.max(...all.map((box) => box.x + box.w));
	const bottom = Math.max(...all.map((box) => box.y + box.h));
	return { x, y, w: right - x, h: bottom - y };
}

export function intersects(a: Box, b: Box): boolean {
	return (
		a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
	);
}
