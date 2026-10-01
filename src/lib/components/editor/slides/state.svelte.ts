import { tick } from "svelte";
import { paletteOf } from "#lib/slides/color.js";
import {
	type AlignMode,
	align,
	distribute,
	group,
	History,
	type Order,
	restack,
	rounded,
	translate,
	ungroup,
} from "#lib/slides/edit.js";
import type { Pen } from "#lib/slides/ink.js";
import {
	applyTemplate,
	relayout,
	slideFromLayout,
} from "#lib/slides/layouts.js";
import {
	type Deck,
	emptyText,
	type Fill,
	flatten,
	layoutOf,
	masterOf,
	nextElementId,
	type ParagraphStyle,
	type RunStyle,
	type ShapeElement,
	type Slide,
	type SlideElement,
	sameValue,
	type TextBody,
	withFreshIds,
} from "#lib/slides/model.js";
import {
	deleteRange,
	insertText,
	type Pos,
	rangeRuns,
	splitParagraph,
	styleAll,
	styleParagraphs,
	styleRange,
} from "#lib/slides/rich-text.js";
import { effectiveParagraph, effectiveRun } from "#lib/slides/text.js";
import { copyElements, pastedElements, uniqueIds } from "./clipboard.js";
import { fitScale, readText, selectionIn, selectRange } from "./text-dom.js";

/**
 * Everything the slide editor does to a deck, apart from pointers and
 * pixels: selection, history, clipboard, text formatting, slide
 * management. Components read it and call into it; nothing else mutates
 * the deck.
 */

export type Tool =
	| "select"
	| "text"
	| "shape"
	| "line"
	| "arrow"
	| "pen"
	| "highlighter"
	| "eraser";

interface Snapshot {
	slides: Slide[];
	template?: string;
	masters: Deck["masters"];
	layouts: Deck["layouts"];
}

export class SlidesEditor {
	deck = $state() as Deck;
	current = $state(0);
	selected = $state<string[]>([]);
	editing = $state<string | null>(null);
	tool = $state<Tool>("select");
	shapePreset = $state("rect");
	pen = $state<Pen>({
		color: { rgb: "E03131" },
		width: 38_100,
		highlighter: false,
	});
	/** Null fits the slide to the window. */
	zoom = $state<number | null>(null);
	/** The scale that fits the slide to the window, kept by the canvas. */
	fitZoom = $state(1);
	marker = $state<Pen>({
		color: { rgb: "FFD43B", mods: [["alpha", 45_000]] },
		width: 190_500,
		highlighter: true,
	});
	canUndo = $state(false);
	canRedo = $state(false);
	/** Bumped on every selection change, so the toolbar follows the caret. */
	caretTick = $state(0);
	/** The contenteditable of the box being edited. */
	editorRoot: HTMLElement | null = null;

	private readonly history = new History<Snapshot>(100);
	/** The last slide part number handed out; never reused in a session. */
	private lastPart = 0;
	/** Where the caret last was in the edited box: a toolbar click may take the focus. */
	private lastRange: { start: Pos; end: Pos } | null = null;

	/** View mode: nothing on the deck changes, presenting still works. */
	readOnly = $state(false);

	constructor(
		content: string,
		private readonly save: (text: string) => void,
		readonly fileId: string,
	) {
		const deck = JSON.parse(content) as Deck;
		deck.slides.forEach(uniqueIds);
		this.deck = deck;
		for (const slide of deck.slides) {
			this.lastPart = Math.max(
				this.lastPart,
				Number(/slide(\d+)\.xml$/.exec(slide.source ?? "")?.[1] ?? 0),
			);
		}
	}

	get slide(): Slide | undefined {
		return this.deck.slides[this.current];
	}

	get master() {
		return this.slide ? masterOf(this.deck, this.slide) : this.deck.masters[0];
	}

	get layout() {
		return this.slide ? layoutOf(this.deck, this.slide) : undefined;
	}

	get palette() {
		return paletteOf(this.master);
	}

	get selection(): SlideElement[] {
		return (this.slide?.elements ?? []).filter((element) =>
			this.selected.includes(element.id),
		);
	}

