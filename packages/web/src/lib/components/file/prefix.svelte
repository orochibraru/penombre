<script lang="ts">
    import {
        CircleCheckIcon,
        CircleIcon,
        FileArchiveIcon,
        FileCodeIcon,
        FileIcon,
        FileImageIcon,
        FileMusicIcon,
        FileTextIcon,
        FileVideoCameraIcon,
        FileVideoIcon,
        FolderIcon,
        PauseIcon,
        StarIcon,
        XIcon,
    } from "@lucide/svelte";
    import { MediaQuery } from "svelte/reactivity";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import type { ObjectItem } from "$lib/api-client";
    import DocumentIcon from "$lib/components/file/document-icon.svelte";
    import FilePreview from "$lib/components/file/preview.svelte";
    import NowPlaying from "$lib/components/now-playing.svelte";
    import { Badge } from "$lib/components/ui/badge/index";
    import { touchAction } from "$lib/file-actions";
    import { route } from "$lib/ROUTES";
    import { playableMusic } from "$lib/store/music";
    import { uploadedItems, uploadingItems } from "$lib/store/upload";
    import {
        cn,
        ItemStatus,
        isFolderItem,
        prettyDate,
        secondsToMinutes,
        stripFolders,
        getFileIconType,
        getDocumentType,
    } from "$lib/utils";

    type Props = {
        item: ObjectItem;
        iconSize: string;
        handleOpenItem: (item: ObjectItem) => void;
        indeterminate: boolean;
        checkedItems: Record<string, string | false>;
        layout: "grid" | "list";
    };

    let {
        item: baseItem,
        iconSize,
        handleOpenItem,
        checkedItems = $bindable(),
        indeterminate,
        layout,
    }: Props = $props();

    const item = $derived($uploadedItems[baseItem.key] || baseItem);

    let isFolder = $derived(isFolderItem(item));

    let navigating: boolean = $state(false);
    let isSelected = $derived(checkedItems[item.key] || false);

    function getItemStatus(): ItemStatus {
        if ($uploadedItems[item.key]) {
            return ItemStatus.JUST_UPLOADED;
        }

        if ($uploadingItems[item.key]) {
            return ItemStatus.UPLOADING;
        }

        if (item.size === 0) {
            return ItemStatus.ERROR;
        }

        return ItemStatus.VALIDATED;
    }

    const isDesktop = new MediaQuery("(min-width: 768px)");

    function toggleCheck() {
        if (isSelected) {
            checkedItems[item.key] = false;
            return;
        }

        checkedItems[item.key] = item.metadata.name || item.key;
        return;
    }

    async function handleClick(e?: MouseEvent | CustomEvent<null>) {
        e?.preventDefault();
        if (indeterminate) {
            return toggleCheck();
        }

        if (isFolder) {
            if (navigating) return;
            navigating = true;
            const folder = item.key.replace("/", "");
            const basePath = page.params.path
                ? [page.params.path, encodeURIComponent(folder)]
                : [encodeURIComponent(folder)];

            await goto(
                route("/browse/[...path]", {
                    path: basePath,
                }),
                {
                    invalidateAll: true,
                },
            );
            navigating = false;
            return;
        }

        return handleOpenItem(item);
    }

    function handleLongPress() {
        navigator.vibrate?.(50);
        return toggleCheck();
    }
</script>

