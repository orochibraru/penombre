<script lang="ts">
    import {
        CopyIcon,
        DownloadIcon,
        ExternalLinkIcon,
        FolderInputIcon,
        PencilLineIcon,
        ShareIcon,
        StarIcon,
        TrashIcon,
    } from "@lucide/svelte";
    import { onMount } from "svelte";
    import { MediaQuery } from "svelte/reactivity";
    import { toast } from "svelte-sonner";
    import { browser, dev } from "$app/environment";
    import { invalidateAll } from "$app/navigation";
    import { page } from "$app/state";
    import { getApiClient, type ObjectItem, type ObjectList } from "$lib/api";
    import FileGrid from "$lib/components/file/grid.svelte";
    import FileList from "$lib/components/file/list.svelte";
    import FileTable from "$lib/components/file/table.svelte";
    import { Badge } from "$lib/components/ui/badge/index";
    import { Button } from "$lib/components/ui/button/index";
    import * as Code from "$lib/components/ui/code/index";
    import type { SupportedLanguage } from "$lib/components/ui/code/shiki";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Input } from "$lib/components/ui/input";
    import * as Select from "$lib/components/ui/select/index.js";
    import { determineCodeFileLanguage, isCodeItem } from "$lib/file-utils";
    import { itemAction } from "$lib/store/actions";
    import {
        type AvailableLayouts,
        availableLayouts,
        layoutStore,
    } from "$lib/store/layout";
    import { playableMusic } from "$lib/store/music";
    import { getObjectUrl } from "$lib/url";
    import {
        capitalizeFirstLetter,
        humanFileSize,
        type ItemAction,
        type MultipleItemsAction,
    } from "$lib/utils";
    import DeleteDialog from "$lib/components/layout/dialogs/delete.svelte";
    import RestoreDialog from "$lib/components/layout/dialogs/restore.svelte";
    import VideoPlayer from "$lib/components/layout/video-player.svelte";

    type Props = {
        data: ObjectList;
        loading?: boolean;
    };

    let { data, loading = $bindable(false) }: Props = $props();

    let allSelected: boolean = $state(false);
    let indeterminate: boolean = $state(false);
    let confirmDeleteOpen: boolean = $state(false);
    let confirmRestoreOpen: boolean = $state(false);
    let restoringItem: boolean = $state(false);
    let deletingItem: boolean = $state(false);
    let checkedItems: Record<string, boolean> = $state({});
    let isSingleItemAction: boolean = $state(false);
    let searchValue: string = $state("");
    let searchResults: ObjectItem[] = $state([]);
    let searchTimeout: ReturnType<typeof setTimeout> | undefined = $state();
    let actionsContextOpen: boolean = $state(false);
    let actionableItem: ObjectItem | undefined = $state();
    let viewFileOpen: boolean = $state(false);
    let fileToView: {
        item: ObjectItem;
        src: string;
        type: "image" | "code" | "pdf" | "video";
        content?: string;
        language?: SupportedLanguage;
    } | null = $state(null);

    let multiObjectActionsOpen = $derived(
        (indeterminate || allSelected) && !isSingleItemAction,
    );

    async function updateSearchResults() {
        if (!data.list || data.list.length === 0) {
            searchResults = [];
            loading = false;
            return;
        }

        searchResults = data.list.filter((item) =>
            item.key.toLowerCase().includes(searchValue.toLowerCase()),
        );

        loading = false;
        return;
    }

    const debounce = () => {
        if (searchValue === "") {
            searchResults = [];
            loading = false;
            return;
        }
        loading = true;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            await updateSearchResults();
        }, 750);
    };

    async function handleRestoreObject() {
        if (Object.keys(checkedItems).length === 0) {
            return;
        }

        const promises = [];

        actionsContextOpen = false;

        for (const checkedItem of Object.keys(checkedItems)) {
            restoringItem = true;
            const itemPath = page.params.path
                ? `${page.params.path}/${checkedItem}`
                : checkedItem;

            const promise = getApiClient()
                .PUT("/api/storage/objects/item/{item}", {
                    params: {
                        path: {
                            item: itemPath,
                        },
                        query: {
                            folder: itemPath.includes("/")
                                ? itemPath.split("/").slice(0, -1).join("/")
                                : undefined,
                        },
                    },
                    body: {
                        isTrashed: false,
                    },
                })
                .then(async ({ error }) => {
                    if (error) {
                        console.error(error);
                        restoringItem = false;
                        throw error;
                    }

                    confirmRestoreOpen = false;
                    restoringItem = false;
                });

            promises.push(promise);
        }

        toast.promise(
            Promise.all(promises).finally(async () => {
                checkedItems = {};
                actionsContextOpen = false;
                actionableItem = undefined;
                await invalidateAll();
            }),
            {
                loading: "Restoring items",
                success: "Items restored",
                error: "Failed to restore items",
            },
        );
    }

    async function handleDeleteObject() {
        if (Object.keys(checkedItems).length === 0) {
            return;
        }

        const promises = [];

        actionsContextOpen = false;

        for (const checkedItem of Object.keys(checkedItems)) {
            deletingItem = true;
            const itemPath = page.params.path
                ? `${page.params.path}/${checkedItem}`
                : checkedItem;
            if (itemPath.endsWith("/")) {
                const promise = getApiClient()
                    .DELETE("/api/storage/folders/folder/{folder}", {
                        params: {
                            query: {
                                parent: itemPath.slice(0, -1).includes("/")
                                    ? itemPath
                                          .slice(0, -1)
                                          .split("/")
                                          .slice(0, -1)
                                          .join("/")
                                    : undefined,
                            },
                            path: {
                                folder: itemPath.slice(0, -1),
                            },
                        },
                    })
                    .then(async ({ error }) => {
                        if (error) {
                            console.error(error);
                            deletingItem = false;
                            throw error;
                        }

                        confirmDeleteOpen = false;
                        deletingItem = false;
                    });

                promises.push(promise);
                continue;
            }
            if (isTrash) {
                const promise = getApiClient()
                    .DELETE("/api/storage/objects/item/{item}", {
                        params: {
                            path: {
                                item: itemPath,
                            },
                            query: {
                                folder: page.params.path,
                            },
                        },
                    })
                    .then(async ({ error }) => {
                        if (error) {
                            console.error(error);
                            deletingItem = false;
                            throw error;
                        }
                        confirmDeleteOpen = false;
                        deletingItem = false;
                    });
                promises.push(promise);
                continue;
            }

            const promise = getApiClient()
                .PUT("/api/storage/objects/item/{item}", {
                    params: {
                        query: {
                            folder: itemPath.includes("/")
                                ? itemPath.split("/").slice(0, -1).join("/")
                                : undefined,
                        },
                        path: {
                            item: itemPath,
                        },
                    },
                    body: {
                        isTrashed: true,
                    },
                })
                .then(async ({ error }) => {
                    if (error) {
                        console.error(error);
                        deletingItem = false;
                        throw error;
                    }

                    confirmDeleteOpen = false;
                    deletingItem = false;
                });

            promises.push(promise);
        }

        toast.promise(
            Promise.all(promises).finally(async () => {
                checkedItems = {};
                actionsContextOpen = false;
                actionableItem = undefined;
                await invalidateAll();
            }),
            {
                loading: "Deleting items",
                success: "Items deleted",
                error: "Failed to delete items",
            },
        );
    }

    function openItemInNewTab(item: ObjectItem) {
        const finalUrl = getObjectUrl(item.key, true);

        window.open(finalUrl);
    }

    async function downloadItem(itemPath: string) {
        const finalUrl = getObjectUrl(itemPath, true);

        const a = document.createElement("a");
        a.style.display = "none";
        a.href = finalUrl;
        // the filename you want
        a.download = itemPath;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(finalUrl);
        actionsContextOpen = false;
        toast.info(`Downloaded ${itemPath}`);
    }

    const isTrash = $derived(page.url.pathname.startsWith("/trash"));

    const itemActions: ItemAction[] = $derived.by(() => {
        const actions: ItemAction[] = [
            {
                title: "Download",
                icon: DownloadIcon,
                action: (item) => downloadItem(item.key),
                disabled: isTrash,
                fileOnly: true,
            },
            {
                title: "Rename",
                icon: PencilLineIcon,
                action: (item) => {
                    $itemAction = {
                        open: true,
                        item,
                    };
                },
                disabled: isTrash,
            },
            {
                title: "Move",
                icon: FolderInputIcon,
                action: () => [],
                disabled: isTrash,
            },
            {
                title: "Open in new tab",
                icon: ExternalLinkIcon,
                action: (item) => openItemInNewTab(item),
                disabled: isTrash,
                fileOnly: true,
            },
            {
                title: "Duplicate",
                icon: CopyIcon,
                action: () => [],
                disabled: true,
            },
            {
                title: "Star",
                icon: StarIcon,
                action: () => [],
                disabled: true,
            },
            {
                title: "Share",
                icon: ShareIcon,
                action: () => [],
                disabled: true,
            },
        ];

        if (isTrash) {
            actions.splice(0, 0, {
                title: "Restore",
                icon: ShareIcon,
                action: (item: ObjectItem) => {
                    isSingleItemAction = true;
                    checkedItems = {};
                    checkedItems[item.key] = true;
                    confirmRestoreOpen = true;
                },
                disabled: false,
            });

            actions.splice(1, 0, {
                title: "Delete permanently",
                icon: TrashIcon,
                action: async (item: ObjectItem) => {
                    isSingleItemAction = true;
                    checkedItems = {};
                    checkedItems[item.key] = true;
                    confirmDeleteOpen = true;
                },
            });
        } else {
            actions.push({
                title: "Trash",
                icon: TrashIcon,
                action: async (item: ObjectItem) => {
                    isSingleItemAction = true;
                    checkedItems = {};
                    checkedItems[item.key] = true;
                    confirmDeleteOpen = true;
                },
            });
        }

        return actions;
    });

    const multipleItemsActions: MultipleItemsAction[] = [
        {
            title: "Download",
            icon: DownloadIcon,
            variant: "outline",
            action: () => {
                if (Object.keys(checkedItems).length === 0) {
                    return;
                }

                for (const checkedItem of Object.keys(checkedItems)) {
                    downloadItem(checkedItem);
                    checkedItems[checkedItem] = false;
                }
            },
        },
        {
            title: "Move",
            icon: FolderInputIcon,
            variant: "outline",
            action: () => [],
        },
        {
            title: "Star",
            icon: StarIcon,
            variant: "outline",
            action: () => [],
        },
        {
            title: "Share",
            icon: ShareIcon,
            variant: "outline",
            action: () => [],
        },
        {
            title: "Delete",
            icon: TrashIcon,
            variant: "destructive",
            action: async () => {
                isSingleItemAction = false;
                confirmDeleteOpen = true;
            },
        },
    ];

    async function handleOpenItemWrapper(item: ObjectItem) {
        return toast.promise(handleOpenItem(item), {
            loading: `Opening "${item.key}"`,
            error: `Failed to open "${item.key}"`,
        });
    }

    async function handleOpenItem(item: ObjectItem): Promise<void> {
        $playableMusic = null;

        const finalUrl = getObjectUrl(item.key, true);

        if (item.metadata.category === "CODE") {
            const codeReq = await fetch(finalUrl);
            if (!codeReq.ok) {
                toast.error("Failed to open code file.", {
                    description: codeReq.statusText,
                });
                return;
            }
            const code = await codeReq.text();
            fileToView = {
                item,
                src: finalUrl,
                content: code,
                type: "code",
                language: determineCodeFileLanguage(item),
            };
            viewFileOpen = true;
            return;
        }

        if (item.metadata.category === "IMAGES") {
            fileToView = {
                item,
                src: finalUrl,
                type: "image",
            };
            viewFileOpen = true;
            return;
        }

        if (item.metadata.category === "MUSIC") {
            $playableMusic = {
                title: item.key,
                source: finalUrl,
                isPlaying: !dev,
            };
            return;
        }
        if (item.metadata.category === "DOCUMENTS") {
            if (isDesktop.current) {
                fileToView = {
                    item,
                    src: finalUrl,
                    type: "pdf",
                };
                viewFileOpen = true;
                return;
            }
        }

        if (item.metadata.category === "VIDEO") {
            fileToView = {
                item,
                src: finalUrl,
                type: "video",
            };
            viewFileOpen = true;
            return;
        }

        const newTab = window.open(finalUrl, "_blank");
        if (newTab) {
            newTab.focus();
        }
    }

    const isDesktop = new MediaQuery("(min-width: 768px)");

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
        }
    });

    $effect(() => {
        allSelected =
            (data.count ?? 0) > 0 &&
            (data.list ?? []).every((item) => checkedItems[item.key]);
        indeterminate =
            (data.count ?? 0) > 0 &&
            (data.list ?? []).some((item) => checkedItems[item.key] === true) &&
            !allSelected;

        if (data.count === 0) {
            checkedItems = {};
        }
    });
