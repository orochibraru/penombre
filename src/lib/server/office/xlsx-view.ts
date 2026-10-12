import { columnName } from "#lib/formula.js";
import { EXCEL_WIDTH, type Freeze } from "#lib/sheet/layout.js";
import { parseRange } from "#lib/sheet/merges.js";
import { cellName } from "#lib/sheet/selection.js";
import { insertAfter } from "./xlsx-styles";
import {
	childNamed,
	childrenNamed,
	element,
	isElement,
	type XmlDocument,
	type XmlElement,
} from "./xml";

/**
 * A worksheet's view beside its cells: column widths (`<cols>`), the frozen
 * pane (`<sheetView><pane>`) and which cells hold a hyperlink. Widths and
 * the pane are written back when the editor changed them, and only then.
 *
 * Widths are Excel's characters of the default font's widest digit. Pixels
 * follow Excel's own formula with a 7px digit, which is Calibri 11's and
 * close to Arial 10's: a workbook whose default font is far from those
 * (Calibri 20, say) comes out narrower here than in Excel.
 */

const DIGIT = 7;
/** Columns past this are never read: `<col max="16384">` is common. */
const MAX_COLUMNS = 1024;

export const widthToPx = (chars: number) =>
	Math.trunc(((256 * chars + Math.trunc(128 / DIGIT)) / 256) * DIGIT);

export const pxToWidth = (px: number) => Math.trunc((px / DIGIT) * 256) / 256;

export interface SheetView {
	widths?: number[];
	defaultWidth?: number;
	freeze?: Freeze;
	links?: string[];
}

function defaultWidthOf(root: XmlElement): number {
	const format = childNamed(root, "sheetFormatPr");
	const declared = Number(format?.attrs.defaultColWidth);
	if (declared > 0) {
		return widthToPx(declared);
	}
	// Excel's 8.43 characters is 64px; a narrower base scales from there.
	const base = Number(format?.attrs.baseColWidth ?? 8) || 8;
	return base * DIGIT + 8;
}

function readWidths(root: XmlElement): number[] {
	const widths: number[] = [];
	const cols = childNamed(root, "cols");
	for (const col of cols ? childrenNamed(cols, "col") : []) {
		const width = Number(col.attrs.width);
		const min = Number(col.attrs.min);
		if (!(width >= 0 && min >= 1)) {
			continue;
		}
		const max = Math.min(Number(col.attrs.max ?? min), MAX_COLUMNS);
		for (let c = min; c <= max; c++) {
			widths[c - 1] = widthToPx(width);
		}
	}
	return Array.from(widths, (px) => px ?? 0);
}

const paneOf = (root: XmlElement) => {
	const view = childNamed(childNamed(root, "sheetViews") ?? root, "sheetView");
	return { view, pane: view ? childNamed(view, "pane") : undefined };
};

function readFreeze(root: XmlElement): Freeze {
	const { pane } = paneOf(root);
	if (
		!(pane?.attrs.state === "frozen" || pane?.attrs.state === "frozenSplit")
	) {
		return { rows: 0, cols: 0 };
	}
	const count = (value: string | undefined) =>
		Math.max(0, Math.round(Number(value ?? 0)) || 0);
	return { rows: count(pane.attrs.ySplit), cols: count(pane.attrs.xSplit) };
}

function readLinks(root: XmlElement): string[] {
	const holder = childNamed(root, "hyperlinks");
	const links: string[] = [];
	for (const link of holder ? childrenNamed(holder, "hyperlink") : []) {
		const ref = (link.attrs.ref ?? "").toUpperCase();
		const rect = parseRange(ref);
		if (!rect) {
			links.push(ref);
			continue;
		}
		for (let r = rect.top; r <= rect.bottom && links.length < 10_000; r++) {
			for (let c = rect.left; c <= rect.right; c++) {
				links.push(cellName({ row: r, col: c }));
			}
		}
	}
	return links.filter((ref) => /^[A-Z]{1,3}[1-9]\d*$/.test(ref));
}

export function readView(document: XmlDocument): SheetView {
	const root = document.root;
	const widths = readWidths(root);
	const freeze = readFreeze(root);
	const links = readLinks(root);
	const defaultWidth = defaultWidthOf(root);
	return {
		...(widths.length > 0 ? { widths } : {}),
		...(defaultWidth === EXCEL_WIDTH ? {} : { defaultWidth }),
		...(freeze.rows || freeze.cols ? { freeze } : {}),
		...(links.length > 0 ? { links } : {}),
	};
}

// =========================================================================
// Writing
// =========================================================================

