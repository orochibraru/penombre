<script lang="ts">
	import { PencilIcon, SearchIcon } from "@lucide/svelte";
	import { m } from "#lib/paraglide/messages.js";
	import type { ChipColor } from "#lib/sheet/dropdowns.js";
	import { cn } from "#lib/utils.js";

	/**
	 * A dropdown's items under its cell: opened from the chevron or Alt+↓
	 * with a search box, or listed while a value is typed into the cell
	 * (`search` false, the cell's editor keeping the focus). Fixed-positioned
	 * so the grid's scroll box cannot clip it.
	 */
	const {
		items,
		colorOf,
		anchor,
		current = "",
		search = true,
		onpick,
		onclose,
		onedit,
	}: {
		items: string[];
		colorOf: (item: string) => ChipColor | undefined;
		anchor: HTMLElement | null | undefined;
		current?: string;
		search?: boolean;
		onpick: (item: string) => void;
		onclose: () => void;
		onedit?: () => void;
	} = $props();

	let query = $state("");
	let highlighted = $state(0);
	let root = $state<HTMLDivElement>();

	const shown = $derived(
		query.trim() === ""
			? items
			: items.filter((item) =>
					item.toLowerCase().includes(query.trim().toLowerCase()),
				),
	);
	const box = $derived.by(() => {
		void items;
		return anchor?.getBoundingClientRect();
	});
	/** Opens upwards when the cell sits low on the screen. */
	const above = $derived(
		box !== undefined &&
			typeof window !== "undefined" &&
			box.bottom + 280 > window.innerHeight &&
			box.top > 280,
	);

	$effect(() => {
		void shown.length;
		highlighted = Math.max(
			0,
			shown.findIndex((item) => item === current),
		);
	});

	/** The list's keys; true when the key was the list's. */
	export function key(event: KeyboardEvent): boolean {
		if (event.isComposing) {
			return false;
		}
		const count = shown.length;
		switch (event.key) {
			case "ArrowDown":
				highlighted = count ? (highlighted + 1) % count : 0;
				return true;
			case "ArrowUp":
				highlighted = count ? (highlighted - 1 + count) % count : 0;
				return true;
			case "Enter":
			case "Tab": {
				const item = shown[highlighted];
				if (item === undefined) {
					return false;
				}
				onpick(item);
				return true;
			}
			case "Escape":
				onclose();
				return true;
			default:
				return false;
		}
	}

	function focusSearch(node: HTMLInputElement) {
		// A phone's keyboard would cover the list it was opened to show.
		if (!matchMedia("(pointer: coarse)").matches) {
			node.focus({ preventScroll: true });
		}
	}

	function outside(event: PointerEvent) {
		if (search && root && !root.contains(event.target as Node)) {
			onclose();
		}
	}
</script>

<svelte:window onpointerdown={outside} />

{#if box}
    <div
        bind:this={root}
        data-sheet-editor
        class="bg-popover text-popover-foreground fixed z-50 flex max-h-72 max-w-[min(20rem,calc(100vw-1rem))] min-w-44 flex-col overflow-hidden rounded-md border text-sm shadow-md"
        style="left: {Math.max(8, box.left)}px; {above
            ? `bottom: ${window.innerHeight - box.top + 4}px`
            : `top: ${box.bottom + 4}px`}; min-width: {Math.max(176, box.width)}px"
    >
        {#if search}
            <div class="relative border-b">
                <SearchIcon
                    class="text-muted-foreground pointer-events-none absolute inset-s-2 top-1/2 size-3.5 -translate-y-1/2"
                />
                <input
                    use:focusSearch
                    type="search"
                    bind:value={query}
                    placeholder={m.sheet_dropdown_search()}
                    aria-label={m.sheet_dropdown_search()}
                    class="h-9 w-full bg-transparent ps-7 pe-2 text-base outline-none md:text-sm"
                    onkeydown={(e) => {
                        if (key(e)) {
                            e.preventDefault();
                        }
                        e.stopPropagation();
                    }}
                />
            </div>
        {/if}
        <ul role="listbox" aria-label={m.sheet_dropdown()} class="min-h-0 overflow-y-auto py-1">
            {#each shown as item, i (item)}
                {@const color = colorOf(item)}
                <li role="option" aria-selected={i === highlighted}>
                    <!-- mousedown keeps the focus where it is: the cell's
                         editor, when typing. -->
                    <button
                        type="button"
                        tabindex="-1"
                        class={cn(
                            "flex w-full items-center px-2 py-1.5 text-start",
                            i === highlighted && "bg-accent text-accent-foreground",
                        )}
                        onmousedown={(e) => e.preventDefault()}
                        onclick={() => onpick(item)}
                    >
                        <span
                            class={cn(
                                "max-w-full truncate rounded-full px-2 py-0.5 text-xs leading-4",
                                !color && "bg-muted text-foreground",
                            )}
                            style={color
                                ? `background-color: ${color.fill}; color: ${color.text ?? "#000000"}`
                                : undefined}
                        >
                            {item}
                        </span>
                    </button>
                </li>
            {/each}
        </ul>
        {#if shown.length === 0}
            <p class="text-muted-foreground px-3 py-2 text-xs">{m.sheet_dropdown_none()}</p>
        {/if}
        {#if onedit}
            <button
                type="button"
                class="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 border-t px-3 py-2 text-xs"
                onmousedown={(e) => e.preventDefault()}
                onclick={onedit}
            >
                <PencilIcon class="size-3.5" />
                {m.sheet_dropdown_edit()}
            </button>
        {/if}
    </div>
{/if}
