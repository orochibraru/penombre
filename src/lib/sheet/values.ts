/**
 * What a formula computes, and the coercions between kinds of value.
 *
 * The rules are Excel's, because a sheet written here is read by Excel,
 * LibreOffice and Google Sheets, and a formula has to mean the same thing in
 * all of them.
 */

export class FormulaError {
	constructor(readonly code: string) {}
	toString(): string {
		return this.code;
	}
}

export const DIV0 = new FormulaError("#DIV/0!");
export const VALUE = new FormulaError("#VALUE!");
export const REF = new FormulaError("#REF!");
export const NAME = new FormulaError("#NAME?");
export const NA = new FormulaError("#N/A");
export const NUM = new FormulaError("#NUM!");
export const NULL = new FormulaError("#NULL!");
export const CYCLE = new FormulaError("#CYCLE!");
export const PARSE = new FormulaError("#ERROR!");

const ERRORS = new Map(
	[DIV0, VALUE, REF, NAME, NA, NUM, NULL].map((error) => [error.code, error]),
);

/** The error a code such as `#N/A` names, typed into a cell or a formula. */
export function errorFromCode(code: string): FormulaError | undefined {
	return ERRORS.get(code.toUpperCase());
}

export type Value = number | string | boolean | FormulaError;

/** A reference or range handed to a function: its cells, row by row. */
export class Range {
	constructor(readonly cells: Value[][]) {}
	get height(): number {
		return this.cells.length;
	}
	get width(): number {
		return this.cells[0]?.length ?? 0;
	}
	flat(): Value[] {
		return this.cells.flat();
	}
}

/** A function argument: a value, or the cells of a reference. */
export type Arg = Value | Range;

// =========================================================================
// Dates: serial numbers from Excel's 1899-12-30 epoch, as xlsx.ts reads them
// =========================================================================

const EPOCH = Date.UTC(1899, 11, 30);
export const DAY_MS = 86_400_000;

export function serialFromUtc(ms: number): number {
	return (ms - EPOCH) / DAY_MS;
}

export function utcFromSerial(serial: number): Date {
	return new Date(EPOCH + Math.round(serial * DAY_MS));
}

const ISO_DATE =
	/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/;

/** `2026-03-14` or `2026-03-14 12:00` as a serial, or null. */
export function serialFromIso(text: string): number | null {
	const match = ISO_DATE.exec(text.trim());
	if (!match) {
		return null;
	}
	const [year, month, day, hour, minute, second] = match
		.slice(1)
		.map((part) => Number(part ?? 0));
	return serialFromUtc(
		Date.UTC(
			year ?? 0,
			(month ?? 1) - 1,
			day ?? 1,
			hour ?? 0,
			minute ?? 0,
			second ?? 0,
		),
	);
}

/** A serial as `2026-03-14`, with the time when asked. */
export function isoFromSerial(serial: number, withTime = false): string {
	const iso = utcFromSerial(serial).toISOString();
	return withTime ? iso.slice(0, 19).replace("T", " ") : iso.slice(0, 10);
}

/** Whether a cell's text is a date (`date`) or a date and time. */
export function dateKind(text: string): "date" | "datetime" | null {
	const match = ISO_DATE.exec(text.trim());
	if (!match) {
		return null;
	}
	return match[4] === undefined ? "date" : "datetime";
}

// =========================================================================
// Coercion
// =========================================================================

const NUMERIC = /^\s*[-+]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?\s*$/;
const PERCENT = /^\s*([-+]?(?:\d+\.?\d*|\.\d+))\s*%\s*$/;

/**
 * A cell's typed text as a value: numbers (and percentages, and ISO dates as
 * serials) are numbers, `TRUE`/`FALSE` are booleans, `#N/A` is the error.
 */
export function literal(raw: string): Value {
	if (NUMERIC.test(raw)) {
		return Number(raw);
	}
	const trimmed = raw.trim();
	const upper = trimmed.toUpperCase();
	if (upper === "TRUE" || upper === "FALSE") {
		return upper === "TRUE";
	}
	const error = errorFromCode(upper);
	if (error) {
		return error;
	}
	const percent = PERCENT.exec(trimmed);
	if (percent) {
		return Number(percent[1]) / 100;
	}
	return serialFromIso(trimmed) ?? raw;
}

export function toNumber(value: Value): number {
	if (typeof value === "number") {
		return value;
	}
	if (typeof value === "boolean") {
		return value ? 1 : 0;
	}
	if (value instanceof FormulaError) {
		throw value;
	}
	if (value.trim() === "") {
		return 0;
	}
	const coerced = literal(value);
	if (typeof coerced === "number") {
		return coerced;
	}
	throw VALUE;
}

