import { describe, expect, it } from "bun:test";
import { FUNCTION_NAMES } from "../formula";
import {
	addSheet,
	type BookData,
	blockAt,
	fill,
	fillWith,
	freeSheetName,
	parseBook,
	removeSheet,
	renameSheet,
	restructure,
	serializeBook,
	sheetNameProblem,
	shiftBlock,
	sortRows,
	tile,
	widthOf,
	writeBlock,
} from "./book";
import { complete, completionAt, SIGNATURES, signatureAt } from "./catalog";
import { parseTsv, toTsv } from "./clipboard";
import { History } from "./history";
import {
	colsOf,
	inRect,
	leap,
	moveTo,
	parseName,
	rangeName,
	rectOf,
	rowsOf,
	selectAll,
	single,
	step,
} from "./selection";

const bounds = { rows: 10, cols: 5 };

describe("selection", () => {
	it("moves the active cell and extends from the far corner", () => {
		let s = single(2, 2);
		s = step(s, { row: 1, col: 0 }, bounds, false);
		expect(s).toEqual(single(3, 2));
		s = step(s, { row: 0, col: 1 }, bounds, true);
		s = step(s, { row: 1, col: 0 }, bounds, true);
		expect(rangeName(s)).toBe("C4:D5");
		expect(rectOf(s)).toEqual({ top: 3, left: 2, bottom: 4, right: 3 });
		// Without Shift the range collapses onto a cell next to the active one.
		expect(step(s, { row: 0, col: -1 }, bounds, false)).toEqual(single(3, 1));
	});

	it("stays inside the grid", () => {
		expect(step(single(0, 0), { row: -1, col: -1 }, bounds, false)).toEqual(
			single(0, 0),
		);
		expect(step(single(9, 4), { row: 1, col: 1 }, bounds, false)).toEqual(
			single(9, 4),
		);
	});

	it("names ranges either way round", () => {
		const s = moveTo(single(4, 3), { row: 1, col: 0 }, true);
		expect(rangeName(s)).toBe("A2:D5");
		expect(inRect(rectOf(s), 3, 2)).toBe(true);
		expect(inRect(rectOf(s), 5, 2)).toBe(false);
	});

	it("reads what is typed in the name box", () => {
		expect(parseName("b3")).toEqual(single(2, 1));
		expect(parseName("$A$1:C4")).toEqual({
			anchor: { row: 0, col: 0 },
			focus: { row: 3, col: 2 },
		});
		expect(parseName("nope")).toBeNull();
		expect(parseName("A1:B2:C3")).toBeNull();
	});

	it("selects all, whole rows and whole columns", () => {
		expect(rangeName(selectAll(bounds))).toBe("A1:E10");
		expect(rangeName(rowsOf(2, 3, bounds))).toBe("A3:E4");
		expect(rangeName(colsOf(1, 1, bounds))).toBe("B1:B10");
	});

	it("leaps to the edge of the data like Ctrl+arrow", () => {
		const grid = ["x", "x", "x", "", "", "x", ""];
		const filled = (row: number) => (grid[row] ?? "") !== "";
		const down = { row: 1, col: 0 };
		const at = (row: number) => leap({ row, col: 0 }, down, bounds, filled).row;
		expect(at(0)).toBe(2);
		expect(at(2)).toBe(5);
		expect(at(5)).toBe(9);
		expect(
			leap({ row: 0, col: 0 }, { row: -1, col: 0 }, bounds, filled),
		).toEqual({
			row: 0,
			col: 0,
		});
	});
});

