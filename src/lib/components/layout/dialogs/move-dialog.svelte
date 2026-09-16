<script lang="ts">
	import {
		ChevronRightIcon,
		FolderIcon,
		FolderOpenIcon,
		HomeIcon,
	} from "@lucide/svelte";
	import { untrack } from "svelte";
	import { toast } from "svelte-sonner";
	import { invalidate } from "$app/navigation";
	import { page } from "$app/state";
	import { api, type ObjectItem } from "$lib/api";
	import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";
	import * as Select from "$lib/components/ui/select/index.js";
	import Spinner from "$lib/components/ui/spinner.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { locationOf, type StorageLocation } from "$lib/storage-location";
	import { cn } from "$lib/utils";

	interface Props {
		open: boolean;
		/** Single item mode (backwards compatibility) */
		item?: ObjectItem | undefined;
		/** Bulk move mode: Record<key, displayName> */
		items?: Record<string, string>;
		/** Copy leaves the originals where they are. */
		mode?: "move" | "copy";
	}

	/** A place items can be sent: a drive, shared drive, volume or share. */
	interface Destination {
		key: string;
		label: string;
		location: StorageLocation;
		/** The folder that stands for "the top" of it. */
		root: string;
	}

	interface FolderData {
		id: string;
		name: string;
		path: string;
	}

	interface FolderNode {
		id: string;
		name: string;
		path: string;
		children: FolderNode[];
	}

	let {
		open = $bindable(false),
		item = $bindable(),
		items = $bindable({}),
		mode = $bindable("move"),
	}: Props = $props();

	const here = $derived(locationOf(page.params));
	const keyOf = (location: StorageLocation) =>
		location.drive
			? `drive:${location.drive}`
			: location.volume
				? `volume:${location.volume}`
				: location.share
					? `share:${location.share}`
					: "personal";

	// Only places the caller may write to.
	const destinations: Destination[] = $derived.by(() => {
		const list: Destination[] = [
			{ key: "personal", label: m.nav_my_drive(), location: {}, root: "" },
		];
		for (const drive of page.data.drives ?? []) {
			if (drive.role !== "viewer") {
				list.push({
					key: `drive:${drive.id}`,
					label: drive.name,
					location: { drive: drive.id },
					root: "",
				});
			}
		}
		for (const volume of page.data.volumes ?? []) {
			if (!volume.readOnly) {
				list.push({
					key: `volume:${volume.name}`,
					label: volume.label,
					location: { volume: volume.name },
					root: "",
				});
			}
		}
		// A share can only be sent into from inside it.
		const share = page.data.share;
		if (here.share && share && !share.readOnly) {
			list.push({
				key: `share:${here.share}`,
				label: share.name,
				location: { share: here.share },
				root: share.root,
			});
		}
		return list;
	});

	let destinationKey = $state("personal");
	const destination = $derived(
		destinations.find((d) => d.key === destinationKey) ?? destinations[0],
	);
	const sameLocation = $derived(destinationKey === keyOf(here));

	let loading: boolean = $state(false);
	let loadingFolders: boolean = $state(false);
	let selectedFolder: string = $state("");
	let selectedFolderName: string = $state("");
	let folders: FolderData[] = $state([]);
	let expandedFolders: Set<string> = $state(new Set());

	// Determine if we're in bulk mode
	let isBulkMode = $derived(Object.keys(items).length > 0 && !item);
	let itemCount = $derived(isBulkMode ? Object.keys(items).length : 1);

	// Opening starts where the items are, when that is somewhere writable.
	// Keyed on `open` and the chosen key only: layout data refreshing while
	// the dialog is up must not reset what was picked.
	$effect(() => {
		if (open) {
			untrack(() => {
				const start = keyOf(here);
				destinationKey = destinations.some((d) => d.key === start)
					? start
					: "personal";
			});
		}
	});

	$effect(() => {
		if (open && destinationKey) {
			untrack(() => {
				if (destination) {
					void loadFolders(destination.location);
					selectedFolder = destination.root;
					selectedFolderName = "";
				}
			});
		}
	});

	async function loadFolders(location: StorageLocation) {
		loadingFolders = true;
		folders = [];
		try {
			// Every key is sent, empty ones included: a present-but-empty
			// parameter is what stops the client adding this page's location.
			const { data } = await api.GET("/api/v1/storage/folder/tree", {
				params: {
					query: {
						drive: location.drive ?? "",
						volume: location.volume ?? "",
						share: location.share ?? "",
					},
				},
			});
			if (data?.data) {
				folders = data.data as FolderData[];
			}
		} catch {
			// leave `folders` empty; the dialog renders an empty tree
		} finally {
			loadingFolders = false;
		}
	}

	// Build folder tree from flat list
	function getFolderTree(folderList: FolderData[]): FolderNode[] {
		const tree: FolderNode[] = [];
		const map = new Map<string, FolderNode>();

		// Sort by path to ensure parents come before children
		const sorted = [...folderList].sort((a, b) => a.path.localeCompare(b.path));

		for (const folder of sorted) {
			const parts = folder.path.split("/");
			const parentPath = parts.slice(0, -1).join("/");

			const node: FolderNode = {
				id: folder.id,
				name: folder.name,
				path: folder.path,
				children: [],
			};

			map.set(folder.path, node);

			if (parentPath && map.has(parentPath)) {
				map.get(parentPath)?.children.push(node);
			} else {
				tree.push(node);
			}
		}

		return tree;
	}

	let currentFolder = $derived(page.params.path ?? "");

	// Get all folder paths being moved (for filtering)
	let movingFolderPaths = $derived.by(() => {
		const paths: string[] = [];
		if (isBulkMode) {
			// In bulk mode, check each key that ends with / (folder)
			for (const key of Object.keys(items)) {
				if (key.endsWith("/")) {
					const itemKey = key.replace(/\/$/, "");
					const fullPath = currentFolder
						? `${currentFolder}/${itemKey}`
						: itemKey;
					paths.push(fullPath);
				}
			}
		} else if (item && item.type === "folder") {
			const itemKey = item.key.replace(/\/$/, "");
			const fullPath = currentFolder ? `${currentFolder}/${itemKey}` : itemKey;
			paths.push(fullPath);
		}
		return paths;
	});

	// Filter out folders being moved and their children from the list
	let filteredFolders = $derived.by(() => {
		// A share's own folder is the root row already.
		const inTree = folders.filter((f) => f.path !== destination?.root);
		if (movingFolderPaths.length === 0 || !sameLocation) {
			return inTree;
		}
		return inTree.filter((f) => {
			// Exclude any folder that is being moved or is a child of one
			return !movingFolderPaths.some(
				(movingPath) =>
					f.path === movingPath || f.path.startsWith(`${movingPath}/`),
			);
		});
	});

	let folderTree = $derived(getFolderTree(filteredFolders));

	function toggleExpand(path: string) {
		const newSet = new Set(expandedFolders);
		if (newSet.has(path)) {
			newSet.delete(path);
		} else {
			newSet.add(path);
		}
		expandedFolders = newSet;
	}

	function selectFolder(path: string, name: string) {
		selectedFolder = path;
		selectedFolderName = name;
	}

	// A copy into the same folder is a duplicate, which is fine.
	let isSameLocation = $derived(
		mode === "move" && sameLocation && selectedFolder === currentFolder,
	);

	let isMovingIntoSelf = $derived(
		sameLocation &&
			movingFolderPaths.some(
				(folderPath) =>
					selectedFolder === folderPath ||
					selectedFolder.startsWith(`${folderPath}/`),
			),
	);

	let canMove = $derived(
		!(isSameLocation || isMovingIntoSelf) &&
			(item !== undefined || Object.keys(items).length > 0),
	);

	let dialogTitle = $derived.by(() => {
		const verb = mode === "copy" ? "Copy" : "Move";
		if (isBulkMode) {
			return `${verb} ${itemCount} items`;
		}
		return `${verb} ${item?.metadata?.name ?? "item"}`;
	});

	const destinationName = $derived(
		selectedFolderName || destination?.label || m.nav_my_drive(),
	);

	/** Anything that is not a move within one place goes through a transfer. */
	async function transfer() {
		const selected = isBulkMode
			? Object.keys(items).map((key) => ({
					key: key.replace(/\/$/, ""),
					type: key.endsWith("/") ? ("folder" as const) : ("file" as const),
				}))
			: item
				? [{ key: item.key.replace(/\/$/, ""), type: item.type }]
				: [];
		const body = {
			items: selected.map(({ key, type }) => ({
				path: currentFolder ? `${currentFolder}/${key}` : key,
				type: type === "folder" ? ("folder" as const) : ("file" as const),
			})),
			destination: { ...destination?.location, folder: selectedFolder },
			mode,
		};

		const promise = api
			.POST("/api/v1/storage/transfer", { body })
			.then(async ({ data, error: transferError }) => {
				if (transferError || !data?.data) {
					throw new Error("Transfer failed");
				}
				open = false;
				await invalidate("app:files");
				if (data.data.failCount > 0) {
					throw new Error("Some items failed");
				}
				return data.data;
			});

		const count = String(body.items.length);
		toast.promise(promise, {
			loading:
				mode === "copy"
					? m.toast_copying_items({ count })
					: m.toast_moving_items({ count }),
			success: (result) =>
				(mode === "copy" ? m.toast_items_copied : m.toast_items_moved)({
					successCount: String(result.successCount),
					total: count,
					destination: destinationName,
				}),
			error:
				mode === "copy"
					? m.toast_copy_items_error()
					: m.toast_move_items_error(),
		});

		await promise;
	}

	/** Move every checked item in one request */
	async function moveCheckedItems() {
		const itemsToMove = Object.keys(items).map((key) => {
			const isFolder = key.endsWith("/");
			const itemKey = isFolder ? key.replace(/\/$/, "") : key;
			return {
				path: currentFolder ? `${currentFolder}/${itemKey}` : itemKey,
				type: isFolder ? ("folder" as const) : ("file" as const),
			};
		});

		const promise = api
			.POST("/api/v1/storage/move", {
				body: { items: itemsToMove, destination: selectedFolder },
			})
			.then(async ({ data, error: moveError }) => {
				if (moveError || !data?.data) {
					throw new Error("Failed to move items");
				}
				const result = data.data;
				open = false;
				await invalidate("app:files");
				return result;
			});

		toast.promise(promise, {
			loading: m.toast_moving_items({ count: String(itemCount) }),
			success: (result) =>
				m.toast_items_moved({
					successCount: String(result.successCount),
					total: String(itemCount),
					destination: destinationName,
				}),
			error: m.toast_move_items_error(),
		});

		await promise;
	}

	/** Folders and files move through different endpoints */
	async function moveOneItem(target: ObjectItem) {
		const itemKey = target.key.replace(/\/$/, "");
		const fullItemKey = currentFolder ? `${currentFolder}/${itemKey}` : itemKey;

		if (target.type === "folder") {
			const folderId = fullItemKey.split("/").pop() || fullItemKey;
			const parentId = fullItemKey.includes("/")
				? fullItemKey.split("/").slice(0, -1).join("/")
				: undefined;

			const { error: moveError } = await api.POST(
				"/api/v1/storage/folder/{path}/move",
				{
					params: { path: { path: folderId } },
					body: { parentFolderId: parentId, destination: selectedFolder },
				},
			);
			if (moveError) {
				throw new Error(String(moveError) || "Failed to move item");
			}
		} else {
			const { error: moveError } = await api.POST(
				"/api/v1/storage/file/{id}/move",
				{
					params: { path: { id: encodeURIComponent(fullItemKey) } },
					body: { destination: selectedFolder },
				},
			);
			if (moveError) {
				throw new Error(String(moveError) || "Failed to move item");
			}
		}

		open = false;
		await invalidate("app:files");
	}

	async function moveSingleItem(target: ObjectItem) {
		const toastPromise = moveOneItem(target);

		toast.promise(toastPromise, {
			loading: m.toast_moving_item({
				name: target.metadata.name || target.key,
			}),
			success: m.toast_moved_to({
				destination: destinationName,
			}),
			error: m.toast_move_item_error(),
		});

		await toastPromise;
	}

	async function handleMove(e: SubmitEvent) {
		e.preventDefault();
		if (!canMove) {
			return;
		}

		loading = true;

		try {
			if (mode === "copy" || !sameLocation) {
				await transfer();
			} else if (isBulkMode) {
				await moveCheckedItems();
			} else if (item) {
				await moveSingleItem(item);
			}
		} catch {
			// toast.promise already surfaced the failure to the user
		} finally {
			loading = false;
		}
	}
