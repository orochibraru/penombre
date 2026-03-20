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
    import type { ObjectItem } from "$lib/api";
    import FilePrefix from "$lib/components/file/prefix.svelte";
    import { Button } from "$lib/components/ui/button";
    import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
    import * as ContextMenu from "$lib/components/ui/context-menu/index.js";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";
    import { Skeleton } from "$lib/components/ui/skeleton/index";
    import * as Table from "$lib/components/ui/table/index";
    import {
        cn,
        readableFileSize,
        isFolderItem,
        type SharedFileDisplayProps,
        type SortColumn,
        shouldDisplayAction,
    } from "$lib/utils";
    import FolderSize from "$lib/components/file/folder-size.svelte";
    import { resolve } from "$app/paths";
    import * as m from "$lib/paraglide/messages.js";

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
        draggedItem,
        dropTargetKey = $bindable(),
        onDragStart,
        onDragEnd,
        onDropOnFolder,
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

    function handleItemDragStart(e: DragEvent, item: ObjectItem) {
        if (!onDragStart) return;
        e.dataTransfer!.effectAllowed = "move";
        e.dataTransfer!.setData("text/plain", item.key);
        onDragStart(item);
    }

    function handleItemDragEnd(e: DragEvent) {
        if (!onDragEnd) return;
        dropTargetKey = undefined;
        onDragEnd();
    }

    function handleFolderDragOver(e: DragEvent, folderKey: string) {
        if (!draggedItem || !onDropOnFolder) return;
        e.preventDefault();
        e.stopPropagation();
        dropTargetKey = folderKey;
    }

    function handleFolderDragLeave(e: DragEvent, folderKey: string) {
        if (!draggedItem) return;
        e.preventDefault();
        e.stopPropagation();
        if (dropTargetKey === folderKey) {
            dropTargetKey = undefined;
        }
    }

    function handleFolderDrop(e: DragEvent, folderKey: string) {
        if (!draggedItem || !onDropOnFolder) return;
        e.preventDefault();
        e.stopPropagation();

        // Prevent dropping on itself
        if (draggedItem.key === folderKey) {
            dropTargetKey = undefined;
            return;
        }

        // Build destination path
        const currentPath = page.params.path;
        const destination = currentPath
            ? `${currentPath}/${folderKey.replace(/\/$/, "")}`
            : folderKey.replace(/\/$/, "");

        onDropOnFolder(destination);
        dropTargetKey = undefined;
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
        return new Date(date).getTime();
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

    function toggleSelectAll(checked: boolean) {
        isSingleItemAction = false;
        if (files.list) {
            files.list.forEach((item) => {
                checkedItems[item.key] = checked
                    ? item.metadata.name || item.key
                    : false;
            });
        }
    }

    const columns: TableHeadItem[] = [
        {
            title: m.sort_name(),
            colSpan: 7,
            sortKey: "name",
        },
        {
            title: m.sort_size(),
            colSpan: 1,
            sortKey: "size",
        },
        {
            title: m.modified(),
            colSpan: 1,
            sortKey: "updatedAt",
        },
        {
            title: "",
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
        return !!checkedItems[item.key];
    }
</script>

{#snippet tableRow(objectItem: ObjectItem)}
    {@const isFolder = isFolderItem(objectItem)}
    {@const isDragTarget = dropTargetKey === objectItem.key}
    <Table.Row
        class={cn(isDragTarget ? "bg-primary/10 ring-2 ring-primary" : "")}
        draggable={onDragStart !== undefined}
        ondragstart={(e) => handleItemDragStart(e, objectItem)}
        ondragend={handleItemDragEnd}
        ondragover={isFolder
            ? (e) => handleFolderDragOver(e, objectItem.key)
            : undefined}
        ondragleave={isFolder
            ? (e) => handleFolderDragLeave(e, objectItem.key)
            : undefined}
        ondrop={isFolder
            ? (e) => handleFolderDrop(e, objectItem.key)
            : undefined}
    >
        <Table.Cell class="w-4">
            <Checkbox
                checked={isChecked(objectItem)}
                onCheckedChange={(checked) => {
                    checkedItems[objectItem.key] = checked
                        ? objectItem.metadata.name || objectItem.key
                        : false;
                    const someChecked = files.list!.filter(
                        (item) => !!checkedItems[item.key],
                    );
                    if (someChecked.length > 1) {
                        isSingleItemAction = false;
                    } else {
                        isSingleItemAction = true;
                    }
                }}
            />
        </Table.Cell>
        <Table.Cell colspan={7} class="min-w-0">
            <ContextMenu.Root>
                <ContextMenu.Trigger class="w-full">
                    <div
                        class="flex w-full min-w-0 flex-col items-start gap-2"
                        role="button"
                        tabindex={-1}
                        ontap={() => {
                            if (isFolder) {
                                const folder = objectItem.key.replace("/", "");
                                goto(
                                    resolve("/(app)/browse/[...path]", {
                                        path: page.params.path
                                            ? `${page.params.path}/${folder}`
                                            : folder,
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
                                    {@const Icon = act.dynamic
                                        ? act.icon(objectItem)
                                        : act.icon}
                                    {@const title = act.dynamic
                                        ? (
                                              act.title as (
                                                  item: typeof objectItem,
                                              ) => string
                                          )(objectItem)
                                        : act.title}
                                    <ContextMenu.Item
                                        onclick={() => act.action(objectItem)}
                                        disabled={act.disabled}
                                        variant={act.variant}
                                    >
                                        <Icon />
                                        {title}
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
            {#if isFolder}
                <FolderSize
                    folderKey={objectItem.key}
                    parentPath={page.params.path}
                />
            {:else}
                <p class="text-xs">
                    {readableFileSize(objectItem.size as number) ?? "-"}
                </p>
            {/if}
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
                                <span class="sr-only">{m.open_menu()}</span>
                            </Button>
                        {/snippet}
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                        {#each itemActions as action}
                            <DropdownMenu.Group>
                                {#each action.actions as act}
                                    {#if shouldDisplayAction( { action: act, item: objectItem }, )}
                                        {@const Icon = act.dynamic
                                            ? act.icon(objectItem)
                                            : act.icon}
                                        {@const title = act.dynamic
                                            ? (
                                                  act.title as (
                                                      item: typeof objectItem,
                                                  ) => string
                                              )(objectItem)
                                            : act.title}
                                        <DropdownMenu.Item
                                            onclick={() =>
                                                act.action(objectItem)}
                                            disabled={act.disabled}
                                            variant={act.variant}
                                        >
                                            <Icon />
                                            {title}
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
                    {#if page.url.pathname.startsWith("/browse")}
                        <p class="text-lg font-medium">{m.no_files_yet()}</p>
                        <p class="text-sm">
                            {m.no_files_get_started()}
                        </p>
                    {:else}
                        <p class="text-lg font-medium">{m.no_results()}</p>
                    {/if}
                </div>
                {#if page.url.pathname.startsWith("/browse")}
                    <div class="flex gap-2">
                        {#if onUpload}
                            <Button variant="default" onclick={onUpload}>
                                <CloudUploadIcon class="mr-2 h-4 w-4" />
                                {m.upload_files()}
                            </Button>
                        {/if}
                        {#if onCreateFolder}
                            <Button variant="outline" onclick={onCreateFolder}>
                                <FolderPlusIcon class="mr-2 h-4 w-4" />
                                {m.new_folder()}
                            </Button>
                        {/if}
                    </div>
                {/if}
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
                        <span class="sr-only">{m.open_menu()}</span>
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
            <p class="text-primary font-medium">{m.drop_files_to_upload()}</p>
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
