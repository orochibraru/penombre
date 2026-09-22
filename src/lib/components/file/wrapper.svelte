<script lang="ts">
	import {
		ArrowUpDownIcon,
		BrushCleaningIcon,
		CheckIcon,
		ExternalLinkIcon,
		LayoutGridIcon,
		LayoutListIcon,
	} from "@lucide/svelte";
	import { onMount, untrack } from "svelte";
	import { MediaQuery } from "svelte/reactivity";
	import { toast } from "svelte-sonner";
	import { api, type ObjectItem, type ObjectList } from "#lib/api/index.js";
	import FileGrid from "#lib/components/file/grid.svelte";
	import FileList from "#lib/components/file/list.svelte";
	import PreviewDialog from "#lib/components/file/preview-dialog.svelte";
	import SelectionBar from "#lib/components/file/selection-bar.svelte";
	import FileTable from "#lib/components/file/table.svelte";
	import DeleteDialog from "#lib/components/layout/dialogs/delete-dialog.svelte";
	import MoveDialog from "#lib/components/layout/dialogs/move-dialog.svelte";
	import RestoreDialog from "#lib/components/layout/dialogs/restore-dialog.svelte";
	import ShareDialog from "#lib/components/layout/dialogs/share-dialog.svelte";
	import { Badge } from "#lib/components/ui/badge/index.js";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as ButtonGroup from "#lib/components/ui/button-group/index.js";
	import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { fetchWindow, LISTING_PAGE_SIZE } from "#lib/pagination.js";
	import * as m from "#lib/paraglide/messages.js";
	import {
		newFolderDialogOpen,
		pendingUploadFiles,
		uploadDialogOpen,
	} from "#lib/store/upload.js";
	import {
		cn,
		isFolderItem,
		isTrashListing,
		readableFileSize,
		type SortColumn,
		type SortDirection,
	} from "#lib/utils.js";
	import { browser } from "$app/env";
	import { invalidate } from "$app/navigation";
	import { navigating, page } from "$app/state";
	import type { ResolvedPathname } from "$app/types";

	import {
		notesView,
		pendingPreview,
		takePendingPreview,
	} from "./preview-handover";

	import {
		clickDownload,
		computeSelectionState,
		createMainActions,
		createMainMultipleActions,
		createTrashActions,
		createTrashMultipleActions,
		type FileToView,
		fetchListingPage,
		folderZipDownloadUrl,
		handleDownloadItem,
		handleOpenItemFullscreen,
		movesIntoItself,
		handleOpenItem as openItem,
		requestMove,
		resolveItemParent,
		selectAllForEmptyTrash,
		triggerRenameAction,
	} from "./wrapper.svelte.js";
	import {
		downloadSelected,
		executeDeleteOperation,
		executeEmptyTrash,
		executeRestoreOperation,
		selectedKeys,
		starSelected,
	} from "./wrapper-bulk.svelte.js";
	import { duplicateItem, isDuplicateShortcut } from "./wrapper-duplicate";
	import { isSearchShortcut, searchFiles } from "./wrapper-search";

	interface UserPreferences {
		layout?: "grid" | "list";
		sortColumn?: "name" | "size" | "updatedAt" | null;
		sortDirection?: "asc" | "desc";
		listingLoadMode?: "scroll" | "pages";
	}

	/**
	 * `nextCursor` is only present on a keyset-paginated response; its absence
	 * (recent) is what tells this component there is nothing to page.
	 * `totalSize` is the trash's, for pricing "Empty Trash" beyond what is
	 * loaded.
	 */
	interface Props {
		data: ObjectList & { nextCursor?: string | null; totalSize?: number };
		loading?: boolean;
		preferences?: UserPreferences;
	}

	let { data, loading = $bindable(false), preferences }: Props = $props();

	// Extract initial values from server preferences
	const initialSortColumn = $derived(preferences?.sortColumn ?? "name");
	const initialSortDirection = $derived(preferences?.sortDirection ?? "asc");
	// Layout is always driven by server preferences
	const layout = $derived(preferences?.layout ?? "list");
	const loadMode = $derived(preferences?.listingLoadMode ?? "scroll");

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
	let shareDialogOpen: boolean = $state(false);
	let shareItem: ObjectItem | null = $state(null);
	let restoringItem: boolean = $state(false);
	let deletingItem: boolean = $state(false);
	let movingItem: boolean = $state(false);
	let checkedItems: Record<string, string> = $state({});
	let isSingleItemAction: boolean = $state(false);
	/** True only while the "Empty Trash" button drives the delete dialog. */
	let emptyingTrash: boolean = $state(false);
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
	let moveMode: "move" | "copy" = $state("move");
	let draggedItem: ObjectItem | undefined = $state();
	let dropTargetKey: string | undefined = $state();

	// ================================
	// Pagination, see CLAUDE.md "Listings are keyset-paginated"
	// ================================

	const paginated = $derived(data.nextCursor !== undefined);

	let loadedItems: ObjectItem[] = $state(untrack(() => data.list ?? []));
	/** The cursor to fetch the *next* page with; null once there is no more. */
	let cursor: string | null = $state(untrack(() => data.nextCursor ?? null));
	let loadingMore: boolean = $state(false);
	/** Cursor used to fetch page N, so "Previous" can replay it. */
	let pageCursorHistory: Array<string | null> = $state([null]);
	let pageIndex: number = $state(0);

	const totalCount = $derived(data.total ?? loadedItems.length);
	const totalPages = $derived(
		Math.max(1, Math.ceil(totalCount / LISTING_PAGE_SIZE)),
	);

	/** What every layout renders: loaded-so-far items, never the raw prop. */
	const displayData: ObjectList = $derived({
		list: loadedItems,
		count: loadedItems.length,
		total: totalCount,
	});

	function fetchPage(fetchCursor: string | null, limit: number) {
		return fetchListingPage({
			cursor: fetchCursor,
			limit,
			sortColumn,
			sortDirection,
		});
	}

	async function loadMore() {
		if (!paginated || loadingMore || cursor === null) {
			return;
		}
		loadingMore = true;
		const listing = page.url.pathname;
		const nextPage = await fetchPage(cursor, LISTING_PAGE_SIZE);
		loadingMore = false;
		if (listing !== page.url.pathname) {
			return;
		}
		if (!nextPage) {
			toast.error(m.toast_load_more_error());
			return;
		}
		loadedItems = [...loadedItems, ...nextPage.list];
		cursor = nextPage.nextCursor;
	}

	async function goToNextPage() {
		if (!paginated || loadingMore || cursor === null) {
			return;
		}
		loadingMore = true;
		const usedCursor = cursor;
		const nextPage = await fetchPage(usedCursor, LISTING_PAGE_SIZE);
		loadingMore = false;
		if (!nextPage) {
			toast.error(m.toast_load_more_error());
			return;
		}
		pageCursorHistory = [
			...pageCursorHistory.slice(0, pageIndex + 1),
			usedCursor,
		];
		pageIndex += 1;
		loadedItems = nextPage.list;
		cursor = nextPage.nextCursor;
	}

	async function goToPrevPage() {
		if (!paginated || loadingMore || pageIndex === 0) {
			return;
		}
		loadingMore = true;
		const prevCursor = pageCursorHistory[pageIndex - 1] ?? null;
		const prevPage = await fetchPage(prevCursor, LISTING_PAGE_SIZE);
		loadingMore = false;
		if (!prevPage) {
			toast.error(m.toast_load_more_error());
			return;
		}
		pageIndex -= 1;
		loadedItems = prevPage.list;
		cursor = prevPage.nextCursor;
	}

	let sentinelEl: HTMLElement | undefined = $state();
	$effect(() => {
		if (!(paginated && loadMode === "scroll" && sentinelEl)) {
			return;
		}
		const el = sentinelEl;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					void loadMore();
				}
			},
			{ rootMargin: "800px" },
		);
		observer.observe(el);
		return () => observer.disconnect();
	});

	/**
	 * `data` changes on every navigation (another listing) and on every
	 * `invalidate("app:files")` (a mutation on this same one). The two need
	 * different responses: a navigation starts over at page one, but a
	 * refresh of the same listing must not throw away how far the user had
	 * scrolled; re-fetching a window as big as what was already loaded
	 * keeps the DOM size, and with it the scroll position, stable.
	 */
	let lastData: typeof data | undefined;
	let lastListing: string | undefined;
	$effect(() => {
		if (data === lastData) {
			return;
		}
		const nextData = data;
		const listing = page.url.pathname;
		untrack(() => {
			const sameContext = paginated && listing === lastListing;
			const priorCount = loadedItems.length;
			lastData = nextData;
			lastListing = listing;
			if (
				paginated &&
				sameContext &&
				priorCount > (nextData.list?.length ?? 0)
			) {
				void fetchWindow(fetchPage, priorCount).then((refreshed) => {
					if (refreshed && listing === page.url.pathname) {
						loadedItems = refreshed.list;
						cursor = refreshed.nextCursor;
					}
				});
				return;
			}
			loadedItems = nextData.list ?? [];
			cursor = nextData.nextCursor ?? null;
			pageCursorHistory = [null];
			pageIndex = 0;
		});
	});

	// Paginated sort changes must re-fetch from the server: the loaded window
	// is only sorted within itself, and re-sorting it client-side would be
	// wrong across a page boundary the server never applied the new order to.
	async function reloadPaginatedSort() {
		if (!paginated) {
			return;
		}
		const firstPage = await fetchPage(null, LISTING_PAGE_SIZE);
		if (!firstPage) {
			return;
		}
		loadedItems = firstPage.list;
		cursor = firstPage.nextCursor;
		pageCursorHistory = [null];
		pageIndex = 0;
	}

	$effect(() => {
		const pending = $pendingPreview;
		const view =
			pending &&
			untrack(() => takePendingPreview(pending, displayData.list ?? []));
		if (view) {
			fileToView = view;
			viewFileOpen = true;
		}
	});

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
	const selectedItemCount = $derived(
		Object.values(checkedItems).filter(Boolean).length,
	);

	let multiObjectActionsOpen = $derived(
		(indeterminate || allSelected) && !isSingleItemAction,
	);

	let isTrash = $derived(isTrashListing(page.url.pathname));

	// The folder being browsed, as the API addresses it. `page.params.path` is
	// that chain of folder ids in both listings — `/browse/[...path]` and a
	// shared drive's `/drives/[drive]/[...path]` — so neither pathname has to
	// be parsed.
	let currentFolder = $derived(page.params.path ?? "");

	// ================================
	// Callbacks for extracted functions
	// ================================
	const sharedCallbacks = {
		setActionsContextOpen: (v: boolean) => (actionsContextOpen = v),
		clearCheckedItems: () => (checkedItems = {}),
		setActionableItem: (v: ObjectItem | undefined) => (actionableItem = v),
	};

	const restoreCallbacks = {
		...sharedCallbacks,
		setBusy: (v: boolean) => (restoringItem = v),
		closeDialog: () => (confirmRestoreOpen = false),
	};

	const deleteCallbacks = {
		...sharedCallbacks,
		setBusy: (v: boolean) => (deletingItem = v),
		closeDialog: () => {
			confirmDeleteOpen = false;
			emptyingTrash = false;
		},
	};

	// ================================
	// Search
	// ================================
	let searchInputRef: HTMLInputElement | null = $state(null);

	async function performSearch() {
		searchResults = await searchFiles(searchValue);
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

	function handleKeydown(e: KeyboardEvent) {
		if (isSearchShortcut(e)) {
			e.preventDefault();
			searchInputRef?.focus();
			return;
		}
		if (isDuplicateShortcut(e) && !isTrash) {
			const keys = selectedKeys(checkedItems);
			const item =
				keys.length === 1
					? (displayData.list ?? []).find(
							(candidate) => candidate.key === keys[0],
						)
					: undefined;
			if (item) {
				e.preventDefault();
				duplicateItem(item, currentFolder);
			}
		}
	}

	// ================================
	// Item Actions
	// ================================
	function handleRestoreObject() {
		executeRestoreOperation(checkedItems, restoreCallbacks);
	}

	function handleDeleteObject() {
		if (emptyingTrash) {
			executeEmptyTrash(deleteCallbacks);
			return;
		}
		executeDeleteOperation(checkedItems, isTrash, deleteCallbacks);
	}

	// Single item action helpers
	function prepareForSingleItemAction(item: ObjectItem) {
		isSingleItemAction = true;
		emptyingTrash = false;
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
		onDownload: (item) => {
			actionsContextOpen = false;
			const isFolder = isFolderItem(item);
			const itemName = item.metadata.name ?? item.key;

			if (isFolder) {
				// Folder: a plain link, so the browser streams the zip straight
				// to disk instead of a fetch buffering it whole in JS memory.
				const folderId = item.key.endsWith("/")
					? item.key.slice(0, -1)
					: item.key;
				clickDownload(
					folderZipDownloadUrl(folderId, currentFolder),
					`${itemName}.zip`,
				);
				toast.info(m.toast_downloaded({ name: itemName }));
			} else {
				// File: regular download
				handleDownloadItem(itemName, () => {
					// no progress reporting needed for a single-file download
				});
			}
		},
		onOpenFullscreen: handleOpenItemFullscreen,
		onRename: (item) =>
			triggerRenameAction(item, () => (actionsContextOpen = false)),
		onMove: (item) => {
			moveItem = item;
			moveItems = {}; // Clear bulk mode
			moveMode = "move";
			moveDialogOpen = true;
			actionsContextOpen = false;
		},
		onCopyTo: (item) => {
			moveItem = item;
			moveItems = {};
			moveMode = "copy";
			moveDialogOpen = true;
			actionsContextOpen = false;
		},
		onDuplicate: (item) => {
			actionsContextOpen = false;
			duplicateItem(item, currentFolder);
		},
		onStar: async (item) => {
			actionsContextOpen = false;
			const isCurrentlyStarred = item.metadata.isStarred ?? false;
			const newStarred = !isCurrentlyStarred;
			const itemName = item.metadata.name ?? item.key;
			const isFolder = isFolderItem(item);

			try {
				if (isFolder) {
					// Folder: use folders endpoint
					const folderId = item.key.endsWith("/")
						? item.key.slice(0, -1)
						: item.key;
					const { error: starError } = await api.PUT(
						"/api/v1/storage/folder/{path}",
						{
							params: {
								path: { path: encodeURIComponent(folderId) },
							},
							body: {
								isStarred: newStarred,
								parentFolderId: currentFolder || undefined,
							},
						},
					);
					if (starError) {
						toast.error(m.toast_star_error());
						return;
					}
				} else {
					// File: use objects endpoint
					const { error: starError } = await api.PUT(
						"/api/v1/storage/file/{id}",
						{
							params: {
								path: { id: encodeURIComponent(item.key) },
								query: { folder: currentFolder },
							},
							body: { isStarred: newStarred },
						},
					);
					if (starError) {
						toast.error(m.toast_star_error());
						return;
					}
				}
				toast.success(
					newStarred
						? m.toast_added_to_starred({ name: itemName })
						: m.toast_removed_from_starred({ name: itemName }),
				);
				await invalidate("app:files");
			} catch {
				toast.error(m.toast_star_error());
			}
		},
		onShare: (item) => {
			shareItem = item;
			shareDialogOpen = true;
			actionsContextOpen = false;
		},
		onNotes: (item) => {
			fileToView = notesView(item);
			viewFileOpen = true;
			actionsContextOpen = false;
		},
		onMoveToTrash: (item) => {
			prepareForSingleItemAction(item);
			handleDeleteObject();
		},
	});

	let itemActions = $derived(isTrash ? trashActions : mainActions);

	// Multiple item actions
	const mainMultipleActions = $derived(
		createMainMultipleActions(
			{
				onStar: () => {
					actionsContextOpen = false;
					const keys = selectedKeys(checkedItems);

					void starSelected(
						(displayData.list ?? []).filter((item) => keys.includes(item.key)),
						currentFolder,
						() => (checkedItems = {}),
					);
				},
				onShare: () => {
					// Only offered for a single selection, so this is it.
					const key = selectedKeys(checkedItems)[0];
					const item = (displayData.list ?? []).find(
						(candidate) => candidate.key === key,
					);
					if (!item) {
						return;
					}
					shareItem = item;
					shareDialogOpen = true;
					actionsContextOpen = false;
				},
				onDownload: () => {
					const keys = selectedKeys(checkedItems);
					if (keys.length === 0) {
						return;
					}

					if (keys.length === 1 && keys[0]) {
						handleDownloadItem(keys[0], () => (actionsContextOpen = false));
					} else {
						actionsContextOpen = false;
						downloadSelected(keys, currentFolder);
					}
					checkedItems = {};
				},
				onMove: () => {
					// Copy checked items to moveItems for bulk move
					moveItems = { ...checkedItems };
					moveItem = undefined; // Clear single item mode
					moveMode = "move";
					moveDialogOpen = true;
					actionsContextOpen = false;
				},
				onCopy: () => {
					moveItems = { ...checkedItems };
					moveItem = undefined;
					moveMode = "copy";
					moveDialogOpen = true;
					actionsContextOpen = false;
				},
				onMoveToTrash: handleDeleteObject,
			},
			selectedItemCount,
		),
	);

	const trashMultipleActions = createTrashMultipleActions({
		onRestore: () => {
			isSingleItemAction = false;
			confirmRestoreOpen = true;
			actionsContextOpen = false;
		},
		onDeletePermanently: () => {
			isSingleItemAction = false;
			emptyingTrash = false;
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
	function handleOpenItemWrapper(item: ObjectItem) {
		const display = item.metadata.name || item.key;
		return toast.promise(
			openItem(item, isDesktop, {
				setFileToView: (f) => (fileToView = f),
				openViewDialog: () => (viewFileOpen = true),
			}),
			{
				loading: m.toast_opening({ name: display }),
				error: m.toast_open_error({ name: display }),
			},
		);
	}

	// Track previous sort values to detect changes
	let prevSortColumn: SortColumn = $derived(initialSortColumn);
	let prevSortDirection: SortDirection = $derived(initialSortDirection);

	// Save sort preferences to server when they change
	$effect(() => {
		if (!browser) {
			return;
		}

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
					await api.PUT("/api/v1/preferences", {
						body: {
							sortColumn: currentSortColumn,
							sortDirection: currentSortDirection,
						},
					});
				} catch {
					// preferences are a convenience; failing to persist them is not worth surfacing
				}
			};
			void savePreferences();
			void reloadPaginatedSort();
		}
	});

	// ================================
	// Trash Operations
	// ================================
	function emptyTrash() {
		checkedItems = selectAllForEmptyTrash(displayData);
		confirmDeleteOpen = true;
		isSingleItemAction = false;
		emptyingTrash = true;
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
		if (!draggedItem) {
			return;
		}
		handleDragAndDropMove(draggedItem, targetFolder);
		handleDragEnd();
	}

	function handleDragAndDropMove(item: ObjectItem, destinationFolder: string) {
		const itemKey = item.key.replace(/\/$/, "");
		const itemName = item.metadata.name ?? item.key;
		const fullItemKey = currentFolder ? `${currentFolder}/${itemKey}` : itemKey;

		if (
			item.type === "folder" &&
			movesIntoItself(fullItemKey, destinationFolder)
		) {
			toast.error(m.cannot_move_into_self());
			return;
		}

		if (destinationFolder === resolveItemParent(item, currentFolder)) {
			toast.info(m.toast_already_in_folder({ name: itemName }));
			return;
		}

		toast.promise(
			requestMove(item, fullItemKey, destinationFolder).then(
				async ({ error: moveError }) => {
					if (moveError) {
						throw new Error(String(moveError) || "Failed to move item");
					}
					await invalidate("app:files");
				},
			),
			{
				loading: m.toast_moving_item({ name: itemName }),
				success: m.toast_moved({ name: itemName }),
				error: (err) => {
					const message = err instanceof Error ? err.message : "Unknown error";
					return m.toast_move_error_detail({ name: itemName, message });
				},
			},
		);
	}

	// ================================
	// Selection Effect
	// ================================
	$effect(() => {
		const state = computeSelectionState(displayData, checkedItems);
		allSelected = state.allSelected;
		indeterminate = state.indeterminate;

		// Two or more checked is a bulk selection by definition. The flag is
		// otherwise only cleared by the handlers that set it, so a single-item
		// context action left it stuck and the bulk bar never reappeared.
		if (Object.values(checkedItems).filter(Boolean).length > 1) {
			isSingleItemAction = false;
		}
	});
