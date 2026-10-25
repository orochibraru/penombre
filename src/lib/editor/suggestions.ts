import {
	defineMarkSpec,
	defineNodeAttr,
	definePlugin,
	union,
} from "prosekit/core";
import type {
	Mark,
	MarkType,
	ProseMirrorNode,
	Schema,
	Slice,
} from "prosekit/pm/model";
import {
	type Command,
	Plugin,
	PluginKey,
	type Selection,
	TextSelection,
	type Transaction,
} from "prosekit/pm/state";
import {
	canJoin,
	type Mappable,
	Mapping,
	ReplaceStep,
} from "prosekit/pm/transform";
import type { EditorView } from "prosekit/pm/view";

import { randomId } from "#lib/utils.js";

import {
	type Change,
	changeAttributes,
	changeOf,
	PARAGRAPH_CHANGE,
	type ParagraphChange,
	parseParagraphChange,
	serializeParagraphChange,
} from "./changes";
import { inkFor } from "./presence";

/**
 * Suggesting mode: tracked changes in the document editor.
 *
 * Text is suggested through two marks, `insertion` and `deletion`, and a
 * paragraph break through the `paragraphChange` attribute of the paragraph
 * it ends (Word's paragraph mark). While someone suggests, every edit is
 * rewritten after the fact by `appendTransaction`: what was typed takes an
 * insertion mark, what was removed is put back with a deletion mark, except
 * the suggester's own pending insertions, which really go. Formatting,
 * pictures, rules, code and table structure are not tracked, but a deletion
 * never takes text with it: an untracked node in it stays where it was.
 */

export interface Author {
	id: string;
	name: string;
}

export const PARAGRAPH_TYPES = new Set(["paragraph", "heading"]);
const ATTR = "paragraphChange";

const key = new PluginKey<State>("suggestions");

const isMine = (change: Change, me: Author): boolean =>
	change.authorId ? change.authorId === me.id : change.author === me.name;

function elementAttributes(node: HTMLElement): Record<string, string> {
	return Object.fromEntries(
		Array.from(node.attributes, (attribute) => [
			attribute.name,
			attribute.value,
		]),
	);
}

function defineChangeMark(name: "insertion" | "deletion") {
	const tag = name === "insertion" ? "ins" : "del";
	return defineMarkSpec<typeof name, Change>({
		name,
		inclusive: false,
		attrs: {
			id: { default: "" },
			author: { default: "" },
			authorId: { default: "" },
			date: { default: "" },
		},
		// Above the strike mark's plain `del`.
		parseDOM: [
			{
				tag: `${tag}[data-suggestion]`,
				priority: 60,
				getAttrs: (node: HTMLElement) =>
					changeOf(elementAttributes(node)) ?? false,
			},
		],
		toDOM: (mark) => {
			const change = mark.attrs as Change;
			return [
				tag,
				{
					...changeAttributes(change),
					class: `suggestion ${inkFor(change.authorId || change.author)}`,
				},
				0,
			];
		},
	});
}

export function defineSuggestionSchema() {
	return union([
		defineChangeMark("insertion"),
		defineChangeMark("deletion"),
		...[...PARAGRAPH_TYPES].map((type) =>
			defineNodeAttr<string, string, ParagraphChange | null>({
				type,
				attr: ATTR,
				default: null,
				// Splitting keeps the original break on the second half.
				splittable: true,
				toDOM: (value) =>
					value ? [PARAGRAPH_CHANGE, serializeParagraphChange(value)] : null,
				parseDOM: (node) =>
					parseParagraphChange(node.getAttribute(PARAGRAPH_CHANGE)),
			}),
		),
	]);
}

function changeMarks(schema: Schema): {
	insertion: MarkType;
	deletion: MarkType;
} {
	const { insertion, deletion } = schema.marks;
	if (!(insertion && deletion)) {
		throw new Error("The suggestion marks are not in the schema");
	}
	return { insertion, deletion };
}

const paragraphChange = (node: ProseMirrorNode): ParagraphChange | null =>
	(node.attrs[ATTR] as ParagraphChange | null | undefined) ?? null;

/** A textblock whose break (its closing token) lies in `[from, to)`. */
function breaksIn(
	doc: ProseMirrorNode,
	from: number,
	to: number,
	each: (node: ProseMirrorNode, pos: number) => void,
): void {
	doc.nodesBetween(from, to, (node, pos) => {
		if (node.isTextblock) {
			const close = pos + node.nodeSize - 1;
			if (close >= from && close < to) {
				each(node, pos);
			}
			return false;
		}
		return true;
	});
}

