<script lang="ts">
    import {
        ChevronRightIcon,
        FolderIcon,
        FolderOpenIcon,
        HomeIcon,
    } from "@lucide/svelte";
    import { toast } from "svelte-sonner";
    import { invalidate } from "$app/navigation";
    import { page } from "$app/state";
    import { getApiClient, type ObjectItem } from "$lib/api-client";
    import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";
    import { Button } from "$lib/components/ui/button";
    import { cn } from "$lib/utils";
    import Spinner from "$lib/components/ui/Spinner.svelte";

    type Props = {
        open: boolean;
        item: ObjectItem | undefined;
    };

    type FolderData = {
        id: string;
        name: string;
        path: string;
    };

    type FolderNode = {
        id: string;
        name: string;
        path: string;
        children: FolderNode[];
    };

    let { open = $bindable(false), item = $bindable() }: Props = $props();

    let loading: boolean = $state(false);
    let loadingFolders: boolean = $state(false);
    let selectedFolder: string = $state("");
    let selectedFolderName: string = $state("");
    let folders: FolderData[] = $state([]);
    let expandedFolders: Set<string> = $state(new Set());

    const api = getApiClient(fetch);

    // Load root folders when dialog opens
    $effect(() => {
        if (open) {
            loadFolders();
            // Default to root selection
            selectedFolder = "";
        }
    });

    async function loadFolders() {
        loadingFolders = true;
        try {
            const res = await api.storage.folders.tree.$get();
            if (res.ok) {
                folders = (await res.json()) as FolderData[];
            }
        } catch (e) {
            console.error("Failed to load folders:", e);
        } finally {
            loadingFolders = false;
        }
    }

    // Build folder tree from flat list
    function getFolderTree(folderList: FolderData[]): FolderNode[] {
        const tree: FolderNode[] = [];
        const map = new Map<string, FolderNode>();

        // Sort by path to ensure parents come before children
        const sorted = [...folderList].sort((a, b) =>
            a.path.localeCompare(b.path),
        );

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
                map.get(parentPath)!.children.push(node);
            } else {
                tree.push(node);
            }
        }

        return tree;
    }

    let folderTree = $derived(getFolderTree(folders));

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

    // Get current folder from URL path
    let currentFolder = $derived.by(() => {
        const path = page.url.pathname;
        if (path.startsWith("/browse/")) {
            return path.slice("/browse/".length);
        }
        return "";
    });

    // Check if item would be moved to its current location
    let isSameLocation = $derived.by(() => {
        if (!item) return false;
        // Use parentKey if available, otherwise use current folder from URL
        let itemParent: string;
        if (item.parentKey) {
            itemParent = item.parentKey;
        } else if (item.key.includes("/")) {
            // Key contains path, extract parent
            itemParent = item.key.split("/").slice(0, -1).join("/");
        } else {
            // File is listed in current folder context
            itemParent = currentFolder;
        }
        return selectedFolder === itemParent;
    });

    // Check if trying to move folder into itself
    let isMovingIntoSelf = $derived.by(() => {
        if (!item || item.type !== "folder") return false;
        const folderPath = item.key.replace(/\/$/, "");
        return (
            selectedFolder === folderPath ||
            selectedFolder.startsWith(`${folderPath}/`)
        );
    });

    let canMove = $derived(
        !isSameLocation && !isMovingIntoSelf && item !== undefined,
    );

    async function handleMove(e: SubmitEvent) {
        e.preventDefault();
        if (!item || !canMove) return;

        loading = true;

        const isFolder = item.type === "folder";
        const itemKey = item.key.replace(/\/$/, "");

        // Build full path: if item is in a subdirectory, prepend current folder
        const fullItemKey = currentFolder
            ? `${currentFolder}/${itemKey}`
            : itemKey;

        try {
            let promise: Promise<Response>;

            if (isFolder) {
                // Get folder ID and parent from the full path
                const folderId = fullItemKey.split("/").pop() || fullItemKey;
                const parentId = fullItemKey.includes("/")
                    ? fullItemKey.split("/").slice(0, -1).join("/")
                    : undefined;

                promise = api.storage.folders.folder[":id"].move.$post({
                    param: { id: folderId },
                    json: {
                        parentFolderId: parentId,
                        destination: selectedFolder,
                    },
                });
            } else {
                promise = api.storage.objects.item[":item"].move.$post({
                    param: { item: encodeURIComponent(fullItemKey) },
                    json: { destination: selectedFolder },
                });
            }

            const toastPromise = promise.then(async (res) => {
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || "Failed to move item");
                }
                open = false;
                await invalidate("app:files");
            });

            toast.promise(toastPromise, {
                loading: `Moving ${item.metadata.name || item.key}...`,
                success: `Moved to ${selectedFolderName || "My Drive"}`,
                error: "Failed to move item",
            });

            await toastPromise;
        } catch (error) {
            console.error("Move failed:", error);
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
                    <FolderOpenIcon class="h-5 w-5 text-indigo-500 shrink-0" />
                {:else}
                    <FolderIcon class="h-5 w-5 text-indigo-500 shrink-0" />
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
    title="Move {item?.metadata?.name ?? 'item'}"
    description="Select a destination folder"
    submitLabel="Move here"
    loadingLabel="Moving..."
    submitDisabled={!canMove}
    form={{ onsubmit: handleMove }}
>
    <div class="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
        <!-- Root folder option -->
        <button
            type="button"
            onclick={() => selectFolder("", "My Drive")}
            class={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-left w-full transition-colors",
                selectedFolder === ""
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
            )}
        >
            <span class="w-5"></span>
            <HomeIcon class="h-5 w-5" />
            <span class="text-sm font-medium">My Drive</span>
        </button>

        {#if loadingFolders}
            <div class="flex items-center justify-center py-8">
                <span class="text-muted-foreground text-sm">
                    Loading folders
                    <Spinner />
                </span>
            </div>
        {:else if folderTree.length === 0}
            <div class="flex items-center justify-center py-8">
                <span class="text-muted-foreground text-sm">
                    No folders available
                </span>
            </div>
        {:else}
            {#each folderTree as node}
                {@render folderItem(node, 0)}
            {/each}
        {/if}

        {#if isSameLocation}
            <p class="text-xs text-amber-600 mt-2">
                Item is already in this location
            </p>
        {/if}
        {#if isMovingIntoSelf}
            <p class="text-xs text-red-600 mt-2">
                Cannot move a folder into itself
            </p>
        {/if}
    </div>
</ResponsiveDialog>