/** `<col>` elements split so column `n` (1-based) has one of its own. */
function ownCol(cols: XmlElement, n: number): XmlElement {
	const list = childrenNamed(cols, "col");
	const at = list.findIndex(
		(col) =>
			Number(col.attrs.min) <= n && n <= Number(col.attrs.max ?? col.attrs.min),
	);
	const found = list[at];
	if (!found) {
		const created = element("col", { min: String(n), max: String(n) });
		list.push(created);
		list.sort((a, b) => Number(a.attrs.min) - Number(b.attrs.min));
		cols.children = list;
		return created;
	}
	const min = Number(found.attrs.min);
	const max = Number(found.attrs.max ?? min);
	const piece = (from: number, to: number) =>
		element("col", { ...found.attrs, min: String(from), max: String(to) });
	const own = piece(n, n);
	const pieces = [
		...(min < n ? [piece(min, n - 1)] : []),
		own,
		...(max > n ? [piece(n + 1, max)] : []),
	];
	list.splice(at, 1, ...pieces);
	cols.children = list;
	return own;
}

/** Each column whose width the editor changed, written; the rest kept. */
function writeWidths(root: XmlElement, widths: number[]): boolean {
	const current = readWidths(root);
	const fallback = defaultWidthOf(root);
	const changed = widths.flatMap((px, col) =>
		px > 0 && px !== (current[col] || fallback) ? [[col, px] as const] : [],
	);
	if (changed.length === 0) {
		return false;
	}
	let cols = childNamed(root, "cols");
	if (!cols) {
		cols = element("cols");
		insertAfter(root, cols, [
			"sheetPr",
			"dimension",
			"sheetViews",
			"sheetFormatPr",
		]);
	}
	for (const [col, px] of changed) {
		const own = ownCol(cols, col + 1);
		own.attrs.width = String(pxToWidth(px));
		own.attrs.customWidth = "1";
	}
	return true;
}

const ACTIVE_PANE = (freeze: Freeze) =>
	freeze.rows && freeze.cols
		? "bottomRight"
		: freeze.rows
			? "bottomLeft"
			: "topRight";

/** The sheet's first view frozen at `freeze`, or unfrozen. */
function writeFreeze(root: XmlElement, freeze: Freeze): boolean {
	const current = readFreeze(root);
	if (current.rows === freeze.rows && current.cols === freeze.cols) {
		return false;
	}
	let views = childNamed(root, "sheetViews");
	if (!views) {
		views = element("sheetViews");
		insertAfter(root, views, ["sheetPr", "dimension"]);
	}
	let view = childNamed(views, "sheetView");
	if (!view) {
		view = element("sheetView", { workbookViewId: "0" });
		views.children.push(view);
	}
	const frozen = freeze.rows > 0 || freeze.cols > 0;
	const active = frozen ? ACTIVE_PANE(freeze) : undefined;
	// A selection names its pane; one per pane that no longer exists goes.
	const [selection] = childrenNamed(view, "selection");
	view.children = view.children.filter(
		(child) =>
			!(isElement(child) && ["pane", "selection"].includes(child.name)),
	);
	if (selection) {
		selection.attrs.pane = active;
		view.children.unshift(selection);
	}
	if (frozen) {
		view.children.unshift(
			element("pane", {
				xSplit: freeze.cols ? String(freeze.cols) : undefined,
				ySplit: freeze.rows ? String(freeze.rows) : undefined,
				topLeftCell: `${columnName(freeze.cols)}${freeze.rows + 1}`,
				activePane: active,
				state: "frozen",
			}),
		);
	}
	return true;
}

/** The editor's widths and pane applied to the sheet; whether anything changed. */
export function writeView(
	document: XmlDocument,
	view: Pick<SheetView, "widths" | "freeze">,
): boolean {
	const widths = view.widths ? writeWidths(document.root, view.widths) : false;
	const freeze = view.freeze ? writeFreeze(document.root, view.freeze) : false;
	return widths || freeze;
}

// =========================================================================
// What the editor sends, checked: it crossed the network
// =========================================================================

const isCount = (value: unknown) =>
	Number.isSafeInteger(value) &&
	(value as number) >= 0 &&
	(value as number) <= 1_048_576;

/** The view the editor sent for a sheet, or null when it is malformed. */
export function checkView(sheet: {
	widths?: unknown;
	freeze?: unknown;
}): Pick<SheetView, "widths" | "freeze"> | null {
	const { widths, freeze } = sheet;
	const frozen = freeze as Partial<Freeze> | null | undefined;
	const freezeOk =
		freeze === undefined ||
		(typeof frozen === "object" &&
			frozen !== null &&
			isCount(frozen.rows) &&
			isCount(frozen.cols));
	const widthsOk =
		widths === undefined ||
		(Array.isArray(widths) &&
			widths.length <= 16_384 &&
			widths.every((px) => typeof px === "number" && px >= 0 && px <= 10_000));
	if (!(freezeOk && widthsOk)) {
		return null;
	}
	return {
		...(widths ? { widths: widths as number[] } : {}),
		...(frozen
			? { freeze: { rows: frozen.rows as number, cols: frozen.cols as number } }
			: {}),
	};
}
