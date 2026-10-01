import { encodeXml } from "../xml";
import { type Block, type Cell, type List, type Run, runsText } from "./model";

/**
 * A document's blocks as Markdown, plain text and a standalone HTML page.
 * Markdown is CommonMark with GitHub's tables, task lists and strikethrough;
 * what it has no syntax for (underline, colours, fonts) is left out.
 */

/** Rows with spans spread over the cells they cover, as text. */
function grid(rows: Cell[][], text: (cell: Cell) => string): string[][] {
	const out: string[][] = rows.map(() => []);
	rows.forEach((row, r) => {
		let column = 0;
		for (const cell of row) {
			while (out[r]?.[column] !== undefined) {
				column++;
			}
			for (let dr = 0; dr < cell.rowspan && r + dr < rows.length; dr++) {
				for (let dc = 0; dc < cell.colspan; dc++) {
					(out[r + dr] as string[])[column + dc] =
						dr === 0 && dc === 0 ? text(cell) : "";
				}
			}
			column += cell.colspan;
		}
	});
	const width = Math.max(1, ...out.map((row) => row.length));
	return out.map((row) =>
		Array.from({ length: width }, (_, index) => row[index] ?? ""),
	);
}

const listMarker = (list: List, index: number, checked?: boolean): string => {
	if (list.kind === "ordered") {
		return `${index + 1}.`;
	}
	return list.kind === "task" ? `- [${checked ? "x" : " "}]` : "-";
};

/** Continuation lines of a list item line up under its text. */
const indented = (text: string, pad: string): string =>
	text.replace(/\n(?=.)/g, `\n${pad}`);

// =========================================================================
// Markdown
// =========================================================================

