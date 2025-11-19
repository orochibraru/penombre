<script lang="ts">
    import {
        CircleCheckIcon,
        CircleIcon,
        FileCodeIcon,
        FileIcon,
        FileImageIcon,
        FileMusicIcon,
        FileTextIcon,
        FileVideoIcon,
        FolderIcon,
        PauseIcon,
        XIcon,
    } from "@lucide/svelte";
    import { MediaQuery } from "svelte/reactivity";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import type { ObjectItem } from "$lib/api";
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
    } from "$lib/utils";

    type Props = {
        item: ObjectItem;
        iconSize: string;
        handleOpenItem: (item: ObjectItem) => void;
        indeterminate: boolean;
        checkedItems: Record<string, boolean>;
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

    function isChecked(): boolean {
        return checkedItems[item.key] || false;
    }

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
        if (isChecked()) {
            checkedItems[item.key] = false;
            return;
        }

        checkedItems[item.key] = true;
        return;
    }

    function handleClick() {
        if (indeterminate) {
            return toggleCheck();
        }

        if (isFolderItem(item)) {
            const folder = item.key.replace("/", "");
            const basePath = page.params.path
                ? [page.params.path, encodeURIComponent(folder)]
                : [encodeURIComponent(folder)];

            goto(
                route("/browse/[...path]", {
                    path: basePath,
                }),
                {
                    invalidateAll: true,
                },
            );
            return;
        }

        return handleOpenItem(item);
    }

    function handleLongPress() {
        return toggleCheck();
    }
</script>

{#if isFolderItem(item)}
    <button
        use:touchAction
        onclick={() => handleClick()}
        ontap={() => handleClick()}
        onlongpress={() => handleLongPress()}
        class="flex w-full items-center gap-2"
    >
        {#if !isDesktop.current && indeterminate}
            {#if isChecked()}
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
        {item.key.replace("/", "")}
    </button>
{:else}
    <button
        use:touchAction
        onclick={() => handleClick()}
        ontap={() => handleClick()}
        onlongpress={() => handleLongPress()}
        class={cn(
            "flex h-full w-full gap-2",
            layout === "grid"
                ? "flex-col items-start"
                : "flex-row items-center",
        )}
        disabled={getItemStatus() === ItemStatus.UPLOADING}
    >
        {#if !isDesktop.current && indeterminate}
            {#if isChecked()}
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
            <div
                class={cn(
                    "flex h-full items-center",
                    layout === "grid"
                        ? "w-full justify-center"
                        : "justify-start",
                )}
            >
                {#if item.metadata.category === "DOCUMENTS"}
                    {#if layout === "grid"}
                        <FilePreview {item} />
                    {:else}
                        <FileTextIcon class={cn(iconSize, "text-red-600")} />
                    {/if}
                {:else if item.metadata.category === "MUSIC"}
                    {#if $playableMusic && $playableMusic.title === item.key}
                        {#if $playableMusic.isPlaying}
                            <NowPlaying />
                        {:else}
                            <PauseIcon class={cn(iconSize, "text-pink-400")} />
                        {/if}
                    {:else}
                        <FileMusicIcon class={cn(iconSize, "text-pink-400")} />
                    {/if}
                {:else if item.metadata.category === "IMAGES"}
                    {#if layout === "grid"}
                        <FilePreview {item} />
                    {:else}
                        <FileImageIcon
                            class={cn(iconSize, "text-orange-400")}
                        />
                    {/if}
                {:else if item.metadata.category === "VIDEO"}
                    {#if layout === "grid"}
                        <FilePreview {item} />
                    {:else}
                        <FileVideoIcon class={cn(iconSize, "text-blue-400")} />
                    {/if}
                {:else if item.metadata.category === "CODE"}
                    {#if layout === "grid"}
                        <FilePreview {item} />
                    {:else}
                        <FileCodeIcon class={cn(iconSize, "text-green-400")} />
                    {/if}
                {:else}
                    <FileIcon class={iconSize} />
                {/if}
            </div>
        {:else}
            <FileIcon class={iconSize} />
        {/if}
        <div class="text-start">
            <p
                title={item.key}
                class={cn(
                    "max-w-72 truncate text-base lg:text-sm",
                    $playableMusic && $playableMusic.title === item.key
                        ? "text-primary font-medium"
                        : getItemStatus() === ItemStatus.UPLOADING
                          ? "text-gray-500 dark:text-gray-300"
                          : "",
                )}
            >
                {#if page.url.pathname.startsWith("/browse")}
                    {item.key}
                {:else}
                    {stripFolders(item.key)}
                {/if}
            </p>
            {#if item.updatedAt}
                <p class="text-xs dark:text-gray-500">
                    Modified {prettyDate(item.updatedAt)}
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
