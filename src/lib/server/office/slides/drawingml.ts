import { presetColor } from "#lib/slides/color.js";
import type {
	Align,
	Box,
	Bullet,
	Color,
	Fill,
	Geometry,
	LevelStyle,
	Line,
	Paragraph,
	ParagraphStyle,
	PathCommand,
	PathDef,
	Run,
	RunStyle,
	TextBody,
} from "#lib/slides/model.js";
import {
	childNamed,
	childrenNamed,
	isElement,
	textContent,
	type XmlElement,
} from "../xml";

/**
 * DrawingML fragments read into the model: colours, fills, lines, outlines,
 * text. Each reader returns undefined for "not said here", which is what
 * lets inheritance fall through to the layout, the master and the theme.
 */

const COLOR_NAMES = new Set([
	"a:srgbClr",
	"a:schemeClr",
	"a:sysClr",
	"a:prstClr",
	"a:scrgbClr",
	"a:hslClr",
]);

/** The first colour element under `parent`. */
export function colorChild(
	parent: XmlElement | undefined,
): XmlElement | undefined {
	return parent?.children.find(
		(child): child is XmlElement =>
			isElement(child) && COLOR_NAMES.has(child.name),
	);
}

function mods(element: XmlElement): [string, number][] {
	return element.children
		.filter(
			(child): child is XmlElement =>
				isElement(child) && child.attrs.val !== undefined,
		)
		.map((child): [string, number] => [
			child.name.replace(/^a:/, ""),
			Number(child.attrs.val),
		])
		.filter(([, value]) => Number.isFinite(value));
}

/**
 * A colour element as a model colour. `placeholder` stands in for `phClr`,
 * the slot theme style matrices leave for the colour of whatever uses them.
 */
export function readColor(
	element: XmlElement | undefined,
	placeholder?: Color,
): Color | undefined {
	if (!element) {
		return undefined;
	}
	const own = mods(element);
	const withMods = (color: Color): Color => {
		const all = [...(color.mods ?? []), ...own];
		const { mods: _mods, ...plain } = color;
		return all.length > 0 ? { ...plain, mods: all } : plain;
	};
	switch (element.name) {
		case "a:srgbClr":
			return withMods({ rgb: (element.attrs.val ?? "000000").toUpperCase() });
		case "a:schemeClr":
			if (element.attrs.val === "phClr") {
				return placeholder
					? withMods(placeholder)
					: withMods({ scheme: "tx1" });
			}
			return withMods({ scheme: element.attrs.val ?? "tx1" });
		case "a:sysClr":
			return withMods({
				rgb: (
					element.attrs.lastClr ??
					(element.attrs.val === "window" ? "FFFFFF" : "000000")
				).toUpperCase(),
			});
		case "a:prstClr":
			return withMods({ rgb: presetColor(element.attrs.val ?? "black") });
		case "a:scrgbClr": {
			const channel = (name: string) =>
				Math.round(
					(Math.max(0, Math.min(100_000, Number(element.attrs[name] ?? 0))) /
						100_000) *
						255,
				)
					.toString(16)
					.padStart(2, "0");
			return withMods({
				rgb: `${channel("r")}${channel("g")}${channel("b")}`.toUpperCase(),
			});
		}
		default:
			return withMods({ rgb: "000000" });
	}
}

const FILL_NAMES = new Set([
	"a:noFill",
	"a:solidFill",
	"a:gradFill",
	"a:blipFill",
	"a:pattFill",
	"a:grpFill",
]);

export function fillChild(
	parent: XmlElement | undefined,
): XmlElement | undefined {
	return parent?.children.find(
		(child): child is XmlElement =>
			isElement(child) && FILL_NAMES.has(child.name),
	);
}

/** A fill element as a model fill; `media` resolves a blip's relationship id. */
export function readFill(
	element: XmlElement | undefined,
	media: (id: string) => string | undefined,
	placeholder?: Color,
): Fill | undefined {
	if (!element) {
		return undefined;
	}
	switch (element.name) {
		case "a:noFill":
			return { type: "none" };
		case "a:solidFill": {
			const color = readColor(colorChild(element), placeholder);
			return color ? { type: "solid", color } : { type: "none" };
		}
		case "a:gradFill": {
			const list = childNamed(element, "a:gsLst");
			const stops = (list ? childrenNamed(list, "a:gs") : [])
				.map((stop) => ({
					pos: Number(stop.attrs.pos ?? 0),
					color: readColor(colorChild(stop), placeholder) ?? { rgb: "000000" },
				}))
				.sort((a, b) => a.pos - b.pos);
			const linear = childNamed(element, "a:lin");
			const path = childNamed(element, "a:path");
			return {
				type: "gradient",
				stops,
				angle: Number(linear?.attrs.ang ?? 0) / 60_000,
				radial: path ? true : undefined,
			};
		}
		case "a:blipFill": {
			const id = childNamed(element, "a:blip")?.attrs["r:embed"];
			const src = id ? media(id) : undefined;
			return src ? { type: "image", src } : { type: "none" };
		}
		case "a:pattFill": {
			const color = readColor(
				colorChild(childNamed(element, "a:fgClr")),
				placeholder,
			);
			return color ? { type: "solid", color } : { type: "none" };
		}
		default:
			return undefined;
	}
}

