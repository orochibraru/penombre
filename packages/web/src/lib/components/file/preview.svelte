<script lang="ts">
    import { page } from "$app/state";
    import type { ObjectItem } from "$lib/api-client";
    import { isCodeItem } from "$lib/file-utils";
    import { getObjectUrl } from "$lib/url";

    type Props = {
        item: ObjectItem;
    };

    let { item }: Props = $props();

    let objectUrl: string = $state("");

    $effect(() => {
        {
            objectUrl = getObjectUrl({
                raw: true,
                itemPath: item.key,
                baseUrl: page.url,
            });
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
        <embed
            src={objectUrl}
            title={item.metadata.name ?? item.key}
            class="overflow-hidden"
            width="100%"
            height="200px"
        />
    {:else}
        <img
            src={objectUrl}
            alt={item.metadata.name ?? item.key}
            class="mx-auto max-h-50 min-w-50 rounded-xl"
        />
    {/if}
</div>
