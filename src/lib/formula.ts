/**
 * Spreadsheet formulas over grids of raw cell text.
 *
 * A cell starting with `=` is a formula; everything else is a value. The
 * formula text is what the file stores (Excel, LibreOffice and Google Sheets
 * all evaluate `=…` in a CSV they open), so this only ever computes what is
 * shown, never what is saved. Functions live in `#lib/sheet/functions*.ts`,
 * value coercion in `#lib/sheet/values.ts`, the tokenizer and the reference
 * rewrites (copy, insert, delete, rename) in `#lib/sheet/references.ts`.
 */

import { FUNCTIONS, LAZY, type Thunk, TOLERANT } from "./sheet/functions";
import { TEXT_FUNCTIONS } from "./sheet/functions-text";
import {
	isFormula,
	MAX_COL,
	MAX_ROW,
	parseParts,
	type Token,
	tokenize,
} from "./sheet/references";
import {
	type Arg,
	CYCLE,
	compareValues,
	DIV0,
	dateKind,
	display,
	errorFromCode,
	FormulaError,
	isoFromSerial,
	literal,
	NAME,
	NUM,
	PARSE,
	Range,
	REF,
	toNumber,
	toText,
	VALUE,
	type Value,
} from "./sheet/values";

export {
	adjustFormula,
	columnName,
	fromFileFormula,
	isFormula,
	type LineChange,
	MAX_COL,
	MAX_ROW,
	normalizeFormula,
	parseRef,
	quoteSheet,
	renameSheetRefs,
	shiftFormula,
	toFileFormula,
} from "./sheet/references";
export {
	display,
	FormulaError,
	formatNumber,
	type Value,
} from "./sheet/values";

type Node =
	| { t: "num"; v: number }
	| { t: "str"; v: string }
	| { t: "bool"; v: boolean }
	| { t: "err"; v: FormulaError }
	/** An argument left out between commas: `IF(A1,,1)`. */
	| { t: "empty" }
	| { t: "ref"; sheet?: string; row: number; col: number }
	| {
			t: "range";
			sheet?: string;
			r1: number;
			c1: number;
			r2: number;
			c2: number;
	  }
	| { t: "un"; op: string; a: Node }
	| { t: "bin"; op: string; a: Node; b: Node }
	| { t: "pct"; a: Node }
	| { t: "call"; name: string; args: Node[] };

function refNode(text: string): Node {
	const { sheet, start, end } = parseParts(text);
	const on = sheet === null ? {} : { sheet };
	if (!end) {
		return { t: "ref", ...on, row: start.row ?? 0, col: start.col ?? 0 };
	}
	const r1 = start.row ?? 0;
	const r2 = end.row ?? MAX_ROW;
	const c1 = start.col ?? 0;
	const c2 = end.col ?? MAX_COL;
	return {
		t: "range",
		...on,
		r1: Math.min(r1, r2),
		c1: Math.min(c1, c2),
		r2: Math.max(r1, r2),
		c2: Math.max(c1, c2),
	};
}

// =========================================================================
// Parsing
// =========================================================================

class Parser {
	private at = 0;
	constructor(private readonly tokens: Token[]) {}

	parse(): Node {
		const node = this.comparison();
		if (this.at < this.tokens.length) {
			throw PARSE;
		}
		return node;
	}

	private peek(): Token | undefined {
		return this.tokens[this.at];
	}

	private op(...ops: string[]): string | null {
		const token = this.peek();
		if (token?.kind === "op" && ops.includes(token.text)) {
			this.at++;
			return token.text;
		}
		return null;
	}

	private binary(next: () => Node, ...ops: string[]): Node {
		let node = next();
		for (let op = this.op(...ops); op; op = this.op(...ops)) {
			node = { t: "bin", op, a: node, b: next() };
		}
		return node;
	}

	private comparison = (): Node =>
		this.binary(this.concat, "=", "<>", "<", ">", "<=", ">=");
	private concat = (): Node => this.binary(this.additive, "&");
	private additive = (): Node => this.binary(this.term, "+", "-");
	private term = (): Node => this.binary(this.power, "*", "/");
	// Excel's order, not maths': negation binds tighter than `^` (`-2^2` is
	// 4), and `^` is left-associative.
	private power = (): Node => this.binary(this.unary, "^");

	private unary = (): Node => {
		const op = this.op("-", "+");
		return op ? { t: "un", op, a: this.unary() } : this.postfix();
	};

