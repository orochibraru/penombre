import {
	type Arg,
	compareValues,
	DIV0,
	FormulaError,
	matcher,
	NA,
	NUM,
	Range,
	REF,
	sameValue,
	toBool,
	toNumber,
	toText,
	VALUE,
	type Value,
} from "./values";

/**
 * Worksheet functions over evaluated arguments: numbers, statistics,
 * conditions, logic and lookups. Text and dates live in `functions-text.ts`;
 * the ones that must not evaluate every argument (IF and friends) are `LAZY`.
 */

/** Evaluated arguments; one left out between commas is undefined. */
export type Args = (Arg | undefined)[];

export type SheetFunction = (args: Args) => Value;

/** One argument as a single value; a one-cell range is its cell. */
export function scalar(arg: Arg | undefined): Value {
	if (arg === undefined) {
		throw VALUE;
	}
	if (arg instanceof Range) {
		const only =
			arg.height === 1 && arg.width === 1 ? arg.cells[0]?.[0] : undefined;
		if (only === undefined) {
			throw VALUE;
		}
		return only;
	}
	return arg;
}

export const num = (args: Args, index: number, fallback?: number): number =>
	args[index] === undefined && fallback !== undefined
		? fallback
		: toNumber(scalar(args[index]));

export const text = (args: Args, index: number): string =>
	toText(scalar(args[index]));

/** Every cell of one argument, row by row. */
export function cells(arg: Arg | undefined): Value[] {
	if (arg === undefined) {
		return [];
	}
	return arg instanceof Range ? arg.flat() : [arg];
}

/**
 * The numbers among the arguments. Like every spreadsheet: text, booleans
 * and blanks inside a reference are skipped, a value typed as an argument is
 * converted, and an error anywhere is the answer.
 */
export function numbers(args: Args): number[] {
	const out: number[] = [];
	for (const arg of args) {
		if (arg === undefined) {
			continue;
		}
		if (!(arg instanceof Range)) {
			out.push(toNumber(arg));
			continue;
		}
		for (const value of arg.flat()) {
			if (value instanceof FormulaError) {
				throw value;
			}
			if (typeof value === "number") {
				out.push(value);
			}
		}
	}
	return out;
}

const sum = (list: number[]) => list.reduce((total, n) => total + n, 0);

function mean(list: number[]): number {
	if (list.length === 0) {
		throw DIV0;
	}
	return sum(list) / list.length;
}

function variance(list: number[], sample: boolean): number {
	if (list.length < (sample ? 2 : 1)) {
		throw DIV0;
	}
	const avg = mean(list);
	return (
		sum(list.map((n) => (n - avg) ** 2)) / (list.length - (sample ? 1 : 0))
	);
}

/** Rounds `n` to `digits` places with `mode`, half away from zero. */
function round(n: number, digits: number, mode: (x: number) => number): number {
	const factor = 10 ** Math.trunc(digits);
	return (
		(mode(Number((Math.abs(n) * factor).toPrecision(15))) / factor) *
		Math.sign(n)
	);
}

const clean = (n: number) => Number(n.toPrecision(15));

/** `n` in `list` of k-th place, 1-based, largest first unless `ascending`. */
function nth(args: Args, ascending: boolean): number {
	const list = numbers([args[0] ?? ""]).sort((a, b) =>
		ascending ? a - b : b - a,
	);
	const k = Math.ceil(num(args, 1));
	const found = list[k - 1];
	if (k < 1 || found === undefined) {
		throw NUM;
	}
	return found;
}

/**
 * The positions where every `range, criterion` pair holds. Each range must
 * be the size of the first, as in Excel.
 */
