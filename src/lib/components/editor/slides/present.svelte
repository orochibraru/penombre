<script lang="ts">
	import {
		ChevronLeftIcon,
		ChevronRightIcon,
		MaximizeIcon,
		XIcon,
	} from "@lucide/svelte";
	import { fade } from "svelte/transition";
	import Button from "#lib/components/ui/button/button.svelte";
	import { slideKey } from "#lib/deck/present.js";
	import { m } from "#lib/paraglide/messages.js";
	import { type Deck, EMU_PER_PT } from "#lib/slides/model.js";
	import { cn } from "#lib/utils.js";
	import type { RenderContext } from "./render-context.js";
	import { labelOf, shownSlides } from "./shown.js";
	import SlideView from "./slide-view.svelte";

	/**
	 * One slide filling the window, letterboxed on black, hidden slides
	 * skipped. Keys, a swipe or a tap move between slides. Also the
	 * audience window's whole page, where the controls stay out of sight.
	 */
	let {
		deck,
		index,
		media,
		quiet = false,
		onnavigate,
		onexit,
		onfullscreen,
	}: {
		deck: Deck;
		/** Index into `deck.slides`. */
		index: number;
		media: RenderContext["media"];
		quiet?: boolean;
		onnavigate: (index: number) => void;
		onexit: () => void;
		onfullscreen: () => void;
	} = $props();

	let viewWidth = $state(0);
	let viewHeight = $state(0);
	let typed = "";
	let from: { x: number; y: number } | null = null;

	const shown = $derived(shownSlides(deck));
	const position = $derived(Math.max(0, shown.indexOf(index)));
	const slide = $derived(deck.slides[shown[position] ?? 0]);
	const ratio = $derived(deck.height / deck.width);
	const width = $derived(Math.max(1, Math.min(viewWidth, viewHeight / ratio)));
	const still =
		typeof matchMedia === "function" &&
		matchMedia("(prefers-reduced-motion: reduce)").matches;

	function go(to: number) {
		const clamped = Math.min(Math.max(0, to), shown.length - 1);
		onnavigate(shown[clamped] ?? 0);
	}

	function onkey(event: KeyboardEvent) {
		if (event.metaKey || event.ctrlKey || event.altKey) {
			return;
		}
		const action = slideKey(event.key, position, shown.length, typed);
		if (!action) {
			return;
		}
		event.preventDefault();
		if ("exit" in action) {
			onexit();
		} else if ("fullscreen" in action) {
			onfullscreen();
		} else {
			typed = action.typed;
			go(action.index);
		}
	}

	function release(event: PointerEvent) {
		if (!from) {
			return;
		}
		const dx = event.clientX - from.x;
		const dy = event.clientY - from.y;
		from = null;
		if ((event.target as Element).closest("a, button")) {
			return;
		}
		if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
			go(position + (dx < 0 ? 1 : -1));
		} else if (Math.hypot(dx, dy) < 10 && event.button === 0) {
			go(position + 1);
		}
	}
</script>

<svelte:window onkeydown={onkey} />

<div
	class="fixed inset-0 z-100 flex touch-pan-y flex-col bg-black"
	role="region"
	aria-label={m.deck_presenting()}
	onpointerdown={(event) => (from = { x: event.clientX, y: event.clientY })}
	onpointerup={release}
>
	<div class="relative grid min-h-0 flex-1 place-items-center" bind:clientWidth={viewWidth} bind:clientHeight={viewHeight}>
		{#key slide?.id}
			<div class="absolute inset-0 grid place-items-center" in:fade={{ duration: still ? 0 : 350 }} out:fade={{ duration: still ? 0 : 350 }}>
				{#if slide}
					<SlideView {deck} {slide} {width} {media} label={labelOf} />
				{/if}
			</div>
		{/key}
	</div>
	<div class="h-1 shrink-0 bg-white/10">
		<div class="bg-primary h-full transition-[width]" style:width="{((position + 1) / Math.max(1, shown.length)) * 100}%"></div>
	</div>
	<div
		class={cn(
			"absolute bottom-3 left-3 flex items-center gap-1 rounded-lg bg-black/70 p-1 text-white transition-opacity hover:opacity-100 focus-within:opacity-100",
			quiet ? "opacity-0" : "opacity-60",
		)}
	>
		<Button variant="ghost" size="icon" class="hover:bg-white/15 hover:text-white" aria-label={m.previous()} onclick={() => go(position - 1)}>
			<ChevronLeftIcon />
		</Button>
		<span class="min-w-12 text-center text-xs tabular-nums">{position + 1} / {shown.length}</span>
		<Button variant="ghost" size="icon" class="hover:bg-white/15 hover:text-white" aria-label={m.next()} onclick={() => go(position + 1)}>
			<ChevronRightIcon />
		</Button>
		<Button variant="ghost" size="icon" class="hover:bg-white/15 hover:text-white" aria-label={m.deck_fullscreen()} onclick={onfullscreen}>
			<MaximizeIcon />
		</Button>
		<Button variant="ghost" size="icon" class="hover:bg-white/15 hover:text-white" aria-label={m.close()} onclick={onexit}>
			<XIcon />
		</Button>
	</div>
</div>
