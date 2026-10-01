<script lang="ts">
	import { MessageSquarePlusIcon } from "@lucide/svelte";
	import type { Snippet } from "svelte";
	import * as ContextMenu from "#lib/components/ui/context-menu/index.js";
	import { m } from "#lib/paraglide/messages.js";
	import {
		clipboardActions,
		deleteActions,
		fillActions,
		insertActions,
		type SheetAction,
	} from "./actions.js";
	import type { SheetState } from "./state.svelte.js";

	/** The right-click (long-press) menu over the grid. */
	const { sheet, children }: { sheet: SheetState; children: Snippet } =
		$props();
</script>

{#snippet items(actions: SheetAction[])}
    {#each actions as action (action.label)}
        <ContextMenu.Item
            variant={action.destructive ? "destructive" : "default"}
            onSelect={() => void action.run()}
        >
            <action.icon class="size-4" />
            {action.label}
            {#if action.shortcut}
                <ContextMenu.Shortcut>{action.shortcut}</ContextMenu.Shortcut>
            {/if}
        </ContextMenu.Item>
    {/each}
{/snippet}

<ContextMenu.Root>
    <ContextMenu.Trigger class="flex min-h-0 flex-1 flex-col">
        {@render children()}
    </ContextMenu.Trigger>
    <ContextMenu.Content
        onCloseAutoFocus={(e) => {
            e.preventDefault();
            sheet.focusGrid();
        }}
    >
        {#if sheet.readOnly}
            {@render items(clipboardActions(sheet).slice(1, 2))}
        {:else}
            {@render items(clipboardActions(sheet))}
            <ContextMenu.Separator />
            {@render items(insertActions(sheet))}
            <ContextMenu.Separator />
            {@render items(deleteActions(sheet))}
            {@render items(fillActions(sheet).slice(2))}
        {/if}
        {#if sheet.onComment}
            <ContextMenu.Separator />
            {@render items([
                {
                    label: m.shell_add_comment(),
                    icon: MessageSquarePlusIcon,
                    run: () => sheet.onComment?.(),
                },
            ])}
        {/if}
    </ContextMenu.Content>
</ContextMenu.Root>