describe("clipboard", () => {
	it("writes and reads tab-separated cells, quoting what needs it", () => {
		const block = [
			["a", "b\tc", 'say "hi"'],
			["line\nbreak", "", "=A1"],
		];
		const text = toTsv(block);
		expect(text).toBe('a\t"b\tc"\t"say ""hi"""\n"line\nbreak"\t\t=A1');
		expect(parseTsv(text)).toEqual(block);
	});

	it("reads what other spreadsheets put there", () => {
		expect(parseTsv("1\t2\r\n3\t4\r\n")).toEqual([
			["1", "2"],
			["3", "4"],
		]);
		expect(parseTsv("single")).toEqual([["single"]]);
		expect(parseTsv('"hello')).toEqual([['"hello']]);
		expect(parseTsv('"a"b\tc')).toEqual([['"a"b', "c"]]);
		expect(parseTsv("a\t")).toEqual([["a", ""]]);
	});
});

describe("history", () => {
	it("undoes and redoes, and a new change ends redo", () => {
		const history = new History<number>(3);
		history.record(1);
		history.record(2);
		expect(history.undo(3)).toBe(2);
		expect(history.redo(2)).toBe(3);
		expect(history.undo(3)).toBe(2);
		history.record(2);
		expect(history.canRedo).toBe(false);
		expect(history.undo(5)).toBe(2);
		expect(history.undo(2)).toBe(1);
		expect(history.undo(1)).toBeUndefined();
		expect(history.canUndo).toBe(false);
	});

	it("forgets the oldest state past its limit", () => {
		const history = new History<number>(2);
		history.record(1);
		history.record(2);
		history.record(3);
		expect(history.undo(4)).toBe(3);
		expect(history.undo(3)).toBe(2);
		expect(history.undo(2)).toBeUndefined();
	});
});

const book = (...sheets: [string, string[][]][]): BookData => ({
	sheets: sheets.map(([name, rows], i) => ({ id: i + 1, name, rows })),
});