/** An `a:ln` as a model line. Absent parts stay absent. */
export function readLine(
	element: XmlElement | undefined,
	placeholder?: Color,
): Partial<Line> | undefined {
	if (!element) {
		return undefined;
	}
	const fill = readFill(fillChild(element), () => undefined, placeholder);
	const out: Partial<Line> = {};
	if (fill) {
		out.fill =
			fill.type === "gradient"
				? { type: "solid", color: fill.stops[0]?.color ?? { rgb: "000000" } }
				: fill;
	}
	if (element.attrs.w !== undefined) {
		out.width = Number(element.attrs.w);
	}
	const dash = childNamed(element, "a:prstDash")?.attrs.val;
	if (dash && dash !== "solid") {
		out.dash = dash;
	}
	const head = childNamed(element, "a:headEnd")?.attrs.type;
	const tail = childNamed(element, "a:tailEnd")?.attrs.type;
	if (head && head !== "none") {
		out.head = head;
	}
	if (tail && tail !== "none") {
		out.tail = tail;
	}
	const cap = element.attrs.cap;
	if (cap === "rnd" || cap === "sq" || cap === "flat") {
		out.cap = cap;
	}
	return out;
}

// =========================================================================
// Geometry
// =========================================================================

export function readXfrm(xfrm: XmlElement | undefined): Box | undefined {
	const off = xfrm && childNamed(xfrm, "a:off");
	const ext = xfrm && childNamed(xfrm, "a:ext");
	if (!xfrm || !off || !ext) {
		return undefined;
	}
	const box: Box = {
		x: Number(off.attrs.x ?? 0),
		y: Number(off.attrs.y ?? 0),
		w: Number(ext.attrs.cx ?? 0),
		h: Number(ext.attrs.cy ?? 0),
	};
	const rot = Number(xfrm.attrs.rot ?? 0) / 60_000;
	if (rot) {
		box.rot = rot;
	}
	if (xfrm.attrs.flipH === "1" || xfrm.attrs.flipH === "true") {
		box.flipH = true;
	}
	if (xfrm.attrs.flipV === "1" || xfrm.attrs.flipV === "true") {
		box.flipV = true;
	}
	return box;
}

/** Guide names a hand-written path may use instead of numbers. */
function guideValue(value: string | undefined, w: number, h: number): number {
	const numeric = Number(value);
	if (Number.isFinite(numeric)) {
		return numeric;
	}
	const named: Record<string, number> = {
		l: 0,
		t: 0,
		r: w,
		b: h,
		w,
		h,
		wd2: w / 2,
		hd2: h / 2,
		hc: w / 2,
		vc: h / 2,
		wd4: w / 4,
		hd4: h / 4,
	};
	return named[value ?? ""] ?? 0;
}

function readPath(path: XmlElement): PathDef {
	const w = Number(path.attrs.w ?? 0);
	const h = Number(path.attrs.h ?? 0);
	const commands: PathCommand[] = [];
	const points = (element: XmlElement) =>
		childrenNamed(element, "a:pt").flatMap((pt) => [
			guideValue(pt.attrs.x, w, h),
			guideValue(pt.attrs.y, w, h),
		]);
	for (const child of path.children) {
		if (!isElement(child)) {
			continue;
		}
		switch (child.name) {
			case "a:moveTo":
				commands.push({ op: "M", v: points(child) });
				break;
			case "a:lnTo":
				commands.push({ op: "L", v: points(child) });
				break;
			case "a:cubicBezTo":
				commands.push({ op: "C", v: points(child) });
				break;
			case "a:quadBezTo":
				commands.push({ op: "Q", v: points(child) });
				break;
			case "a:arcTo":
				commands.push({
					op: "A",
					v: [
						guideValue(child.attrs.wR, w, h),
						guideValue(child.attrs.hR, w, h),
						guideValue(child.attrs.stAng, w, h) / 60_000,
						guideValue(child.attrs.swAng, w, h) / 60_000,
					],
				});
				break;
			case "a:close":
				commands.push({ op: "Z", v: [] });
				break;
			default:
				break;
		}
	}
	const def: PathDef = { w, h, commands };
	if (path.attrs.fill === "none") {
		def.fill = false;
	}
	if (path.attrs.stroke === "0" || path.attrs.stroke === "false") {
		def.stroke = false;
	}
	return def;
}

