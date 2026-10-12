import { describe, expect, it } from "bun:test";
import { createWorkbook } from "../formula";
import { restructure } from "./book";
import { type ConditionalFormat, ConditionalStyles } from "./conditional";
import {
	autoColors,
	checkDropdowns,
	distinctValues,
	dropdownAt,
	fitList,
	listFormula,
	listProblem,
	moveSqref,
	parseList,
	parseSqref,
	placeDropdowns,
	renameDropdownSources,
	renameInCells,
	suggestionRange,
	withDropdown,
} from "./dropdowns";

describe("dropdown lists", () => {
	it("reads Excel's inline lists and writes them back", () => {
		expect(parseList('"Driftshop,Centrale Pneus,Aesthetics "')).toEqual([
			"Driftshop",
			"Centrale Pneus",
			"Aesthetics ",
		]);
		expect(parseList('"Say ""hi"",b"')).toEqual(['Say "hi"', "b"]);
		expect(parseList("Sheet2!$A$1:$A$9")).toBeNull();
		expect(parseList('"a"&"b"')).toBeNull();
		expect(listFormula(['Say "hi"', "b"])).toBe('"Say ""hi"",b"');
	});

	it("says what Excel cannot store, and fits a list into it", () => {
		expect(listProblem(["a", "b"])).toBeNull();
		expect(listProblem(["a,b"])).toBe("comma");
		expect(listProblem([])).toBe("empty");
		expect(listProblem(["x".repeat(200), "y".repeat(60)])).toBe("long");
		const fitted = fitList(["a,b", "x".repeat(200), "y".repeat(60), "z"]);
		expect(fitted).toEqual(["x".repeat(200), "z"]);
		expect(listProblem(fitted)).toBeNull();
	});

	it("parses ranges, whole columns and lists of them", () => {
		expect(parseSqref("F2:F22 $H$1 C:C")).toEqual([
			{ top: 1, bottom: 21, left: 5, right: 5 },
			{ top: 0, bottom: 0, left: 7, right: 7 },
			{ top: 0, bottom: 1_048_575, left: 2, right: 2 },
		]);
		const placed = placeDropdowns([
			{ range: "A1:A9", values: ["x"] },
			{ range: "A5:A6", values: ["y"] },
		]);
		expect(dropdownAt(placed, 4, 0)?.dropdown.values).toEqual(["y"]);
		expect(dropdownAt(placed, 1, 0)?.dropdown.values).toEqual(["x"]);
		expect(dropdownAt(placed, 1, 1)).toBeUndefined();
	});

	it("checks what crosses the network", () => {
		expect(
			checkDropdowns([
				{
					range: "B2:B9",
					values: ["a"],
					colors: [
						{ value: "a", fill: "#bfe1f6" },
						{ value: "b", fill: "red" },
					],
					strict: true,
					extra: 1,
				},
			]),
		).toEqual([
			{
				range: "B2:B9",
				values: ["a"],
				colors: [{ value: "a", fill: "#BFE1F6" }],
				strict: true,
			},
		]);
		expect(checkDropdowns([{ range: "B2:B9" }])).toBeUndefined();
		expect(checkDropdowns([{ range: "B2", source: "=1+1" }])).toBeUndefined();
		expect(
			checkDropdowns([{ range: "B2", values: ["a"], source: "A1:A2" }]),
		).toBeUndefined();
	});
});

