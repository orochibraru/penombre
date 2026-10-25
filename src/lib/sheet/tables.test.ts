import { describe, expect, it } from "bun:test";

import { moveLinks, moveWidths } from "./layout";
import { layered, moveTables, type SheetTable, tableLayer } from "./tables";

const RECT = { top: 0, left: 0, bottom: 5, right: 2 };

const table: SheetTable = {
	part: "t",
	ref: "A1:C6",
	headerRows: 1,
	totalRows: 1,
	firstColumn: true,
	rowStripes: true,
	style: {
		wholeTable: {
			borders: {
				top: { style: "thin" },
				bottom: { style: "thin" },
				horizontal: { style: "hair" },
			},
		},
		firstRowStripe: { fill: "#EEEEEE", size: 2 },
		headerRow: { bold: true, fill: "#112233" },
		totalRow: { bold: true, borders: { top: { style: "double" } } },
		firstColumn: { italic: true },
		firstHeaderCell: { fill: "#AA0000" },
	},
};

const at = (row: number, col: number) =>
	tableLayer(table, RECT, row, col).style;

describe("table layers", () => {
	it("stacks the style's elements in Excel's order", () => {
		expect(at(0, 0)).toMatchObject({
			bold: true,
			fill: "#AA0000",
			italic: true,
		});
		expect(at(0, 1)).toMatchObject({ bold: true, fill: "#112233" });
		expect(at(0, 1).borders).toEqual({
			top: { style: "thin" },
			bottom: { style: "hair" },
		});
		// A two-row first stripe, a one-row second, from the first body row.
		expect([1, 2, 3, 4].map((row) => at(row, 1).fill)).toEqual([
			"#EEEEEE",
			"#EEEEEE",
			undefined,
			"#EEEEEE",
		]);
		expect(at(5, 1)).toMatchObject({ bold: true });
		expect(at(5, 1).borders?.top).toEqual({ style: "double" });
		expect(at(5, 1).borders?.bottom).toEqual({ style: "thin" });
	});

	it("lets the cell's own style win", () => {
		expect(
			layered(
				{ fill: "#112233", bold: true, borders: { top: { style: "thin" } } },
				{ fill: "#FFFFFF", borders: { left: { style: "thick" } } },
			),
		).toEqual({
			fill: "#FFFFFF",
			bold: true,
			borders: { top: { style: "thin" }, left: { style: "thick" } },
		});
	});

	it("moves ranges, widths and links with inserted and deleted lines", () => {
		expect(moveTables([table], "row", 3, 2)?.[0]?.ref).toBe("A1:C8");
		expect(moveTables([table], "row", 0, 1)?.[0]?.ref).toBe("A2:C7");
		expect(moveTables([table], "col", 0, -3)).toEqual([]);
		expect(moveWidths([10, 20, 30], 1, 1)).toEqual([10, 0, 20, 30]);
		expect(moveWidths([10, 20, 30], 0, -2)).toEqual([30]);
		expect(moveLinks(["C2", "C5", "A9"], "row", 2, -3)).toEqual(["C2", "A6"]);
	});
});
