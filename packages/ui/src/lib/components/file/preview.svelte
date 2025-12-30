<script lang="ts">
    import { page } from "$app/state";
    import type { ObjectItem } from "$lib/api-client";
    import { isCodeItem } from "$lib/file-utils";
    import { getObjectUrl } from "$lib/url";

    type Props = {
        item: ObjectItem;
    };

    let { item }: Props = $props();

    const url = getObjectUrl({
        raw: true,
        itemPath: item.key,
        baseUrl: page.url,
    });
</script>

<div class="flex w-full items-center justify-between">
    {#if item.metadata.contentType === "application/pdf"}
        <embed
            src={url}
            title={item.key}
            class="overflow-hidden"
            width="100%"
            height="200px"
        />
    {:else if isCodeItem(item.key)}
        <embed
            src={url}
            title={item.key}
            class="overflow-hidden"
            width="100%"
            height="200px"
        />
    {:else}
        <img
            src={url}
            alt={item.key}
            class="mx-auto max-h-[200px] min-w-[200px] rounded-xl"
        />
    {/if}
</div>