	private postfix = (): Node => {
		let node = this.primary();
		while (this.op("%")) {
			node = { t: "pct", a: node };
		}
		return node;
	};

	/** An argument; an empty one (`IF(A1,,1)`) is a blank. */
	private argument(): Node {
		const next = this.peek();
		if (next?.kind === "op" && [",", ";", ")"].includes(next.text)) {
			return { t: "empty" };
		}
		return this.comparison();
	}

	private call(name: string): Node {
		const args: Node[] = [];
		if (!this.op(")")) {
			do {
				args.push(this.argument());
			} while (this.op(",", ";"));
			if (!this.op(")")) {
				throw PARSE;
			}
		}
		return { t: "call", name, args };
	}

	private primary(): Node {
		const token = this.tokens[this.at++];
		if (!token) {
			throw PARSE;
		}
		switch (token.kind) {
			case "num":
				return { t: "num", v: Number(token.text) };
			case "str":
				return { t: "str", v: token.text.slice(1, -1).replace(/""/g, '"') };
			case "err":
				return { t: "err", v: errorFromCode(token.text) ?? PARSE };
			case "ref":
				return refNode(token.text);
			case "name": {
				const name = token.text
					.toUpperCase()
					.replace(/^(_XLFN\.|_XLWS\.)+/, "");
				if (this.op("(")) {
					return this.call(name);
				}
				if (name === "TRUE" || name === "FALSE") {
					return { t: "bool", v: name === "TRUE" };
				}
				throw NAME;
			}
			default:
				if (token.text === "(") {
					const node = this.comparison();
					if (!this.op(")")) {
						throw PARSE;
					}
					return node;
				}
				throw PARSE;
		}
	}
}

const parsed = new Map<string, Node | FormulaError>();

function parse(formula: string): Node | FormulaError {
	let node = parsed.get(formula);
	if (!node) {
		try {
			node = new Parser(tokenize(formula)).parse();
		} catch (error) {
			node = error instanceof FormulaError ? error : PARSE;
		}
		// ponytail: unbounded, but keyed by distinct formula text, which a
		// sheet has few of; clear it if a workload ever proves otherwise.
		parsed.set(formula, node);
	}
	return node;
}

function operate(op: string, a: Value, b: Value): Value {
	switch (op) {
		case "&":
			return toText(a) + toText(b);
		case "+":
			return toNumber(a) + toNumber(b);
		case "-":
			return toNumber(a) - toNumber(b);
		case "*":
			return toNumber(a) * toNumber(b);
		case "/": {
			const d = toNumber(b);
			if (d === 0) {
				throw DIV0;
			}
			return toNumber(a) / d;
		}
		case "^":
			return toNumber(a) ** toNumber(b);
		default: {
			const order = compareValues(a, b);
			const holds: Record<string, boolean> = {
				"=": order === 0,
				"<>": order !== 0,
				"<": order < 0,
				">": order > 0,
				"<=": order <= 0,
				">=": order >= 0,
			};
			return holds[op] ?? false;
		}
	}
}

const EAGER = { ...FUNCTIONS, ...TEXT_FUNCTIONS };

/** Every function a formula may call, lazy ones included. */
export const FUNCTION_NAMES: readonly string[] = [
	...Object.keys(EAGER),
	...Object.keys(LAZY),
].sort();

// =========================================================================
// Evaluation
// =========================================================================

/** One sheet as the engine reads it. */
export interface SheetSource {
	name: string;
	rows: string[][];
	/**
	 * What a file recorded for its formulas, `"row:col"` → [formula, value]:
	 * shown when a formula uses something this engine lacks (an unknown
	 * function, a defined name) and the formula is still the one recorded.
	 */
	cached?: Record<string, [string, string]>;
}

export type Kind = "date" | "datetime" | null;

export interface Workbook {
	/** A cell's computed value; its own text as a value when not a formula. */
	value(sheet: number, row: number, col: number): Value;
	/** Whether a cell's number is a date, so the grid can show it as one. */
	kind(sheet: number, row: number, col: number): Kind;
	/** What the grid shows for a cell. */
	shown(sheet: number, row: number, col: number): string;
}

/**
 * Evaluates lazily and remembers each cell until the workbook is rebuilt, so
 * only what is on screen (and what that depends on) is ever computed. Build
 * a new one after any edit.
 */
export function createWorkbook(sheets: SheetSource[]): Workbook {
	return new Evaluator(sheets);
}

