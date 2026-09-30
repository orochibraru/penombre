<script lang="ts">
	import { FolderIcon, LoaderCircleIcon } from "@lucide/svelte";
	import FileTypeIcon from "#lib/components/file-type-icon.svelte";
	import * as m from "#lib/paraglide/messages.js";
	import { listingHref, readableFileSize } from "#lib/utils.js";
	import { goto } from "$app/navigation";
	import { pendingPreview } from "./preview-handover";
	import {
		type Found,
		folderPathOf,
		locationOfPlace,
		searchFiles,
	} from "./wrapper-search";

	let { query }: { query: string } = $props();

	let results: Found[] = $state([]);
	let searching = $state(true);

	$effect(() => {
		const asked = query;
		searching = true;
		let stale = false;
		const timer = setTimeout(async () => {
			const found = await searchFiles(asked);
			if (!stale) {
				results = found;
				searching = false;
			}
		}, 300);
		return () => {
			stale = true;
			clearTimeout(timer);
		};
	});

	/**
	 * Wherever it is: a folder opens, a file opens in its own folder, which
	 * then previews it. Its drive or mount is not necessarily this page's.
	 */
	async function open(found: Found) {
		const where = locationOfPlace(found.place);
		if (found.type === "folder") {
			await goto(listingHref(folderPathOf(found), where));
			return;
		}
		await goto(listingHref(found.parentKey ?? "", where));
		// After the navigation: the folder's listing is what it is looked up in.
		pendingPreview.set({ fileId: found.metadata.id });
	}
</script>

{#if searching && results.length === 0}
    <LoaderCircleIcon class="text-muted-foreground mx-auto my-10 size-5 animate-spin" />
{:else if results.length === 0}
    <p class="text-muted-foreground py-10 text-center text-sm">{m.search_nothing()}</p>
{:else}
    <ul class="flex flex-col gap-1">
        {#each results as found (found.place.kind + (found.place.id ?? "") + found.metadata.id)}
            <li>
                <button
                    type="button"
                    class="hover:bg-muted/60 flex w-full items-center gap-3 rounded-md px-2 py-2 text-start"
                    onclick={() => void open(found)}
                >
                    {#if found.type === "folder"}
                        <FolderIcon
                            class="text-primary bg-primary/15 box-content size-5 shrink-0 rounded-md p-2"
                            fill="currentColor"
                        />
                    {:else}
                        <FileTypeIcon
                            category={found.metadata.category}
                            class="text-primary bg-primary/15 box-content size-5 shrink-0 rounded-md p-2"
                        />
                    {/if}
                    <span class="min-w-0 flex-1">
                        <span class="block truncate text-sm font-medium">
                            {found.metadata.name ?? found.key}
                        </span>
                        <span class="text-muted-foreground block truncate text-xs">
                            {found.place.name}{found.parent ? ` / ${found.parent}` : ""}
                        </span>
                    </span>
                    {#if found.type !== "folder" && found.size}
                        <span class="text-muted-foreground shrink-0 text-xs">
                            {readableFileSize(found.size)}
                        </span>
                    {/if}
                </button>
            </li>
        {/each}
    </ul>
{/if}
