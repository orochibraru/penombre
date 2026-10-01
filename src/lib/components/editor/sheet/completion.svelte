<script lang="ts">
	import {
		type Completion,
		complete,
		completionAt,
		SIGNATURES,
		signatureAt,
	} from "#lib/sheet/catalog.js";
	import { cn } from "#lib/utils.js";

	/**
	 * Function names completing what is typed in a formula, under the input
	 * that holds it, and the signature of the function the caret is in.
	 * Fixed-positioned so the grid's scroll box cannot clip it.
	 */
	const {
		text,
		caret,
		anchor,
		onpick,
	}: {
		text: string;
		caret: number;
		anchor: HTMLElement | null | undefined;
		onpick: (next: { text: string; caret: number }) => void;
	} = $props();

	let highlighted = $state(0);
	/** The text Escape closed the list on; it reopens once that changes. */
	let dismissed = $state<string | null>(null);

	const found = $derived<Completion | null>(
		dismissed === text ? null : completionAt(text, caret),
	);
	const hint = $derived(found ? null : signatureAt(text, caret));
	const box = $derived.by(() => {
		void text;
		void caret;
		return anchor?.getBoundingClientRect();
	});

	$effect(() => {
		void found?.names.join();
		highlighted = 0;
	});

	function pick(name: string) {
		if (found) {
			onpick(complete(text, found, name));
		}
	}

	/** Handles the list's keys; true when the key was the list's. */
	export function key(event: KeyboardEvent): boolean {
		if (!found || event.isComposing) {
			return false;
		}
		const count = found.names.length;
		switch (event.key) {
			case "ArrowDown":
				highlighted = (highlighted + 1) % count;
				return true;
			case "ArrowUp":
				highlighted = (highlighted - 1 + count) % count;
				return true;
			case "Tab":
			case "Enter":
				pick(found.names[highlighted] ?? "");
				return true;
			case "Escape":
				dismissed = text;
				return true;
			default:
				return false;
		}
	}
</script>

{#if box && (found || hint)}
    <div
        class="bg-popover text-popover-foreground fixed z-50 max-w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-md border text-xs shadow-md"
        style="left: {Math.max(8, box.left)}px; top: {box.bottom + 4}px"
    >
        {#if found}
            <ul role="listbox" class="py-1">
                {#each found.names as name, i (name)}
                    <li role="option" aria-selected={i === highlighted}>
                        <!-- mousedown keeps the focus, and so the caret,
                             in the input being typed into. -->
                        <button
                            type="button"
                            tabindex="-1"
                            class={cn(
                                "flex w-full items-baseline gap-2 px-2 py-1 text-start",
                                i === highlighted && "bg-accent text-accent-foreground",
                            )}
                            onmousedown={(e) => e.preventDefault()}
                            onclick={() => pick(name)}
                        >
                            <span class="font-mono font-medium">{name}</span>
                            <span class="text-muted-foreground truncate font-mono">
                                {SIGNATURES[name] ?? ""}
                            </span>
                        </button>
                    </li>
                {/each}
            </ul>
        {:else if hint}
            <p class="text-muted-foreground px-2 py-1 font-mono">{hint}</p>
        {/if}
    </div>
{/if}
