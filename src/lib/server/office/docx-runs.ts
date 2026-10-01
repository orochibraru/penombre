import {
	CODE_TAG,
	declarations,
	firstFamily,
	HIGHLIGHT_COLORS,
	halfPoints,
	wordColor,
} from "./docx-package";
import {
	childrenNamed,
	element,
	text,
	textContent,
	type XmlElement,
	type XmlNode,
} from "./xml";

/**
 * The runs and small blocks the `.docx` writer builds from scratch: text in
 * the editor's marks, a code block, a rule.
 */

export interface Marks {
	bold: boolean;
	italic: boolean;
	underline: boolean;
	strike: boolean;
	code: boolean;
	vertAlign?: "superscript" | "subscript";
	font?: string;
	/** Half-points, as `w:sz` stores them. */
	size?: number;
	/** Six hex digits, as `w:color` stores them. */
	color?: string;
	fill?: string;
}

export const NO_MARKS: Marks = {
	bold: false,
	italic: false,
	underline: false,
	strike: false,
	code: false,
};

const MARK_TAGS: Record<string, Partial<Marks>> = {
	strong: { bold: true },
	b: { bold: true },
	em: { italic: true },
	i: { italic: true },
	u: { underline: true },
	s: { strike: true },
	strike: { strike: true },
	del: { strike: true },
	sup: { vertAlign: "superscript" },
	sub: { vertAlign: "subscript" },
	code: { code: true },
};

/**
 * What a styled element adds: the editor writes each value twice, as CSS and
 * as a `data-` attribute, and the attribute is the exact one.
 */
function styleMarks(node: XmlElement): Partial<Marks> {
	const css = declarations(node.attrs.style);
	const value = (data: string, property: string): string | undefined =>
		node.attrs[data] ?? css.get(property);
	const marks: Partial<Marks> = {};
	const font = value("data-font-family", "font-family");
	const size = value("data-font-size", "font-size");
	const color = wordColor(value("data-text-color", "color"));
	const fill = wordColor(value("data-background-color", "background-color"));
	if (font && firstFamily(font)) {
		marks.font = firstFamily(font);
	}
	if (size && halfPoints(size)) {
		marks.size = halfPoints(size);
	}
	if (color) {
		marks.color = color;
	}
	if (fill) {
		marks.fill = fill;
	}
	return marks;
}

export function markFor(node: XmlElement, marks: Marks): Marks {
	return { ...marks, ...MARK_TAGS[node.name], ...styleMarks(node) };
}

const HIGHLIGHT_NAMES = new Map(
	Object.entries(HIGHLIGHT_COLORS).map(([name, hex]) => [hex, name]),
);

/** Font, size and colours, in the order `CT_RPr` requires them. */
function valueProperties(marks: Marks): {
	fonts: XmlElement[];
	colors: XmlElement[];
	fill: XmlElement[];
} {
	const font = marks.font;
	const size = marks.size && String(marks.size);
	const highlight = marks.fill && HIGHLIGHT_NAMES.get(marks.fill);
	return {
		fonts: font
			? [
					element("w:rFonts", {
						"w:ascii": font,
						"w:hAnsi": font,
						"w:cs": font,
						"w:eastAsia": font,
					}),
				]
			: [],
		colors: [
			...(marks.color ? [element("w:color", { "w:val": marks.color })] : []),
			...(size
				? [
						element("w:sz", { "w:val": size }),
						element("w:szCs", { "w:val": size }),
					]
				: []),
			...(highlight ? [element("w:highlight", { "w:val": highlight })] : []),
		],
		// A colour Word has no highlight for is shading, which takes any.
		fill:
			marks.fill && !highlight
				? [
						element("w:shd", {
							"w:val": "clear",
							"w:color": "auto",
							"w:fill": marks.fill,
						}),
					]
				: [],
	};
}

