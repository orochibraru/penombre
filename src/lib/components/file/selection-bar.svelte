<script lang="ts">
	import BottomAction from "#lib/components/layout/bottom-action.svelte";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as m from "#lib/paraglide/messages.js";
	import type { MultipleItemsAction } from "#lib/utils.js";

	/**
	 * Selection actions live in a floating drawer rather than replacing the
	 * search and filter controls, so those stay usable while items are picked.
	 * When a track is playing it stacks above the music player —
	 * `--player-height` is published by that component, and defaults to 0 when
	 * nothing is open.
	 */
	let {
		open,
		count,
		actions,
		onclear,
	}: {
		open: boolean;
		count: number;
		actions: MultipleItemsAction[];
		onclear: () => void;
	} = $props();

	// The upload panel stacks above this bar; at the same offset it covered
	// the bar's right end, Clear included.
	let panel: HTMLElement | null = $state(null);

	$effect(() => {
		const root = document.documentElement;
		if (!panel) {
			root.style.removeProperty("--selection-height");
			return;
		}
		const observer = new ResizeObserver(([entry]) => {
			const height = entry?.target.getBoundingClientRect().height ?? 0;
			root.style.setProperty("--selection-height", `${height + 8}px`);
		});
		observer.observe(panel);
		return () => {
			observer.disconnect();
			root.style.removeProperty("--selection-height");
		};
	});
</script>

<BottomAction
    bind:ref={panel}
    compact
    {open}
    title={m.selected_count({ count: String(count) })}
    closeLabel={m.clear_selection()}
    callback={onclear}
    class="bottom-[calc(5rem+var(--player-height,0px))] lg:bottom-[calc(1.25rem+var(--player-height,0px))]"
>
    {#each actions as action (action.title)}
        {@const Icon = action.icon}
        <Button
            type="button"
            size="sm"
            variant={action.variant}
            onclick={() => action.action()}
            class="text-xs"
        >
            <Icon class="size-3.5" />
            {action.title}
        </Button>
    {/each}
</BottomAction>
