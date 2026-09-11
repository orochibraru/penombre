<script lang="ts">
	import { XIcon } from "@lucide/svelte";
	import type { Snippet } from "svelte";
	import { slide } from "svelte/transition";
	import Button from "$lib/components/ui/button/button.svelte";
	import { cn } from "$lib/utils";

	interface Props {
		title: string;
		children: Snippet;
		open: boolean;
		callback?: () => void;
		showCloseButton?: boolean;
		/**
		 * One centred row instead of a title above its content. For a bar of
		 * short actions the stacked header is mostly empty height.
		 */
		compact?: boolean;
		/** Labels the close control instead of showing a bare icon. */
		closeLabel?: string;
		/** Extra classes on the fixed panel — used to stack drawers. */
		class?: string;
		/** The panel element, so a caller can measure it. */
		ref?: HTMLElement | null;
	}

	let {
		title,
		children,
		open = $bindable(false),
		callback,
		showCloseButton = true,
		compact = false,
		closeLabel,
		class: className,
		ref = $bindable(null),
	}: Props = $props();

	function close() {
		if (callback) {
			return callback();
		}
		open = false;
	}
</script>

{#if open}
    <div
        bind:this={ref}
        class={cn(
            "bg-card/80 fixed bottom-20 rounded-lg border backdrop-blur-md lg:bottom-5",
            // Centred and only as wide as its content. Aside from reading
            // better, it keeps the bar out of the bottom-right corner, where
            // the upload progress panel is fixed at z-50 and was swallowing
            // every click on these buttons.
            compact
                ? "left-1/2 z-50 w-auto max-w-[calc(100vw-2rem)] -translate-x-1/2 p-2"
                : "bottom-drawer lg:bottom-drawer-lg right-5 p-3",
            className,
        )}
        transition:slide
    >
        {#if compact}
            <!-- Wraps rather than scrolls: a hidden action is worse than a
                 second row, and the count reads as a label, not a heading. -->
            <div class="flex flex-wrap items-center justify-center gap-2">
                <p class="text-muted-foreground me-1 text-xs font-medium">
                    {title}
                </p>
                {@render children()}
                {#if showCloseButton}
                    <Button
                        variant="ghost"
                        size="sm"
                        class="text-xs"
                        title={closeLabel ?? "Close"}
                        onclick={close}
                    >
                        <XIcon class="size-3.5" />
                        {closeLabel ?? ""}
                    </Button>
                {/if}
            </div>
        {:else}
            <div class="mb-2 flex items-center justify-between">
                <p class="font-medium">{title}</p>
                {#if showCloseButton}
                    <Button variant="ghost" title="Close" onclick={close}>
                        <XIcon />
                    </Button>
                {/if}
            </div>

            <div class="overflow-x-auto">
                {@render children()}
            </div>
        {/if}
    </div>
{/if}
