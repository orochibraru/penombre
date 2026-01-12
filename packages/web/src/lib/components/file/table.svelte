<script lang="ts">
    import {
        EllipsisVerticalIcon,
        ArrowUpIcon,
        ArrowDownIcon,
        ArrowUpDownIcon,
        UploadIcon,
        CloudUploadIcon,
        FolderPlusIcon,
    } from "@lucide/svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import type { ObjectItem } from "$lib/api-client";
    import FilePrefix from "$lib/components/file/prefix.svelte";
    import { Badge } from "$lib/components/ui/badge/index";
    import { Button } from "$lib/components/ui/button";
    import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
    import * as ContextMenu from "$lib/components/ui/context-menu/index.js";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";
    import { Skeleton } from "$lib/components/ui/skeleton/index";
    import * as Table from "$lib/components/ui/table/index";
    import { route } from "$lib/ROUTES";
    import {
        capitalizeFirstLetter,
        cn,
        readableFileSize,
        isFolderItem,
        type SharedFileDisplayProps,
        type SortColumn,
        type SortDirection,
        shouldDisplayAction,
    } from "$lib/utils";

    let {
        handleOpenItem,
        files,
        actionableItem = $bindable(),
        actionsContextOpen = $bindable(false),
        allSelected = $bindable(false),
        indeterminate = $bindable(false),
        loading = $bindable(false),
        checkedItems = $bindable(),
        searchValue,
        searchResults,
        itemActions,
        onDrop,
        onUpload,
        onCreateFolder,
        sortColumn = $bindable(null),
        sortDirection = $bindable("asc"),
    }: SharedFileDisplayProps = $props();

    const iconSize = "h-5 w-5";
    const loadingAmount = 20;

    let isSingleItemAction: boolean = $state(false);
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

    function toggleSort(column: SortColumn) {
        if (sortColumn === column) {
            sortDirection = sortDirection === "asc" ? "desc" : "asc";
        } else {
            sortColumn = column;
            sortDirection = "asc";
        }
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
        // Folders always come first
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
                // No column selected, just maintain folder-first order
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

    function toggleSelectAll(checked: boolean) {
        isSingleItemAction = false;
        if (files.list) {
            files.list.forEach((item) => {
                checkedItems[item.key] = checked;
            });
        }
    }

    const columns: TableHeadItem[] = [
        {
            title: "Name",
            colSpan: 7,
            sortKey: "name",
        },
        {
            title: "Size",
            colSpan: 1,
            sortKey: "size",
        },
        {
            title: "Modified",
            colSpan: 1,
            sortKey: "updatedAt",
        },
        {
            title: "Actions",
            colSpan: 1,
            class: "w-4 text-right",
        },
    ];

    type TableHeadItem = {
        title: string;
        colSpan: number;
        class?: string;
        sortKey?: typeof sortColumn;
    };

    function isChecked(item: ObjectItem): boolean {
        return checkedItems[item.key] || false;
    }
</script>

{#snippet tableRow(objectItem: ObjectItem)}
    {@const isFolder = isFolderItem(objectItem)}
    <Table.Row>
        <Table.Cell class="w-4">
            <Checkbox
                checked={isChecked(objectItem)}
                onCheckedChange={(checked) => {
                    checkedItems[objectItem.key] = checked;
                    const someChecked = files.list!.filter(
                        (item) => checkedItems[item.key] === true,
                    );
                    if (someChecked.length > 1) {
                        isSingleItemAction = false;
                    } else {
                        isSingleItemAction = true;
                    }
                }}
            />
        </Table.Cell>
        <Table.Cell colspan={7}>
            <ContextMenu.Root>
                <ContextMenu.Trigger>
                    <div
                        class="flex flex-col items-start gap-2"
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
                            layout="list"
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
        </Table.Cell>
        <Table.Cell colspan={1} class="w-32">
            <p class="text-xs">
                {readableFileSize(objectItem.size as number) ?? "-"}
            </p>
        </Table.Cell>
        <Table.Cell colspan={1} class="w-32">
            <p class="text-xs text-muted-foreground">
                {#if objectItem.updatedAt}
                    {new Date(objectItem.updatedAt).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                    })}
                {:else}
                    -
                {/if}
            </p>
        </Table.Cell>
        <Table.Cell colspan={1} class="w-4">
            <div class="flex w-full items-center justify-end">
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
                                            onclick={() =>
                                                act.action(objectItem)}
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
            </div>
        </Table.Cell>
    </Table.Row>
{/snippet}

{#snippet emptyRow()}
    <Table.Row>
        <Table.Cell colspan={12} class="h-48">
            <div class="flex flex-col items-center justify-center gap-4">
                <div class="text-muted-foreground text-center">
                    <p class="text-lg font-medium">No files yet</p>
                    <p class="text-sm">
                        Upload files or create a folder to get started
                    </p>
                </div>
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
            </div>
        </Table.Cell>
    </Table.Row>
{/snippet}

{#snippet loadingRows()}
    {#each Array(loadingAmount) as _}
        <Table.Row>
            <Table.Cell colspan={1}>
                <Checkbox disabled />
            </Table.Cell>
            <Table.Cell colspan={10} class="text-center">
                <Skeleton class="h-7.5 w-full rounded-sm" />
            </Table.Cell>
            <Table.Cell colspan={1} class="w-4">
                <div class="flex w-full items-center justify-end">
                    <Button variant="ghost" size="icon" disabled>
                        <EllipsisVerticalIcon />
                        <span class="sr-only">Open menu</span>
                    </Button>
                </div>
            </Table.Cell>
        </Table.Row>
    {/each}
{/snippet}

<div
    class={cn(
        "relative rounded-lg border transition-all",
        isDragging && "border-primary border-2 bg-primary/5",
    )}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    role="region"
>
    {#if isDragging}
        <div
            class="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm"
        >
            <div
                class="border-primary text-primary flex size-16 items-center justify-center rounded-full border-2 border-dashed"
            >
                <UploadIcon class="size-8" />
            </div>
            <p class="text-primary font-medium">Drop files to upload</p>
        </div>
    {/if}
    <Table.Root>
        <Table.Header class="bg-muted sticky top-0 z-10">
            <Table.Row>
                <Table.Head colspan={1} class="w-4">
                    <Checkbox
                        onCheckedChange={(e) => toggleSelectAll(e)}
                        checked={allSelected}
                        bind:indeterminate
                    />
                </Table.Head>
                {#each columns as headItem}
                    <Table.Head
                        colspan={headItem.colSpan}
                        class={cn(headItem.class)}
                    >
                        {#if headItem.sortKey}
                            <button
                                class="flex items-center gap-1 hover:text-foreground transition-colors"
                                onclick={() => toggleSort(headItem.sortKey!)}
                            >
                                {headItem.title}
                                {#if sortColumn === headItem.sortKey}
                                    {#if sortDirection === "asc"}
                                        <ArrowUpIcon class="h-4 w-4" />
                                    {:else}
                                        <ArrowDownIcon class="h-4 w-4" />
                                    {/if}
                                {:else}
                                    <ArrowUpDownIcon
                                        class="h-4 w-4 opacity-50"
                                    />
                                {/if}
                            </button>
                        {:else}
                            {headItem.title}
                        {/if}
                    </Table.Head>
                {/each}
            </Table.Row>
        </Table.Header>
        <Table.Body>
            {#if loading}
                {@render loadingRows()}
            {:else if searchValue}
                {#if sortedSearchResults && sortedSearchResults.length > 0}
                    {#each sortedSearchResults as item}
                        {@render tableRow(item)}
                    {/each}
                {:else}
                    {@render emptyRow()}
                {/if}
            {:else if files.count! > 0 && sortedFiles}
                {#each sortedFiles as item}
                    {@render tableRow(item)}
                {/each}
            {:else}
                {@render emptyRow()}
            {/if}
        </Table.Body>
    </Table.Root>
</div>