{#if isFolder}
    <button
        use:touchAction
        onclick={handleClick}
        ontap={handleClick}
        onlongpress={() => handleLongPress()}
        class="flex w-full items-center gap-2"
    >
        {#if !isDesktop.current && indeterminate}
            {#if isSelected}
                <CircleCheckIcon class="text-primary" />
            {:else}
                <CircleIcon class="text-muted-foreground" />
            {/if}
        {:else}
            <FolderIcon
                class={cn(iconSize, "text-indigo-600")}
                fill="#1447e6"
            />
        {/if}
        <span class="flex items-center gap-1">
            {item.metadata.name ?? item.key.replace("/", "")}
            {#if item.metadata.isStarred}
                <StarIcon class="h-4 w-4 text-yellow-500" fill="#eab308" />
            {/if}
        </span>
    </button>
{:else if layout === "grid"}
    <div class="flex h-full w-full flex-col items-center gap-2">
        <button
            use:touchAction
            onclick={handleClick}
            ontap={handleClick}
            onlongpress={() => handleLongPress()}
            class="flex h-full w-full flex-col items-center gap-2"
            disabled={getItemStatus() === ItemStatus.UPLOADING}
        >
            {#if !isDesktop.current && indeterminate}
                {#if isSelected}
                    <CircleCheckIcon class="text-primary" />
                {:else}
                    <CircleIcon class="text-muted-foreground" />
                {/if}
            {:else if getItemStatus() === ItemStatus.UPLOADING}
                <div>
                    {#if $uploadingItems[item.key] && !Number.isNaN($uploadingItems[item.key])}
                        <span class="text-xs">
                            {Math.round($uploadingItems[item.key] ?? 0)}%
                        </span>
                    {:else}
                        <XIcon class="h-4 w-4 text-red-600" />
                    {/if}
                </div>
            {:else if item.metadata.category}
                <div class="w-full flex justify-center h-full items-center">
                    <FilePreview {item} />
                </div>
            {:else}
                <div class="w-full flex justify-center h-full items-center">
                    <FileIcon class={iconSize} />
                </div>
            {/if}
            <div class="text-center w-full">
                <p
                    title={item.metadata.name ?? item.key}
                    class={cn(
                        "max-w-72 truncate text-base lg:text-sm inline-flex items-center gap-1 justify-center",
                        $playableMusic &&
                            $playableMusic.title ===
                                (item.metadata.name ?? item.key)
                            ? "text-primary font-medium"
                            : getItemStatus() === ItemStatus.UPLOADING
                              ? "text-gray-500 dark:text-gray-300"
                              : "",
                    )}
                >
                    {item.metadata.name ?? stripFolders(item.key)}
                    {#if item.metadata.isStarred}
                        <StarIcon
                            class="h-4 w-4 text-yellow-500 shrink-0"
                            fill="#eab308"
                        />
                    {/if}
                </p>
            </div>
        </button>
        {#if item.metadata.category || item.parent}
            <div class="text-center">
                <p class="text-xs text-muted-foreground">
                    {#if item.metadata.category}
                        {item.metadata.category.charAt(0) +
                            item.metadata.category.slice(1).toLowerCase()}
                    {/if}
                    {#if item.parent}
                        {#if item.metadata.category}
                            <span class="mx-1">•</span>
                        {/if}
                        <a
                            href="/browse/{item.parentKey || ''}"
                            class="text-muted-foreground/70 hover:text-primary hover:underline"
                            onclick={(e) => e.stopPropagation()}
                        >
                            {item.parent}
                        </a>
                    {/if}
                </p>
            </div>
        {/if}
        {#if item.metadata.category === "MUSIC"}
            {#if item.metadata.music?.duration}
                <Badge
                    variant="outline"
                    class="text-muted-foreground px-1.5 text-xs"
                >
                    {secondsToMinutes(item.metadata.music.duration)}
                </Badge>
            {/if}
        {/if}
    </div>
{:else}
    <button
        use:touchAction
        onclick={handleClick}
        ontap={handleClick}
        onlongpress={() => handleLongPress()}
        class="flex h-full w-full min-w-0 flex-row items-center gap-2"
        disabled={getItemStatus() === ItemStatus.UPLOADING}
    >
        {#if !isDesktop.current && indeterminate}
            {#if isSelected}
                <CircleCheckIcon class="text-primary" />
            {:else}
                <CircleIcon class="text-muted-foreground" />
            {/if}
        {:else if getItemStatus() === ItemStatus.UPLOADING}
            <div>
                {#if $uploadingItems[item.key] && !Number.isNaN($uploadingItems[item.key])}
                    <span class="text-xs">
                        {Math.round($uploadingItems[item.key] ?? 0)}%
                    </span>
                {:else}
                    <XIcon class="h-4 w-4 text-red-600" />
                {/if}
            </div>
        {:else if item.metadata.category}
            <div class="flex h-full items-center justify-start">
                {#if item.metadata.category === "DOCUMENTS"}
                    {@const docType = getDocumentType(
                        item.metadata.contentType,
                    )}
                    {#if docType}
                        <DocumentIcon type={docType} class={iconSize} />
                    {:else}
                        <FileTextIcon class={cn(iconSize, "text-blue-600")} />
                    {/if}
                {:else if item.metadata.category === "MUSIC"}
                    {#if $playableMusic && $playableMusic.title === (item.metadata.name ?? item.key)}
                        {#if $playableMusic.isPlaying}
                            <NowPlaying />
                        {:else}
                            <PauseIcon class={cn(iconSize, "text-pink-400")} />
                        {/if}
                    {:else}
                        <FileMusicIcon class={cn(iconSize, "text-pink-400")} />
                    {/if}
                {:else if item.metadata.category === "IMAGES"}
                    <FileImageIcon class={cn(iconSize, "text-orange-400")} />
                {:else if item.metadata.category === "VIDEO"}
                    <FileVideoCameraIcon
                        class={cn(iconSize, "text-blue-400")}
                    />
                {:else if item.metadata.category === "CODE"}
                    <FileCodeIcon class={cn(iconSize, "text-green-400")} />
                {:else if item.metadata.category === "ARCHIVES"}
                    <FileArchiveIcon class={cn(iconSize, "text-purple-600")} />
                {:else}
                    <FileIcon class={iconSize} />
                {/if}
            </div>
        {:else}
            <FileIcon class={iconSize} />
        {/if}
        <div class="text-start min-w-0 flex-1">
            <p
                title={item.metadata.name ?? item.key}
                class={cn(
                    "truncate text-base lg:text-sm inline-flex items-center gap-1",
                    $playableMusic &&
                        $playableMusic.title ===
                            (item.metadata.name ?? item.key)
                        ? "text-primary font-medium"
                        : getItemStatus() === ItemStatus.UPLOADING
                          ? "text-gray-500 dark:text-gray-300"
                          : "",
                )}
            >
                {item.metadata.name ?? stripFolders(item.key)}
                {#if item.metadata.isStarred}
                    <StarIcon
                        class="h-4 w-4 text-yellow-500 shrink-0"
                        fill="#eab308"
                    />
                {/if}
            </p>
            {#if item.metadata.category || item.parent}
                <p class="text-xs text-muted-foreground">
                    {#if item.metadata.category}
                        {item.metadata.category.charAt(0) +
                            item.metadata.category.slice(1).toLowerCase()}
                    {/if}
                    {#if item.parent}
                        {#if item.metadata.category}
                            <span class="mx-1">•</span>
                        {/if}
                        <a
                            href="/browse/{item.parentKey || ''}"
                            class="text-muted-foreground/70 hover:text-primary hover:underline"
                            onclick={(e) => e.stopPropagation()}
                        >
                            {item.parent}
                        </a>
                    {/if}
                </p>
            {/if}
        </div>
        {#if item.metadata.category === "MUSIC"}
            {#if item.metadata.music?.duration}
                <Badge
                    variant="outline"
                    class="text-muted-foreground px-1.5 text-xs"
                >
                    {secondsToMinutes(item.metadata.music.duration)}
                </Badge>
            {/if}
        {/if}
    </button>
{/if}
