import { fromFileFormula } from "#lib/formula.js";
import {
	type ConditionalFormat,
	type ConditionalRule,
	DRAWN_RULES,
	type RuleStyle,
} from "#lib/sheet/conditional.js";
import {
	type ChipColor,
	type Dropdown,
	dropdownKey,
	isSourceRef,
	isSqref,
	listFormula,
	matchItem,
	parseList,
	sameSqref,
} from "#lib/sheet/dropdowns.js";
import { SIDES } from "#lib/sheet/styles.js";

import { colourOf, type Palette } from "./xlsx-colours";
import { insertAfter, SIDE_NAMES, Stylesheet } from "./xlsx-styles";
import {
	childNamed,
	childrenNamed,
	element,
	isElement,
	text,
	textContent,
	type XmlDocument,
	type XmlElement,
	type XmlNode,
} from "./xml";
import type { ZipEntry } from "./zip";

/**
 * A worksheet's data validation and conditional formatting: list
 * validations read as dropdowns and written back, and the conditional
 * formats the grid draws.
 *
 * A dropdown's chip colours are conditional formatting on its own range,
 * one `cellIs` `equal` rule per coloured value, so Excel and LibreOffice
 * colour those cells too. The block we write carries an `extLst` entry
 * under `CHIPS_URI`, which readers skip as an extension they do not know.
 * A block on the same range made only of such rules is read as the chips
 * too, marked or not (Excel drops unknown extensions when it saves), and
 * replaced when the dropdown changes; every other block is left alone.
 *
 * Untouched validations and blocks are written back as the text they were
 * read from (`holdVerbatim`), so a save that edits cells changes nothing
 * else in them.
 */

const CHIPS_URI = "{8E4B7C21-5F3A-4D6E-9B1C-2A7F0E9D4C35}";
const CHIPS_NS = "urn:penombre:sheet-chips";

/** CT_Worksheet's children before `conditionalFormatting`. */
const BEFORE_FORMATS = [
	"sheetPr",
	"dimension",
	"sheetViews",
	"sheetFormatPr",
	"cols",
	"sheetData",
	"sheetCalcPr",
	"sheetProtection",
	"protectedRanges",
	"scenarios",
	"autoFilter",
	"sortState",
	"dataConsolidate",
	"customSheetViews",
	"mergeCells",
	"phoneticPr",
	"conditionalFormatting",
];

/** What reading and writing need from the styles part. */
export interface RulesContext {
	/** Each `dxfs` entry as a look. */
	dxfs: RuleStyle[];
	/** Appends a differential format, or finds an identical one: saving only. */
	dxf?: (node: XmlElement) => number;
}

const isOn = (value: string | undefined) => value === "1" || value === "true";

const flagOn = (node: XmlElement | undefined) =>
	node !== undefined && node.attrs.val !== "0" && node.attrs.val !== "false";

/** One `<dxf>` as a look. A solid fill's colour is its `bgColor` there. */
function dxfLook(dxf: XmlElement, palette: Palette): RuleStyle {
	const look: Record<string, unknown> = {};
	const font = childNamed(dxf, "font");
	if (font) {
		for (const [name, flag] of [
			["b", "bold"],
			["i", "italic"],
			["u", "underline"],
			["strike", "strike"],
		] as const) {
			if (flagOn(childNamed(font, name))) {
				look[flag] = true;
			}
		}
		look.color = colourOf(childNamed(font, "color"), palette);
	}
	const pattern = childNamed(childNamed(dxf, "fill") ?? dxf, "patternFill");
	if (pattern && pattern.attrs.patternType !== "none") {
		look.fill =
			colourOf(childNamed(pattern, "bgColor"), palette) ??
			colourOf(childNamed(pattern, "fgColor"), palette);
	}
	const border = childNamed(dxf, "border");
	const borders: Record<string, unknown> = {};
	for (const side of SIDES) {
		const node = SIDE_NAMES[side]
			.map((name) => (border ? childNamed(border, name) : undefined))
			.find(Boolean);
		if (node?.attrs.style && node.attrs.style !== "none") {
			borders[side] = {
				style: node.attrs.style,
				...(colourOf(childNamed(node, "color"), palette)
					? { color: colourOf(childNamed(node, "color"), palette) }
					: {}),
			};
		}
	}
	if (Object.keys(borders).length > 0) {
		look.borders = borders;
	}
	return Object.fromEntries(
		Object.entries(look).filter(([, value]) => value !== undefined),
	) as RuleStyle;
}

