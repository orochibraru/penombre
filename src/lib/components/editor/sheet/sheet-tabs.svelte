<script lang="ts">
	import {
		ChevronDownIcon,
		PencilIcon,
		PlusIcon,
		Trash2Icon,
	} from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js";
	import { m } from "#lib/paraglide/messages.js";
	import { cn } from "#lib/utils.js";
	import type { SheetState } from "./state.svelte.js";

	/** A workbook's sheets, along the bottom: switch, add, rename, delete. */
	const { sheet }: { sheet: SheetState } = $props();

	let renaming = $state<number | null>(null);

	const problems = {
		empty: () => m.sheet_name_empty(),
		invalid: () => m.sheet_name_invalid(),
		taken: () => m.sheet_name_taken(),
	};

	function rename(index: number, name: string) {
		if (renaming !== index) {
			return;
		}
		renaming = null;
		const problem = sheet.renameSheet(index, name);
		if (problem) {
			toast.error(problems[problem]());
		}
		sheet.focusGrid();
	}

	function focusName(node: HTMLInputElement) {
		node.focus();
		node.select();
	}
</script>

<div
    role="tablist"
    aria-label={m.sheet_sheets()}
    class="flex min-h-9 items-center gap-1 overflow-x-auto"
>
    {#if !sheet.readOnly}
        <button
            type="button"
            class="text-muted-foreground hover:bg-muted hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-md"
            aria-label={m.sheet_add_sheet()}
            onclick={sheet.addSheet}
        >
            <PlusIcon class="size-4" />
        </button>
    {/if}
    {#each sheet.book.sheets as tab, index (tab.id)}
        {@const active = index === sheet.active}
        {#if renaming === index}
            <input
                use:focusName
                class="border-input focus-visible:ring-ring h-8 w-36 shrink-0 rounded-md border bg-transparent px-2 text-base outline-none md:text-sm focus-visible:ring-2"
                aria-label={m.rename()}
                value={tab.name}
                maxlength={31}
                onkeydown={(e) => {
                    if (e.key === "Enter") {
                        rename(index, e.currentTarget.value);
                    } else if (e.key === "Escape") {
                        renaming = null;
                        sheet.focusGrid();
                    }
                }}
                onblur={(e) => rename(index, e.currentTarget.value)}
            />
        {:else}
            <div
                class={cn(
                    "flex h-8 shrink-0 items-center rounded-md text-sm",
                    active ? "bg-primary/10 text-foreground font-medium" : "text-muted-foreground hover:bg-muted",
                )}
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={active}
                    class="h-full max-w-48 truncate px-3"
                    onclick={() => sheet.switchTo(index)}
                    ondblclick={() => (renaming = sheet.readOnly ? null : index)}
                >
                    {tab.name}
                </button>
                {#if active && !sheet.readOnly}
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger
                            class="hover:text-foreground -ms-2 flex size-7 items-center justify-center rounded"
                            aria-label={m.sheet_sheet_menu({ sheet: tab.name })}
                        >
                            <ChevronDownIcon class="size-3.5" />
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content align="start">
                            <DropdownMenu.Item onclick={() => (renaming = index)}>
                                <PencilIcon class="size-4" />
                                {m.rename()}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                variant="destructive"
                                disabled={sheet.book.sheets.length <= 1}
                                onclick={() => sheet.deleteSheet(index)}
                            >
                                <Trash2Icon class="size-4" />
                                {m.delete()}
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                {/if}
            </div>
        {/if}
    {/each}
</div>