/** Inline code: our character style, or a typewriter face where there is none. */
function codeMarks(marks: Marks, styles: Set<string>): [XmlElement[], Marks] {
	if (!marks.code) {
		return [[], marks];
	}
	if (styles.has("CodeChar")) {
		return [[element("w:rStyle", { "w:val": "CodeChar" })], marks];
	}
	return [[], { ...marks, font: marks.font ?? "Courier New" }];
}

/** Word validates the order of a run's properties, not just their names. */
function runProperties(
	requested: Marks,
	styles: Set<string>,
): XmlElement | null {
	const [style, marks] = codeMarks(requested, styles);
	const { fonts, colors, fill } = valueProperties(marks);
	const children: XmlNode[] = [
		...style,
		...fonts,
		...(marks.bold ? [element("w:b")] : []),
		...(marks.italic ? [element("w:i")] : []),
		...(marks.strike ? [element("w:strike")] : []),
		...colors,
		...(marks.underline ? [element("w:u", { "w:val": "single" })] : []),
		...fill,
		...(marks.vertAlign
			? [element("w:vertAlign", { "w:val": marks.vertAlign })]
			: []),
	];
	return children.length > 0 ? element("w:rPr", {}, children) : null;
}

export function textRun(
	value: string,
	marks: Marks,
	styles: Set<string>,
): XmlElement {
	const properties = runProperties(marks, styles);
	// Without xml:space a run's leading and trailing spaces are dropped, and
	// a sentence split across runs is mostly leading and trailing spaces.
	const node = element("w:t", { "xml:space": "preserve" }, [text(value)]);
	return element("w:r", {}, properties ? [properties, node] : [node]);
}

export function paragraph(
	properties: XmlElement | null,
	runs: XmlElement[],
): XmlElement {
	return element("w:p", {}, properties ? [properties, ...runs] : runs);
}

/** One line of code: the `Code` style, or its look where there is none. */
function codeLine(line: string, styled: boolean): XmlElement {
	const properties = styled
		? [element("w:pStyle", { "w:val": "Code" })]
		: [
				element("w:shd", {
					"w:val": "clear",
					"w:color": "auto",
					"w:fill": "F2F2F2",
				}),
				element("w:spacing", { "w:after": "0" }),
			];
	const font = styled
		? []
		: [
				element("w:rPr", {}, [
					element("w:rFonts", {
						"w:ascii": "Courier New",
						"w:hAnsi": "Courier New",
						"w:cs": "Courier New",
					}),
				]),
			];
	const parts = line
		.split("\t")
		.flatMap((part, index) => [
			...(index > 0 ? [element("w:tab")] : []),
			...(part
				? [element("w:t", { "xml:space": "preserve" }, [text(part)])]
				: []),
		]);
	return paragraph(
		element("w:pPr", {}, properties),
		parts.length > 0 ? [element("w:r", {}, [...font, ...parts])] : [],
	);
}

/**
 * A code block: a paragraph per line, inside a content control whose tag
 * names the language. Word keeps the control and shows it as one box; the
 * tag is what brings the language back, and the control's edges are what
 * keep two code blocks in a row from reading back as one.
 */
export function codeBlock(node: XmlElement, styles: Set<string>): XmlElement {
	const code = childrenNamed(node, "code")[0];
	const language =
		node.attrs["data-language"] ??
		/(?:^|\s)language-(\S+)/.exec(code?.attrs.class ?? "")?.[1] ??
		"";
	const styled = styles.has("Code");
	return element("w:sdt", {}, [
		element("w:sdtPr", {}, [
			element("w:tag", {
				"w:val": language ? `${CODE_TAG}:${language}` : CODE_TAG,
			}),
		]),
		element(
			"w:sdtContent",
			{},
			textContent(node)
				.split("\n")
				.map((line) => codeLine(line, styled)),
		),
	]);
}

/** A rule, drawn the way Word draws one: an empty paragraph with a border. */
export function horizontalRule(): XmlElement {
	return paragraph(
		element("w:pPr", {}, [
			element("w:pBdr", {}, [
				element("w:bottom", {
					"w:val": "single",
					"w:sz": "6",
					"w:space": "1",
					"w:color": "auto",
				}),
			]),
		]),
		[],
	);
}
