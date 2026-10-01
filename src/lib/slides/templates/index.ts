import { DEFAULT_COLOR_MAP } from "../color";
import type {
	Deck,
	Fill,
	LevelStyle,
	Master,
	ShapeElement,
	SlideElement,
	Theme,
} from "../model";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "../model";
import { mergeLevels } from "../text";
import {
	BODY,
	HEADING,
	LAYOUT_KINDS,
	type LayoutKind,
	layoutPart,
	type PlaceholderSpec,
	placeholder,
	pt,
	scheme,
	type ThemeStyle,
} from "./build";
import { THEMES } from "./themes";

export {
	kindOfLayoutName,
	LAYOUT_KINDS,
	type LayoutKind,
	layoutPart,
} from "./build";

/**
 * A template is a theme plus a master and eleven layouts built from it. The
 * server writes the spec into a package; the editor uses the same spec,
 * resolved, to preview templates and to switch a deck's theme without
 * asking the server first.
 */

export const TEMPLATE_IDS = THEMES.map((theme) => theme.id);

export const MASTER_PART = "ppt/slideMasters/slideMaster1.xml";

export interface LayoutSpec {
	kind: LayoutKind;
	type: string;
	name: string;
	part: string;
	background?: Fill;
	elements: SlideElement[];
	/** Their levels are overrides on the master, as the file stores them. */
	placeholders: ShapeElement[];
}

export interface TemplateSpec {
	id: string;
	theme: Theme;
	colorMap: Record<string, string>;
	background: Fill;
	elements: SlideElement[];
	masterPlaceholders: ShapeElement[];
	titleLevels: LevelStyle[];
	bodyLevels: LevelStyle[];
	otherLevels: LevelStyle[];
	layouts: LayoutSpec[];
}

const NO_BULLET: LevelStyle = { bullet: { type: "none" }, marL: 0, indent: 0 };

function titleLevels(style: ThemeStyle): LevelStyle[] {
	const title = style.title;
	return [
		{
			font: HEADING,
			size: title.size,
			bold: title.bold ?? false,
			italic: title.italic ?? false,
			caps: title.caps ? "all" : undefined,
			spacing: title.spacing,
			color: title.color ?? scheme("tx1"),
			align: title.align,
			lineSpacing: 90,
			spaceBefore: 0,
			bullet: { type: "none" },
		},
	];
}

function bodyLevels(style: ThemeStyle): LevelStyle[] {
	const body = style.body;
	const chars = [body.bullet, "–", "•", "–", "•"];
	return chars.map((char, level) => ({
		font: BODY,
		size: body.size - Math.min(level, 2) * 2,
		color: body.color ?? scheme("tx1"),
		align: "l",
		marL: pt(26 + 30 * level),
		indent: pt(-26),
		lineSpacing: body.lineSpacing ?? 100,
		spaceBefore: level === 0 ? 10 : 5,
		bullet: {
			type: "char",
			char,
			font: body.bulletFont,
			color: body.bulletColor,
		},
	}));
}

type At = [number, number, number, number];

const TITLE_BAR: At = [60, 36, 840, 76];
const BODY_AREA: At = [60, 132, 840, 368];

function featurePlaceholders(
	style: ThemeStyle,
	kind: LayoutKind,
): PlaceholderSpec[] {
	const align = style.title.align;
	const width = align === "ctr" ? 800 : (style.featureWidth ?? 800);
	const title = style.feature?.title;
	const text = style.feature?.text ?? style.quiet;
	const big = kind === "section" ? 44 : 54;
	return [
		{
			type: kind === "title" ? "ctrTitle" : "title",
			at: [80, 140, width, 156],
			anchor: "b",
			levels: [{ size: big, align, color: title }],
		},
		{
			type: kind === "title" ? "subTitle" : undefined,
			idx: "1",
			at: [80, 316, width, 90],
			levels: [{ ...NO_BULLET, size: 22, align, color: text, spaceBefore: 0 }],
		},
	];
}