/** The styles part's differential formats, for reading a workbook. */
export function rulesContext(entries: ZipEntry[]): RulesContext {
	const styles = new Stylesheet(entries);
	return {
		dxfs: styles.list("dxfs", "dxf").map((dxf) => dxfLook(dxf, styles.palette)),
	};
}

// =========================================================================
// Reading
// =========================================================================

interface Validation {
	node: XmlElement;
	/** Excel 2010's `x14:dataValidation`, in the worksheet's `extLst`. */
	x14: boolean;
}

function x14Holders(root: XmlElement): XmlElement[] {
	const extLst = childNamed(root, "extLst");
	return extLst
		? childrenNamed(extLst, "ext").flatMap((ext) =>
				childrenNamed(ext, "x14:dataValidations"),
			)
		: [];
}

function validations(root: XmlElement): Validation[] {
	const main = childNamed(root, "dataValidations");
	return [
		...(main ? childrenNamed(main, "dataValidation") : []).map((node) => ({
			node,
			x14: false,
		})),
		...x14Holders(root)
			.flatMap((holder) => childrenNamed(holder, "x14:dataValidation"))
			.map((node) => ({ node, x14: true })),
	];
}

function formulaOf({ node, x14 }: Validation): string {
	const holder = childNamed(node, x14 ? "x14:formula1" : "formula1");
	const f = holder && x14 ? childNamed(holder, "xm:f") : holder;
	return f ? textContent(f).trim() : "";
}

function sqrefOfNode({ node, x14 }: Validation): string {
	const holder = x14 ? childNamed(node, "xm:sqref") : undefined;
	return (holder ? textContent(holder) : node.attrs.sqref) ?? "";
}

/** A list validation as a dropdown, colours aside; null for anything else. */
function readValidation(validation: Validation): Dropdown | null {
	const { attrs } = validation.node;
	const range = sqrefOfNode(validation).trim();
	if (attrs.type !== "list" || !isSqref(range)) {
		return null;
	}
	const formula = formulaOf(validation);
	const values = parseList(formula);
	const reference = formula.replace(/^=/, "");
	if (!(values || isSourceRef(reference))) {
		return null;
	}
	const strict =
		isOn(attrs.showErrorMessage) && (attrs.errorStyle ?? "stop") === "stop";
	return {
		range,
		...(values ? { values } : { source: reference }),
		...(strict ? { strict: true as const } : {}),
		...(isOn(attrs.showDropDown) ? { hideArrow: true as const } : {}),
	};
}

const isMarked = (block: XmlElement) =>
	childrenNamed(childNamed(block, "extLst") ?? block, "ext").some(
		(ext) => ext.attrs.uri === CHIPS_URI,
	);

/** A `cellIs` formula's constant as cell text: `"Amazon"`, `12`, `TRUE`. */
function constantOf(formula: string): string | null {
	const text = formula.trim();
	const quoted = /^"((?:[^"]|"")*)"$/.exec(text);
	if (quoted) {
		return (quoted[1] ?? "").replace(/""/g, '"');
	}
	if (/^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(text)) {
		return text;
	}
	return /^(TRUE|FALSE)$/i.test(text) ? text.toUpperCase() : null;
}

/** A value as a `cellIs` formula. */
function formulaFor(value: string): string {
	if (/^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(value)) {
		return value;
	}
	return /^(TRUE|FALSE)$/i.test(value)
		? value.toUpperCase()
		: `"${value.replace(/"/g, '""')}"`;
}

const ONLY_COLOURS = new Set(["fill", "color"]);

/**
 * A block's chip colours, or null when it is not a dropdown's: every rule
 * an `equal` against one of the list's values, coloured and nothing else
 * (ours may carry anything, being ours).
 */