/** One sheet on its own: `value(row, col)`. */
export function createSheet(rows: string[][]): {
	value(row: number, col: number): Value;
} {
	const book = new Evaluator([{ name: "Sheet1", rows }]);
	return { value: (row, col) => book.value(0, row, col) };
}

const DATE_FUNCTIONS = new Set(["DATE", "TODAY", "EDATE", "EOMONTH"]);
const PASS_KIND = new Set([
	"IF",
	"IFS",
	"IFERROR",
	"IFNA",
	"CHOOSE",
	"SWITCH",
	"MIN",
	"MAX",
	"MINIFS",
	"MAXIFS",
	"LARGE",
	"SMALL",
	"MEDIAN",
]);

// Rows up to 2^20 and columns up to 2^14 like Excel; the key only has to be
// unique.
const key = (sheet: number, row: number, col: number) =>
	(sheet * 16_384 + col) * 1_048_576 + row;

class Evaluator implements Workbook {
	private readonly cache = new Map<number, Value>();
	private readonly kinds = new Map<number, Kind>();
	private readonly visiting = new Set<number>();
	private readonly widths: number[] = [];
	/** The sheet of the formula being evaluated, for unqualified refs. */
	private current = 0;

	constructor(private readonly sheets: SheetSource[]) {}

	private raw(sheet: number, row: number, col: number): string {
		return this.sheets[sheet]?.rows[row]?.[col] ?? "";
	}

	/** The sheet a reference names; a name no sheet has is `#REF!`. */
	private sheetOf(name: string | undefined): number {
		const index = this.sheetFor(name, this.current);
		if (index < 0) {
			throw REF;
		}
		return index;
	}

	value = (sheet: number, row: number, col: number): Value => {
		if (row < 0 || col < 0 || !this.sheets[sheet]) {
			return REF;
		}
		const k = key(sheet, row, col);
		const hit = this.cache.get(k);
		if (hit !== undefined) {
			return hit;
		}
		if (this.visiting.has(k)) {
			return CYCLE;
		}
		const text = this.raw(sheet, row, col);
		let result: Value;
		if (isFormula(text)) {
			this.visiting.add(k);
			const outer = this.current;
			this.current = sheet;
			try {
				result = this.evaluate(text.slice(1));
			} finally {
				this.visiting.delete(k);
				this.current = outer;
			}
			const recorded = this.sheets[sheet]?.cached?.[`${row}:${col}`];
			if ((result === NAME || result === PARSE) && recorded?.[0] === text) {
				result = literal(recorded[1]);
			}
		} else {
			result = literal(text);
		}
		this.cache.set(k, result);
		return result;
	};

	kind = (sheet: number, row: number, col: number): Kind => {
		const text = this.raw(sheet, row, col);
		if (!isFormula(text)) {
			return dateKind(text);
		}
		const k = key(sheet, row, col);
		if (this.kinds.has(k)) {
			return this.kinds.get(k) ?? null;
		}
		// Seeded first, so a formula that refers to itself ends here.
		this.kinds.set(k, null);
		const node = parse(text.slice(1));
		const kind = node instanceof FormulaError ? null : this.infer(node, sheet);
		this.kinds.set(k, kind);
		return kind;
	};

	shown = (sheet: number, row: number, col: number): string => {
		const text = this.raw(sheet, row, col);
		if (!isFormula(text)) {
			return text;
		}
		const value = this.value(sheet, row, col);
		if (typeof value === "number") {
			const kind = this.kind(sheet, row, col);
			if (kind && Number.isFinite(value)) {
				return isoFromSerial(value, kind === "datetime");
			}
		}
		return display(value);
	};

	/**
	 * Whether a formula's number is a date: the date functions, a date plus
	 * or minus days, and what picks one of its arguments (IF, MIN, …).
	 */
	private infer(node: Node, sheet: number): Kind {
		switch (node.t) {
			case "ref":
				return this.kind(this.sheetFor(node.sheet, sheet), node.row, node.col);
			case "range":
				return this.kind(this.sheetFor(node.sheet, sheet), node.r1, node.c1);
			case "call":
				if (node.name === "NOW") {
					return "datetime";
				}
				if (DATE_FUNCTIONS.has(node.name)) {
					return "date";
				}
				if (!PASS_KIND.has(node.name)) {
					return null;
				}
				return (
					node.args
						.slice(node.name === "IF" || node.name === "IFS" ? 1 : 0)
						.map((arg) => this.infer(arg, sheet))
						.find((kind) => kind !== null) ?? null
				);
			case "bin": {
				const a = this.infer(node.a, sheet);
				const b = this.infer(node.b, sheet);
				if (node.op === "+") {
					return a && !b ? a : !a && b ? b : null;
				}
				return node.op === "-" && a && !b ? a : null;
			}
			default:
				return null;
		}
	}

