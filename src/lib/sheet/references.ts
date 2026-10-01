/**
 * References in formula text: the tokenizer, the parts of a reference
 * (`Sheet 2'!$A1:B$9`), and the rewrites Excel applies to formulas when
 * cells are copied, rows and columns inserted or deleted, and sheets renamed.
 * Everything here works on tokens, never on the raw text, so a string that
 * happens to read `A1` is never touched.
 */

import { PARSE, REF } from "./values";

/** Excel's limits: 1,048,576 rows and 16,384 columns (XFD). */
export const MAX_ROW = 1_048_575;
export const MAX_COL = 16_383;

/** Whether a cell's text is a formula. */
export function isFormula(text: string): boolean {
	return text.length > 1 && text.startsWith("=");
}

// =========================================================================
// Tokens
// =========================================================================

const SHEET = String.raw`(?:'(?:[^']|'')+'|[A-Za-z_\u00C0-\uFFFF][\w.\u00C0-\uFFFF]*)!`;
const CELL = String.raw`\$?[A-Za-z]{1,3}\$?\d+`;
const REFERENCE = String.raw`(?:${SHEET})?(?:${CELL}(?::${CELL})?|\$?[A-Za-z]{1,3}:\$?[A-Za-z]{1,3}|\$?\d+:\$?\d+)`;

const TOKEN = new RegExp(
	String.raw`\s*(?:(#(?:REF!|N/A|DIV/0!|VALUE!|NAME\?|NUM!|NULL!))|(${REFERENCE})(?![\w(.!])|(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)|("(?:[^"]|"")*")|([A-Za-z_][\w.]*)|(<>|<=|>=|[-+*/^&=<>(),:;%]))`,
	"y",
);

export interface Token {
	kind: "err" | "ref" | "num" | "str" | "name" | "op";
	text: string;
	/** Offset of the token's text in the formula, for rewriting in place. */
	start: number;
}

const KINDS = ["err", "ref", "num", "str", "name", "op"] as const;

export function tokenize(source: string): Token[] {
	const tokens: Token[] = [];
	TOKEN.lastIndex = 0;
	while (TOKEN.lastIndex < source.length) {
		if (/^\s*$/.test(source.slice(TOKEN.lastIndex))) {
			break;
		}
		const at = TOKEN.lastIndex;
		const match = TOKEN.exec(source);
		if (!match || TOKEN.lastIndex === at) {
			throw PARSE;
		}
		const group = match.slice(1).findIndex((part) => part !== undefined);
		const text = match[group + 1] ?? "";
		tokens.push({
			kind: KINDS[group] ?? "op",
			text,
			start: TOKEN.lastIndex - text.length,
		});
	}
	return tokens;
}

/** Column letters to a zero-based index: `A` 0, `AA` 26. */
function columnIndex(letters: string): number {
	let col = 0;
	for (const char of letters.toUpperCase()) {
		col = col * 26 + (char.charCodeAt(0) - 64);
	}
	return col - 1;
}

/** Spreadsheet-style column names: A…Z, AA, AB… */
export function columnName(index: number): string {
	let name = "";
	let n = index;
	do {
		name = String.fromCharCode(65 + (n % 26)) + name;
		n = Math.floor(n / 26) - 1;
	} while (n >= 0);
	return name;
}

/** `A1` → [row, col], zero-based. */
export function parseRef(ref: string): [number, number] {
	const match = /^\$?([A-Za-z]+)\$?(\d+)$/.exec(ref);
	if (!match) {
		throw REF;
	}
	return [Number(match[2]) - 1, columnIndex(match[1] ?? "")];
}

// =========================================================================
// References as parts, for evaluation and for rewriting
// =========================================================================

/** One end of a reference; a whole column has no row, a whole row no column. */
export interface End {
	col: number | null;
	row: number | null;
	colAbs: boolean;
	rowAbs: boolean;
}

export interface RefParts {
	sheet: string | null;
	start: End;
	end: End | null;
}

function parseEnd(text: string): End {
	const match = /^(\$?)([A-Za-z]+)?(\$?)(\d+)?$/.exec(text);
	const letters = match?.[2];
	const digits = match?.[4];
	return {
		col: letters ? columnIndex(letters) : null,
		row: digits ? Number(digits) - 1 : null,
		colAbs: Boolean(letters) && match?.[1] === "$",
		rowAbs: letters
			? match?.[3] === "$"
			: match?.[1] === "$" || match?.[3] === "$",
	};
}