/**
 * The suggestion an edit at `[from, to]` joins: one of the suggester's own
 * right beside it, so typing on and deleting on make one suggestion.
 */
function adjoining(
	doc: ProseMirrorNode,
	{ from, to }: Range,
	me: Author,
): Change | null {
	const { insertion, deletion } = changeMarks(doc.type.schema);
	const types = new Set([insertion, deletion]);
	const near = [doc.resolve(from).nodeBefore, doc.resolve(to).nodeAfter];
	for (const node of near) {
		const mark = node?.marks.find((each) => types.has(each.type));
		if (mark && isMine(mark.attrs as Change, me)) {
			return mark.attrs as Change;
		}
	}
	return null;
}

/**
 * Whether a deletion needs suggesting: it removes text that can carry the
 * mark and is not the suggester's own pending insertion, or a paragraph
 * break that is not. Code-block text and pictures alone are not tracked.
 */
function needed(
	doc: ProseMirrorNode,
	{ from, to }: Range,
	me: Author,
): boolean {
	const marks = changeMarks(doc.type.schema);
	let found = false;
	doc.nodesBetween(from, to, (node, pos, parent) => {
		if (found) {
			return false;
		}
		if (node.isInline) {
			const inserted = marks.insertion.isInSet(node.marks);
			found =
				(parent?.type.allowsMarkType(marks.deletion) ?? false) &&
				!(inserted && isMine(inserted.attrs as Change, me));
			return false;
		}
		if (node.isTextblock && PARAGRAPH_TYPES.has(node.type.name)) {
			const close = pos + node.nodeSize - 1;
			const change = paragraphChange(node);
			found =
				close >= from &&
				close < to &&
				!(change?.kind === "insert" && isMine(change, me));
		}
		return !found;
	});
	return found;
}

/** Join the textblock ending at `at` with the next, keeping the next's break. */
function joinAt(tr: Transaction, at: number): void {
	const $at = tr.doc.resolve(at);
	const before = $at.nodeBefore;
	const after = $at.nodeAfter;
	if (!(before && after && canJoin(tr.doc, at))) {
		return;
	}
	const start = at - before.nodeSize;
	tr.join(at);
	if (PARAGRAPH_TYPES.has(tr.doc.nodeAt(start)?.type.name ?? "")) {
		tr.setNodeAttribute(start, ATTR, paragraphChange(after));
	}
}

interface Edit {
	at: number;
	run: () => void;
}

interface Range {
	from: number;
	to: number;
}

/** A replace step: what it removed from `before`, where it inserted now. */
interface Replaced extends Range {
	before: ProseMirrorNode;
	step: ReplaceStep;
}

/** Removals and joins, last first, so no position moves under another. */
function applyFromTheEnd(edits: Edit[]): void {
	for (const edit of edits.sort((a, b) => b.at - a.at)) {
		edit.run();
	}
}

/** One person's change, fresh or joining their suggestion beside `range`. */
function changeFor(doc: ProseMirrorNode, range: Range, me: Author): Change {
	return (
		adjoining(doc, range, me) ?? {
			id: randomId(),
			author: me.name,
			authorId: me.id,
			date: new Date().toISOString(),
		}
	);
}

/** What was typed into `[from, to]`, as an insertion suggestion. */
function markInserted(tr: Transaction, { from, to }: Range, change: Change) {
	if (to <= from) {
		return;
	}
	const marks = changeMarks(tr.doc.type.schema);
	tr.removeMark(from, to, marks.deletion);
	tr.addMark(from, to, marks.insertion.create(change));
	breaksIn(tr.doc, from, to, (node, pos) => {
		if (PARAGRAPH_TYPES.has(node.type.name)) {
			tr.setNodeAttribute(pos, ATTR, { kind: "insert", ...change });
		}
	});
}

/**
 * Put a removed slice back at `at`, struck. The suggester's own pending
 * insertions in it really go; what cannot carry the mark (a picture, a
 * divider, code, table structure) comes back as it was, so a deletion
 * never takes text with it unsuggested. Returns where the slice ends.
 */
