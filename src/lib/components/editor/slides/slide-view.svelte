<script lang="ts">
	import type { Snippet } from "svelte";
	import { cssBackground, paletteOf } from "#lib/slides/color.js";
	import {
		type Deck,
		EMU_PER_PT,
		layoutOf,
		masterOf,
		type Slide,
		type SlideElement,
	} from "#lib/slides/model.js";
	import { cn } from "#lib/utils.js";
	import ElementView from "./element-view.svelte";
	import type { RenderContext } from "./render-context.js";

	/**
	 * A slide at any size: laid out once in points and scaled as a whole, so
	 * text wraps the same in a thumbnail, the editor and full screen.
	 */
	let {
		deck,
		slide,
		width,
		media,
		editing = null,
		prompt,
		label,
		onEditorRoot,
		hit = false,
		class: className,
		children,
	}: {
		deck: Deck;
		slide: Slide;
		/** Rendered width in pixels. */
		width: number;
		media: RenderContext["media"];
		editing?: string | null;
		prompt?: RenderContext["prompt"];
		label?: RenderContext["label"];
		onEditorRoot?: RenderContext["onEditorRoot"];
		/** Mark top-level elements so a pointer can find them. */
		hit?: boolean;
		class?: string;
		children?: Snippet;
	} = $props();

	const slideWidth = $derived(deck.width / EMU_PER_PT);
	const slideHeight = $derived(deck.height / EMU_PER_PT);
	const scale = $derived(width / slideWidth);
	const layout = $derived(layoutOf(deck, slide));
	const master = $derived(masterOf(deck, slide));
	const context = $derived<RenderContext>({
		theme: master?.theme ?? {
			name: "",
			colors: {},
			fonts: { heading: "Arial", body: "Arial" },
		},
		palette: paletteOf(master),
		media,
		editing,
		prompt,
		label,
		onEditorRoot,
	});
	const background = $derived(
		cssBackground(
			slide.background ?? layout?.background ?? master?.background,
			context.palette,
			(src) => media(src) ?? "",
		),
	);
	const behind = $derived<SlideElement[]>([
		...(layout?.showMaster === false ? [] : (master?.elements ?? [])),
		...(layout?.elements ?? []),
	]);
</script>

<div
	class={cn("relative shrink-0 overflow-hidden", className)}
	style:width="{width}px"
	style:height="{(width * slideHeight) / slideWidth}px"
>
	<div
		class="absolute top-0 left-0 origin-top-left"
		style:width="{slideWidth}px"
		style:height="{slideHeight}px"
		style:transform="scale({scale})"
		style:background
	>
		<div class="pointer-events-none">
			{#each behind as element, index (index)}
				<ElementView {element} {context} />
			{/each}
		</div>
		{#each slide.elements as element (element.id)}
			<ElementView {element} {context} top={hit} />
		{/each}
	</div>
	{@render children?.()}
</div>
