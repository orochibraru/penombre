import { codeLines, extractComments } from "./format";

/**
 * The Markdown a slide can hold, as HTML. Every piece of text is escaped
 * before any tag is added, and a URL reaches an attribute only through
 * `safeUrl`, so a deck someone shared cannot run script in the viewer's
 * session.
 */

export interface Background {
	/** Already checked by `safeUrl`; set as an attribute, never as HTML. */
	src: string;
	contain: boolean;
}

export interface RenderedSlide {
	html: string;
	backgrounds: Background[];
	/** Marp's `![bg left]`: the pictures take one half, the text the other. */
	split: "left" | "right" | null;
}

interface Block {
	html: string;
	next: number;
}

interface Item {
	indent: number;
	ordered: boolean;
	start: number;
	text: string;
}

const MAX_DEPTH = 8;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/;
const QUOTE = /^ {0,3}> ?/;
const ITEM = /^([ \t]*)([-*+]|\d{1,9}[.)])[ \t]+(.*)$/;
const TABLE_RULE = /^ *\|? *:?-+:? *(?:\| *:?-+:? *)*\|? *$/;
const IMAGE = /!\[([^\]]*)\]\(\s*([^\s)]+)(?:\s+[^)]*)?\)/g;
const LINK = /\[([^\]]+)\]\(\s*([^\s)]+)(?:\s+[^)]*)?\)/g;
const SIZE = /^(w|width|h|height):(\d{1,4})(?:px)?$/;
const HELD = /\0(\d+)\0/g;
const ENTITIES: Record<string, string> = {
	lt: "<",
	gt: ">",
	quot: '"',
	"#39": "'",
	amp: "&",
};

