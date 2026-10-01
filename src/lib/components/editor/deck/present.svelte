<script lang="ts">
	import {
		ChevronLeftIcon,
		ChevronRightIcon,
		MaximizeIcon,
		XIcon,
	} from "@lucide/svelte";
	import { fade } from "svelte/transition";
	import Button from "#lib/components/ui/button/button.svelte";
	import type { Deck, SlideLook, ThemeName } from "#lib/deck/format.js";
	import { slideKey } from "#lib/deck/present.js";
	import { m } from "#lib/paraglide/messages.js";
	import { cn } from "#lib/utils.js";
	import SlideView from "./slide-view.svelte";

	/**
	 * One slide filling the window, letterboxed on black. Keys, a swipe or a
	 * tap move between slides. Also the audience window's whole page, where
	 * the controls stay hidden until hovered.
	 */
	let {
		deck,
		looks,
		theme,
		index,
		quiet = false,
		onnavigate,
		onexit,
		onfullscreen,
	}: {
		deck: Deck;
		looks: SlideLook[];
		theme: ThemeName;
		index: number;
		quiet?: boolean;
		onnavigate: (index: number) => void;
		onexit: () => void;
		onfullscreen: () => void;
	} = $props();

	const count = $derived(deck.slides.length);
	const shown = $derived(Math.min(index, count - 1));
	/** Digits typed so far, for "12 then Enter". */
	let typed = "";

	const still =
		typeof matchMedia === "function" &&
		matchMedia("(prefers-reduced-motion: reduce)").matches;

	function step(delta: number) {
		onnavigate(Math.min(Math.max(0, shown + delta), count - 1));
	}

	function onkey(event: KeyboardEvent) {
		if (event.metaKey || event.ctrlKey || event.altKey) {
			return;
		}
		const action = slideKey(event.key, shown, count, typed);
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
			onnavigate(action.index);
		}
	}

	let from: { x: number; y: number } | null = null;

	/** A horizontal swipe steps either way; a tap anywhere but a control steps on. */
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
			step(dx < 0 ? 1 : -1);
		} else if (Math.hypot(dx, dy) < 10 && event.button === 0) {
			step(1);
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
    <div class="relative min-h-0 flex-1">
        {#key shown}
            <div
                class="absolute inset-0"
                in:fade={{ duration: still ? 0 : 250 }}
            >
                {#if deck.slides[shown]}
                    <SlideView
                        slide={deck.slides[shown]}
                        look={looks[shown]}
                        {theme}
                        number={shown + 1}
                        class="size-full"
                    />
                {/if}
            </div>
        {/key}
    </div>
    <div class="h-1 shrink-0 bg-white/10">
        <div
            class="bg-primary h-full transition-[width]"
            style:width="{((shown + 1) / count) * 100}%"
        ></div>
    </div>
    <div
        class={cn(
            "absolute bottom-3 left-3 flex items-center gap-1 rounded-lg bg-black/70 p-1 text-white transition-opacity hover:opacity-100 focus-within:opacity-100",
            quiet ? "opacity-0" : "opacity-60",
        )}
    >
        <Button
            variant="ghost"
            size="icon"
            class="hover:bg-white/15 hover:text-white"
            aria-label={m.previous()}
            onclick={() => step(-1)}
        >
            <ChevronLeftIcon />
        </Button>
        <span class="min-w-12 text-center text-xs tabular-nums">
            {shown + 1} / {count}
        </span>
        <Button
            variant="ghost"
            size="icon"
            class="hover:bg-white/15 hover:text-white"
            aria-label={m.next()}
            onclick={() => step(1)}
        >
            <ChevronRightIcon />
        </Button>
        <Button
            variant="ghost"
            size="icon"
            class="hover:bg-white/15 hover:text-white"
            aria-label={m.deck_fullscreen()}
            onclick={onfullscreen}
        >
            <MaximizeIcon />
        </Button>
        <Button
            variant="ghost"
            size="icon"
            class="hover:bg-white/15 hover:text-white"
            aria-label={m.close()}
            onclick={onexit}
        >
            <XIcon />
        </Button>
    </div>
</div>
