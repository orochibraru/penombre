import {
	boxFromEnds,
	type Guide,
	type Handle,
	lineEnds,
	resizeBox,
	rotationTo,
	rounded,
	snapBox,
	translate,
	withBox,
} from "#lib/slides/edit.js";
import { bounds, intersects, type Point, union } from "#lib/slides/geometry.js";
import { isStroke, strokeShape, touchesStroke } from "#lib/slides/ink.js";
import {
	type Box,
	EMU_PER_PT,
	emptyText,
	nextElementId,
	type ShapeElement,
	type SlideElement,
} from "#lib/slides/model.js";
import type { SlidesEditor } from "./state.svelte.js";

/**
 * What a pointer does on the slide, from press to release: select, move,
 * resize, rotate, drag a line's ends, draw a marquee, draw ink, erase, or
 * draw out a new shape. Mouse, pen and finger go through the same path.
 */

type Drag =
	| { kind: "move"; start: Point; originals: SlideElement[]; moved: boolean }
	| { kind: "resize"; handle: Handle; original: SlideElement; moved: boolean }
	| { kind: "rotate"; original: SlideElement; moved: boolean }
	| { kind: "end"; index: 0 | 1; original: SlideElement; moved: boolean }
	| { kind: "marquee"; start: Point }
	| { kind: "ink"; points: Point[] }
	| { kind: "erase"; erased: boolean }
	| { kind: "create"; start: Point };

export interface Modifiers {
	shift: boolean;
	toggle: boolean;
	free: boolean;
}

const DOUBLE_TAP_MS = 400;

export class CanvasPointer {
	guides = $state<Guide[]>([]);
	marquee = $state<Box | null>(null);
	ink = $state<Point[]>([]);
	draft = $state<Box | null>(null);
	private drag: Drag | null = null;
	private lastTap = { id: "", time: 0 };

	constructor(
		private readonly editor: SlidesEditor,
		/** Screen pixels per EMU, for thresholds that are about the screen. */
		private readonly perEmu: () => number,
		private readonly onPlaceholderPicture: (id: string) => void,
	) {}

	get active(): boolean {
		return this.drag !== null;
	}

	private emu(pixels: number): number {
		return pixels / this.perEmu();
	}

	private live(id: string): SlideElement | undefined {
		return this.editor.slide?.elements.find((element) => element.id === id);
	}

	private startMove(id: string, point: Point, modifiers: Modifiers): void {
		const editor = this.editor;
		const now = Date.now();
		const again =
			this.lastTap.id === id && now - this.lastTap.time < DOUBLE_TAP_MS;
		this.lastTap = { id, time: now };
		const element = this.live(id);
		if (again && element) {
			if (element.kind === "shape" && element.placeholder?.type === "pic") {
				this.onPlaceholderPicture(id);
			} else {
				editor.startEditing(id);
			}
			return;
		}
		if (modifiers.toggle) {
			editor.select(
				editor.selected.includes(id)
					? editor.selected.filter((other) => other !== id)
					: [...editor.selected, id],
			);
			return;
		}
		if (!editor.selected.includes(id)) {
			editor.select([id]);
		}
		this.drag = {
			kind: "move",
			start: point,
			originals: structuredClone(
				$state.snapshot(editor.selection),
			) as SlideElement[],
			moved: false,
		};
	}

