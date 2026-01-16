<script lang="ts">
    import {
        EllipsisVerticalIcon,
        UploadIcon,
        CloudUploadIcon,
        FolderPlusIcon,
    } from "@lucide/svelte";
    import type { ObjectItem } from "$lib/api-client";
    import FilePrefix from "$lib/components/file/prefix.svelte";
    import { Button } from "$lib/components/ui/button";
    import * as Drawer from "$lib/components/ui/drawer/index";
    import { Skeleton } from "$lib/components/ui/skeleton/index";
    import {
        cn,
        isFolderItem,
        type SharedFileDisplayProps,
        shouldDisplayAction,
    } from "$lib/utils";
    import { page } from "$app/state";

    let {
        handleOpenItem,
        files,
        actionableItem = $bindable(),
        actionsContextOpen = $bindable(false),
        allSelected = $bindable(false),
        indeterminate,
        loading = $bindable(false),
        checkedItems = $bindable(),
        searchValue,
        searchResults,
        itemActions,
        onDrop,
        onUpload,
        onCreateFolder,
        sortColumn,
        sortDirection,
    }: SharedFileDisplayProps = $props();

    const iconSize = "h-6 w-6";
    const loadingAmount = 20;
    let isDragging: boolean = $state(false);

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        if (e.dataTransfer?.types.includes("Files")) {
            isDragging = true;
        }
    }

    function handleDragLeave(e: DragEvent) {
        e.preventDefault();
        isDragging = false;
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragging = false;

        if (!onDrop) return;

        const droppedFiles = Array.from(e.dataTransfer?.files ?? []);
        if (droppedFiles.length > 0) {
            onDrop(droppedFiles);
        }
    }

    function isChecked(item: ObjectItem): boolean {
        return !!checkedItems[item.key];
    }

    function getItemName(item: ObjectItem): string {
        return (item.metadata.name || item.key).toLowerCase();
    }

    function getItemDate(item: ObjectItem): number {
        const date = item.updatedAt;
        if (!date) return 0;
        return typeof date === "string"
            ? new Date(date).getTime()
            : date.getTime();
    }

    function compareItems(a: ObjectItem, b: ObjectItem): number {
        const aIsFolder = isFolderItem(a);
        const bIsFolder = isFolderItem(b);
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;

        let comparison = 0;
        switch (sortColumn) {
            case "name":
                comparison = getItemName(a).localeCompare(getItemName(b));
                break;
            case "size":
                comparison = (a.size ?? 0) - (b.size ?? 0);
                break;
            case "updatedAt":
                comparison = getItemDate(a) - getItemDate(b);
                break;
            default:
                return 0;
        }
        return sortDirection === "asc" ? comparison : -comparison;
    }

    function sortFoldersFirst(items: ObjectItem[]): ObjectItem[] {
        return [...items].sort((a, b) => {
            const aIsFolder = isFolderItem(a);
            const bIsFolder = isFolderItem(b);
            if (aIsFolder && !bIsFolder) return -1;
            if (!aIsFolder && bIsFolder) return 1;
            // Sort by name within same type
            return getItemName(a).localeCompare(getItemName(b));
        });
    }

    let sortedFiles = $derived.by(() => {
        if (!files.list) return files.list;
        if (!sortColumn) return sortFoldersFirst(files.list);
        return [...files.list].sort(compareItems);
    });

    let sortedSearchResults = $derived.by(() => {
        if (!searchResults) return searchResults;
        if (!sortColumn) return sortFoldersFirst(searchResults);
        return [...searchResults].sort(compareItems);
    });
</script>

