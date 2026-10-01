import type {
	Content,
	ContentText,
	CustomTableLayout,
	TableCell,
	TDocumentDefinitions,
} from "pdfmake/interfaces";
import { pixelSize } from "../docx-media";
import type { Block, Cell, List, Run } from "./model";

/**
 * A document's blocks as a pdfmake definition: real text, so the PDF can be
 * searched, selected and read aloud, laid out on A4 with inch margins.
 *
 * Fonts are what pdfmake can embed without a font file of ours: Roboto for
 * text (Latin, Greek, Cyrillic), and the PDF standard Times and Courier for
 * serif and monospace runs — but only for text their Latin-1 encoding can
 * spell, since anything else would print as the wrong glyphs. There is no CJK
 * face, so Chinese, Japanese and Korean text comes out blank.
 */

const A4_WIDTH = 595.28;
const MARGIN = 72;
export const TEXT_WIDTH = A4_WIDTH - 2 * MARGIN;
const RULE = "#bbbbbb";
const SHADE = "#f3f4f6";
const LINK = "#1d4ed8";
const HEADING_SIZES = [20, 16, 14, 12, 11, 11];

/** What Windows-1252 can encode, which is all a standard PDF font can draw. */
const WIN_ANSI = /^[\n -~ -ÿ€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]*$/;
const SERIF =
	/^(georgia|times new roman|times|cambria|garamond|book antiqua|palatino.*|serif)$/i;
const MONOSPACE =
	/^(courier new|courier|consolas|menlo|monaco|lucida console|monospace)$/i;

/** The PDF font for a family, or undefined for the default (Roboto). */
export function pdfFont(
	family: string | undefined,
	text: string,
): string | undefined {
	if (!(family && WIN_ANSI.test(text))) {
		return undefined;
	}
	if (MONOSPACE.test(family)) {
		return "Courier";
	}
	return SERIF.test(family) ? "Times" : undefined;
}

function leaf(run: Run): ContentText {
	const { marks } = run;
	const decoration = [
		...(marks.underline || marks.link ? (["underline"] as const) : []),
		...(marks.strike ? (["lineThrough"] as const) : []),
	];
	const font = pdfFont(marks.code ? "monospace" : marks.font, run.text);
	const color = marks.color ?? (marks.link ? LINK : undefined);
	const background = marks.background ?? (marks.code ? SHADE : undefined);
	return {
		text: run.text,
		...(marks.bold ? { bold: true } : {}),
		...(marks.italic ? { italics: true } : {}),
		...(decoration.length > 0 ? { decoration } : {}),
		...(marks.link ? { link: marks.link } : {}),
		...(color ? { color } : {}),
		...(background ? { background } : {}),
		...(font ? { font } : {}),
		...(marks.size ? { fontSize: marks.size } : {}),
		...(marks.sup ? { sup: true } : {}),
		...(marks.sub ? { sub: true } : {}),
	};
}

/** An empty paragraph still takes a line, as it does on screen. */
const leaves = (runs: Run[]): ContentText[] | string =>
	runs.length > 0 ? runs.map(leaf) : " ";

/** A single-cell table: the one way pdfmake shades or rules a whole block. */
function panel(
	body: Content,
	layout: CustomTableLayout | string,
	fill?: string,
): Content {
	const cell = { stack: [body], ...(fill ? { fillColor: fill } : {}) };
	return {
		table: { widths: ["*"], body: [[cell as TableCell]] },
		layout: layout as never,
		margin: [0, 4, 0, 10],
	};
}

const QUOTE: CustomTableLayout = {
	hLineWidth: () => 0,
	vLineWidth: (index) => (index === 0 ? 2 : 0),
	vLineColor: () => RULE,
	paddingLeft: () => 10,
	paddingTop: () => 0,
	paddingBottom: () => 0,
};

const GRID: CustomTableLayout = {
	hLineWidth: () => 0.5,
	vLineWidth: () => 0.5,
	hLineColor: () => RULE,
	vLineColor: () => RULE,
};

function listContent(list: List): Content {
	const items = list.items.map((item) => {
		const content = item.blocks.flatMap(blockContent);
		if (list.kind !== "task") {
			return content.length === 1
				? (content[0] as Content)
				: { stack: content };
		}
		// Roboto has no ballot box, and a bracket reads the same.
		return {
			columns: [
				{ width: 16, text: item.checked ? "[x]" : "[  ]" },
				{ width: "*", stack: content },
			],
			columnGap: 4,
		};
	});
	const margin: [number, number, number, number] = [0, 0, 0, 8];
	if (list.kind === "ordered") {
		return { ol: items, margin };
	}
	return list.kind === "task"
		? { ul: items, type: "none", margin }
		: { ul: items, margin };
}

