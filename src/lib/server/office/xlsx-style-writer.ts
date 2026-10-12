import { builtinId } from "#lib/sheet/number-formats.js";
import {
	type CellStyle,
	normalizeStyle,
	SIDES,
	styleKey,
} from "#lib/sheet/styles.js";
import { insertAfter, SIDE_NAMES, Stylesheet } from "./xlsx-styles";
import {
	childNamed,
	childrenNamed,
	element,
	findElements,
	isElement,
	serializeNode,
	serializeXml,
	type XmlDocument,
	type XmlElement,
} from "./xml";
import { partText, setPartText, type ZipEntry } from "./zip";

/**
 * New style combinations appended to `styles.xml` on save. Nothing is
 * renumbered or dropped: cells, conditional formats and charts elsewhere
 * point at these indices. A new entry is a copy of the one it was made from
 * (`base`) with only what changed rewritten, so a theme colour or a
 * protection flag the editor never touched survives.
 */

const MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const REL_NS =
	"http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const STYLES_CONTENT =
	"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml";
const DEFAULT_STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="${MAIN}"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

// =========================================================================
// Writing: new combinations appended, existing entries left alone
// =========================================================================

const STYLESHEET_ORDER = [
	"numFmts",
	"fonts",
	"fills",
	"borders",
	"cellStyleXfs",
	"cellXfs",
	"cellStyles",
	"dxfs",
	"tableStyles",
	"colors",
	"extLst",
];
const FONT_ORDER = [
	"b",
	"i",
	"strike",
	"condense",
	"extend",
	"outline",
	"shadow",
	"u",
	"vertAlign",
	"sz",
	"color",
	"name",
	"family",
	"charset",
	"scheme",
];
const BORDER_ORDER = [
	"start",
	"end",
	"left",
	"right",
	"top",
	"bottom",
	"diagonal",
	"vertical",
	"horizontal",
];
const XF_ORDER = ["alignment", "protection", "extLst"];

/** Replaces (or, with null, removes) a child, keeping the schema's order. */
function setChild(
	parent: XmlElement,
	name: string,
	next: XmlElement | null,
	order: string[],
): void {
	const at = parent.children.findIndex(
		(child) => isElement(child) && child.name === name,
	);
	if (at >= 0) {
		if (next) {
			parent.children[at] = next;
		} else {
			parent.children.splice(at, 1);
		}
		return;
	}
	if (!next) {
		return;
	}
	insertAfter(parent, next, order.slice(0, order.indexOf(name)));
}

const clone = (node: XmlElement): XmlElement =>
	structuredClone(node) as XmlElement;

const argb = (hex: string) => `FF${hex.slice(1)}`;

const BORDER_DEFAULT = () =>
	element(
		"border",
		{},
		["left", "right", "top", "bottom", "diagonal"].map((name) => element(name)),
	);

/**
 * Maps the editor's style table onto `cellXfs` indices, appending what the
 * file lacks. `save` writes `styles.xml` only when something was appended.
 */
export class StyleWriter {
	private readonly sheet: Stylesheet;
	private readonly resolved: CellStyle[];
	private readonly byKey = new Map<string, number>();
	private readonly originalCount: number;
	private changed = false;

	constructor(
		private readonly entries: ZipEntry[],
		private readonly table: CellStyle[] = [],
	) {
		this.sheet = new Stylesheet(entries);
		this.resolved = this.sheet
			.list("cellXfs", "xf")
			.map((xf) => this.sheet.resolve(xf));
		this.originalCount = this.resolved.length;
		this.resolved.forEach((style, index) => {
			const key = styleKey(style);
			if (!this.byKey.has(key)) {
				this.byKey.set(key, index);
			}
		});
	}

	/** Whether the package has a styles part at all. */
	get present(): boolean {
		return this.sheet.document !== null;
	}

	/** The `cellXfs` index for the editor's style `index`. */
	xfFor = (index: number): number => {
		if (index === 0) {
			return 0;
		}
		const wanted = this.table[index];
		if (!wanted) {
			return index < this.originalCount ? index : 0;
		}
		const style = normalizeStyle(wanted, this.sheet.defaults);
		const key = styleKey(style);
		const own = this.resolved[index];
		if (own && styleKey(own) === key) {
			return index;
		}
		const found = this.byKey.get(key);
		if (found !== undefined) {
			return found;
		}
		if (key === styleKey({}) && !this.present) {
			return 0;
		}
		return this.append(style, key);
	};

	private container(name: string): XmlElement {
		const document = this.sheet.document;
		if (!document) {
			throw new Error("No styles part");
		}
		let holder = childNamed(document.root, name);
		if (!holder) {
			holder = element(name, { count: "0" });
			insertAfter(
				document.root,
				holder,
				STYLESHEET_ORDER.slice(0, STYLESHEET_ORDER.indexOf(name)),
			);
			// Index 0 of each list is what a style without one points at.
			const first = {
				fonts: () =>
					element("font", {}, [
						element("sz", { val: String(this.sheet.defaults.size ?? 11) }),
						element("name", { val: this.sheet.defaults.font ?? "Calibri" }),
					]),
				fills: () =>
					element("fill", {}, [
						element("patternFill", { patternType: "none" }),
					]),
				borders: BORDER_DEFAULT,
				cellXfs: () =>
					element("xf", {
						numFmtId: "0",
						fontId: "0",
						fillId: "0",
						borderId: "0",
					}),
			}[name as "fonts" | "fills" | "borders" | "cellXfs"];
			if (first) {
				holder.children.push(first());
				if (name === "fills") {
					holder.children.push(
						element("fill", {}, [
							element("patternFill", { patternType: "gray125" }),
						]),
					);
				}
			}
		}
		return holder;
	}

