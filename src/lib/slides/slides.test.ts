import { describe, expect, it } from "bun:test";
import {
	cssBackground,
	cssColor,
	hexColor,
	paletteOf,
	withAlpha,
} from "./color";
import {
	align,
	boxFromEnds,
	distribute,
	group,
	History,
	lineEnds,
	resizeBox,
	restack,
	rotationTo,
	snapBox,
	ungroup,
} from "./edit";
import { bounds, outlines, rotatePoint } from "./geometry";
import {
	isStroke,
	simplify,
	smoothPath,
	strokeShape,
	touchesStroke,
} from "./ink";
import { applyTemplate, relayout, slideFromLayout } from "./layouts";
import {
	type Deck,
	nextElementId,
	type ShapeElement,
	type SlideElement,
	sameValue,
	withFreshIds,
} from "./model";
import { renderSlideSvg } from "./render-svg";
import {
	deleteRange,
	insertText,
	normalizeRuns,
	paragraphText,
	rangeRuns,
	splitParagraph,
	styleAll,
	styleParagraphs,
	styleRange,
} from "./rich-text";
import { TEMPLATE_IDS, templateDeck } from "./templates";
import {
	autoNumber,
	bulletFont,
	bulletGlyph,
	bulletLabels,
	effectiveParagraph,
	effectiveRun,
	mergeLevels,
	textWidth,
} from "./text";

