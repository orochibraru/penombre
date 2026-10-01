<script lang="ts">
	import { flushSync } from "svelte";
	import { m } from "#lib/paraglide/messages.js";
	import { cssColor } from "#lib/slides/color.js";
	import {
		HANDLES,
		handleAnchor,
		isLineElement,
		lineEnds,
	} from "#lib/slides/edit.js";
	import {
		center,
		corners,
		type Point,
		rotatePoint,
	} from "#lib/slides/geometry.js";
	import { EMU_PER_PT } from "#lib/slides/model.js";
	import { CanvasPointer, type Modifiers } from "./pointer.svelte.js";
	import type { RenderContext } from "./render-context.js";
	import SlideView from "./slide-view.svelte";
	import type { SlidesEditor } from "./state.svelte.js";

	/**
	 * The slide being edited: the slide itself, scaled to fit or zoomed, and
	 * an overlay in screen pixels for handles, guides and ink, so they stay
	 * the same size whatever the zoom.
	 */
	let {
		editor,
		media,
		prompt,
		label,
		onPicture,
		onFiles,
	}: {
		editor: SlidesEditor;
		media: RenderContext["media"];
		prompt: RenderContext["prompt"];
		label: RenderContext["label"];
		/** Fill a picture placeholder, by its id. */
		onPicture: (id: string) => void;
		/** Pictures dropped or pasted, and where on the slide. */
		onFiles: (files: File[], at?: Point) => void;
	} = $props();

	let stage = $state<HTMLDivElement>();
	let paper = $state<HTMLDivElement>();
	let stageWidth = $state(0);
	let stageHeight = $state(0);
	let lastPointer: { x: number; y: number } | null = null;

	const slideWidth = $derived(editor.deck.width / EMU_PER_PT);
	const slideHeight = $derived(editor.deck.height / EMU_PER_PT);
	const fit = $derived(
		Math.max(
			0.05,
			Math.min(
				(stageWidth - 24) / slideWidth,
				(stageHeight - 24) / slideHeight,
			),
		),
	);
	const scale = $derived(editor.zoom ?? fit);
	$effect(() => {
		editor.fitZoom = fit;
	});
	/** Screen pixels per EMU. */
	const k = $derived(scale / EMU_PER_PT);

	// svelte-ignore state_referenced_locally -- one editor per canvas: the page keys it by file.
	const pointer = new CanvasPointer(
		editor,
		() => k,
		(id) => onPicture(id),
	);

	function toSlide(event: { clientX: number; clientY: number }): Point {
		const box = paper?.getBoundingClientRect();
		return box
			? [(event.clientX - box.left) / k, (event.clientY - box.top) / k]
			: [0, 0];
	}

	function modifiers(event: PointerEvent | KeyboardEvent): Modifiers {
		return {
			shift: event.shiftKey,
			toggle: event.shiftKey || event.metaKey || event.ctrlKey,
			free: event.altKey,
		};
	}

	function down(event: PointerEvent) {
		if (event.button !== 0 && event.pointerType === "mouse") {
			return;
		}
		lastPointer = { x: event.clientX, y: event.clientY };
		const target = event.target as Element;
		if (editor.editing && target.closest(`[data-el="${editor.editing}"]`)) {
			return;
		}
		if (editor.editing) {
			editor.stopEditing();
		}
		stage?.focus({ preventScroll: true });
		const was = editor.editing;
		if (pointer.down(toSlide(event), target, modifiers(event))) {
			paper?.setPointerCapture(event.pointerId);
			event.preventDefault();
		}
		if (editor.editing !== was) {
			// Render the editable box now, inside the gesture: iOS only opens
			// the keyboard for a focus the user's own touch caused.
			flushSync();
		}
	}

	function move(event: PointerEvent) {
		if (!pointer.active) {
			return;
		}
		const trail = event.getCoalescedEvents?.().map((e) => toSlide(e)) ?? [];
		pointer.move(toSlide(event), modifiers(event), trail.slice(0, -1));
	}

	function up(event: PointerEvent) {
		pointer.up(toSlide(event));
	}

	/** Put the caret where the box was double-clicked, or at its end. */
	function placeCaret(root: HTMLElement) {
		root.focus({ preventScroll: true });
		const doc = document as Document & {
			caretPositionFromPoint?: (
				x: number,
				y: number,
			) => { offsetNode: Node; offset: number } | null;
		};
		const selection = document.getSelection();
		const at =
			lastPointer && doc.caretPositionFromPoint?.(lastPointer.x, lastPointer.y);
		if (selection && at && root.contains(at.offsetNode)) {
			selection.collapse(at.offsetNode, at.offset);
			return;
		}
		const range = document.createRange();
		range.selectNodeContents(root);
		range.collapse(false);
		selection?.removeAllRanges();
		selection?.addRange(range);
	}

	function onEditorRoot(node: HTMLElement) {
		if (editor.editorRoot !== node) {
			editor.editorRoot = node;
			placeCaret(node);
		}
	}

	function keydown(event: KeyboardEvent) {
		const mod = event.metaKey || event.ctrlKey;
		if (editor.editing) {
			if (event.key === "Escape") {
				editor.stopEditing();
				stage?.focus({ preventScroll: true });
				event.preventDefault();
			} else if (event.key === "Tab") {
				editor.indent(event.shiftKey ? -1 : 1);
				event.preventDefault();
			}
			return;
		}
		if (
			editor.readOnly ||
			(event.target as Element).closest("input, textarea, select")
		) {
			return;
		}
		const step = (event.shiftKey ? 10 : 1) * EMU_PER_PT;
		const arrows: Record<string, [number, number]> = {
			ArrowLeft: [-step, 0],
			ArrowRight: [step, 0],
			ArrowUp: [0, -step],
			ArrowDown: [0, step],
		};
		const handled = (() => {
			if (arrows[event.key] && editor.selected.length > 0) {
				const [dx, dy] = arrows[event.key] ?? [0, 0];
				editor.nudge(dx, dy);
				return true;
			}
			if (event.key === "Delete" || event.key === "Backspace") {
				editor.remove();
				return true;
			}
			if (event.key === "Escape") {
				editor.select([]);
				editor.tool = "select";
				return true;
			}
			if (event.key === "Enter" && editor.selected.length === 1) {
				editor.startEditing(editor.selected[0] ?? "");
				return true;
			}
			if (!mod) {
				return false;
			}
			return shortcut(event);
		})();
		if (handled) {
			event.preventDefault();
		}
	}

	function shortcut(event: KeyboardEvent): boolean {
		const key = event.key.toLowerCase();
		const actions: Record<string, () => void> = {
			z: () => (event.shiftKey ? editor.redo() : editor.undo()),
			y: () => editor.redo(),
			d: () => editor.duplicate(),
			a: () =>
				editor.select(
					editor.slide?.elements.map((element) => element.id) ?? [],
				),
			g: () => (event.shiftKey ? editor.ungroup() : editor.group()),
			b: () => editor.toggle("bold"),
			i: () => editor.toggle("italic"),
			u: () => editor.toggle("underline"),
			"]": () => editor.arrange(event.shiftKey ? "front" : "forward"),
			"[": () => editor.arrange(event.shiftKey ? "back" : "backward"),
		};
		const action = actions[key];
		action?.();
		return action !== undefined;
	}

	function beforeinput(event: InputEvent) {
		if (!editor.editing) {
			return;
		}
		const formats: Record<string, "bold" | "italic" | "underline" | "strike"> =
			{
				formatBold: "bold",
				formatItalic: "italic",
				formatUnderline: "underline",
				formatStrikeThrough: "strike",
			};
		const format = formats[event.inputType];
		if (format) {
			editor.toggle(format);
		} else if (event.inputType === "insertParagraph") {
			editor.insert({ paragraph: true });
		} else if (event.inputType === "insertLineBreak") {
			editor.insert({ text: "\n" });
		} else if (event.inputType === "historyUndo") {
			editor.undo();
		} else if (event.inputType === "historyRedo") {
			editor.redo();
		} else if (!event.inputType.startsWith("format")) {
			// Typing and deleting are the browser's; formatting is ours only.
			return;
		}
		event.preventDefault();
	}

	function focused(): boolean {
		return !!stage && stage.contains(document.activeElement);
	}

	function copy(event: ClipboardEvent, cut: boolean) {
		if (!focused() || editor.editing) {
			return;
		}
		if (editor.copy(event.clipboardData)) {
			event.preventDefault();
			if (cut) {
				editor.remove();
			}
		}
	}

	function paste(event: ClipboardEvent) {
		if (!focused()) {
			return;
		}
		const data = event.clipboardData;
		const text = data?.getData("text/plain");
		if (editor.editing) {
			event.preventDefault();
			editor.insert({ text: text ?? "" });
			return;
		}
		const files = [...(data?.files ?? [])].filter((file) =>
			file.type.startsWith("image/"),
		);
		if (files.length > 0) {
			event.preventDefault();
			onFiles(files);
			return;
		}
		if (editor.paste(text)) {
			event.preventDefault();
		}
	}

	function drop(event: DragEvent) {
		const files = [...(event.dataTransfer?.files ?? [])].filter((file) =>
			file.type.startsWith("image/"),
		);
		if (files.length > 0 && !editor.readOnly) {
			event.preventDefault();
			onFiles(files, toSlide(event));
		}
	}

	function wheel(event: WheelEvent) {
		if (!event.ctrlKey && !event.metaKey) {
			return;
		}
		event.preventDefault();
		const next = scale * (event.deltaY < 0 ? 1.1 : 1 / 1.1);
		editor.zoom = Math.min(4, Math.max(0.1, next));
	}

	const px = (point: Point): Point => [point[0] * k, point[1] * k];
	const outline = (element: {
		x: number;
		y: number;
		w: number;
		h: number;
		rot?: number;
	}) =>
		corners(element)
			.map((point) => px(point).join(","))
			.join(" ");

	const single = $derived(
		editor.selection.length === 1 ? editor.selection[0] : undefined,
	);
	const handles = $derived.by(() => {
		if (!single || editor.readOnly || editor.editing) {
			return [];
		}
		if (isLineElement(single)) {
			return lineEnds(single).map((point, index) => ({
				id: `end${index}`,
				at: px(point),
				cursor: "move",
			}));
		}
		const pivot = center(single);
		const cursors = ["nwse", "ns", "nesw", "ew", "nwse", "ns", "nesw", "ew"];
		const list = HANDLES.map((handle, index) => {
			const [ax, ay] = handleAnchor(handle);
			const point = rotatePoint(
				[single.x + ax * single.w, single.y + ay * single.h],
				pivot,
				single.rot ?? 0,
			);
			return {
				id: handle as string,
				at: px(point),
				cursor: `${cursors[index]}-resize`,
			};
		});
		const top = rotatePoint(
			[single.x + single.w / 2, single.y - 28 / k],
			pivot,
			single.rot ?? 0,
		);
		return [...list, { id: "rotate", at: px(top), cursor: "grab" }];
	});
	const pen = $derived(
		editor.tool === "highlighter" ? editor.marker : editor.pen,
	);