describe("workbook", () => {
	it("reads a CSV as one sheet and an .xlsx as JSON", () => {
		expect(parseBook("a,b\n1,2\n", false).sheets[0]?.rows).toEqual([
			["a", "b"],
			["1", "2"],
		]);
		const json = JSON.stringify({
			sheets: [{ id: 3, name: "Data", rows: [["x"]] }],
		});
		expect(parseBook(json, true).sheets[0]?.name).toBe("Data");
	});

	it("writes a CSV without the blank edges a cleared cell leaves", () => {
		const b = book([
			"Sheet1",
			[
				["a", "b", ""],
				["1", "", ""],
				["", "", ""],
			],
		]);
		expect(serializeBook(b, false)).toBe("a,b\n1,\n");
		expect(serializeBook(book(["S", [["", ""]]]), false)).toBe("\n");
	});

	it("writes an .xlsx workbook without the file's recorded values", () => {
		const b: BookData = {
			sheets: [
				{
					id: 2,
					name: "S",
					rows: [["=X()"]],
					cached: { "0:0": ["=X()", "1"] },
				},
			],
		};
		expect(JSON.parse(serializeBook(b, true))).toEqual({
			sheets: [{ id: 2, name: "S", rows: [["=X()"]] }],
		});
	});

	it("writes a block, growing the grid, copying only what it touches", () => {
		const rows = [["a"], ["b"]];
		const next = writeBlock(rows, 1, 1, [
			["x", "y"],
			["z", "w"],
		]);
		expect(next).toEqual([["a"], ["b", "x", "y"], ["", "z", "w"]]);
		expect(next[0]).toBe(rows[0] as string[]);
		expect(rows).toEqual([["a"], ["b"]]);
		expect(widthOf(next)).toBe(3);
		expect(blockAt(next, { top: 1, left: 1, bottom: 2, right: 2 })).toEqual([
			["x", "y"],
			["z", "w"],
		]);
		expect(
			fillWith(next, { top: 0, left: 0, bottom: 1, right: 0 }, ""),
		).toEqual([[""], ["", "x", "y"], ["", "z", "w"]]);
	});

	it("shifts a pasted block's formulas and tiles it over the selection", () => {
		expect(shiftBlock([["=A1", "x"]], 2, 1)).toEqual([["=B3", "x"]]);
		expect(
			tile([["=A1"]], { top: 0, left: 0, bottom: 1, right: 1 }, true),
		).toEqual([
			["=A1", "=B1"],
			["=A2", "=B2"],
		]);
		expect(
			tile([["1", "2"]], { top: 0, left: 0, bottom: 0, right: 2 }, true),
		).toEqual([["1", "2"]]);
	});

	it("fills down and right with shifted formulas", () => {
		const rows = [
			["1", "=A1*2"],
			["2", ""],
			["3", ""],
		];
		expect(
			fill(rows, { top: 0, left: 1, bottom: 2, right: 1 }, "down"),
		).toEqual([
			["1", "=A1*2"],
			["2", "=A2*2"],
			["3", "=A3*2"],
		]);
		expect(
			fill(rows, { top: 1, left: 1, bottom: 1, right: 1 }, "down"),
		).toEqual([
			["1", "=A1*2"],
			["2", "=A2*2"],
			["3", ""],
		]);
		expect(
			fill(
				[["=B1", "", ""]],
				{ top: 0, left: 0, bottom: 0, right: 2 },
				"right",
			),
		).toEqual([["=B1", "=C1", "=D1"]]);
		expect(fill(rows, { top: 0, left: 0, bottom: 0, right: 0 }, "down")).toBe(
			rows,
		);
	});

	it("inserts and deletes rows, rewriting formulas on every sheet", () => {
		const b = book(
			["Main", [["1", "=SUM(A1:A3)"], ["2"], ["3", "=A3"]]],
			["Other", [["=Main!A3", "=A3"]]],
		);
		const inserted = restructure(b, 0, { axis: "row", at: 1, count: 1 });
		expect(inserted.sheets[0]?.rows).toEqual([
			["1", "=SUM(A1:A4)"],
			[],
			["2"],
			["3", "=A4"],
		]);
		expect(inserted.sheets[1]?.rows).toEqual([["=Main!A4", "=A3"]]);

		const deleted = restructure(b, 0, { axis: "row", at: 2, count: -1 });
		expect(deleted.sheets[0]?.rows).toEqual([["1", "=SUM(A1:A2)"], ["2"]]);
		expect(deleted.sheets[1]?.rows).toEqual([["=#REF!", "=A3"]]);
	});

	it("inserts and deletes columns", () => {
		const b = book(["S", [["a", "b", "=B1"], ["c"]]]);
		const inserted = restructure(b, 0, { axis: "col", at: 1, count: 2 });
		expect(inserted.sheets[0]?.rows).toEqual([
			["a", "", "", "b", "=D1"],
			["c"],
		]);
		const deleted = restructure(b, 0, { axis: "col", at: 0, count: -1 });
		expect(deleted.sheets[0]?.rows).toEqual([["b", "=A1"], []]);
		const emptied = restructure(book(["S", [["a"]]]), 0, {
			axis: "row",
			at: 0,
			count: -1,
		});
		expect(emptied.sheets[0]?.rows).toEqual([[""]]);
	});

	it("drops a file's recorded values once rows move", () => {
		const b: BookData = {
			sheets: [
				{
					id: 1,
					name: "S",
					rows: [["=X()"]],
					cached: { "0:0": ["=X()", "1"] },
				},
			],
		};
		const moved = restructure(b, 0, { axis: "row", at: 0, count: 1 });
		expect(moved.sheets[0]?.cached).toBeUndefined();
	});

	it("sorts numbers first, then text, blanks last, below a header", () => {
		const rows = [["h"], ["b"], ["10"], [""], ["2"], ["a"]];
		const key = (row: number) => {
			const text = rows[row]?.[0] ?? "";
			return text !== "" && Number.isFinite(Number(text)) ? Number(text) : text;
		};
		expect(sortRows(rows, 1, false, key).map((r) => r[0])).toEqual([
			"h",
			"2",
			"10",
			"a",
			"b",
			"",
		]);
		expect(sortRows(rows, 1, true, key).map((r) => r[0])).toEqual([
			"h",
			"b",
			"a",
			"10",
			"2",
			"",
		]);
	});

	it("adds, renames and removes sheets, rewriting what names them", () => {
		let b = book(["Main", [["=Data!A1"]]], ["Data", [["5"]]]);
		expect(freeSheetName(b)).toBe("Sheet3");
		b = addSheet(b, 7, "Sheet3");
		expect(b.sheets[2]).toEqual({ id: 7, name: "Sheet3", rows: [[""]] });
		b = renameSheet(b, 1, "My Data");
		expect(b.sheets[0]?.rows[0]?.[0]).toBe("='My Data'!A1");
		expect(b.sheets[1]?.name).toBe("My Data");
		b = removeSheet(b, 1);
		expect(b.sheets.map((s) => s.name)).toEqual(["Main", "Sheet3"]);
		expect(b.sheets[0]?.rows[0]?.[0]).toBe("=#REF!");
		const last = book(["Only", [[""]]]);
		expect(removeSheet(last, 0)).toBe(last);
	});

	it("refuses the sheet names Excel refuses", () => {
		const b = book(["Main", [[""]]]);
		expect(sheetNameProblem(b, " ")).toBe("empty");
		expect(sheetNameProblem(b, "a/b")).toBe("invalid");
		expect(sheetNameProblem(b, "'quoted")).toBe("invalid");
		expect(sheetNameProblem(b, "x".repeat(32))).toBe("invalid");
		expect(sheetNameProblem(b, "MAIN")).toBe("taken");
		expect(sheetNameProblem(b, "MAIN", 0)).toBeNull();
		expect(sheetNameProblem(b, "Q1 figures")).toBeNull();
	});
});

