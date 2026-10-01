import { defineBasicExtension } from "prosekit/basic";
import {
	defineCommands,
	defineDocChangeHandler,
	defineKeymap,
	defineMarkSpec,
	defineNodeAttr,
	defineUpdateHandler,
	type Editor,
	findParentNodeOfType,
	isApple,
	toggleMark,
	union,
} from "prosekit/core";
import { defineBackgroundColor } from "prosekit/extensions/background-color";
import { defineFontFamily } from "prosekit/extensions/font-family";
import { dedentList, indentList } from "prosekit/extensions/list";
import {
	defineSearchCommands,
	defineSearchQuery,
} from "prosekit/extensions/search";
import { defineSubscript } from "prosekit/extensions/subscript";
import { defineSuperscript } from "prosekit/extensions/superscript";
import {
	defineTextAlignCommands,
	defineTextAlignKeymap,
} from "prosekit/extensions/text-align";
import { defineTextColor } from "prosekit/extensions/text-color";
import type { Attrs, Mark, ProseMirrorNode } from "prosekit/pm/model";
import type { Command, EditorState } from "prosekit/pm/state";
import { defineCodeBlockExtras } from "./code-block";
import { nextIndent, points } from "./document-format";

/**
 * The document editor's schema and commands, on top of ProseKit's basics.
 *
 * Everything a paragraph carries — alignment, line spacing, indent — is an
 * attribute with a null default, so a paragraph nobody formatted writes no
 * `style` at all. ProseKit's own `defineTextAlign` stamps `text-align:left`
 * on every one.
 */

const BLOCKS = ["paragraph", "heading"];

function blockAttr(
	attr: string,
	property: string,
	parse: (value: string) => string | null,
) {
	return BLOCKS.map((type) =>
		defineNodeAttr<string, string, string | null>({
			type,
			attr,
			default: null,
			splittable: true,
			toDOM: (value) => (value ? ["style", `${property}:${value};`] : null),
			parseDOM: (node): string | null =>
				parse(node.style.getPropertyValue(property)),
		}),
	);
}

const lineHeight = (value: string): string | null =>
	/^[\d.]+$/.test(value) && Number(value) > 0 ? value : null;

/** Sizes in points, which is what a `.docx` counts in (half-points, really). */
function defineFontSize() {
	return defineMarkSpec<"fontSize", { size: string }>({
		name: "fontSize",
		attrs: { size: { validate: "string" } },
		parseDOM: [
			{
				tag: ':where([style*="font-size:"], [data-font-size])',
				getAttrs: (node: HTMLElement) => {
					const size = points(
						node.getAttribute("data-font-size") ?? node.style.fontSize,
					);
					return size ? { size } : false;
				},
				consuming: false,
			},
		],
		toDOM: (mark) => [
			"span",
			{
				style: `font-size: ${mark.attrs.size};`,
				"data-font-size": mark.attrs.size,
			},
			0,
		],
	});
}

/**
 * Set a valued mark (font, size, colour) or clear it with null. With a caret
 * it becomes what the next keystroke types, as in every word processor;
 * ProseKit's own `addMark` does nothing without a range.
 */
export function setMark(type: string, attrs: Attrs | null): Command {
	return (state, dispatch) => {
		const markType = state.schema.marks[type];
		if (!markType) {
			return false;
		}
		if (dispatch) {
			const { tr } = state;
			const mark = attrs ? markType.create(attrs) : null;
			// Even an empty mark step drops the stored marks, so a caret gets none.
			if (state.selection.empty) {
				tr.removeStoredMark(markType);
				if (mark) {
					tr.addStoredMark(mark);
				}
			} else {
				for (const { $from, $to } of state.selection.ranges) {
					tr.removeMark($from.pos, $to.pos, markType);
					if (mark) {
						tr.addMark($from.pos, $to.pos, mark);
					}
				}
			}
			dispatch(tr);
		}
		return true;
	};
}

/** Every mark but links: clearing formatting should not unlink text. */
export function clearFormatting(): Command {
	return (state, dispatch) => {
		if (dispatch) {
			const { tr } = state;
			const kept = (mark: Mark) => mark.type.name === "link";
			if (state.selection.empty) {
				tr.setStoredMarks(state.selection.$from.marks().filter(kept));
			}
			for (const type of Object.values(state.schema.marks)) {
				for (const { $from, $to } of state.selection.ranges) {
					if (type.name !== "link" && $from.pos < $to.pos) {
						tr.removeMark($from.pos, $to.pos, type);
					}
				}
			}
			dispatch(tr);
		}
		return true;
	};
}

