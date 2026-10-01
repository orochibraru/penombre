<script lang="ts">
	import {
		AlignCenterIcon,
		AlignJustifyIcon,
		AlignLeftIcon,
		AlignRightIcon,
		ArrowUpRightIcon,
		BoldIcon,
		CheckIcon,
		ChevronDownIcon,
		EraserIcon,
		HighlighterIcon,
		ImageIcon,
		ItalicIcon,
		ListIcon,
		ListOrderedIcon,
		MinusIcon,
		MousePointer2Icon,
		PaintBucketIcon,
		PencilIcon,
		PenLineIcon,
		PlayIcon,
		PlusIcon,
		Redo2Icon,
		ShapesIcon,
		SlashIcon,
		SquareDashedIcon,
		StrikethroughIcon,
		TypeIcon,
		UnderlineIcon,
		Undo2Icon,
		ZoomInIcon,
		ZoomOutIcon,
	} from "@lucide/svelte";
	import type { Component, Snippet } from "svelte";
	import Button from "#lib/components/ui/button/button.svelte";
	import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js";
	import * as Popover from "#lib/components/ui/popover/index.js";
	import { toggleVariants } from "#lib/components/ui/toggle/toggle.svelte";
	import { m } from "#lib/paraglide/messages.js";
	import { outlines } from "#lib/slides/geometry.js";
	import type { Align, Color } from "#lib/slides/model.js";
	import { FONT_CHOICES, typeface } from "#lib/slides/text.js";
	import { cn } from "#lib/utils.js";
	import ColorPicker from "./color-picker.svelte";
	import { SHAPES } from "./labels.js";
	import type { SlidesEditor, Tool } from "./state.svelte.js";

	/**
	 * The row under the menus: tools, then whatever formatting the
	 * selection takes. One scrolling line on a phone.
	 */
	let {
		editor,
		onImage,
		onPresent,
		idle,
	}: {
		editor: SlidesEditor;
		onImage: () => void;
		onPresent: () => void;
		/** What the row offers when nothing is selected: the slide's own settings. */
		idle?: Snippet;
	} = $props();

	const format = $derived(editor.currentFormat());
	const shapes = $derived(
		editor.selection.filter((element) => element.kind === "shape"),
	);
	const shape = $derived(shapes[0]?.kind === "shape" ? shapes[0] : undefined);
	const theme = $derived(
		editor.master?.theme ?? {
			name: "",
			colors: {},
			fonts: { heading: "Arial", body: "Arial" },
		},
	);
	const SIZES = [
		8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 54, 60, 72, 96, 120,
	];
	const WIDTHS = [0.5, 1, 1.5, 2, 3, 4.5, 6, 8, 12];
	const SPACINGS = [90, 100, 115, 150, 200];
	const ALIGNS: [Align, typeof AlignLeftIcon, () => string][] = [
		["l", AlignLeftIcon, m.editor_align_left],
		["ctr", AlignCenterIcon, m.editor_align_center],
		["r", AlignRightIcon, m.editor_align_right],
		["just", AlignJustifyIcon, m.editor_align_justify],
	];

	function use(tool: Tool) {
		if (editor.editing) {
			editor.stopEditing();
		}
		editor.tool = editor.tool === tool && tool !== "select" ? "select" : tool;
	}

	function setFill(color: Color | null) {
		editor.updateSelected((element) =>
			element.kind === "shape"
				? {
						...element,
						fill: color ? { type: "solid", color } : { type: "none" },
					}
				: element,
		);
	}

	function setOutline(color: Color | null) {
		editor.updateSelected((element) => {
			if (element.kind !== "shape") {
				return element;
			}
			const width = element.line.width || 12_700;
			return {
				...element,
				line: {
					...element.line,
					width,
					fill: color ? { type: "solid", color } : { type: "none" },
				},
			};
		});
	}

	function setWidth(points: number) {
		editor.updateSelected((element) =>
			element.kind === "shape"
				? {
						...element,
						line: { ...element.line, width: Math.round(points * 12_700) },
					}
				: element,
		);
	}

	function setRadius(value: number) {
		editor.updateSelected((element) =>
			element.kind === "shape" &&
			"preset" in element.geometry &&
			element.geometry.preset === "roundRect"
				? { ...element, geometry: { preset: "roundRect", adj: { adj: value } } }
				: element,
		);
	}

	const penColor = $derived(
		editor.tool === "highlighter" ? editor.marker : editor.pen,
	);