describe("converting a column", () => {
	const rows = [
		["Shop", "Price"],
		["Amazon", "10"],
		[" amazon ", "5"],
		["Driftshop", "7"],
		["", ""],
		["AMAZON", "1"],
		["Driftshop", "2"],
		["Leboncoin", "3"],
	];

	it("finds the distinct values, most frequent first, case and spaces aside", () => {
		expect(distinctValues(rows.map((row) => row[0] ?? "").slice(1))).toEqual([
			"Amazon",
			"Driftshop",
			"Leboncoin",
		]);
	});

	it("gives each value a palette colour, keeping the ones it had", () => {
		const colors = autoColors(["a", "b"], [{ value: "B", fill: "#123456" }]);
		expect(colors).toEqual([
			{ value: "a", fill: "#BFE1F6", text: "#0A53A8" },
			{ value: "b", fill: "#123456" },
		]);
	});

	it("offers a column of words below the header, never numbers or a covered range", () => {
		const column = { top: 0, bottom: 7, left: 0, right: 0 };
		expect(
			suggestionRange(column, rows, { bodyStart: 1, dropdowns: [] }),
		).toEqual({ top: 1, bottom: 999, left: 0, right: 0 });
		const part = { top: 1, bottom: 3, left: 0, right: 0 };
		expect(
			suggestionRange(part, rows, { bodyStart: 1, dropdowns: [] }),
		).toEqual(part);
		const prices = { top: 1, bottom: 3, left: 1, right: 1 };
		expect(
			suggestionRange(prices, rows, { bodyStart: 1, dropdowns: [] }),
		).toBeNull();
		expect(
			suggestionRange(part, rows, {
				bodyStart: 1,
				dropdowns: [{ range: "A3", values: ["x"] }],
			}),
		).toBeNull();
		expect(
			suggestionRange({ ...part, right: 1 }, rows, {
				bodyStart: 1,
				dropdowns: [],
			}),
		).toBeNull();
		expect(
			suggestionRange({ ...part, bottom: 1 }, rows, {
				bodyStart: 1,
				dropdowns: [],
			}),
		).toBeNull();
	});

	it("renames a value in the cells of the range that held it, and nowhere else", () => {
		const next = renameInCells(
			rows,
			parseSqref("A2:A6"),
			"amazon",
			"Amazon FR",
		);
		expect(next.map((row) => row[0])).toEqual([
			"Shop",
			"Amazon FR",
			"Amazon FR",
			"Driftshop",
			"",
			"Amazon FR",
			"Driftshop",
			"Leboncoin",
		]);
		expect(next[3]).toBe(rows[3] as string[]);
		expect(renameInCells(rows, parseSqref("B2:B9"), "amazon", "x")).toBe(rows);
	});

	it("replaces the dropdowns a new one covers whole", () => {
		const kept = withDropdown(
			[
				{ range: "A2:A5", values: ["x"] },
				{ range: "A1:A20", values: ["y"] },
			],
			{ range: "A1:A10", values: ["z"] },
		);
		expect(kept.map((d) => d.range)).toEqual(["A1:A20", "A1:A10"]);
	});
});

describe("dropdowns move with the sheet", () => {
	it("moves, shrinks and drops ranges as lines come and go", () => {
		const insert = { axis: "row" as const, at: 0, count: 2 };
		expect(moveSqref("F2:F22 H1", insert)).toBe("F4:F24 H3");
		expect(moveSqref("C:C", insert)).toBe("C:C");
		expect(moveSqref("F2:F5", { axis: "row", at: 2, count: -2 })).toBe("F2:F3");
		expect(moveSqref("F2", { axis: "row", at: 1, count: -1 })).toBe("");
	});

	it("follows a source on another sheet, and its rename", () => {
		const book = {
			sheets: [
				{
					id: 1,
					name: "Mods",
					rows: [["Shop"]],
					dropdowns: [{ range: "A2:A9", source: "Lists!$A$1:$A$3" }],
				},
				{ id: 2, name: "Lists", rows: [["a"], ["b"]] },
			],
		};
		const moved = restructure(book, 1, { axis: "row", at: 0, count: 1 });
		expect(moved.sheets[0]?.dropdowns).toEqual([
			{ range: "A2:A9", source: "Lists!$A$2:$A$4" },
		]);
		const own = restructure(book, 0, { axis: "row", at: 0, count: 1 });
		expect(own.sheets[0]?.dropdowns?.[0]?.range).toBe("A3:A10");
		expect(
			renameDropdownSources(book, "Lists", "Shops").sheets[0]?.dropdowns,
		).toEqual([{ range: "A2:A9", source: "Shops!$A$1:$A$3" }]);
	});
});