export function formatNumber(n: number): string {
	if (!Number.isFinite(n)) {
		return NUM.code;
	}
	return Number.isInteger(n) ? String(n) : String(Number(n.toPrecision(12)));
}

export function toText(value: Value): string {
	if (value instanceof FormulaError) {
		throw value;
	}
	if (typeof value === "boolean") {
		return value ? "TRUE" : "FALSE";
	}
	if (typeof value === "number") {
		return formatNumber(value);
	}
	return value;
}

export function toBool(value: Value): boolean {
	if (typeof value === "string") {
		const upper = value.trim().toUpperCase();
		if (upper === "TRUE" || upper === "FALSE") {
			return upper === "TRUE";
		}
		if (upper === "") {
			return false;
		}
		throw VALUE;
	}
	return toNumber(value) !== 0;
}

/** A value as the grid shows it. */
export function display(value: Value): string {
	if (typeof value === "number") {
		return formatNumber(value);
	}
	if (typeof value === "boolean") {
		return value ? "TRUE" : "FALSE";
	}
	return String(value);
}

// =========================================================================
// Comparison
// =========================================================================

/** Excel orders numbers before text before booleans, text without case. */
const rank = (value: Value): number => {
	if (typeof value === "number") {
		return 0;
	}
	return typeof value === "string" ? 1 : 2;
};

/** -1, 0 or 1. A blank compares as 0 with a number and FALSE with a boolean. */
export function compareValues(left: Value, right: Value): number {
	if (left instanceof FormulaError) {
		throw left;
	}
	if (right instanceof FormulaError) {
		throw right;
	}
	const blankAs = (other: Value) => (typeof other === "number" ? 0 : false);
	const a = left === "" && typeof right !== "string" ? blankAs(right) : left;
	const b = right === "" && typeof left !== "string" ? blankAs(left) : right;
	if (rank(a) !== rank(b)) {
		return Math.sign(rank(a) - rank(b));
	}
	if (typeof a === "string" && typeof b === "string") {
		const x = a.toLowerCase();
		const y = b.toLowerCase();
		if (x === y) {
			return 0;
		}
		return x < y ? -1 : 1;
	}
	return Math.sign(Number(a) - Number(b));
}

/** `*`, `?` and `~` as in a COUNTIF criterion, to a whole-text pattern. */
export function wildcard(pattern: string): RegExp {
	let source = "";
	for (let i = 0; i < pattern.length; i++) {
		const char = pattern[i] ?? "";
		if (char === "~" && i + 1 < pattern.length) {
			i++;
			source += (pattern[i] ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		} else if (char === "*") {
			source += "[\\s\\S]*";
		} else if (char === "?") {
			source += "[\\s\\S]";
		} else {
			source += char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		}
	}
	return new RegExp(`^${source}$`, "i");
}

const hasWildcard = (text: string) => /[*?~]/.test(text);

/** Whether `value` equals `needle` the way a lookup compares, wildcards too. */
export function sameValue(value: Value, needle: Value): boolean {
	if (value instanceof FormulaError || needle instanceof FormulaError) {
		return false;
	}
	if (typeof needle === "string" && hasWildcard(needle)) {
		return typeof value === "string" && wildcard(needle).test(value);
	}
	return rank(value) === rank(needle) && compareValues(value, needle) === 0;
}

const OPERATORS: Record<string, (order: number) => boolean> = {
	"=": (order) => order === 0,
	"<>": (order) => order !== 0,
	"<": (order) => order < 0,
	">": (order) => order > 0,
	"<=": (order) => order <= 0,
	">=": (order) => order >= 0,
};

/** A COUNTIF-style criterion — `">5"`, `"<>x"`, `"a*"`, `5` — as a test. */
export function matcher(criterion: Value): (value: Value) => boolean {
	if (criterion instanceof FormulaError) {
		throw criterion;
	}
	if (typeof criterion !== "string") {
		return (value) => sameValue(value, criterion);
	}
	const [, op = "=", rest = ""] =
		/^(<>|<=|>=|=|<|>)?([\s\S]*)$/.exec(criterion) ?? [];
	const holds = OPERATORS[op];
	if (!holds) {
		throw VALUE;
	}
	if (rest === "") {
		return (value) => (op === "<>" ? value !== "" : value === "");
	}
	const target = literal(rest);
	if (typeof target === "string" && (op === "=" || op === "<>")) {
		const pattern = wildcard(rest);
		return (value) =>
			!(value instanceof FormulaError) &&
			pattern.test(toText(value)) === (op === "=");
	}
	return (value) => {
		if (value instanceof FormulaError || value === "") {
			return op === "<>";
		}
		if (rank(value) !== rank(target)) {
			return op === "<>";
		}
		return holds(compareValues(value, target));
	};
}
