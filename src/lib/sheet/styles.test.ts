import { describe, expect, it } from "bun:test";

import { formatValue } from "./format";
import { addMerges, moveMerges, removeMerges } from "./merges";
import {
	accountingFormat,
	currencyFormat,
	isDateFormat,
	shiftDecimals,
} from "./number-formats";
import {
	compactStyles,
	lookOf,
	moveStyleLines,
	normalizeStyle,
	styleKey,
} from "./styles";

describe("number formats", () => {
	it("shows Excel's codes the way Excel does", () => {
		expect(formatValue(1234.5, '"$"#,##0.00')).toBe("$1,234.50");
		expect(formatValue(0.25, "0%")).toBe("25%");
		expect(formatValue(12_345.678, "0.00E+00")).toBe("1.23E+04");
		expect(formatValue(0.000123, "0.00E+00")).toBe("1.23E-04");
		expect(formatValue(9.999, "0.00E+00")).toBe("1.00E+01");
		expect(formatValue(1.5, "[h]:mm:ss")).toBe("36:00:00");
		expect(formatValue(1234.5, "#,##0.00\\ [$€-40C]")).toBe("1,234.50 €");
		expect(formatValue(42, "@")).toBe("42");
		expect(formatValue(46_095, "dd/mm/yyyy")).toBe("14/03/2026");
	});

	it("builds currency and accounting codes for a locale's symbol", () => {
		expect(formatValue(-1234.5, currencyFormat("EUR"))).toBe("-1,234.50 €");
		expect(formatValue(1234.5, currencyFormat("JPY"))).toBe("¥1,235");
		expect(formatValue(-5, accountingFormat("USD")).trim()).toBe("$ (5.00)");
	});

	it("adds and removes decimals", () => {
		expect(shiftDecimals(undefined, 1, 1.5)).toBe("0.00");
		expect(shiftDecimals("#,##0.00", -2, 0)).toBe("#,##0");
		expect(shiftDecimals("0%", 1, 0)).toBe("0.0%");
		expect(shiftDecimals('"$"#,##0.00', 1, 0)).toBe('"$"#,##0.000');
		expect(shiftDecimals("yyyy-mm-dd", 1, 0)).toBe("yyyy-mm-dd");
		expect(isDateFormat("[h]:mm")).toBe(true);
		expect(isDateFormat('#,##0 "days"')).toBe(false);
	});
});

describe("styles", () => {
	it("keeps only what can be trusted, and black as automatic", () => {
		expect(
			normalizeStyle(
				{
					bold: true,
					italic: "yes",
					color: "#000000",
					fill: "url(x)",
					font: 'Arial"; background: url(https://x)',
					size: 11,
					borders: { top: { style: "thin" }, left: { style: "nope" } },
				},
				{ size: 11 },
			),
		).toEqual({
			bold: true,
			font: "Arial background urlhttpsx",
			borders: { top: { style: "thin" } },
		});
	});

	it("keys a look without its origin, and draws each look once", () => {
		expect(styleKey({ bold: true, base: 3 })).toBe(styleKey({ bold: true }));
		const look = lookOf({
			fill: "#FFFF00",
			borders: { top: { style: "thick" }, right: { style: "thin" } },
		});
		expect(look.cell).toContain("background-color: #FFFF00");
		expect(look.cell).toContain("color: #000000");
		expect(look.cell).toContain("border-right: 1px solid var(--foreground)");
		expect(look.cell).toContain("box-shadow: 0 -3px 0 0 var(--foreground)");
	});

	it("moves style rows and columns, and travels compact", () => {
		const grid = [[1, 2], [3]];
		expect(moveStyleLines(grid, "row", 1, 1)).toEqual([[1, 2], [], [3]]);
		expect(moveStyleLines(grid, "col", 0, -1)).toEqual([[2], []]);
		expect(compactStyles([[0, 1, 0], [0, 0], []])).toEqual([[0, 1]]);
	});
});

describe("merges", () => {
	const rect = { top: 0, left: 0, bottom: 1, right: 2 };

	it("merges whole, across, and unmerges what it overlaps", () => {
		expect(addMerges([], rect, false)).toEqual(["A1:C2"]);
		expect(addMerges(["B2:B3"], rect, true)).toEqual(["A1:C1", "A2:C2"]);
		expect(removeMerges(["A1:C2", "E5:F5"], { ...rect, bottom: 0 })).toEqual([
			"E5:F5",
		]);
	});

	it("follows inserted and deleted lines", () => {
		expect(moveMerges(["A2:B4"], "row", 0, 2)).toEqual(["A4:B6"]);
		expect(moveMerges(["A2:B4"], "row", 2, 1)).toEqual(["A2:B5"]);
		expect(moveMerges(["A2:B4"], "row", 2, -1)).toEqual(["A2:B3"]);
		expect(moveMerges(["A2:A3"], "row", 1, -2)).toEqual([]);
		expect(moveMerges(["B1:C1"], "col", 1, -1)).toEqual([]);
	});
});