{#snippet listItem(item: ObjectItem)}
    {@const checked = isChecked(item)}
    <li
        class={cn(
            "flex min-w-0 items-center justify-between rounded-xl px-1 py-3 transition-colors",
            checked ? "bg-primary/5" : "",
        )}
    >
        <FilePrefix
            layout="list"
            bind:checkedItems
            {indeterminate}
            {item}
            {handleOpenItem}
            {iconSize}
        />
        <button
            onclick={() => {
                actionableItem = item;
                actionsContextOpen = true;
            }}
            class="shrink-0 py-1 pl-5"
        >
            <EllipsisVerticalIcon class="h-5 w-5" />
        </button>
    </li>
{/snippet}

{#snippet emptyListItem()}
    <li class="flex flex-col items-center justify-center gap-4 py-12">
        <div class="text-muted-foreground text-center">
            {#if page.url.pathname.startsWith("/browse")}
                <p class="text-lg font-medium">No files yet</p>
                <p class="text-sm">
                    Upload files or create a folder to get started
                </p>
            {:else}
                <p class="text-lg font-medium">No results.</p>
            {/if}
        </div>
        {#if page.url.pathname.startsWith("/browse")}
            <div class="flex gap-2">
                {#if onUpload}
                    <Button variant="default" onclick={onUpload}>
                        <CloudUploadIcon class="mr-2 h-4 w-4" />
                        Upload Files
                    </Button>
                {/if}
                {#if onCreateFolder}
                    <Button variant="outline" onclick={onCreateFolder}>
                        <FolderPlusIcon class="mr-2 h-4 w-4" />
                        New Folder
                    </Button>
                {/if}
            </div>
        {/if}
    </li>
{/snippet}

{#snippet loadingRows()}
    {#each Array(loadingAmount) as _}
        <li class="flex items-center justify-between py-3">
            <Skeleton class="h-7.5 w-full rounded-sm" />
        </li>
    {/each}
{/snippet}

<div
    class={cn(
        "relative rounded-lg transition-all p-1",
        isDragging && "border-primary border-2 border-dashed bg-primary/5",
    )}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    role="region"
>
    {#if isDragging}
        <div
            class="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg"
        >
            <div
                class="border-primary text-primary flex size-16 items-center justify-center rounded-full border-2 border-dashed"
            >
                <UploadIcon class="size-8" />
            </div>
            <p class="text-primary font-medium">Drop files to upload</p>
        </div>
    {/if}
    <ul class="flex flex-col gap-1">
        {#if loading}
            {@render loadingRows()}
        {:else if searchValue}
            {#if sortedSearchResults && sortedSearchResults.length > 0}
                {#each sortedSearchResults as objectItem}
                    {@render listItem(objectItem)}
                {/each}
            {:else}
                {@render emptyListItem()}
            {/if}
        {:else if sortedFiles && sortedFiles.length > 0}
            {#each sortedFiles as objectItem}
                {@render listItem(objectItem)}
            {/each}
        {:else}
            {@render emptyListItem()}
        {/if}
    </ul>
</div>

<Drawer.Root bind:open={actionsContextOpen}>
    <Drawer.Content class="z-50">
        <Drawer.Header>
            {#if actionableItem}
                <Drawer.Title class="border-b pb-3 text-lg">
                    {actionableItem.metadata.name ??
                        (actionableItem.key.endsWith("/")
                            ? actionableItem.key.slice(0, -1)
                            : actionableItem.key)}
                </Drawer.Title>
            {/if}
        </Drawer.Header>
        <Drawer.Footer>
            <div class="mx-auto flex w-full flex-col items-start gap-5 pb-5">
                {#if actionableItem}
                    {@const item = actionableItem}
                    {#each itemActions as action}
                        {#each action.actions as act}
                            {#if shouldDisplayAction({ action: act, item })}
                                {@const Icon = act.dynamic
                                    ? act.icon(item)
                                    : act.icon}
                                {@const title = act.dynamic
                                    ? (
                                          act.title as (
                                              item: ObjectItem,
                                          ) => string
                                      )(item)
                                    : act.title}
                                <button
                                    onclick={() => act.action(item)}
                                    disabled={act.disabled}
                                    class={cn(
                                        "disabled:text-muted-foreground hover:text-primary flex w-full text-md items-center justify-start gap-3 text-balance transition-colors",
                                        act.variant === "destructive"
                                            ? "text-red-600 hover:text-red-800 disabled:text-red-300"
                                            : "",
                                    )}
                                >
                                    <Icon />
                                    {title}
                                </button>
                            {/if}
                        {/each}
                        {@const isLast =
                            action === itemActions[itemActions.length - 1]}
                        {#if !isLast}
                            <hr
                                class="my-2 w-full border-muted-foreground/30"
                            />
                        {/if}
                    {/each}
                {/if}
            </div>
        </Drawer.Footer>
    </Drawer.Content>
</Drawer.Root>