</script>

{#snippet folderItem(node: FolderNode, depth: number = 0)}
    {@const isExpanded = expandedFolders.has(node.path)}
    {@const isSelected = selectedFolder === node.path}
    {@const hasChildren = node.children.length > 0}

    <div class="flex flex-col">
        <div
            class={cn(
                "flex items-center gap-1 px-3 py-2 rounded-lg text-left w-full transition-colors",
                isSelected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
            )}
            style="padding-left: {depth * 16 + 12}px"
        >
            {#if hasChildren}
                <button
                    type="button"
                    onclick={(e) => {
                        e.stopPropagation();
                        toggleExpand(node.path);
                    }}
                    class="p-0.5 hover:bg-background/50 rounded"
                >
                    <ChevronRightIcon
                        class={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-90",
                        )}
                    />
                </button>
            {:else}
                <span class="w-5"></span>
            {/if}
            <button
                type="button"
                onclick={() => selectFolder(node.path, node.name)}
                class="flex items-center gap-2 flex-1 min-w-0"
            >
                {#if isExpanded}
                    <FolderOpenIcon class="text-primary h-5 w-5 shrink-0" />
                {:else}
                    <FolderIcon class="text-primary h-5 w-5 shrink-0" />
                {/if}
                <span class="truncate text-sm">{node.name}</span>
            </button>
        </div>

        {#if hasChildren && isExpanded}
            <div class="flex flex-col">
                {#each node.children as child}
                    {@render folderItem(child, depth + 1)}
                {/each}
            </div>
        {/if}
    </div>
{/snippet}

<ResponsiveDialog
    bind:open
    bind:loading
    title={dialogTitle}
    description={m.select_destination()}
    submitLabel={mode === "copy" ? m.copy_here() : m.move_here()}
    loadingLabel={mode === "copy" ? m.copying() : m.moving()}
    submitDisabled={!canMove}
    form={{ onsubmit: handleMove }}
>
    {#if destinations.length > 1}
        <Select.Root type="single" bind:value={destinationKey}>
            <Select.Trigger
                class="w-full"
                aria-label={m.transfer_destination()}
            >
                {destination?.label}
            </Select.Trigger>
            <Select.Content>
                {#each destinations as option (option.key)}
                    <Select.Item value={option.key}>{option.label}</Select.Item>
                {/each}
            </Select.Content>
        </Select.Root>
    {/if}
    <div class="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
        <button
            type="button"
            onclick={() => selectFolder(destination?.root ?? "", "")}
            class={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-left w-full transition-colors",
                selectedFolder === (destination?.root ?? "")
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
            )}
        >
            <span class="w-5"></span>
            <HomeIcon class="h-5 w-5" />
            <span class="text-sm font-medium">{destination?.label}</span>
        </button>

        {#if loadingFolders}
            <div class="flex items-center justify-center py-8">
                <span class="text-muted-foreground text-sm">
                    {m.loading_folders()}
                    <Spinner />
                </span>
            </div>
        {:else if folderTree.length === 0}
            <div class="flex items-center justify-center py-8">
                <span class="text-muted-foreground text-sm">
                    {m.no_folders_available()}
                </span>
            </div>
        {:else}
            {#each folderTree as node}
                {@render folderItem(node, 0)}
            {/each}
        {/if}

        {#if isSameLocation}
            <p class="text-xs text-amber-600 mt-2">
                {isBulkMode
                    ? m.items_already_in_location()
                    : m.item_already_in_location()}
            </p>
        {/if}
        {#if isMovingIntoSelf}
            <p class="text-xs text-red-600 mt-2">
                {m.cannot_move_into_self()}
            </p>
        {/if}
    </div>
</ResponsiveDialog>