const escapeMarkdown = (text: string): string =>
	text.replace(/[\\`*_[\]<>~]/g, "\\$&");

/** Emphasis markers must touch the text, so edge spaces go outside them. */
function wrap(text: string, open: string, close = open): string {
	const [, lead = "", core = "", trail = ""] =
		/^(\s*)([\s\S]*?)(\s*)$/.exec(text) ?? [];
	return core ? `${lead}${open}${core}${close}${trail}` : text;
}

function codeSpan(text: string): string {
	const flat = text.replace(/\n/g, " ");
	return flat.includes("`") ? `\`\` ${flat} \`\`` : `\`${flat}\``;
}

function runMarkdown(run: Run): string {
	const { marks } = run;
	let text = marks.code
		? codeSpan(run.text)
		: escapeMarkdown(run.text).replace(/\n/g, "\\\n");
	if (marks.strike) {
		text = wrap(text, "~~");
	}
	if (marks.italic) {
		text = wrap(text, "*");
	}
	if (marks.bold) {
		text = wrap(text, "**");
	}
	if (marks.sup || marks.sub) {
		const tag = marks.sup ? "sup" : "sub";
		text = `<${tag}>${text}</${tag}>`;
	}
	const href = marks.link?.replace(/[<>]/g, encodeURIComponent);
	return href ? `[${text}](<${href}>)` : text;
}

/** A paragraph that starts like a heading, quote or list item must not become one. */
const inlineMarkdown = (runs: Run[]): string =>
	runs
		.map(runMarkdown)
		.join("")
		.replace(/^(\s*)([#+-]|\d+\.)(?=\s)/, "$1\\$2");

function fence(text: string): string {
	const longest = Math.max(
		2,
		...(text.match(/`+/g) ?? []).map((run) => run.length),
	);
	return "`".repeat(longest + 1);
}

function tableMarkdown(rows: Cell[][]): string {
	const cellText = (cell: Cell) =>
		cell.blocks
			.map(blockMarkdown)
			.join("<br>")
			.replace(/\n/g, "<br>")
			.replace(/\|/g, "\\|");
	const [head = [], ...body] = grid(rows, cellText);
	const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
	return [line(head), line(head.map(() => "---")), ...body.map(line)].join(
		"\n",
	);
}

function blockMarkdown(block: Block): string {
	switch (block.type) {
		case "heading":
			return `${"#".repeat(block.level)} ${inlineMarkdown(block.runs)}`;
		case "paragraph":
			return inlineMarkdown(block.runs);
		case "list":
			return block.items
				.map((item, index) => {
					const marker = listMarker(block, index, item.checked);
					const pad = " ".repeat(
						block.kind === "ordered" ? marker.length + 1 : 2,
					);
					// A nested list follows its item's text directly, keeping it tight.
					const body = item.blocks
						.map((child, at) =>
							at > 0 && child.type !== "list"
								? `\n${blockMarkdown(child)}`
								: blockMarkdown(child),
						)
						.join("\n");
					return `${marker} ${indented(body, pad)}`;
				})
				.join("\n");
		case "quote":
			return block.blocks
				.map(blockMarkdown)
				.join("\n\n")
				.split("\n")
				.map((line) => (line ? `> ${line}` : ">"))
				.join("\n");
		case "code": {
			const marks = fence(block.text);
			return `${marks}${block.language}\n${block.text.replace(/\n$/, "")}\n${marks}`;
		}
		case "table":
			return block.rows.length > 0 ? tableMarkdown(block.rows) : "";
		case "image":
			return `![](${block.src})`;
		case "rule":
			return "---";
		default:
			return "";
	}
}

export function toMarkdown(blocks: Block[]): string {
	// An empty paragraph is spacing on a page; in Markdown it is nothing.
	const parts = blocks.map(blockMarkdown).filter((part) => part !== "");
	return `${parts.join("\n\n").trim()}\n`;
}

// =========================================================================
// Plain text
// =========================================================================

function blockText(block: Block): string {
	switch (block.type) {
		case "heading":
		case "paragraph":
			return runsText(block.runs);
		case "list":
			return block.items
				.map((item, index) => {
					const marker =
						block.kind === "task"
							? `[${item.checked ? "x" : " "}]`
							: listMarker(block, index);
					const body = item.blocks.map(blockText).join("\n");
					return `${marker} ${indented(body, " ".repeat(marker.length + 1))}`;
				})
				.join("\n");
		case "quote":
			return indented(`  ${block.blocks.map(blockText).join("\n\n")}`, "  ");
		case "code":
			return block.text.replace(/\n$/, "");
		case "table":
			return grid(block.rows, (cell) =>
				cell.blocks.map(blockText).join(" ").replace(/\s+/g, " "),
			)
				.map((row) => row.join("\t"))
				.join("\n");
		default:
			return "";
	}
}

export function toText(blocks: Block[]): string {
	const parts = blocks.map(blockText).filter((part) => part !== "");
	return `${parts.join("\n\n")}\n`;
}

// =========================================================================
// HTML
// =========================================================================

const attribute = (value: string): string =>
	encodeXml(value).replace(/"/g, "&quot;");

function runHtml(run: Run): string {
	const { marks } = run;
	let html = encodeXml(run.text).replace(/\n/g, "<br>");
	for (const [on, tag] of [
		[marks.code, "code"],
		[marks.sub, "sub"],
		[marks.sup, "sup"],
		[marks.strike, "s"],
		[marks.underline, "u"],
		[marks.italic, "em"],
		[marks.bold, "strong"],
	] as const) {
		if (on) {
			html = `<${tag}>${html}</${tag}>`;
		}
	}
	const style = [
		marks.font ? `font-family: ${JSON.stringify(marks.font)}` : "",
		marks.size ? `font-size: ${marks.size}pt` : "",
		marks.color ? `color: ${marks.color}` : "",
		marks.background ? `background-color: ${marks.background}` : "",
	].filter(Boolean);
	if (style.length > 0) {
		html = `<span style="${attribute(style.join("; "))}">${html}</span>`;
	}
	return marks.link ? `<a href="${attribute(marks.link)}">${html}</a>` : html;
}

const runsHtml = (runs: Run[]): string => runs.map(runHtml).join("");

function styleAttribute(block: {
	align?: string;
	lineHeight?: number;
	indent?: number;
}): string {
	const rules = [
		block.align ? `text-align: ${block.align}` : "",
		block.lineHeight ? `line-height: ${block.lineHeight}` : "",
		block.indent ? `margin-left: ${block.indent}pt` : "",
	].filter(Boolean);
	return rules.length > 0 ? ` style="${rules.join("; ")}"` : "";
}

function tableHtml(rows: Cell[][]): string {
	const cell = (item: Cell) => {
		const tag = item.header ? "th" : "td";
		const spans =
			(item.colspan > 1 ? ` colspan="${item.colspan}"` : "") +
			(item.rowspan > 1 ? ` rowspan="${item.rowspan}"` : "");
		return `<${tag}${spans}>${item.blocks.map(blockHtml).join("")}</${tag}>`;
	};
	const body = rows.map((row) => `<tr>${row.map(cell).join("")}</tr>`);
	return `<table><tbody>${body.join("")}</tbody></table>`;
}

function listHtml(list: List): string {
	const tag = list.kind === "ordered" ? "ol" : "ul";
	const items = list.items.map((item) => {
		const box =
			list.kind === "task"
				? `<input type="checkbox" disabled${item.checked ? " checked" : ""}> `
				: "";
		return `<li>${box}${item.blocks.map(blockHtml).join("")}</li>`;
	});
	const kind = list.kind === "task" ? ' class="tasks"' : "";
	return `<${tag}${kind}>${items.join("")}</${tag}>`;
}

function blockHtml(block: Block): string {
	switch (block.type) {
		case "heading":
			return `<h${block.level}${styleAttribute(block)}>${runsHtml(block.runs)}</h${block.level}>`;
		case "paragraph":
			return `<p${styleAttribute(block)}>${runsHtml(block.runs)}</p>`;
		case "list":
			return listHtml(block);
		case "quote":
			return `<blockquote>${block.blocks.map(blockHtml).join("")}</blockquote>`;
		case "code": {
			const language = block.language
				? ` class="language-${attribute(block.language)}"`
				: "";
			return `<pre><code${language}>${encodeXml(block.text)}</code></pre>`;
		}
		case "table":
			return tableHtml(block.rows);
		case "image":
			return `<img src="${attribute(block.src)}" alt="">`;
		case "rule":
			return "<hr>";
		default:
			return "";
	}
}

const PAGE_CSS =
	"body{font:16px/1.5 system-ui,sans-serif;max-width:48rem;margin:2rem auto;padding:0 1rem;color:#111}" +
	"pre{background:#f3f4f6;padding:.75rem;overflow:auto}code{font-family:ui-monospace,monospace}" +
	"img{max-width:100%}table{border-collapse:collapse}td,th{border:1px solid #bbb;padding:.25rem .5rem}" +
	"blockquote{border-left:3px solid #bbb;margin-left:0;padding-left:1rem;color:#444}" +
	"ul.tasks{list-style:none;padding-left:1rem}";

/** A page that opens on its own, in any browser, with nothing to fetch. */
export function toHtmlPage(blocks: Block[], title: string): string {
	return `<!doctype html>\n<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${encodeXml(title)}</title><style>${PAGE_CSS}</style></head><body>\n${blocks.map(blockHtml).join("\n")}\n</body></html>\n`;
}
