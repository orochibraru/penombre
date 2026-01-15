<script lang="ts">
    import {
        EllipsisVerticalIcon,
        UploadIcon,
        CloudUploadIcon,
        FolderPlusIcon,
    } from "@lucide/svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import type { ObjectItem } from "$lib/api-client";
    import FilePrefix from "$lib/components/file/prefix.svelte";
    import { Button } from "$lib/components/ui/button";
    import * as ContextMenu from "$lib/components/ui/context-menu/index.js";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";
    import { Skeleton } from "$lib/components/ui/skeleton/index";
    import { route } from "$lib/ROUTES";
    import {
        cn,
        isFolderItem,
        type SharedFileDisplayProps,
        shouldDisplayAction,
    } from "$lib/utils";

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

    const iconSize = "h-36 w-36";
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
            return 0;
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

{#snippet listItem(objectItem: ObjectItem)}
    {@const checked = isChecked(objectItem)}
    {@const isFolder = isFolderItem(objectItem)}
    <li
        class={cn(
            "flex items-stretch justify-between rounded-xl border p-5 transition-colors",
            checked ? "bg-primary/5" : "",
        )}
    >
        <ContextMenu.Root>
            <ContextMenu.Trigger class="h-full w-full">
                <div
                    class="flex h-full flex-col items-center justify-center gap-2"
                    role="button"
                    tabindex={-1}
                    ontap={() => {
                        if (isFolder) {
                            const folder = objectItem.key.replace("/", "");
                            goto(
                                route("/browse/[...path]", {
                                    path: page.params.path
                                        ? [page.params.path, folder]
                                        : [folder],
                                }),
                            );
                            return;
                        }

                        handleOpenItem(objectItem);
                    }}
                >
                    <FilePrefix
                        bind:checkedItems
                        {indeterminate}
                        item={objectItem}
                        {handleOpenItem}
                        {iconSize}
                        layout="grid"
                    />
                </div>
            </ContextMenu.Trigger>
            <ContextMenu.Content>
                {#each itemActions as action}
                    <ContextMenu.Group>
                        {#each action.actions as act}
                            {#if shouldDisplayAction( { action: act, item: objectItem }, )}
                                {@const Icon = act.icon}
                                <ContextMenu.Item
                                    onclick={() => act.action(objectItem)}
                                    disabled={act.disabled}
                                    variant={act.variant}
                                >
                                    <Icon />
                                    {act.title}
                                </ContextMenu.Item>
                            {/if}
                        {/each}
                    </ContextMenu.Group>
                    {@const isLast =
                        action === itemActions[itemActions.length - 1]}
                    {#if !isLast}
                        <ContextMenu.Separator />
                    {/if}
                {/each}
            </ContextMenu.Content>
        </ContextMenu.Root>
        <DropdownMenu.Root>
            <DropdownMenu.Trigger
                class="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            >
                {#snippet child({ props })}
                    <Button variant="ghost" size="icon" {...props}>
                        <EllipsisVerticalIcon />
                        <span class="sr-only">Open menu</span>
                    </Button>
                {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
                {#each itemActions as action}
                    <DropdownMenu.Group>
                        {#each action.actions as act}
                            {#if shouldDisplayAction( { action: act, item: objectItem }, )}
                                {@const Icon = act.icon}
                                <DropdownMenu.Item
                                    onclick={() => act.action(objectItem)}
                                    disabled={act.disabled}
                                    variant={act.variant}
                                >
                                    <Icon />
                                    {act.title}
                                </DropdownMenu.Item>
                            {/if}
                        {/each}
                    </DropdownMenu.Group>
                    {@const isLast =
                        action === itemActions[itemActions.length - 1]}
                    {#if !isLast}
                        <DropdownMenu.Separator />
                    {/if}
                {/each}
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    </li>
{/snippet}

{#snippet emptyListItem()}
    <li
        class="col-span-full flex flex-col items-center justify-center gap-4 py-12"
    >
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
    <ul class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