/** The attribute every selected paragraph and heading takes. */
function setBlockAttr(
	attr: string,
	value: (current: string | null) => string | null,
): Command {
	return (state, dispatch) => {
		const { from, to } = state.selection;
		const targets: [number, ProseMirrorNode][] = [];
		state.doc.nodesBetween(from, to, (node, pos) => {
			if (BLOCKS.includes(node.type.name)) {
				targets.push([pos, node]);
			}
		});
		if (targets.length === 0) {
			return false;
		}
		if (dispatch) {
			const { tr } = state;
			for (const [pos, node] of targets) {
				tr.setNodeAttribute(pos, attr, value(node.attrs[attr] ?? null));
			}
			dispatch(tr);
		}
		return true;
	};
}

const inList = (state: EditorState): boolean =>
	findParentNodeOfType("list", state.selection.$from) !== undefined;

/** A list item moves a level; anything else moves to the next indent stop. */
export function shiftIndent(direction: 1 | -1): Command {
	return (state, dispatch, view) => {
		if (inList(state)) {
			const command = direction > 0 ? indentList() : dedentList();
			return command(state, dispatch, view);
		}
		return setBlockAttr("indent", (current) => nextIndent(current, direction))(
			state,
			dispatch,
			view,
		);
	};
}

export function hasHeaderRow(state: EditorState): boolean {
	const table = findParentNodeOfType("table", state.selection.$from);
	const row = table?.node.firstChild;
	let header = row !== null && row !== undefined && row.childCount > 0;
	row?.forEach((cell) => {
		header &&= cell.type.name === "tableHeaderCell";
	});
	return header;
}

/** The first row between header and body cells, as Google Docs pins it. */
export function toggleHeaderRow(): Command {
	return (state, dispatch) => {
		const table = findParentNodeOfType("table", state.selection.$from);
		const row = table?.node.firstChild;
		const { tableCell, tableHeaderCell } = state.schema.nodes;
		if (!(table && row && tableCell && tableHeaderCell)) {
			return false;
		}
		if (dispatch) {
			const type = hasHeaderRow(state) ? tableCell : tableHeaderCell;
			const { tr } = state;
			// The table opens at `pos`, its first row one further, the cells one more.
			row.forEach((cell, offset) => {
				tr.setNodeMarkup(table.pos + 2 + offset, type, cell.attrs);
			});
			dispatch(tr);
		}
		return true;
	};
}

/** The value of a valued mark where the selection starts, for the toolbar. */
export function markValue(
	state: EditorState,
	type: string,
	attr: string,
): string | null {
	const marks = state.storedMarks ?? state.selection.$from.marks();
	const value: unknown = marks.find((mark) => mark.type.name === type)?.attrs[
		attr
	];
	return typeof value === "string" ? value : null;
}

/** An attribute of the block the selection starts in. */
export function blockValue(state: EditorState, attr: string): string | null {
	const value: unknown = state.selection.$from.parent.attrs[attr];
	return typeof value === "string" ? value : null;
}

const run =
	(action: () => void): Command =>
	() => {
		action();
		return true;
	};

export interface DocumentHandlers {
	onDocChange: (doc: ProseMirrorNode) => void;
	onUpdate: () => void;
	/** Keys the page answers itself: find, link, print. */
	keys: Record<string, () => void>;
}

function defineFormatting() {
	return union([
		...blockAttr("textAlign", "text-align", (value) => value || null),
		...blockAttr("lineHeight", "line-height", lineHeight),
		...blockAttr("indent", "margin-left", points),
		defineTextAlignCommands(BLOCKS),
		defineTextAlignKeymap(BLOCKS),
		defineFontFamily(),
		defineFontSize(),
		// Background first: its span then wraps a colour's, which is what
		// lets the page force dark text on a highlight without overriding
		// a colour the text was actually given.
		defineBackgroundColor(),
		defineTextColor(),
		defineSuperscript(),
		defineSubscript(),
		defineSearchQuery(),
		defineSearchCommands(),
		defineCommands({
			setMark,
			clearFormatting,
			shiftIndent,
			toggleHeaderRow,
			setLineHeight: (value: string | null) =>
				setBlockAttr("lineHeight", () => value),
		}),
		defineKeymap({
			"Mod-\\": clearFormatting(),
			"Mod-]": shiftIndent(1),
			"Mod-[": shiftIndent(-1),
			"Mod-.": toggleMark({ type: "superscript" }),
			"Mod-,": toggleMark({ type: "subscript" }),
		}),
	]);
}

export function defineDocumentExtension(handlers: DocumentHandlers) {
	return union([
		defineBasicExtension(),
		defineCodeBlockExtras(),
		defineFormatting(),
		defineKeymap(
			Object.fromEntries(
				Object.entries(handlers.keys)
					.filter(([key]) => !(isApple && key === "Ctrl-h"))
					.map(([key, action]) => [key, run(action)]),
			),
		),
		defineDocChangeHandler((view) => handlers.onDocChange(view.state.doc)),
		defineUpdateHandler(() => handlers.onUpdate()),
	]);
}

export type DocumentEditor = Editor<ReturnType<typeof defineDocumentExtension>>;