function where(pairs: Args, size: number): number[] {
	if (pairs.length === 0 || pairs.length % 2 !== 0) {
		throw VALUE;
	}
	const tests: { values: Value[]; test: (value: Value) => boolean }[] = [];
	for (let i = 0; i < pairs.length; i += 2) {
		const values = cells(pairs[i]);
		if (values.length !== size) {
			throw VALUE;
		}
		tests.push({ values, test: matcher(scalar(pairs[i + 1])) });
	}
	const out: number[] = [];
	for (let i = 0; i < size; i++) {
		if (tests.every(({ values, test }) => test(values[i] ?? ""))) {
			out.push(i);
		}
	}
	return out;
}

/** The numbers of `range` at `positions`. */
function picked(range: Arg | undefined, positions: number[]): number[] {
	const values = cells(range);
	return positions
		.map((i) => values[i])
		.filter((value): value is number => typeof value === "number");
}

const conditional =
	(reduce: (list: number[]) => number): SheetFunction =>
	(args) => {
		const size = cells(args[0]).length;
		return reduce(picked(args[0], where(args.slice(1), size)));
	};

const extreme = (list: number[], pick: (a: number, b: number) => number) =>
	list.length === 0 ? 0 : list.reduce((a, b) => pick(a, b));

/** The legacy one-criterion forms: range, criterion, [values]. */
const legacy =
	(reduce: (list: number[]) => number): SheetFunction =>
	(args) => {
		const range = cells(args[0]);
		const values = args[2] === undefined ? range : cells(args[2]);
		const test = matcher(scalar(args[1]));
		const list: number[] = [];
		range.forEach((value, i) => {
			const target = values[i];
			if (test(value) && typeof target === "number") {
				list.push(target);
			}
		});
		return reduce(list);
	};

const MATHS: Record<string, SheetFunction> = {
	SUM: (a) => sum(numbers(a)),
	PRODUCT: (a) => numbers(a).reduce((p, n) => p * n, 1),
	AVERAGE: (a) => mean(numbers(a)),
	MIN: (a) => extreme(numbers(a), Math.min),
	MAX: (a) => extreme(numbers(a), Math.max),
	MEDIAN: (a) => {
		const list = numbers(a).sort((x, y) => x - y);
		if (list.length === 0) {
			throw NUM;
		}
		const mid = list.length >> 1;
		const at = (i: number) => list[i] ?? 0;
		return list.length % 2 ? at(mid) : (at(mid - 1) + at(mid)) / 2;
	},
	COUNT: (a) =>
		a.reduce<number>(
			(count, arg) =>
				count +
				cells(arg).filter((value) => {
					if (typeof value === "number") {
						return true;
					}
					if (arg instanceof Range || value instanceof FormulaError) {
						return false;
					}
					return typeof toNumberOrNull(value) === "number";
				}).length,
			0,
		),
	COUNTA: (a) => a.flatMap(cells).filter((v) => v !== "").length,
	COUNTBLANK: (a) => a.flatMap(cells).filter((v) => v === "").length,
	STDEV: (a) => Math.sqrt(variance(numbers(a), true)),
	"STDEV.S": (a) => Math.sqrt(variance(numbers(a), true)),
	"STDEV.P": (a) => Math.sqrt(variance(numbers(a), false)),
	VAR: (a) => variance(numbers(a), true),
	"VAR.S": (a) => variance(numbers(a), true),
	"VAR.P": (a) => variance(numbers(a), false),
	LARGE: (a) => nth(a, false),
	SMALL: (a) => nth(a, true),
	RANK: (a) => rank(a),
	"RANK.EQ": (a) => rank(a),
	SUMPRODUCT: (a) => {
		const lists = a.map(cells);
		const size = lists[0]?.length ?? 0;
		if (lists.some((list) => list.length !== size)) {
			throw VALUE;
		}
		let total = 0;
		for (let i = 0; i < size; i++) {
			total += lists.reduce((product, list) => {
				const value = list[i];
				if (value instanceof FormulaError) {
					throw value;
				}
				return product * (typeof value === "number" ? value : 0);
			}, 1);
		}
		return total;
	},
	COUNTIF: (a) => where(a.slice(0, 2), cells(a[0]).length).length,
	SUMIF: legacy(sum),
	AVERAGEIF: legacy(mean),
	COUNTIFS: (a) => where(a, cells(a[0]).length).length,
	SUMIFS: conditional(sum),
	AVERAGEIFS: conditional(mean),
	MAXIFS: conditional((list) => extreme(list, Math.max)),
	MINIFS: conditional((list) => extreme(list, Math.min)),
	ABS: (a) => Math.abs(num(a, 0)),
	SIGN: (a) => Math.sign(num(a, 0)),
	SQRT: (a) => {
		const n = num(a, 0);
		if (n < 0) {
			throw NUM;
		}
		return Math.sqrt(n);
	},
	POWER: (a) => num(a, 0) ** num(a, 1),
	EXP: (a) => Math.exp(num(a, 0)),
	LN: (a) => logarithm(num(a, 0), Math.E),
	LOG: (a) => logarithm(num(a, 0), num(a, 1, 10)),
	LOG10: (a) => logarithm(num(a, 0), 10),
	PI: () => Math.PI,
	MOD: (a) => {
		const d = num(a, 1);
		if (d === 0) {
			throw DIV0;
		}
		const n = num(a, 0);
		return clean(n - d * Math.floor(n / d));
	},
	INT: (a) => Math.floor(num(a, 0)),
	TRUNC: (a) => round(num(a, 0), num(a, 1, 0), Math.floor),
	ROUND: (a) => round(num(a, 0), num(a, 1, 0), Math.round),
	ROUNDUP: (a) => round(num(a, 0), num(a, 1, 0), Math.ceil),
	ROUNDDOWN: (a) => round(num(a, 0), num(a, 1, 0), Math.floor),
	CEILING: (a) => multiple(num(a, 0), num(a, 1, 1), Math.ceil),
	FLOOR: (a) => multiple(num(a, 0), num(a, 1, 1), Math.floor),
	RAND: () => Math.random(),
	RANDBETWEEN: (a) => {
		const low = Math.ceil(num(a, 0));
		const high = Math.floor(num(a, 1));
		if (high < low) {
			throw NUM;
		}
		return low + Math.floor(Math.random() * (high - low + 1));
	},
};

