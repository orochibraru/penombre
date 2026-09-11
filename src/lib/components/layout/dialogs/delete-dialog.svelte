<script lang="ts">
	import { AlertTriangleIcon, HardDriveIcon, Trash2Icon } from "@lucide/svelte";
	import { page } from "$app/state";
	import type { ObjectItem } from "$lib/api";
	import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { readableFileSize } from "$lib/utils";

	interface Props {
		confirmDeleteOpen: boolean;
		deletingItem: boolean;
		checkedItems: Record<string, string | false>;
		handleDeleteObject: () => void;
		/** The rows on screen, used to price up what is about to be freed. */
		items?: ObjectItem[];
		/** Set only by "Empty Trash" — a targeted delete gets generic wording. */
		emptyingTrash?: boolean;
	}

	let {
		confirmDeleteOpen = $bindable(false),
		deletingItem = $bindable(false),
		checkedItems = $bindable(),
		handleDeleteObject,
		items = [],
		emptyingTrash = false,
	}: Props = $props();

	const selectedKeys = $derived(
		Object.entries(checkedItems)
			.filter(([, name]) => !!name)
			.map(([key]) => key),
	);

	const itemNames = $derived(
		Object.values(checkedItems).filter((name): name is string => !!name),
	);

	const isTrash = $derived(page.url.pathname.startsWith("/trash"));

	/**
	 * Bytes the selection gives back. Summed from the rows already loaded, so
	 * this costs no extra request — folders report 0 unless their size has
	 * been calculated, which the listing does lazily.
	 */
	const reclaimed = $derived(
		items
			.filter((item) => selectedKeys.includes(item.key))
			.reduce((total, item) => total + (item.size ?? 0), 0),
	);

	/** Only a permanent delete actually frees disk; trashing just moves it. */
	const showReclaim = $derived(isTrash && reclaimed > 0);
</script>

<ResponsiveDialog
    bind:open={confirmDeleteOpen}
    bind:loading={deletingItem}
    size="sm"
    title={emptyingTrash ? m.empty_trash_title() : m.confirm_delete_title()}
    submitLabel={isTrash ? m.delete_permanently() : m.continue()}
    loadingLabel={m.deleting()}
    submitVariant="destructive"
    onsubmit={handleDeleteObject}
>
    <div class="flex flex-col gap-4">
        <div class="flex flex-col items-center gap-3 text-center">
            <div
                class="bg-destructive/10 text-destructive flex size-11 items-center justify-center rounded-[calc(var(--radius)+2px)]"
            >
                {#if isTrash}
                    <Trash2Icon class="size-5" />
                {:else}
                    <AlertTriangleIcon class="size-5" />
                {/if}
            </div>
            <p class="text-sm text-balance">
                {isTrash
                    ? m.confirm_delete_permanent()
                    : m.confirm_delete_trash()}
            </p>
        </div>

        {#if showReclaim}
            <div
                class="bg-muted/50 flex items-center justify-between gap-3 rounded-[calc(var(--radius)-2px)] px-3 py-2.5"
            >
                <span class="text-muted-foreground flex items-center gap-2 text-xs">
                    <HardDriveIcon class="size-3.5 shrink-0" />
                    {m.space_reclaimed()}
                </span>
                <span class="text-sm font-medium tabular-nums">
                    {readableFileSize(reclaimed)}
                </span>
            </div>
        {/if}

        <div class="flex flex-col gap-1">
            <p class="text-muted-foreground text-xs">
                {m.items_count({ count: String(itemNames.length) })}
            </p>
            <ul
                class="divide-border max-h-40 divide-y overflow-y-auto rounded-[calc(var(--radius)-2px)] border"
            >
                {#each itemNames as name (name)}
                    <li class="truncate px-3 py-1.5 text-xs" title={name}>
                        {name}
                    </li>
                {/each}
            </ul>
        </div>
    </div>
</ResponsiveDialog>
