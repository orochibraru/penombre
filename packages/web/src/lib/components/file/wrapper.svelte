<script lang="ts">
    import {
        ArrowUpDownIcon,
        BrushCleaningIcon,
        CheckIcon,
        LayoutGridIcon,
        LayoutListIcon,
    } from "@lucide/svelte";
    import { onMount } from "svelte";
    import { MediaQuery } from "svelte/reactivity";
    import { toast } from "svelte-sonner";
    import { browser } from "$app/environment";
    import { invalidate } from "$app/navigation";
    import { navigating, page } from "$app/state";
    import {
        getApiClient,
        type ObjectItem,
        type ObjectList,
    } from "$lib/api-client";
    import FileGrid from "$lib/components/file/grid.svelte";
    import FileList from "$lib/components/file/list.svelte";
    import FileTable from "$lib/components/file/table.svelte";
    import { Badge } from "$lib/components/ui/badge/index";
    import { Button } from "$lib/components/ui/button/index";
    import * as Code from "$lib/components/ui/code/index";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";
    import { Input } from "$lib/components/ui/input";
    import {
        type AvailableLayouts,
        availableLayouts,
        layoutStore,
    } from "$lib/store/layout";
    import { loadSortPreference, saveSortPreference } from "$lib/store/sorting";
    import {
        pendingUploadFiles,
        uploadDialogOpen,
        newFolderDialogOpen,
    } from "$lib/store/upload";
    import {
        capitalizeFirstLetter,
        readableFileSize,
        type SortColumn,
        type SortDirection,
    } from "$lib/utils";
    import DeleteDialog from "$lib/components/layout/dialogs/delete-dialog.svelte";
    import RestoreDialog from "$lib/components/layout/dialogs/restore-dialog.svelte";
    import MoveDialog from "$lib/components/layout/dialogs/move-dialog.svelte";
    import VideoPlayer from "$lib/components/layout/video-player.svelte";
    import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
    import {
        type FileToView,
        handleOpenItem as openItem,
        handleOpenItemInNewTab,
        handleDownloadItem,
        createTrashActions,
        createMainActions,
        createMainMultipleActions,
        createTrashMultipleActions,
        executeRestoreOperation,
        executeDeleteOperation,
        computeSelectionState,
        selectAllForEmptyTrash,
        triggerRenameAction,
        getDuplicateFilePromise,
    } from "./wrapper.svelte.js";
    import { ExternalLinkIcon } from "@lucide/svelte";

    type Props = {
        data: ObjectList;
        loading?: boolean;
    };

    let { data, loading = $bindable(false) }: Props = $props();

    const api = getApiClient(fetch);

    function handleFileDrop(files: File[]) {
        pendingUploadFiles.set(files);
        $uploadDialogOpen = true;
    }

    function handleUpload() {
        $uploadDialogOpen = true;
    }

    function handleCreateFolder() {
        $newFolderDialogOpen = true;
    }

    let allSelected: boolean = $state(false);
    let indeterminate: boolean = $state(false);
    let confirmDeleteOpen: boolean = $state(false);
    let confirmRestoreOpen: boolean = $state(false);
    let moveDialogOpen: boolean = $state(false);
    let restoringItem: boolean = $state(false);
    let deletingItem: boolean = $state(false);
    let movingItem: boolean = $state(false);
    let checkedItems: Record<string, string> = $state({});
    let isSingleItemAction: boolean = $state(false);
    let searchValue: string = $state("");
    let searchResults: ObjectItem[] = $state([]);
    let searchTimeout: ReturnType<typeof setTimeout> | undefined = $state();
    let actionsContextOpen: boolean = $state(false);
    let actionableItem: ObjectItem | undefined = $state();
    let viewFileOpen: boolean = $state(false);
    let sortColumn: SortColumn = $state("name");
    let sortDirection: SortDirection = $state("asc");
    let fileToView: FileToView = $state(null);
    let moveItem: ObjectItem | undefined = $state();

    // Close local dialogs on navigation
    $effect(() => {
        if (navigating) {
            confirmDeleteOpen = false;
            confirmRestoreOpen = false;
            moveDialogOpen = false;
            viewFileOpen = false;
            actionsContextOpen = false;
        }
    });

    const isDesktop = new MediaQuery("(min-width: 768px)");

    // ================================
    // Derived State
    // ================================
    let multiObjectActionsOpen = $derived(
        (indeterminate || allSelected) && !isSingleItemAction,
    );

    let isTrash = $derived(page.url.pathname.startsWith("/trash"));

    // Get current folder from URL path for API calls
    let currentFolder = $derived.by(() => {
        const path = page.url.pathname;
        if (path.startsWith("/browse/")) {
            return path.slice("/browse/".length);
        }
        return "";
    });

    // ================================
    // Callbacks for extracted functions
    // ================================
    const stateCallbacks = {
        setRestoringItem: (v: boolean) => (restoringItem = v),
        setConfirmRestoreOpen: (v: boolean) => (confirmRestoreOpen = v),
        setActionsContextOpen: (v: boolean) => (actionsContextOpen = v),
        clearCheckedItems: () => (checkedItems = {}),
        setActionableItem: (v: ObjectItem | undefined) => (actionableItem = v),
        setDeletingItem: (v: boolean) => (deletingItem = v),
        setConfirmDeleteOpen: (v: boolean) => (confirmDeleteOpen = v),
    };

    // ================================
    // Search
    // ================================
    let searchInputRef: HTMLInputElement | null = $state(null);

    async function performSearch() {
        if (!searchValue || searchValue.trim() === "") {
            searchResults = [];
            loading = false;
            return;
        }

        try {
            const res = await api.storage.objects.search.$get({
                query: { q: searchValue.trim() },
            });
            if (res.ok) {
                const data = await res.json();
                searchResults = data.list;
            } else {
                searchResults = [];
            }
        } catch (error) {
            console.error("Search failed:", error);
            searchResults = [];
        }
        loading = false;
    }

    const debounce = () => {
        if (searchValue === "") {
            searchResults = [];
            loading = false;
            return;
        }
        loading = true;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => performSearch(), 300);
    };

    // Keyboard shortcut: Ctrl+K or Cmd+K to focus search
    function handleKeydown(e: KeyboardEvent) {
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
            e.preventDefault();
            searchInputRef?.focus();
        }
    }

    // ================================
    // Item Actions
    // ================================
    function handleRestoreObject() {
        executeRestoreOperation(checkedItems, stateCallbacks);
    }

    function handleDeleteObject() {
        executeDeleteOperation(checkedItems, isTrash, stateCallbacks);
    }

    // Single item action helpers
    function prepareForSingleItemAction(item: ObjectItem) {
        isSingleItemAction = true;
        checkedItems = {};
        checkedItems[item.key] = item.metadata.name ?? item.key;
    }

    // Create action definitions with handlers
    const trashActions = createTrashActions({
        onDeletePermanently: (item) => {
            prepareForSingleItemAction(item);
            confirmDeleteOpen = true;
        },
        onRestore: (item) => {
            prepareForSingleItemAction(item);
            confirmRestoreOpen = true;
        },
    });

    const mainActions = createMainActions({
        onDownload: (item) =>
            handleDownloadItem(
                item.metadata.name ?? item.key,
                () => (actionsContextOpen = false),
            ),
        onOpenInNewTab: handleOpenItemInNewTab,
        onRename: (item) =>
            triggerRenameAction(item, () => (actionsContextOpen = false)),
        onMove: (item) => {
            moveItem = item;
            moveDialogOpen = true;
            actionsContextOpen = false;
        },
        onDuplicate: async (item) => {
            actionsContextOpen = false;
            const itemName = item.metadata.name ?? item.key;
            const fullPath = currentFolder
                ? `${currentFolder}/${item.key}`
                : item.key;

            toast.promise(
                getDuplicateFilePromise(fullPath, {
                    onSuccess: async () => {
                        await invalidate("app:files");
                    },
                    onError: () => {},
                }),
                {
                    loading: `Duplicating "${itemName}"...`,
                    success: `Duplicated "${itemName}"`,
                    error: `Failed to duplicate "${itemName}"`,
                },
            );
        },
        onStar: async (item) => {
            actionsContextOpen = false;
            const isCurrentlyStarred = item.metadata.isStarred ?? false;
            const newStarred = !isCurrentlyStarred;
            const itemName = item.metadata.name ?? item.key;

            try {
                const res = await api.storage.objects.item[":item"].$put({
                    param: { item: encodeURIComponent(item.key) },
                    query: { folder: currentFolder },
                    json: { isStarred: newStarred },
                });
                if (res.ok) {
                    toast.success(
                        newStarred
                            ? `Added "${itemName}" to starred`
                            : `Removed "${itemName}" from starred`,
                    );
                    await invalidate("app:files");
                } else {
                    toast.error("Failed to update star status");
                }
            } catch (error) {
                console.error("Star failed:", error);
                toast.error("Failed to update star status");
            }
        },
        onMoveToTrash: (item) => {
            prepareForSingleItemAction(item);
            handleDeleteObject();
        },
    });

    let itemActions = $derived(isTrash ? trashActions : mainActions);

    // Multiple item actions
    const mainMultipleActions = createMainMultipleActions({
        onDownload: () => {
            if (Object.keys(checkedItems).length === 0) return;
            for (const checkedItem of Object.values(checkedItems)) {
                handleDownloadItem(
                    checkedItem,
                    () => (actionsContextOpen = false),
                );
                delete checkedItems[checkedItem];
            }
        },
        onMoveToTrash: handleDeleteObject,
    });

    const trashMultipleActions = createTrashMultipleActions({
        onRestore: () => {
            isSingleItemAction = false;
            confirmRestoreOpen = true;
            actionsContextOpen = false;
        },
        onDeletePermanently: () => {
            isSingleItemAction = false;
            confirmDeleteOpen = true;
            actionsContextOpen = false;
        },
    });

    let multipleItemsActions = $derived(
        isTrash ? trashMultipleActions : mainMultipleActions,
    );

    // ================================
    // File Opening
    // ================================
    async function handleOpenItemWrapper(item: ObjectItem) {
        const display = item.metadata.name || item.key;
        return toast.promise(
            openItem(item, isDesktop, {
                setFileToView: (f) => (fileToView = f),
                openViewDialog: () => (viewFileOpen = true),
            }),
            {
                loading: `Opening "${display}"`,
                error: `Failed to open "${display}"`,
            },
        );
    }

    // ================================
    // Layout Management
    // ================================
    function setLayoutBasedOnRoute() {
        if (
            page.url.pathname.startsWith("/browse") ||
            page.url.pathname.startsWith("/trash")
        ) {
            $layoutStore = "list";
        } else {
            $layoutStore = "grid";
        }
    }

    onMount(() => {
        if (browser) {
            // Load layout preference
            const layoutParam = localStorage.getItem("layout");

            if (layoutParam) {
                if (!availableLayouts.includes(layoutParam)) {
                    setLayoutBasedOnRoute();
                } else {
                    $layoutStore = (layoutParam as AvailableLayouts) ?? "list";
                }
            } else {
                setLayoutBasedOnRoute();
            }

            // Load sorting preference
            const sortPref = loadSortPreference();
            sortColumn = sortPref.column;
            sortDirection = sortPref.direction;
        }
    });

    // Save sorting preference when it changes
    $effect(() => {
        if (browser) {
            saveSortPreference({
                column: sortColumn,
                direction: sortDirection,
            });
        }
    });

    // ================================
    // Trash Operations
    // ================================
    function emptyTrash() {
        checkedItems = selectAllForEmptyTrash(data);
        confirmDeleteOpen = true;
        isSingleItemAction = false;
    }

    // ================================
    // Selection Effect
    // ================================
    $effect(() => {
        const state = computeSelectionState(data, checkedItems);
        allSelected = state.allSelected;
        indeterminate = state.indeterminate;
    });
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Filters -->