describe("conditional formatting", () => {
	const rows = [
		["Amount", "Shop"],
		["10", "Amazon"],
		["40", "Driftshop"],
		["", "amazon prime"],
		["=1/0", "Other"],
		["25", ""],
	];

	function styles(formats: ConditionalFormat[]) {
		const book = createWorkbook([{ name: "S", rows }]);
		return new ConditionalStyles(formats, {
			value: (row, col) => book.value(0, row, col),
			compute: (formula) => book.compute(0, formula),
			rows: rows.length,
			cols: 2,
		});
	}

	it("compares a cell with cellIs, each operator", () => {
		const at = (operator: string, formulas: string[]) =>
			[1, 2, 3, 5].map(
				(row) =>
					styles([
						{
							range: "A2:A6",
							rules: [
								{
									type: "cellIs",
									operator,
									formulas,
									style: { bold: true },
									priority: 1,
								},
							],
						},
					]).at(row, 0) !== null,
			);
		expect(at("greaterThan", ["20"])).toEqual([false, true, false, true]);
		expect(at("lessThanOrEqual", ["10"])).toEqual([true, false, true, false]);
		expect(at("between", ["30", "20"])).toEqual([false, false, false, true]);
		expect(at("notBetween", ["20", "30"])).toEqual([true, true, true, false]);
		expect(at("equal", ["40"])).toEqual([false, true, false, false]);
		expect(at("notEqual", ["40"])).toEqual([true, false, true, true]);
	});

	it("matches text, blanks and errors", () => {
		const rule = (type: string, text?: string) => ({
			range: "B2:B6",
			rules: [{ type, text, style: { fill: "#FF0000" }, priority: 1 }],
		});
		const hits = (format: ConditionalFormat, col = 1) =>
			[1, 2, 3, 4, 5].filter((row) => styles([format]).at(row, col) !== null);
		expect(hits(rule("containsText", "AMAZON"))).toEqual([1, 3]);
		expect(hits(rule("notContainsText", "amazon"))).toEqual([2, 4, 5]);
		expect(hits(rule("beginsWith", "dr"))).toEqual([2]);
		expect(hits(rule("endsWith", "prime"))).toEqual([3]);
		expect(hits(rule("containsBlanks"))).toEqual([5]);
		expect(hits(rule("notContainsBlanks"))).toEqual([1, 2, 3, 4]);
		expect(hits({ ...rule("containsErrors"), range: "A2:A6" }, 0)).toEqual([4]);
	});

	it("evaluates a formula relative to the range's first cell", () => {
		const format = {
			range: "B2:B6",
			rules: [
				{
					type: "expression",
					formulas: ["AND(ISNUMBER(A2),A2>15)"],
					style: { italic: true as const },
					priority: 1,
				},
			],
		};
		const hits = [1, 2, 3, 4, 5].filter(
			(row) => styles([format]).at(row, 1) !== null,
		);
		expect(hits).toEqual([2, 5]);
	});

	it("applies rules by priority, the first keeping its properties, until stopIfTrue", () => {
		const format = (stop: boolean): ConditionalFormat => ({
			range: "A2:A6",
			rules: [
				{
					type: "cellIs",
					operator: "greaterThan",
					formulas: ["0"],
					style: { fill: "#00FF00" },
					priority: 2,
				},
				{
					type: "cellIs",
					operator: "greaterThan",
					formulas: ["20"],
					style: { fill: "#FF0000", bold: true },
					priority: 1,
					...(stop ? { stopIfTrue: true as const } : {}),
				},
				{
					type: "cellIs",
					operator: "greaterThan",
					formulas: ["0"],
					style: { italic: true },
					priority: 3,
				},
			],
		});
		expect(styles([format(false)]).at(2, 0)).toEqual({
			fill: "#FF0000",
			bold: true,
			italic: true,
		});
		expect(styles([format(true)]).at(2, 0)).toEqual({
			fill: "#FF0000",
			bold: true,
		});
		expect(styles([format(true)]).at(1, 0)).toEqual({
			fill: "#00FF00",
			italic: true,
		});
	});

	it("shades a colour scale between the range's lowest and highest", () => {
		const scale = (
			colors: string[],
			points: { type: string; value?: string }[],
		) =>
			styles([
				{
					range: "A2:A6",
					rules: [
						{ type: "colorScale", priority: 1, scale: { points, colors } },
					],
				},
			]);
		const two = scale(
			["#FFFFFF", "#000000"],
			[{ type: "min" }, { type: "max" }],
		);
		expect(two.at(1, 0)).toEqual({ fill: "#FFFFFF" });
		expect(two.at(2, 0)).toEqual({ fill: "#000000" });
		expect(two.at(5, 0)).toEqual({ fill: "#808080" });
		expect(two.at(4, 0)).toBeNull();
		const three = scale(
			["#FF0000", "#FFFFFF", "#0000FF"],
			[{ type: "min" }, { type: "num", value: "25" }, { type: "max" }],
		);
		expect(three.at(5, 0)).toEqual({ fill: "#FFFFFF" });
		expect(three.at(2, 0)).toEqual({ fill: "#0000FF" });
	});
});
