<script lang="ts">
    import { page } from "$app/state";
    import type { ObjectItem } from "$lib/api-client";
    import DocumentIcon from "$lib/components/file/document-icon.svelte";
    import { isCodeItem } from "$lib/file-utils";
    import { getObjectUrl } from "$lib/url";
    import { getFileIconType } from "$lib/utils";
    import {
        FileCodeIcon,
        FileVideoIcon,
        FileAudioIcon,
        FileVideoCameraIcon,
        FileArchiveIcon,
    } from "@lucide/svelte";

    type Props = {
        item: ObjectItem;
    };

    let { item }: Props = $props();

    let objectUrl: string = $state("");
    let thumbnailUrl: string = $state("");

    // Check if this is an image type that supports thumbnails
    const isImage = $derived(
        item.metadata.contentType?.startsWith("image/") &&
            !item.metadata.contentType?.includes("svg"),
    );

    // Check if this is a video type that supports thumbnails
    const isVideo = $derived(item.metadata.contentType?.startsWith("video/"));

    // Check if this is a PDF
    const isPdf = $derived(item.metadata.contentType === "application/pdf");

    const isArchive = $derived(item.metadata.category === "ARCHIVES");

    // Check if this is an audio file
    const isAudio = $derived(item.metadata.contentType?.startsWith("audio/"));

    // Check if this is a document type that should use document icons
    const isDocument = $derived(
        item.metadata.category === "DOCUMENTS" &&
            !isImage &&
            !isVideo &&
            !isPdf &&
            !isAudio,
    );

    // Track thumbnail load errors
    let thumbnailError = $state(false);

    $effect(() => {
        {
            objectUrl = getObjectUrl({
                raw: true,
                itemPath: item.key,
                baseUrl: page.url,
            });

            if (isImage || isVideo || isPdf || isAudio) {
                thumbnailUrl = getObjectUrl({
                    thumbnail: true,
                    size: 300,
                    itemPath: item.key,
                    baseUrl: page.url,
                });
                thumbnailError = false;
            }
        }
    });
</script>

<div class="flex w-full items-center justify-between">
    {#if isPdf}
        {#if thumbnailError}
            <!-- Fallback to embed if thumbnail fails -->
            <embed
                src={objectUrl}
                title={item.metadata.name ?? item.key}
                class="overflow-hidden"
                width="100%"
                height="200px"
            />
        {:else}
            <img
                src={thumbnailUrl}
                alt={item.metadata.name ?? item.key}
                class="mx-auto max-h-50 min-w-50 rounded-xl w-full object-cover"
                loading="lazy"
                onerror={() => (thumbnailError = true)}
            />
        {/if}
    {:else if isArchive}
        <FileArchiveIcon class="mx-auto h-20 w-20 text-muted-foreground" />
    {:else if isDocument}
        <DocumentIcon
            type={getFileIconType(item.metadata.contentType)}
            class="mx-auto h-20 w-20"
        />
    {:else if isCodeItem(item.metadata.name ?? item.key)}
        <FileCodeIcon class="mx-auto h-20 w-20 text-muted-foreground" />
    {:else if isVideo}
        {#if thumbnailError}
            <FileVideoCameraIcon
                class="mx-auto h-20 w-20 text-muted-foreground"
            />
        {:else}
            <img
                src={thumbnailUrl}
                alt={item.metadata.name ?? item.key}
                class="mx-auto max-h-50 min-w-50 rounded-xl w-full object-cover"
                loading="lazy"
                onerror={() => (thumbnailError = true)}
            />
        {/if}
    {:else if isAudio}
        {#if thumbnailError}
            <FileAudioIcon class="mx-auto h-20 w-20 text-muted-foreground" />
        {:else}
            <div class="w-full px-2 py-4 flex items-center justify-center">
                <img
                    src={thumbnailUrl}
                    alt="Waveform for {item.metadata.name ?? item.key}"
                    class="w-full h-auto rounded-lg bg-muted"
                    loading="lazy"
                    onerror={() => (thumbnailError = true)}
                />
            </div>
        {/if}
    {:else if isImage}
        <img
            src={thumbnailUrl}
            alt={item.metadata.name ?? item.key}
            class="mx-auto max-h-50 min-w-50 rounded-xl w-full object-cover"
            loading="lazy"
        />
    {:else}
        <img
            src={objectUrl}
            alt={item.metadata.name ?? item.key}
            class="mx-auto max-h-50 min-w-50 rounded-xl w-full object-cover"
        />
    {/if}
</div>