	/** The selected shapes that hold text, or the one being edited. */
	get textTargets(): ShapeElement[] {
		return this.selection.flatMap((element) =>
			flatten([element]).filter(
				(e): e is ShapeElement => e.kind === "shape" && !!e.text,
			),
		);
	}

	// =====================================================================
	// History
	// =====================================================================

	private snapshot(): Snapshot {
		const { slides, template, masters, layouts } = $state.snapshot(
			this.deck,
		) as Deck;
		return { slides, template, masters, layouts };
	}

	/** Remember the deck as it is now, before a change. */
	checkpoint(): void {
		this.history.record(this.snapshot());
		this.canUndo = true;
		this.canRedo = false;
	}

	/** The deck changed: hand it to whoever saves it. */
	changed(): void {
		this.save(JSON.stringify($state.snapshot(this.deck)));
	}

	edit(mutate: () => void): void {
		if (this.readOnly) {
			return;
		}
		this.checkpoint();
		mutate();
		this.changed();
	}

	private restore(snapshot: Snapshot | null): void {
		if (!snapshot) {
			return;
		}
		Object.assign(this.deck, snapshot);
		this.current = Math.min(this.current, this.deck.slides.length - 1);
		this.selected = this.selected.filter((id) =>
			this.slide?.elements.some((element) => element.id === id),
		);
		this.canUndo = this.history.canUndo;
		this.canRedo = this.history.canRedo;
		this.changed();
	}

	undo(): void {
		this.finishTyping();
		this.restore(this.history.undo(this.snapshot()));
	}

	redo(): void {
		this.finishTyping();
		this.restore(this.history.redo(this.snapshot()));
	}

	// =====================================================================
	// Elements
	// =====================================================================

	/** Switch between viewing and editing, dropping whatever was in hand. */
	setReadOnly(readOnly: boolean): void {
		if (readOnly && !this.readOnly) {
			this.stopEditing();
			this.selected = [];
			this.tool = "select";
		}
		this.readOnly = readOnly;
	}

	select(ids: string[]): void {
		if (this.editing && !ids.includes(this.editing)) {
			this.stopEditing();
		}
		this.selected = ids;
	}

	/** Replace the chosen elements on the current slide, recorded as one step. */
	updateSelected(change: (element: SlideElement) => SlideElement): void {
		const slide = this.slide;
		if (!slide || this.selected.length === 0) {
			return;
		}
		this.edit(() => {
			slide.elements = slide.elements.map((element) =>
				this.selected.includes(element.id)
					? change(structuredClone($state.snapshot(element)) as SlideElement)
					: element,
			);
		});
	}

	/** Put elements on the current slide and select them. A pen keeps drawing. */
	add(elements: SlideElement[], keepTool = false): void {
		const slide = this.slide;
		if (!slide) {
			return;
		}
		const fresh = withFreshIds(elements, slide.elements);
		this.edit(() => {
			slide.elements.push(...fresh);
		});
		if (!keepTool) {
			this.tool = "select";
			this.selected = fresh.map((element) => element.id);
		}
	}

	remove(): void {
		const slide = this.slide;
		if (!slide) {
			return;
		}
		this.edit(() => {
			slide.elements = slide.elements.filter(
				(element) => !this.selected.includes(element.id),
			);
		});
		this.selected = [];
		this.editing = null;
	}

	nudge(dx: number, dy: number): void {
		this.updateSelected((element) => rounded(translate(element, dx, dy)));
	}

	arrange(order: Order): void {
		const slide = this.slide;
		if (slide) {
			this.edit(() => {
				slide.elements = restack(slide.elements, new Set(this.selected), order);
			});
		}
	}

	align(mode: AlignMode): void {
		const slide = this.slide;
		if (slide) {
			this.edit(() => {
				slide.elements = align(slide.elements, new Set(this.selected), mode, {
					w: this.deck.width,
					h: this.deck.height,
				});
			});
		}
	}