	/** A press. Returns whether the canvas takes the pointer. */
	down(point: Point, target: Element, modifiers: Modifiers): boolean {
		const editor = this.editor;
		if (editor.readOnly) {
			return false;
		}
		const handle = target.closest<HTMLElement>("[data-handle]")?.dataset.handle;
		const single =
			editor.selection.length === 1 ? editor.selection[0] : undefined;
		if (handle && single) {
			const original = structuredClone($state.snapshot(single)) as SlideElement;
			if (handle === "rotate") {
				this.drag = { kind: "rotate", original, moved: false };
			} else if (handle === "end0" || handle === "end1") {
				this.drag = {
					kind: "end",
					index: handle === "end0" ? 0 : 1,
					original,
					moved: false,
				};
			} else {
				this.drag = {
					kind: "resize",
					handle: handle as Handle,
					original,
					moved: false,
				};
			}
			return true;
		}
		switch (editor.tool) {
			case "pen":
			case "highlighter":
				this.drag = { kind: "ink", points: [point] };
				this.ink = [point];
				return true;
			case "eraser":
				this.drag = { kind: "erase", erased: false };
				this.erase(point);
				return true;
			case "select":
				break;
			default:
				this.drag = { kind: "create", start: point };
				return true;
		}
		const id = target.closest<HTMLElement>("[data-el]")?.dataset.el;
		if (id) {
			this.startMove(id, point, modifiers);
			return true;
		}
		if (!modifiers.toggle) {
			editor.select([]);
		}
		this.drag = { kind: "marquee", start: point };
		return true;
	}

	private moveSelection(
		drag: Drag & { kind: "move" },
		point: Point,
		modifiers: Modifiers,
	): void {
		const editor = this.editor;
		let dx = point[0] - drag.start[0];
		let dy = point[1] - drag.start[1];
		if (!drag.moved) {
			if (Math.hypot(dx, dy) < this.emu(4)) {
				return;
			}
			editor.checkpoint();
			drag.moved = true;
		}
		const area = union(drag.originals);
		if (area && !modifiers.free) {
			const others = (editor.slide?.elements ?? []).filter(
				(element) => !editor.selected.includes(element.id),
			);
			const snap = snapBox(
				{ ...area, x: area.x + dx, y: area.y + dy },
				others,
				{ w: editor.deck.width, h: editor.deck.height },
				this.emu(6),
			);
			dx += snap.dx;
			dy += snap.dy;
			this.guides = snap.guides;
		}
		for (const original of drag.originals) {
			const element = this.live(original.id);
			if (element) {
				Object.assign(element, translate(original, dx, dy));
			}
		}
	}

	private reshape(
		drag: Drag & { kind: "resize" | "rotate" | "end" },
		point: Point,
		modifiers: Modifiers,
	): void {
		const element = this.live(drag.original.id);
		if (!element) {
			return;
		}
		if (!drag.moved) {
			this.editor.checkpoint();
			drag.moved = true;
		}
		if (drag.kind === "rotate") {
			let rot = rotationTo(
				drag.original,
				point,
				modifiers.shift ? 15 : undefined,
			);
			const near = Math.round(rot / 90) * 90;
			rot = Math.abs(rot - near) < 3 ? near % 360 : rot;
			element.rot = rot || undefined;
			return;
		}
		if (drag.kind === "end") {
			const ends = lineEnds(drag.original);
			ends[drag.index] = point;
			Object.assign(
				element,
				withBox(drag.original, boxFromEnds(ends[0], ends[1])),
			);
			return;
		}
		const keep = modifiers.shift || drag.original.kind === "image";
		Object.assign(
			element,
			withBox(
				drag.original,
				resizeBox(drag.original, drag.handle, point, keep),
			),
		);
	}

	move(point: Point, modifiers: Modifiers, trail: Point[] = []): void {
		const drag = this.drag;
		if (!drag) {
			return;
		}
		switch (drag.kind) {
			case "move":
				this.moveSelection(drag, point, modifiers);
				return;
			case "resize":
			case "rotate":
			case "end":
				this.reshape(drag, point, modifiers);
				return;
			case "marquee":
				this.marquee = boxFromEnds(drag.start, point);
				return;
			case "ink":
				drag.points.push(...trail, point);
				this.ink = [...drag.points];
				return;
			case "erase":
				this.erase(point);
				return;
			default: {
				const box = boxFromEnds(drag.start, point);
				if (modifiers.shift && this.editor.tool === "shape") {
					box.w = box.h = Math.max(box.w, box.h);
				}
				this.draft =
					this.editor.tool === "line" || this.editor.tool === "arrow"
						? { ...box }
						: { ...box, flipH: undefined, flipV: undefined };
			}
		}
	}

