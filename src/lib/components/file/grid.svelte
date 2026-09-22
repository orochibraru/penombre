<script lang="ts">
	import {
		CloudUploadIcon,
		CornerLeftUpIcon,
		EllipsisVerticalIcon,
		FolderPlusIcon,
		UploadIcon,
	} from "@lucide/svelte";
	import type { ObjectItem } from "#lib/api/index.js";
	import FilePrefix from "#lib/components/file/prefix.svelte";
	import {
		applySelection,
		selectedCount,
		setShiftHeld,
	} from "#lib/components/file/selection.svelte.js";
	import { Button } from "#lib/components/ui/button/index.js";
	import Checkbox from "#lib/components/ui/checkbox/checkbox.svelte";
	import * as ContextMenu from "#lib/components/ui/context-menu/index.js";
	import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js";
	import { Skeleton } from "#lib/components/ui/skeleton/index.js";
	import * as m from "#lib/paraglide/messages.js";
	import { locationOf } from "#lib/storage-location.js";
	import {
		cn,
		isBrowsableListing,
		isFolderItem,
		isTrashListing,
		listingHref,
		PARENT_KEY,
		parentHref,
		resolveDropDestination,
		resolveParentPath,
		type SharedFileDisplayProps,
		shouldDisplayAction,
	} from "#lib/utils.js";
	import { createWindowVirtualizer } from "#lib/virtual-window.svelte.js";
	import { goto } from "$app/navigation";
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
		preSorted = false,
		draggedItem,
		dropTargetKey = $bindable(),
		onDragStart,
		onDragEnd,
		onDropOnFolder,
	}: SharedFileDisplayProps = $props();

	const iconSize = "h-36 w-36";
	const loadingAmount = 20;

	/**
	 * A tile's height scales with its width (the media well is `aspect-16/10`,
	 * the caption below it a fixed 60px), so row height for virtualization is
	 * computed rather than constant, and set on each tile so CSS agrees. Column count must match the CSS grid's
	 * own breakpoints exactly or the computed height is wrong; those are
	 * viewport-width Tailwind variants, not the container's own width, so
	 * this reads `innerWidth`, not the measured container.
	 *
	 * ponytail: breakpoints are hardcoded to mirror the `grid-cols-*` classes
	 * on the `<ul>` below. If those change, update this table too.
	 */
	const GRID_BREAKPOINTS: Array<{ min: number; columns: number }> = [
		{ min: 1536, columns: 5 },
		{ min: 1280, columns: 4 },
		{ min: 1024, columns: 3 },
		{ min: 640, columns: 2 },
		{ min: 0, columns: 1 },
	];
	const GRID_GAP = 12;
	const CAPTION_HEIGHT = 60;
	const TILE_BORDER = 2;

	function columnsForViewport(width: number): number {
		return GRID_BREAKPOINTS.find((bp) => width >= bp.min)?.columns ?? 1;
	}

	/** `undefined` outside /browse and at the drive root: no `..` row there. */
	// A share has no parent to go up to: above its root is the owner's drive.
	const parentPath = $derived(
		page.data.share?.root === page.params.path
			? undefined
			: resolveParentPath(page.params.path),
	);
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

		if (!onDrop) {
			return;
		}

		const droppedFiles = Array.from(e.dataTransfer?.files ?? []);
		if (droppedFiles.length > 0) {
			onDrop(droppedFiles);
		}
	}

	function handleItemDragStart(e: DragEvent, item: ObjectItem) {
		if (!(onDragStart && e.dataTransfer)) {
			return;
		}
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/plain", item.key);
		onDragStart(item);
	}

	function handleItemDragEnd(_e: DragEvent) {
		if (!onDragEnd) {
			return;
		}
		dropTargetKey = undefined;
		onDragEnd();
	}

	function handleFolderDragOver(e: DragEvent, folderKey: string) {
		if (!(draggedItem && onDropOnFolder)) {
			return;
		}
		e.preventDefault();
		e.stopPropagation();
		dropTargetKey = folderKey;
	}

	function handleFolderDragLeave(e: DragEvent, folderKey: string) {
		if (!draggedItem) {
			return;
		}
		e.preventDefault();
		e.stopPropagation();
		if (dropTargetKey === folderKey) {
			dropTargetKey = undefined;
		}
	}

	function handleFolderDrop(e: DragEvent, folderKey: string) {
		if (!(draggedItem && onDropOnFolder)) {
			return;
		}
		e.preventDefault();
		e.stopPropagation();

		// Prevent dropping on itself
		if (draggedItem.key === folderKey) {
			dropTargetKey = undefined;
			return;
		}

		onDropOnFolder(resolveDropDestination(folderKey, page.params.path));
		dropTargetKey = undefined;
	}

	function isChecked(item: ObjectItem): boolean {
		return !!checkedItems[item.key];
	}

	function getItemName(item: ObjectItem): string {
		return (item.metadata.name || item.key).toLowerCase();
	}

	function getItemDate(item: ObjectItem): number {
		const date = item.updatedAt;
		if (!date) {
			return 0;
		}
		return new Date(date).getTime();
	}

	function compareItems(a: ObjectItem, b: ObjectItem): number {
		const aIsFolder = isFolderItem(a);
		const bIsFolder = isFolderItem(b);
		if (aIsFolder && !bIsFolder) {
			return -1;
		}
		if (!aIsFolder && bIsFolder) {
			return 1;
		}

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
			if (aIsFolder && !bIsFolder) {
				return -1;
			}
			if (!aIsFolder && bIsFolder) {
				return 1;
			}
			// Sort by name within same type
			return getItemName(a).localeCompare(getItemName(b));
		});
	}

	let sortedFiles = $derived.by(() => {
		if (!files.list) {
			return files.list;
		}
		if (preSorted) {
			return files.list;
		}
		if (!sortColumn) {
			return sortFoldersFirst(files.list);
		}
		return [...files.list].sort(compareItems);
	});

	let sortedSearchResults = $derived.by(() => {
		if (!searchResults) {
			return searchResults;
		}
		if (!sortColumn) {
			return sortFoldersFirst(searchResults);
		}
		return [...searchResults].sort(compareItems);
	});

	/**
	 * Whatever is on screen right now, so a shift-range matches the eye.
	 *
	 * Mirrors the render condition exactly. Testing `searchResults` for truth
	 * is not the same thing: an empty array is truthy, so a drive with no
	 * search active resolved to an empty list and every selection was written
	 * against nothing.
	 */
	const displayed = $derived(
		sortedSearchResults && sortedSearchResults.length > 0
			? sortedSearchResults
			: (sortedFiles ?? []),
	);

	/** Any selection at all pins every tile's checkbox open. */
	const anySelected = $derived(selectedCount(displayed, checkedItems) > 0);

	/**
	 * `onCheckedChange`, not `onclick`: the checkbox reports its own state and
	 * an `onclick` handler never toggled it. The shift key is captured on the
	 * wrapper on the way down, since this callback only receives a boolean.
	 */
	function toggleTile(item: ObjectItem, next: boolean) {
		applySelection(displayed, item.key, next, checkedItems);
		setShiftHeld(false);
	}

	let gridEl: HTMLElement | undefined = $state();
	let containerWidth: number = $state(0);
	let viewportWidth: number = $state(0);

	const columns = $derived(Math.max(1, columnsForViewport(viewportWidth)));
	const tileWidth = $derived(
		containerWidth > 0
			? (containerWidth - GRID_GAP * (columns - 1)) / columns
			: 0,
	);
	const tileHeight = $derived(
		tileWidth > 0 ? (tileWidth * 10) / 16 + CAPTION_HEIGHT + TILE_BORDER : 220,
	);

	/** Rows-of-tiles virtualization: only the rows near the viewport render. */
	const virtualizer = createWindowVirtualizer({
		count: () => Math.ceil(displayed.length / columns),
		rowHeight: () => tileHeight + GRID_GAP,
		overscan: 3,
	});
	$effect(() => {
		void displayed.length;
		void columns;
		if (gridEl) {
			virtualizer.bind(gridEl);
		}
	});
	const visibleItems = $derived(
		displayed.slice(virtualizer.first * columns, virtualizer.last * columns),
	);