export function readGeometry(
	spPr: XmlElement | undefined,
): Geometry | undefined {
	const preset = spPr && childNamed(spPr, "a:prstGeom");
	if (preset) {
		const adj: Record<string, number> = {};
		const list = childNamed(preset, "a:avLst");
		for (const guide of list ? childrenNamed(list, "a:gd") : []) {
			const value = /^val\s+(-?\d+)$/.exec(guide.attrs.fmla ?? "")?.[1];
			if (guide.attrs.name && value !== undefined) {
				adj[guide.attrs.name] = Number(value);
			}
		}
		const prst = preset.attrs.prst ?? "rect";
		return Object.keys(adj).length > 0
			? { preset: prst, adj }
			: { preset: prst };
	}
	const custom = spPr && childNamed(spPr, "a:custGeom");
	const list = custom && childNamed(custom, "a:pathLst");
	if (list) {
		return { paths: childrenNamed(list, "a:path").map(readPath) };
	}
	return undefined;
}

// =========================================================================
// Text
// =========================================================================

const ALIGN: Record<string, Align> = {
	l: "l",
	ctr: "ctr",
	r: "r",
	just: "just",
	dist: "just",
	justLow: "just",
};

function numberAttr(
	element: XmlElement | undefined,
	name: string,
): number | undefined {
	const raw = element?.attrs[name];
	if (raw === undefined) {
		return undefined;
	}
	const value = Number(raw);
	return Number.isFinite(value) ? value : undefined;
}

function clean<T extends object>(value: T): T {
	for (const key of Object.keys(value) as (keyof T)[]) {
		if (value[key] === undefined) {
			delete value[key];
		}
	}
	return value;
}

/** Character properties: `a:rPr`, `a:defRPr` or `a:endParaRPr`. */
function readRunStyle(element: XmlElement | undefined): RunStyle {
	if (!element) {
		return {};
	}
	const size = numberAttr(element, "sz");
	const bool = (name: string) => {
		const raw = element.attrs[name];
		return raw === undefined ? undefined : raw === "1" || raw === "true";
	};
	const u = element.attrs.u;
	const strike = element.attrs.strike;
	const cap = element.attrs.cap;
	const fill = fillChild(element);
	let color: Color | undefined;
	if (fill?.name === "a:solidFill") {
		color = readColor(colorChild(fill));
	} else if (fill?.name === "a:gradFill") {
		color = readColor(
			colorChild(childNamed(childNamed(fill, "a:gsLst") ?? fill, "a:gs")),
		);
	}
	return clean({
		size: size === undefined ? undefined : size / 100,
		bold: bool("b"),
		italic: bool("i"),
		underline: u === undefined ? undefined : u !== "none",
		strike: strike === undefined ? undefined : strike !== "noStrike",
		baseline:
			numberAttr(element, "baseline") === undefined
				? undefined
				: (numberAttr(element, "baseline") ?? 0) / 1000,
		caps: cap === "all" || cap === "small" ? cap : undefined,
		spacing: numberAttr(element, "spc"),
		color,
		font: childNamed(element, "a:latin")?.attrs.typeface || undefined,
	});
}

function readBullet(pPr: XmlElement): Bullet | undefined {
	if (childNamed(pPr, "a:buNone")) {
		return { type: "none" };
	}
	const char = childNamed(pPr, "a:buChar");
	if (char) {
		return clean({
			type: "char" as const,
			char: char.attrs.char ?? "\u2022",
			font: childNamed(pPr, "a:buFont")?.attrs.typeface,
			color: readColor(colorChild(childNamed(pPr, "a:buClr"))),
		});
	}
	const auto = childNamed(pPr, "a:buAutoNum");
	if (auto) {
		return clean({
			type: "number" as const,
			scheme: auto.attrs.type ?? "arabicPeriod",
			start: numberAttr(auto, "startAt"),
		});
	}
	return undefined;
}

function points(spacing: XmlElement | undefined): number | undefined {
	const value = numberAttr(spacing && childNamed(spacing, "a:spcPts"), "val");
	return value === undefined ? undefined : value / 100;
}