function chipColors(
	block: XmlElement,
	items: string[] | undefined,
	context: RulesContext,
): ChipColor[] | null {
	const marked = isMarked(block);
	const rules = childrenNamed(block, "cfRule").sort(
		(a, b) => Number(a.attrs.priority ?? 0) - Number(b.attrs.priority ?? 0),
	);
	if (rules.length === 0) {
		return null;
	}
	const colors: ChipColor[] = [];
	for (const rule of rules) {
		const formulas = childrenNamed(rule, "formula");
		const value =
			formulas.length === 1
				? constantOf(textContent(formulas[0] as XmlElement))
				: null;
		const look = context.dxfs[Number(rule.attrs.dxfId ?? -1)];
		const item = value !== null && items ? matchItem(items, value) : value;
		const plain =
			look !== undefined &&
			look.fill !== undefined &&
			Object.keys(look).every((key) => ONLY_COLOURS.has(key));
		if (
			rule.attrs.type !== "cellIs" ||
			rule.attrs.operator !== "equal" ||
			item === null ||
			!(plain || (marked && look?.fill))
		) {
			return null;
		}
		if (!colors.some((c) => c.value.toLowerCase() === item.toLowerCase())) {
			colors.push({
				value: item,
				fill: look?.fill ?? "#E8EAED",
				...(look?.color ? { text: look.color } : {}),
			});
		}
	}
	return colors;
}

interface Found {
	dropdown: Dropdown;
	validation: Validation;
	/** The conditional formatting blocks holding its colours. */
	chips: XmlElement[];
}

/** Every dropdown on the sheet, with the blocks that colour it. */
function scan(root: XmlElement, context: RulesContext): Found[] {
	const blocks = childrenNamed(root, "conditionalFormatting");
	const taken = new Set<XmlElement>();
	return validations(root).flatMap((validation) => {
		const read = readValidation(validation);
		if (!read) {
			return [];
		}
		const colors: ChipColor[] = [];
		const chips: XmlElement[] = [];
		for (const block of blocks) {
			if (taken.has(block) || !sameSqref(block.attrs.sqref ?? "", read.range)) {
				continue;
			}
			const found = chipColors(block, read.values, context);
			if (found) {
				taken.add(block);
				chips.push(block);
				for (const color of found) {
					const value = color.value.toLowerCase();
					if (!colors.some((c) => c.value.toLowerCase() === value)) {
						colors.push(color);
					}
				}
			}
		}
		return [
			{
				dropdown: { ...read, ...(colors.length > 0 ? { colors } : {}) },
				validation,
				chips,
			},
		];
	});
}

function ruleOf(node: XmlElement, context: RulesContext): ConditionalRule {
	const formulas = childrenNamed(node, "formula").map((f) =>
		fromFileFormula(textContent(f).trim()),
	);
	const scale = childNamed(node, "colorScale");
	const style = context.dxfs[Number(node.attrs.dxfId ?? -1)];
	return {
		type: node.attrs.type ?? "",
		...(node.attrs.operator ? { operator: node.attrs.operator } : {}),
		...(formulas.length > 0 ? { formulas } : {}),
		...(node.attrs.text !== undefined ? { text: node.attrs.text } : {}),
		...(style ? { style } : {}),
		priority: Number(node.attrs.priority ?? 0) || 0,
		...(isOn(node.attrs.stopIfTrue) ? { stopIfTrue: true as const } : {}),
		...(scale
			? {
					scale: {
						points: childrenNamed(scale, "cfvo").map((cfvo) => ({
							type: cfvo.attrs.type ?? "",
							...(cfvo.attrs.val !== undefined
								? { value: fromFileFormula(cfvo.attrs.val) }
								: {}),
						})),
						colors: childrenNamed(scale, "color").map((color) =>
							color.attrs.rgb
								? `#${color.attrs.rgb.slice(-6).toUpperCase()}`
								: "#FFFFFF",
						),
					},
				}
			: {}),
	};
}

/** The sheet's dropdowns and the conditional formats the grid draws. */
export function readRules(
	document: XmlDocument,
	context: RulesContext,
): { dropdowns?: Dropdown[]; conditional?: ConditionalFormat[] } {
	const root = document.root;
	const found = scan(root, context);
	const chips = new Set(found.flatMap((f) => f.chips));
	const conditional = childrenNamed(root, "conditionalFormatting").flatMap(
		(block) => {
			const rules = childrenNamed(block, "cfRule")
				.filter((rule) => DRAWN_RULES.has(rule.attrs.type ?? ""))
				.map((rule) => ruleOf(rule, context));
			return chips.has(block) || rules.length === 0 || !block.attrs.sqref
				? []
				: [{ range: block.attrs.sqref, rules }];
		},
	);
	return {
		...(found.length > 0 ? { dropdowns: found.map((f) => f.dropdown) } : {}),
		...(conditional.length > 0 ? { conditional } : {}),
	};
}

// =========================================================================
// Writing
// =========================================================================

/** Elements this save wrote, which must not be swapped for their old text. */
const rewritten = new WeakSet<XmlElement>();

