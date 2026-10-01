import { cssColor, type Palette } from "#lib/slides/color.js";
import type { Paragraph, Run, TextBody, Theme } from "#lib/slides/model.js";
import { normalizeRuns, type Pos } from "#lib/slides/rich-text.js";
import {
	bulletFont,
	bulletLabels,
	effectiveParagraph,
	effectiveRun,
	fontStack,
} from "#lib/slides/text.js";

/**
 * A text body as DOM, and back.
 *
 * Built by hand rather than by Svelte because the same nodes become
 * `contenteditable` when the box is edited, and the browser then rewrites
 * them: a framework holding references to text nodes the user just typed
 * over would fight it. View and edit mode share this one builder, so a box
 * looks identical in both.
 *
 * Every run's span says which run it came from (`data-run="p:r"`), which is
 * how whatever the browser did while typing is read back into runs.
 */

export interface TextContext {
	theme: Theme;
	palette: Palette;
	/** Shown in an empty placeholder while editing a slide. */
	prompt?: string;
}

const EMU_PER_PT = 12_700;
const px = (emu: number) => `${Math.round((emu / EMU_PER_PT) * 100) / 100}px`;

function cssString(value: string): string {
	return `"${value.replace(/["\\]/g, "\\$&")}"`;
}

function runStyle(
	run: ReturnType<typeof effectiveRun>,
	context: TextContext,
): string {
	const decoration = [
		run.underline ? "underline" : "",
		run.strike ? "line-through" : "",
	].filter(Boolean);
	const size = run.baseline ? run.size * 0.66 : run.size;
	return [
		`font-family:${fontStack(run.font, context.theme)}`,
		`font-size:calc(${size}px * var(--fs, 1))`,
		`font-weight:${run.bold ? 700 : 400}`,
		`font-style:${run.italic ? "italic" : "normal"}`,
		`color:${cssColor(run.color, context.palette)}`,
		decoration.length > 0 ? `text-decoration-line:${decoration.join(" ")}` : "",
		run.spacing ? `letter-spacing:${run.spacing / 100}px` : "",
		run.caps === "all"
			? "text-transform:uppercase"
			: run.caps === "small"
				? "font-variant:small-caps"
				: "",
		run.baseline ? `vertical-align:${run.baseline > 0 ? "super" : "sub"}` : "",
	]
		.filter(Boolean)
		.join(";");
}

function paragraphNode(
	body: TextBody,
	index: number,
	label: string | null,
	context: TextContext,
): HTMLElement {
	const paragraph = body.paragraphs[index] as Paragraph;
	const style = effectiveParagraph(paragraph, body);
	const block = document.createElement("div");
	block.dataset.p = String(index);
	const end = effectiveRun({ size: paragraph.endSize }, style, {
		...body,
		fontScale: undefined,
	});
	const spacing =
		((style.lineSpacing ?? 100) / 100) * (1 - (body.lineReduction ?? 0));
	const align = { l: "left", ctr: "center", r: "right", just: "justify" }[
		style.align ?? "l"
	];
	block.style.cssText = [
		`text-align:${align}`,
		`padding-left:${px(style.marL ?? 0)}`,
		`text-indent:${px(style.indent ?? 0)}`,
		`line-height:${Math.round(spacing * 120) / 100}`,
		index > 0 && style.spaceBefore
			? `margin-top:calc(${style.spaceBefore}px * var(--fs, 1))`
			: "",
		style.spaceAfter
			? `margin-bottom:calc(${style.spaceAfter}px * var(--fs, 1))`
			: "",
		runStyle(end, context),
	]
		.filter(Boolean)
		.join(";");
	if (label) {
		const bullet = style.bullet;
		const color =
			bullet?.type === "char" && bullet.color ? bullet.color : end.color;
		const font =
			(bullet?.type === "char" && bulletFont(bullet.font)) || end.font;
		block.dataset.bullet = "";
		block.style.setProperty("--b", cssString(label));
		block.style.setProperty("--bc", cssColor(color, context.palette));
		block.style.setProperty("--bf", fontStack(font, context.theme));
		block.style.setProperty("--bw", px(Math.max(0, -(style.indent ?? 0))));
	}
	paragraph.runs.forEach((run, r) => {
		const span = document.createElement("span");
		span.dataset.run = `${index}:${r}`;
		span.style.cssText = runStyle(
			effectiveRun(run, style, { ...body, fontScale: undefined }),
			context,
		);
		span.textContent = run.text;
		block.append(span);
	});
	if (paragraph.runs.every((run) => run.text === "")) {
		block.append(document.createElement("br"));
	}
	return block;
}

