import { inRects, parseSqref } from "./dropdowns";
import { shiftFormula } from "./references";
import type { Rect } from "./selection";
import { type CellStyle, lookOf } from "./styles";
import {
	compareValues,
	FormulaError,
	toBool,
	toText,
	type Value,
} from "./values";

/**
 * Conditional formatting, the part of it the grid draws: Excel's `cfRule`s
 * comparing a cell (`cellIs`), matching its text, testing for blanks or
 * errors, a formula, and two- or three-colour scales. Rules are applied in
 * priority order (1 first); a property set by a rule is kept against the
 * rules after it, and `stopIfTrue` ends the run. Everything else a file
 * holds is kept by the save without being drawn.
 */

export type RuleStyle = Pick<
	CellStyle,
	"bold" | "italic" | "underline" | "strike" | "color" | "fill" | "borders"
>;

export interface ScalePoint {
	type: string;
	value?: string;
}

export interface ConditionalRule {
	type: string;
	operator?: string;
	/** Formulas as typed, without `=`, relative to the range's first cell. */
	formulas?: string[];
	text?: string;
	style?: RuleStyle;
	priority: number;
	stopIfTrue?: true;
	scale?: { points: ScalePoint[]; colors: string[] };
}

export interface ConditionalFormat {
	/** Excel's `sqref`. */
	range: string;
	rules: ConditionalRule[];
}

/** The rule types the grid draws. */
export const DRAWN_RULES = new Set([
	"cellIs",
	"containsText",
	"notContainsText",
	"beginsWith",
	"endsWith",
	"containsBlanks",
	"notContainsBlanks",
	"containsErrors",
	"notContainsErrors",
	"expression",
	"colorScale",
]);

/** What a rule needs from the sheet it is on. */
export interface RuleSheet {
	value(row: number, col: number): Value;
	/** A formula without `=`, evaluated on this sheet. */
	compute(formula: string): Value;
	/** The extent of the data, which bounds whole-column ranges. */
	rows: number;
	cols: number;
}

interface Placed {
	rule: ConditionalRule;
	rects: Rect[];
	/** The cell its formulas are written for: the range's first. */
	origin: { row: number; col: number };
}

const isError = (value: Value) => value instanceof FormulaError;

function compare(operator: string, value: Value, bounds: Value[]): boolean {
	const [a, b] = bounds;
	if (a === undefined) {
		return false;
	}
	const order = compareValues(value, a);
	switch (operator) {
		case "equal":
			return order === 0;
		case "notEqual":
			return order !== 0;
		case "greaterThan":
			return order > 0;
		case "greaterThanOrEqual":
			return order >= 0;
		case "lessThan":
			return order < 0;
		case "lessThanOrEqual":
			return order <= 0;
		case "between":
		case "notBetween": {
			if (b === undefined) {
				return false;
			}
			const [low, high] = compareValues(a, b) <= 0 ? [a, b] : [b, a];
			const inside =
				compareValues(value, low) >= 0 && compareValues(value, high) <= 0;
			return operator === "between" ? inside : !inside;
		}
		default:
			return false;
	}
}

function textTest(type: string, value: Value, needle: string): boolean {
	const text = toText(value).toLowerCase();
	const wanted = needle.toLowerCase();
	switch (type) {
		case "containsText":
			return text.includes(wanted);
		case "notContainsText":
			return !text.includes(wanted);
		case "beginsWith":
			return text.startsWith(wanted);
		case "endsWith":
			return text.endsWith(wanted);
		default:
			return false;
	}
}

const hex = (colour: string) =>
	[1, 3, 5].map((at) => Number.parseInt(colour.slice(at, at + 2), 16));

function mix(from: string, to: string, t: number): string {
	const a = hex(from);
	const b = hex(to);
	return `#${a
		.map((channel, i) =>
			Math.round(channel + ((b[i] ?? 0) - channel) * t)
				.toString(16)
				.padStart(2, "0"),
		)
		.join("")
		.toUpperCase()}`;
}

function percentile(sorted: number[], p: number): number {
	if (sorted.length === 0) {
		return 0;
	}
	const at = (sorted.length - 1) * Math.min(Math.max(p, 0), 1);
	const low = Math.floor(at);
	const lower = sorted[low] ?? 0;
	const upper = sorted[Math.min(low + 1, sorted.length - 1)] ?? lower;
	return lower + (upper - lower) * (at - low);
}

/** Every cell's conditional look, worked out on demand and remembered. */
export class ConditionalStyles {
	private readonly placed: Placed[];
	private readonly cache = new Map<number, RuleStyle | null>();
	private readonly scales = new Map<ConditionalRule, number[] | null>();

	constructor(
		formats: readonly ConditionalFormat[] | undefined,
		private readonly sheet: RuleSheet,
	) {
		this.placed = (formats ?? [])
			.flatMap((format) => {
				const rects = parseSqref(format.range);
				const first = rects[0];
				if (!first) {
					return [];
				}
				return format.rules
					.filter((rule) => DRAWN_RULES.has(rule.type))
					.map((rule) => ({
						rule,
						rects,
						origin: { row: first.top, col: first.left },
					}));
			})
			.sort((a, b) => a.rule.priority - b.rule.priority);
	}

	get empty(): boolean {
		return this.placed.length === 0;
	}

	at(row: number, col: number): RuleStyle | null {
		if (this.placed.length === 0) {
			return null;
		}
		const key = row * 16_384 + col;
		const known = this.cache.get(key);
		if (known !== undefined) {
			return known;
		}
		const style: Record<string, unknown> = {};
		for (const entry of this.placed) {
			if (!inRects(entry.rects, row, col)) {
				continue;
			}
			const applied = this.apply(entry, row, col);
			if (applied === null) {
				continue;
			}
			for (const [name, value] of Object.entries(applied)) {
				if (value !== undefined && style[name] === undefined) {
					style[name] = value;
				}
			}
			if (entry.rule.stopIfTrue) {
				break;
			}
		}
		const result = Object.keys(style).length > 0 ? (style as RuleStyle) : null;
		this.cache.set(key, result);
		return result;
	}