</script>

<svelte:window onkeydown={handleKeydown}></svelte:window>

<!-- Filters -->

<Input
    bind:value={searchValue}
    type="search"
    placeholder={m.search_placeholder()}
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
		placeholder={m.search_placeholder()}
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
									? m.sort_name()
                                        : sortColumn === "size"
                                          ? m.sort_size()
                                          : m.sort_date()}
                                    {sortDirection === "asc" ? "↑" : "↓"}
							{:else}
								{m.sort()}
							{/if}
						</span>
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Label>{m.sort_by()}</DropdownMenu.Label>
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
					{m.sort_name_asc()}
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
					{m.sort_name_desc()}
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
					{m.sort_size_largest()}
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
					{m.sort_size_smallest()}
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
					{m.sort_date_newest()}
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
					{m.sort_date_oldest()}
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
		<Button
			variant="outline"
			title={m.layout()}
			onclick={async () => {
                    await api.PUT("/api/v1/preferences", {
                        body: { layout: layout === "grid" ? "list" : "grid" },
                    });
				await invalidate("app:preferences");
			}}
		>
			{#if layout === "grid"}
				<LayoutGridIcon class="h-4 w-4" />
			{:else}
				<LayoutListIcon class="h-4 w-4" />
			{/if}
                <span>
                    {layout === "grid" ? m.layout_grid() : m.layout_list()}
                </span>
		</Button>
		{#if isTrash}
			<Button
				type="button"
				variant="destructive"
				onclick={emptyTrash}
				disabled={displayData.count === 0}
                    title={displayData.count === 0
                        ? m.trash_is_empty()
                        : m.empty_trash()}
                >
                    <BrushCleaningIcon />
                    {m.empty_trash()}
                </Button>
		{/if}
	</ButtonGroup.Root>
</div>

<!-- Table -->
{#if layout === "list"}
	<div class="hidden md:block">
		<FileTable
			handleOpenItem={handleOpenItemWrapper}
			files={displayData}
			itemActions={itemActions}
			searchValue={searchValue}
			searchResults={searchResults}
			indeterminate={indeterminate}
			bind:sortColumn
			bind:sortDirection
			preSorted={paginated}
			onDrop={handleFileDrop}
			onUpload={handleUpload}
			onCreateFolder={handleCreateFolder}
			bind:checkedItems
			bind:loading
			bind:allSelected
			bind:actionableItem
			bind:actionsContextOpen
			draggedItem={draggedItem}
			bind:dropTargetKey
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onDropOnFolder={handleDropOnFolder}
		/>
	</div>
	<div class="md:hidden">
		<FileList
			handleOpenItem={handleOpenItemWrapper}
			files={displayData}
			itemActions={itemActions}
			searchValue={searchValue}
			searchResults={searchResults}
			indeterminate={indeterminate}
			sortColumn={sortColumn}
			sortDirection={sortDirection}
			preSorted={paginated}
			onDrop={handleFileDrop}
			onUpload={handleUpload}
			onCreateFolder={handleCreateFolder}
			bind:checkedItems
			bind:loading
			bind:allSelected
			bind:actionableItem
			bind:actionsContextOpen
			draggedItem={draggedItem}
			bind:dropTargetKey
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onDropOnFolder={handleDropOnFolder}
		/>
	</div>
{:else}
	<FileGrid
		handleOpenItem={handleOpenItemWrapper}
		files={displayData}
		itemActions={itemActions}
		searchValue={searchValue}
		searchResults={searchResults}
		indeterminate={indeterminate}
		sortColumn={sortColumn}
		sortDirection={sortDirection}
		preSorted={paginated}
		onDrop={handleFileDrop}
		onUpload={handleUpload}
		onCreateFolder={handleCreateFolder}
		bind:checkedItems
		bind:loading
		bind:allSelected
		bind:actionableItem
		bind:actionsContextOpen
		draggedItem={draggedItem}
		bind:dropTargetKey
		onDragStart={handleDragStart}
		onDragEnd={handleDragEnd}
		onDropOnFolder={handleDropOnFolder}
	/>
{/if}

{#if paginated}
	{#if loadMode === "scroll"}
		{#if cursor !== null}
			<div bind:this={sentinelEl} class="h-px" aria-hidden="true"></div>
		{/if}
		{#if loadingMore}
			<div class="flex justify-center py-4">
				<span class="text-muted-foreground text-sm">{m.loading_more()}</span>
			</div>
		{/if}
	{:else}
		<div class="flex items-center justify-center gap-3 py-4">
			<Button
				variant="outline"
				size="sm"
				disabled={pageIndex === 0 || loadingMore}
				onclick={goToPrevPage}
			>
				{m.previous_page()}
			</Button>
			<span class="text-muted-foreground text-sm tabular-nums">
				{m.page_of_total({ current: pageIndex + 1, total: totalPages })}
			</span>
			<Button
				variant="outline"
				size="sm"
				disabled={cursor === null || loadingMore}
				onclick={goToNextPage}
			>
				{m.next_page()}
			</Button>
		</div>
	{/if}
	{#if allSelected && loadedItems.length < totalCount}
		<p class="text-muted-foreground pb-2 text-center text-xs">
			{m.selection_loaded_only({
				loaded: loadedItems.length,
				total: totalCount,
			})}
		</p>
	{/if}
{/if}

<PreviewDialog
	bind:open={viewFileOpen}
	fileToView={fileToView}
	currentUserId={page.data.user?.id}
/>

<DeleteDialog
	bind:confirmDeleteOpen
	bind:deletingItem
	checkedItems={checkedItems}
	handleDeleteObject={handleDeleteObject}
	items={displayData.list}
	emptyingTrash={emptyingTrash}
	trashTotals={{ count: totalCount, size: data.totalSize ?? 0 }}
/>

<RestoreDialog
	bind:confirmRestoreOpen
	bind:restoringItem
	checkedItems={checkedItems}
	handleRestoreObject={handleRestoreObject}
/>

<SelectionBar
	open={multiObjectActionsOpen}
	count={selectedItemCount}
	actions={multipleItemsActions}
	onclear={() => checkedItems = {}}
/>

<ShareDialog bind:open={shareDialogOpen} bind:item={shareItem} />

<MoveDialog
    bind:open={moveDialogOpen}
    bind:item={moveItem}
    bind:items={moveItems}
    bind:mode={moveMode}
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