/** Fill `root` with the body's paragraphs, replacing what was there. */
export function buildText(
	root: HTMLElement,
	body: TextBody,
	context: TextContext,
): void {
	const labels = bulletLabels(body);
	const empty = body.paragraphs.every((paragraph) =>
		paragraph.runs.every((run) => run.text === ""),
	);
	const [l, t, r, b] = body.inset;
	root.style.padding = `${px(t)} ${px(r)} ${px(b)} ${px(l)}`;
	root.style.justifyContent =
		body.anchor === "ctr"
			? "center"
			: body.anchor === "b"
				? "flex-end"
				: "flex-start";
	root.style.whiteSpace = body.wrap ? "pre-wrap" : "pre";
	root.style.setProperty("--fs", String(body.fontScale ?? 1));
	if (empty && context.prompt) {
		// Spread, not cloned: the body may be a reactive proxy.
		const shown: TextBody = {
			...body,
			paragraphs: [{ ...body.paragraphs[0], runs: [{ text: context.prompt }] }],
		};
		const block = paragraphNode(shown, 0, null, context);
		block.style.opacity = "0.45";
		delete block.dataset.p;
		root.replaceChildren(block);
		return;
	}
	root.replaceChildren(
		...body.paragraphs.map((_p, index) =>
			paragraphNode(body, index, labels[index] ?? null, context),
		),
	);
}

// =========================================================================
// Reading back
// =========================================================================

function sourceRun(body: TextBody, key: string | undefined): Run | undefined {
	const [p, r] = (key ?? "").split(":").map(Number);
	return body.paragraphs[p ?? -1]?.runs[r ?? -1];
}

function blockRuns(block: Node, body: TextBody): Run[] {
	const runs: Run[] = [];
	let style: Omit<Run, "text"> = {};
	const walk = (node: Node) => {
		if (node.nodeType === Node.TEXT_NODE) {
			const span = (
				node.parentElement as HTMLElement | null
			)?.closest<HTMLElement>("[data-run]");
			const source = sourceRun(body, span?.dataset.run);
			if (source) {
				const { text: _text, ...own } = source;
				style = own;
			}
			runs.push({
				...style,
				text: (node.textContent ?? "").replace(/\u200b/g, ""),
			});
			return;
		}
		if (node.nodeName === "BR") {
			const isLast = node.parentNode === block && node === block.lastChild;
			if (!isLast && node.nextSibling) {
				runs.push({ ...style, text: "\n" });
			}
			return;
		}
		for (const child of node.childNodes) {
			walk(child);
		}
	};
	walk(block);
	return normalizeRuns(runs);
}

/** What the user typed, as paragraphs keyed back to the body the DOM was built from. */
export function readText(root: HTMLElement, body: TextBody): Paragraph[] {
	const paragraphs: Paragraph[] = [];
	let last: Omit<Paragraph, "runs"> = {};
	for (const node of root.childNodes) {
		const block = node as HTMLElement;
		const index =
			block.dataset?.p === undefined ? Number.NaN : Number(block.dataset.p);
		const source = body.paragraphs[index];
		if (source) {
			const { runs: _runs, ...settings } = source;
			last = settings;
		}
		const runs = blockRuns(node, body);
		const paragraph: Paragraph = { ...structuredClone(last), runs };
		if (runs.length > 0) {
			delete paragraph.endSize;
		}
		paragraphs.push(paragraph);
	}
	return paragraphs.length > 0 ? paragraphs : [{ runs: [] }];
}

// =========================================================================
// Selection
// =========================================================================

/** The text length a node contributes, line breaks counting as one. */
function lengthOf(node: Node, block: Node): number {
	if (node.nodeType === Node.TEXT_NODE) {
		return (node.textContent ?? "").replace(/\u200b/g, "").length;
	}
	if (node.nodeName === "BR") {
		return node.parentNode === block && node === block.lastChild ? 0 : 1;
	}
	let total = 0;
	for (const child of node.childNodes) {
		total += lengthOf(child, block);
	}
	return total;
}