	distribute(axis: "x" | "y"): void {
		const slide = this.slide;
		if (slide) {
			this.edit(() => {
				slide.elements = distribute(
					slide.elements,
					new Set(this.selected),
					axis,
				);
			});
		}
	}

	group(): void {
		const slide = this.slide;
		if (!slide || this.selected.length < 2) {
			return;
		}
		const id = nextElementId(slide.elements);
		this.edit(() => {
			slide.elements = group(slide.elements, new Set(this.selected), id);
		});
		if (slide.elements.some((element) => element.id === id)) {
			this.selected = [id];
		}
	}

	ungroup(): void {
		const slide = this.slide;
		if (!slide) {
			return;
		}
		const members = this.selection.flatMap((element) =>
			element.kind === "group" ? element.children.map((child) => child.id) : [],
		);
		this.edit(() => {
			slide.elements = ungroup(slide.elements, new Set(this.selected));
		});
		this.selected = members;
	}

	duplicate(): void {
		const offset = 12_700 * 12;
		this.add(
			this.selection.map((element) =>
				translate(
					structuredClone($state.snapshot(element)) as SlideElement,
					offset,
					offset,
				),
			),
		);
	}

	// =====================================================================
	// Clipboard
	// =====================================================================

	copy(data: DataTransfer | null): boolean {
		if (this.selection.length === 0) {
			return false;
		}
		copyElements(
			this.fileId,
			structuredClone($state.snapshot(this.selection)) as SlideElement[],
			data,
		);
		return true;
	}

	/** Paste slide elements; false when the clipboard holds none. */
	paste(text: string | undefined): boolean {
		const elements = pastedElements(
			text,
			this.fileId,
			this.slide?.elements ?? [],
		);
		if (!elements) {
			return false;
		}
		this.add(elements);
		return true;
	}

	// =====================================================================
	// Text
	// =====================================================================

	private editedElement(): ShapeElement | undefined {
		const found = flatten(this.slide?.elements ?? []).find(
			(element) => element.id === this.editing,
		);
		return found?.kind === "shape" ? found : undefined;
	}

	startEditing(id: string): void {
		if (this.readOnly) {
			return;
		}
		const element = this.slide?.elements.find(
			(candidate) => candidate.id === id,
		);
		if (element?.kind !== "shape") {
			return;
		}
		if (!element.text) {
			this.edit(() => {
				element.text = {
					...emptyText($state.snapshot(this.master?.textLevels ?? [])),
					anchor: "ctr",
					paragraphs: [{ runs: [], align: "ctr" }],
				};
			});
		}
		this.selected = [id];
		this.editing = id;
	}

	private rangeIn(root: HTMLElement): { start: Pos; end: Pos } | null {
		return selectionIn(root) ?? this.lastRange;
	}

	/** Called on every selection change while editing. */
	rememberSelection(): void {
		const range = this.editorRoot ? selectionIn(this.editorRoot) : null;
		if (range) {
			this.lastRange = range;
		}
		this.caretTick++;
	}

	/** Read what was typed into the model, staying in the box. */
	finishTyping(): void {
		const element = this.editedElement();
		const root = this.editorRoot;
		if (!element?.text || !root?.isConnected) {
			return;
		}
		const paragraphs = readText(root, $state.snapshot(element.text));
		if (sameValue(paragraphs, $state.snapshot(element.text.paragraphs))) {
			return;
		}
		this.edit(() => {
			if (element.text) {
				element.text.paragraphs = paragraphs;
			}
		});
	}

	stopEditing(): void {
		const element = this.editedElement();
		const root = this.editorRoot;
		this.finishTyping();
		if (element?.text && root?.isConnected) {
			this.fit(element, root);
		}
		this.editing = null;
		this.editorRoot = null;
		this.lastRange = null;
	}

	/** Shrink text that overflows, or grow a box that fits its text. */
	private fit(element: ShapeElement, root: HTMLElement): void {
		const text = element.text;
		if (!text) {
			return;
		}
		if (text.autofit === "shrink") {
			const scale = fitScale(root);
			const next = scale < 1 ? scale : undefined;
			if (next !== text.fontScale) {
				text.fontScale = next;
				this.changed();
			}
		} else if (text.autofit === "resize") {
			const height = Math.round(root.scrollHeight * 12_700);
			if (Math.abs(height - element.h) > 6350) {
				element.h = height;
				this.changed();
			}
		}
	}