function toNumberOrNull(value: Value): number | null {
	try {
		return toNumber(value);
	} catch {
		return null;
	}
}

function logarithm(n: number, base: number): number {
	if (n <= 0 || base <= 0 || base === 1) {
		throw NUM;
	}
	return clean(Math.log(n) / Math.log(base));
}

/** CEILING and FLOOR: `n` to a multiple of `step`, Excel's signs. */
function multiple(
	n: number,
	step: number,
	mode: (x: number) => number,
): number {
	if (step === 0) {
		if (mode === Math.floor && n !== 0) {
			throw DIV0;
		}
		return 0;
	}
	if (n > 0 && step < 0) {
		throw NUM;
	}
	return clean(mode(clean(n / step)) * step);
}

/** RANK(number, range, [ascending]): 1 for the largest unless ascending. */
function rank(args: Args): number {
	const n = num(args, 0);
	const list = numbers([args[1] ?? ""]);
	if (!list.includes(n)) {
		throw NA;
	}
	const ascending = args[2] !== undefined && num(args, 2) !== 0;
	return 1 + list.filter((x) => (ascending ? x < n : x > n)).length;
}

/** AND/OR's inputs: text and blanks in a reference are skipped. */
function logicals(args: Args): boolean[] {
	const out: boolean[] = [];
	for (const arg of args) {
		for (const value of cells(arg)) {
			if (value instanceof FormulaError) {
				throw value;
			}
			if (!(arg instanceof Range) || typeof value !== "string") {
				out.push(toBool(value));
			}
		}
	}
	if (out.length === 0) {
		throw VALUE;
	}
	return out;
}

