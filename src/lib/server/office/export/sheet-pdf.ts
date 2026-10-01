import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { createWorkbook, type SheetSource } from "#lib/formula.js";
import { columnName } from "#lib/sheet/references.js";

/**
 * A workbook as a PDF: every sheet on landscape A4, one table each, showing
 * what the grid shows — a formula's result, not the formula.
 */

const LANDSCAPE_WIDTH = 841.89;
const MARGIN = 36;
const TEXT_WIDTH = LANDSCAPE_WIDTH - 2 * MARGIN;
/** Roughly what one character of 8pt Roboto needs, padding included. */
const CHARACTER_WIDTH = 4.6;
const CELL_PADDING = 8;

/** Past this a PDF takes minutes to lay out; CSV and Excel are the way out. */
export const MAX_PDF_CELLS = 100_000;

export class SheetTooLargeError extends Error {}

/** The grid's used area: trailing empty rows and columns cut. */
export function usedArea(rows: string[][]): { height: number; width: number } {
	let height = 0;
	let width = 0;
	rows.forEach((row, index) => {
		const last = row.findLastIndex((cell) => cell !== "");
		if (last >= 0) {
			height = index + 1;
			width = Math.max(width, last + 1);
		}
	});
	return { height, width };
}

/**
 * What each cell shows, over the used area of the first `count` sheets, cut
 * to `limit`. The whole book is loaded all the same: a formula may read
 * another sheet, and only the cells shown are evaluated.
 */
export function shownValues(
	sheets: SheetSource[],
	count = sheets.length,
	limit = { height: Number.POSITIVE_INFINITY, width: Number.POSITIVE_INFINITY },
): string[][][] {
	const book = createWorkbook(sheets);
	return sheets.slice(0, count).map((sheet, index) => {
		const used = usedArea(sheet.rows);
		const height = Math.min(used.height, limit.height);
		const width = Math.min(used.width, limit.width);
		return Array.from({ length: height }, (_, row) =>
			Array.from({ length: width }, (_, col) => book.shown(index, row, col)),
		);
	});
}

function sheetTable(values: string[][]): Content {
	const width = values[0]?.length ?? 0;
	const longest = Array.from({ length: width }, (_, col) =>
		Math.max(...values.map((row) => (row[col] ?? "").length), 1),
	);
	const natural = longest.reduce(
		(sum, length) => sum + length * CHARACTER_WIDTH + CELL_PADDING,
		0,
	);
	return {
		table: {
			// Natural widths when they fit, or the page shared out evenly.
			widths: longest.map(() => (natural <= TEXT_WIDTH ? "auto" : "*")),
			body: values,
		},
		layout: {
			hLineWidth: () => 0.5,
			vLineWidth: () => 0.5,
			hLineColor: () => "#bbbbbb",
			vLineColor: () => "#bbbbbb",
		},
	};
}

export function sheetsPdf(
	sheets: SheetSource[],
	title: string,
): TDocumentDefinitions {
	const cells = sheets.reduce((sum, sheet) => {
		const { height, width } = usedArea(sheet.rows);
		return sum + height * width;
	}, 0);
	if (cells > MAX_PDF_CELLS) {
		throw new SheetTooLargeError(
			`${cells} cells is too many for a PDF; export as CSV or Excel instead`,
		);
	}
	const values = shownValues(sheets);
	const content = sheets.flatMap((sheet, index): Content[] => {
		const rows = values[index] ?? [];
		return [
			{
				text: sheet.name,
				bold: true,
				fontSize: 12,
				margin: [0, 0, 0, 8],
				...(index > 0 ? { pageBreak: "before" as const } : {}),
			},
			rows.length > 0 ? sheetTable(rows) : { text: "", margin: [0, 0, 0, 0] },
		];
	});
	return {
		info: { title },
		pageSize: "A4",
		pageOrientation: "landscape",
		pageMargins: MARGIN,
		content,
		defaultStyle: { font: "Roboto", fontSize: 8 },
	};
}

/** A tile's worth of grid, on a 16:10 page: what the editor opens on. */
const PREVIEW = { width: 480, height: 300, rows: 16, columns: 7 };
const HEADER = {
	fillColor: "#f1f3f4",
	color: "#5f6368",
	alignment: "center",
} as const;

/** The first sheet's top-left corner, headed and lined like the editor. */
export function sheetPreviewPdf(sheets: SheetSource[]): TDocumentDefinitions {
	const values = shownValues(sheets, 1, {
		height: PREVIEW.rows,
		width: PREVIEW.columns,
	})[0];
	const cell = (row: number, col: number) => {
		const text = values?.[row]?.[col] ?? "";
		const number = text !== "" && Number.isFinite(Number(text));
		return {
			text,
			noWrap: true,
			alignment: number ? ("right" as const) : ("left" as const),
		};
	};
	const columns = Array.from({ length: PREVIEW.columns }, (_, col) => col);
	return {
		pageSize: { width: PREVIEW.width, height: PREVIEW.height },
		pageMargins: 0,
		content: {
			table: {
				widths: [20, ...columns.map(() => "*")],
				body: [
					[
						{ text: "", ...HEADER },
						...columns.map((col) => ({ text: columnName(col), ...HEADER })),
					],
					...Array.from({ length: PREVIEW.rows }, (_, row) => [
						{ text: String(row + 1), ...HEADER },
						...columns.map((col) => cell(row, col)),
					]),
				],
			},
			layout: {
				hLineWidth: () => 0.5,
				vLineWidth: () => 0.5,
				hLineColor: () => "#dadce0",
				vLineColor: () => "#dadce0",
			},
		},
		defaultStyle: { font: "Roboto", fontSize: 9 },
	};
}