	up(point: Point): void {
		const drag = this.drag;
		this.drag = null;
		this.guides = [];
		if (!drag) {
			return;
		}
		const editor = this.editor;
		if (
			(drag.kind === "move" ||
				drag.kind === "resize" ||
				drag.kind === "rotate" ||
				drag.kind === "end") &&
			drag.moved
		) {
			const ids =
				drag.kind === "move"
					? drag.originals.map((original) => original.id)
					: [drag.original.id];
			for (const id of ids) {
				const element = this.live(id);
				if (element) {
					Object.assign(
						element,
						rounded($state.snapshot(element) as SlideElement),
					);
				}
			}
			editor.changed();
		} else if (drag.kind === "marquee") {
			const area = this.marquee;
			this.marquee = null;
			if (area && area.w > 0 && area.h > 0) {
				editor.select(
					(editor.slide?.elements ?? [])
						.filter((element) => intersects(bounds(element), area))
						.map((element) => element.id),
				);
			}
		} else if (drag.kind === "ink") {
			this.ink = [];
			const pen = editor.tool === "highlighter" ? editor.marker : editor.pen;
			editor.add([strokeShape(drag.points, $state.snapshot(pen), "0")], true);
		} else if (drag.kind === "create") {
			this.create(drag.start, point);
		}
	}

	private erase(point: Point): void {
		const slide = this.editor.slide;
		const drag = this.drag;
		if (!slide || drag?.kind !== "erase") {
			return;
		}
		const hit = slide.elements.filter(
			(element) =>
				isStroke(element) && touchesStroke(element, point, this.emu(8)),
		);
		if (hit.length === 0) {
			return;
		}
		if (!drag.erased) {
			this.editor.checkpoint();
			drag.erased = true;
		}
		slide.elements = slide.elements.filter((element) => !hit.includes(element));
		this.editor.changed();
	}

	/** The element a creation tool draws, from a drag or a click. */
	private create(start: Point, end: Point): void {
		const editor = this.editor;
		const draft = this.draft;
		this.draft = null;
		const pt = EMU_PER_PT;
		const clicked = !draft || Math.max(draft.w, draft.h) < this.emu(6);
		const id = nextElementId(editor.slide?.elements ?? []);
		const tool = editor.tool;
		if (tool === "line" || tool === "arrow") {
			const box = clicked
				? boxFromEnds(start, [start[0] + 150 * pt, start[1]])
				: boxFromEnds(start, end);
			editor.add([
				{
					kind: "shape",
					id,
					name: `${tool === "arrow" ? "Arrow" : "Line"} ${id}`,
					...box,
					geometry: {
						preset: tool === "arrow" ? "straightConnector1" : "line",
					},
					fill: { type: "none" },
					line: {
						fill: { type: "solid", color: { scheme: "tx1" } },
						width: 2 * pt,
						tail: tool === "arrow" ? "triangle" : undefined,
					},
				},
			]);
			return;
		}
		const box =
			clicked || !draft
				? {
						x: start[0],
						y: start[1],
						w: (tool === "text" ? 320 : 160) * pt,
						h: (tool === "text" ? 40 : 110) * pt,
					}
				: { x: draft.x, y: draft.y, w: draft.w, h: draft.h };
		const shape: ShapeElement =
			tool === "text"
				? {
						kind: "shape",
						id,
						name: `TextBox ${id}`,
						...box,
						geometry: { preset: "rect" },
						fill: { type: "none" },
						line: { fill: { type: "none" }, width: 0 },
						text: {
							...emptyText($state.snapshot(editor.master?.textLevels ?? [])),
							autofit: "resize",
						},
					}
				: {
						kind: "shape",
						id,
						name: `Shape ${id}`,
						...box,
						geometry: { preset: editor.shapePreset },
						fill: { type: "solid", color: { scheme: "accent1" } },
						line: {
							fill: {
								type: "solid",
								color: { scheme: "accent1", mods: [["lumMod", 75_000]] },
							},
							width: pt,
						},
					};
		editor.add([shape]);
		if (tool === "text") {
			editor.startEditing(editor.selected[0] ?? id);
		}
	}
}