const INFO: Record<string, SheetFunction> = {
	AND: (a) => logicals(a).every(Boolean),
	OR: (a) => logicals(a).some(Boolean),
	XOR: (a) => logicals(a).filter(Boolean).length % 2 === 1,
	NOT: (a) => !toBool(scalar(a[0])),
	TRUE: () => true,
	FALSE: () => false,
	NA: () => {
		throw NA;
	},
	ISBLANK: (a) => a[0] instanceof Range && scalar(a[0]) === "",
	ISNUMBER: (a) => typeof scalar(a[0]) === "number",
	ISTEXT: (a) => {
		const value = scalar(a[0]);
		return (
			typeof value === "string" && !(a[0] instanceof Range && value === "")
		);
	},
	ISLOGICAL: (a) => typeof scalar(a[0]) === "boolean",
	ISERROR: (a) => scalar(a[0]) instanceof FormulaError,
	ISERR: (a) => {
		const value = scalar(a[0]);
		return value instanceof FormulaError && value !== NA;
	},
	ISNA: (a) => scalar(a[0]) === NA,
};

/** Functions that answer about an error rather than passing it on. */
export const TOLERANT = new Set([
	"ISBLANK",
	"ISNUMBER",
	"ISTEXT",
	"ISLOGICAL",
	"ISERROR",
	"ISERR",
	"ISNA",
]);

// =========================================================================
// Lookups
// =========================================================================

/**
 * The position of `needle` in `list`: `0` exact (wildcards on text), `1` the
 * last value not above it in an ascending list, `-1` the last not below it in
 * a descending one. -1 when nothing matches.
 */
export function position(list: Value[], needle: Value, mode: number): number {
	if (mode === 0) {
		return list.findIndex((value) => sameValue(value, needle));
	}
	let found = -1;
	for (let i = 0; i < list.length; i++) {
		const value = list[i] ?? "";
		if (value === "" || value instanceof FormulaError) {
			continue;
		}
		if (typeof value !== typeof needle) {
			continue;
		}
		const order = compareValues(value, needle) * (mode > 0 ? 1 : -1);
		if (order > 0) {
			break;
		}
		found = i;
		if (order === 0 && mode < 0) {
			break;
		}
	}
	return found;
}

/**
 * XLOOKUP's matching: exact (0), exact or next smaller (-1), exact or next
 * larger (1), wildcard (2); searching from the end when `reverse`. The list
 * need not be sorted.
 */
function closest(
	list: Value[],
	needle: Value,
	mode: number,
	reverse: boolean,
): number {
	const order = reverse
		? list.map((_, i) => list.length - 1 - i)
		: list.map((_, i) => i);
	const exact = order.find((i) =>
		mode === 2
			? sameValue(list[i] ?? "", needle)
			: typeof list[i] === typeof needle &&
				compareValues(list[i] ?? "", needle) === 0,
	);
	if (exact !== undefined || mode === 0 || mode === 2) {
		return exact ?? -1;
	}
	let best = -1;
	for (const i of order) {
		const value = list[i] ?? "";
		if (typeof value !== typeof needle || value === "") {
			continue;
		}
		const side = compareValues(value, needle);
		if (side !== mode) {
			continue;
		}
		const nearer = best < 0 || compareValues(value, list[best] ?? "") === -mode;
		if (nearer) {
			best = i;
		}
	}
	return best;
}

function table(arg: Arg | undefined): Range {
	if (arg instanceof Range) {
		return arg;
	}
	if (arg === undefined) {
		throw VALUE;
	}
	return new Range([[arg]]);
}

/** A one-row or one-column range as a list; anything wider is refused. */
function vector(arg: Arg | undefined): Value[] {
	const range = table(arg);
	if (range.height > 1 && range.width > 1) {
		throw NA;
	}
	return range.flat();
}

function found(index: number): number {
	if (index < 0) {
		throw NA;
	}
	return index;
}