const TITLED = (...rest: PlaceholderSpec[]): PlaceholderSpec[] => [
	{ type: "title", at: TITLE_BAR, anchor: "b" },
	...rest,
];

const quoteLayout = (style: ThemeStyle): PlaceholderSpec[] => [
	{
		type: "body",
		idx: "1",
		at: [120, 130, 720, 230],
		anchor: "ctr",
		shrink: true,
		levels: [
			{
				...NO_BULLET,
				font: HEADING,
				size: 34,
				italic: true,
				align: "ctr",
				lineSpacing: 110,
				spaceBefore: 0,
			},
		],
	},
	{
		type: "body",
		idx: "2",
		at: [120, 372, 720, 50],
		levels: [
			{
				...NO_BULLET,
				size: 18,
				align: "ctr",
				color: style.quiet,
				spaceBefore: 0,
			},
		],
	},
];

const numberLayout = (style: ThemeStyle): PlaceholderSpec[] => [
	{
		type: "body",
		idx: "1",
		at: [80, 96, 800, 240],
		anchor: "b",
		levels: [
			{
				...NO_BULLET,
				font: HEADING,
				size: 120,
				bold: true,
				color: scheme("accent1"),
				align: style.title.align,
				lineSpacing: 90,
				spaceBefore: 0,
			},
		],
	},
	{
		type: "body",
		idx: "2",
		at: [80, 344, 800, 110],
		levels: [
			{
				...NO_BULLET,
				size: 24,
				color: style.quiet,
				align: style.title.align,
				spaceBefore: 0,
			},
		],
	},
];

const SUBHEAD: LevelStyle = {
	...NO_BULLET,
	size: 22,
	bold: true,
	color: scheme("accent1"),
};

/** The placeholders of every layout that is not a title, section or closing slide. */
const PLAIN: Partial<
	Record<LayoutKind, (style: ThemeStyle) => PlaceholderSpec[]>
> = {
	content: () => TITLED({ idx: "1", at: BODY_AREA, shrink: true }),
	two: () =>
		TITLED(
			{ idx: "1", at: [60, 132, 408, 368], shrink: true },
			{ idx: "2", at: [492, 132, 408, 368], shrink: true },
		),
	comparison: () =>
		TITLED(
			{
				type: "body",
				idx: "1",
				at: [60, 128, 408, 44],
				anchor: "b",
				levels: [SUBHEAD],
			},
			{ idx: "2", at: [60, 180, 408, 320], shrink: true },
			{
				type: "body",
				idx: "3",
				at: [492, 128, 408, 44],
				anchor: "b",
				levels: [SUBHEAD],
			},
			{ idx: "4", at: [492, 180, 408, 320], shrink: true },
		),
	picture: (style) => [
		{
			type: "title",
			at: [60, 56, 340, 150],
			anchor: "b",
			levels: [{ size: 30, align: "l" }],
		},
		{ type: "pic", idx: "1", at: [440, 40, 480, 460] },
		{
			type: "body",
			idx: "2",
			at: [60, 222, 340, 270],
			levels: [{ ...NO_BULLET, size: 16, color: style.quiet, spaceBefore: 6 }],
		},
	],
	quote: quoteLayout,
	number: numberLayout,
	agenda: () =>
		TITLED({
			idx: "1",
			at: BODY_AREA,
			shrink: true,
			levels: [
				{
					size: 24,
					marL: pt(40),
					indent: pt(-40),
					spaceBefore: 16,
					bullet: { type: "number", scheme: "arabicPeriod" },
				},
			],
		}),
};

function plainPlaceholders(
	style: ThemeStyle,
	kind: LayoutKind,
): PlaceholderSpec[] {
	return PLAIN[kind]?.(style) ?? [];
}