/** Paragraph properties, with the character defaults they carry. */
function readParagraphStyle(
	pPr: XmlElement | undefined,
): ParagraphStyle & RunStyle {
	if (!pPr) {
		return {};
	}
	const lineSpacing = numberAttr(
		childNamed(childNamed(pPr, "a:lnSpc") ?? pPr, "a:spcPct"),
		"val",
	);
	return clean({
		...readRunStyle(childNamed(pPr, "a:defRPr")),
		align: ALIGN[pPr.attrs.algn ?? ""],
		marL: numberAttr(pPr, "marL"),
		indent: numberAttr(pPr, "indent"),
		lineSpacing:
			childNamed(pPr, "a:lnSpc") && lineSpacing !== undefined
				? lineSpacing / 1000
				: undefined,
		spaceBefore: points(childNamed(pPr, "a:spcBef")),
		spaceAfter: points(childNamed(pPr, "a:spcAft")),
		bullet: readBullet(pPr),
	});
}

/** A list style's nine levels, `defPPr` folded under each. */
export function readLevels(list: XmlElement | undefined): LevelStyle[] {
	if (!list) {
		return [];
	}
	const base = readParagraphStyle(childNamed(list, "a:defPPr"));
	const levels: LevelStyle[] = [];
	for (let level = 1; level <= 9; level++) {
		const own = childNamed(list, `a:lvl${level}pPr`);
		levels.push({ ...base, ...readParagraphStyle(own) });
	}
	while (levels.length > 0 && Object.keys(levels.at(-1) ?? {}).length === 0) {
		levels.pop();
	}
	return levels;
}

function readRun(element: XmlElement): Run {
	const text = textContent(childNamed(element, "a:t") ?? element);
	const run: Run = { ...readRunStyle(childNamed(element, "a:rPr")), text };
	if (element.name === "a:fld") {
		run.field = { type: element.attrs.type ?? "", id: element.attrs.id ?? "" };
	}
	return run;
}

export function readParagraph(element: XmlElement): Paragraph {
	const pPr = childNamed(element, "a:pPr");
	const { ...style } = readParagraphStyle(pPr);
	const runs: Run[] = [];
	for (const child of element.children) {
		if (!isElement(child)) {
			continue;
		}
		if (child.name === "a:r" || child.name === "a:fld") {
			runs.push(readRun(child));
		} else if (child.name === "a:br") {
			runs.push({ ...readRunStyle(childNamed(child, "a:rPr")), text: "\n" });
		}
	}
	const paragraph: Paragraph = { ...style, runs };
	const level = numberAttr(pPr, "lvl");
	if (level) {
		paragraph.level = level;
	}
	const end = numberAttr(childNamed(element, "a:endParaRPr"), "sz");
	if (end !== undefined) {
		paragraph.endSize = end / 100;
	}
	return paragraph;
}

const DEFAULT_INSET: [number, number, number, number] = [
	91_440, 45_720, 91_440, 45_720,
];

/**
 * A text body. `bodyPrs` is the inheritance chain of `a:bodyPr`, most
 * general first: the master's, the layout's, then the shape's own.
 */
export function readTextBody(
	txBody: XmlElement,
	bodyPrs: (XmlElement | undefined)[],
	levels: LevelStyle[],
): TextBody {
	const body: TextBody = {
		paragraphs: childrenNamed(txBody, "a:p").map(readParagraph),
		anchor: "t",
		inset: [...DEFAULT_INSET],
		wrap: true,
		autofit: "none",
		levels,
	};
	const sides = ["lIns", "tIns", "rIns", "bIns"] as const;
	for (const bodyPr of bodyPrs) {
		if (!bodyPr) {
			continue;
		}
		const anchor = bodyPr.attrs.anchor;
		if (anchor === "t" || anchor === "ctr" || anchor === "b") {
			body.anchor = anchor;
		}
		sides.forEach((side, index) => {
			const value = numberAttr(bodyPr, side);
			if (value !== undefined) {
				body.inset[index] = value;
			}
		});
		if (bodyPr.attrs.wrap) {
			body.wrap = bodyPr.attrs.wrap !== "none";
		}
		const shrink = childNamed(bodyPr, "a:normAutofit");
		if (shrink) {
			body.autofit = "shrink";
			const scale = numberAttr(shrink, "fontScale");
			const reduction = numberAttr(shrink, "lnSpcReduction");
			body.fontScale = scale === undefined ? undefined : scale / 100_000;
			body.lineReduction =
				reduction === undefined ? undefined : reduction / 100_000;
		} else if (childNamed(bodyPr, "a:spAutoFit")) {
			body.autofit = "resize";
		} else if (childNamed(bodyPr, "a:noAutofit")) {
			body.autofit = "none";
		}
	}
	if (body.paragraphs.length === 0) {
		body.paragraphs = [{ runs: [] }];
	}
	return clean(body);
}
