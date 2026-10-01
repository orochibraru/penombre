<script lang="ts">
	import { GripVerticalIcon } from "@lucide/svelte";
	import { flip } from "svelte/animate";
	import type { Deck, SlideLook, ThemeName } from "#lib/deck/format.js";
	import { m } from "#lib/paraglide/messages.js";
	import { cn } from "#lib/utils.js";
	import SlideView from "./slide-view.svelte";

	/**
	 * Thumbnails of every slide. Dragging one moves it: with a mouse from
	 * anywhere on it, on a touch screen from its grip, so the strip still
	 * scrolls under a finger.
	 */
	let {
		deck,
		looks,
		theme,
		current = $bindable(),
		reorder,
		onmove,
		marked,
	}: {
		deck: Deck;
		looks: SlideLook[];
		theme: ThemeName;
		current: number;
		reorder: boolean;
		onmove: (from: number, to: number) => void;
		/** Slides with an open comment, by index. */
		marked?: ReadonlySet<number>;
	} = $props();

	let list = $state<HTMLUListElement>();
	let drag = $state<{
		from: number;
		to: number;
		pointer: number;
		x: number;
		y: number;
		active: boolean;
	} | null>(null);
	/** A drag ends in a click on the item it started from; that click is not a pick. */
	let dragged = false;

	/** The gap the pointer is over: the first item whose middle is past it. */
	function dropIndex(x: number, y: number): number {
		if (!list) {
			return 0;
		}
		const vertical = getComputedStyle(list).flexDirection === "column";
		const items = [...list.querySelectorAll<HTMLElement>("[data-slide]")];
		const at = items.findIndex((item) => {
			const box = item.getBoundingClientRect();
			return vertical
				? y < box.top + box.height / 2
				: x < box.left + box.width / 2;
		});
		return at === -1 ? items.length : at;
	}

	function start(event: PointerEvent, index: number) {
		dragged = false;
		const onGrip = (event.target as Element).closest("[data-grip]");
		if (
			!reorder ||
			event.button !== 0 ||
			(event.pointerType === "touch" && !onGrip)
		) {
			return;
		}
		drag = {
			from: index,
			to: index,
			pointer: event.pointerId,
			x: event.clientX,
			y: event.clientY,
			active: false,
		};
		(event.currentTarget as Element).setPointerCapture(event.pointerId);
	}

	function move(event: PointerEvent) {
		if (!drag || event.pointerId !== drag.pointer) {
			return;
		}
		if (
			!drag.active &&
			Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6
		) {
			return;
		}
		drag.active = true;
		drag.to = dropIndex(event.clientX, event.clientY);
	}

	function end(event: PointerEvent) {
		if (!drag || event.pointerId !== drag.pointer) {
			return;
		}
		const { from, to, active } = drag;
		drag = null;
		if (!active) {
			return;
		}
		dragged = true;
		const target = to > from ? to - 1 : to;
		if (target !== from) {
			onmove(from, target);
		}
	}

	function pick(index: number) {
		if (dragged) {
			dragged = false;
			return;
		}
		current = index;
	}

	/** Where the drop line shows: before an item, or after the last. */
	function dropEdge(index: number): string | false {
		if (!drag?.active || drag.to === drag.from || drag.to === drag.from + 1) {
			return false;
		}
		if (drag.to === index) {
			return "shadow-[-5px_0_0_0_var(--primary)] sm:shadow-[0_-5px_0_0_var(--primary)]";
		}
		return (
			drag.to === deck.slides.length &&
			index === deck.slides.length - 1 &&
			"shadow-[5px_0_0_0_var(--primary)] sm:shadow-[0_5px_0_0_var(--primary)]"
		);
	}
</script>

<ul
    bind:this={list}
    class="flex shrink-0 gap-2 overflow-x-auto p-1 select-none sm:w-44 sm:flex-col sm:overflow-x-visible sm:overflow-y-auto"
>
    {#each deck.slides as slide, index (slide)}
        <li
            data-slide
            class={cn(
                "relative w-32 shrink-0 rounded-lg sm:w-auto",
                drag?.active && drag.from === index && "opacity-40",
                dropEdge(index),
            )}
            animate:flip={{ duration: 150 }}
        >
            <button
                type="button"
                aria-label={m.deck_slide_label({ number: String(index + 1) })}
                aria-current={index === current ? "true" : undefined}
                class={cn(
                    "hover:border-primary/60 flex w-full items-start gap-1.5 rounded-lg border p-1.5 text-left transition-colors",
                    index === current && "border-primary bg-primary/5",
                )}
                onpointerdown={(event) => start(event, index)}
                onpointermove={move}
                onpointerup={end}
                onpointercancel={() => (drag = null)}
                onclick={() => pick(index)}
            >
                <span class="flex flex-col items-center gap-1">
                    <span class="text-muted-foreground text-[10px] tabular-nums">
                        {index + 1}
                    </span>
                    {#if marked?.has(index)}
                        <span
                            class="bg-primary size-2 rounded-full rounded-bl-none"
                            aria-hidden="true"
                        ></span>
                    {/if}
                    {#if reorder}
                        <span
                            data-grip
                            class="text-muted-foreground -mx-1 touch-none px-1 py-1 sm:cursor-grab"
                            title={m.deck_drag_slide()}
                        >
                            <GripVerticalIcon class="size-3" />
                        </span>
                    {/if}
                </span>
                <SlideView
                    {slide}
                    look={looks[index]}
                    {theme}
                    number={index + 1}
                    inert
                    class="pointer-events-none aspect-video min-w-0 flex-1 rounded-sm border"
                />
            </button>
        </li>
    {/each}
</ul>
