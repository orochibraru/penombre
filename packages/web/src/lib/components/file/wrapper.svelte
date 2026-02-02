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
        pendingUploadFiles,
        uploadDialogOpen,
        newFolderDialogOpen,
    } from "$lib/store/upload";
    import {
        capitalizeFirstLetter,
        isFolderItem,
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
    import * as Drawer from "$lib/components/ui/drawer/index";
    import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";

    type UserPreferences = {
        layout?: "grid" | "list";
        sortColumn?: "name" | "size" | "updatedAt" | null;
        sortDirection?: "asc" | "desc";
    };

    type Props = {
        data: ObjectList;
        loading?: boolean;
        preferences?: UserPreferences;
    };

    let { data, loading = $bindable(false), preferences }: Props = $props();

    // Extract initial values from server preferences
    const initialSortColumn = $derived(preferences?.sortColumn ?? "name");
    const initialSortDirection = $derived(preferences?.sortDirection ?? "asc");
    // Layout is always driven by server preferences
    const layout = $derived(preferences?.layout ?? "list");

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
    // Initialize from server-provided preferences to avoid hydration flash
    let sortColumn: SortColumn = $derived(initialSortColumn);
    let sortDirection: SortDirection = $derived(initialSortDirection);
    let fileToView: FileToView = $state(null);
    let moveItem: ObjectItem | undefined = $state();
    let moveItems: Record<string, string> = $state({});
    let draggedItem: ObjectItem | undefined = $state();
    let dropTargetKey: string | undefined = $state();

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

    // Clear checked items after bulk move dialog closes
    $effect(() => {
        if (!moveDialogOpen && Object.keys(moveItems).length > 0) {
            checkedItems = {};
            moveItems = {};
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
        onDownload: async (item) => {
            actionsContextOpen = false;
            const isFolder = isFolderItem(item);
            const itemName = item.metadata.name ?? item.key;

            if (isFolder) {
                // Folder: download as zip via API
                const folderId = item.key.endsWith("/")
                    ? item.key.slice(0, -1)
                    : item.key;

                toast.promise(
                    (async () => {
                        const res = await api.storage.objects.download.folder[
                            ":folder"
                        ].$get({
                            param: {
                                folder: encodeURIComponent(folderId),
                            },
                            query: { folder: currentFolder || undefined },
                        });
                        if (!res.ok) {
                            throw new Error("Failed to download folder");
                        }
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${itemName}.zip`;
                        document.body.appendChild(a);
                        a.click();
                        URL.revokeObjectURL(url);
                        a.remove();
                    })(),
                    {
                        loading: `Creating zip of "${itemName}"...`,
                        success: `Downloaded "${itemName}"`,
                        error: `Failed to download "${itemName}"`,
                    },
                );
            } else {
                // File: regular download
                handleDownloadItem(itemName, () => {});
            }
        },
        onOpenInNewTab: handleOpenItemInNewTab,
        onRename: (item) =>
            triggerRenameAction(item, () => (actionsContextOpen = false)),
        onMove: (item) => {
            moveItem = item;
            moveItems = {}; // Clear bulk mode
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
            const isFolder = isFolderItem(item);

            try {
                let res: Response;
                if (isFolder) {
                    // Folder: use folders endpoint
                    const folderId = item.key.endsWith("/")
                        ? item.key.slice(0, -1)
                        : item.key;
                    res = await api.storage.folders.folder[":id"].$put({
                        param: { id: encodeURIComponent(folderId) },
                        json: {
                            isStarred: newStarred,
                            parentFolderId: currentFolder || undefined,
                        },
                    });
                } else {
                    // File: use objects endpoint
                    res = await api.storage.objects.item[":item"].$put({
                        param: { item: encodeURIComponent(item.key) },
                        query: { folder: currentFolder },
                        json: { isStarred: newStarred },
                    });
                }
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
        onDownload: async () => {
            const keys = Object.keys(checkedItems);
            if (keys.length === 0) return;

            if (keys.length === 1 && keys[0]) {
                // Single file: use regular download
                handleDownloadItem(keys[0], () => (actionsContextOpen = false));
            } else {
                // Multiple files: use bulk download API
                actionsContextOpen = false;
                const paths = keys.map((key) =>
                    currentFolder ? `${currentFolder}/${key}` : key,
                );

                toast.promise(
                    (async () => {
                        const res = await api.storage.objects.download.$post({
                            json: { paths },
                        });
                        if (!res.ok) {
                            throw new Error("Failed to create download");
                        }
                        // Trigger download from response
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `opendrive-download-${paths.length}-files.zip`;
                        document.body.appendChild(a);
                        a.click();
                        URL.revokeObjectURL(url);
                        a.remove();
                    })(),
                    {
                        loading: `Creating zip of ${keys.length} files...`,
                        success: `Downloaded ${keys.length} files`,
                        error: "Failed to download files",
                    },
                );
            }
            checkedItems = {};
        },
        onMove: () => {
            // Copy checked items to moveItems for bulk move
            moveItems = { ...checkedItems };
            moveItem = undefined; // Clear single item mode
            moveDialogOpen = true;
            actionsContextOpen = false;
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

    // Track previous sort values to detect changes
    let prevSortColumn: SortColumn = $derived(initialSortColumn);
    let prevSortDirection: SortDirection = $derived(initialSortDirection);

    // Save sort preferences to server when they change
    $effect(() => {
        if (!browser) return;

        const currentSortColumn = sortColumn;
        const currentSortDirection = sortDirection;

        const sortChanged =
            currentSortColumn !== prevSortColumn ||
            currentSortDirection !== prevSortDirection;

        if (sortChanged) {
            prevSortColumn = currentSortColumn;
            prevSortDirection = currentSortDirection;

            const savePreferences = async () => {
                try {
                    await api.preferences.$put({
                        json: {
                            sortColumn: currentSortColumn,
                            sortDirection: currentSortDirection,
                        },
                    });
                } catch (error) {
                    console.error("Failed to save preferences:", error);
                }
            };
            savePreferences();
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
    // Drag and Drop Operations
    // ================================
    function handleDragStart(item: ObjectItem) {
        draggedItem = item;
    }

    function handleDragEnd() {
        draggedItem = undefined;
        dropTargetKey = undefined;
    }

    function handleDropOnFolder(targetFolder: string) {
        if (!draggedItem) return;
        handleDragAndDropMove(draggedItem, targetFolder);
        handleDragEnd();
    }

    async function handleDragAndDropMove(
        item: ObjectItem,
        destinationFolder: string,
    ) {
        const isFolder = item.type === "folder";
        const itemKey = item.key.replace(/\/$/, "");
        const itemName = item.metadata.name ?? item.key;

        // Build full path
        const fullItemKey = currentFolder
            ? `${currentFolder}/${itemKey}`
            : itemKey;

        // Check if trying to move into itself (for folders)
        if (isFolder) {
            const folderPath = fullItemKey.replace(/\/$/, "");
            if (
                destinationFolder === folderPath ||
                destinationFolder.startsWith(`${folderPath}/`)
            ) {
                toast.error("Cannot move folder into itself");
                return;
            }
        }

        // Check if already in same location
        let itemParent: string;
        if (item.parentKey) {
            itemParent = item.parentKey;
        } else if (item.key.includes("/")) {
            itemParent = item.key.split("/").slice(0, -1).join("/");
        } else {
            itemParent = currentFolder;
        }

        if (destinationFolder === itemParent) {
            toast.info(`"${itemName}" is already in this folder`);
            return;
        }

        try {
            let promise: Promise<Response>;

            if (isFolder) {
                const folderId = fullItemKey.split("/").pop() || fullItemKey;
                const parentId = fullItemKey.includes("/")
                    ? fullItemKey.split("/").slice(0, -1).join("/")
                    : undefined;

                promise = api.storage.folders.folder[":id"].move.$post({
                    param: { id: folderId },
                    json: {
                        parentFolderId: parentId,
                        destination: destinationFolder,
                    },
                });
            } else {
                promise = api.storage.objects.item[":item"].move.$post({
                    param: { item: encodeURIComponent(fullItemKey) },
                    json: { destination: destinationFolder },
                });
            }

            toast.promise(
                promise.then(async (res) => {
                    if (!res.ok) {
                        const text = await res.text();
                        throw new Error(text || "Failed to move item");
                    }
                    await invalidate("app:files");
                }),
                {
                    loading: `Moving "${itemName}"...`,
                    success: `Moved "${itemName}"`,
                    error: (err) => {
                        const message =
                            err instanceof Error
                                ? err.message
                                : "Unknown error";
                        return `Failed to move "${itemName}": ${message}`;
                    },
                },
            );
        } catch (error) {
            console.error("Move failed:", error);
        }
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
                        type="button"
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
                            {#if layout === "grid"}
                                <LayoutGridIcon class="h-4 w-4" />
                            {:else}
                                <LayoutListIcon class="h-4 w-4" />
                            {/if}
                            <span>
                                {capitalizeFirstLetter(layout)}
                            </span>
                        </Button>
                    {/snippet}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                    <DropdownMenu.Label>Layout</DropdownMenu.Label>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                        onclick={async () => {
                            await getApiClient().preferences.$put({
                                json: { layout: "list" },
                            });
                            await invalidate("app:preferences");
                        }}
                    >
                        {#if layout === "list"}
                            <CheckIcon class="h-4 w-4" />
                        {:else}
                            <span class="w-4"></span>
                        {/if}
                        List
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        onclick={async () => {
                            await getApiClient().preferences.$put({
                                json: { layout: "grid" },
                            });
                            await invalidate("app:preferences");
                        }}
                    >
                        {#if layout === "grid"}
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
                    type="button"
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
{#if layout === "list"}
    <div class="hidden md:block">
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
            {draggedItem}
            bind:dropTargetKey
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDropOnFolder={handleDropOnFolder}
        />
    </div>
    <div class="md:hidden">
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
            {draggedItem}
            bind:dropTargetKey
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDropOnFolder={handleDropOnFolder}
        />
    </div>
{:else}
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
        {draggedItem}
        bind:dropTargetKey
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDropOnFolder={handleDropOnFolder}
    />
{/if}

<ResponsiveDialog
    bind:open={viewFileOpen}
    title={fileToView
        ? (fileToView.item.metadata.name ?? fileToView.item.key)
        : "File Preview"}
    size="lg"
>
    {#if fileToView}
        <div class="flex flex-col justify-between gap-5 lg:flex-row mb-5">
            <span>
                {readableFileSize(fileToView.item.size as number) ?? "-"}
            </span>
            {#if fileToView.language}
                <Badge variant="outline" class="text-xs">
                    {fileToView.language}
                </Badge>
            {/if}
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
            class="flex h-full w-full items-center justify-center overflow-y-auto flex-1"
        >
            {#if fileToView.type === "image"}
                <img
                    src={fileToView.src}
                    alt={fileToView.item.metadata.name ?? fileToView.item.key}
                    class="max-w-full rounded-md object-contain h-[50vh]"
                />
            {:else if fileToView.type === "video"}
                <VideoPlayer
                    src={fileToView.src}
                    title={fileToView.item.metadata.name ?? fileToView.item.key}
                />
            {:else if fileToView.type === "code" && fileToView.language && fileToView.content}
                <Code.Root
                    lang={fileToView.language}
                    class="w-full h-full"
                    code={fileToView.content}
                >
                    <Code.CopyButton />
                </Code.Root>
            {:else if fileToView.type === "pdf"}
                <embed
                    src={fileToView.src}
                    title={fileToView.item.metadata.name ?? fileToView.item.key}
                    class="w-full h-[50vh]"
                />
            {/if}
        </div>
    {/if}
</ResponsiveDialog>

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

<MoveDialog
    bind:open={moveDialogOpen}
    bind:item={moveItem}
    bind:items={moveItems}
/>

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