const argb = (hex: string) => `FF${hex.slice(1).toUpperCase()}`;

function dxfNode(color: ChipColor): XmlElement {
	return element("dxf", {}, [
		...(color.text
			? [element("font", {}, [element("color", { rgb: argb(color.text) })])]
			: []),
		element("fill", {}, [
			element("patternFill", { patternType: "solid" }, [
				element("fgColor", { rgb: argb(color.fill) }),
				element("bgColor", { rgb: argb(color.fill) }),
			]),
		]),
	]);
}

/** The highest rule priority on the sheet, x14 rules included. */
function topPriority(node: XmlElement): number {
	let top = 0;
	for (const child of node.children) {
		if (isElement(child)) {
			if (child.name === "cfRule" || child.name === "x14:cfRule") {
				top = Math.max(top, Number(child.attrs.priority ?? 0) || 0);
			}
			top = Math.max(top, topPriority(child));
		}
	}
	return top;
}

function chipBlock(
	dropdown: Dropdown,
	context: RulesContext,
	priority: () => number,
): XmlElement | null {
	const dxf = context.dxf;
	const colors = (dropdown.colors ?? []).filter(
		(color) =>
			!dropdown.values || matchItem(dropdown.values, color.value) !== null,
	);
	if (!dxf || colors.length === 0) {
		return null;
	}
	const rules = colors.map((color) =>
		element(
			"cfRule",
			{
				type: "cellIs",
				dxfId: String(dxf(dxfNode(color))),
				priority: String(priority()),
				operator: "equal",
			},
			[element("formula", {}, [text(formulaFor(color.value))])],
		),
	);
	return element("conditionalFormatting", { sqref: dropdown.range }, [
		...rules,
		element("extLst", {}, [
			element("ext", { uri: CHIPS_URI, "xmlns:penombre": CHIPS_NS }, [
				element("penombre:chips"),
			]),
		]),
	]);
}

/** A validation's attributes and formula set from a dropdown. */
function fill(validation: Validation, dropdown: Dropdown): void {
	const { node, x14 } = validation;
	const formula = dropdown.values
		? listFormula(dropdown.values)
		: (dropdown.source ?? "");
	node.attrs.type = "list";
	node.attrs.showDropDown = dropdown.hideArrow ? "1" : undefined;
	if (dropdown.strict) {
		node.attrs.showErrorMessage = "1";
		node.attrs.errorStyle = undefined;
	} else if ((node.attrs.errorStyle ?? "stop") === "stop") {
		node.attrs.showErrorMessage = undefined;
	}
	if (x14) {
		node.children = [
			element("x14:formula1", {}, [element("xm:f", {}, [text(formula)])]),
			element("xm:sqref", {}, [text(dropdown.range)]),
		];
	} else {
		node.attrs.sqref = dropdown.range;
		node.children = [
			element("formula1", {}, [text(formula)]),
			...node.children.filter(
				(child) =>
					isElement(child) &&
					child.name !== "formula1" &&
					child.name !== "formula2",
			),
		];
	}
	rewritten.add(node);
}

function appendValidation(root: XmlElement, dropdown: Dropdown): void {
	let holder = childNamed(root, "dataValidations");
	if (!holder) {
		holder = element("dataValidations");
		insertAfter(root, holder, BEFORE_FORMATS);
	}
	const node = element("dataValidation", { type: "list", allowBlank: "1" });
	holder.children.push(node);
	fill({ node, x14: false }, dropdown);
}

function removeChild(parent: XmlElement | undefined, node: XmlNode): void {
	if (parent) {
		parent.children = parent.children.filter((child) => child !== node);
	}
}

/** Counts set, and holders left empty removed: Excel refuses an empty one. */
function tidy(root: XmlElement): void {
	const main = childNamed(root, "dataValidations");
	if (main) {
		const count = childrenNamed(main, "dataValidation").length;
		main.attrs.count = String(count);
		if (count === 0) {
			removeChild(root, main);
		}
	}
	const extLst = childNamed(root, "extLst");
	for (const ext of extLst ? childrenNamed(extLst, "ext") : []) {
		for (const holder of childrenNamed(ext, "x14:dataValidations")) {
			const count = childrenNamed(holder, "x14:dataValidation").length;
			holder.attrs.count = String(count);
			if (count === 0) {
				removeChild(ext, holder);
				if (!ext.children.some(isElement)) {
					removeChild(extLst, ext);
				}
			}
		}
	}
	if (extLst && !extLst.children.some(isElement)) {
		removeChild(root, extLst);
	}
}