function restoreStruck(
	tr: Transaction,
	at: number,
	slice: Slice,
	{ me, change }: { me: Author; change: Change },
): number {
	const marks = changeMarks(tr.doc.type.schema);
	const size = tr.doc.content.size;
	tr.replace(at, at, slice);
	const end = at + tr.doc.content.size - size;

	const edits: Edit[] = [];
	tr.doc.nodesBetween(at, end, (node, pos, parent) => {
		if (node.isInline) {
			const start = Math.max(pos, at);
			const stop = Math.min(pos + node.nodeSize, end);
			const inserted = marks.insertion.isInSet(node.marks);
			if (inserted && isMine(inserted.attrs as Change, me)) {
				edits.push({ at: start, run: () => tr.delete(start, stop) });
			} else if (
				parent?.type.allowsMarkType(marks.deletion) &&
				!marks.deletion.isInSet(node.marks)
			) {
				tr.addMark(start, stop, marks.deletion.create(change));
			}
			return false;
		}
		return true;
	});
	breaksIn(tr.doc, at, end, (node, pos) => {
		const current = paragraphChange(node);
		if (current?.kind === "insert" && isMine(current, me)) {
			const after = pos + node.nodeSize;
			edits.push({ at: after, run: () => joinAt(tr, after) });
		} else if (
			current?.kind !== "delete" &&
			PARAGRAPH_TYPES.has(node.type.name)
		) {
			tr.setNodeAttribute(pos, ATTR, { kind: "delete", ...change });
		}
	});
	const mark = tr.steps.length;
	applyFromTheEnd(edits);
	return tr.mapping.slice(mark).map(end, 1);
}

/**
 * One replace step of someone suggesting, rewritten: `[from, to]` is what
 * it inserted, now in `tr`'s document; what it removed is still in `before`.
 */
function suggestStep(
	tr: Transaction,
	{ before, step, from, to }: Replaced,
	me: Author,
	selection: Selection,
): void {
	const change = changeFor(tr.doc, { from, to }, me);
	markInserted(tr, { from, to }, change);
	if (step.to === step.from || !needed(before, step, me)) {
		return;
	}
	const mark = tr.steps.length;
	const end = restoreStruck(tr, from, before.slice(step.from, step.to), {
		me,
		change,
	});

	// Backspace leaves the caret before what it struck, Delete after it.
	if (to === from) {
		const forward = selection.empty && selection.head === step.from;
		const target = forward ? end : tr.mapping.slice(mark).map(from, -1);
		tr.setSelection(TextSelection.near(tr.doc.resolve(target)));
	}
}

/** Someone editing: what they type or paste is not anyone's suggestion. */
function plainStep(tr: Transaction, from: number, to: number): void {
	if (to <= from) {
		return;
	}
	const marks = changeMarks(tr.doc.type.schema);
	tr.removeMark(from, to, marks.insertion);
	tr.removeMark(from, to, marks.deletion);
	breaksIn(tr.doc, from, to, (node, pos) => {
		if (paragraphChange(node) && PARAGRAPH_TYPES.has(node.type.name)) {
			tr.setNodeAttribute(pos, ATTR, null);
		}
	});
}

/**
 * An IME composition in progress. Its text cannot be marked while it is
 * being composed (rewrapping the composed node breaks the IME), so what it
 * inserts and the document text it replaces are kept here, mapped through
 * every change, and suggested once it ends (`settleComposition`).
 */
interface Pending {
	author: Author | null;
	ranges: Range[];
	struck: { at: number; slice: Slice }[];
}

interface State {
	author: Author | null;
	pending: Pending | null;
}

const isComposing = (tr: Transaction): boolean =>
	tr.getMeta("composition") !== undefined;

const skipped = (tr: Transaction): boolean =>
	!tr.docChanged ||
	isComposing(tr) ||
	tr.getMeta(key) !== undefined ||
	tr.getMeta("history$") !== undefined ||
	tr.getMeta("appendedTransaction") !== undefined;

function merged(ranges: Range[]): Range[] {
	const out: Range[] = [];
	for (const range of [...ranges].sort((a, b) => a.from - b.from)) {
		const last = out.at(-1);
		if (last && range.from <= last.to) {
			last.to = Math.max(last.to, range.to);
		} else if (range.to > range.from) {
			out.push({ ...range });
		}
	}
	return out;
}

/** `[from, to]` less the composition's own text: the document it replaces. */
function outside({ from, to }: Range, ranges: Range[]): Range[] {
	const parts: Range[] = [];
	let at = from;
	for (const range of ranges) {
		if (range.to <= at || range.from >= to) {
			continue;
		}
		if (range.from > at) {
			parts.push({ from: at, to: range.from });
		}
		at = Math.max(at, range.to);
	}
	if (at < to) {
		parts.push({ from: at, to });
	}
	return parts;
}

function mapPending(pending: Pending, mapping: Mappable): Pending {
	return {
		author: pending.author,
		ranges: merged(
			pending.ranges.map(({ from, to }) => ({
				from: mapping.map(from, 1),
				to: mapping.map(to, -1),
			})),
		),
		struck: pending.struck.map(({ at, slice }) => ({
			at: mapping.map(at, -1),
			slice,
		})),
	};
}