	/** An entry's index in its list, reusing an identical one. */
	private add(holder: string, item: string, node: XmlElement): number {
		const parent = this.container(holder);
		const items = childrenNamed(parent, item);
		const text = serializeNode(node);
		const same = items.findIndex(
			(existing) => serializeNode(existing) === text,
		);
		if (same >= 0) {
			return same;
		}
		parent.children.push(node);
		parent.attrs.count = String(items.length + 1);
		return items.length;
	}

	private formatId(code: string | undefined): number {
		if (!code) {
			return 0;
		}
		const builtin = builtinId(code);
		if (builtin !== undefined) {
			return builtin;
		}
		for (const [id, existing] of this.sheet.formats) {
			if (existing === code) {
				return id;
			}
		}
		const id = Math.max(163, ...this.sheet.formats.keys()) + 1;
		this.sheet.formats.set(id, code);
		const parent = this.container("numFmts");
		parent.children.push(
			element("numFmt", { numFmtId: String(id), formatCode: code }),
		);
		parent.attrs.count = String(childrenNamed(parent, "numFmt").length);
		return id;
	}

	private font(base: XmlElement | undefined, from: CellStyle, to: CellStyle) {
		const font = base ? clone(base) : element("font");
		const flag = (name: string, on: boolean | undefined) =>
			setChild(font, name, on ? element(name) : null, FONT_ORDER);
		if (from.bold !== to.bold) {
			flag("b", to.bold);
		}
		if (from.italic !== to.italic) {
			flag("i", to.italic);
		}
		if (from.strike !== to.strike) {
			flag("strike", to.strike);
		}
		if (from.underline !== to.underline) {
			flag("u", to.underline);
		}
		const { defaults } = this.sheet;
		if (from.size !== to.size) {
			const size = to.size ?? defaults.size ?? 11;
			setChild(font, "sz", element("sz", { val: String(size) }), FONT_ORDER);
		}
		if (from.color !== to.color) {
			setChild(
				font,
				"color",
				to.color ? element("color", { rgb: argb(to.color) }) : null,
				FONT_ORDER,
			);
		}
		if (from.font !== to.font) {
			const name = to.font ?? defaults.font ?? "Calibri";
			setChild(font, "name", element("name", { val: name }), FONT_ORDER);
			// A theme scheme overrides the name in Excel.
			setChild(font, "scheme", null, FONT_ORDER);
			setChild(font, "family", null, FONT_ORDER);
			setChild(font, "charset", null, FONT_ORDER);
		}
		return this.add("fonts", "font", font);
	}

	private fill(to: CellStyle): number {
		if (!to.fill) {
			return 0;
		}
		return this.add(
			"fills",
			"fill",
			element("fill", {}, [
				element("patternFill", { patternType: "solid" }, [
					element("fgColor", { rgb: argb(to.fill) }),
					element("bgColor", { indexed: "64" }),
				]),
			]),
		);
	}

	private border(base: XmlElement | undefined, from: CellStyle, to: CellStyle) {
		const border = base ? clone(base) : BORDER_DEFAULT();
		for (const side of SIDES) {
			const before = from.borders?.[side];
			const after = to.borders?.[side];
			if (before?.style === after?.style && before?.color === after?.color) {
				continue;
			}
			const name = side;
			// `start`/`end` are the same sides; one spelling per border.
			for (const alias of SIDE_NAMES[side].slice(1)) {
				setChild(border, alias, null, BORDER_ORDER);
			}
			setChild(
				border,
				name,
				after
					? element(
							name,
							{ style: after.style },
							after.color ? [element("color", { rgb: argb(after.color) })] : [],
						)
					: element(name),
				BORDER_ORDER,
			);
		}
		return this.add("borders", "border", border);
	}