export function parseParts(text: string): RefParts {
	const bang = text.lastIndexOf("!");
	const raw = bang < 0 ? null : text.slice(0, bang);
	const sheet =
		raw?.startsWith("'") && raw.endsWith("'")
			? raw.slice(1, -1).replace(/''/g, "'")
			: raw;
	const [from = "", to] = text.slice(bang + 1).split(":");
	return {
		sheet,
		start: parseEnd(from),
		end: to === undefined ? null : parseEnd(to),
	};
}

/** A sheet name as a formula writes it, quoted when it must be. */
export function quoteSheet(name: string): string {
	const bare =
		/^[A-Za-z_\u00C0-\uFFFF][\w.\u00C0-\uFFFF]*$/.test(name) &&
		!/^[A-Za-z]{1,3}\d+$/.test(name) &&
		!/^(TRUE|FALSE)$/i.test(name);
	return bare ? name : `'${name.replace(/'/g, "''")}'`;
}

function formatEnd(end: End): string {
	const col =
		end.col === null ? "" : `${end.colAbs ? "$" : ""}${columnName(end.col)}`;
	const row = end.row === null ? "" : `${end.rowAbs ? "$" : ""}${end.row + 1}`;
	return col + row;
}

function formatParts(parts: RefParts): string {
	const sheet = parts.sheet === null ? "" : `${quoteSheet(parts.sheet)}!`;
	const end = parts.end ? `:${formatEnd(parts.end)}` : "";
	return sheet + formatEnd(parts.start) + end;
}

// =========================================================================
// Rewriting: what Excel does to formulas when cells move
// =========================================================================

/**
 * Rewrites every reference in a formula through `change`, which returns the
 * same parts to keep one, new parts to replace it, or null for `#REF!`.
 * Text that does not tokenise is returned as it was.
 */
function rewriteRefs(
	text: string,
	change: (parts: RefParts) => RefParts | null,
): string {
	if (!isFormula(text)) {
		return text;
	}
	let tokens: Token[];
	try {
		tokens = tokenize(text.slice(1));
	} catch {
		return text;
	}
	let out = "=";
	let at = 0;
	const body = text.slice(1);
	for (const token of tokens) {
		if (token.kind !== "ref") {
			continue;
		}
		const parts = parseParts(token.text);
		const next = change(parts);
		if (next === parts) {
			continue;
		}
		out += body.slice(at, token.start) + (next ? formatParts(next) : "#REF!");
		at = token.start + token.text.length;
	}
	return at === 0 ? text : out + body.slice(at);
}

function shiftEnd(end: End, rows: number, cols: number): End | null {
	const row = end.row === null || end.rowAbs ? end.row : end.row + rows;
	const col = end.col === null || end.colAbs ? end.col : end.col + cols;
	if (row !== null && (row < 0 || row > MAX_ROW)) {
		return null;
	}
	if (col !== null && (col < 0 || col > MAX_COL)) {
		return null;
	}
	return { ...end, row, col };
}

/**
 * A formula copied `rows` down and `cols` across: relative references move
 * with it, `$` ones stay, and one pushed off the sheet becomes `#REF!`.
 */
export function shiftFormula(text: string, rows: number, cols: number): string {
	if (rows === 0 && cols === 0) {
		return text;
	}
	return rewriteRefs(text, (parts) => {
		const start = shiftEnd(parts.start, rows, cols);
		const end = parts.end ? shiftEnd(parts.end, rows, cols) : null;
		if (!start || (parts.end && !end)) {
			return null;
		}
		return { ...parts, start, end };
	});
}

/** Rows or columns inserted (`count` > 0) or deleted (< 0) at `at`. */
export interface LineChange {
	axis: "row" | "col";
	at: number;
	count: number;
}

/** A line index after the change, or null when its line was deleted. */
function moved(index: number, { at, count }: LineChange): number | null {
	if (index < at) {
		return index;
	}
	if (count > 0) {
		return index + count;
	}
	return index >= at - count ? index + count : null;
}

function adjustParts(parts: RefParts, change: LineChange): RefParts | null {
	const field = change.axis === "row" ? "row" : "col";
	const lo = parts.start[field];
	const hi = parts.end ? parts.end[field] : lo;
	if (lo === null || hi === null) {
		return parts;
	}
	const [low, high] = lo <= hi ? [lo, hi] : [hi, lo];
	let newLow = moved(low, change);
	let newHigh = moved(high, change);
	if (!parts.end) {
		return newLow === null ? null : withField(parts, field, newLow, newLow);
	}
	// A range loses the deleted lines inside it, and only dies with all of them.
	const deletedTo = change.at - change.count - 1;
	newLow ??= high > deletedTo ? change.at : null;
	newHigh ??= low < change.at ? change.at - 1 : null;
	if (newLow === null || newHigh === null) {
		return null;
	}
	return withField(parts, field, newLow, newHigh);
}