describe("formula autocomplete", () => {
	it("has a signature for every function and nothing else", () => {
		expect(Object.keys(SIGNATURES).sort()).toEqual([...FUNCTION_NAMES]);
	});

	it("suggests functions for the name being typed", () => {
		expect(completionAt("=SU", 3)?.names).toEqual([
			"SUBSTITUTE",
			"SUM",
			"SUMIF",
			"SUMIFS",
			"SUMPRODUCT",
		]);
		expect(completionAt("=A1+vlo", 7)).toEqual({
			start: 4,
			end: 7,
			names: ["VLOOKUP"],
		});
	});

	it("stays quiet outside a name", () => {
		expect(completionAt("SU", 2)).toBeNull();
		expect(completionAt('="SU', 4)).toBeNull();
		expect(completionAt("=Sheet1!A", 9)).toBeNull();
		expect(completionAt("=$A", 3)).toBeNull();
		expect(completionAt("=SUM(", 5)).toBeNull();
		expect(completionAt("=SUM(A1)", 4)).toBeNull();
		expect(completionAt("=QQ", 3)).toBeNull();
	});

	it("completes a name with its opening parenthesis", () => {
		const text = "=1+su*2";
		const found = completionAt(text, 5);
		expect(found).not.toBeNull();
		if (found) {
			expect(complete(text, found, "SUM")).toEqual({
				text: "=1+SUM(*2",
				caret: 7,
			});
		}
	});

	it("shows the signature of the function the caret is in", () => {
		expect(signatureAt("=SUM(A1,", 8)).toBe(SIGNATURES.SUM ?? "");
		expect(signatureAt("=IF(A1>0,ROUND(A1", 17)).toBe(SIGNATURES.ROUND ?? "");
		expect(signatureAt("=IF(A1>0,ROUND(A1),", 19)).toBe(SIGNATURES.IF ?? "");
		expect(signatureAt('=IF(A1="(",', 11)).toBe(SIGNATURES.IF ?? "");
		expect(signatureAt('=LEN("a(', 8)).toBeNull();
		expect(signatureAt("=A1+1", 5)).toBeNull();
		expect(signatureAt("plain", 3)).toBeNull();
	});
});