/** A composition's transaction, recorded step by step. */
function capture(pending: Pending, tr: Transaction): Pending {
	let current = pending;
	tr.steps.forEach((step, i) => {
		const before = tr.docs[i];
		const struck = [...current.struck];
		if (step instanceof ReplaceStep && before && current.author) {
			for (const part of outside(step, current.ranges)) {
				if (needed(before, part, current.author)) {
					struck.push({
						at: part.from,
						slice: before.slice(part.from, part.to),
					});
				}
			}
		}
		const map = step.getMap();
		const next = mapPending({ ...current, struck }, map);
		if (step instanceof ReplaceStep) {
			next.ranges = merged([
				...next.ranges.map(({ from, to }) => ({ from, to })),
				{ from: step.from, to: step.from + step.slice.size },
			]);
		}
		current = next;
	});
	return current;
}

/** A composition that has ended, suggested (or made plain) at last. */
export function settleComposition(): Command {
	return (state, dispatch) => {
		const pending = key.getState(state)?.pending;
		if (!pending) {
			return false;
		}
		if (dispatch) {
			const tr = state.tr.setMeta(key, { settled: true });
			const size = tr.doc.content.size;
			const ranges = pending.ranges.filter((range) => range.to <= size);
			const me = pending.author;
			if (me) {
				const first = ranges[0] ?? {
					from: pending.struck[0]?.at ?? 0,
					to: pending.struck[0]?.at ?? 0,
				};
				const change = changeFor(tr.doc, first, me);
				for (const range of ranges) {
					markInserted(tr, range, change);
				}
				const struck = [...pending.struck].sort((a, b) => b.at - a.at);
				for (const { at, slice } of struck) {
					if (at <= tr.doc.content.size) {
						restoreStruck(tr, at, slice, { me, change });
					}
				}
			} else {
				for (const { from, to } of ranges) {
					plainStep(tr, from, to);
				}
			}
			dispatch(tr);
		}
		return true;
	};
}

function settleWhenDone(view: EditorView): void {
	if (!view.composing && key.getState(view.state)?.pending) {
		settleComposition()(view.state, view.dispatch);
	}
}

export function defineSuggestionTracking() {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const plugin = new Plugin<State>({
		key,
		state: {
			init: () => ({ author: null, pending: null }),
			apply(tr, value): State {
				const meta = tr.getMeta(key) as
					{ author?: Author | null; settled?: boolean } | undefined;
				const author =
					meta && "author" in meta ? (meta.author ?? null) : value.author;
				let pending = value.pending;
				if (meta?.settled) {
					pending = null;
				} else if (isComposing(tr) && tr.docChanged) {
					pending = capture(pending ?? { author, ranges: [], struck: [] }, tr);
				} else if (pending && tr.docChanged) {
					pending = mapPending(pending, tr.mapping);
				}
				return author === value.author && pending === value.pending
					? value
					: { author, pending };
			},
		},
		view: () => ({
			// The composition's last text can land after `compositionend`.
			update: settleWhenDone,
			destroy: () => clearTimeout(timer),
		}),
		props: {
			handleDOMEvents: {
				compositionend: (view) => {
					clearTimeout(timer);
					timer = setTimeout(() => settleWhenDone(view), 50);
					return false;
				},
			},
		},
		appendTransaction(transactions, old, state) {
			const me = key.getState(state)?.author ?? null;
			const out = state.tr;
			transactions.forEach((tr, index) => {
				if (skipped(tr)) {
					return;
				}
				const later = new Mapping(
					transactions.slice(index + 1).flatMap((each) => each.mapping.maps),
				);
				tr.steps.forEach((step, i) => {
					if (!(step instanceof ReplaceStep)) {
						return;
					}
					const now = (pos: number, assoc: number) =>
						out.mapping.map(
							later.map(tr.mapping.slice(i + 1).map(pos, assoc), assoc),
							assoc,
						);
					const from = now(step.from, -1);
					const to = now(step.from + step.slice.size, 1);
					const before = tr.docs[i];
					if (!me) {
						plainStep(out, from, to);
					} else if (before) {
						suggestStep(out, { before, step, from, to }, me, old.selection);
					}
				});
			});
			return out.docChanged ? out.setMeta(key, {}) : null;
		},
	});
	return definePlugin(plugin);
}

