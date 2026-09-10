<script lang="ts">
	import { XIcon } from "@lucide/svelte";
	import type { Snippet } from "svelte";
	import { slide } from "svelte/transition";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { cn } from "$lib/utils";

	interface Props {
		title: string;
		children: Snippet;
		open: boolean;
		callback?: () => void;
		showCloseButton?: boolean;
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
		class: className,
		ref = $bindable(null),
	}: Props = $props();
</script>

{#if open}
    <div
        bind:this={ref}
        class={cn(
            "bottom-drawer lg:bottom-drawer-lg bg-card/80 fixed right-5 bottom-20 rounded-xs border p-3 backdrop-blur-md lg:bottom-5",
            className,
        )}
        transition:slide
    >
        <div class="mb-2 flex items-center justify-between">
            <p class="font-medium">{title}</p>
            {#if showCloseButton}
                <Button
                    variant="ghost"
                    title="Close"
                    onclick={() => {
                        if (callback) {
                            return callback();
                        }

                        open = false;
                    }}
                >
                    <XIcon />
                </Button>
            {/if}
        </div>

        <div class="overflow-x-auto">
            {@render children()}
        </div>
    </div>
{/if}