	private append(style: CellStyle, key: string): number {
		if (!this.sheet.document) {
			throw new Error("No styles part");
		}
		const xfs = this.sheet.list("cellXfs", "xf");
		const base =
			style.base !== undefined && style.base < this.originalCount
				? style.base
				: 0;
		const from = this.resolved[base] ?? {};
		const xf = xfs[base]
			? clone(xfs[base])
			: element("xf", {
					numFmtId: "0",
					fontId: "0",
					fillId: "0",
					borderId: "0",
				});
		const changed = (...fields: (keyof CellStyle)[]) =>
			fields.some(
				(field) => JSON.stringify(from[field]) !== JSON.stringify(style[field]),
			);
		if (
			changed("bold", "italic", "strike", "underline", "size", "color", "font")
		) {
			const fonts = this.sheet.list("fonts", "font");
			xf.attrs.fontId = String(
				this.font(fonts[Number(xf.attrs.fontId ?? 0)], from, style),
			);
			xf.attrs.applyFont = "1";
		}
		if (changed("fill")) {
			xf.attrs.fillId = String(this.fill(style));
			xf.attrs.applyFill = "1";
		}
		if (changed("borders")) {
			const borders = this.sheet.list("borders", "border");
			xf.attrs.borderId = String(
				this.border(borders[Number(xf.attrs.borderId ?? 0)], from, style),
			);
			xf.attrs.applyBorder = "1";
		}
		if (changed("format")) {
			xf.attrs.numFmtId = String(this.formatId(style.format));
			xf.attrs.applyNumberFormat = "1";
		}
		if (changed("align", "valign", "wrap")) {
			const alignment = clone(
				childNamed(xf, "alignment") ?? element("alignment"),
			);
			if (from.align !== style.align) {
				alignment.attrs.horizontal = style.align;
			}
			if (from.valign !== style.valign) {
				alignment.attrs.vertical =
					style.valign === "middle" ? "center" : style.valign;
			}
			if (from.wrap !== style.wrap) {
				alignment.attrs.wrapText = style.wrap ? "1" : undefined;
			}
			const empty = Object.values(alignment.attrs).every(
				(v) => v === undefined,
			);
			setChild(xf, "alignment", empty ? null : alignment, XF_ORDER);
			xf.attrs.applyAlignment = "1";
		}
		const holder = this.container("cellXfs");
		holder.children.push(xf);
		const index = childrenNamed(holder, "xf").length - 1;
		holder.attrs.count = String(index + 1);
		const written = this.sheet.resolve(xf);
		this.resolved[index] = written;
		this.byKey.set(key, index);
		if (styleKey(written) !== key) {
			this.byKey.set(styleKey(written), index);
		}
		this.changed = true;
		return index;
	}

	/** A conditional format's `dxfs` index, appended unless one is identical. */
	dxf = (node: XmlElement): number => {
		const before = this.sheet.list("dxfs", "dxf").length;
		const index = this.add("dxfs", "dxf", node);
		this.changed ||= index >= before;
		return index;
	};

	/** Writes `styles.xml` back when an entry was appended. */
	save(): void {
		if (this.changed && this.sheet.document) {
			setPartText(
				this.entries,
				this.sheet.path,
				serializeXml(this.sheet.document),
			);
		}
	}
}

/**
 * A styles part for a package that has none, with its relationship and
 * content type, so cells can be given a style at all.
 */
export function addStylesPart(
	entries: ZipEntry[],
	rels: XmlDocument,
	types: XmlDocument,
): void {
	if (partText(entries, "xl/styles.xml")) {
		return;
	}
	setPartText(entries, "xl/styles.xml", DEFAULT_STYLES);
	const ids = new Set(
		findElements(rels.root, "Relationship").map((r) => r.attrs.Id),
	);
	let n = 1;
	while (ids.has(`rId${n}`)) {
		n++;
	}
	rels.root.children.push(
		element("Relationship", {
			Id: `rId${n}`,
			Type: `${REL_NS}/styles`,
			Target: "styles.xml",
		}),
	);
	types.root.children.push(
		element("Override", {
			PartName: "/xl/styles.xml",
			ContentType: STYLES_CONTENT,
		}),
	);
}

/** What the editor sent about one sheet's formatting. */
interface FormattedSheet {
	styleIds?: number[][];
	merges?: string[];
	dropdowns?: { colors?: unknown[] }[];
}

/**
 * The style writer for a save, with a styles part added first when the
 * package has none and some cell is to be given a style.
 */
export function styleWriterFor(
	entries: ZipEntry[],
	table: CellStyle[],
	sheets: FormattedSheet[],
	pkg: { rels: XmlDocument; types: XmlDocument },
): StyleWriter {
	const writer = new StyleWriter(entries, table);
	const styled = sheets.some(
		(sheet) =>
			sheet.styleIds?.some((row) => row.some((index) => index > 0)) ||
			sheet.dropdowns?.some((dropdown) => dropdown.colors?.length),
	);
	if (writer.present || !styled) {
		return writer;
	}
	addStylesPart(entries, pkg.rels, pkg.types);
	return new StyleWriter(entries, table);
}

/** A sheet's formatting with the editor's style indices mapped to the file's. */
export function mappedFormats(
	writer: StyleWriter,
	sheet: FormattedSheet,
): { styleIds?: number[][]; merges?: string[] } {
	return {
		styleIds: sheet.styleIds?.map((row) => row.map(writer.xfFor)),
		merges: sheet.merges,
	};
}

/** The editor's style table from its JSON, checked: it crossed the network. */
export function styleTable(parsed: unknown): CellStyle[] {
	const styles = (parsed as { styles?: unknown } | null)?.styles;
	if (!Array.isArray(styles) || styles.length > 65_000) {
		return [];
	}
	return styles.map((style) => normalizeStyle(style));
}