	private async reselect(range: { start: Pos; end: Pos }): Promise<void> {
		await tick();
		const root = this.editorRoot;
		if (root?.isConnected) {
			root.focus();
			selectRange(root, range.start, range.end);
		}
	}

	/** Character formatting: the selected characters, or every selected box. */
	formatText(patch: RunStyle): void {
		const element = this.editedElement();
		const root = this.editorRoot;
		const range = root ? this.rangeIn(root) : null;
		if (element?.text && root && range) {
			const current = {
				...$state.snapshot(element.text),
				paragraphs: readText(root, $state.snapshot(element.text)),
			};
			this.edit(() => {
				element.text = styleRange(current, range.start, range.end, patch);
			});
			void this.reselect(range);
			return;
		}
		const targets = this.textTargets;
		if (targets.length === 0) {
			return;
		}
		this.edit(() => {
			for (const target of targets) {
				if (target.text) {
					target.text = styleAll($state.snapshot(target.text), patch);
				}
			}
		});
	}

	/** Paragraph settings for the paragraphs being edited, or whole boxes. */
	formatParagraph(patch: Partial<ParagraphStyle & { level: number }>): void {
		const element = this.editedElement();
		const root = this.editorRoot;
		const range = root ? this.rangeIn(root) : null;
		if (element?.text && root && range) {
			const current = {
				...$state.snapshot(element.text),
				paragraphs: readText(root, $state.snapshot(element.text)),
			};
			this.edit(() => {
				element.text = styleParagraphs(current, range.start, range.end, patch);
			});
			void this.reselect(range);
			return;
		}
		this.edit(() => {
			for (const target of this.textTargets) {
				if (target.text) {
					const end = { p: target.text.paragraphs.length - 1, o: 0 };
					target.text = styleParagraphs(
						$state.snapshot(target.text),
						{ p: 0, o: 0 },
						end,
						patch,
					);
				}
			}
		});
	}

	/** The edited box's text with what was typed read in, and the selection in it. */
	private typed(): {
		element: ShapeElement;
		body: TextBody;
		range: { start: Pos; end: Pos };
	} | null {
		const element = this.editedElement();
		const root = this.editorRoot;
		const range = root ? this.rangeIn(root) : null;
		if (!element?.text || !root || !range) {
			return null;
		}
		return {
			element,
			body: {
				...$state.snapshot(element.text),
				paragraphs: readText(root, $state.snapshot(element.text)),
			},
			range,
		};
	}

	/** Enter, Shift+Enter and pastes: done on the model so the box re-renders exactly. */
	insert(what: { paragraph: true } | { text: string }): void {
		const typed = this.typed();
		if (!typed) {
			return;
		}
		let { body, pos } = deleteRange(
			typed.body,
			typed.range.start,
			typed.range.end,
		);
		({ body, pos } =
			"paragraph" in what
				? splitParagraph(body, pos)
				: insertText(body, pos, what.text));
		this.edit(() => {
			typed.element.text = body;
		});
		void this.reselect({ start: pos, end: pos });
	}

	/** The formatting under the caret, or of the first selected box. */
	currentFormat():
		| (RunStyle & ParagraphStyle & { size: number; level: number })
		| null {
		void this.caretTick;
		const typed = this.editing ? this.typed() : null;
		const element = typed?.element ?? this.textTargets[0];
		const body =
			typed?.body ??
			(element?.text && ($state.snapshot(element.text) as TextBody));
		if (!body) {
			return null;
		}
		const start = typed?.range.start ?? { p: 0, o: 0 };
		const paragraph = effectiveParagraph(
			body.paragraphs[start.p] ?? { runs: [] },
			body,
		);
		const run = rangeRuns(body, start, typed?.range.end ?? start)[0] ?? {};
		return {
			...paragraph,
			...effectiveRun(run, paragraph, { ...body, fontScale: undefined }),
		};
	}