const LOOKUP: Record<string, SheetFunction> = {
	VLOOKUP: (a) => {
		const range = table(a[1]);
		const column = Math.trunc(num(a, 2));
		if (column < 1) {
			throw VALUE;
		}
		if (column > range.width) {
			throw REF;
		}
		const exact = a[3] !== undefined && !toBool(scalar(a[3]));
		const keys = range.cells.map((row) => row[0] ?? "");
		const row = found(position(keys, scalar(a[0]), exact ? 0 : 1));
		return range.cells[row]?.[column - 1] ?? "";
	},
	HLOOKUP: (a) => {
		const range = table(a[1]);
		const line = Math.trunc(num(a, 2));
		if (line < 1) {
			throw VALUE;
		}
		if (line > range.height) {
			throw REF;
		}
		const exact = a[3] !== undefined && !toBool(scalar(a[3]));
		const keys = range.cells[0] ?? [];
		const col = found(position(keys, scalar(a[0]), exact ? 0 : 1));
		return range.cells[line - 1]?.[col] ?? "";
	},
	MATCH: (a) => {
		const mode = Math.sign(num(a, 2, 1));
		return found(position(vector(a[1]), scalar(a[0]), mode)) + 1;
	},
	INDEX: (a) => {
		const range = table(a[0]);
		let row = Math.trunc(num(a, 1));
		let col = Math.trunc(num(a, 2, 1));
		if (a[2] === undefined && range.height === 1) {
			[row, col] = [1, row];
		}
		row = row === 0 && range.height === 1 ? 1 : row;
		col = col === 0 && range.width === 1 ? 1 : col;
		const value = range.cells[row - 1]?.[col - 1];
		if (row < 1 || col < 1 || value === undefined) {
			throw REF;
		}
		return value;
	},
	XLOOKUP: (a) => {
		const keys = vector(a[1]);
		const results = table(a[2]);
		const at = closest(
			keys,
			scalar(a[0]),
			Math.trunc(num(a, 4, 0)),
			num(a, 5, 1) < 0,
		);
		if (at < 0) {
			if (a[3] === undefined) {
				throw NA;
			}
			return scalar(a[3]);
		}
		if (results.height === keys.length) {
			return results.cells[at]?.[0] ?? "";
		}
		if (results.width === keys.length) {
			return results.cells[0]?.[at] ?? "";
		}
		throw VALUE;
	},
};

export const FUNCTIONS: Record<string, SheetFunction> = {
	...MATHS,
	...INFO,
	...LOOKUP,
};

// =========================================================================
// Lazy: only the argument that decides the answer is evaluated
// =========================================================================

/** An argument not yet evaluated; an error comes back as a value. */
export type Thunk = () => Value;

function force(thunk: Thunk | undefined): Value {
	if (!thunk) {
		throw VALUE;
	}
	const value = thunk();
	if (value instanceof FormulaError) {
		throw value;
	}
	return value;
}

export const LAZY: Record<string, (args: Thunk[]) => Value> = {
	IF: ([test, then, otherwise]) => {
		if (toBool(force(test))) {
			return then ? then() : true;
		}
		return otherwise ? otherwise() : false;
	},
	IFS: (args) => {
		for (let i = 0; i + 1 < args.length; i += 2) {
			if (toBool(force(args[i]))) {
				return args[i + 1]?.() ?? "";
			}
		}
		throw NA;
	},
	SWITCH: ([subject, ...cases]) => {
		const value = force(subject);
		for (let i = 0; i + 1 < cases.length; i += 2) {
			if (sameValue(value, force(cases[i]))) {
				return cases[i + 1]?.() ?? "";
			}
		}
		if (cases.length % 2 === 1) {
			return cases.at(-1)?.() ?? "";
		}
		throw NA;
	},
	CHOOSE: ([index, ...choices]) => {
		const pick = choices[Math.trunc(toNumber(force(index))) - 1];
		if (!pick) {
			throw VALUE;
		}
		return pick();
	},
	IFERROR: ([value, fallback]) => {
		const result = value ? value() : "";
		return result instanceof FormulaError ? force(fallback) : result;
	},
	IFNA: ([value, fallback]) => {
		const result = value ? value() : "";
		return result === NA ? force(fallback) : result;
	},
};
