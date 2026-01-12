<script lang="ts">
    import { page } from "$app/state";
    import type { ObjectItem } from "$lib/api-client";
    import { isCodeItem } from "$lib/file-utils";
    import { getObjectUrl } from "$lib/url";
    import { FileCodeIcon } from "@lucide/svelte";

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

    $effect(() => {
        {
            objectUrl = getObjectUrl({
                raw: true,
                itemPath: item.key,
                baseUrl: page.url,
            });

            if (isImage) {
                thumbnailUrl = getObjectUrl({
                    thumbnail: true,
                    size: 300,
                    itemPath: item.key,
                    baseUrl: page.url,
                });
            }
        }
    });
</script>

<div class="flex w-full items-center justify-between">
    {#if item.metadata.contentType === "application/pdf"}
        <embed
            src={objectUrl}
            title={item.metadata.name ?? item.key}
            class="overflow-hidden"
            width="100%"
            height="200px"
        />
    {:else if isCodeItem(item.metadata.name ?? item.key)}
        <FileCodeIcon class="mx-auto h-20 w-20 text-muted-foreground" />
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