function removeValidation(root: XmlElement, { node, x14 }: Validation): void {
	if (!x14) {
		removeChild(childNamed(root, "dataValidations"), node);
		return;
	}
	for (const holder of x14Holders(root)) {
		removeChild(holder, node);
	}
}

const listKey = (dropdown: Dropdown) =>
	JSON.stringify([dropdown.values, dropdown.source]);

/** The validation's own part of a dropdown, colours aside. */
const validationKey = ({ colors: _colors, ...rest }: Dropdown) =>
	dropdownKey(rest);

/**
 * Which of the file's dropdowns each of the editor's is. An identical one
 * is left alone; otherwise one on the same range, or with the same list,
 * is updated in place, so what the editor does not model on it (an input
 * message, an Excel 2010 placement) survives. Matching on content rather
 * than position keeps the next autosave, which sends the same list, a
 * no-op.
 */
function match(found: Found[], dropdowns: Dropdown[]) {
	const left = new Set(found);
	const take = (test: (f: Found) => boolean) => {
		const hit = [...left].find(test);
		if (hit) {
			left.delete(hit);
		}
		return hit;
	};
	const pending = dropdowns.filter(
		(dropdown) =>
			!take((f) => dropdownKey(f.dropdown) === dropdownKey(dropdown)),
	);
	const changes = pending.map((dropdown) => ({
		dropdown,
		current:
			take((f) => sameSqref(f.dropdown.range, dropdown.range)) ??
			take((f) => listKey(f.dropdown) === listKey(dropdown)),
	}));
	return { changes, removed: [...left] };
}

/**
 * The editor's dropdowns applied to a worksheet: changed ones rewritten
 * with their colour blocks, removed ones dropped, new ones appended. Every
 * other validation and format stays as it was. Whether anything changed.
 */
export function writeRules(
	document: XmlDocument,
	dropdowns: Dropdown[],
	context: RulesContext,
): boolean {
	const root = document.root;
	const { changes, removed } = match(scan(root, context), dropdowns);
	if (changes.length === 0 && removed.length === 0) {
		return false;
	}
	for (const gone of [...removed, ...changes.flatMap((c) => c.current ?? [])]) {
		for (const block of gone.chips) {
			removeChild(root, block);
		}
	}
	for (const gone of removed) {
		removeValidation(root, gone.validation);
	}
	let priority = topPriority(root);
	const next = () => ++priority;
	for (const { dropdown, current } of changes) {
		if (!current) {
			appendValidation(root, dropdown);
		} else if (validationKey(current.dropdown) !== validationKey(dropdown)) {
			fill(current.validation, dropdown);
		}
		const block = chipBlock(dropdown, context, next);
		if (block) {
			rewritten.add(block);
			insertAfter(root, block, BEFORE_FORMATS);
		}
	}
	tidy(root);
	return true;
}

// =========================================================================
// Untouched, verbatim
// =========================================================================

const VALIDATION_TEXT =
	/<dataValidation(?=[\s>/])[^>]*?(?:\/>|>[\s\S]*?<\/dataValidation>)/g;
const BLOCK_TEXT =
	/<conditionalFormatting(?=[\s>/])[^>]*?(?:\/>|>[\s\S]*?<\/conditionalFormatting>)/g;

/**
 * Remembers the sheet's validations and conditional formats as written; the
 * function it returns swaps each one this save did not rewrite back for
 * that text, just before the part is serialised.
 */
export function holdVerbatim(
	document: XmlDocument,
	source: string,
): () => void {
	const root = document.root;
	const holder = childNamed(root, "dataValidations");
	const held = [
		{
			nodes: holder ? childrenNamed(holder, "dataValidation") : [],
			texts: source.match(VALIDATION_TEXT) ?? [],
			parent: () => childNamed(root, "dataValidations"),
		},
		{
			nodes: childrenNamed(root, "conditionalFormatting"),
			texts: source.match(BLOCK_TEXT) ?? [],
			parent: () => root,
		},
	];
	return () => {
		for (const { nodes, texts, parent } of held) {
			const into = parent();
			if (!into || nodes.length !== texts.length) {
				continue;
			}
			nodes.forEach((node, k) => {
				const at = into.children.indexOf(node);
				if (at >= 0 && !rewritten.has(node)) {
					into.children[at] = { type: "raw", text: texts[k] ?? "" };
				}
			});
		}
	};
}
