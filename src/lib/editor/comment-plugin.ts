import { definePlugin, union } from "prosekit/core";
import type { ProseMirrorNode } from "prosekit/pm/model";
import { type EditorState, Plugin, PluginKey } from "prosekit/pm/state";
import { Decoration, DecorationSet, type EditorView } from "prosekit/pm/view";
import {
	flatten,
	locateQuote,
	type TextAnchor,
	type TextRun,
} from "./comments";

/**
 * Comment highlights in a document: the quoted text tinted, and a marker in
 * the page's right margin on its first line.
 *
 * Ranges are found from the quotes when the comments load, then carried
 * through every edit by the transaction's mapping, so a highlight follows
 * its text as the document changes. A range whose text is deleted collapses
 * and is dropped: that comment reads as detached.
 */

export interface CommentRange {
	id: string;
	from: number;
	to: number;
}

interface CommentState {
	ranges: CommentRange[];
	active: string | null;
	set: DecorationSet;
}

interface Meta {
	ranges?: CommentRange[];
	active?: string | null;
}

const key = new PluginKey<CommentState>("comments");

/** The document's text runs, one `block` per paragraph or heading. */
export function docRuns(doc: ProseMirrorNode): TextRun[] {
	const runs: TextRun[] = [];
	let block = -1;
	doc.descendants((node, pos) => {
		if (node.isTextblock) {
			block++;
		} else if (node.isText) {
			runs.push({ text: node.text ?? "", pos, block });
		}
		return true;
	});
	return runs;
}

/** The document range a quote is at now, or null when it is gone. */
export function locateInDoc(
	doc: ProseMirrorNode,
	anchor: TextAnchor,
): { from: number; to: number } | null {
	const flat = flatten(docRuns(doc));
	const found = locateQuote(flat.text, anchor);
	return found
		? { from: flat.toPos(found.start), to: flat.toPos(found.end) }
		: null;
}

function marker(id: string, onOpen: (id: string) => void) {
	return () => {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "comment-marker";
		button.dataset.commentMarker = id;
		button.contentEditable = "false";
		button.setAttribute("aria-hidden", "true");
		button.tabIndex = -1;
		button.addEventListener("mousedown", (event) => event.preventDefault());
		button.addEventListener("click", () => onOpen(id));
		return button;
	};
}

function decorate(
	doc: ProseMirrorNode,
	ranges: CommentRange[],
	active: string | null,
	onOpen: (id: string) => void,
): DecorationSet {
	return DecorationSet.create(
		doc,
		ranges.flatMap((range) => [
			Decoration.inline(range.from, range.to, {
				class:
					range.id === active
						? "comment-mark comment-mark-active"
						: "comment-mark",
			}),
			Decoration.widget(range.from, marker(range.id, onOpen), {
				side: -1,
				key: `comment-${range.id}`,
				ignoreSelection: true,
			}),
		]),
	);
}

export function defineComments(onOpen: (id: string) => void) {
	const plugin = new Plugin<CommentState>({
		key,
		state: {
			init: () => ({
				ranges: [],
				active: null,
				set: DecorationSet.empty,
			}),
			apply(tr, value, _old, state) {
				const meta = tr.getMeta(key) as Meta | undefined;
				let ranges = value.ranges;
				if (tr.docChanged) {
					ranges = ranges
						.map((range) => ({
							...range,
							from: tr.mapping.map(range.from, 1),
							to: tr.mapping.map(range.to, -1),
						}))
						.filter((range) => range.to > range.from);
				}
				ranges = meta?.ranges ?? ranges;
				const active =
					meta && "active" in meta ? (meta.active ?? null) : value.active;
				if (ranges === value.ranges && active === value.active) {
					return value;
				}
				return {
					ranges,
					active,
					set: decorate(state.doc, ranges, active, onOpen),
				};
			},
		},
		props: {
			decorations: (state) => key.getState(state)?.set,
			// A click on commented text opens its thread.
			handleClick(view, pos) {
				const hit = key
					.getState(view.state)
					?.ranges.find((range) => range.from <= pos && pos < range.to);
				if (hit) {
					onOpen(hit.id);
				}
				return false;
			},
		},
	});
	return union([definePlugin(plugin)]);
}

export function setCommentRanges(
	view: EditorView,
	ranges: CommentRange[],
	active: string | null,
): void {
	view.dispatch(
		view.state.tr
			.setMeta(key, { ranges, active } satisfies Meta)
			.setMeta("addToHistory", false),
	);
}

/** Where each highlighted comment is now. */
export function commentRanges(state: EditorState): CommentRange[] {
	return key.getState(state)?.ranges ?? [];
}