	/** The sheet a reference names, or -1 (a blank sheet) when none has it. */
	private sheetFor(name: string | undefined, sheet: number): number {
		if (name === undefined) {
			return sheet;
		}
		const lower = name.toLowerCase();
		return this.sheets.findIndex((s) => s.name.toLowerCase() === lower);
	}

	private evaluate(formula: string): Value {
		const node = parse(formula);
		if (node instanceof FormulaError) {
			return node;
		}
		try {
			const result = this.scalar(node);
			return result === "" && node.t === "ref" ? 0 : result;
		} catch (error) {
			if (error instanceof FormulaError) {
				return error;
			}
			throw error;
		}
	}

	private width(sheet: number): number {
		let width = this.widths[sheet];
		if (width === undefined) {
			width = (this.sheets[sheet]?.rows ?? []).reduce(
				(widest, row) => Math.max(widest, row.length),
				0,
			);
			this.widths[sheet] = width;
		}
		return width;
	}

	private range(node: Extract<Node, { t: "range" }>): Range {
		const sheet = this.sheetOf(node.sheet);
		// A whole column or row stops at the end of the data.
		const r2 =
			node.r2 === MAX_ROW
				? Math.min(node.r2, (this.sheets[sheet]?.rows.length ?? 0) - 1)
				: node.r2;
		const c2 =
			node.c2 === MAX_COL ? Math.min(node.c2, this.width(sheet) - 1) : node.c2;
		const cells: Value[][] = [];
		for (let r = node.r1; r <= r2; r++) {
			const line: Value[] = [];
			for (let c = node.c1; c <= c2; c++) {
				line.push(this.raw(sheet, r, c) === "" ? "" : this.value(sheet, r, c));
			}
			cells.push(line);
		}
		return new Range(cells);
	}

	/** A value, or the error it raised; a thunk never throws one. */
	private guarded(node: Node): Value {
		try {
			return this.scalar(node);
		} catch (error) {
			if (error instanceof FormulaError) {
				return error;
			}
			throw error;
		}
	}

	/** References stay references, so SUM can skip their text and ISBLANK see a blank. */
	private argument(node: Node): Arg | undefined {
		if (node.t === "empty") {
			return undefined;
		}
		if (node.t === "range") {
			return this.range(node);
		}
		if (node.t === "ref") {
			try {
				return new Range([[this.scalar(node)]]);
			} catch (error) {
				if (error instanceof FormulaError) {
					return error;
				}
				throw error;
			}
		}
		return this.guarded(node);
	}

	private call(node: Extract<Node, { t: "call" }>): Value {
		const lazy = LAZY[node.name];
		if (lazy) {
			// Left out between commas, a value is 0: `IF(A1,,1)`.
			const thunks: Thunk[] = node.args.map((arg) =>
				arg.t === "empty" ? () => 0 : () => this.guarded(arg),
			);
			return lazy(thunks);
		}
		const fn = EAGER[node.name];
		if (!fn) {
			throw NAME;
		}
		const args = node.args.map((arg) => this.argument(arg));
		if (!TOLERANT.has(node.name)) {
			for (const arg of args) {
				if (arg instanceof FormulaError) {
					throw arg;
				}
			}
		}
		const result = fn(args);
		if (typeof result === "number" && !Number.isFinite(result)) {
			throw NUM;
		}
		return result;
	}

	private scalar(node: Node): Value {
		switch (node.t) {
			case "num":
			case "str":
			case "bool":
				return node.v;
			case "err":
				throw node.v;
			case "empty":
				return "";
			case "ref":
				return this.value(this.sheetOf(node.sheet), node.row, node.col);
			case "range":
				throw VALUE;
			case "pct":
				return toNumber(this.scalar(node.a)) / 100;
			case "un": {
				const n = toNumber(this.scalar(node.a));
				return node.op === "-" ? -n : n;
			}
			case "call":
				return this.call(node);
			case "bin":
				return operate(node.op, this.scalar(node.a), this.scalar(node.b));
		}
	}
}