</script>

<svelte:window
    bind:innerWidth={viewportWidth}
    onscroll={virtualizer.onScroll}
    onresize={virtualizer.onResize}
/>

{#snippet listItem(objectItem: ObjectItem)}
    {@const checked = isChecked(objectItem)}
    {@const isFolder = isFolderItem(objectItem)}
    {@const isDragTarget = dropTargetKey === objectItem.key}
    <li
        class={cn(
            "group/tile bg-card/40 hover:border-primary/50 hover:bg-card/70 relative flex flex-col overflow-hidden rounded-[calc(var(--radius)+2px)] border transition-colors",
            checked && "border-primary bg-primary/5",
            isDragTarget && "border-primary bg-primary/10",
        )}
        style={tileWidth > 0 ? `height: ${tileHeight}px` : undefined}
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
        <!-- Multi-select in grid mode: the box is invisible until the tile is
             hovered or focused, and pinned open as soon as anything at all is
             selected so the current selection stays legible while picking. -->
        <span
            class={cn(
                "absolute top-2 left-2 z-10 transition-opacity",
                checked || anySelected
                    ? "opacity-100"
                    : "opacity-0 group-hover/tile:opacity-100 focus-within:opacity-100",
            )}
            onclickcapture={(e: MouseEvent) => setShiftHeld(e.shiftKey)}
            onkeydowncapture={(e: KeyboardEvent) => setShiftHeld(e.shiftKey)}
        >
            <Checkbox
                {checked}
                aria-label={objectItem.metadata.name ?? objectItem.key}
                class="bg-background/90 border-muted-foreground/40 shadow-sm backdrop-blur-sm"
                onCheckedChange={(next: boolean) =>
                    toggleTile(objectItem, next)}
            />
        </span>

        <ContextMenu.Root>
            <ContextMenu.Trigger class="h-full w-full">
                <div
                    class="flex h-full flex-col"
                    role="button"
                    tabindex={-1}
                    ontap={() => {
                        if (isFolder) {
                            const folder = objectItem.key.replace("/", "");
                            goto(
                                listingHref(
                                    page.params.path
                                        ? `${page.params.path}/${folder}`
                                        : folder,
                                    locationOf(page.params),
                                ),
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
                                    <Icon class={act.iconClass} />
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
        <DropdownMenu.Root>
            <DropdownMenu.Trigger
                class="bg-background/70 text-muted-foreground hover:text-foreground data-[state=open]:bg-background absolute top-1.5 right-1.5 z-10 flex size-7 items-center justify-center rounded-[calc(var(--radius)-2px)] opacity-0 backdrop-blur-sm transition-opacity group-hover/tile:opacity-100 pointer-coarse:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
            >
                {#snippet child({ props })}
                    <button type="button" {...props}>
                        <EllipsisVerticalIcon class="size-4" />
                        <span class="sr-only">{m.open_menu()}</span>
                    </button>
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
                                    onclick={() => act.action(objectItem)}
                                    disabled={act.disabled}
                                    variant={act.variant}
                                >
                                    <Icon class={act.iconClass} />
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
    </li>
{/snippet}

{#snippet parentGridItem(parent: string)}
    {@const isDragTarget = dropTargetKey === PARENT_KEY}
    <li
        class={cn(
            "flex items-stretch justify-center rounded-xl border border-dashed p-5 transition-colors",
            isDragTarget ? "bg-primary/10 ring-2 ring-primary" : "",
        )}
        ondragover={(e) => handleFolderDragOver(e, PARENT_KEY)}
        ondragleave={(e) => handleFolderDragLeave(e, PARENT_KEY)}
        ondrop={(e) => handleFolderDrop(e, PARENT_KEY)}
    >
        <a
            href={parentHref(parent, locationOf(page.params))}
            title={m.parent_folder()}
            class="text-muted-foreground hover:text-foreground flex h-full flex-col items-center justify-center gap-2 transition-colors"
        >
            <CornerLeftUpIcon class="h-12 w-12" />
            <span class="font-mono text-sm">..</span>
        </a>
    </li>
{/snippet}

{#snippet emptyListItem()}
    <li
        class="col-span-full flex flex-col items-center justify-center gap-4 py-12"
    >
        <div class="text-muted-foreground text-center">
            {#if isTrashListing(page.url.pathname)}
                <p class="text-lg font-medium">{m.trash_is_empty()}</p>
            {:else if page.url.pathname.includes('/starred')}
                <p class="text-lg font-medium">{m.star_files_to_find_here()}</p>
            {:else if page.url.pathname.includes('/recent')}
                <p class="text-lg font-medium">{m.nothing_opened_recently()}</p>
            {:else if isBrowsableListing(page.url.pathname)}
                <p class="text-lg font-medium">{m.no_files_yet()}</p>
                <p class="text-sm">
                    {m.no_files_get_started()}
                </p>
            {:else}
                <p class="text-lg font-medium">{m.no_results()}</p>
            {/if}
        </div>
        {#if isBrowsableListing(page.url.pathname)}
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
    </li>
{/snippet}

{#snippet virtualTiles()}
    <!-- Rows of tiles, not individual tiles: only the rows near the
         viewport render, `col-span-full` spacers standing in for the rest so
         the real scrollbar still measures the whole grid. -->
    {#if virtualizer.padTop > 0}
        <li class="col-span-full" aria-hidden="true" style="height: {virtualizer.padTop}px"></li>
    {/if}
    {#each visibleItems as objectItem (objectItem.key)}
        {@render listItem(objectItem)}
    {/each}
    {#if virtualizer.padBottom > 0}
        <li class="col-span-full" aria-hidden="true" style="height: {virtualizer.padBottom}px"></li>
    {/if}
{/snippet}

{#snippet loadingRows()}
    {#each Array(loadingAmount) as _}
        <li>
            <Skeleton class="aspect-video rounded-[calc(var(--radius)+2px)]" />
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
            <p class="text-primary font-medium">{m.drop_files_to_upload()}</p>
        </div>
    {/if}
    <ul
        bind:this={gridEl}
        bind:clientWidth={containerWidth}
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
    >
        {#if loading}
            {@render loadingRows()}
        {:else if searchValue}
            {#if sortedSearchResults && sortedSearchResults.length > 0}
                {@render virtualTiles()}
            {:else}
                {@render emptyListItem()}
            {/if}
        {:else}
            {#if parentPath !== undefined}
                {@render parentGridItem(parentPath)}
            {/if}
            {#if sortedFiles && sortedFiles.length > 0}
                {@render virtualTiles()}
            {:else}
                {@render emptyListItem()}
            {/if}
        {/if}
    </ul>
</div>
