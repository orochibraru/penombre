<script lang="ts">
	import {
		FileArchiveIcon,
		FileAudioIcon,
		FileCodeIcon,
		FileVideoCameraIcon,
	} from "@lucide/svelte";
	import { page } from "$app/state";
	import type { ObjectItem } from "$lib/api";
	import DocumentIcon from "$lib/components/file/document-icon.svelte";
	import FileTypeIcon from "$lib/components/file-type-icon.svelte";
	import { isCodeItem } from "$lib/file-utils";
	import { getObjectUrl } from "$lib/url";
	import { getFileIconType } from "$lib/utils";

	interface Props {
		item: ObjectItem;
	}

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
		objectUrl = getObjectUrl({
			raw: true,
			itemPath: item.key,
			baseUrl: page.url,
		});

		if (isImage || isVideo || isPdf || isAudio) {
			thumbnailUrl = getObjectUrl({
				thumbnail: true,
				size: "large",
				itemPath: item.key,
				baseUrl: page.url,
			});
			thumbnailError = false;
		}
	});
</script>

<div class="flex size-full items-center justify-center">
    {#if isPdf}
        {#if thumbnailError || !thumbnailUrl}
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
                class="absolute inset-0 size-full object-cover"
                loading="lazy"
                onerror={() => (thumbnailError = true)}
            />
        {/if}
    {:else if isArchive}
        <FileArchiveIcon class="size-10 text-muted-foreground" />
    {:else if isDocument}
        <DocumentIcon
            type={getFileIconType(item.metadata.contentType)}
            class="size-10 text-muted-foreground"
        />
    {:else if isCodeItem(item.metadata.name ?? item.key)}
        <FileCodeIcon class="size-10 text-muted-foreground" />
    {:else if isVideo}
        {#if thumbnailError || !thumbnailUrl}
            <FileVideoCameraIcon
                class="size-10 text-muted-foreground"
            />
        {:else}
            <img
                src={thumbnailUrl}
                alt={item.metadata.name ?? item.key}
                class="absolute inset-0 size-full object-cover"
                loading="lazy"
                onerror={() => (thumbnailError = true)}
            />
        {/if}
    {:else if isAudio}
        {#if thumbnailError || !thumbnailUrl}
            <FileAudioIcon class="size-10 text-muted-foreground" />
        {:else}
            <img
                src={thumbnailUrl}
                alt="Waveform for {item.metadata.name ?? item.key}"
                class="absolute inset-0 size-full object-contain p-2"
                loading="lazy"
                onerror={() => (thumbnailError = true)}
            />
        {/if}
    {:else if isImage && thumbnailUrl && !thumbnailError}
        <img
            src={thumbnailUrl}
            alt={item.metadata.name ?? item.key}
            class="absolute inset-0 size-full object-cover"
            loading="lazy"
            onerror={() => (thumbnailError = true)}
        />
    {:else}
        <!--
          Anything with no preview to show. This used to render the raw file
          in an `<img>`, so a text or unknown type produced a broken image and
          the grid showed bare alt text — an icon is the honest fallback.
        -->
        <FileTypeIcon
            category={item.metadata.category}
            class="text-muted-foreground/60 size-9"
        />
    {/if}
</div>
