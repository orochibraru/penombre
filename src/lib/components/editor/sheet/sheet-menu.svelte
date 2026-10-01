<script lang="ts">
	import {
		ArrowDownAZIcon,
		ArrowUpZAIcon,
		MessageSquarePlusIcon,
		PlusIcon,
		Redo2Icon,
		SearchIcon,
		Undo2Icon,
	} from "@lucide/svelte";
	import type { Snippet } from "svelte";
	import { toast } from "svelte-sonner";
	import { Input } from "#lib/components/ui/input/index.js";
	import * as Menubar from "#lib/components/ui/menubar/index.js";
	import { columnName } from "#lib/formula.js";
	import { m } from "#lib/paraglide/messages.js";
	import type { EditorMenuContext } from "../shell/file-actions.js";
	import {
		clipboardActions,
		deleteActions,
		fillActions,
		insertActions,
		MOD,
		type SheetAction,
	} from "./actions.js";
	import type { SheetState } from "./state.svelte.js";

	/** The menu bar over the grid, and Find. */
	const {
		sheet,
		menu,
	}: { sheet: SheetState; menu?: Snippet<[EditorMenuContext]> } = $props();

	let query = $state("");
	let finder = $state<HTMLInputElement | null>(null);

	const history = $derived<SheetAction[]>([
		{
			label: m.editor_undo(),
			icon: Undo2Icon,
			run: sheet.undo,
			shortcut: `${MOD}Z`,
		},
		{
			label: m.editor_redo(),
			icon: Redo2Icon,
			run: sheet.redo,
			shortcut: `${MOD}⇧Z`,
		},
	]);

	function find() {
		if (!sheet.find(query)) {
			toast.info(m.sheet_find_none());
		}
	}

	/** Set by Find, which wants the focus in the search box instead. */
	let toFinder = false;

	/** A closing menu hands the focus back to the grid, not its trigger. */
	const toGrid = (event: Event) => {
		event.preventDefault();
		if (toFinder) {
			toFinder = false;
			finder?.focus();
		} else {
			sheet.focusGrid();
		}
	};
</script>

{#snippet items(actions: SheetAction[], disabled = false)}
    {#each actions as action (action.label)}
        <Menubar.Item
            {disabled}
            variant={action.destructive ? "destructive" : "default"}
            onSelect={() => void action.run()}
        >
            <action.icon class="size-4" />
            {action.label}
            {#if action.shortcut}
                <Menubar.Shortcut>{action.shortcut}</Menubar.Shortcut>
            {/if}
        </Menubar.Item>
    {/each}
{/snippet}

<div class="flex flex-wrap items-center gap-2">
    <Menubar.Root class="w-fit max-w-full overflow-x-auto">
        {@render menu?.({})}
        {#if !sheet.readOnly}
        <Menubar.Menu>
            <Menubar.Trigger>{m.menu_edit()}</Menubar.Trigger>
            <Menubar.Content onCloseAutoFocus={toGrid}>
                {@render items(history.slice(0, 1), !sheet.canUndo)}
                {@render items(history.slice(1), !sheet.canRedo)}
                <Menubar.Separator />
                {@render items(clipboardActions(sheet))}
                <Menubar.Separator />
                {@render items(fillActions(sheet))}
                <Menubar.Separator />
                {@render items(deleteActions(sheet))}
                <Menubar.Separator />
                <Menubar.Item onSelect={() => (toFinder = true)}>
                    <SearchIcon class="size-4" />
                    {m.sheet_find()}
                </Menubar.Item>
            </Menubar.Content>
        </Menubar.Menu>
        <Menubar.Menu>
            <Menubar.Trigger>{m.menu_insert()}</Menubar.Trigger>
            <Menubar.Content onCloseAutoFocus={toGrid}>
                {@render items(insertActions(sheet))}
                {#if sheet.onComment}
                    <Menubar.Item onSelect={() => sheet.onComment?.()}>
                        <MessageSquarePlusIcon class="size-4" />
                        {m.shell_add_comment()}
                    </Menubar.Item>
                {/if}
                {#if sheet.workbook}
                    <Menubar.Separator />
                    <Menubar.Item onSelect={sheet.addSheet}>
                        <PlusIcon class="size-4" />
                        {m.sheet_add_sheet()}
                    </Menubar.Item>
                {/if}
            </Menubar.Content>
        </Menubar.Menu>
        <Menubar.Menu>
            <Menubar.Trigger>{m.menu_data()}</Menubar.Trigger>
            <Menubar.Content onCloseAutoFocus={toGrid}>
                <Menubar.Item onSelect={() => sheet.sort(false)}>
                    <ArrowDownAZIcon class="size-4" />
                    {m.sheet_sort_ascending()}
                    <Menubar.Shortcut>
                        {columnName(sheet.selection.anchor.col)}
                    </Menubar.Shortcut>
                </Menubar.Item>
                <Menubar.Item onSelect={() => sheet.sort(true)}>
                    <ArrowUpZAIcon class="size-4" />
                    {m.sheet_sort_descending()}
                    <Menubar.Shortcut>
                        {columnName(sheet.selection.anchor.col)}
                    </Menubar.Shortcut>
                </Menubar.Item>
                <Menubar.Separator />
                <Menubar.CheckboxItem bind:checked={sheet.header}>
                    {m.sheet_header_row()}
                </Menubar.CheckboxItem>
                <Menubar.CheckboxItem bind:checked={sheet.frozen}>
                    {m.sheet_freeze_column()}
                </Menubar.CheckboxItem>
            </Menubar.Content>
        </Menubar.Menu>
        {/if}
    </Menubar.Root>
    {#if sheet.readOnly && sheet.onComment}
        <button
            type="button"
            class="text-muted-foreground hover:bg-muted hover:text-foreground flex size-8 items-center justify-center rounded-md"
            aria-label={m.shell_add_comment()}
            title={m.shell_add_comment()}
            onclick={() => sheet.onComment?.()}
        >
            <MessageSquarePlusIcon class="size-4" />
        </button>
    {/if}
    <form
        class="relative ms-auto w-full sm:w-56"
        onsubmit={(e) => {
            e.preventDefault();
            find();
        }}
    >
        <SearchIcon
            class="text-muted-foreground pointer-events-none absolute inset-s-2 top-1/2 size-3.5 -translate-y-1/2"
        />
        <Input
            type="search"
            bind:value={query}
            bind:ref={finder}
            placeholder={m.sheet_find()}
            aria-label={m.sheet_find()}
            class="h-8 ps-7"
        />
    </form>
</div>