</script>

<svelte:document
	oncopy={(event) => copy(event, false)}
	oncut={(event) => copy(event, true)}
	onpaste={paste}
	onselectionchange={() => {
		if (editor.editing) {
			editor.rememberSelection();
		}
	}}
/>

<!-- A custom widget: it takes the keyboard and the pointer itself. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
	bind:this={stage}
	bind:clientWidth={stageWidth}
	bind:clientHeight={stageHeight}
	class="bg-muted/40 relative flex min-h-0 flex-1 overflow-auto rounded-lg border outline-none max-sm:aspect-3/2 max-sm:flex-none"
	role="application"
	aria-label={m.slides_canvas()}
	tabindex="0"
	onkeydown={keydown}
	onbeforeinput={beforeinput}
	ondragover={(event) => event.preventDefault()}
	ondrop={drop}
	onwheel={wheel}
>
	{#if editor.slide}
		<div
			bind:this={paper}
			class="relative m-auto shrink-0 shadow-lg"
			class:invisible={stageWidth === 0}
			class:cursor-crosshair={editor.tool !== "select"}
			style:touch-action={editor.readOnly ? "auto" : "none"}
			role="presentation"
			onpointerdown={down}
			onpointermove={move}
			onpointerup={up}
			onpointercancel={up}
		>
			<SlideView
				deck={editor.deck}
				slide={editor.slide}
				width={slideWidth * scale}
				{media}
				{prompt}
				{label}
				editing={editor.editing}
				{onEditorRoot}
				hit
			/>
			<svg
				class="pointer-events-none absolute inset-0 overflow-visible"
				width={slideWidth * scale}
				height={slideHeight * scale}
				aria-hidden="true"
			>
				{#each editor.selection as element (element.id)}
					<polygon points={outline(element)} class="fill-none stroke-primary" stroke-width="1.5" />
				{/each}
				{#if single && !isLineElement(single) && handles.length > 0}
					{@const top = handles.find((handle) => handle.id === "n")}
					{@const knob = handles.find((handle) => handle.id === "rotate")}
					{#if top && knob}
						<line x1={top.at[0]} y1={top.at[1]} x2={knob.at[0]} y2={knob.at[1]} class="stroke-primary" stroke-width="1" />
					{/if}
				{/if}
				{#each handles as handle (handle.id)}
					<g class="pointer-events-auto" style:cursor={handle.cursor} data-handle={handle.id}>
						<circle cx={handle.at[0]} cy={handle.at[1]} r="14" fill="transparent" />
						<circle
							cx={handle.at[0]}
							cy={handle.at[1]}
							r={handle.id === "rotate" ? 6 : 5}
							class="fill-background stroke-primary"
							stroke-width="1.5"
						/>
					</g>
				{/each}
				{#each pointer.guides as guide, index (index)}
					{#if guide.axis === "x"}
						<line x1={guide.at * k} x2={guide.at * k} y1="0" y2={slideHeight * scale} class="stroke-pink-500" stroke-width="1" stroke-dasharray="4 3" />
					{:else}
						<line y1={guide.at * k} y2={guide.at * k} x1="0" x2={slideWidth * scale} class="stroke-pink-500" stroke-width="1" stroke-dasharray="4 3" />
					{/if}
				{/each}
				{#if pointer.marquee}
					<rect
						x={pointer.marquee.x * k}
						y={pointer.marquee.y * k}
						width={pointer.marquee.w * k}
						height={pointer.marquee.h * k}
						class="fill-primary/10 stroke-primary"
						stroke-width="1"
					/>
				{/if}
				{#if pointer.draft}
					<rect
						x={pointer.draft.x * k}
						y={pointer.draft.y * k}
						width={pointer.draft.w * k}
						height={pointer.draft.h * k}
						class="stroke-primary fill-none"
						stroke-width="1.5"
						stroke-dasharray="5 4"
					/>
				{/if}
				{#if pointer.ink.length > 0}
					<polyline
						points={pointer.ink.map((point) => px(point).join(",")).join(" ")}
						fill="none"
						stroke={cssColor(pen.color, editor.palette)}
						stroke-width={pen.width * k}
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				{/if}
			</svg>
		</div>
	{/if}
</div>