{#if multiObjectActionsOpen}
    <Input
        bind:value={searchValue}
        type="search"
        disabled
        placeholder="Search (Ctrl+K)"
        class="md:hidden mb-3"
        onkeyup={() => {
            debounce();
        }}
    />
    <div class="ml-auto max-w-xl">
        <div class="flex items-center gap-2 pb-5">
            {#each multipleItemsActions as action}
                {@const Icon = action.icon}
                <div class="w-full">
                    <Button
                        variant={action.variant}
                        onclick={() => action.action()}
                        class="w-full text-xs"
                    >
                        <Icon class="h-5 w-4" />
                        {action.title}
                    </Button>
                </div>
            {/each}
        </div>
    </div>
{:else}
    <Input
        bind:value={searchValue}
        type="search"
        placeholder="Search (Ctrl+K)"
        class="md:hidden mb-3"
        onkeyup={() => {
            debounce();
        }}
    />
    <div class="w-full pb-5 flex justify-between items-center gap-3">
        <Input
            bind:ref={searchInputRef}
            bind:value={searchValue}
            type="search"
            placeholder="Search (Ctrl+K)"
            class="hidden md:block "
            onkeyup={() => {
                debounce();
            }}
        />
        <ButtonGroup.Root>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                    {#snippet child({ props })}
                        <Button variant="outline" {...props}>
                            <ArrowUpDownIcon class="h-4 w-4" />
                            <span class="inline">
                                {#if sortColumn}
                                    {sortColumn === "name"
                                        ? "Name"
                                        : sortColumn === "size"
                                          ? "Size"
                                          : "Date"}
                                    {sortDirection === "asc" ? "↑" : "↓"}
                                {:else}
                                    Sort
                                {/if}
                            </span>
                        </Button>
                    {/snippet}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                    <DropdownMenu.Label>Sort by</DropdownMenu.Label>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                        onclick={() => {
                            sortColumn = "name";
                            sortDirection = "asc";
                        }}
                    >
                        {#if sortColumn === "name" && sortDirection === "asc"}
                            <CheckIcon class="h-4 w-4" />
                        {:else}
                            <span class="w-4"></span>
                        {/if}
                        Name (A-Z)
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        onclick={() => {
                            sortColumn = "name";
                            sortDirection = "desc";
                        }}
                    >
                        {#if sortColumn === "name" && sortDirection === "desc"}
                            <CheckIcon class="h-4 w-4" />
                        {:else}
                            <span class="w-4"></span>
                        {/if}
                        Name (Z-A)
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                        onclick={() => {
                            sortColumn = "size";
                            sortDirection = "desc";
                        }}
                    >
                        {#if sortColumn === "size" && sortDirection === "desc"}
                            <CheckIcon class="h-4 w-4" />
                        {:else}
                            <span class="w-4"></span>
                        {/if}
                        Size (Largest)
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        onclick={() => {
                            sortColumn = "size";
                            sortDirection = "asc";
                        }}
                    >
                        {#if sortColumn === "size" && sortDirection === "asc"}
                            <CheckIcon class="h-4 w-4" />
                        {:else}
                            <span class="w-4"></span>
                        {/if}
                        Size (Smallest)
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                        onclick={() => {
                            sortColumn = "updatedAt";
                            sortDirection = "desc";
                        }}
                    >
                        {#if sortColumn === "updatedAt" && sortDirection === "desc"}
                            <CheckIcon class="h-4 w-4" />
                        {:else}
                            <span class="w-4"></span>
                        {/if}
                        Date (Newest)
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        onclick={() => {
                            sortColumn = "updatedAt";
                            sortDirection = "asc";
                        }}
                    >
                        {#if sortColumn === "updatedAt" && sortDirection === "asc"}
                            <CheckIcon class="h-4 w-4" />
                        {:else}
                            <span class="w-4"></span>
                        {/if}
                        Date (Oldest)
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                    {#snippet child({ props })}
                        <Button variant="outline" {...props}>
                            {#if $layoutStore === "grid"}
                                <LayoutGridIcon class="h-4 w-4" />
                            {:else}
                                <LayoutListIcon class="h-4 w-4" />
                            {/if}
                            <span>
                                {capitalizeFirstLetter($layoutStore)}
                            </span>
                        </Button>
                    {/snippet}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                    <DropdownMenu.Label>Layout</DropdownMenu.Label>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                        onclick={() => {
                            $layoutStore = "list";
                            if (browser) {
                                if (page.url.pathname.startsWith("/browse")) {
                                    localStorage.removeItem("layout");
                                } else {
                                    localStorage.setItem("layout", "list");
                                }
                            }
                        }}
                    >
                        {#if $layoutStore === "list"}
                            <CheckIcon class="h-4 w-4" />
                        {:else}
                            <span class="w-4"></span>
                        {/if}
                        List
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        onclick={() => {
                            $layoutStore = "grid";
                            if (browser) {
                                if (!page.url.pathname.startsWith("/browse")) {
                                    localStorage.removeItem("layout");
                                } else {
                                    localStorage.setItem("layout", "grid");
                                }
                            }
                        }}
                    >
                        {#if $layoutStore === "grid"}
                            <CheckIcon class="h-4 w-4" />
                        {:else}
                            <span class="w-4"></span>
                        {/if}
                        Grid
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
            {#if isTrash}
                <Button
                    variant="destructive"
                    onclick={emptyTrash}
                    disabled={data.count === 0}
                    title={data.count === 0 ? "Trash is empty" : "Empty Trash"}
                >
                    <BrushCleaningIcon />
                    Empty Trash
                </Button>
            {/if}
        </ButtonGroup.Root>
    </div>
{/if}

<!-- Table -->
{#if isDesktop.current && $layoutStore === "list"}
    <FileTable
        handleOpenItem={handleOpenItemWrapper}
        files={data}
        {itemActions}
        {searchValue}
        {searchResults}
        {indeterminate}
        bind:sortColumn
        bind:sortDirection
        onDrop={handleFileDrop}
        onUpload={handleUpload}
        onCreateFolder={handleCreateFolder}
        bind:checkedItems
        bind:loading
        bind:allSelected
        bind:actionableItem
        bind:actionsContextOpen
    />
{:else if $layoutStore === "grid"}
    <FileGrid
        handleOpenItem={handleOpenItemWrapper}
        files={data}
        {itemActions}
        {searchValue}
        {searchResults}
        {indeterminate}
        {sortColumn}
        {sortDirection}
        onDrop={handleFileDrop}
        onUpload={handleUpload}
        onCreateFolder={handleCreateFolder}
        bind:checkedItems
        bind:loading
        bind:allSelected
        bind:actionableItem
        bind:actionsContextOpen
    />
{:else}
    <FileList
        handleOpenItem={handleOpenItemWrapper}
        files={data}
        {itemActions}
        {searchValue}
        {searchResults}
        {indeterminate}
        {sortColumn}
        {sortDirection}
        onDrop={handleFileDrop}
        onUpload={handleUpload}
        onCreateFolder={handleCreateFolder}
        bind:checkedItems
        bind:loading
        bind:allSelected
        bind:actionableItem
        bind:actionsContextOpen
    />
{/if}

<Dialog.Root bind:open={viewFileOpen}>
    {#if fileToView}
        <Dialog.Content
            class="max-h-[70%] pb-16 md:max-w-3xl lg:max-w-5xl xl:max-w-7xl"
        >
            <div class="flex flex-col justify-between gap-5 lg:flex-row">
                <Dialog.Header class="text-start lg:text-center">
                    <Dialog.Title>
                        {fileToView.item.metadata.name ?? fileToView.item.key}
                    </Dialog.Title>
                    <Dialog.Description class="flex items-center gap-2">
                        <span>
                            {readableFileSize(fileToView.item.size as number) ??
                                "-"}
                        </span>
                        {#if fileToView.language}
                            <Badge variant="outline" class="text-xs"
                                >{fileToView.language}</Badge
                            >
                        {/if}
                    </Dialog.Description>
                </Dialog.Header>
                <div class="pr-5">
                    <Button
                        type="button"
                        class="w-full lg:w-auto"
                        variant="outline"
                        size="sm"
                        href={fileToView.src}
                        target="_blank"
                    >
                        Open in new tab
                        <ExternalLinkIcon />
                    </Button>
                </div>
            </div>
            <div
                class="flex h-[50vh] w-full items-center justify-center overflow-hidden"
            >
                {#if fileToView.type === "image"}
                    <img
                        src={fileToView.src}
                        alt={fileToView.item.metadata.name ??
                            fileToView.item.key}
                        class="h-full max-w-full rounded-md object-contain"
                    />
                {:else if fileToView.type === "video"}
                    <VideoPlayer
                        src={fileToView.src}
                        title={fileToView.item.metadata.name ??
                            fileToView.item.key}
                    />
                {:else if fileToView.type === "code" && fileToView.language && fileToView.content}
                    <Code.Root
                        lang={fileToView.language}
                        class="w-full"
                        code={fileToView.content}
                    >
                        <Code.CopyButton />
                    </Code.Root>
                {:else if fileToView.type === "pdf"}
                    <embed
                        src={fileToView.src}
                        title={fileToView.item.metadata.name ??
                            fileToView.item.key}
                        class="h-full w-full"
                        width="500"
                        height="700"
                    />
                {/if}
            </div>
        </Dialog.Content>
    {/if}
</Dialog.Root>

<DeleteDialog
    bind:confirmDeleteOpen
    bind:deletingItem
    {checkedItems}
    {handleDeleteObject}
/>

<RestoreDialog
    bind:confirmRestoreOpen
    bind:restoringItem
    {checkedItems}
    {handleRestoreObject}
/>

<MoveDialog bind:open={moveDialogOpen} bind:item={moveItem} />

<style lang="postcss">
    @reference "../../../app.css";
    :global(.dark) {
        :global(.shiki),
        :global(.shiki span) {
            color: var(--shiki-dark) !important;
            font-style: var(--shiki-dark-font-style) !important;
            font-weight: var(--shiki-dark-font-weight) !important;
            text-decoration: var(--shiki-dark-text-decoration) !important;
        }
    }

    /* Shiki see: https://shiki.matsu.io/guide/dual-themes#class-based-dark-mode */
    :global(html.dark .shiki),
    :global(html.dark .shiki span) {
        color: var(--shiki-dark) !important;
        font-style: var(--shiki-dark-font-style) !important;
        font-weight: var(--shiki-dark-font-weight) !important;
        text-decoration: var(--shiki-dark-text-decoration) !important;
    }

    :global(pre.shiki) {
        @apply overflow-x-auto rounded-lg bg-inherit py-4 text-sm;
    }

    :global(pre.shiki:not([data-code-overflow] *):not([data-code-overflow])) {
        @apply overflow-y-auto;
        max-height: min(100%, 650px);
    }

    :global(pre.shiki code) {
        @apply grid min-w-full rounded-none border-0 bg-transparent p-0 wrap-break-word;
        counter-reset: line;
        box-decoration-break: clone;
    }

    :global(pre.line-numbers) {
        counter-reset: step;
        counter-increment: step 0;
    }

    :global(pre.line-numbers .line::before) {
        content: counter(step);
        counter-increment: step;
        display: inline-block;
        width: 1.8rem;
        margin-right: 1.4rem;
        text-align: right;
    }

    :global(pre.line-numbers .line::before) {
        @apply text-muted-foreground;
    }

    :global(pre .line.line--highlighted) {
        @apply bg-secondary;
    }

    :global(pre .line.line--highlighted span) {
        @apply relative;
    }

    :global(pre .line) {
        @apply inline-block min-h-4 w-full px-4 py-0.5;
    }

    :global(pre.line-numbers .line) {
        @apply px-2;
    }
</style>