function withField(
	parts: RefParts,
	field: "row" | "col",
	low: number,
	high: number,
): RefParts {
	const start = parts.start;
	const end = parts.end ?? start;
	if (start[field] === low && end[field] === high) {
		return parts;
	}
	return {
		...parts,
		start: { ...start, [field]: low },
		end: parts.end ? { ...end, [field]: high } : null,
	};
}

const sameSheet = (a: string | null, b: string | null) =>
	(a ?? "").toLowerCase() === (b ?? "").toLowerCase();

/**
 * A formula after rows or columns were inserted or deleted on sheet `target`,
 * for a formula that lives on sheet `own`. References past the change move
 * (absolute ones too, as in Excel), references into deleted cells become
 * `#REF!`, and a range shrinks or grows around the change.
 */
export function adjustFormula(
	text: string,
	change: LineChange,
	target: string | null,
	own: string | null,
): string {
	return rewriteRefs(text, (parts) =>
		sameSheet(parts.sheet ?? own, target) ? adjustParts(parts, change) : parts,
	);
}

/** A formula after sheet `from` was renamed `to`, or deleted when `to` is null. */
export function renameSheetRefs(
	text: string,
	from: string,
	to: string | null,
): string {
	return rewriteRefs(text, (parts) => {
		if (parts.sheet === null || !sameSheet(parts.sheet, from)) {
			return parts;
		}
		return to === null ? null : { ...parts, sheet: to };
	});
}

/**
 * Functions newer than Excel 2007, which a file must name with the `_xlfn.`
 * prefix or Excel answers `#NAME?`.
 */
const NEWER = new Set([
	"IFS",
	"SWITCH",
	"XLOOKUP",
	"MAXIFS",
	"MINIFS",
	"CONCAT",
	"TEXTJOIN",
	"STDEV.S",
	"STDEV.P",
	"VAR.S",
	"VAR.P",
	"DAYS",
	"IFNA",
	"RANK.EQ",
	"XOR",
]);

/**
 * Rewrites the function names (a name before `(`) and, when `refs` is given,
 * the reference tokens of a formula without its `=`. Text that does not
 * tokenise comes back as it was.
 */
function rewriteTokens(
	text: string,
	names: (name: string) => string,
	refs: (ref: string) => string = (ref) => ref,
): string {
	let tokens: Token[];
	try {
		tokens = tokenize(text);
	} catch {
		return text;
	}
	let out = "";
	let at = 0;
	tokens.forEach((token, i) => {
		let next: string;
		if (token.kind === "name" && tokens[i + 1]?.text === "(") {
			next = names(token.text);
		} else if (token.kind === "ref") {
			next = refs(token.text);
		} else {
			return;
		}
		out += text.slice(at, token.start) + next;
		at = token.start + token.text.length;
	});
	return out + text.slice(at);
}

/** `sum(a1:b2)` as a spreadsheet writes it back: `SUM(A1:B2)`. Sheet names keep their case. */
const upperRef = (ref: string) => {
	const bang = ref.lastIndexOf("!");
	return ref.slice(0, bang + 1) + ref.slice(bang + 1).toUpperCase();
};

/** A typed formula with its function names and references in capitals. */
export function normalizeFormula(text: string): string {
	if (!isFormula(text)) {
		return text;
	}
	return `=${rewriteTokens(text.slice(1), (name) => name.toUpperCase(), upperRef)}`;
}

/** A formula as an `.xlsx` stores it (no `=`): capitals, newer functions prefixed. */
export function toFileFormula(formula: string): string {
	return rewriteTokens(
		formula,
		(name) => {
			const upper = name.toUpperCase();
			return NEWER.has(upper) ? `_xlfn.${upper}` : upper;
		},
		upperRef,
	);
}

/** A formula as an `.xlsx` stores it, as it is typed: prefixes dropped. */
export function fromFileFormula(formula: string): string {
	return rewriteTokens(formula, (name) =>
		name.replace(/^(_xlfn\.|_xlws\.)+/i, ""),
	);
}