</script>

{#snippet button(label: string, Icon: Component, run: () => void, pressed = false, disabled = false)}
	<button
		type="button"
		class={toggleVariants({ size: "sm" })}
		data-state={pressed ? "on" : "off"}
		aria-label={label}
		aria-pressed={pressed}
		title={label}
		{disabled}
		onmousedown={(event) => event.preventDefault()}
		onclick={run}
	>
		<Icon class="size-4" />
	</button>
{/snippet}

{#snippet separator()}
	<span class="bg-border mx-0.5 h-5 w-px shrink-0"></span>
{/snippet}

{#snippet shapeIcon(preset: string)}
	<svg viewBox="-2 -2 28 22" class="size-5 shrink-0" aria-hidden="true">
		{#each outlines({ preset }, 24, 18) as outline, index (index)}
			<path d={outline.d} class="fill-primary/20 stroke-current" stroke-width="1.5" />
		{/each}
	</svg>
{/snippet}

<div
	class="flex shrink-0 items-center gap-1 rounded-lg border p-1"
	role="toolbar"
	aria-label={m.slides_toolbar()}
>
	<!-- The tools scroll; zoom and Present stay in reach. -->
	<div class="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto scrollbar-thin">
	{@render button(m.editor_undo(), Undo2Icon, () => editor.undo(), false, !editor.canUndo)}
	{@render button(m.editor_redo(), Redo2Icon, () => editor.redo(), false, !editor.canRedo)}
	{@render separator()}
	{@render button(m.slides_tool_select(), MousePointer2Icon, () => use("select"), editor.tool === "select")}
	{@render button(m.slides_tool_text(), TypeIcon, () => use("text"), editor.tool === "text")}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class={cn(
				toggleVariants({ size: "sm" }),
				"shrink-0 gap-0.5",
				editor.tool === "shape" && "bg-accent text-accent-foreground",
			)}
			aria-pressed={editor.tool === "shape"}
			aria-label={m.slides_tool_shape()}
			title={m.slides_tool_shape()}
		>
			<ShapesIcon class="size-4" />
			<ChevronDownIcon class="size-3 opacity-60" />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-64 p-2">
			<div class="grid grid-cols-6 gap-1">
				{#each SHAPES as [preset, label] (preset)}
					<DropdownMenu.Item
						class="justify-center p-1.5"
						title={label()}
						aria-label={label()}
						onSelect={() => {
							editor.shapePreset = preset;
							use("shape");
							editor.tool = "shape";
						}}
					>
						{@render shapeIcon(preset)}
					</DropdownMenu.Item>
				{/each}
			</div>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
	{@render button(m.slides_tool_line(), SlashIcon, () => use("line"), editor.tool === "line")}
	{@render button(m.slides_tool_arrow(), ArrowUpRightIcon, () => use("arrow"), editor.tool === "arrow")}
	{@render button(m.slides_tool_image(), ImageIcon, onImage)}
	{@render separator()}
	{@render button(m.slides_tool_pen(), PencilIcon, () => use("pen"), editor.tool === "pen")}
	{@render button(m.slides_tool_highlighter(), HighlighterIcon, () => use("highlighter"), editor.tool === "highlighter")}
	{@render button(m.slides_tool_eraser(), EraserIcon, () => use("eraser"), editor.tool === "eraser")}
	{#if editor.tool === "pen" || editor.tool === "highlighter"}
		{@const pen = editor.tool === "pen" ? editor.pen : editor.marker}
		<ColorPicker
			label={m.slides_pen_colour()}
			icon={PenLineIcon}
			value={penColor.color}
			palette={editor.palette}
			onPick={(color) => {
				if (color) {
					pen.color = editor.tool === "highlighter" ? { ...color, mods: [["alpha", 45_000]] } : color;
				}
			}}
		/>
		<Popover.Root>
			<Popover.Trigger class={cn(toggleVariants({ size: "sm" }), "shrink-0 gap-1 px-2 text-xs tabular-nums")} title={m.slides_pen_width()}>
				{Math.round((pen.width / 12_700) * 10) / 10} pt
			</Popover.Trigger>
			<Popover.Content class="flex w-auto gap-1 p-2">
				{#each editor.tool === "pen" ? [1, 2, 3, 5, 8] : [8, 12, 16, 24] as points (points)}
					<button
						type="button"
						class="hover:bg-muted grid size-9 place-items-center rounded-md"
						aria-label="{points} pt"
						onclick={() => (pen.width = points * 12_700)}
					>
						<span class="bg-foreground rounded-full" style:width="{Math.min(points * 2, 24)}px" style:height="{Math.min(points * 2, 24)}px"></span>
					</button>
				{/each}
			</Popover.Content>
		</Popover.Root>
	{/if}

	{#if format && !editor.readOnly}
		{@render separator()}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger class={cn(toggleVariants({ size: "sm" }), "w-32 shrink-0 justify-between gap-1")} title={m.doc_font()} onmousedown={(event: MouseEvent) => event.preventDefault()}>
				<span class="truncate">{typeface(format.font, theme)}</span>
				<ChevronDownIcon class="size-3 opacity-60" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="max-h-80" onCloseAutoFocus={(event: Event) => event.preventDefault()}>
				<DropdownMenu.Item onSelect={() => editor.formatText({ font: "+mj-lt" })}>
					{m.slides_font_heading({ font: theme.fonts.heading })}
				</DropdownMenu.Item>
				<DropdownMenu.Item onSelect={() => editor.formatText({ font: "+mn-lt" })}>
					{m.slides_font_body({ font: theme.fonts.body })}
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				{#each FONT_CHOICES as font (font)}
					<DropdownMenu.Item style="font-family: '{font}'" onSelect={() => editor.formatText({ font })}>
						{font}
						{#if typeface(format.font, theme) === font}<CheckIcon class="text-primary ms-auto size-4" />{/if}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
		<div class="flex shrink-0 items-center">
			{@render button(m.slides_smaller(), MinusIcon, () => editor.formatText({ size: Math.max(1, Math.round(format.size) - 2) }))}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class={cn(toggleVariants({ size: "sm" }), "w-10 shrink-0 px-1 tabular-nums")} title={m.doc_font_size()} onmousedown={(event: MouseEvent) => event.preventDefault()}>
					{Math.round(format.size * 10) / 10}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="max-h-80" onCloseAutoFocus={(event: Event) => event.preventDefault()}>
					{#each SIZES as size (size)}
						<DropdownMenu.Item onSelect={() => editor.formatText({ size })}>{size}</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
			{@render button(m.slides_larger(), PlusIcon, () => editor.formatText({ size: Math.round(format.size) + 2 }))}
		</div>
		{@render button(m.editor_bold(), BoldIcon, () => editor.toggle("bold"), !!format.bold)}
		{@render button(m.editor_italic(), ItalicIcon, () => editor.toggle("italic"), !!format.italic)}
		{@render button(m.editor_underline(), UnderlineIcon, () => editor.toggle("underline"), !!format.underline)}
		{@render button(m.editor_strikethrough(), StrikethroughIcon, () => editor.toggle("strike"), !!format.strike)}
		<ColorPicker
			label={m.doc_text_colour()}
			icon={TypeIcon}
			value={format.color}
			palette={editor.palette}
			onPick={(color) => color && editor.formatText({ color })}
		/>
		{@render separator()}
		{#each ALIGNS as [align, Icon, label] (align)}
			{@render button(label(), Icon, () => editor.formatParagraph({ align }), (format.align ?? "l") === align)}
		{/each}
		{@render button(
			m.editor_bullet_list(),
			ListIcon,
			() => editor.formatParagraph({ bullet: format.bullet?.type === "char" ? { type: "none" } : { type: "char", char: "•" } }),
			format.bullet?.type === "char",
		)}
		{@render button(
			m.editor_numbered_list(),
			ListOrderedIcon,
			() => editor.formatParagraph({ bullet: format.bullet?.type === "number" ? { type: "none" } : { type: "number", scheme: "arabicPeriod" } }),
			format.bullet?.type === "number",
		)}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger class={cn(toggleVariants({ size: "sm" }), "shrink-0 gap-0.5 px-2 text-xs")} title={m.doc_line_spacing()} onmousedown={(event: MouseEvent) => event.preventDefault()}>
				{((format.lineSpacing ?? 100) / 100).toFixed(2).replace(/0$/, "")}
				<ChevronDownIcon class="size-3 opacity-60" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content onCloseAutoFocus={(event: Event) => event.preventDefault()}>
				{#each SPACINGS as spacing (spacing)}
					<DropdownMenu.Item onSelect={() => editor.formatParagraph({ lineSpacing: spacing })}>
						{(spacing / 100).toFixed(2).replace(/0$/, "")}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{/if}

	{#if shape && !editor.readOnly}
		{@render separator()}
		<ColorPicker
			label={m.slides_fill()}
			icon={PaintBucketIcon}
			value={shape.fill.type === "solid" ? shape.fill.color : undefined}
			palette={editor.palette}
			none={m.slides_no_fill()}
			onPick={setFill}
		/>
		<ColorPicker
			label={m.slides_outline()}
			icon={SquareDashedIcon}
			value={shape.line.fill.type === "solid" ? shape.line.fill.color : undefined}
			palette={editor.palette}
			none={m.slides_no_outline()}
			onPick={setOutline}
		/>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger class={cn(toggleVariants({ size: "sm" }), "shrink-0 gap-0.5 px-2 text-xs tabular-nums")} title={m.slides_outline_width()}>
				{Math.round((shape.line.width / 12_700) * 10) / 10} pt
				<ChevronDownIcon class="size-3 opacity-60" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				{#each WIDTHS as width (width)}
					<DropdownMenu.Item onSelect={() => setWidth(width)}>
						<span class="bg-foreground w-10 rounded-full" style:height="{Math.max(1, width)}px"></span>
						{width} pt
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
		{#if "preset" in shape.geometry && shape.geometry.preset === "roundRect"}
			<label class="flex shrink-0 items-center gap-1.5 px-1.5 text-xs" title={m.slides_corner_radius()}>
				<span class="sr-only">{m.slides_corner_radius()}</span>
				<input
					type="range"
					min="0"
					max="50000"
					step="1000"
					class="accent-primary w-20"
					value={shape.geometry.adj?.adj ?? 16_667}
					onchange={(event) => setRadius(Number(event.currentTarget.value))}
				/>
			</label>
		{/if}
	{/if}

	{#if idle && !editor.readOnly && editor.selected.length === 0 && !editor.editing && editor.tool === "select"}
		{@render separator()}
		{@render idle()}
	{/if}

	</div>
	<div class="flex shrink-0 items-center gap-0.5">
		{@render button(m.slides_zoom_out(), ZoomOutIcon, () => (editor.zoom = Math.max(0.1, (editor.zoom ?? editor.fitZoom) / 1.25)))}
		<button
			type="button"
			class={cn(toggleVariants({ size: "sm" }), "w-14 px-1 text-xs tabular-nums")}
			title={m.slides_zoom_fit()}
			onclick={() => (editor.zoom = null)}
		>
			{editor.zoom === null ? m.slides_zoom_fit() : `${Math.round(editor.zoom * 100)}%`}
		</button>
		{@render button(m.slides_zoom_in(), ZoomInIcon, () => (editor.zoom = Math.min(4, (editor.zoom ?? editor.fitZoom) * 1.25)))}
		<Button size="sm" class="ms-1" onclick={onPresent}>
			<PlayIcon class="size-3.5" />
			{m.deck_present()}
		</Button>
	</div>
</div>
