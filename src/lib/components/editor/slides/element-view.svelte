<script lang="ts">
	import { ImageIcon, TableIcon } from "@lucide/svelte";
	import { cssColor } from "#lib/slides/color.js";
	import { arrowHead, isLine, outlines } from "#lib/slides/geometry.js";
	import {
		EMU_PER_PT,
		type Fill,
		type Line,
		type SlideElement,
	} from "#lib/slides/model.js";
	// oxlint-disable-next-line import/no-self-import -- a group draws its members with this same component
	import ElementView from "./element-view.svelte";
	import type { RenderContext } from "./render-context.js";
	import { buildText } from "./text-dom.js";

	/**
	 * One element, drawn in slide points. Shapes are inline SVG so they stay
	 * sharp at every zoom; text is HTML laid over them so it wraps and edits
	 * like text. Group members are positioned inside their group's box.
	 */
	let {
		element,
		context,
		origin = { x: 0, y: 0 },
		top = false,
	}: {
		element: SlideElement;
		context: RenderContext;
		/** The parent group's corner, for a member. */
		origin?: { x: number; y: number };
		/** Hit-testable: carries the id the canvas selects by. */
		top?: boolean;
	} = $props();

	const uid = $props.id();
	const pt = (emu: number) => emu / EMU_PER_PT;
	const w = $derived(pt(element.w));
	const h = $derived(pt(element.h));
	const editing = $derived(context.editing === element.id);

	function paint(fill: Fill | undefined, id: string): string {
		if (!fill || fill.type === "none" || fill.type === "image") {
			return "none";
		}
		return fill.type === "solid"
			? cssColor(fill.color, context.palette)
			: `url(#${id})`;
	}

	function stroke(line: Line | undefined): Record<string, string> {
		if (!line || line.fill.type !== "solid" || line.width <= 0) {
			return { stroke: "none" };
		}
		const width = Math.max(0.5, pt(line.width));
		const dashes: Record<string, number[]> = {
			dash: [4, 3],
			sysDash: [3, 1],
			dot: [1, 2],
			sysDot: [1, 1],
			lgDash: [8, 3],
			dashDot: [4, 3, 1, 3],
		};
		const dash = line.dash ? dashes[line.dash] : undefined;
		return {
			stroke: cssColor(line.fill.color, context.palette),
			"stroke-width": String(width),
			"stroke-linecap":
				line.cap === "rnd" ? "round" : line.cap === "sq" ? "square" : "butt",
			"stroke-linejoin": "round",
			"stroke-dasharray": dash ? dash.map((d) => d * width).join(" ") : "none",
		};
	}

	const gradient = $derived(
		element.kind === "shape" && element.fill.type === "gradient"
			? element.fill
			: null,
	);

	const transform = $derived(element.rot ? `rotate(${element.rot}deg)` : "");
	const flip = $derived(
		element.flipH || element.flipV
			? `scale(${element.flipH ? -1 : 1}, ${element.flipV ? -1 : 1})`
			: "",
	);
	const hasText = $derived(
		element.kind === "shape" &&
			!!element.text &&
			(editing ||
				element.text.paragraphs.some((p) =>
					p.runs.some((r) => r.text !== ""),
				) ||
				(!!element.placeholder && !!context.prompt?.(element))),
	);
</script>

<div
	data-el={top ? element.id : undefined}
	class="absolute"
	style:left="{pt(element.x - origin.x)}px"
	style:top="{pt(element.y - origin.y)}px"
	style:width="{w}px"
	style:height="{h}px"
	style:transform={transform}