/**
 * Rows with spans made rectangular: pdfmake wants a cell, even an empty one,
 * at every position a span covers.
 */
export function tableBody(rows: Cell[][]): TableCell[][] {
	const grid: TableCell[][] = rows.map(() => []);
	rows.forEach((row, r) => {
		let column = 0;
		for (const cell of row) {
			while (grid[r]?.[column] !== undefined) {
				column++;
			}
			const content = cell.blocks.flatMap(blockContent);
			grid[r] ??= [];
			(grid[r] as TableCell[])[column] = {
				stack: content.length > 0 ? content : [""],
				...(cell.colspan > 1 ? { colSpan: cell.colspan } : {}),
				...(cell.rowspan > 1 ? { rowSpan: cell.rowspan } : {}),
				...(cell.header ? { bold: true, fillColor: SHADE } : {}),
			} as TableCell;
			for (let dr = 0; dr < cell.rowspan && r + dr < rows.length; dr++) {
				for (let dc = 0; dc < cell.colspan; dc++) {
					if (dr > 0 || dc > 0) {
						(grid[r + dr] as TableCell[])[column + dc] = {};
					}
				}
			}
			column += cell.colspan;
		}
	});
	const width = Math.max(1, ...grid.map((row) => row.length));
	return grid.map((row) =>
		Array.from({ length: width }, (_, index) => row[index] ?? ""),
	);
}

function tableContent(rows: Cell[][]): Content {
	const body = tableBody(rows);
	let headerRows = 0;
	while (
		rows[headerRows]?.every((cell) => cell.header) &&
		rows[headerRows]?.length
	) {
		headerRows++;
	}
	return {
		table: {
			headerRows,
			widths: Array.from({ length: body[0]?.length ?? 1 }, () => "*"),
			body,
		},
		layout: GRID,
		margin: [0, 4, 0, 10],
	};
}

function imageContent(src: string, width: number | undefined): Content[] {
	// pdfkit reads PNG and JPEG only.
	if (!/^data:image\/(png|jpeg);/i.test(src)) {
		return [];
	}
	const size = pixelSize(
		new Uint8Array(Buffer.from(src.slice(src.indexOf(",") + 1), "base64")),
	);
	if (!size) {
		return [];
	}
	const points = (width ?? size.width) * 0.75;
	return [
		{ image: src, width: Math.min(TEXT_WIDTH, points), margin: [0, 4, 0, 8] },
	];
}

function codeContent(text: string): Content {
	const code = text.replace(/\t/g, "    ").replace(/\n$/, "");
	const font = pdfFont("monospace", code);
	return panel(
		{
			text: code || " ",
			fontSize: 9,
			preserveLeadingSpaces: true,
			...(font ? { font } : {}),
		},
		"noBorders",
		SHADE,
	);
}

function blockContent(block: Block): Content[] {
	switch (block.type) {
		case "heading":
			return [
				{
					text: leaves(block.runs),
					fontSize: HEADING_SIZES[block.level - 1] ?? 11,
					bold: true,
					margin: [0, 10, 0, 6],
					...(block.align ? { alignment: block.align } : {}),
				},
			];
		case "paragraph":
			return [
				{
					text: leaves(block.runs),
					margin: [block.indent ?? 0, 0, 0, 8],
					...(block.align ? { alignment: block.align } : {}),
					...(block.lineHeight ? { lineHeight: block.lineHeight } : {}),
				},
			];
		case "list":
			return [listContent(block)];
		case "quote":
			return [panel(block.blocks.flatMap(blockContent), QUOTE)];
		case "code":
			return [codeContent(block.text)];
		case "table":
			return block.rows.length > 0 ? [tableContent(block.rows)] : [];
		case "image":
			return imageContent(block.src, block.width);
		case "rule":
			return [
				{
					canvas: [
						{
							type: "line",
							x1: 0,
							y1: 0,
							x2: TEXT_WIDTH,
							y2: 0,
							lineWidth: 0.5,
							lineColor: RULE,
						},
					],
					margin: [0, 8, 0, 8],
				},
			];
		default:
			return [];
	}
}

export function documentPdf(
	blocks: Block[],
	title: string,
): TDocumentDefinitions {
	return {
		info: { title },
		pageSize: "A4",
		pageMargins: MARGIN,
		content: blocks.flatMap(blockContent),
		defaultStyle: { font: "Roboto", fontSize: 11, lineHeight: 1.2 },
	};
}