/** Suggesting as `author`, or editing again with null. */
export function suggestAs(author: Author | null): Command {
	return (state, dispatch) => {
		dispatch?.(
			state.tr.setMeta(key, { author }).setMeta("addToHistory", false),
		);
		return true;
	};
}

export interface Suggestion extends Change {
	inserted: string;
	deleted: string;
	/** Paragraph breaks it adds or removes. */
	breaks: number;
	from: number;
	to: number;
}

/** Every suggestion in the document, in reading order. */
export function suggestionsOf(doc: ProseMirrorNode): Suggestion[] {
	const { insertion, deletion } = changeMarks(doc.type.schema);
	const found = new Map<string, Suggestion>();
	const note = (change: Change, from: number, to: number): Suggestion => {
		let entry = found.get(change.id);
		if (!entry) {
			entry = { ...change, inserted: "", deleted: "", breaks: 0, from, to };
			found.set(change.id, entry);
		}
		entry.from = Math.min(entry.from, from);
		entry.to = Math.max(entry.to, to);
		return entry;
	};
	doc.descendants((node, pos) => {
		if (node.isInline) {
			const text = node.isText ? (node.text ?? "") : " ";
			for (const mark of node.marks) {
				if (mark.type === insertion || mark.type === deletion) {
					const entry = note(mark.attrs as Change, pos, pos + node.nodeSize);
					if (mark.type === insertion) {
						entry.inserted += text;
					} else {
						entry.deleted += text;
					}
				}
			}
			return false;
		}
		const change = paragraphChange(node);
		if (change) {
			const end = pos + node.nodeSize - 1;
			note(change, end, end).breaks++;
		}
		return true;
	});
	return [...found.values()].sort((a, b) => a.from - b.from);
}

/** The suggestion at a position: its text, or the end of a suggested break. */
export function suggestionAt(doc: ProseMirrorNode, pos: number): string | null {
	const { insertion, deletion } = changeMarks(doc.type.schema);
	const $pos = doc.resolve(pos);
	const isChange = (mark: Mark) =>
		mark.type === insertion || mark.type === deletion;
	const mark =
		$pos.nodeAfter?.marks.find(isChange) ??
		$pos.nodeBefore?.marks.find(isChange);
	if (mark) {
		return (mark.attrs as Change).id;
	}
	const block = $pos.parent;
	const change = block.isTextblock ? paragraphChange(block) : null;
	return change && pos === $pos.end() ? change.id : null;
}

/**
 * Accept or reject suggestions, all of them or those in `ids`. Accepting
 * keeps insertions and carries out deletions, rejecting the reverse; a
 * break that goes joins its paragraph with the next.
 */
export function reviewSuggestions(
	accept: boolean,
	ids?: ReadonlySet<string>,
): Command {
	return (state, dispatch) => {
		const { insertion, deletion } = changeMarks(state.schema);
		const wanted = (id: string) => !ids || ids.has(id);
		const isChangeType = (mark: Mark) =>
			mark.type === insertion || mark.type === deletion;
		const { tr } = state;
		const removals = new Map<number, number>();
		const edits: Edit[] = [];
		let any = false;
		state.doc.descendants((node, pos) => {
			if (node.isInline) {
				for (const mark of node.marks) {
					const change = mark.attrs as Change;
					if (!(isChangeType(mark) && wanted(change.id))) {
						continue;
					}
					any = true;
					if ((mark.type === insertion) === accept) {
						tr.removeMark(pos, pos + node.nodeSize, mark);
					} else {
						removals.set(pos, pos + node.nodeSize);
					}
				}
				return false;
			}
			const change = paragraphChange(node);
			if (change && wanted(change.id)) {
				any = true;
				tr.setNodeAttribute(pos, ATTR, null);
				if ((change.kind === "insert") !== accept) {
					const at = pos + node.nodeSize;
					edits.push({ at, run: () => joinAt(tr, at) });
				}
			}
			return true;
		});
		if (!any) {
			return false;
		}
		if (dispatch) {
			for (const [start, stop] of removals) {
				edits.push({ at: start, run: () => tr.delete(start, stop) });
			}
			applyFromTheEnd(edits);
			dispatch(tr.setMeta(key, {}));
		}
		return true;
	};
}

/** A click on suggested text opens it; the caret still lands where clicked. */
export function defineSuggestionClicks(
	onOpen: (id: string, pos: number) => void,
) {
	return definePlugin(
		new Plugin({
			props: {
				handleClick(view, pos) {
					const id = suggestionAt(view.state.doc, pos);
					if (id) {
						onOpen(id, pos);
					}
					return false;
				},
			},
		}),
	);
}