>
	{#if element.kind === "shape"}
		<svg
			class="absolute top-0 left-0 overflow-visible"
			width={Math.max(w, 1)}
			height={Math.max(h, 1)}
			style:transform={flip}
			aria-hidden="true"
		>
			{#if gradient}
				<defs>
					{#if gradient.radial}
						<radialGradient id="{uid}-g" cx="50%" cy="50%" r="50%">
							{#each gradient.stops as stop, index (index)}
								<stop offset="{stop.pos / 1000}%" stop-color={cssColor(stop.color, context.palette)} />
							{/each}
						</radialGradient>
					{:else}
						{@const angle = (gradient.angle * Math.PI) / 180}
						<linearGradient
							id="{uid}-g"
							x1={0.5 - Math.cos(angle) / 2}
							y1={0.5 - Math.sin(angle) / 2}
							x2={0.5 + Math.cos(angle) / 2}
							y2={0.5 + Math.sin(angle) / 2}
						>
							{#each gradient.stops as stop, index (index)}
								<stop offset="{stop.pos / 1000}%" stop-color={cssColor(stop.color, context.palette)} />
							{/each}
						</linearGradient>
					{/if}
				</defs>
			{/if}
			{#each outlines(element.geometry, w, h) as outline, index (index)}
				<path
					d={outline.d}
					fill={outline.fill ? paint(element.fill, `${uid}-g`) : "none"}
					{...outline.stroke ? stroke(element.line) : { stroke: "none" }}
				/>
			{/each}
			{#if isLine(element.geometry) && element.line.fill.type === "solid"}
				{@const color = cssColor(element.line.fill.color, context.palette)}
				{@const width = pt(element.line.width)}
				{#if element.line.tail}
					<path d={arrowHead([w, h], [0, 0], width, element.line.tail)} fill={color} stroke={color} stroke-width={width / 2} />
				{/if}
				{#if element.line.head}
					<path d={arrowHead([0, 0], [w, h], width, element.line.head)} fill={color} stroke={color} stroke-width={width / 2} />
				{/if}
			{/if}
		</svg>
		{#if hasText && element.text}
			{@const text = element.text}
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div
				class="slide-text absolute inset-0 flex flex-col"
				class:cursor-text={editing}
				contenteditable={editing ? "true" : undefined}
				spellcheck={editing}
				role={editing ? "textbox" : undefined}
				aria-multiline={editing ? "true" : undefined}
				tabindex={editing ? 0 : undefined}
				{@attach (node) => {
					buildText(node, text, {
						theme: context.theme,
						palette: context.palette,
						prompt: editing ? undefined : context.prompt?.(element),
					});
					if (editing) {
						context.onEditorRoot?.(node);
					}
				}}
			></div>
		{/if}
	{:else if element.kind === "image"}
		{@const crop = element.crop ?? { l: 0, t: 0, r: 0, b: 0 }}
		{@const fullW = w / Math.max(0.01, 1 - (crop.l + crop.r) / 100_000)}
		{@const fullH = h / Math.max(0.01, 1 - (crop.t + crop.b) / 100_000)}
		{@const clip = element.geometry ? outlines(element.geometry, w, h)[0]?.d : undefined}
		{@const href = context.media(element.src)}
		<div
			class="absolute inset-0 overflow-hidden"
			style:clip-path={clip ? `path("${clip}")` : undefined}
			style:transform={flip}
		>
			{#if href}
				<img
					src={href}
					alt={element.descr ?? ""}
					draggable="false"
					class="absolute max-w-none select-none"
					style:left="{-(fullW * crop.l) / 100_000}px"
					style:top="{-(fullH * crop.t) / 100_000}px"
					style:width="{fullW}px"
					style:height="{fullH}px"
				/>
			{:else}
				<div class="bg-muted text-muted-foreground grid size-full place-items-center">
					<ImageIcon class="size-8" />
				</div>
			{/if}
		</div>
		{#if element.line && element.line.fill.type === "solid"}
			<svg class="pointer-events-none absolute inset-0 overflow-visible" width={w} height={h} aria-hidden="true">
				<rect width={w} height={h} fill="none" {...stroke(element.line)} />
			</svg>
		{/if}
	{:else if element.kind === "group"}
		<div class="absolute inset-0" style:transform={flip}>
			{#each element.children as child (child.id)}
				<ElementView element={child} {context} origin={{ x: element.x, y: element.y }} />
			{/each}
		</div>
	{:else if element.preview}
		<ElementView element={{ ...element.preview, x: element.x, y: element.y, w: element.w, h: element.h, rot: 0 }} {context} origin={{ x: element.x, y: element.y }} />
	{:else if element.table}
		{@const total = element.table.columns.reduce((sum, column) => sum + column, 0) || 1}
		<table class="absolute inset-0 size-full table-fixed border-collapse text-[11px]" style:color={cssColor({ scheme: "tx1" }, context.palette)}>
			<colgroup>
				{#each element.table.columns as column, index (index)}
					<col style:width="{(column / total) * 100}%" />
				{/each}
			</colgroup>
			<tbody>
				{#each element.table.rows as row, r (r)}
					<tr>
						{#each row.cells as cell, c (c)}
							<td class="truncate border border-current/25 px-1.5 py-1">{cell.text}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<div class="border-muted-foreground/40 text-muted-foreground bg-muted/30 grid size-full place-items-center rounded-sm border border-dashed text-xs">
			<span class="flex items-center gap-1.5">
				<TableIcon class="size-4" />
				{context.label?.(element.label) ?? element.label}
			</span>
		</div>
	{/if}
</div>

<style>
	:global(.slide-text) {
		overflow-wrap: break-word;
		outline: none;
		font-kerning: normal;
	}
	:global(.slide-text > div) {
		margin: 0;
	}
	:global(.slide-text [data-bullet]::before) {
		content: var(--b);
		color: var(--bc);
		font-family: var(--bf);
		display: inline-block;
		min-width: var(--bw);
		padding-right: 0.3em;
		box-sizing: border-box;
		text-indent: 0;
		font-weight: 400;
		font-style: normal;
		text-decoration: none;
	}
</style>