function blockOf(root: HTMLElement, node: Node): Node | null {
	let current: Node | null = node;
	while (current && current.parentNode !== root) {
		current = current.parentNode;
	}
	return current;
}

function positionOf(root: HTMLElement, node: Node, offset: number): Pos | null {
	if (node === root) {
		const block = root.childNodes[Math.min(offset, root.childNodes.length - 1)];
		return {
			p: Math.max(0, Math.min(offset, root.childNodes.length - 1)),
			o: offset >= root.childNodes.length && block ? lengthOf(block, block) : 0,
		};
	}
	const block = blockOf(root, node);
	if (!block) {
		return null;
	}
	const p = [...root.childNodes].indexOf(block as ChildNode);
	let count = 0;
	const walk = (current: Node): boolean => {
		if (current === node) {
			if (current.nodeType === Node.TEXT_NODE) {
				count += offset;
			} else {
				for (const child of [...current.childNodes].slice(0, offset)) {
					count += lengthOf(child, block);
				}
			}
			return true;
		}
		if (current.nodeType === Node.TEXT_NODE || current.nodeName === "BR") {
			count += lengthOf(current, block);
			return false;
		}
		return [...current.childNodes].some(walk);
	};
	walk(block);
	return { p, o: count };
}

/** The editor's selection as model positions, start first. */
export function selectionIn(
	root: HTMLElement,
): { start: Pos; end: Pos } | null {
	const selection = root.ownerDocument.getSelection();
	if (!selection || selection.rangeCount === 0) {
		return null;
	}
	const range = selection.getRangeAt(0);
	if (!root.contains(range.startContainer)) {
		return null;
	}
	const start = positionOf(root, range.startContainer, range.startOffset);
	const end = positionOf(root, range.endContainer, range.endOffset);
	return start && end ? { start, end } : null;
}

function locate(root: HTMLElement, pos: Pos): [Node, number] {
	const block = root.childNodes[Math.min(pos.p, root.childNodes.length - 1)];
	if (!block) {
		return [root, 0];
	}
	let left = pos.o;
	let found: [Node, number] | null = null;
	const walk = (node: Node) => {
		if (found) {
			return;
		}
		if (node.nodeType === Node.TEXT_NODE) {
			const length = lengthOf(node, block);
			if (left <= length) {
				found = [node, left];
				return;
			}
			left -= length;
			return;
		}
		if (node.nodeName === "BR") {
			const length = lengthOf(node, block);
			if (left === 0 || length === 0) {
				const parent = node.parentNode as Node;
				found = [parent, [...parent.childNodes].indexOf(node as ChildNode)];
				return;
			}
			left -= length;
			return;
		}
		node.childNodes.forEach(walk);
	};
	walk(block);
	return found ?? [block, block.childNodes.length];
}

export function selectRange(
	root: HTMLElement,
	start: Pos,
	end: Pos = start,
): void {
	const selection = root.ownerDocument.getSelection();
	if (!selection) {
		return;
	}
	const range = root.ownerDocument.createRange();
	const [startNode, startOffset] = locate(root, start);
	const [endNode, endOffset] = locate(root, end);
	range.setStart(startNode, startOffset);
	range.setEnd(endNode, endOffset);
	selection.removeAllRanges();
	selection.addRange(range);
}

/** Everything in the box selected: what "edit this text box" starts from. */
export function selectAll(root: HTMLElement): void {
	const last = root.childNodes.length - 1;
	const block = root.childNodes[last];
	selectRange(
		root,
		{ p: 0, o: 0 },
		{ p: Math.max(0, last), o: block ? lengthOf(block, block) : 0 },
	);
}

/** The largest text scale, in PowerPoint's 2.5 % steps, at which the box's text fits. */
export function fitScale(root: HTMLElement): number {
	const fits = (scale: number) => {
		root.style.setProperty("--fs", String(scale));
		return root.scrollHeight <= root.clientHeight + 1;
	};
	let scale = 1;
	while (scale > 0.25 && !fits(scale)) {
		scale = Math.round((scale - 0.025) * 1000) / 1000;
	}
	return scale;
}
