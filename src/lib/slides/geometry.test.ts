import { describe, expect, it } from "bun:test";

import {
	adjustments,
	arrowHead,
	bounds,
	center,
	corners,
	intersects,
	isLine,
	outlines,
	union,
} from "./geometry";

const path = (preset: string, adj?: Record<string, number>) =>
	outlines({ preset, adj }, 100, 60)[0]?.d;

/** The vertices of a polygon outline, as numbers. */
const vertices = (d: string | undefined): [number, number][] =>
	[...(d ?? "").matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((match) => [
		Number(match[1]),
		Number(match[2]),
	]);

describe("adjustments", () => {
	it("takes the preset's defaults, then the file's values", () => {
		expect(adjustments("roundRect")).toEqual({ adj: 16_667 });
		expect(adjustments("roundRect", { adj: 5000 })).toEqual({ adj: 5000 });
		expect(adjustments("rightArrow", { adj2: 10_000 })).toEqual({
			adj1: 50_000,
			adj2: 10_000,
		});
		expect(adjustments("unknown", { adj: 3 })).toEqual({ adj: 3 });
		expect(adjustments("unknown")).toEqual({});
	});

	it("reads adj1 as adj on a single-handle shape", () => {
		expect(adjustments("chevron", { adj1: 20_000 })).toEqual({
			adj: 20_000,
			adj1: 20_000,
		});
		expect(adjustments("chevron", { adj: 10_000, adj1: 20_000 }).adj).toBe(
			10_000,
		);
		expect(adjustments("rightArrow", { adj1: 20_000 })).toEqual({
			adj1: 20_000,
			adj2: 50_000,
		});
	});
});

describe("outlines", () => {
	it("draws a rectangle with no geometry", () => {
		expect(outlines(undefined, 10, 20)).toEqual([
			{ d: "M0 0 L10 0 L10 20 L0 20 Z", fill: true, stroke: true },
		]);
	});

	it("rounds a rectangle's corners, clamped to half its short side", () => {
		expect(path("roundRect")).toBe(
			"M10 0 H90 A10 10 0 0 1 100 10 V50 A10 10 0 0 1 90 60 H10 A10 10 0 0 1 0 50 V10 A10 10 0 0 1 10 0 Z",
		);
		expect(path("roundRect", { adj: 0 })).toBe("M0 0 L100 0 L100 60 L0 60 Z");
		expect(path("roundRect", { adj: 100_000 })).toStartWith("M30 0 H70 A30 30");
	});

	it("draws the polygon presets from their handles", () => {
		expect(path("triangle")).toBe("M50 0 L100 60 L0 60 Z");
		expect(path("triangle", { adj: 0 })).toBe("M0 0 L100 60 L0 60 Z");
		expect(path("rtTriangle")).toBe("M0 0 L100 60 L0 60 Z");
		expect(path("diamond")).toBe("M50 0 L100 30 L50 60 L0 30 Z");
		expect(path("flowChartDecision")).toBe(path("diamond"));
		expect(path("parallelogram")).toBe("M15 0 L100 0 L85 60 L0 60 Z");
		expect(path("trapezoid")).toBe("M15 0 L85 0 L100 60 L0 60 Z");
		expect(path("hexagon")).toBe("M15 0 L85 0 L100 30 L85 60 L15 60 L0 30 Z");
		expect(path("octagon")).toBe(
			"M17.57 0 L82.43 0 L100 17.57 L100 42.43 L82.43 60 L17.57 60 L0 42.43 L0 17.57 Z",
		);
		expect(path("plus")).toBe(
			"M15 0 L85 0 L85 15 L100 15 L100 45 L85 45 L85 60 L15 60 L15 45 L0 45 L0 15 L15 15 Z",
		);
		expect(path("chevron")).toBe("M0 0 L70 0 L100 30 L70 60 L0 60 L30 30 Z");
		expect(path("homePlate")).toBe("M0 0 L70 0 L100 30 L70 60 L0 60 Z");
	});

	it("draws regular polygons and stars from the top centre", () => {
		const pentagon = vertices(path("pentagon"));
		expect(pentagon).toHaveLength(5);
		expect(pentagon[0]).toEqual([50, 0]);
		for (const [preset, points] of [
			["star4", 4],
			["star5", 5],
			["star6", 6],
		] as const) {
			const star = vertices(path(preset));
			expect(star).toHaveLength(points * 2);
			expect(star[0]).toEqual([50, 0]);
			const reach = ([x, y]: [number, number]) =>
				Math.hypot((x - 50) / 50, (y - 30) / 30);
			const [outer = [0, 0], inner = [0, 0]] = star;
			expect(reach(inner)).toBeLessThan(reach(outer));
		}
	});

	it("points an arrow each way by turning the same outline", () => {
		expect(path("rightArrow")).toBe(
			"M0 15 L70 15 L70 0 L100 30 L70 60 L70 45 L0 45 Z",
		);
		expect(path("leftArrow")).toBe(
			"M100 45 L30 45 L30 60 L0 30 L30 0 L30 15 L100 15 Z",
		);
		expect(path("downArrow")).toBe(
			"M75 0 L75 30 L100 30 L50 60 L0 30 L25 30 L25 0 Z",
		);
		expect(path("upArrow")).toBe(
			"M25 60 L25 30 L0 30 L50 0 L100 30 L75 30 L75 60 Z",
		);
		expect(path("leftRightArrow")).toBe(
			"M0 30 L30 0 L30 15 L70 15 L70 0 L100 30 L70 60 L70 45 L30 45 L30 60 Z",
		);
	});

	it("draws ellipses, hearts and the flowchart boxes", () => {
		const ellipse = "M0 30 A50 30 0 1 1 100 30 A50 30 0 1 1 0 30 Z";
		expect(path("ellipse")).toBe(ellipse);
		const heart = path("heart") ?? "";
		expect(heart).toStartWith("M50 15 C");
		expect(heart.match(/C/g)).toHaveLength(4);
		expect(heart).toEndWith("Z");
		expect(path("flowChartProcess")).toBe("M0 0 L100 0 L100 60 L0 60 Z");
		expect(path("flowChartAlternateProcess")).toStartWith("M10 0 H90 A10 10");
		expect(path("flowChartTerminator")).toStartWith("M30 0 H70 A30 30");
	});

	it("sends a callout's tail toward its tip, from the nearest edge", () => {
		expect(path("wedgeRectCallout")).toBe(
			"M0 0 L100 0 L100 60 L0 60 Z M35 54 L29.17 67.5 L55 54 Z",
		);
		expect(path("wedgeRectCallout", { adj1: 0, adj2: -80_000 })).toEndWith(
			"M35 6 L50 -18 L55 6 Z",
		);
		expect(path("wedgeRectCallout", { adj1: 60_000, adj2: 0 })).toEndWith(
			"M90 24 L110 30 L90 36 Z",
		);
		expect(path("wedgeRectCallout", { adj1: -60_000, adj2: 0 })).toEndWith(
			"M10 24 L-10 30 L10 36 Z",
		);
		expect(path("wedgeRoundRectCallout")).toStartWith("M10 0 H90 A10 10");
		expect(path("wedgeEllipseCallout")).toStartWith(
			"M0 30 A50 30 0 1 1 100 30",
		);
	});

	it("draws connectors open", () => {
		const open = (preset: string, adj?: Record<string, number>) =>
			outlines({ preset, adj }, 100, 60)[0];
		expect(open("straightConnector1")).toEqual({
			d: "M0 0 L100 60",
			fill: false,
			stroke: true,
		});
		expect(open("bentConnector2")?.d).toBe("M0 0 L100 0 L100 60");
		expect(open("bentConnector3")?.d).toBe("M0 0 L50 0 L50 60 L100 60");
		expect(open("bentConnector3", { adj1: 25_000 })?.d).toBe(
			"M0 0 L25 0 L25 60 L100 60",
		);
		expect(open("curvedConnector3")?.d).toBe("M0 0 C50 0 50 60 100 60");
	});

	it("scales custom paths and turns arcs into SVG arcs", () => {
		const [half, whole, unscaled] = outlines(
			{
				paths: [
					{
						w: 100,
						h: 100,
						commands: [
							{ op: "M", v: [0, 50] },
							{ op: "A", v: [50, 50, 180, 180] },
							{ op: "Z", v: [] },
						],
					},
					{
						w: 100,
						h: 100,
						stroke: false,
						commands: [
							{ op: "M", v: [100, 50] },
							{ op: "A", v: [50, 50, 0, -270] },
						],
					},
					{
						w: 0,
						h: 0,
						commands: [
							{ op: "M", v: [5, 5] },
							{ op: "C", v: [1, 2, 3, 4, 5, 6, 7] },
						],
					},
				],
			},
			100,
			100,
		);
		expect(half).toEqual({
			d: "M0 50 A50 50 0 0 1 100 50 Z",
			fill: true,
			stroke: true,
		});
		expect(whole).toEqual({
			d: "M100 50 A50 50 0 1 0 50 100",
			fill: true,
			stroke: false,
		});
		expect(unscaled?.d).toBe("M5 5 C1 2 3 4 5 6");
	});
});

describe("isLine", () => {
	it("knows lines and connectors only", () => {
		expect(isLine({ preset: "line" })).toBe(true);
		expect(isLine({ preset: "curvedConnector3" })).toBe(true);
		expect(isLine({ preset: "rect" })).toBe(false);
		expect(isLine({ paths: [] })).toBe(false);
		expect(isLine(undefined)).toBe(false);
	});
});

describe("arrowHead", () => {
	it("draws each head pointing away from where the line comes from", () => {
		expect(arrowHead([10, 0], [0, 0], 1, "triangle")).toBe(
			"M10 0 L6.4 -1.74 L6.4 1.74 Z",
		);
		expect(arrowHead([10, 0], [0, 0], 1, "arrow")).toBe(
			"M6.49 -1.92 L10 0 L6.49 1.92",
		);
		expect(arrowHead([10, 0], [0, 0], 1, "oval")).toBe(
			"M8.4 0 a1.6 1.6 0 1 0 3.2 0 a1.6 1.6 0 1 0 -3.2 0 Z",
		);
		expect(arrowHead([10, 0], [0, 0], 1, "diamond")).toBe(
			"M10 0 L8 1 L6 0 L8 -1 Z",
		);
	});

	it("grows with the line's width and follows its direction", () => {
		expect(arrowHead([0, 10], [0, 0], 2, "diamond")).toBe(
			"M0 10 L-1.5 7 L0 4 L1.5 7 Z",
		);
	});
});

describe("boxes", () => {
	const box = { x: 10, y: 20, w: 100, h: 40 };

	it("finds the centre and the corners, turned", () => {
		expect(center(box)).toEqual([60, 40]);
		expect(corners(box)).toEqual([
			[10, 20],
			[110, 20],
			[110, 60],
			[10, 60],
		]);
		const turned = corners({ ...box, rot: 180 }).map(([x, y]) => [
			Math.round(x),
			Math.round(y),
		]);
		expect(turned).toEqual([
			[110, 60],
			[10, 60],
			[10, 20],
			[110, 20],
		]);
	});

	it("measures what several boxes cover", () => {
		expect(union([])).toBeNull();
		expect(union([box, { x: 0, y: 70, w: 20, h: 10 }])).toEqual({
			x: 0,
			y: 20,
			w: 110,
			h: 60,
		});
		const turned = union([{ x: 0, y: 0, w: 100, h: 20, rot: 90 }]);
		expect(turned && Math.round(turned.x)).toBe(40);
		expect(turned && Math.round(turned.y)).toBe(-40);
		expect(bounds(box)).toEqual({ x: 10, y: 20, w: 100, h: 40 });
	});

	it("tells overlapping boxes from touching and apart ones", () => {
		expect(intersects(box, { x: 100, y: 50, w: 20, h: 20 })).toBe(true);
		expect(intersects(box, { x: 110, y: 20, w: 20, h: 20 })).toBe(false);
		expect(intersects(box, { x: 10, y: 60, w: 20, h: 20 })).toBe(false);
		expect(intersects(box, { x: 300, y: 300, w: 1, h: 1 })).toBe(false);
	});
});