</script>

<!-- Filters -->

{#if multiObjectActionsOpen}
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
    <div class="flex w-full items-center gap-2 pb-5">
        <Input
            bind:value={searchValue}
            type="search"
            placeholder="Search"
            onkeyup={() => {
                debounce();
            }}
        />
        {#if isDesktop.current}
            <Select.Root
                type="single"
                name="favoriteFruit"
                bind:value={$layoutStore}
                onValueChange={(val) => {
                    if (browser) {
                        if (
                            page.url.pathname.startsWith("/browse") &&
                            val === "list"
                        ) {
                            localStorage.removeItem("layout");
                        } else if (
                            !page.url.pathname.startsWith("/browse") &&
                            val === "grid"
                        ) {
                            localStorage.removeItem("layout");
                        } else {
                            localStorage.setItem("layout", val);
                        }
                    }
                }}
            >
                <Select.Trigger class="w-[180px]"
                    >Layout: {capitalizeFirstLetter(
                        $layoutStore,
                    )}</Select.Trigger
                >
                <Select.Content>
                    <Select.Item value={"list"} label={"List"}>List</Select.Item
                    >
                    <Select.Item value={"grid"} label={"Grid"}>Grid</Select.Item
                    >
                </Select.Content>
            </Select.Root>
        {/if}
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
        bind:checkedItems
        bind:loading
        bind:allSelected
        bind:actionableItem
        bind:actionsContextOpen
    />
{:else if isDesktop.current && $layoutStore === "grid"}
    <FileGrid
        handleOpenItem={handleOpenItemWrapper}
        files={data}
        {itemActions}
        {searchValue}
        {searchResults}
        {indeterminate}
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
                        {fileToView.item.key}
                    </Dialog.Title>
                    <Dialog.Description class="flex items-center gap-2">
                        <span>
                            {humanFileSize(fileToView.item.size as number) ??
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
                        alt={fileToView.item.key}
                        class="h-full max-w-full rounded-md object-contain"
                    />
                {:else if fileToView.type === "video"}
                    <VideoPlayer
                        src={fileToView.src}
                        title={fileToView.item.key}
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
                        title={fileToView.item.key}
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