	/** The rule's look on this cell, or null when it does not hold. */
	private apply(entry: Placed, row: number, col: number): RuleStyle | null {
		const { rule } = entry;
		if (rule.type === "colorScale") {
			const fill = this.scaleColor(entry, row, col);
			return fill ? { fill } : null;
		}
		try {
			return this.holds(entry, row, col) ? (rule.style ?? {}) : null;
		} catch {
			return null;
		}
	}

	private formula(entry: Placed, index: number, row: number, col: number) {
		const formula = entry.rule.formulas?.[index];
		if (formula === undefined) {
			return undefined;
		}
		const shifted = shiftFormula(
			`=${formula}`,
			row - entry.origin.row,
			col - entry.origin.col,
		);
		return this.sheet.compute(shifted.slice(1));
	}

	private holds(entry: Placed, row: number, col: number): boolean {
		const { rule } = entry;
		const value = this.sheet.value(row, col);
		switch (rule.type) {
			case "cellIs": {
				if (isError(value)) {
					return false;
				}
				const bounds = [0, 1].flatMap((i) => {
					const bound = this.formula(entry, i, row, col);
					return bound === undefined ? [] : [bound];
				});
				return compare(rule.operator ?? "", value, bounds);
			}
			case "containsBlanks":
			case "notContainsBlanks": {
				const blank = !isError(value) && toText(value).trim() === "";
				return blank === (rule.type === "containsBlanks");
			}
			case "containsErrors":
			case "notContainsErrors":
				return isError(value) === (rule.type === "containsErrors");
			case "expression": {
				const result = this.formula(entry, 0, row, col);
				return result !== undefined && !isError(result) && toBool(result);
			}
			default:
				return (
					!isError(value) &&
					rule.text !== undefined &&
					textTest(rule.type, value, rule.text)
				);
		}
	}

	/** The range's numbers, sorted, for the scale's thresholds. */
	private numbers(entry: Placed): number[] {
		const known = this.scales.get(entry.rule);
		if (known) {
			return known;
		}
		const numbers: number[] = [];
		for (const rect of entry.rects) {
			const bottom = Math.min(rect.bottom, this.sheet.rows - 1);
			const right = Math.min(rect.right, this.sheet.cols - 1);
			for (let r = rect.top; r <= bottom; r++) {
				for (let c = rect.left; c <= right; c++) {
					const value = this.sheet.value(r, c);
					if (typeof value === "number") {
						numbers.push(value);
					}
				}
			}
		}
		numbers.sort((a, b) => a - b);
		this.scales.set(entry.rule, numbers);
		return numbers;
	}

	private threshold(point: ScalePoint, sorted: number[]): number | null {
		const min = sorted[0] ?? 0;
		const max = sorted.at(-1) ?? 0;
		const given = Number(point.value);
		switch (point.type) {
			case "min":
				return min;
			case "max":
				return max;
			case "num":
				return Number.isFinite(given) ? given : null;
			case "percent":
				return Number.isFinite(given)
					? min + ((max - min) * given) / 100
					: null;
			case "percentile":
				return Number.isFinite(given) ? percentile(sorted, given / 100) : null;
			case "formula": {
				const value = point.value ? this.sheet.compute(point.value) : null;
				return typeof value === "number" ? value : null;
			}
			default:
				return null;
		}
	}

	private scaleColor(entry: Placed, row: number, col: number): string | null {
		const value = this.sheet.value(row, col);
		const scale = entry.rule.scale;
		if (typeof value !== "number" || !scale || scale.colors.length < 2) {
			return null;
		}
		const sorted = this.numbers(entry);
		const stops = scale.points.map((point) => this.threshold(point, sorted));
		if (
			stops.some((stop) => stop === null) ||
			stops.length !== scale.colors.length
		) {
			return null;
		}
		const at = stops as number[];
		for (let i = 0; i < at.length - 1; i++) {
			const low = at[i] ?? 0;
			const high = at[i + 1] ?? 0;
			if (value <= high || i === at.length - 2) {
				const t = high === low ? 0 : (value - low) / (high - low);
				return mix(
					scale.colors[i] ?? "#FFFFFF",
					scale.colors[i + 1] ?? "#FFFFFF",
					Math.min(Math.max(t, 0), 1),
				);
			}
		}
		return null;
	}
}

/**
 * A rule's look as CSS laid over the cell's own. Automatic text on a fill is
 * black, as for a cell's own fill.
 */
export function ruleCss(rule: RuleStyle, own: CellStyle): string {
	const css: string[] = [];
	if (rule.fill) {
		css.push(`background-color: ${rule.fill}`);
	}
	const ink = rule.color ?? (rule.fill && !own.color ? "#000000" : undefined);
	if (ink) {
		css.push(`color: ${ink}`);
	}
	if (rule.bold) {
		css.push("font-weight: 700");
	}
	if (rule.italic) {
		css.push("font-style: italic");
	}
	const lines = [
		rule.underline || own.underline ? "underline" : "",
		rule.strike || own.strike ? "line-through" : "",
	].filter(Boolean);
	if ((rule.underline || rule.strike) && lines.length > 0) {
		css.push(`text-decoration-line: ${lines.join(" ")}`);
	}
	if (rule.borders) {
		css.push(lookOf({ borders: rule.borders }).cell);
	}
	return css.join("; ");
}