	/** Bold, italic, underline or strikethrough: on unless it already is. */
	toggle(property: "bold" | "italic" | "underline" | "strike"): void {
		const current = this.currentFormat();
		this.formatText({ [property]: !current?.[property] });
	}

	/** Tab and Shift+Tab: a list level deeper or shallower. */
	indent(delta: number): void {
		const current = this.currentFormat();
		const level = Math.max(0, Math.min(8, (current?.level ?? 0) + delta));
		this.formatParagraph({ level: level || undefined });
	}

	// =====================================================================
	// Slides
	// =====================================================================

	/**
	 * A part name for a slide made here. The server creates the slide under
	 * it, so the next save rewrites that part instead of making another.
	 */
	private newSource(): string {
		this.lastPart++;
		return `ppt/slides/slide${this.lastPart}.xml`;
	}

	go(index: number): void {
		if (this.editing) {
			this.stopEditing();
		}
		this.current = Math.max(0, Math.min(index, this.deck.slides.length - 1));
		this.selected = [];
	}

	addSlide(layoutPart: string, at = this.current + 1): void {
		const layout =
			this.deck.layouts.find((candidate) => candidate.part === layoutPart) ??
			this.layout ??
			this.deck.layouts[0];
		if (!layout) {
			return;
		}
		const part = this.newSource();
		const slide = {
			...slideFromLayout($state.snapshot(layout) as typeof layout),
			// The id a slide read from the file has: its part, stable across reloads.
			id: part,
			source: part,
		};
		this.edit(() => {
			this.deck.slides.splice(at, 0, slide);
		});
		this.go(at);
	}

	duplicateSlide(index: number): void {
		const source = this.deck.slides[index];
		if (!source) {
			return;
		}
		const part = this.newSource();
		const copy = {
			...(structuredClone($state.snapshot(source)) as Slide),
			id: part,
			source: part,
		};
		this.edit(() => {
			this.deck.slides.splice(index + 1, 0, copy);
		});
		this.go(index + 1);
	}

	deleteSlide(index: number): void {
		if (this.deck.slides.length <= 1) {
			return;
		}
		this.edit(() => {
			this.deck.slides.splice(index, 1);
		});
		this.go(Math.min(this.current, this.deck.slides.length - 1));
	}

	moveSlide(from: number, to: number): void {
		if (to < 0 || to >= this.deck.slides.length || from === to) {
			return;
		}
		this.edit(() => {
			const [moved] = this.deck.slides.splice(from, 1);
			if (moved) {
				this.deck.slides.splice(to, 0, moved);
			}
		});
		this.current = to;
	}

	toggleHidden(index: number): void {
		const slide = this.deck.slides[index];
		if (slide) {
			this.edit(() => {
				slide.hidden = slide.hidden ? undefined : true;
			});
		}
	}

	/** Move the current slide onto another layout, its content flowing along. */
	setLayout(part: string): void {
		const slide = this.slide;
		const layout = this.deck.layouts.find(
			(candidate) => candidate.part === part,
		);
		if (!slide || !layout) {
			return;
		}
		const next = relayout(
			$state.snapshot(slide) as Slide,
			$state.snapshot(layout) as typeof layout,
		);
		this.edit(() => {
			Object.assign(slide, next);
		});
		this.selected = [];
	}

	setBackground(fill: Fill | undefined): void {
		const slide = this.slide;
		if (slide) {
			this.edit(() => {
				slide.background = fill;
			});
		}
	}

	/** Notes are typed continuously; one history step per visit to the box. */
	setNotes(text: string, first: boolean): void {
		const slide = this.slide;
		if (!slide || this.readOnly) {
			return;
		}
		if (first) {
			this.checkpoint();
		}
		slide.notes = text;
		this.changed();
	}

	useTemplate(id: string): void {
		const next = applyTemplate($state.snapshot(this.deck) as Deck, id);
		if (next) {
			this.edit(() => {
				Object.assign(this.deck, next);
			});
		}
	}
}