const palette = {
	colors: {
		dk1: "000000",
		lt1: "FFFFFF",
		accent1: "FF0000",
		dk2: "112233",
		lt2: "EEEEEE",
	},
	colorMap: { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" },
};

const rect = (
	id: string,
	x: number,
	y: number,
	w = 100,
	h = 100,
): ShapeElement => ({
	kind: "shape",
	id,
	x,
	y,
	w,
	h,
	geometry: { preset: "rect" },
	fill: { type: "none" },
	line: { fill: { type: "none" }, width: 0 },
});

describe("colour", () => {
	it("maps text colours through the colour map", () => {
		expect(cssColor({ scheme: "tx1" }, palette)).toBe("rgb(0, 0, 0)");
		expect(
			cssColor({ scheme: "tx1" }, { ...palette, colorMap: { tx1: "lt1" } }),
		).toBe("rgb(255, 255, 255)");
	});

	it("applies luminance, tint and alpha", () => {
		expect(
			hexColor({ scheme: "accent1", mods: [["lumMod", 50_000]] }, palette),
		).toBe("#800000");
		expect(hexColor({ rgb: "000000", mods: [["tint", 50_000]] }, palette)).toBe(
			"#808080",
		);
		expect(cssColor(withAlpha({ rgb: "FF0000" }, 0.5), palette)).toBe(
			"rgba(255, 0, 0, 0.5)",
		);
		expect(withAlpha({ rgb: "FF0000", mods: [["alpha", 1]] }, 1)).toEqual({
			rgb: "FF0000",
			mods: undefined,
		});
	});

	it("turns DrawingML's gradient angle into CSS's", () => {
		const css = cssBackground(
			{
				type: "gradient",
				angle: 90,
				stops: [
					{ pos: 0, color: { rgb: "000000" } },
					{ pos: 100_000, color: { rgb: "FFFFFF" } },
				],
			},
			palette,
			(src) => src,
		);
		expect(css).toBe(
			"linear-gradient(180deg, rgb(0, 0, 0) 0%, rgb(255, 255, 255) 100%)",
		);
		expect(paletteOf(undefined).colorMap.tx1).toBe("dk1");
	});
});

describe("geometry", () => {
	it("draws presets, open lines and custom paths", () => {
		expect(outlines({ preset: "rect" }, 10, 20)[0]?.d).toBe(
			"M0 0 L10 0 L10 20 L0 20 Z",
		);
		expect(outlines({ preset: "line" }, 10, 20)[0]).toEqual({
			d: "M0 0 L10 20",
			fill: false,
			stroke: true,
		});
		expect(outlines({ preset: "nonsense" }, 10, 20)[0]?.d).toBe(
			"M0 0 L10 0 L10 20 L0 20 Z",
		);
		const custom = outlines(
			{
				paths: [
					{
						w: 100,
						h: 100,
						fill: false,
						commands: [
							{ op: "M", v: [0, 0] },
							{ op: "L", v: [100, 50] },
						],
					},
				],
			},
			50,
			50,
		)[0];
		expect(custom).toEqual({ d: "M0 0 L50 25", fill: false, stroke: true });
	});

	it("measures a rotated box by its corners", () => {
		const box = bounds({ x: 0, y: 0, w: 100, h: 20, rot: 90 });
		expect(Math.round(box.w)).toBe(20);
		expect(Math.round(box.h)).toBe(100);
		const [x, y] = rotatePoint([10, 0], [0, 0], 90);
		expect([Math.round(x), Math.round(y)]).toEqual([0, 10]);
	});

	it("has an outline for every shape the menu offers", () => {
		for (const preset of [
			"roundRect",
			"star5",
			"rightArrow",
			"wedgeRoundRectCallout",
			"heart",
			"chevron",
		]) {
			expect(outlines({ preset }, 100, 60)[0]?.d.length).toBeGreaterThan(10);
		}
	});
});

describe("text", () => {
	it("numbers lists, restarting after an interruption", () => {
		const body = {
			paragraphs: [
				{
					runs: [{ text: "a" }],
					bullet: { type: "number" as const, scheme: "arabicPeriod" },
				},
				{
					runs: [{ text: "b" }],
					bullet: { type: "number" as const, scheme: "arabicPeriod" },
				},
				{ runs: [{ text: "c" }], bullet: { type: "none" as const } },
				{
					runs: [{ text: "d" }],
					bullet: { type: "number" as const, scheme: "alphaUcParenR" },
				},
			],
			anchor: "t" as const,
			inset: [0, 0, 0, 0] as [number, number, number, number],
			wrap: true,
			autofit: "none" as const,
			levels: [],
		};
		expect(bulletLabels(body)).toEqual(["1.", "2.", null, "A)"]);
		expect(autoNumber("romanUcPeriod", 14)).toBe("XIV.");
	});

	it("folds a run over its level, scaled by autofit", () => {
		const body = {
			paragraphs: [],
			anchor: "t" as const,
			inset: [0, 0, 0, 0] as [number, number, number, number],
			wrap: true,
			autofit: "shrink" as const,
			fontScale: 0.5,
			levels: [{ size: 40, bold: true }],
		};
		const paragraph = effectiveParagraph({ runs: [] }, body);
		expect(effectiveRun({ italic: true }, paragraph, body)).toMatchObject({
			size: 20,
			bold: true,
			italic: true,
		});
		expect(mergeLevels([{ size: 1, bold: true }], [{ size: 2 }])).toEqual([
			{ size: 2, bold: true },
		]);
	});

	it("measures wider faces wider", () => {
		expect(textWidth("Hello", "Verdana", 20)).toBeGreaterThan(
			textWidth("Hello", "Arial", 20),
		);
		expect(textWidth("—", "Arial", 20)).toBe(20);
	});
});

describe("editing", () => {
	it("resizes from a corner, keeping the opposite one", () => {
		const box = { x: 0, y: 0, w: 100_000, h: 50_000 };
		expect(resizeBox(box, "se", [200_000, 150_000], false)).toMatchObject({
			x: 0,
			y: 0,
			w: 200_000,
			h: 150_000,
		});
		expect(resizeBox(box, "nw", [-100_000, -50_000], true)).toMatchObject({
			x: -100_000,
			y: -50_000,
			w: 200_000,
			h: 100_000,
		});
		expect(resizeBox(box, "e", [300_000, 0], true)).toMatchObject({
			w: 300_000,
			h: 150_000,
		});
	});

	it("keeps a rotated box's fixed corner where it was on the slide", () => {
		const start = { x: 0, y: 0, w: 100_000, h: 50_000, rot: 90 };
		const fixed = rotatePoint([0, 0], [50_000, 25_000], 90);
		const next = resizeBox(
			start,
			"se",
			rotatePoint([200_000, 50_000], [50_000, 25_000], 90),
			false,
		);
		const after = rotatePoint(
			[next.x, next.y],
			[next.x + next.w / 2, next.y + next.h / 2],
			90,
		);
		expect(Math.round(after[0])).toBe(Math.round(fixed[0]));
		expect(Math.round(after[1])).toBe(Math.round(fixed[1]));
		expect(Math.round(next.w)).toBe(200_000);
	});

	it("rotates to the pointer, in steps when asked", () => {
		expect(
			rotationTo({ x: 0, y: 0, w: 100, h: 100 }, [150, 50], undefined),
		).toBeCloseTo(90);
		expect(rotationTo({ x: 0, y: 0, w: 100, h: 100 }, [100, 49], 15)).toBe(90);
	});

	it("turns a line's ends into a box and back", () => {
		const box = boxFromEnds([100, 0], [0, 50]);
		expect(box).toMatchObject({ x: 0, y: 0, w: 100, h: 50, flipH: true });
		expect(lineEnds(box)).toEqual([
			[100, 0],
			[0, 50],
		]);
	});

	it("snaps to the slide's centre and other objects' edges", () => {
		const snap = snapBox(
			{ x: 427, y: 0, w: 100, h: 50 },
			[],
			{ w: 960, h: 540 },
			5,
		);
		expect(snap.dx).toBe(3);
		expect(snap.guides).toContainEqual({ axis: "x", at: 480 });
		const edge = snapBox(
			{ x: 202, y: 300, w: 10, h: 10 },
			[{ x: 0, y: 0, w: 200, h: 100 }],
			{ w: 960, h: 540 },
			5,
		);
		expect(edge.dx).toBe(-2);
	});

	it("aligns, distributes and restacks", () => {
		const elements = [
			rect("1", 0, 0),
			rect("2", 300, 50),
			rect("3", 1000, 100),
		];
		const ids = new Set(["1", "2", "3"]);
		expect(align(elements, ids, "top", { w: 1, h: 1 }).map((e) => e.y)).toEqual(
			[0, 0, 0],
		);
		expect(distribute(elements, ids, "x").map((e) => e.x)).toEqual([
			0, 500, 1000,
		]);
		expect(restack(elements, new Set(["1"]), "front").map((e) => e.id)).toEqual(
			["2", "3", "1"],
		);
		expect(
			restack(elements, new Set(["3"]), "backward").map((e) => e.id),
		).toEqual(["1", "3", "2"]);
	});

	it("groups and ungroups without moving anything", () => {
		const elements: SlideElement[] = [rect("1", 0, 0), rect("2", 300, 50)];
		const grouped = group(elements, new Set(["1", "2"]), "9");
		expect(grouped).toHaveLength(1);
		expect(grouped[0]).toMatchObject({
			kind: "group",
			x: 0,
			y: 0,
			w: 400,
			h: 150,
		});
		expect(ungroup(grouped, new Set(["9"]))).toEqual(elements);
	});

	it("undoes and redoes, forgetting the redo on a new change", () => {
		const history = new History<number>(2);
		history.record(1);
		history.record(2);
		history.record(3);
		expect(history.undo(4)).toBe(3);
		expect(history.redo(3)).toBe(4);
		expect(history.undo(4)).toBe(3);
		expect(history.undo(3)).toBe(2);
		expect(history.undo(2)).toBeNull();
	});

	it("gives pasted elements ids the slide does not use", () => {
		const taken = [rect("5", 0, 0)];
		expect(nextElementId(taken)).toBe("6");
		expect(withFreshIds([rect("5", 0, 0)], taken)[0]?.id).toBe("6");
		expect(sameValue({ a: [1, { b: undefined }] }, { a: [1, {}] })).toBe(true);
	});
});

describe("ink", () => {
	it("simplifies a straight trail to its ends and smooths the rest", () => {
		expect(
			simplify(
				[
					[0, 0],
					[1, 0],
					[2, 0],
					[3, 0],
				],
				0.5,
			),
		).toEqual([
			[0, 0],
			[3, 0],
		]);
		const path = smoothPath([
			[0, 0],
			[10, 10],
			[20, 0],
		]);
		expect(path.map((command) => command.op)).toEqual(["M", "C", "C"]);
	});

	it("becomes an unfilled custom shape the eraser can find", () => {
		const stroke = strokeShape(
			[
				[100, 100],
				[5000, 100],
				[9000, 4000],
			],
			{ color: { rgb: "000000" }, width: 2000, highlighter: false },
			"4",
		);
		expect(stroke).toMatchObject({ x: 100, y: 100, w: 8900, h: 3900 });
		expect(isStroke(stroke)).toBe(true);
		expect(touchesStroke(stroke, [5000, 150], 100)).toBe(true);
		expect(touchesStroke(stroke, [5000, 3000], 100)).toBe(false);
	});
});

describe("templates and layouts", () => {
	it.each(TEMPLATE_IDS)("%s has every layout, each with its own ids", (id) => {
		const deck = templateDeck(id) as Deck;
		expect(deck.layouts).toHaveLength(11);
		for (const layout of deck.layouts) {
			const ids = [...layout.placeholders, ...layout.elements].map(
				(element) => element.id,
			);
			expect(new Set(ids).size).toBe(ids.length);
		}
		expect(Object.keys(deck.masters[0]?.theme.colors ?? {})).toHaveLength(12);
	});

	it("fills a new slide's placeholders by key", () => {
		const deck = templateDeck("swiss") as Deck;
		const slide = slideFromLayout(deck.layouts[2] as Deck["layouts"][number], {
			title: ["T"],
			"1": ["a", "b"],
		});
		const [title, body] = slide.elements as ShapeElement[];
		expect(title?.text?.paragraphs).toEqual([{ runs: [{ text: "T" }] }]);
		expect(body?.text?.paragraphs).toHaveLength(2);
		expect(body?.origin).toBeUndefined();
	});

	it("moves slides onto the matching layout of another template", () => {
		const deck = templateDeck("swiss") as Deck;
		deck.slides = [
			slideFromLayout(deck.layouts[7] as Deck["layouts"][number], {
				"1": ["87%"],
			}),
		];
		const moved = applyTemplate(deck, "sunset") as Deck;
		expect(moved.template).toBe("sunset");
		expect(moved.slides[0]?.layout).toBe(deck.layouts[7]?.part as string);
		const number = moved.slides[0]?.elements[0] as ShapeElement;
		expect(number.text?.paragraphs[0]?.runs[0]?.text).toBe("87%");
		expect(applyTemplate(deck, "nope")).toBeNull();
	});

	it("renders a slide to SVG with its text wrapped and escaped", () => {
		const deck = templateDeck("paper") as Deck;
		const long =
			"A rather long sentence <with> markup that has to wrap across more than one line";
		deck.slides = [
			slideFromLayout(deck.layouts[2] as Deck["layouts"][number], {
				title: ["Title"],
				"1": [long],
			}),
		];
		const svg = renderSlideSvg(deck, deck.slides[0] as Deck["slides"][number], {
			width: 480,
		});
		expect(svg).toContain('width="480" height="270"');
		expect(svg).toContain("&lt;with&gt;");
		expect(svg.match(/<text /g)?.length).toBeGreaterThan(2);
	});
});

describe("rich text", () => {
	const body = (): TextBody => ({
		paragraphs: [
			{ runs: [{ text: "Hello brave world" }] },
			{ runs: [{ text: "Paragraph", italic: true }] },
		],
		anchor: "t",
		inset: [0, 0, 0, 0],
		wrap: true,
		autofit: "none",
		levels: [],
	});

	it("bolds a range across paragraphs and merges what matches", () => {
		const bolded = styleRange(
			body(),
			{ p: 0, o: 6 },
			{ p: 1, o: 4 },
			{ bold: true },
		);
		expect(bolded.paragraphs[0]?.runs).toEqual([
			{ text: "Hello " },
			{ text: "brave world", bold: true },
		]);
		expect(bolded.paragraphs[1]?.runs).toEqual([
			{ text: "Para", italic: true, bold: true },
			{ text: "graph", italic: true },
		]);
		const again = styleRange(
			bolded,
			{ p: 0, o: 0 },
			{ p: 0, o: 6 },
			{ bold: true },
		);
		expect(again.paragraphs[0]?.runs).toEqual([
			{ text: "Hello brave world", bold: true },
		]);
	});

	it("formats the word under a caret", () => {
		const styled = styleRange(
			body(),
			{ p: 0, o: 8 },
			{ p: 0, o: 8 },
			{ size: 30 },
		);
		expect(styled.paragraphs[0]?.runs.map((run) => run.text)).toEqual([
			"Hello ",
			"brave",
			" world",
		]);
		expect(rangeRuns(styled, { p: 0, o: 7 }, { p: 0, o: 7 })[0]?.size).toBe(30);
	});

	it("splits, joins and inserts text in the surrounding style", () => {
		const split = splitParagraph(body(), { p: 1, o: 4 });
		expect(split.body.paragraphs.map(paragraphText)).toEqual([
			"Hello brave world",
			"Para",
			"graph",
		]);
		expect(split.pos).toEqual({ p: 2, o: 0 });
		const joined = deleteRange(split.body, { p: 0, o: 5 }, { p: 2, o: 0 });
		expect(joined.body.paragraphs.map(paragraphText)).toEqual(["Hellograph"]);
		const typed = insertText(body(), { p: 1, o: 9 }, "!\nThird");
		expect(typed.body.paragraphs.map(paragraphText)).toEqual([
			"Hello brave world",
			"Paragraph!",
			"Third",
		]);
		expect(typed.body.paragraphs[2]?.runs[0]?.italic).toBe(true);
		expect(normalizeRuns([{ text: "a" }, { text: "" }, { text: "b" }])).toEqual(
			[{ text: "ab" }],
		);
	});

	it("sets paragraph settings and whole-box formatting", () => {
		const aligned = styleParagraphs(
			body(),
			{ p: 0, o: 0 },
			{ p: 1, o: 0 },
			{ align: "ctr" },
		);
		expect(aligned.paragraphs.map((p) => p.align)).toEqual(["ctr", "ctr"]);
		const sized = styleAll(
			{ ...body(), paragraphs: [{ runs: [] }] },
			{ size: 12 },
		);
		expect(sized.paragraphs[0]?.endSize).toBe(12);
	});
});

describe("changing a slide's layout", () => {
	it("keeps what was written, drops empty placeholders and adds the new ones", () => {
		const deck = templateDeck("swiss") as Deck;
		const [title, , content, two] = deck.layouts as Deck["layouts"];
		const slide = slideFromLayout(content as Deck["layouts"][number], {
			title: ["Kept"],
		});
		const moved = relayout(slide, two as Deck["layouts"][number]);
		const keys = moved.elements.map(
			(element) => element.placeholder?.idx ?? element.placeholder?.type,
		);
		expect(keys).toEqual(["title", "1", "2"]);
		expect(
			(moved.elements[0] as ShapeElement).text?.paragraphs[0]?.runs[0]?.text,
		).toBe("Kept");
		const back = relayout(moved, title as Deck["layouts"][number]);
		expect(back.elements.map((element) => element.placeholder?.type)).toEqual([
			"ctrTitle",
			"subTitle",
		]);
	});
});

describe("bullets written in symbol fonts", () => {
	it("draw as the Unicode glyph they stand for", () => {
		expect(bulletGlyph("", "Symbol")).toBe("•");
		expect(bulletGlyph("§", "Wingdings")).toBe("▪");
		expect(bulletGlyph("", "OpenSymbol")).toBe("•");
		expect(bulletGlyph("–", "Arial")).toBe("–");
		expect(bulletFont("Wingdings")).toBeUndefined();
		expect(bulletFont("Arial")).toBe("Arial");
	});
});

describe("placeholders", () => {
	it("are never grouped", () => {
		const title = { ...rect("1", 0, 0), placeholder: { type: "title" } };
		const elements: SlideElement[] = [
			title,
			rect("2", 300, 50),
			rect("3", 600, 50),
		];
		const grouped = group(elements, new Set(["1", "2", "3"]), "9");
		expect(grouped.map((element) => element.id)).toEqual(["1", "9"]);
		expect(
			group([title, rect("2", 300, 50)], new Set(["1", "2"]), "9"),
		).toHaveLength(2);
	});
});