function layoutSpec(
	style: ThemeStyle,
	entry: (typeof LAYOUT_KINDS)[number],
): LayoutSpec {
	const feature =
		entry.kind === "title" ||
		entry.kind === "section" ||
		entry.kind === "closing";
	const specs = feature
		? featurePlaceholders(style, entry.kind)
		: plainPlaceholders(style, entry.kind);
	const placeholders = specs.map((spec, index) => placeholder(spec, index + 2));
	const elements = style.decorate(entry.kind).map((element, index) => ({
		...element,
		id: String(placeholders.length + index + 2),
	}));
	return {
		...entry,
		part: layoutPart(entry.kind),
		background: feature ? style.feature?.background : undefined,
		elements,
		placeholders,
	};
}

const FLIPPED: Record<string, string> = {
	bg1: "dk1",
	tx1: "lt1",
	bg2: "dk2",
	tx2: "lt2",
};

export function templateSpec(id: string): TemplateSpec | undefined {
	const style = THEMES.find((theme) => theme.id === id);
	if (!style) {
		return undefined;
	}
	return {
		id,
		theme: {
			name: `Penombre ${style.name}`,
			colors: style.colors,
			fonts: style.fonts,
		},
		colorMap: style.dark ? FLIPPED : DEFAULT_COLOR_MAP,
		background: style.background,
		elements: (style.master?.() ?? []).map((element, index) => ({
			...element,
			id: String(index + 4),
		})),
		masterPlaceholders: [
			placeholder({ type: "title", at: TITLE_BAR, anchor: "b" }, 2),
			placeholder({ type: "body", idx: "1", at: BODY_AREA }, 3),
		],
		titleLevels: titleLevels(style),
		bodyLevels: bodyLevels(style),
		otherLevels: [{ font: BODY, size: 18, color: scheme("tx1"), align: "l" }],
		layouts: LAYOUT_KINDS.map((entry) => layoutSpec(style, entry)),
	};
}

/** The id of the template a theme was written from, by its name. */
export function templateOfTheme(name: string): string | undefined {
	return THEMES.find((theme) => `Penombre ${theme.name}` === name)?.id;
}

/** The master's text style a placeholder of this type starts from. */
export function baseLevels(
	type: string | undefined,
	styles: { title: LevelStyle[]; body: LevelStyle[]; other: LevelStyle[] },
): LevelStyle[] {
	if (type === "title" || type === "ctrTitle") {
		return styles.title;
	}
	if (type === "dt" || type === "ftr" || type === "sldNum" || type === "hdr") {
		return styles.other;
	}
	return styles.body;
}

function resolved(
	element: ShapeElement,
	styles: { title: LevelStyle[]; body: LevelStyle[]; other: LevelStyle[] },
): ShapeElement {
	if (!element.text) {
		return element;
	}
	const base = baseLevels(element.placeholder?.type, styles);
	return {
		...element,
		text: { ...element.text, levels: mergeLevels(base, element.text.levels) },
	};
}

/** A deck with the template's master and layouts and no slides yet. */
export function templateDeck(id: string): Deck | undefined {
	const spec = templateSpec(id);
	if (!spec) {
		return undefined;
	}
	const styles = {
		title: spec.titleLevels,
		body: spec.bodyLevels,
		other: spec.otherLevels,
	};
	const master: Master = {
		part: MASTER_PART,
		theme: spec.theme,
		colorMap: spec.colorMap,
		background: spec.background,
		elements: spec.elements,
		placeholders: spec.masterPlaceholders.map((element) =>
			resolved(element, styles),
		),
		textLevels: spec.otherLevels,
	};
	return {
		width: SLIDE_WIDTH,
		height: SLIDE_HEIGHT,
		template: id,
		masters: [master],
		layouts: spec.layouts.map((layout) => ({
			part: layout.part,
			name: layout.name,
			type: layout.type,
			master: MASTER_PART,
			background: layout.background,
			showMaster: true,
			elements: layout.elements,
			placeholders: layout.placeholders.map((element) =>
				resolved(element, styles),
			),
		})),
		slides: [],
	};
}