export function escapeHtml(value: string): string {
	return value
		.replace(/\0/g, "�")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function unescapeHtml(value: string): string {
	return value.replace(
		/&(lt|gt|quot|#39|amp);/g,
		(_match, name: string) => ENTITIES[name] ?? "",
	);
}

/**
 * The URL itself when it may be followed or loaded: http(s), relative, and
 * for pictures `data:image/*` (an SVG in an `<img>` runs no script). Anything
 * else (`javascript:`, `data:text/html`, `vbscript:`) is refused.
 */
export function safeUrl(url: string, image: boolean): string | null {
	if (url === "" || /[\0-\x20\x7F]/.test(url)) {
		return null;
	}
	const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url)?.[1]?.toLowerCase();
	if (scheme === undefined || scheme === "http" || scheme === "https") {
		return url;
	}
	if (!image && scheme === "mailto") {
		return url;
	}
	return image && /^data:image\/[\w.+-]+[;,]/i.test(url) ? url : null;
}

function picture(alt: string, src: string): string {
	const words: string[] = [];
	let size = "";
	for (const word of alt.split(/\s+/).filter(Boolean)) {
		const match = SIZE.exec(word);
		if (match) {
			size += ` ${match[1]?.startsWith("w") ? "width" : "height"}="${match[2]}"`;
		} else {
			words.push(word);
		}
	}
	const text = words.join(" ");
	return safeUrl(unescapeHtml(src), true)
		? `<img src="${src}" alt="${text}"${size}>`
		: text;
}

function emphasis(text: string): string {
	return text
		.replace(/~~(\S(?:.*?\S)?)~~/g, "<del>$1</del>")
		.replace(/\*\*(\S(?:.*?\S)?)\*\*/g, "<strong>$1</strong>")
		.replace(/(^|\W)__(\S(?:.*?\S)?)__(?!\w)/g, "$1<strong>$2</strong>")
		.replace(/\*(\S(?:.*?\S)?)\*/g, "<em>$1</em>")
		.replace(/(^|\W)_(\S(?:.*?\S)?)_(?!\w)/g, "$1<em>$2</em>");
}

/** One line of inline Markdown. Tags are held aside so emphasis never reaches into one. */
export function renderInline(raw: string): string {
	const held: string[] = [];
	const hold = (html: string) => `\0${held.push(html) - 1}\0`;
	let text = escapeHtml(raw)
		.replace(/(`+)(.+?)\1/g, (_match, _fence, code: string) =>
			hold(`<code>${code.trim()}</code>`),
		)
		.replace(/\\([\\`*_{}[\]()#+.!~|-])/g, (_match, char: string) => hold(char))
		.replace(IMAGE, (_match, alt: string, src: string) =>
			hold(picture(alt, src)),
		)
		.replace(LINK, (_match, label: string, href: string) =>
			safeUrl(unescapeHtml(href), false)
				? `${hold(`<a href="${href}" target="_blank" rel="noopener noreferrer">`)}${label}${hold("</a>")}`
				: label,
		);
	text = emphasis(text);
	while (text.includes("\0")) {
		text = text.replace(
			HELD,
			(_match, index: string) => held[Number(index)] ?? "",
		);
	}
	return text;
}

function inlineLines(text: string): string {
	return text.split("\n").map(renderInline).join("<br>");
}

function fenced(lines: string[], at: number): Block | null {
	const marker = FENCE.exec(lines[at] ?? "")?.[1];
	if (!marker) {
		return null;
	}
	let end = at + 1;
	while (end < lines.length) {
		const line = (lines[end] ?? "").trim();
		if (
			line.length >= marker.length &&
			line === (marker[0] ?? "").repeat(line.length)
		) {
			break;
		}
		end++;
	}
	const code = lines.slice(at + 1, end).join("\n");
	return {
		html: `<pre><code>${escapeHtml(code)}</code></pre>`,
		next: end + 1,
	};
}

function heading(lines: string[], at: number): Block | null {
	const match = HEADING.exec(lines[at] ?? "");
	if (!match) {
		return null;
	}
	const level = match[1]?.length ?? 1;
	return {
		html: `<h${level}>${renderInline(match[2] ?? "")}</h${level}>`,
		next: at + 1,
	};
}

function quote(lines: string[], at: number, depth: number): Block | null {
	let end = at;
	while (end < lines.length && QUOTE.test(lines[end] ?? "")) {
		end++;
	}
	if (end === at) {
		return null;
	}
	const inner = lines.slice(at, end).map((line) => line.replace(QUOTE, ""));
	const body =
		depth < MAX_DEPTH
			? blocks(inner, depth + 1)
			: `<p>${inlineLines(inner.join("\n"))}</p>`;
	return { html: `<blockquote>${body}</blockquote>`, next: end };
}

function cells(line: string): string[] {
	let row = line.trim();
	if (row.startsWith("|")) {
		row = row.slice(1);
	}
	if (row.endsWith("|") && !row.endsWith("\\|")) {
		row = row.slice(0, -1);
	}
	// Split on unescaped pipes; lookbehind is missing from older iOS WebViews.
	return row
		.replace(/\\\|/g, "\u0001")
		.split("|")
		.map((cell) => cell.replaceAll("\u0001", "\\|").trim());
}

function alignment(rule: string): string {
	if (rule.startsWith(":") && rule.endsWith(":")) {
		return ' class="deck-align-center"';
	}
	if (rule.endsWith(":")) {
		return ' class="deck-align-right"';
	}
	return "";
}

function table(lines: string[], at: number): Block | null {
	const head = lines[at] ?? "";
	const rule = lines[at + 1];
	if (!head.includes("|") || rule === undefined || !TABLE_RULE.test(rule)) {
		return null;
	}
	const aligns = cells(rule).map(alignment);
	const header = cells(head);
	if (header.length !== aligns.length) {
		return null;
	}
	let end = at + 2;
	const rows: string[][] = [];
	while (end < lines.length && (lines[end] ?? "").includes("|")) {
		rows.push(cells(lines[end] ?? ""));
		end++;
	}
	const row = (values: string[], tag: string) =>
		`<tr>${aligns
			.map(
				(align, index) =>
					`<${tag}${align}>${renderInline(values[index] ?? "")}</${tag}>`,
			)
			.join("")}</tr>`;
	return {
		html: `<table><thead>${row(header, "th")}</thead><tbody>${rows
			.map((values) => row(values, "td"))
			.join("")}</tbody></table>`,
		next: end,
	};
}

function indentOf(whitespace: string): number {
	return whitespace.replace(/\t/g, "    ").length;
}

/** List lines from `at`: items, their indented continuations, blank lines between items. */
function listItems(lines: string[], at: number): [Item[], number] {
	const items: Item[] = [];
	let end = at;
	while (end < lines.length) {
		const line = lines[end] ?? "";
		const match = ITEM.exec(line);
		const last = items.at(-1);
		if (match) {
			const marker = match[2] ?? "-";
			items.push({
				indent: indentOf(match[1] ?? ""),
				ordered: /\d/.test(marker),
				start: Number.parseInt(marker, 10) || 1,
				text: match[3] ?? "",
			});
		} else if (last && line.trim() && /^[ \t]/.test(line)) {
			last.text += `\n${line.trim()}`;
		} else if (!line.trim() && ITEM.test(lines[end + 1] ?? "")) {
			// A blank line between two items keeps the list going.
		} else {
			break;
		}
		end++;
	}
	return [items, end];
}

/** Nesting from indentation, with a stack rather than recursion so depth is capped. */
function list(lines: string[], at: number): Block | null {
	const [items, next] = listItems(lines, at);
	if (items.length === 0) {
		return null;
	}
	const stack: { indent: number; tag: string }[] = [];
	let html = "";
	for (const item of items) {
		const tag = item.ordered ? "ol" : "ul";
		const open = `<${tag}${item.ordered && item.start !== 1 ? ` start="${item.start}"` : ""}><li>`;
		while ((stack.at(-1)?.indent ?? -1) > item.indent && stack.length > 1) {
			html += `</li></${stack.pop()?.tag}>`;
		}
		const top = stack.at(-1);
		if (!top || (item.indent > top.indent && stack.length < MAX_DEPTH)) {
			stack.push({ indent: item.indent, tag });
			html += open;
		} else if (top.tag === tag) {
			html += "</li><li>";
		} else {
			html += `</li></${top.tag}>${open}`;
			top.tag = tag;
		}
		html += inlineLines(item.text);
	}
	while (stack.length > 0) {
		html += `</li></${stack.pop()?.tag}>`;
	}
	return { html, next };
}

function startsBlock(line: string): boolean {
	return (
		FENCE.test(line) ||
		HEADING.test(line) ||
		QUOTE.test(line) ||
		ITEM.test(line)
	);
}

/** Lines of a paragraph break with `<br>`, as Marp renders them. */
function paragraph(lines: string[], at: number): Block {
	let end = at + 1;
	while (
		end < lines.length &&
		(lines[end] ?? "").trim() &&
		!startsBlock(lines[end] ?? "")
	) {
		end++;
	}
	const text = lines
		.slice(at, end)
		.map((line) => line.trim())
		.join("\n");
	return { html: `<p>${inlineLines(text)}</p>`, next: end };
}

function blocks(lines: string[], depth = 0): string {
	let html = "";
	let at = 0;
	while (at < lines.length) {
		if (!(lines[at] ?? "").trim()) {
			at++;
			continue;
		}
		const block =
			fenced(lines, at) ??
			heading(lines, at) ??
			quote(lines, at, depth) ??
			table(lines, at) ??
			list(lines, at) ??
			paragraph(lines, at);
		html += block.html;
		at = block.next;
	}
	return html;
}

/** `![bg](…)` pictures, which are the slide's background rather than its content. */
function takeBackgrounds(lines: string[]): {
	lines: string[];
	backgrounds: Background[];
	split: RenderedSlide["split"];
} {
	const code = codeLines(lines);
	const backgrounds: Background[] = [];
	let split: RenderedSlide["split"] = null;
	const kept = lines.flatMap((line, index) => {
		if (code[index]) {
			return [line];
		}
		const rest = line.replace(IMAGE, (match, alt: string, src: string) => {
			const words = alt.trim().split(/\s+/);
			if (!words.includes("bg")) {
				return match;
			}
			const url = safeUrl(src, true);
			if (url) {
				backgrounds.push({
					src: url,
					contain: words.includes("contain") || words.includes("fit"),
				});
			}
			const side = words.find((word) =>
				/^(?:left|right)(?::\d+%)?$/.test(word),
			);
			if (side) {
				split = side.startsWith("left") ? "left" : "right";
			}
			return "";
		});
		return rest !== line && !rest.trim() ? [] : [rest];
	});
	return { lines: kept, backgrounds, split };
}

export function renderSlide(body: string): RenderedSlide {
	const text = extractComments(body).text.replace(/<!--\s*fit\s*-->/g, "");
	const { lines, backgrounds, split } = takeBackgrounds(text.split("\n"));
	return { html: blocks(lines), backgrounds, split };
}
